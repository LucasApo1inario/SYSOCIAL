package service

import (
	"context"
	"fmt"
	"sysocial/internal/enrollment/model"
	"sysocial/internal/enrollment/repository"
	"sysocial/internal/shared/logger"
)

type EnrollmentService struct {
	repo   *repository.EnrollmentRepository
	logger logger.Logger
}

func NewEnrollmentService(repo *repository.EnrollmentRepository, logger logger.Logger) *EnrollmentService {
	return &EnrollmentService{repo: repo, logger: logger}
}

func (s *EnrollmentService) SearchStudents(ctx context.Context, filter model.StudentFilter) ([]model.StudentSummary, error) {
	return s.repo.SearchStudents(ctx, filter)
}

func (s *EnrollmentService) CheckCpfAvailability(ctx context.Context, cpf string) (bool, error) {
	// Assumindo que o repository faz a limpeza das strings ou recebe o dado bruto.
	return s.repo.CheckCpfExists(ctx, cpf)
}

func (s *EnrollmentService) CancelEnrollment(ctx context.Context, studentID int) error {
	s.logger.Infof("Cancelando (inativando) matrícula do aluno ID: %d", studentID)
	return s.repo.CancelEnrollment(ctx, studentID)
}

func (s *EnrollmentService) GetEnrollmentByID(ctx context.Context, studentID int) (*model.NewEnrollmentPayload, error) {
	return s.repo.GetEnrollmentByID(ctx, studentID)
}

func (s *EnrollmentService) UpdateEnrollment(ctx context.Context, id int, payload model.NewEnrollmentPayload) error {
	// 1. Validações de Negócio (Mesmas do Create)
	if payload.Student.FullName == "" {
		return fmt.Errorf("nome do aluno é obrigatório")
	}
	if payload.Student.CPF == "" {
		return fmt.Errorf("CPF do aluno é obrigatório")
	}

	// Verifica responsável financeiro
	hasPrincipal := false
	for _, g := range payload.Guardians {
		if g.IsPrincipal {
			hasPrincipal = true
			break
		}
	}
	if !hasPrincipal {
		return fmt.Errorf("é obrigatório ter pelo menos um responsável financeiro")
	}
	
	// 2. Log e Chamada ao Repositório
	s.logger.Infof("Atualizando matrícula ID %d: %s", id, payload.Student.FullName)
	return s.repo.UpdateEnrollment(ctx, id, payload)
}

func (s *EnrollmentService) CreateEnrollment(ctx context.Context, payload model.NewEnrollmentPayload) (int, error) {
	// Validações de negócio
	if payload.Student.FullName == "" {
		return 0, fmt.Errorf("nome do aluno é obrigatório")
	}
	if payload.Student.CPF == "" {
		return 0, fmt.Errorf("CPF do aluno é obrigatório")
	}

	// Verifica se existe pelo menos 1 responsável principal
	hasPrincipal := false
	for _, g := range payload.Guardians {
		if g.IsPrincipal {
			hasPrincipal = true
			break
		}
	}
	if !hasPrincipal {
		return 0, fmt.Errorf("é obrigatório ter pelo menos um responsável financeiro")
	}

	s.logger.Infof("Processando matrícula para: %s", payload.Student.FullName)

	id, err := s.repo.CreateEnrollment(ctx, payload)
	if err != nil {
		s.logger.Error("Erro na persistência da matrícula", err)
		return 0, err
	}

	return id, nil
}

func (s *EnrollmentService) GetCourseData(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetInitialCourseData(ctx)
}

// GetAvailableCourses chama o repositório para buscar cursos compatíveis com o turno
func (s *EnrollmentService) GetAvailableCourses(ctx context.Context, schoolShift string) ([]model.CourseOption, error) {
	return s.repo.GetAvailableCourses(ctx, schoolShift)
}

func (s *EnrollmentService) GetGuardianByCPF(ctx context.Context, cpf string) (*model.Guardian, error) {
	return s.repo.GetGuardianByCPF(ctx, cpf)
}