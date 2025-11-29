package repository

import (
	"context"
	"database/sql"
	"fmt"
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

// Verifica se o CPF existe (usado pelo validador assíncrono do frontend)
func (r *EnrollmentRepository) CheckCpfExists(ctx context.Context, cpf string) (bool, error) {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM aluno WHERE cpf = $1)"
	
	err := r.db.QueryRowContext(ctx, query, cpf).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("erro ao verificar cpf: %w", err)
	}
	
	return exists, nil
}

// GetEnrollmentByID: Busca completa para edição
func (r *EnrollmentRepository) GetEnrollmentByID(ctx context.Context, studentID int) (*model.NewEnrollmentPayload, error) {
	payload := &model.NewEnrollmentPayload{
		Guardians: []model.GuardianPayload{},
		Courses:   []model.CourseEnrollmentPayload{},
		Documents: []model.DocumentPayload{},
	}

	// 1. Buscar Aluno
	studentQuery := `
		SELECT nome_completo, data_nascimento, cpf, telefone, sexo,
		       cep, nome_rua, numero_endereco, bairro,
		       escola_atual, serie_atual, periodo_escolar, observacoes, ativo
		FROM aluno WHERE id_aluno = $1`
	
	var birthDate time.Time
	var series, number int
	var obs sql.NullString
	var active bool

	err := r.db.QueryRowContext(ctx, studentQuery, studentID).Scan(
		&payload.Student.FullName, &birthDate, &payload.Student.CPF, &payload.Student.Phone, &payload.Student.Gender,
		&payload.Student.ZipCode, &payload.Student.Street, &number, &payload.Student.Neighborhood,
		&payload.Student.CurrentSchool, &series, &payload.Student.SchoolShift, &obs, &active,
	)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar aluno: %w", err)
	}
	
	payload.Student.BirthDate = birthDate.Format("2006-01-02")
	payload.Student.Number = strconv.Itoa(number)
	payload.Student.Series = strconv.Itoa(series)
	payload.Student.Observation = obs.String
	payload.Student.IsActive = active

	// 2. RESPONSÁVEIS
	guardiansQuery := `
		SELECT r.nome_completo, r.cpf, r.parentesco, r.telefone, 
		       r.contato_telefone, r.telefone_recado1, r.contato_recado1, 
		       r.telefone_recado2, r.contato_recado2, ra.tipo
		FROM responsavel r
		JOIN responsavel_aluno ra ON r.id_responsavel = ra.responsavel_id_responsavel
		WHERE ra.aluno_id_aluno = $1`
	
	rows, err := r.db.QueryContext(ctx, guardiansQuery, studentID)
	if err != nil { return nil, fmt.Errorf("erro ao buscar responsáveis: %w", err) }
	defer rows.Close()

	for rows.Next() {
		var g model.GuardianPayload
		var tipoVinculo string
		var ct, tr1, cr1, tr2, cr2 sql.NullString
		err := rows.Scan(&g.FullName, &g.CPF, &g.Relationship, &g.Phone, &ct, &tr1, &cr1, &tr2, &cr2, &tipoVinculo)
		if err != nil { continue }
		g.PhoneContact = ct.String
		g.MessagePhone1 = tr1.String
		g.MessagePhone1Contact = cr1.String
		g.MessagePhone2 = tr2.String
		g.MessagePhone2Contact = cr2.String
		g.IsPrincipal = (tipoVinculo == "Principal")
		payload.Guardians = append(payload.Guardians, g)
	}

	// 3. CURSOS
	coursesQuery := `
		SELECT t.cursos_id_curso, m.turmas_id_turma
		FROM matricula m
		JOIN turma t ON m.turmas_id_turma = t.id_turma
		WHERE m.aluno_id_aluno = $1 AND m.status = 'ATIVO'`
	
	rowsCourses, err := r.db.QueryContext(ctx, coursesQuery, studentID)
	if err != nil { return nil, fmt.Errorf("erro ao buscar cursos: %w", err) }
	defer rowsCourses.Close()

	for rowsCourses.Next() {
		var cID, tID int
		if err := rowsCourses.Scan(&cID, &tID); err == nil {
			payload.Courses = append(payload.Courses, model.CourseEnrollmentPayload{
				CourseID: strconv.Itoa(cID), ClassID: strconv.Itoa(tID),
			})
		}
	}

	// 4. DOCUMENTOS (Query direta na tabela anexos)
	docsQuery := `
		SELECT id, nome_arquivo, observacao 
		FROM anexos 
		WHERE entidade_pai = 'matricula' AND id_entidade_pai = $1`

	rowsDocs, err := r.db.QueryContext(ctx, docsQuery, strconv.Itoa(studentID))
	if err != nil { return nil, fmt.Errorf("erro ao buscar documentos: %w", err) }
	defer rowsDocs.Close()

	for rowsDocs.Next() {
		var id int
		var fileName string
		var obs sql.NullString
		
		if err := rowsDocs.Scan(&id, &fileName, &obs); err == nil {
			payload.Documents = append(payload.Documents, model.DocumentPayload{
				ID:          id,
				FileName:    fileName,
				Observation: obs.String,
			})
		}
	}

	return payload, nil
}

// Busca dinâmica de alunos
func (r *EnrollmentRepository) SearchStudents(ctx context.Context, filter model.StudentFilter) ([]model.StudentSummary, error) {
	// Query base
	baseQuery := `
		SELECT 
			a.id_aluno, a.nome_completo, a.cpf, a.sexo, a.escola_atual, a.periodo_escolar, a.ativo, a.data_matricula,
			a.data_nascimento,
			c.nome as nome_curso, t.nome_turma, t.hora_inicio
		FROM aluno a
		LEFT JOIN matricula m ON a.id_aluno = m.aluno_id_aluno AND m.status = 'ATIVO'
		LEFT JOIN turma t ON m.turmas_id_turma = t.id_turma
		LEFT JOIN curso c ON t.cursos_id_curso = c.id_curso
		WHERE 1=1
	`
	
	var args []interface{}
	var conditions []string
	argID := 1

	// Filtros Dinâmicos
	if filter.Name != "" {
		conditions = append(conditions, fmt.Sprintf("a.nome_completo ILIKE $%d", argID))
		args = append(args, "%"+filter.Name+"%")
		argID++
	}
	if filter.CPF != "" {
		conditions = append(conditions, fmt.Sprintf("a.cpf LIKE $%d", argID))
		args = append(args, "%"+filter.CPF+"%")
		argID++
	}
	if filter.Status != "" {
		isActive := filter.Status == "ATIVO"
		conditions = append(conditions, fmt.Sprintf("a.ativo = $%d", argID))
		args = append(args, isActive)
		argID++
	}
	if filter.Gender != "" {
		conditions = append(conditions, fmt.Sprintf("a.sexo = $%d", argID))
		args = append(args, filter.Gender)
		argID++
	}
	if filter.School != "" {
		conditions = append(conditions, fmt.Sprintf("a.escola_atual ILIKE $%d", argID))
		args = append(args, "%"+filter.School+"%")
		argID++
	}
	if filter.SchoolShift != "" {
		conditions = append(conditions, fmt.Sprintf("a.periodo_escolar = $%d", argID))
		args = append(args, filter.SchoolShift)
		argID++
	}
	if filter.Course != "" {
		conditions = append(conditions, fmt.Sprintf("c.nome ILIKE $%d", argID))
		args = append(args, "%"+filter.Course+"%")
		argID++
	}
	if filter.Class != "" {
		conditions = append(conditions, fmt.Sprintf("t.nome_turma ILIKE $%d", argID))
		args = append(args, "%"+filter.Class+"%")
		argID++
	}

	if filter.Age != "" {
		age, err := strconv.Atoi(filter.Age)
		if err == nil {
			conditions = append(conditions, fmt.Sprintf("EXTRACT(YEAR FROM age(current_date, a.data_nascimento)) = $%d", argID))
			args = append(args, age)
			argID++
		}
	}

	query := baseQuery
	if len(conditions) > 0 {
		query += " AND " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY a.nome_completo"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("erro na busca de alunos: %w", err)
	}
	defer rows.Close()

	studentsMap := make(map[int]*model.StudentSummary)
	var studentsOrder []int

	for rows.Next() {
		var (
			id int
			name, cpf string
			sexo, escola, turnoEscola sql.NullString
			ativo bool
			dtMatricula, dtNasc time.Time
			curso, turma, horaInicio sql.NullString
		)

		err := rows.Scan(&id, &name, &cpf, &sexo, &escola, &turnoEscola, &ativo, &dtMatricula, &dtNasc, &curso, &turma, &horaInicio)
		if err != nil {
			return nil, err
		}

		if _, exists := studentsMap[id]; !exists {
			statusStr := "INATIVO"
			if ativo { statusStr = "ATIVO" }
			
			now := time.Now()
			age := now.Year() - dtNasc.Year()
			if now.YearDay() < dtNasc.YearDay() {
				age--
			}

			studentsMap[id] = &model.StudentSummary{
				ID: id, FullName: name, CPF: cpf, Age: age,
				Gender: sexo.String, School: escola.String, SchoolShift: turnoEscola.String,
				Status: statusStr, EnrollmentDate: dtMatricula.Format("2006-01-02"),
				Courses: []string{}, Classes: []string{}, Shifts: []string{},
			}
			studentsOrder = append(studentsOrder, id)
		}

		if curso.Valid {
			studentsMap[id].Courses = append(studentsMap[id].Courses, curso.String)
			studentsMap[id].Classes = append(studentsMap[id].Classes, turma.String)
			
			shift := "Integral"
			if horaInicio.Valid {
				h, _ := strconv.Atoi(horaInicio.String[:2])
				if h < 12 { shift = "Manhã" } else if h < 18 { shift = "Tarde" } else { shift = "Noite" }
			}
			studentsMap[id].Shifts = append(studentsMap[id].Shifts, shift)
		}
	}

	var result []model.StudentSummary
	for _, id := range studentsOrder {
		result = append(result, *studentsMap[id])
	}

	return result, nil
}

// CreateEnrollment: Cria e Consome Vagas
func (r *EnrollmentRepository) CreateEnrollment(ctx context.Context, payload model.NewEnrollmentPayload) (int, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil { return 0, err }
	defer func() { if p := recover(); p != nil { tx.Rollback() } else if err != nil { tx.Rollback() } }()

	var studentID int
	studentSQL := `INSERT INTO aluno (nome_completo, data_nascimento, sexo, cpf, telefone, escola_atual, serie_atual, periodo_escolar, nome_rua, numero_endereco, bairro, cep, data_matricula, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id_aluno`
	numEnd, _ := strconv.Atoi(payload.Student.Number)
	serie, _ := strconv.Atoi(payload.Student.Series)

	err = tx.QueryRowContext(ctx, studentSQL, payload.Student.FullName, payload.Student.BirthDate, payload.Student.Gender, payload.Student.CPF, payload.Student.Phone, payload.Student.CurrentSchool, serie, payload.Student.SchoolShift, payload.Student.Street, numEnd, payload.Student.Neighborhood, payload.Student.ZipCode, time.Now(), payload.Student.Observation).Scan(&studentID)
	if err != nil {
		if strings.Contains(err.Error(), "aluno_cpf_unique") || strings.Contains(err.Error(), "unique constraint") {
			return 0, fmt.Errorf("CPF já cadastrado no sistema") 
		}
		return 0, fmt.Errorf("erro ao inserir aluno: %w", err)
	}

	// Responsáveis
	pivotSQL := `INSERT INTO responsavel_aluno (responsavel_id_responsavel, aluno_id_aluno, tipo) VALUES ($1, $2, $3)`
	for _, g := range payload.Guardians {
		var guardianID int
		checkG := `SELECT id_responsavel FROM responsavel WHERE cpf = $1`
		err = tx.QueryRowContext(ctx, checkG, g.CPF).Scan(&guardianID)
		if err == sql.ErrNoRows {
			insG := `INSERT INTO responsavel (nome_completo, cpf, telefone, telefone_recado1, telefone_recado2, parentesco, contato_telefone, contato_recado1, contato_recado2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_responsavel`
			err = tx.QueryRowContext(ctx, insG, g.FullName, g.CPF, g.Phone, g.MessagePhone1, g.MessagePhone2, g.Relationship, g.PhoneContact, g.MessagePhone1Contact, g.MessagePhone2Contact).Scan(&guardianID)
			if err != nil { return 0, err }
		} else if err == nil {
			updG := `UPDATE responsavel SET nome_completo=$1, telefone=$2, telefone_recado1=$3, telefone_recado2=$4, parentesco=$5, contato_telefone=$6, contato_recado1=$7, contato_recado2=$8 WHERE id_responsavel=$9`
			_, err = tx.ExecContext(ctx, updG, g.FullName, g.Phone, g.MessagePhone1, g.MessagePhone2, g.Relationship, g.PhoneContact, g.MessagePhone1Contact, g.MessagePhone2Contact, guardianID)
			if err != nil { return 0, err }
		} else { return 0, err }
		
		tipo := "Secundário"
		if g.IsPrincipal { tipo = "Principal" }
		_, err = tx.ExecContext(ctx, pivotSQL, guardianID, studentID, tipo)
		if err != nil { return 0, err }
	}

	// Cursos: Insere e DIMINUI vaga
	matSQL := `INSERT INTO matricula (aluno_id_aluno, turmas_id_turma, status, data_matricula) VALUES ($1, $2, $3, $4)`
	decVagaSQL := `UPDATE curso SET vagas_restantes = vagas_restantes - 1 WHERE id_curso = (SELECT cursos_id_curso FROM turma WHERE id_turma = $1)`

	for _, c := range payload.Courses {
		tID, _ := strconv.Atoi(c.ClassID)
		_, err = tx.ExecContext(ctx, matSQL, studentID, tID, "ATIVO", time.Now())
		if err != nil { return 0, err }
		_, err = tx.ExecContext(ctx, decVagaSQL, tID) // Consome vaga
		if err != nil { return 0, fmt.Errorf("erro ao atualizar vagas: %w", err) }
	}

	if err = tx.Commit(); err != nil { return 0, err }
	return studentID, nil
}

// CancelEnrollment: Inativa Aluno, Cancela Matrícula e DEVOLVE Vagas
func (r *EnrollmentRepository) CancelEnrollment(ctx context.Context, studentID int) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil { return err }
	defer func() { if p := recover(); p != nil { tx.Rollback() } else if err != nil { tx.Rollback() } }()

	// 1. Inativar Aluno
	res, err := tx.ExecContext(ctx, "UPDATE aluno SET ativo = false WHERE id_aluno = $1", studentID)
	if err != nil { return err }
	ra, _ := res.RowsAffected()
	if ra == 0 { return fmt.Errorf("aluno não encontrado") }

	// 2. Descobrir turmas ativas (para devolver vaga)
	rows, err := tx.QueryContext(ctx, "SELECT turmas_id_turma FROM matricula WHERE aluno_id_aluno = $1 AND status = 'ATIVO'", studentID)
	if err != nil { return err }
	
	var turmasIds []int
	for rows.Next() {
		var tid int
		if err := rows.Scan(&tid); err == nil { turmasIds = append(turmasIds, tid) }
	}
	rows.Close()

	// 3. Cancelar matrículas e Devolver vagas
	incVagaSQL := `UPDATE curso SET vagas_restantes = vagas_restantes + 1 WHERE id_curso = (SELECT cursos_id_curso FROM turma WHERE id_turma = $1)`

	_, err = tx.ExecContext(ctx, "UPDATE matricula SET status = 'CANCELADO' WHERE aluno_id_aluno = $1", studentID)
	if err != nil { return err }

	for _, tid := range turmasIds {
		_, err = tx.ExecContext(ctx, incVagaSQL, tid) // Devolve vaga
		if err != nil { return err }
	}

	return tx.Commit()
}

// UpdateEnrollment: Atualiza dados, Refaz matrículas e Ajusta Vagas
func (r *EnrollmentRepository) UpdateEnrollment(ctx context.Context, studentID int, payload model.NewEnrollmentPayload) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil { return err }
	defer func() { if p := recover(); p != nil { tx.Rollback() } else if err != nil { tx.Rollback() } }()

	// 1. Update Aluno
	studentSQL := `UPDATE aluno SET nome_completo=$1, data_nascimento=$2, sexo=$3, telefone=$4, escola_atual=$5, serie_atual=$6, periodo_escolar=$7, nome_rua=$8, numero_endereco=$9, bairro=$10, cep=$11, observacoes=$12, ativo=true WHERE id_aluno=$13`
	numEnd, _ := strconv.Atoi(payload.Student.Number)
	serie, _ := strconv.Atoi(payload.Student.Series)
	_, err = tx.ExecContext(ctx, studentSQL, payload.Student.FullName, payload.Student.BirthDate, payload.Student.Gender, payload.Student.Phone, payload.Student.CurrentSchool, serie, payload.Student.SchoolShift, payload.Student.Street, numEnd, payload.Student.Neighborhood, payload.Student.ZipCode, payload.Student.Observation, studentID)
	if err != nil { return err }

	// 2. Responsáveis
	_, err = tx.ExecContext(ctx, "DELETE FROM responsavel_aluno WHERE aluno_id_aluno = $1", studentID)
	if err != nil { return err }

	pivotSQL := `INSERT INTO responsavel_aluno (responsavel_id_responsavel, aluno_id_aluno, tipo) VALUES ($1, $2, $3)`
	for _, g := range payload.Guardians {
		var guardianID int
		checkG := `SELECT id_responsavel FROM responsavel WHERE cpf = $1`
		err = tx.QueryRowContext(ctx, checkG, g.CPF).Scan(&guardianID)
		if err == sql.ErrNoRows {
			insG := `INSERT INTO responsavel (nome_completo, cpf, telefone, telefone_recado1, telefone_recado2, parentesco, contato_telefone, contato_recado1, contato_recado2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_responsavel`
			err = tx.QueryRowContext(ctx, insG, g.FullName, g.CPF, g.Phone, g.MessagePhone1, g.MessagePhone2, g.Relationship, g.PhoneContact, g.MessagePhone1Contact, g.MessagePhone2Contact).Scan(&guardianID)
			if err != nil { return err }
		} else if err == nil {
			updG := `UPDATE responsavel SET nome_completo=$1, telefone=$2, telefone_recado1=$3, telefone_recado2=$4, parentesco=$5, contato_telefone=$6, contato_recado1=$7, contato_recado2=$8 WHERE id_responsavel=$9`
			_, err = tx.ExecContext(ctx, updG, g.FullName, g.Phone, g.MessagePhone1, g.MessagePhone2, g.Relationship, g.PhoneContact, g.MessagePhone1Contact, g.MessagePhone2Contact, guardianID)
			if err != nil { return err }
		} else { return err }
		
		tipo := "Secundário"
		if g.IsPrincipal { tipo = "Principal" }
		_, err = tx.ExecContext(ctx, pivotSQL, guardianID, studentID, tipo)
		if err != nil { return err }
	}

	// 3. CURSOS E VAGAS (A parte crítica)
	
	// A. Descobrir turmas ANTIGAS ativas para DEVOLVER vaga
	rowsOld, err := tx.QueryContext(ctx, "SELECT turmas_id_turma FROM matricula WHERE aluno_id_aluno = $1 AND status = 'ATIVO'", studentID)
	if err != nil { return err }
	var oldTurmas []int
	for rowsOld.Next() {
		var tid int
		if err := rowsOld.Scan(&tid); err == nil { oldTurmas = append(oldTurmas, tid) }
	}
	rowsOld.Close()

	incVagaSQL := `UPDATE curso SET vagas_restantes = vagas_restantes + 1 WHERE id_curso = (SELECT cursos_id_curso FROM turma WHERE id_turma = $1)`
	for _, tid := range oldTurmas {
		_, err = tx.ExecContext(ctx, incVagaSQL, tid) // Devolve vaga antiga
		if err != nil { return err }
	}

	// B. Remover matrículas antigas
	_, err = tx.ExecContext(ctx, "DELETE FROM matricula WHERE aluno_id_aluno = $1", studentID)
	if err != nil { return err }

	// C. Inserir NOVAS matrículas e CONSUMIR vaga
	matSQL := `INSERT INTO matricula (aluno_id_aluno, turmas_id_turma, status, data_matricula) VALUES ($1, $2, $3, $4)`
	decVagaSQL := `UPDATE curso SET vagas_restantes = vagas_restantes - 1 WHERE id_curso = (SELECT cursos_id_curso FROM turma WHERE id_turma = $1)`
	
	for _, c := range payload.Courses {
		tID, _ := strconv.Atoi(c.ClassID)
		_, err = tx.ExecContext(ctx, matSQL, studentID, tID, "ATIVO", time.Now())
		if err != nil { return err }
		_, err = tx.ExecContext(ctx, decVagaSQL, tID) // Consome nova vaga
		if err != nil { return err }
	}

	return tx.Commit()
}

// GetAvailableCourses busca cursos e turmas compatíveis com o turno escolar
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
		  -- REMOVIDO: AND c.vagas_restantes > 0 (Para mostrar cursos lotados no front)
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

		err := rows.Scan(
			&cID, &cNome, &cVagasTotal, &cVagasRest,
			&tID, &tNome, &tDia, &tInicio, &tFim, &tVagas, &tDesc,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear linha: %w", err)
		}

		if _, exists := coursesMap[cID]; !exists {
			coursesMap[cID] = &model.CourseOption{
				ID:             cID,
				Name:           cNome,
				TotalSpots:     cVagasTotal,
				AvailableSpots: cVagasRest,
				Classes:        []model.ClassOption{},
			}
			coursesOrder = append(coursesOrder, cID)
		}

		coursesMap[cID].Classes = append(coursesMap[cID].Classes, model.ClassOption{
			ID:          tID,
			Name:        tNome,
			DayOfWeek:   tDia,
			StartTime:   tInicio,
			EndTime:     tFim,
			Spots:       tVagas,
			Description: tDesc.String, 
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