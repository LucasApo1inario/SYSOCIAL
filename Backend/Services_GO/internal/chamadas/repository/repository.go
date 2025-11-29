package repository

import (
	"context"
	"database/sql"
	"fmt"
	"sysocial/internal/chamadas/model"
)

type ChamadasRepository struct {
	db *sql.DB
}

func NewChamadasRepository(db *sql.DB) *ChamadasRepository {
	return &ChamadasRepository{db: db}
}

// ========== MÉTODOS PARA CHAMADA ==========

// CreateChamada cria uma nova chamada
func (r *ChamadasRepository) CreateChamada(ctx context.Context, payload model.CreateChamadaPayload) (int, error) {
	query := `
		INSERT INTO chamada (users_id_usuario, turmas_id_turma, data_aula)
		VALUES ($1, $2, $3)
		RETURNING id_chamada`

	var id int
	err := r.db.QueryRowContext(ctx, query,
		payload.UsuarioID,
		payload.TurmaID,
		payload.DataAula,
	).Scan(&id)

	if err != nil {
		return 0, fmt.Errorf("erro ao criar chamada: %w", err)
	}

	return id, nil
}

// GetChamadaByID busca uma chamada por ID
func (r *ChamadasRepository) GetChamadaByID(ctx context.Context, id int) (*model.Chamada, error) {
	query := `
		SELECT id_chamada, users_id_usuario, turmas_id_turma, data_aula
		FROM chamada
		WHERE id_chamada = $1`

	var chamada model.Chamada
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&chamada.ID,
		&chamada.UsuarioID,
		&chamada.TurmaID,
		&chamada.DataAula,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("chamada não encontrada")
		}
		return nil, fmt.Errorf("erro ao buscar chamada: %w", err)
	}

	return &chamada, nil
}

// GetChamadasByTurmaID busca todas as chamadas de uma turma
func (r *ChamadasRepository) GetChamadasByTurmaID(ctx context.Context, turmaID int) ([]model.Chamada, error) {
	query := `
		SELECT id_chamada, users_id_usuario, turmas_id_turma, data_aula
		FROM chamada
		WHERE turmas_id_turma = $1
		ORDER BY data_aula DESC`

	rows, err := r.db.QueryContext(ctx, query, turmaID)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar chamadas: %w", err)
	}
	defer rows.Close()

	var chamadas []model.Chamada
	for rows.Next() {
		var chamada model.Chamada
		err := rows.Scan(
			&chamada.ID,
			&chamada.UsuarioID,
			&chamada.TurmaID,
			&chamada.DataAula,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear chamada: %w", err)
		}
		chamadas = append(chamadas, chamada)
	}

	return chamadas, nil
}

// UpdateChamada atualiza uma chamada
func (r *ChamadasRepository) UpdateChamada(ctx context.Context, id int, payload model.UpdateChamadaPayload) error {
	// Buscar chamada atual
	chamada, err := r.GetChamadaByID(ctx, id)
	if err != nil {
		return err
	}

	// Preparar valores para atualização
	usuarioID := chamada.UsuarioID
	if payload.UsuarioID != nil {
		usuarioID = *payload.UsuarioID
	}

	turmaID := chamada.TurmaID
	if payload.TurmaID != nil {
		turmaID = *payload.TurmaID
	}

	dataAula := chamada.DataAula
	if payload.DataAula != nil {
		dataAula = *payload.DataAula
	}

	query := `
		UPDATE chamada
		SET users_id_usuario = $1, turmas_id_turma = $2, data_aula = $3
		WHERE id_chamada = $4`

	_, err = r.db.ExecContext(ctx, query, usuarioID, turmaID, dataAula, id)
	if err != nil {
		return fmt.Errorf("erro ao atualizar chamada: %w", err)
	}

	return nil
}

// ========== MÉTODOS PARA PRESENÇA ==========

// GetPresencasByChamadaID busca todas as presenças de uma chamada
func (r *ChamadasRepository) GetPresencasByChamadaID(ctx context.Context, chamadaID int) ([]model.Presenca, error) {
	query := `
		SELECT id_presenca, chamada_id_chamada, aluno_id_aluno, presente, observacao
		FROM presenca
		WHERE chamada_id_chamada = $1
		ORDER BY aluno_id_aluno`

	rows, err := r.db.QueryContext(ctx, query, chamadaID)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar presenças: %w", err)
	}
	defer rows.Close()

	var presencas []model.Presenca
	for rows.Next() {
		var presenca model.Presenca
		var observacao sql.NullString

		err := rows.Scan(
			&presenca.ID,
			&presenca.ChamadaID,
			&presenca.AlunoID,
			&presenca.Presente,
			&observacao,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear presença: %w", err)
		}

		if observacao.Valid {
			presenca.Observacao = observacao.String
		}

		presencas = append(presencas, presenca)
	}

	return presencas, nil
}

// CreatePresencas cria múltiplas presenças de uma vez
func (r *ChamadasRepository) CreatePresencas(ctx context.Context, chamadaID int, presencas []model.CreatePresencaPayload) error {
	// Iniciar transação
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("erro ao iniciar transação: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
		} else if err != nil {
			tx.Rollback()
		}
	}()

	query := `
		INSERT INTO presenca (chamada_id_chamada, aluno_id_aluno, presente, observacao)
		VALUES ($1, $2, $3, $4)`

	for _, presenca := range presencas {
		var observacao interface{}
		if presenca.Observacao != "" {
			observacao = presenca.Observacao
		}

		_, err = tx.ExecContext(ctx, query,
			chamadaID,
			presenca.AlunoID,
			presenca.Presente,
			observacao,
		)
		if err != nil {
			return fmt.Errorf("erro ao inserir presença: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("erro ao commitar transação: %w", err)
	}

	return nil
}

// DeletePresencasByChamadaID deleta todas as presenças de uma chamada
func (r *ChamadasRepository) DeletePresencasByChamadaID(ctx context.Context, chamadaID int) error {
	query := `DELETE FROM presenca WHERE chamada_id_chamada = $1`
	_, err := r.db.ExecContext(ctx, query, chamadaID)
	if err != nil {
		return fmt.Errorf("erro ao deletar presenças: %w", err)
	}

	return nil
}

// VerificaTurmaExiste verifica se uma turma existe
func (r *ChamadasRepository) VerificaTurmaExiste(ctx context.Context, turmaID int) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM turma WHERE id_turma = $1`
	err := r.db.QueryRowContext(ctx, query, turmaID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// VerificaAlunoExiste verifica se um aluno existe
func (r *ChamadasRepository) VerificaAlunoExiste(ctx context.Context, alunoID int) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM aluno WHERE id_aluno = $1 AND ativo = true`
	err := r.db.QueryRowContext(ctx, query, alunoID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}




