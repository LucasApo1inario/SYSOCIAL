package main

import (
	"log"
	"os"
	"time"

	"sysocial/internal/shared/logger"
	"sysocial/internal/shared/middleware"
	"sysocial/internal/shared/proxy"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Carregar variáveis de ambiente
	if err := godotenv.Load(); err != nil {
		log.Printf("Aviso: Arquivo .env não encontrado: %v", err)
	}

	// Configurar logger
	logger := logger.New()

	// Carregar configurações
	//cfg := config.Load()

	// Configurar roteador
	router := gin.Default()

	// Middleware global
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())
	router.Use(middleware.RequestID())
	router.Use(middleware.ErrorHandler())
	router.Use(gin.Recovery())

	// Inicializar proxy manager
	proxyManager := proxy.NewProxyManager()

	// Registrar serviços
	proxyManager.RegisterService("user-service", &proxy.ServiceConfig{
		Name:    "user-service",
		BaseURL: "http://localhost:8081",
		Health:  "/health",
		Timeout: 30 * time.Second,
	})

	proxyManager.RegisterService("auth-service", &proxy.ServiceConfig{
		Name:    "auth-service",
		BaseURL: "http://localhost:8082",
		Health:  "/health",
		Timeout: 30 * time.Second,
	})

	// Rotas do API Gateway
	v1 := router.Group("/api/v1")
	{
		// Proxy para user-service
		users := v1.Group("/users")
		{
			users.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("user-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para user-service", err)
				}
			})
		}

		// Proxy para auth-service
		auth := v1.Group("/auth")
		{
			auth.Any("/*path", func(c *gin.Context) {
				if err := proxyManager.ProxyRequest("auth-service", c.Writer, c.Request); err != nil {
					logger.Error("Erro no proxy para auth-service", err)
				}
			})
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		// Verificar saúde dos serviços
		userHealth, _ := proxyManager.HealthCheck("user-service")
		authHealth, _ := proxyManager.HealthCheck("auth-service")

		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "api-gateway",
			"services": gin.H{
				"user-service": userHealth,
				"auth-service": authHealth,
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
