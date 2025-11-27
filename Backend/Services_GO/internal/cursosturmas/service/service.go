package service

import (
	"context"
	"fmt"
	"sysocial/internal/cursosturmas/model"
	"sysocial/internal/cursosturmas/repository"
	"sysocial/internal/shared/logger"
)

type CursosTurmasService struct {
	repo   *repository.CursosTurmasRepository
	logger logger.Logger
}

func NewCursosTurmasService(repo *repository.CursosTurmasRepository, logger logger.Logger) *CursosTurmasService {
	return &CursosTurmasService{repo: repo, logger: logger}
}

// ========== MÉTODOS PARA CURSO ==========

func (s *CursosTurmasService) CreateCurso(ctx context.Context, payload model.CreateCursoPayload) (int, error) {
	if payload.Nome == "" {
		return 0, fmt.Errorf("nome do curso é obrigatório")
	}
	if payload.VagasTotais <= 0 {
		return 0, fmt.Errorf("vagas totais deve ser maior que zero")
	}

	s.logger.Infof("Criando curso: %s", payload.Nome)
	return s.repo.CreateCurso(ctx, payload)
}

func (s *CursosTurmasService) GetCursoByID(ctx context.Context, id int) (*model.Curso, error) {
	return s.repo.GetCursoByID(ctx, id)
}

func (s *CursosTurmasService) GetAllCursos(ctx context.Context) ([]model.Curso, error) {
	return s.repo.GetAllCursos(ctx)
}

func (s *CursosTurmasService) UpdateCurso(ctx context.Context, id int, payload model.UpdateCursoPayload) error {
	if payload.VagasTotais != nil && *payload.VagasTotais <= 0 {
		return fmt.Errorf("vagas totais deve ser maior que zero")
	}
	if payload.VagasRestantes != nil && *payload.VagasRestantes < 0 {
		return fmt.Errorf("vagas restantes não pode ser negativo")
	}

	s.logger.Infof("Atualizando curso ID: %d", id)
	return s.repo.UpdateCurso(ctx, id, payload)
}

func (s *CursosTurmasService) DeleteCurso(ctx context.Context, id int) error {
	s.logger.Infof("Deletando curso ID: %d", id)
	return s.repo.DeleteCurso(ctx, id)
}

// ========== MÉTODOS PARA TURMA ==========

func (s *CursosTurmasService) CreateTurma(ctx context.Context, payload model.CreateTurmaPayload) (int, error) {
	if payload.NomeTurma == "" {
		return 0, fmt.Errorf("nome da turma é obrigatório")
	}
	if payload.DiaSemana == "" {
		return 0, fmt.Errorf("dia da semana é obrigatório")
	}
	if payload.VagasTurma <= 0 {
		return 0, fmt.Errorf("vagas da turma deve ser maior que zero")
	}

	s.logger.Infof("Criando turma: %s para curso ID: %d", payload.NomeTurma, payload.CursoID)
	return s.repo.CreateTurma(ctx, payload)
}

func (s *CursosTurmasService) GetTurmaByID(ctx context.Context, id int) (*model.Turma, error) {
	return s.repo.GetTurmaByID(ctx, id)
}

func (s *CursosTurmasService) GetTurmasByCursoID(ctx context.Context, cursoID int) ([]model.Turma, error) {
	return s.repo.GetTurmasByCursoID(ctx, cursoID)
}

func (s *CursosTurmasService) GetAllTurmas(ctx context.Context) ([]model.Turma, error) {
	return s.repo.GetAllTurmas(ctx)
}

func (s *CursosTurmasService) UpdateTurma(ctx context.Context, id int, payload model.UpdateTurmaPayload) error {
	if payload.VagasTurma != nil && *payload.VagasTurma <= 0 {
		return fmt.Errorf("vagas da turma deve ser maior que zero")
	}

	s.logger.Infof("Atualizando turma ID: %d", id)
	return s.repo.UpdateTurma(ctx, id, payload)
}

func (s *CursosTurmasService) DeleteTurma(ctx context.Context, id int) error {
	s.logger.Infof("Deletando turma ID: %d", id)
	return s.repo.DeleteTurma(ctx, id)
}

// GetCursoComTurmas busca um curso com todas suas turmas
func (s *CursosTurmasService) GetCursoComTurmas(ctx context.Context, cursoID int) (*model.CursoComTurmas, error) {
	return s.repo.GetCursoComTurmas(ctx, cursoID)
}

