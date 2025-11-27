package handler

import (
	"net/http"
	"sysocial/internal/enrollment/model"
	"sysocial/internal/enrollment/service"

	"github.com/gin-gonic/gin"
)

type EnrollmentHandler struct {
	service *service.EnrollmentService
}

func NewEnrollmentHandler(service *service.EnrollmentService) *EnrollmentHandler {
	return &EnrollmentHandler{service: service}
}

// GET /api/v1/enrollments/check-cpf?cpf=...
func (h *EnrollmentHandler) CheckCpf(c *gin.Context) {
	cpf := c.Query("cpf")
	
	exists, err := h.service.CheckCpfAvailability(c.Request.Context(), cpf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao verificar CPF", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"exists": exists})
}

// POST /api/v1/enrollments
func (h *EnrollmentHandler) CreateEnrollment(c *gin.Context) {
	var payload model.NewEnrollmentPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido", "details": err.Error()})
		return
	}

	id, err := h.service.CreateEnrollment(c.Request.Context(), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar matrícula", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Matrícula realizada com sucesso",
		"enrollmentId": id,
	})
}

// GET /api/v1/enrollments/courses
func (h *EnrollmentHandler) GetCourseData(c *gin.Context) {
	data, err := h.service.GetCourseData(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GET /api/v1/enrollments/available-courses?shift=manha
func (h *EnrollmentHandler) GetAvailableCourses(c *gin.Context) {
	schoolShift := c.Query("shift") // Lê o query param '?shift='

	if schoolShift == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "O parâmetro 'shift' (turno escolar) é obrigatório"})
		return
	}

	courses, err := h.service.GetAvailableCourses(c.Request.Context(), schoolShift)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar cursos disponíveis", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, courses)
}

// GET /api/v1/enrollments/guardian?cpf=...
func (h *EnrollmentHandler) GetGuardian(c *gin.Context) {
	cpf := c.Query("cpf")
	if cpf == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CPF é obrigatório"})
		return
	}

	guardian, err := h.service.GetGuardianByCPF(c.Request.Context(), cpf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar responsável", "details": err.Error()})
		return
	}

	if guardian == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Responsável não encontrado"})
		return
	}

	response := gin.H{
		"id":            guardian.ID,
		"fullName":      guardian.NomeCompleto,
		"cpf":           guardian.CPF,
		"phone":         guardian.Telefone,
		"relationship":  guardian.Parentesco,
		"messagePhone1": guardian.TelefoneRecado1.String,
		"messagePhone2": guardian.TelefoneRecado2.String,
		"phoneContact":         guardian.ContatoTelefone.String,
		"messagePhone1Contact": guardian.ContatoRecado1.String,
		"messagePhone2Contact": guardian.ContatoRecado2.String,
	}

	c.JSON(http.StatusOK, response)
}