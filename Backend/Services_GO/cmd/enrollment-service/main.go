package main

import (
	"log"
	"os"

	"sysocial/internal/shared/config"
	"sysocial/internal/shared/database"
	"sysocial/internal/shared/logger"
	
	"sysocial/internal/enrollment/handler"
	"sysocial/internal/enrollment/repository"
	"sysocial/internal/enrollment/service"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// Porta padrão do serviço caso não esteja no .env
const DEFAULT_PORT = "8084"

func main() {
	// 1. Carregar variáveis de ambiente
	envFiles := []string{"config.env", "../../config.env", "../config.env"}
	for _, file := range envFiles {
		if err := godotenv.Load(file); err == nil {
			log.Printf("Configuração carregada de: %s", file)
			break
		}
	}

	// 2. Configurar logger
	// Utiliza o logger compartilhado do projeto
	logger := logger.New()

	// 3. Carregar configurações
	// O config.Load() lê as variáveis de ambiente e preenche a struct de configuração
	cfg := config.Load()

	// Validação básica de configuração de banco
	if cfg.Database.Host == "" {
		logger.Fatal("Erro: Configuração do banco de dados não encontrada. Verifique o arquivo config.env")
	}

	// 4. Conectar ao banco de dados
	// A função database.Connect deve retornar (*sql.DB, error)
	db, err := database.Connect(cfg.Database)
	if err != nil {
		logger.Fatal("Erro crítico ao conectar com o banco de dados:", err)
	}
	// Fechar a conexão quando a main encerrar (opcional, dependendo de como o servidor roda)
	defer db.Close()

	logger.Info("Conexão com o banco de dados estabelecida com sucesso!")

	// 5. Inicializar Camadas (Injeção de Dependência Manual)
	
	// Repositório: Lida com o SQL e Banco de Dados
	enrollmentRepo := repository.NewEnrollmentRepository(db)

	// Serviço: Lida com Regras de Negócio e Validações
	enrollmentService := service.NewEnrollmentService(enrollmentRepo, logger)

	// Handler: Lida com HTTP (Request/Response)
	enrollmentHandler := handler.NewEnrollmentHandler(enrollmentService)

	// 6. Configurar Servidor Web (Gin)
	router := gin.Default()

	// Middlewares Globais
	router.Use(gin.Logger())   // Loga cada requisição
	router.Use(gin.Recovery()) // Recupera de panics para não derrubar o servidor
	
	// Configuração de CORS
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

	// 7. Definição de Rotas
	v1 := router.Group("/api/v1")
	{
		enrollments := v1.Group("/enrollments")
		{
			// POST /api/v1/enrollments/ -> Cria nova matrícula
			enrollments.POST("/", enrollmentHandler.CreateEnrollment)
			
			// GET /api/v1/enrollments/available-courses?shift=manha -> Busca cursos para o select
			enrollments.GET("/available-courses", enrollmentHandler.GetAvailableCourses)
			
			// GET /api/v1/enrollments/courses -> Rota alternativa ou alias para cursos
			enrollments.GET("/courses", enrollmentHandler.GetAvailableCourses)
		}
	}

	// Health Check (Útil para monitoramento e Kubernetes)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok", 
			"service": "enrollment-service",
		})
	})

	// 8. Iniciar Servidor
	port := os.Getenv("ENROLLMENT_SERVICE_PORT")
	if port == "" {
		port = DEFAULT_PORT
		logger.Infof("Porta não definida no .env, usando padrão: %s", port)
	}

	logger.Infof("Enrollment Service rodando na porta %s", port)
	
	// Roda o servidor e bloqueia a main até que ocorra um erro fatal
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Erro ao iniciar servidor HTTP", err)
	}
}