package main

import (
	"log"
	"os"

	"sysocial/internal/cursosturmas/handler"
	"sysocial/internal/cursosturmas/repository"
	"sysocial/internal/cursosturmas/service"
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
	cursosTurmasRepo := repository.NewCursosTurmasRepository(db)

	// Inicializar serviços
	cursosTurmasService := service.NewCursosTurmasService(cursosTurmasRepo, logger)

	// Inicializar handlers
	cursosTurmasHandler := handler.NewCursosTurmasHandler(cursosTurmasService)

	// Configurar roteador
	router := gin.Default()

	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Rotas
	v1 := router.Group("/api/v1")
	{
		// Rotas para Cursos
		cursos := v1.Group("/cursos")
		{
			cursos.POST("/", cursosTurmasHandler.CreateCurso)
			cursos.GET("/", cursosTurmasHandler.GetAllCursos)
			cursos.GET("/:id", cursosTurmasHandler.GetCursoByID)
			cursos.PUT("/:id", cursosTurmasHandler.UpdateCurso)
			cursos.DELETE("/:id", cursosTurmasHandler.DeleteCurso)
			cursos.GET("/:id/turmas", cursosTurmasHandler.GetCursoComTurmas)
		}

		// Rotas para Turmas
		turmas := v1.Group("/turmas")
		{
			turmas.POST("/", cursosTurmasHandler.CreateTurma)
			turmas.GET("/", cursosTurmasHandler.GetAllTurmas)
			turmas.GET("/:id/alunos", cursosTurmasHandler.GetAlunosByTurmaID)
			turmas.GET("/:id", cursosTurmasHandler.GetTurmaByID)
			turmas.PUT("/:id", cursosTurmasHandler.UpdateTurma)
			turmas.DELETE("/:id", cursosTurmasHandler.DeleteTurma)
		}
	}

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "cursosturmas-service"})
	})

	// Iniciar servidor
	port := os.Getenv("CURSOSTURMAS_SERVICE_PORT")
	if port == "" {
		port = "8085"
	}

	logger.Infof("CursosTurmas Service iniciado na porta %s", port)
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Erro ao iniciar servidor", err)
	}
}

