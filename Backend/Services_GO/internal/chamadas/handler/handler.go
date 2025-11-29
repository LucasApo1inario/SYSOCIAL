package handler

import (
	"net/http"
	"strconv"
	"sysocial/internal/chamadas/model"
	"sysocial/internal/chamadas/service"

	"github.com/gin-gonic/gin"
)

type ChamadasHandler struct {
	service *service.ChamadasService
}

func NewChamadasHandler(service *service.ChamadasService) *ChamadasHandler {
	return &ChamadasHandler{service: service}
}

// ========== HANDLERS PARA CHAMADA ==========

// CreateChamada POST /api/v1/chamadas
func (h *ChamadasHandler) CreateChamada(c *gin.Context) {
	var payload model.CreateChamadaPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido", "details": err.Error()})
		return
	}

	id, err := h.service.CreateChamada(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar chamada", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Chamada criada com sucesso",
		"id":      id,
	})
}

// GetChamadasByTurmaID GET /api/v1/chamadas/turma/:turmaId
func (h *ChamadasHandler) GetChamadasByTurmaID(c *gin.Context) {
	turmaIDStr := c.Param("turmaId")
	turmaID, err := strconv.Atoi(turmaIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da turma inválido"})
		return
	}

	chamadas, err := h.service.GetChamadasByTurmaID(c.Request.Context(), turmaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar chamadas", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, chamadas)
}

// UpdateChamada PUT /api/v1/chamadas/:id
func (h *ChamadasHandler) UpdateChamada(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var payload model.UpdateChamadaPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido", "details": err.Error()})
		return
	}

	err = h.service.UpdateChamada(c.Request.Context(), id, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar chamada", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chamada atualizada com sucesso"})
}

// ========== HANDLERS PARA PRESENÇA ==========

// GetPresencasByChamadaID GET /api/v1/presencas/chamada/:chamadaId
func (h *ChamadasHandler) GetPresencasByChamadaID(c *gin.Context) {
	chamadaIDStr := c.Param("chamadaId")
	chamadaID, err := strconv.Atoi(chamadaIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da chamada inválido"})
		return
	}

	presencas, err := h.service.GetPresencasByChamadaID(c.Request.Context(), chamadaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar presenças", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, presencas)
}

// CreatePresencas POST /api/v1/presencas
func (h *ChamadasHandler) CreatePresencas(c *gin.Context) {
	var payload model.CreatePresencasPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido", "details": err.Error()})
		return
	}

	if len(payload.Presencas) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lista de presenças não pode estar vazia"})
		return
	}

	err := h.service.CreatePresencas(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar presenças", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Presenças criadas com sucesso",
		"quantidade": len(payload.Presencas),
	})
}

// DeletePresencasByChamadaID DELETE /api/v1/presencas/chamada/:chamadaId
func (h *ChamadasHandler) DeletePresencasByChamadaID(c *gin.Context) {
	chamadaIDStr := c.Param("chamadaId")
	chamadaID, err := strconv.Atoi(chamadaIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID da chamada inválido"})
		return
	}

	err = h.service.DeletePresencasByChamadaID(c.Request.Context(), chamadaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar presenças", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Presenças deletadas com sucesso"})
}




