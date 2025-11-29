package repository

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"
	"sysocial/internal/enrollment/model"
	"time"
)

type EnrollmentRepository struct {
	db *sql.DB
}

func NewEnrollmentRepository(db *sql.DB) *EnrollmentRepository {
	return &EnrollmentRepository{db: db}
}

// Verifica se o CPF existe (usado pelo validador assíncrono do frontend)
func (r *EnrollmentRepository) CheckCpfExists(ctx context.Context, cpf string) (bool, error) {
	var exists bool
	// SELECT EXISTS é muito performático para essa checagem
	query := "SELECT EXISTS(SELECT 1 FROM aluno WHERE cpf = $1)"
	
	err := r.db.QueryRowContext(ctx, query, cpf).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("erro ao verificar cpf: %w", err)
	}
	
	return exists, nil
}

// CreateEnrollment realiza a inserção transacional completa da matrícula
func (r *EnrollmentRepository) CreateEnrollment(ctx context.Context, payload model.NewEnrollmentPayload) (int, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("falha ao iniciar transação: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			log.Printf("Pânico recuperado no repositório: %v", p)
		} else if err != nil {
			tx.Rollback()
		}
	}()

	var studentID int

	studentSQL := `
	INSERT INTO aluno (
		nome_completo, data_nascimento, sexo, cpf, telefone, 
		escola_atual, serie_atual, periodo_escolar, 
		nome_rua, numero_endereco, bairro, cep,
		data_matricula, observacoes
	)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	RETURNING id_aluno`

	numeroEndereco, _ := strconv.Atoi(payload.Student.Number)
	serieAtual, _ := strconv.Atoi(payload.Student.Series)
	observacoes := payload.Student.Observation

	err = tx.QueryRowContext(ctx, studentSQL,
		payload.Student.FullName, payload.Student.BirthDate, payload.Student.Gender,
		payload.Student.CPF, payload.Student.Phone, payload.Student.CurrentSchool,
		serieAtual, payload.Student.SchoolShift, payload.Student.Street,
		numeroEndereco, payload.Student.Neighborhood, payload.Student.ZipCode,
		time.Now(), observacoes,
	).Scan(&studentID)

	if err != nil {
		// Verifica se o erro contém a mensagem de violação unique do Postgres
		if strings.Contains(err.Error(), "aluno_cpf_unique") || strings.Contains(err.Error(), "unique constraint") {
			return 0, fmt.Errorf("CPF já cadastrado no sistema") 
		}
		return 0, fmt.Errorf("erro ao inserir aluno: %w", err)
	}

	// 2. PROCESSAR RESPONSÁVEIS (UPSERT ATUALIZADO)
	
	pivotSQL := `INSERT INTO responsavel_aluno (responsavel_id_responsavel, aluno_id_aluno, tipo) VALUES ($1, $2, $3)`

	for _, g := range payload.Guardians {
		var guardianID int

		// A. Verificar se existe
		checkGuardianSQL := `SELECT id_responsavel FROM responsavel WHERE cpf = $1`
		err = tx.QueryRowContext(ctx, checkGuardianSQL, g.CPF).Scan(&guardianID)

		if err == sql.ErrNoRows {
			// B1. INSERT (Com novos campos)
			insertGuardianSQL := `
			INSERT INTO responsavel (
				nome_completo, cpf, telefone, telefone_recado1, telefone_recado2, parentesco,
				contato_telefone, contato_recado1, contato_recado2
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_responsavel`

			err = tx.QueryRowContext(ctx, insertGuardianSQL,
				g.FullName, g.CPF, g.Phone, g.MessagePhone1, g.MessagePhone2, g.Relationship,
				g.PhoneContact, g.MessagePhone1Contact, g.MessagePhone2Contact, // Novos campos
			).Scan(&guardianID)
			
			if err != nil {
				return 0, fmt.Errorf("erro ao inserir novo responsável %s: %w", g.FullName, err)
			}

		} else if err == nil {
			// B2. UPDATE (Com novos campos)
			updateGuardianSQL := `
			UPDATE responsavel SET
				nome_completo = $1, telefone = $2, telefone_recado1 = $3, telefone_recado2 = $4, parentesco = $5,
				contato_telefone = $6, contato_recado1 = $7, contato_recado2 = $8
			WHERE id_responsavel = $9`

			_, err = tx.ExecContext(ctx, updateGuardianSQL,
				g.FullName, g.Phone, g.MessagePhone1, g.MessagePhone2, g.Relationship,
				g.PhoneContact, g.MessagePhone1Contact, g.MessagePhone2Contact, // Novos campos
				guardianID,
			)
			
			if err != nil {
				return 0, fmt.Errorf("erro ao atualizar responsável %s: %w", g.FullName, err)
			}
		} else {
			return 0, fmt.Errorf("erro ao verificar responsável: %w", err)
		}

		// C. Vínculo
		tipoVinculo := "Secundário"
		if g.IsPrincipal {
			tipoVinculo = "Principal"
		}

		_, err = tx.ExecContext(ctx, pivotSQL, guardianID, studentID, tipoVinculo)
		if err != nil {
			return 0, fmt.Errorf("erro ao vincular responsável: %w", err)
		}
	}

	// 3. MATRÍCULA EM CURSOS
	matriculaSQL := `INSERT INTO matricula (aluno_id_aluno, turmas_id_turma, status, data_matricula) VALUES ($1, $2, $3, $4)`

	for _, c := range payload.Courses {
		turmaID, _ := strconv.Atoi(c.ClassID)
		_, err = tx.ExecContext(ctx, matriculaSQL, studentID, turmaID, "ATIVO", time.Now())
		if err != nil {
			return 0, fmt.Errorf("erro ao inserir matrícula na turma %d: %w", turmaID, err)
		}
	}

	if err = tx.Commit(); err != nil {
		return 0, fmt.Errorf("erro ao commitar transação: %w", err)
	}

	return studentID, nil
}

func (r *EnrollmentRepository) GetAvailableCourses(ctx context.Context, schoolShift string) ([]model.CourseOption, error) {
	var timeCondition string
	switch schoolShift {
	case "manha":
		timeCondition = "t.hora_inicio >= '12:00:00'"
	case "tarde":
		timeCondition = "t.hora_inicio < '12:00:00'"
	case "integral":
		return []model.CourseOption{}, nil
	default:
		timeCondition = "1=1"
	}

	query := fmt.Sprintf(`
		SELECT 
			c.id_curso, c.nome, c.vagas_totais, c.vagas_restantes,
			t.id_turma, t.nome_turma, t.dia_semana, t.hora_inicio, t.hora_fim, t.vagas_turma, t.descricao
		FROM curso c
		JOIN turma t ON c.id_curso = t.cursos_id_curso
		WHERE c.ativo = true 
		  AND c.vagas_restantes > 0
		  AND %s
		ORDER BY c.nome, t.nome_turma
	`, timeCondition)

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("erro na query de cursos: %w", err)
	}
	defer rows.Close()

	coursesMap := make(map[int]*model.CourseOption)
	var coursesOrder []int

	for rows.Next() {
		var (
			cID, cVagasTotal, cVagasRest, tID, tVagas int
			cNome, tNome, tDia, tInicio, tFim         string
			tDesc                                     sql.NullString
		)
		err := rows.Scan(&cID, &cNome, &cVagasTotal, &cVagasRest, &tID, &tNome, &tDia, &tInicio, &tFim, &tVagas, &tDesc)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear linha: %w", err)
		}

		if _, exists := coursesMap[cID]; !exists {
			coursesMap[cID] = &model.CourseOption{
				ID: cID, Name: cNome, TotalSpots: cVagasTotal, AvailableSpots: cVagasRest, Classes: []model.ClassOption{},
			}
			coursesOrder = append(coursesOrder, cID)
		}
		coursesMap[cID].Classes = append(coursesMap[cID].Classes, model.ClassOption{
			ID: tID, Name: tNome, DayOfWeek: tDia, StartTime: tInicio, EndTime: tFim, Spots: tVagas, Description: tDesc.String,
		})
	}

	var result []model.CourseOption
	for _, id := range coursesOrder {
		result = append(result, *coursesMap[id])
	}
	return result, nil
}

func (r *EnrollmentRepository) GetInitialCourseData(ctx context.Context) (map[string]interface{}, error) {
	return map[string]interface{}{}, nil
}

func (r *EnrollmentRepository) GetGuardianByCPF(ctx context.Context, cpf string) (*model.Guardian, error) {
	query := `
		SELECT 
			id_responsavel, nome_completo, cpf, telefone, telefone_recado1, telefone_recado2, parentesco,
			contato_telefone, contato_recado1, contato_recado2
		FROM responsavel WHERE cpf = $1`
	
	g := &model.Guardian{}
	err := r.db.QueryRowContext(ctx, query, cpf).Scan(
		&g.ID, &g.NomeCompleto, &g.CPF, &g.Telefone, 
		&g.TelefoneRecado1, &g.TelefoneRecado2, &g.Parentesco,
		&g.ContatoTelefone, &g.ContatoRecado1, &g.ContatoRecado2, // Novos campos
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return g, nil
}