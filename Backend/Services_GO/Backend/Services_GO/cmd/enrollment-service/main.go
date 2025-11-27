package main

import (
	"log"
	"os"

	"sysocial/internal/enrollment/handler"
	"sysocial/internal/enrollment/repository"
	"sysocial/internal/enrollment/service"
	"sysocial/internal/shared/config"
	"sysocial/internal/shared/database"
	"sysocial/internal/shared/logger"

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
	enrollmentRepo := repository.NewEnrollmentRepository(db)

	// Inicializar serviços
	enrollmentService := service.NewEnrollmentService(enrollmentRepo, logger)

	// Inicializar handlers
	enrollmentHandler := handler.NewEnrollmentHandler(enrollmentService)

	// Configurar roteador
	router := gin.Default()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Rotas
	v1 := router.Group("/api/v1")
	{
		enrollments := v1.Group("/enrollments")
		{
			enrollments.POST("/", enrollmentHandler.CreateEnrollment)
			enrollments.GET("/available-courses", enrollmentHandler.GetAvailableCourses)
			enrollments.GET("/courses", enrollmentHandler.GetAvailableCourses)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "enrollment-service"})
	})

	// Iniciar servidor
	port := os.Getenv("ENROLLMENT_SERVICE_PORT")
	if port == "" {
		port = "8084"
	}

	logger.Infof("Enrollment Service iniciado na porta %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Erro ao iniciar servidor", err)
	}
}
