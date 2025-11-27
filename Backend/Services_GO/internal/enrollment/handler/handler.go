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
