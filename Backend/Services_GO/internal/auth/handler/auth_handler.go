package handler

import (
	"net/http"

	"sysocial/internal/auth/model"
	"sysocial/internal/auth/service"
	"sysocial/internal/shared/logger"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// AuthHandler gerencia as requisições HTTP de autenticação
type AuthHandler struct {
	authService service.AuthService
	logger      logger.Logger
	validator   *validator.Validate
}

// NewAuthHandler cria uma nova instância do AuthHandler
func NewAuthHandler(authService service.AuthService, logger logger.Logger) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		logger:      logger,
		validator:   validator.New(),
	}
}

// Login autentica um usuário
func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos",
		})
		return
	}

	// Validar dados
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos",
		})
		return
	}

	// Autenticar usuário
	response, err := h.authService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Register registra um novo usuário
func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos",
		})
		return
	}

	// Validar dados
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos",
		})
		return
	}

	// Registrar usuário
	response, err := h.authService.Register(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// ValidateToken valida um token JWT
func (h *AuthHandler) ValidateToken(c *gin.Context) {
	var req model.ValidateTokenRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos",
		})
		return
	}

	// Validar dados
	if err := h.validator.Struct(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos",
		})
		return
	}

	// Validar token
	tokenInfo, err := h.authService.ValidateToken(req.Token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Erro interno do servidor",
		})
		return
	}

	c.JSON(http.StatusOK, tokenInfo)
}
