package model

import (
	"database/sql"
	"time"
)

// --- Structs de Resposta e Filtro ---

// StudentSummary é o DTO usado na listagem de alunos
type StudentSummary struct {
	ID             int      `json:"id"`
	FullName       string   `json:"fullName"`
	CPF            string   `json:"cpf"`
	Age            int      `json:"age"`
	Gender         string   `json:"gender"`
	School         string   `json:"school"`
	SchoolShift    string   `json:"schoolShift"`
	Courses        []string `json:"courses"`
	Classes        []string `json:"classes"`
	Shifts         []string `json:"shifts"` // Turnos dos cursos
	Status         string   `json:"status"`
	EnrollmentDate string   `json:"enrollmentDate"`
}

// StudentFilter mapeia os parâmetros de busca da URL
type StudentFilter struct {
	Name        string `form:"name"`
	CPF         string `form:"cpf"`
	Age         string `form:"age"` // Recebe como string para converter
	Gender      string `form:"gender"`
	School      string `form:"school"`
	SchoolShift string `form:"schoolShift"`
	Status      string `form:"status"` // "ATIVO", "INATIVO" ou ""
	Course      string `form:"course"`
	Class       string `form:"class"`
	CourseShift string `form:"courseShift"`
}

// --- Payloads (JSON vindo do Frontend) ---

// StudentPayload mapeia os dados do aluno vindos do formulário Angular
type StudentPayload struct {
	FullName  string `json:"fullName"`
	BirthDate string `json:"birthDate"` // Formato YYYY-MM-DD
	CPF       string `json:"cpf"`
	Phone     string `json:"phone"`
	Gender    string `json:"gender"`
	// Endereço
	ZipCode      string `json:"zipCode"`
	Street       string `json:"street"`
	Number       string `json:"number"`
	Neighborhood string `json:"neighborhood"`
	// Escolaridade
	CurrentSchool string `json:"currentSchool"`
	Series        string `json:"series"`
	SchoolShift   string `json:"schoolShift"`
	Observation   string `json:"observation"`
	IsActive      bool   `json:"isActive"`
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
	ClassID  string `json:"classId"`
}

// DocumentPayload mapeia os metadados dos documentos
type DocumentPayload struct {
	ID          int    `json:"id,omitempty"`
	FileName    string `json:"fileName"`
	Observation string `json:"observation"`
}

// NewEnrollmentPayload é o objeto raiz recebido no POST
type NewEnrollmentPayload struct {
	Student   StudentPayload            `json:"student"`
	Guardians []GuardianPayload         `json:"guardians"`
	Courses   []CourseEnrollmentPayload `json:"courses"`
	Documents []DocumentPayload         `json:"documents"`
}

// --- Entidades do Banco de Dados ---

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
	Ativo			bool           `db:"ativo"`
}

type Guardian struct {
	ID              int            `db:"id_responsavel" json:"id"`
	NomeCompleto    string         `db:"nome_completo" json:"fullName"`
	CPF             string         `db:"cpf" json:"cpf"`
	Telefone        string         `db:"telefone" json:"phone"`
	TelefoneRecado1 sql.NullString `db:"telefone_recado1" json:"messagePhone1"`
	TelefoneRecado2 sql.NullString `db:"telefone_recado2" json:"messagePhone2"`
	Parentesco      string         `db:"parentesco" json:"relationship"`
	ContatoTelefone sql.NullString `db:"contato_telefone"`
	ContatoRecado1  sql.NullString `db:"contato_recado1"`
	ContatoRecado2  sql.NullString `db:"contato_recado2"`
}

type StudentGuardianPivot struct {
	ResponsavelID int    `db:"responsavel_id_responsavel"`
	AlunoID       int    `db:"aluno_id_aluno"`
	Tipo          string `db:"tipo"`
}

type Matricula struct {
	ID            int       `db:"id_matricula"`
	AlunoID       int       `db:"aluno_id_aluno"`
	TurmaID       int       `db:"turmas_id_turma"`
	Status        string    `db:"status"`
	DataMatricula time.Time `db:"data_matricula"`
}

type CourseOption struct {
	ID             int           `json:"id" db:"id_curso"`
	Name           string        `json:"name" db:"nome"`
	TotalSpots     int           `json:"totalSpots" db:"vagas_totais"`
	AvailableSpots int           `json:"availableSpots" db:"vagas_restantes"`
	Classes        []ClassOption `json:"classes"`
}

type ClassOption struct {
	ID          int    `json:"id" db:"id_turma"`
	Name        string `json:"name" db:"nome_turma"`
	DayOfWeek   string `json:"dayOfWeek" db:"dia_semana"`
	StartTime   string `json:"startTime" db:"hora_inicio"`
	EndTime     string `json:"endTime" db:"hora_fim"`
	Spots       int    `json:"spots" db:"vagas_turma"`
	Description string `json:"description" db:"descricao"`
}
