package main

import (
	"log"
	"os"

	"sysocial/internal/chamadas/handler"
	"sysocial/internal/chamadas/repository"
	"sysocial/internal/chamadas/service"
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
	chamadasRepo := repository.NewChamadasRepository(db)

	// Inicializar serviços
	chamadasService := service.NewChamadasService(chamadasRepo, logger)

	// Inicializar handlers
	chamadasHandler := handler.NewChamadasHandler(chamadasService)

	// Configurar roteador
	router := gin.Default()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Rotas
	v1 := router.Group("/api/v1")
	{
		// Rotas para Chamadas
		chamadas := v1.Group("/chamadas")
		{
			chamadas.POST("/", chamadasHandler.CreateChamada)
			chamadas.GET("/turma/:turmaId", chamadasHandler.GetChamadasByTurmaID)
			chamadas.PUT("/:id", chamadasHandler.UpdateChamada)
		}

		// Rotas para Presenças
		presencas := v1.Group("/presencas")
		{
			presencas.GET("/chamada/:chamadaId", chamadasHandler.GetPresencasByChamadaID)
			presencas.POST("/", chamadasHandler.CreatePresencas)
			presencas.DELETE("/chamada/:chamadaId", chamadasHandler.DeletePresencasByChamadaID)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "chamadas-service"})
	})

	// Iniciar servidor
	port := os.Getenv("CHAMADAS_SERVICE_PORT")
	if port == "" {
		port = "8086"
	}

	logger.Infof("Chamadas Service iniciado na porta %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Erro ao iniciar servidor", err)
	}
}




