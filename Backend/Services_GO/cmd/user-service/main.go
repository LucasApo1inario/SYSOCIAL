package main

import (
	"log"
	"os"

	"sysocial/internal/shared/config"
	"sysocial/internal/shared/database"
	"sysocial/internal/shared/logger"
	"sysocial/internal/user/handler"
	"sysocial/internal/user/repository"
	"sysocial/internal/user/service"

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
	cfg := config.Load()

	// Conectar ao banco de dados
	db, err := database.Connect(cfg.Database)
	if err != nil {
		logger.Fatal("Erro ao conectar com o banco de dados", err)
	}

	// Inicializar repositórios
	userRepo := repository.NewUserRepository(db)

	// Inicializar serviços
	userService := service.NewUserService(userRepo, logger)

	// Inicializar handlers
	userHandler := handler.NewUserHandler(userService)

	// Configurar roteador
	router := gin.Default()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Rotas
	v1 := router.Group("/api/v1")
	{
		users := v1.Group("/users")
		// Middleware JWT removido - validação feita no API Gateway
		{
			users.POST("/", userHandler.CreateUser)
			users.GET("/all", userHandler.ListAllUsers)
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
			users.GET("/", userHandler.ListUsers)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "user-service"})
	})

	// Iniciar servidor
	port := os.Getenv("USER_SERVICE_PORT")
	if port == "" {
		port = "8081"
	}

	logger.Infof("User Service iniciado na porta %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Erro ao iniciar servidor", err)
	}
}
