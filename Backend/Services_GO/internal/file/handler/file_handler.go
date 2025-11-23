package handler

import (
	"net/http"
	"strconv"

	"sysocial/internal/file/model"
	"sysocial/internal/file/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// FileHandler gerencia as requisições HTTP para arquivos
type FileHandler struct {
	fileService service.FileService
	validator   *validator.Validate
}

// NewFileHandler cria uma nova instância do handler
func NewFileHandler(fileService service.FileService) *FileHandler {
	return &FileHandler{
		fileService: fileService,
		validator:   validator.New(),
	}
}

// UploadFile faz upload de um arquivo
func (h *FileHandler) UploadFile(c *gin.Context) {
	var req model.UploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos", "details": err.Error()})
		return
	}

	// Validar dados
	if err := h.validator.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de validação inválidos", "details": err.Error()})
		return
	}

	anexo, err := h.fileService.UploadFile(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Arquivo enviado com sucesso",
		"data":    anexo,
	})
}

// DownloadFile recupera um arquivo
func (h *FileHandler) DownloadFile(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	anexo, err := h.fileService.DownloadFile(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    anexo,
	})
}


