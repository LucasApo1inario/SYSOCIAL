package handler

import (
	"net/http"
	"strconv"
	"sysocial/internal/cursosturmas/model"
	"sysocial/internal/cursosturmas/service"

	"github.com/gin-gonic/gin"
)

type CursosTurmasHandler struct {
	service *service.CursosTurmasService
}

func NewCursosTurmasHandler(service *service.CursosTurmasService) *CursosTurmasHandler {
	return &CursosTurmasHandler{service: service}
}

// ========== HANDLERS PARA CURSO ==========

// CreateCurso POST /api/v1/cursos
func (h *CursosTurmasHandler) CreateCurso(c *gin.Context) {
	var payload model.CreateCursoPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido", "details": err.Error()})
		return
	}

	id, err := h.service.CreateCurso(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar curso", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Curso criado com sucesso",
		"id":      id,
	})
}

// GetCursoByID GET /api/v1/cursos/:id
func (h *CursosTurmasHandler) GetCursoByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	curso, err := h.service.GetCursoByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curso não encontrado", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, curso)
}

// GetAllCursos GET /api/v1/cursos
func (h *CursosTurmasHandler) GetAllCursos(c *gin.Context) {
	cursos, err := h.service.GetAllCursos(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar cursos", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cursos)
}

// UpdateCurso PUT /api/v1/cursos/:id
func (h *CursosTurmasHandler) UpdateCurso(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var payload model.UpdateCursoPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido", "details": err.Error()})
		return
	}

	err = h.service.UpdateCurso(c.Request.Context(), id, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar curso", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Curso atualizado com sucesso"})
}

// DeleteCurso DELETE /api/v1/cursos/:id
func (h *CursosTurmasHandler) DeleteCurso(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	err = h.service.DeleteCurso(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar curso", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Curso deletado com sucesso"})
}

// GetCursoComTurmas GET /api/v1/cursos/:id/turmas
func (h *CursosTurmasHandler) GetCursoComTurmas(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	result, err := h.service.GetCursoComTurmas(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curso não encontrado", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ========== HANDLERS PARA TURMA ==========

// CreateTurma POST /api/v1/turmas
func (h *CursosTurmasHandler) CreateTurma(c *gin.Context) {
	var payload model.CreateTurmaPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido", "details": err.Error()})
		return
	}

	id, err := h.service.CreateTurma(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar turma", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Turma criada com sucesso",
		"id":      id,
	})
}

// GetTurmaByID GET /api/v1/turmas/:id
func (h *CursosTurmasHandler) GetTurmaByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	turma, err := h.service.GetTurmaByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Turma não encontrada", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, turma)
}

// GetTurmasByCursoID GET /api/v1/cursos/:cursoId/turmas
func (h *CursosTurmasHandler) GetTurmasByCursoID(c *gin.Context) {
	cursoIDStr := c.Param("cursoId")
	cursoID, err := strconv.Atoi(cursoIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do curso inválido"})
		return
	}

	turmas, err := h.service.GetTurmasByCursoID(c.Request.Context(), cursoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar turmas", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, turmas)
}

// GetAllTurmas GET /api/v1/turmas
func (h *CursosTurmasHandler) GetAllTurmas(c *gin.Context) {
	turmas, err := h.service.GetAllTurmas(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar turmas", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, turmas)
}

// UpdateTurma PUT /api/v1/turmas/:id
func (h *CursosTurmasHandler) UpdateTurma(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var payload model.UpdateTurmaPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido", "details": err.Error()})
		return
	}

	err = h.service.UpdateTurma(c.Request.Context(), id, payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar turma", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Turma atualizada com sucesso"})
}

// DeleteTurma DELETE /api/v1/turmas/:id
func (h *CursosTurmasHandler) DeleteTurma(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	err = h.service.DeleteTurma(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar turma", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Turma deletada com sucesso"})
}

