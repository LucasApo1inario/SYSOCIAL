package service

import (
	"context"
	"fmt"
	"sysocial/internal/chamadas/model"
	"sysocial/internal/chamadas/repository"
	"sysocial/internal/shared/logger"
)

type ChamadasService struct {
	repo   *repository.ChamadasRepository
	logger logger.Logger
}

func NewChamadasService(repo *repository.ChamadasRepository, logger logger.Logger) *ChamadasService {
	return &ChamadasService{repo: repo, logger: logger}
}

// ========== MÉTODOS PARA CHAMADA ==========

func (s *ChamadasService) CreateChamada(ctx context.Context, payload model.CreateChamadaPayload) (int, error) {
	// 1. Validar se turma existe
	existe, err := s.repo.VerificaTurmaExiste(ctx, payload.TurmaID)
	if err != nil {
		return 0, fmt.Errorf("erro ao verificar turma: %w", err)
	}
	if !existe {
		return 0, fmt.Errorf("turma não encontrada")
	}

	if payload.DataAula == "" {
		return 0, fmt.Errorf("data da aula é obrigatória")
	}

	// 2. Validar se a data está dentro do período letivo da turma
	dataValida, err := s.repo.CheckTurmaDateRange(ctx, payload.TurmaID, payload.DataAula)
	if err != nil {
		return 0, fmt.Errorf("erro ao validar data da turma: %w", err)
	}
	if !dataValida {
		return 0, fmt.Errorf("data da aula está fora do período letivo da turma")
	}

	s.logger.Infof("Criando chamada para turma ID: %d, data: %s", payload.TurmaID, payload.DataAula)
	return s.repo.CreateChamada(ctx, payload)
}

func (s *ChamadasService) GetChamadasByTurmaID(ctx context.Context, turmaID int) ([]model.Chamada, error) {
	return s.repo.GetChamadasByTurmaID(ctx, turmaID)
}

func (s *ChamadasService) UpdateChamada(ctx context.Context, id int, payload model.UpdateChamadaPayload) error {
	// Se turmaID está sendo atualizado, verificar se existe
	if payload.TurmaID != nil {
		existe, err := s.repo.VerificaTurmaExiste(ctx, *payload.TurmaID)
		if err != nil {
			return fmt.Errorf("erro ao verificar turma: %w", err)
		}
		if !existe {
			return fmt.Errorf("turma não encontrada")
		}
	}

	if payload.TurmaID != nil && payload.DataAula != nil {
		dataValida, err := s.repo.CheckTurmaDateRange(ctx, *payload.TurmaID, *payload.DataAula)
		if err != nil || !dataValida {
			return fmt.Errorf("data da aula está fora do período letivo da turma")
		}
	}

	s.logger.Infof("Atualizando chamada ID: %d", id)
	return s.repo.UpdateChamada(ctx, id, payload)
}

// ========== MÉTODOS PARA PRESENÇA ==========

func (s *ChamadasService) GetPresencasByChamadaID(ctx context.Context, chamadaID int) ([]model.Presenca, error) {
	// Verificar se chamada existe
	_, err := s.repo.GetChamadaByID(ctx, chamadaID)
	if err != nil {
		return nil, fmt.Errorf("chamada não encontrada: %w", err)
	}

	return s.repo.GetPresencasByChamadaID(ctx, chamadaID)
}

func (s *ChamadasService) CreatePresencas(ctx context.Context, payload model.CreatePresencasPayload) error {
	// Verificar se chamada existe
	_, err := s.repo.GetChamadaByID(ctx, payload.ChamadaID)
	if err != nil {
		return fmt.Errorf("chamada não encontrada: %w", err)
	}

	// Validar se todos os alunos existem
	for _, presenca := range payload.Presencas {
		existe, err := s.repo.VerificaAlunoExiste(ctx, presenca.AlunoID)
		if err != nil {
			return fmt.Errorf("erro ao verificar aluno %d: %w", presenca.AlunoID, err)
		}
		if !existe {
			return fmt.Errorf("aluno %d não encontrado ou inativo", presenca.AlunoID)
		}
	}

	s.logger.Infof("Criando %d presenças para chamada ID: %d", len(payload.Presencas), payload.ChamadaID)
	return s.repo.CreatePresencas(ctx, payload.ChamadaID, payload.Presencas)
}

func (s *ChamadasService) DeletePresencasByChamadaID(ctx context.Context, chamadaID int) error {
	// Verificar se chamada existe
	_, err := s.repo.GetChamadaByID(ctx, chamadaID)
	if err != nil {
		return fmt.Errorf("chamada não encontrada: %w", err)
	}

	s.logger.Infof("Deletando presenças da chamada ID: %d", chamadaID)
	return s.repo.DeletePresencasByChamadaID(ctx, chamadaID)
}