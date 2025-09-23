package main

import (
	"log"
	"os"

	"sysocial/internal/auth/handler"
	"sysocial/internal/auth/repository"
	"sysocial/internal/auth/service"
	"sysocial/internal/shared/config"
	"sysocial/internal/shared/database"
	"sysocial/internal/shared/logger"

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
	cfg := config.Load()

	// Conectar ao banco de dados
	db, err := database.Connect(cfg.Database)
	if err != nil {
		logger.Fatal("Erro ao conectar com o banco de dados", err)
	}

	// Inicializar repositórios
	authRepo := repository.NewAuthRepository(db)

	// Inicializar serviços
	authService := service.NewAuthService(authRepo, logger)

	// Inicializar handlers
	authHandler := handler.NewAuthHandler(authService, logger)

	// Configurar roteador
	router := gin.Default()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Rotas
	v1 := router.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/validate", authHandler.ValidateToken)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "auth-service"})
	})

	// Iniciar servidor
	port := os.Getenv("AUTH_SERVICE_PORT")
	if port == "" {
		port = "8082"
	}

	logger.Infof("Auth Service iniciado na porta %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Erro ao iniciar servidor", err)
	}
}
