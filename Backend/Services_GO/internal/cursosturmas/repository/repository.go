package repository

import (
	"context"
	"database/sql"
	"fmt"
	"sysocial/internal/cursosturmas/model"
)

type CursosTurmasRepository struct {
	db *sql.DB
}

func NewCursosTurmasRepository(db *sql.DB) *CursosTurmasRepository {
	return &CursosTurmasRepository{db: db}
}

// ========== MÉTODOS PARA CURSO ==========

// CreateCurso cria um novo curso
func (r *CursosTurmasRepository) CreateCurso(ctx context.Context, payload model.CreateCursoPayload) (int, error) {
	ativo := payload.Ativo
	if !payload.Ativo {
		ativo = true // Default true
	}

	query := `
		INSERT INTO curso (nome, vagas_totais, ativo, vagas_restantes)
		VALUES ($1, $2, $3, $4)
		RETURNING id_curso`

	var id int
	err := r.db.QueryRowContext(ctx, query,
		payload.Nome,
		payload.VagasTotais,
		ativo,
		payload.VagasTotais, // vagas_restantes inicia igual a vagas_totais
	).Scan(&id)

	if err != nil {
		return 0, fmt.Errorf("erro ao criar curso: %w", err)
	}

	return id, nil
}

// GetCursoByID busca um curso por ID
func (r *CursosTurmasRepository) GetCursoByID(ctx context.Context, id int) (*model.Curso, error) {
	query := `
		SELECT id_curso, nome, vagas_totais, ativo, vagas_restantes
		FROM curso
		WHERE id_curso = $1`

	var curso model.Curso
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&curso.ID,
		&curso.Nome,
		&curso.VagasTotais,
		&curso.Ativo,
		&curso.VagasRestantes,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("curso não encontrado")
		}
		return nil, fmt.Errorf("erro ao buscar curso: %w", err)
	}

	return &curso, nil
}

// GetAllCursos lista todos os cursos
func (r *CursosTurmasRepository) GetAllCursos(ctx context.Context) ([]model.Curso, error) {
	query := `
		SELECT id_curso, nome, vagas_totais, ativo, vagas_restantes
		FROM curso
		ORDER BY nome`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar cursos: %w", err)
	}
	defer rows.Close()

	var cursos []model.Curso
	for rows.Next() {
		var curso model.Curso
		err := rows.Scan(
			&curso.ID,
			&curso.Nome,
			&curso.VagasTotais,
			&curso.Ativo,
			&curso.VagasRestantes,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear curso: %w", err)
		}
		cursos = append(cursos, curso)
	}

	return cursos, nil
}

// UpdateCurso atualiza um curso
func (r *CursosTurmasRepository) UpdateCurso(ctx context.Context, id int, payload model.UpdateCursoPayload) error {
	// Buscar curso atual
	curso, err := r.GetCursoByID(ctx, id)
	if err != nil {
		return err
	}

	// Preparar valores para atualização
	nome := curso.Nome
	if payload.Nome != "" {
		nome = payload.Nome
	}

	vagasTotais := curso.VagasTotais
	if payload.VagasTotais != nil {
		vagasTotais = *payload.VagasTotais
		// Se vagas_totais mudou, ajustar vagas_restantes
		if vagasTotais > curso.VagasTotais {
			// Aumentou vagas, ajustar restantes
			curso.VagasRestantes += (vagasTotais - curso.VagasTotais)
		} else if vagasTotais < curso.VagasTotais {
			// Diminuiu vagas, ajustar restantes (não pode ficar negativo)
			diferenca := curso.VagasTotais - vagasTotais
			if curso.VagasRestantes > diferenca {
				curso.VagasRestantes -= diferenca
			} else {
				curso.VagasRestantes = 0
			}
		}
	}

	ativo := curso.Ativo
	if payload.Ativo != nil {
		ativo = *payload.Ativo
	}

	vagasRestantes := curso.VagasRestantes
	if payload.VagasRestantes != nil {
		vagasRestantes = *payload.VagasRestantes
	}

	query := `
		UPDATE curso
		SET nome = $1, vagas_totais = $2, ativo = $3, vagas_restantes = $4
		WHERE id_curso = $5`

	_, err = r.db.ExecContext(ctx, query, nome, vagasTotais, ativo, vagasRestantes, id)
	if err != nil {
		return fmt.Errorf("erro ao atualizar curso: %w", err)
	}

	return nil
}

// DeleteCurso deleta um curso (soft delete ou hard delete)
func (r *CursosTurmasRepository) DeleteCurso(ctx context.Context, id int) error {
	// Verificar se há turmas associadas
	var count int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM turma WHERE cursos_id_curso = $1", id).Scan(&count)
	if err != nil {
		return fmt.Errorf("erro ao verificar turmas: %w", err)
	}

	if count > 0 {
		return fmt.Errorf("não é possível deletar curso com turmas associadas")
	}

	query := `DELETE FROM curso WHERE id_curso = $1`
	_, err = r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("erro ao deletar curso: %w", err)
	}

	return nil
}

// ========== MÉTODOS PARA TURMA ==========

// CreateTurma cria uma nova turma
func (r *CursosTurmasRepository) CreateTurma(ctx context.Context, payload model.CreateTurmaPayload) (int, error) {
	// Verificar se o curso existe
	_, err := r.GetCursoByID(ctx, payload.CursoID)
	if err != nil {
		return 0, fmt.Errorf("curso não encontrado: %w", err)
	}

	query := `
		INSERT INTO turma (cursos_id_curso, dia_semana, vagas_turma, nome_turma, descricao, hora_inicio, hora_fim)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id_turma`

	var id int
	var descricao, horaInicio, horaFim interface{}
	if payload.Descricao != "" {
		descricao = payload.Descricao
	}
	if payload.HoraInicio != "" {
		horaInicio = payload.HoraInicio
	}
	if payload.HoraFim != "" {
		horaFim = payload.HoraFim
	}

	err = r.db.QueryRowContext(ctx, query,
		payload.CursoID,
		payload.DiaSemana,
		payload.VagasTurma,
		payload.NomeTurma,
		descricao,
		horaInicio,
		horaFim,
	).Scan(&id)

	if err != nil {
		return 0, fmt.Errorf("erro ao criar turma: %w", err)
	}

	return id, nil
}

// GetTurmaByID busca uma turma por ID
func (r *CursosTurmasRepository) GetTurmaByID(ctx context.Context, id int) (*model.Turma, error) {
	query := `
		SELECT id_turma, cursos_id_curso, dia_semana, vagas_turma, nome_turma, descricao, hora_inicio, hora_fim
		FROM turma
		WHERE id_turma = $1`

	var turma model.Turma
	var descricao, horaInicio, horaFim sql.NullString

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&turma.ID,
		&turma.CursoID,
		&turma.DiaSemana,
		&turma.VagasTurma,
		&turma.NomeTurma,
		&descricao,
		&horaInicio,
		&horaFim,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("turma não encontrada")
		}
		return nil, fmt.Errorf("erro ao buscar turma: %w", err)
	}

	if descricao.Valid {
		turma.Descricao = descricao.String
	}
	if horaInicio.Valid {
		turma.HoraInicio = horaInicio.String
	}
	if horaFim.Valid {
		turma.HoraFim = horaFim.String
	}

	return &turma, nil
}

// GetTurmasByCursoID busca todas as turmas de um curso
func (r *CursosTurmasRepository) GetTurmasByCursoID(ctx context.Context, cursoID int) ([]model.Turma, error) {
	query := `
		SELECT id_turma, cursos_id_curso, dia_semana, vagas_turma, nome_turma, descricao, hora_inicio, hora_fim
		FROM turma
		WHERE cursos_id_curso = $1
		ORDER BY nome_turma`

	rows, err := r.db.QueryContext(ctx, query, cursoID)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar turmas: %w", err)
	}
	defer rows.Close()

	var turmas []model.Turma
	for rows.Next() {
		var turma model.Turma
		var descricao, horaInicio, horaFim sql.NullString

		err := rows.Scan(
			&turma.ID,
			&turma.CursoID,
			&turma.DiaSemana,
			&turma.VagasTurma,
			&turma.NomeTurma,
			&descricao,
			&horaInicio,
			&horaFim,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear turma: %w", err)
		}

		if descricao.Valid {
			turma.Descricao = descricao.String
		}
		if horaInicio.Valid {
			turma.HoraInicio = horaInicio.String
		}
		if horaFim.Valid {
			turma.HoraFim = horaFim.String
		}

		turmas = append(turmas, turma)
	}

	return turmas, nil
}

// GetAllTurmas lista todas as turmas
func (r *CursosTurmasRepository) GetAllTurmas(ctx context.Context) ([]model.Turma, error) {
	query := `
		SELECT id_turma, cursos_id_curso, dia_semana, vagas_turma, nome_turma, descricao, hora_inicio, hora_fim
		FROM turma
		ORDER BY cursos_id_curso, nome_turma`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar turmas: %w", err)
	}
	defer rows.Close()

	var turmas []model.Turma
	for rows.Next() {
		var turma model.Turma
		var descricao, horaInicio, horaFim sql.NullString

		err := rows.Scan(
			&turma.ID,
			&turma.CursoID,
			&turma.DiaSemana,
			&turma.VagasTurma,
			&turma.NomeTurma,
			&descricao,
			&horaInicio,
			&horaFim,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear turma: %w", err)
		}

		if descricao.Valid {
			turma.Descricao = descricao.String
		}
		if horaInicio.Valid {
			turma.HoraInicio = horaInicio.String
		}
		if horaFim.Valid {
			turma.HoraFim = horaFim.String
		}

		turmas = append(turmas, turma)
	}

	return turmas, nil
}

// UpdateTurma atualiza uma turma
func (r *CursosTurmasRepository) UpdateTurma(ctx context.Context, id int, payload model.UpdateTurmaPayload) error {
	// Buscar turma atual
	turma, err := r.GetTurmaByID(ctx, id)
	if err != nil {
		return err
	}

	// Verificar se curso mudou e se existe
	cursoID := turma.CursoID
	if payload.CursoID != nil {
		_, err := r.GetCursoByID(ctx, *payload.CursoID)
		if err != nil {
			return fmt.Errorf("curso não encontrado: %w", err)
		}
		cursoID = *payload.CursoID
	}

	// Preparar valores para atualização
	diaSemana := turma.DiaSemana
	if payload.DiaSemana != "" {
		diaSemana = payload.DiaSemana
	}

	vagasTurma := turma.VagasTurma
	if payload.VagasTurma != nil {
		vagasTurma = *payload.VagasTurma
	}

	nomeTurma := turma.NomeTurma
	if payload.NomeTurma != "" {
		nomeTurma = payload.NomeTurma
	}

	descricao := turma.Descricao
	if payload.Descricao != nil {
		descricao = *payload.Descricao
	}

	horaInicio := turma.HoraInicio
	if payload.HoraInicio != nil {
		horaInicio = *payload.HoraInicio
	}

	horaFim := turma.HoraFim
	if payload.HoraFim != nil {
		horaFim = *payload.HoraFim
	}

	query := `
		UPDATE turma
		SET cursos_id_curso = $1, dia_semana = $2, vagas_turma = $3, nome_turma = $4, descricao = $5, hora_inicio = $6, hora_fim = $7
		WHERE id_turma = $8`

	var descricaoVal, horaInicioVal, horaFimVal interface{}
	if descricao != "" {
		descricaoVal = descricao
	}
	if horaInicio != "" {
		horaInicioVal = horaInicio
	}
	if horaFim != "" {
		horaFimVal = horaFim
	}

	_, err = r.db.ExecContext(ctx, query, cursoID, diaSemana, vagasTurma, nomeTurma, descricaoVal, horaInicioVal, horaFimVal, id)
	if err != nil {
		return fmt.Errorf("erro ao atualizar turma: %w", err)
	}

	return nil
}

// DeleteTurma deleta uma turma
func (r *CursosTurmasRepository) DeleteTurma(ctx context.Context, id int) error {
	query := `DELETE FROM turma WHERE id_turma = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("erro ao deletar turma: %w", err)
	}

	return nil
}

// GetCursoComTurmas busca um curso com todas suas turmas
func (r *CursosTurmasRepository) GetCursoComTurmas(ctx context.Context, cursoID int) (*model.CursoComTurmas, error) {
	curso, err := r.GetCursoByID(ctx, cursoID)
	if err != nil {
		return nil, err
	}

	turmas, err := r.GetTurmasByCursoID(ctx, cursoID)
	if err != nil {
		return nil, err
	}

	return &model.CursoComTurmas{
		Curso:  *curso,
		Turmas: turmas,
	}, nil
}

// GetAlunosByTurmaID busca todos os alunos de uma turma (apenas ID e Nome)
func (r *CursosTurmasRepository) GetAlunosByTurmaID(ctx context.Context, turmaID int) ([]model.AlunoSimplificado, error) {
	// Verificar se a turma existe
	_, err := r.GetTurmaByID(ctx, turmaID)
	if err != nil {
		return nil, fmt.Errorf("turma não encontrada: %w", err)
	}

	query := `
		SELECT DISTINCT a.id_aluno, a.nome_completo
		FROM aluno a
		INNER JOIN matricula m ON a.id_aluno = m.aluno_id_aluno
		WHERE m.turmas_id_turma = $1
		  AND a.ativo = true
		ORDER BY a.nome_completo`

	rows, err := r.db.QueryContext(ctx, query, turmaID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar alunos da turma: %w", err)
	}
	defer rows.Close()

	var alunos []model.AlunoSimplificado
	for rows.Next() {
		var aluno model.AlunoSimplificado
		err := rows.Scan(&aluno.ID, &aluno.Nome)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear aluno: %w", err)
		}
		alunos = append(alunos, aluno)
	}

	return alunos, nil
}



