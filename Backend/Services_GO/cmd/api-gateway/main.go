package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"sysocial/internal/shared/logger"
	"sysocial/internal/shared/middleware"
	"sysocial/internal/shared/proxy"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Carregar variáveis de ambiente
	if err := godotenv.Load("../../config.env"); err != nil {
		log.Printf("Aviso: Arquivo config.env não encontrado: %v", err)
	}

	// Configurar logger
	logger := logger.New()

	// Carregar configurações
	//cfg := config.Load()

	// Configurar roteador
	router := gin.Default()

	// Middleware global
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())
	router.Use(middleware.RequestID())
	router.Use(middleware.ErrorHandler())
	router.Use(gin.Recovery())

	// Inicializar proxy manager
	proxyManager := proxy.NewProxyManager()

	// Configurar URLs dos serviços (Docker vs Local)
	userServiceURL := os.Getenv("USER_SERVICE_URL")
	if userServiceURL == "" {
		userServiceURL = "http://user-service:8081" // Docker
	}

	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	if authServiceURL == "" {
		authServiceURL = "http://auth-service:8082" // Docker
	}

	fileServiceURL := os.Getenv("FILE_SERVICE_URL")
	if fileServiceURL == "" {
		fileServiceURL = "http://file-service:8083" // Docker
	}

	enrollmentServiceURL := os.Getenv("ENROLLMENT_SERVICE_URL")
	if enrollmentServiceURL == "" {
		enrollmentServiceURL = "http://enrollment-service:8084" // Docker
	}

	cursosturmasServiceURL := os.Getenv("CURSOSTURMAS_SERVICE_URL")
	if cursosturmasServiceURL == "" {
		cursosturmasServiceURL = "http://cursosturmas-service:8085" // Docker
	}

	chamadasServiceURL := os.Getenv("CHAMADAS_SERVICE_URL")
	if chamadasServiceURL == "" {
		chamadasServiceURL = "http://chamadas-service:8086" // Docker
	}

	// Registrar serviços
	proxyManager.RegisterService("user-service", &proxy.ServiceConfig{
		Name:    "user-service",
		BaseURL: userServiceURL,
		Health:  "/health",
		Timeout: 30 * time.Second,
	})

	proxyManager.RegisterService("auth-service", &proxy.ServiceConfig{
		Name:    "auth-service",
		BaseURL: authServiceURL,
		Health:  "/health",
		Timeout: 30 * time.Second,
	})

	proxyManager.RegisterService("file-service", &proxy.ServiceConfig{
		Name:    "file-service",
		BaseURL: fileServiceURL,
		Health:  "/health",
		Timeout: 30 * time.Second,
	})

	proxyManager.RegisterService("enrollment-service", &proxy.ServiceConfig{
		Name:    "enrollment-service",
		BaseURL: enrollmentServiceURL,
		Health:  "/health",
		Timeout: 30 * time.Second,
	})

	proxyManager.RegisterService("cursosturmas-service", &proxy.ServiceConfig{
		Name:    "cursosturmas-service",
		BaseURL: cursosturmasServiceURL,
		Health:  "/health",
		Timeout: 30 * time.Second,
	})

	proxyManager.RegisterService("chamadas-service", &proxy.ServiceConfig{
		Name:    "chamadas-service",
		BaseURL: chamadasServiceURL,
		Health:  "/health",
		Timeout: 30 * time.Second,
	})

	// Rotas do API Gateway
	v1 := router.Group("/api/v1")
	{
		// Proxy para user-service (protegido por JWT)
		users := v1.Group("/users")
		users.Use(middleware.Auth()) // Aplicar middleware JWT
		{
			users.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("user-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para user-service", err)
				}
			})
		}

		// Proxy para auth-service (rotas públicas)
		auth := v1.Group("/auth")
		{
			auth.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("auth-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para auth-service", err)
				}
			})
		}

		// Proxy para file-service (protegido por JWT)
		files := v1.Group("/files")
		files.Use(middleware.Auth()) // Aplicar middleware JWT
		{
			files.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("file-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para file-service", err)
				}
			})
		}

		// Proxy para enrollment-service (rotas públicas - matrículas)
		enrollments := v1.Group("/enrollments")
		enrollments.Use(middleware.Auth()) // Aplicar middleware JWT
		{
			enrollments.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("enrollment-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para enrollment-service", err)
				}
			})
		}

		// Proxy para cursosturmas-service (rotas públicas - cursos e turmas)
		cursos := v1.Group("/cursos")
		cursos.Use(middleware.Auth()) // Aplicar middleware JWT
		{
			cursos.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("cursosturmas-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para cursosturmas-service", err)
				}
			})
		}

		turmas := v1.Group("/turmas")
		turmas.Use(middleware.Auth()) // Aplicar middleware JWT
		{
			turmas.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("cursosturmas-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para cursosturmas-service", err)
				}
			})
		}

		// Proxy para chamadas-service (rotas públicas - chamadas e presenças)
		chamadas := v1.Group("/chamadas")
		chamadas.Use(middleware.Auth()) // Aplicar middleware JWT para obter user_id
		{
			chamadas.Any("/*path", func(c *gin.Context) {
				// Obter user_id do contexto JWT
				userID, exists := c.Get("user_id")
				if !exists {
					c.JSON(401, gin.H{"error": "Usuário não autenticado"})
					return
				}

				// Modificar a URL para incluir userId como primeiro path param
				originalPath := c.Request.URL.Path
				// Remover /api/v1/chamadas do início
				pathWithoutPrefix := strings.TrimPrefix(originalPath, "/api/v1/chamadas")
				// Garantir que o path comece com /
				if !strings.HasPrefix(pathWithoutPrefix, "/") {
					pathWithoutPrefix = "/" + pathWithoutPrefix
				}
				// Adicionar userId no início: /api/v1/chamadas/{userId}/...
				newPath := fmt.Sprintf("/api/v1/chamadas/%v%s", userID, pathWithoutPrefix)
				
				// Criar uma cópia da requisição com a nova URL
				c.Request.URL.Path = newPath
				
				if err := proxyManager.ProxyRequest("chamadas-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para chamadas-service", err)
				}
			})
		}

		presencas := v1.Group("/presencas")
		{
			presencas.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("chamadas-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para chamadas-service", err)
				}
			})
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		// Verificar saúde dos serviços
		userHealth, _ := proxyManager.HealthCheck("user-service")
		authHealth, _ := proxyManager.HealthCheck("auth-service")
		fileHealth, _ := proxyManager.HealthCheck("file-service")
		enrollmentHealth, _ := proxyManager.HealthCheck("enrollment-service")
		cursosturmasHealth, _ := proxyManager.HealthCheck("cursosturmas-service")
		chamadasHealth, _ := proxyManager.HealthCheck("chamadas-service")

		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "api-gateway",
			"services": gin.H{
				"user-service":         userHealth,
				"auth-service":         authHealth,
				"file-service":         fileHealth,
				"enrollment-service":   enrollmentHealth,
				"cursosturmas-service": cursosturmasHealth,
				"chamadas-service":     chamadasHealth,
			},
		})
	})

	// Endpoint para listar serviços
	router.GET("/services", func(c *gin.Context) {
		services := proxyManager.GetAllServices()
		c.JSON(200, gin.H{
			"services": services,
		})
	})

	// Iniciar servidor
	port := os.Getenv("GATEWAY_PORT")
	if port == "" {
		port = "8080"
	}

	logger.Infof("API Gateway iniciado na porta %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Erro ao iniciar servidor", err)
	}
}
