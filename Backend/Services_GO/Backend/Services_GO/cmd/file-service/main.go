package main

import (
	"log"
	"os"

	"sysocial/internal/file/handler"
	"sysocial/internal/file/repository"
	"sysocial/internal/file/service"
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
	fileRepo := repository.NewFileRepository(db)

	// Inicializar serviços
	fileService := service.NewFileService(fileRepo, logger)

	// Inicializar handlers
	fileHandler := handler.NewFileHandler(fileService)

	// Configurar roteador
	router := gin.Default()

	// --- MIDDLEWARE (Logger, Recovery e CORS) ---
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORREÇÃO: Adicionado configuração de CORS manualmente
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Rotas
	v1 := router.Group("/api/v1")
	{
		files := v1.Group("/files")
		// Middleware JWT removido - validação feita no API Gateway
		{
			files.POST("/", fileHandler.UploadFile)
			files.GET("/:id", fileHandler.DownloadFile)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "file-service"})
	})

	// Iniciar servidor
	port := os.Getenv("FILE_SERVICE_PORT")
	if port == "" {
		port = "8083"
	}

	logger.Infof("File Service iniciado na porta %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Erro ao iniciar servidor", err)
	}
}