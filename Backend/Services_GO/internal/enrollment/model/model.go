package model

import (
	"database/sql"
	"time"
)

// --- Payloads (JSON vindo do Frontend) ---

// StudentPayload mapeia os dados do aluno vindos do formulário Angular
type StudentPayload struct {
	FullName      string `json:"fullName"`
	BirthDate     string `json:"birthDate"` // Formato YYYY-MM-DD
	CPF           string `json:"cpf"`
	Phone         string `json:"phone"`
	Gender        string `json:"gender"`
	// Endereço
	ZipCode       string `json:"zipCode"`
	Street        string `json:"street"`
	Number        string `json:"number"`
	Neighborhood  string `json:"neighborhood"`
	// Escolaridade (Dados anteriores/atuais para histórico)
	CurrentSchool string `json:"currentSchool"`
	Series        string `json:"series"`
	SchoolShift   string `json:"schoolShift"`
}

// GuardianPayload mapeia os dados de cada responsável
type GuardianPayload struct {
	FullName             string `json:"fullName"`
	CPF                  string `json:"cpf"`
	Relationship         string `json:"relationship"`
	Phone                string `json:"phone"`
	PhoneContact         string `json:"phoneContact"`
	MessagePhone1        string `json:"messagePhone1"`
	MessagePhone1Contact string `json:"messagePhone1Contact"`
	MessagePhone2        string `json:"messagePhone2"`
	MessagePhone2Contact string `json:"messagePhone2Contact"`
	IsPrincipal          bool   `json:"isPrincipal"`
}

// CourseEnrollmentPayload mapeia a seleção de curso e turma
type CourseEnrollmentPayload struct {
	CourseID string `json:"courseId"`
	ClassID  string `json:"classId"` // ID da Turma
}

// DocumentPayload mapeia os metadados dos documentos (upload real é separado)
type DocumentPayload struct {
	Type     string `json:"type"`
	FileName string `json:"fileName"`
}

// NewEnrollmentPayload é o objeto raiz recebido no POST
type NewEnrollmentPayload struct {
	Student   StudentPayload            `json:"student"`
	Guardians []GuardianPayload         `json:"guardians"`
	Courses   []CourseEnrollmentPayload `json:"courses"`
	Documents []DocumentPayload         `json:"documents"`
}

// --- Entidades do Banco de Dados (Supabase) ---

// Tabela: aluno
type Student struct {
	ID              int            `db:"id_aluno"`
	NomeCompleto    string         `db:"nome_completo"`
	DataNascimento  time.Time      `db:"data_nascimento"`
	Sexo            sql.NullString `db:"sexo"`
	CPF             string         `db:"cpf"`
	Telefone        sql.NullString `db:"telefone"`
	EscolaAtual     sql.NullString `db:"escola_atual"`
	SerieAtual      sql.NullInt64  `db:"serie_atual"`
	PeriodoEscolar  sql.NullString `db:"periodo_escolar"`
	NomeRua         sql.NullString `db:"nome_rua"`
	NumeroEndereco  sql.NullInt64  `db:"numero_endereco"`
	Bairro          sql.NullString `db:"bairro"`
	DataMatricula   time.Time      `db:"data_matricula"`
	Observacoes     sql.NullString `db:"observacoes"`
	CEP             sql.NullString `db:"cep"`
}

// Tabela: responsavel
type Guardian struct {
	ID               int            `db:"id_responsavel"`
	NomeCompleto     string         `db:"nome_completo"`
	CPF              string         `db:"cpf"`
	Telefone         string         `db:"telefone"`
	TelefoneRecado1  sql.NullString `db:"telefone_recado1"`
	TelefoneRecado2  sql.NullString `db:"telefone_recado2"`
	Parentesco       string         `db:"parentesco"` 
}

// Tabela: responsavel_aluno (Pivô)
type StudentGuardianPivot struct {
	ResponsavelID int    `db:"responsavel_id_responsavel"`
	AlunoID       int    `db:"aluno_id_aluno"`
	Tipo          string `db:"tipo"`
}

// Tabela: matricula (Ligação Aluno <-> Turma)
type Matricula struct {
	ID            int       `db:"id_matricula"`
	AlunoID       int       `db:"aluno_id_aluno"`
	TurmaID       int       `db:"turmas_id_turma"`
	Status        string    `db:"status"`
	DataMatricula time.Time `db:"data_matricula"`
}

// --- Structs para Listagem de Cursos (GET) ---

// CourseOption representa um curso disponível para seleção no frontend
type CourseOption struct {
	ID             int            `json:"id" db:"id_curso"`
	Name           string         `json:"name" db:"nome"`
	TotalSpots     int            `json:"totalSpots" db:"vagas_totais"`
	AvailableSpots int            `json:"availableSpots" db:"vagas_restantes"`
	Classes        []ClassOption  `json:"classes"`
}

// ClassOption representa uma turma disponível
type ClassOption struct {
	ID          int    `json:"id" db:"id_turma"`
	Name        string `json:"name" db:"nome_turma"`
	DayOfWeek   string `json:"dayOfWeek" db:"dia_semana"`
	StartTime   string `json:"startTime" db:"hora_inicio"`
	EndTime     string `json:"endTime" db:"hora_fim"`
	Spots       int    `json:"spots" db:"vagas_turma"`
	Description string `json:"description" db:"descricao"`
}