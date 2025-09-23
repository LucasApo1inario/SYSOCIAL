package middleware

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger middleware para logging de requisições
func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format("02/Jan/2006:15:04:05 -0700"),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

// CORS middleware para Cross-Origin Resource Sharing
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Lista de origens permitidas
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
		}

		// Verificar se a origem está permitida
		allowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				allowed = true
				break
			}
		}

		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// RateLimit middleware para rate limiting
func RateLimit(requestsPerMinute int) gin.HandlerFunc {
	// Mapa simples para armazenar contadores por IP
	// Em produção, use Redis ou outro sistema distribuído
	requestCounts := make(map[string][]time.Time)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		now := time.Now()

		// Limpar requisições antigas (mais de 1 minuto)
		if times, exists := requestCounts[clientIP]; exists {
			var validTimes []time.Time
			for _, t := range times {
				if now.Sub(t) < time.Minute {
					validTimes = append(validTimes, t)
				}
			}
			requestCounts[clientIP] = validTimes
		}

		// Verificar limite
		if len(requestCounts[clientIP]) >= requestsPerMinute {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit exceeded",
				"retry_after": 60,
			})
			c.Abort()
			return
		}

		// Adicionar requisição atual
		requestCounts[clientIP] = append(requestCounts[clientIP], now)

		c.Next()
	}
}

// Auth middleware para autenticação JWT
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Verificar se é uma rota pública
		publicRoutes := []string{
			"/health",
			"/api/v1/auth/login",
			"/api/v1/auth/register",
		}

		path := c.Request.URL.Path
		for _, route := range publicRoutes {
			if strings.HasPrefix(path, route) {
				c.Next()
				return
			}
		}

		// Extrair token do header Authorization
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}

		// Verificar formato "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := parts[1]

		// TODO: Validar token JWT
		// Por enquanto, apenas verificar se não está vazio
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Token is required",
			})
			c.Abort()
			return
		}

		// Adicionar informações do usuário ao contexto
		// TODO: Extrair informações do token JWT
		c.Set("user_id", "1")         // Placeholder
		c.Set("username", "testuser") // Placeholder

		c.Next()
	}
}

// RequestID middleware para adicionar ID único às requisições
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
		}

		c.Header("X-Request-ID", requestID)
		c.Set("request_id", requestID)

		c.Next()
	}
}

// generateRequestID gera um ID único para a requisição
func generateRequestID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// ErrorHandler middleware para tratamento de erros
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Verificar se há erros
		if len(c.Errors) > 0 {
			err := c.Errors.Last()

			// Log do erro
			log.Printf("Error: %v", err.Error())

			// Resposta padronizada
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":      "Internal server error",
				"request_id": c.GetString("request_id"),
			})
		}
	}
}
