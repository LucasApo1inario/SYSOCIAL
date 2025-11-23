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
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		// Verificar saúde dos serviços
		userHealth, _ := proxyManager.HealthCheck("user-service")
		authHealth, _ := proxyManager.HealthCheck("auth-service")
		fileHealth, _ := proxyManager.HealthCheck("file-service")

		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "api-gateway",
			"services": gin.H{
				"user-service": userHealth,
				"auth-service": authHealth,
				"file-service": fileHealth,
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
