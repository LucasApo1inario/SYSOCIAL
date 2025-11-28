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
)

type EnrollmentRepository struct {
	db *sql.DB
}

func NewEnrollmentRepository(db *sql.DB) *EnrollmentRepository {
	return &EnrollmentRepository{db: db}
}

// CreateEnrollment realiza a inserção transacional completa da matrícula
func (r *EnrollmentRepository) CreateEnrollment(ctx context.Context, payload model.NewEnrollmentPayload) (int, error) {
	// Inicia a transação
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
	
	// 1. INSERIR ALUNO (Tabela 'aluno')
	studentSQL := `
	INSERT INTO aluno (
		nome_completo, data_nascimento, sexo, cpf, telefone, 
		escola_atual, serie_atual, periodo_escolar, 
		nome_rua, numero_endereco, bairro, cep,
		data_matricula, observacoes
	)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	RETURNING id_aluno`

	// Conversões de tipo necessárias
	numeroEndereco, _ := strconv.Atoi(payload.Student.Number)
	serieAtual, _ := strconv.Atoi(payload.Student.Series)
	
	observacoes := payload.Student.Observation

	err = tx.QueryRowContext(ctx, studentSQL,
		payload.Student.FullName,      // $1
		payload.Student.BirthDate,     // $2
		payload.Student.Gender,        // $3
		payload.Student.CPF,           // $4
		payload.Student.Phone,         // $5
		payload.Student.CurrentSchool, // $6
		serieAtual,                    // $7
		payload.Student.SchoolShift,   // $8
		payload.Student.Street,        // $9
		numeroEndereco,                // $10
		payload.Student.Neighborhood,  // $11
		payload.Student.ZipCode,       // $12
		time.Now(),                    // $13
		observacoes,                   // $14 
	).Scan(&studentID)

	if err != nil {
		// Verifica se o erro contém a mensagem de violação unique do Postgres
		if strings.Contains(err.Error(), "aluno_cpf_unique") || strings.Contains(err.Error(), "unique constraint") {
			return 0, fmt.Errorf("CPF já cadastrado no sistema") 
		}
		return 0, fmt.Errorf("erro ao inserir aluno: %w", err)
	}

	// 2. INSERIR RESPONSÁVEIS
	guardianSQL := `
	INSERT INTO responsavel (
		nome_completo, cpf, telefone, telefone_recado1, telefone_recado2, parentesco
	) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_responsavel`

	pivotSQL := `
	INSERT INTO responsavel_aluno (
		responsavel_id_responsavel, aluno_id_aluno, tipo
	) VALUES ($1, $2, $3)`

	for _, g := range payload.Guardians {
		var guardianID int

		err = tx.QueryRowContext(ctx, guardianSQL,
			g.FullName, g.CPF, g.Phone, g.MessagePhone1, g.MessagePhone2, g.Relationship,
		).Scan(&guardianID)

		if err != nil {
			return 0, fmt.Errorf("erro ao inserir responsável %s: %w", g.FullName, err)
		}

		tipoVinculo := "Secundário"
		if g.IsPrincipal {
			tipoVinculo = "Principal"
		}

		_, err = tx.ExecContext(ctx, pivotSQL, guardianID, studentID, tipoVinculo)
		if err != nil {
			return 0, fmt.Errorf("erro ao vincular responsável: %w", err)
		}
	}

	// 3. INSERIR MATRÍCULA EM CURSOS
	matriculaSQL := `
	INSERT INTO matricula (
		aluno_id_aluno, turmas_id_turma, status, data_matricula
	)
	VALUES ($1, $2, $3, $4)`

	for _, c := range payload.Courses {
		turmaID, _ := strconv.Atoi(c.ClassID)
		statusInicial := "ATIVO"

		_, err = tx.ExecContext(ctx, matriculaSQL, studentID, turmaID, statusInicial, time.Now())
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
			cNome, tNome, tDia, tInicio, tFim       string
			tDesc                                   sql.NullString
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