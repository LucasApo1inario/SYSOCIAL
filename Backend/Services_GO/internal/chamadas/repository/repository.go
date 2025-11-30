package repository

import (
	"context"
	"database/sql"
	"fmt"
	"sysocial/internal/chamadas/model"
	"time"
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
	chamada, err := r.GetChamadaByID(ctx, id)
	if err != nil {
		return err
	}

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

// CheckTurmaDateRange verifica se a data da aula está dentro do período da turma
func (r *ChamadasRepository) CheckTurmaDateRange(ctx context.Context, turmaID int, dataAula string) (bool, error) {

	query := `
		SELECT COUNT(*) 
		FROM turma 
		WHERE id_turma = $1 
		  AND $2::date >= COALESCE(data_inicio, '1900-01-01') 
		  AND $2::date <= COALESCE(data_fim, '2100-01-01')`

	var count int
	err := r.db.QueryRowContext(ctx, query, turmaID, dataAula).Scan(&count)
	if err != nil {

		return false, fmt.Errorf("erro ao validar data da turma: %w", err)
	}

	return count > 0, nil
}

// ========== MÉTODOS PARA PRESENÇA ==========

// GetPresencasByChamadaID busca todas as presenças de uma chamada
func (r *ChamadasRepository) GetPresencasByChamadaID(ctx context.Context, chamadaID int) ([]model.Presenca, error) {
	query := `
		SELECT id_presenca, chamada_id_chamada, aluno_id_aluno, 
		       COALESCE(presente, '') as presente, 
		       observacao
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

// CreatePresencas cria OU atualiza presenças (Upsert Manual)
func (r *ChamadasRepository) CreatePresencas(ctx context.Context, chamadaID int, presencas []model.CreatePresencaPayload) error {
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

	// Query de Update (Tenta atualizar se já existe)
	updateQuery := `
		UPDATE presenca 
		SET presente = $1, observacao = $2 
		WHERE chamada_id_chamada = $3 AND aluno_id_aluno = $4`

	// Query de Insert (Cria se não existir)
	insertQuery := `
		INSERT INTO presenca (chamada_id_chamada, aluno_id_aluno, presente, observacao)
		VALUES ($1, $2, $3, $4)`

	for _, presenca := range presencas {
		var observacao interface{}
		if presenca.Observacao != "" {
			observacao = presenca.Observacao
		}

		// 1. Tenta UPDATE
		res, err := tx.ExecContext(ctx, updateQuery,
			presenca.Presente, // String (P, F, FJ)
			observacao,
			chamadaID,
			presenca.AlunoID,
		)
		if err != nil {
			return fmt.Errorf("erro ao atualizar presença: %w", err)
		}

		rows, err := res.RowsAffected()
		if err != nil {
			return fmt.Errorf("erro ao verificar linhas afetadas: %w", err)
		}

		// 2. Se UPDATE não afetou nenhuma linha (registro não existe), faz INSERT
		if rows == 0 {
			_, err = tx.ExecContext(ctx, insertQuery,
				chamadaID,
				presenca.AlunoID,
				presenca.Presente,
				observacao,
			)
			if err != nil {
				return fmt.Errorf("erro ao inserir presença: %w", err)
			}
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

// UpsertPresencas cria ou atualiza múltiplas presenças
func (r *ChamadasRepository) UpsertPresencas(ctx context.Context, payload model.UpsertPresencasPayload) error {
	// Verificar se chamada existe
	_, err := r.GetChamadaByID(ctx, payload.ChamadaID)
	if err != nil {
		return fmt.Errorf("chamada não encontrada: %w", err)
	}

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

	// Query para verificar se presença existe
	queryCheck := `SELECT id_presenca FROM presenca WHERE chamada_id_chamada = $1 AND aluno_id_aluno = $2`

	// Query para inserir
	queryInsert := `
		INSERT INTO presenca (chamada_id_chamada, aluno_id_aluno, presente, observacao)
		VALUES ($1, $2, $3, $4)`

	// Query para atualizar
	queryUpdate := `
		UPDATE presenca
		SET presente = $1, observacao = $2
		WHERE chamada_id_chamada = $3 AND aluno_id_aluno = $4`

	for _, record := range payload.Records {
		// Verificar se aluno existe (usando a transação)
		var count int
		queryAluno := `SELECT COUNT(*) FROM aluno WHERE id_aluno = $1 AND ativo = true`
		err = tx.QueryRowContext(ctx, queryAluno, record.IDEstudante).Scan(&count)
		if err != nil {
			return fmt.Errorf("erro ao verificar aluno %d: %w", record.IDEstudante, err)
		}
		if count == 0 {
			return fmt.Errorf("aluno %d não encontrado ou inativo", record.IDEstudante)
		}

		// Verificar se presença já existe
		var presencaID int
		err = tx.QueryRowContext(ctx, queryCheck, payload.ChamadaID, record.IDEstudante).Scan(&presencaID)

		var observacao interface{}
		if record.Observation != "" {
			observacao = record.Observation
		}

		// Se presente está vazio, usar default 'F '
		presente := record.Present
		if presente == "" {
			presente = "F "
		}

		if err == sql.ErrNoRows {
			// Não existe, criar novo registro
			_, err = tx.ExecContext(ctx, queryInsert,
				payload.ChamadaID,
				record.IDEstudante,
				presente,
				observacao,
			)
			if err != nil {
				return fmt.Errorf("erro ao inserir presença para aluno %d: %w", record.IDEstudante, err)
			}
		} else if err != nil {
			return fmt.Errorf("erro ao verificar presença: %w", err)
		} else {
			// Existe, atualizar
			_, err = tx.ExecContext(ctx, queryUpdate,
				presente,
				observacao,
				payload.ChamadaID,
				record.IDEstudante,
			)
			if err != nil {
				return fmt.Errorf("erro ao atualizar presença para aluno %d: %w", record.IDEstudante, err)
			}
		}
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("erro ao commitar transação: %w", err)
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

// GetChamadasPorTurmaMes busca chamadas por turma e mês/ano, criando chamadas se necessário
func (r *ChamadasRepository) GetChamadasPorTurmaMes(ctx context.Context, turmaID int, anoMes string, usuarioID int) (*model.ChamadasPorTurmaMesResponse, error) {
	// Parse anoMes (formato: AAAAMM)
	if len(anoMes) != 6 {
		return nil, fmt.Errorf("formato de ano/mês inválido. Use AAAAMM (ex: 202511)")
	}

	ano := anoMes[:4]
	mes := anoMes[4:]

	// Buscar turma e dia da semana
	var diaSemana string
	queryTurma := `SELECT dia_semana FROM turma WHERE id_turma = $1`
	err := r.db.QueryRowContext(ctx, queryTurma, turmaID).Scan(&diaSemana)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("turma não encontrada")
		}
		return nil, fmt.Errorf("erro ao buscar turma: %w", err)
	}

	// Mapear dia da semana em português para time.Weekday
	diaSemanaMap := map[string]time.Weekday{
		"Domingo":       time.Sunday,
		"Segunda-feira": time.Monday,
		"Terça-feira":   time.Tuesday,
		"Quarta-feira":  time.Wednesday,
		"Quinta-feira":  time.Thursday,
		"Sexta-feira":   time.Friday,
		"Sábado":        time.Saturday,
		"Segunda":       time.Monday,
		"Terça":         time.Tuesday,
		"Quarta":        time.Wednesday,
		"Quinta":        time.Thursday,
		"Sexta":         time.Friday,
	}

	targetWeekday, ok := diaSemanaMap[diaSemana]
	if !ok {
		return nil, fmt.Errorf("dia da semana inválido: %s", diaSemana)
	}

	// Parse ano e mês
	anoInt := 0
	mesInt := 0
	fmt.Sscanf(ano, "%d", &anoInt)
	fmt.Sscanf(mes, "%d", &mesInt)

	if mesInt < 1 || mesInt > 12 {
		return nil, fmt.Errorf("mês inválido: %d", mesInt)
	}

	// Calcular datas do mês que correspondem ao dia da semana
	datas := calcularDatasDoMes(anoInt, time.Month(mesInt), targetWeekday)

	// Para cada data, criar chamada se não existir
	chamadasMap := make(map[string]int) // data -> id_chamada
	for _, data := range datas {
		// Verificar se chamada já existe
		var chamadaID int
		queryChamada := `SELECT id_chamada FROM chamada WHERE turmas_id_turma = $1 AND data_aula = $2`
		err := r.db.QueryRowContext(ctx, queryChamada, turmaID, data).Scan(&chamadaID)

		if err == sql.ErrNoRows {
			// Criar chamada
			queryInsert := `
				INSERT INTO chamada (users_id_usuario, turmas_id_turma, data_aula)
				VALUES ($1, $2, $3)
				RETURNING id_chamada`
			err = r.db.QueryRowContext(ctx, queryInsert, usuarioID, turmaID, data).Scan(&chamadaID)
			if err != nil {
				return nil, fmt.Errorf("erro ao criar chamada para data %s: %w", data, err)
			}
		} else if err != nil {
			return nil, fmt.Errorf("erro ao verificar chamada: %w", err)
		}

		chamadasMap[data] = chamadaID
	}

	// Buscar alunos da turma
	queryAlunos := `
		SELECT DISTINCT a.id_aluno, a.nome_completo
		FROM aluno a
		INNER JOIN matricula m ON a.id_aluno = m.aluno_id_aluno
		WHERE m.turmas_id_turma = $1
		  AND a.ativo = true
		ORDER BY a.nome_completo`

	rows, err := r.db.QueryContext(ctx, queryAlunos, turmaID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar alunos: %w", err)
	}
	defer rows.Close()

	var alunos []model.AlunoPresencas
	for rows.Next() {
		var alunoID int
		var alunoNome string
		err := rows.Scan(&alunoID, &alunoNome)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear aluno: %w", err)
		}

		aluno := model.AlunoPresencas{
			AlunoID:   alunoID,
			AlunoNome: alunoNome,
			Presencas: make(map[string]model.PresencaPorData),
		}

		// Inicializar presenças para todas as datas
		for _, data := range datas {
			aluno.Presencas[data] = model.PresencaPorData{
				Present:     "",
				Observation: "",
			}
		}

		alunos = append(alunos, aluno)
	}

	// Buscar presenças existentes para todas as chamadas
	if len(chamadasMap) > 0 {
		// Construir lista de IDs de chamadas e placeholders
		args := make([]interface{}, 0, len(chamadasMap))
		placeholders := make([]string, 0, len(chamadasMap))

		argIndex := 1
		for _, id := range chamadasMap {
			placeholders = append(placeholders, fmt.Sprintf("$%d", argIndex))
			args = append(args, id)
			argIndex++
		}

		// Query para buscar todas as presenças de uma vez usando IN
		placeholdersStr := ""
		for i, ph := range placeholders {
			if i > 0 {
				placeholdersStr += ", "
			}
			placeholdersStr += ph
		}

		queryPresencas := fmt.Sprintf(`
			SELECT p.id_presenca, p.chamada_id_chamada, p.aluno_id_aluno, 
			       COALESCE(p.presente, '') as presente, 
			       COALESCE(p.observacao, '') as observacao,
			       c.data_aula
			FROM presenca p
			INNER JOIN chamada c ON p.chamada_id_chamada = c.id_chamada
			WHERE p.chamada_id_chamada IN (%s)`, placeholdersStr)

		rowsPresencas, err := r.db.QueryContext(ctx, queryPresencas, args...)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("erro ao buscar presenças: %w", err)
		}

		if err == nil {
			defer rowsPresencas.Close()

			// Mapear presenças por aluno e data
			for rowsPresencas.Next() {
				var presencaID int
				var chamadaID int
				var alunoID int
				var presente sql.NullString
				var observacao sql.NullString
				var dataAula string

				err := rowsPresencas.Scan(&presencaID, &chamadaID, &alunoID, &presente, &observacao, &dataAula)
				if err != nil {
					return nil, fmt.Errorf("erro ao escanear presença: %w", err)
				}

				// Encontrar aluno e atualizar presença
				for i := range alunos {
					if alunos[i].AlunoID == alunoID {
						presencaData := model.PresencaPorData{
							PresencaID:  &presencaID,
							Present:     "",
							Observation: "",
						}

						if presente.Valid {
							presencaData.Present = presente.String
						}
						if observacao.Valid {
							presencaData.Observation = observacao.String
						}

						alunos[i].Presencas[dataAula] = presencaData
						break
					}
				}
			}
		}
	}

	return &model.ChamadasPorTurmaMesResponse{
		Datas:  datas,
		Alunos: alunos,
	}, nil
}

// calcularDatasDoMes calcula todas as datas de um mês que correspondem a um dia da semana
func calcularDatasDoMes(ano int, mes time.Month, weekday time.Weekday) []string {
	// Primeiro dia do mês
	primeiroDia := time.Date(ano, mes, 1, 0, 0, 0, 0, time.UTC)

	// Encontrar o primeiro dia da semana no mês
	diasParaAdicionar := int(weekday - primeiroDia.Weekday())
	if diasParaAdicionar < 0 {
		diasParaAdicionar += 7
	}

	primeiraData := primeiroDia.AddDate(0, 0, diasParaAdicionar)

	var datas []string
	dataAtual := primeiraData

	// Adicionar todas as datas do mesmo dia da semana no mês
	for dataAtual.Month() == mes {
		datas = append(datas, dataAtual.Format("2006-01-02"))
		dataAtual = dataAtual.AddDate(0, 0, 7) // Adicionar 7 dias
	}

	return datas
}
