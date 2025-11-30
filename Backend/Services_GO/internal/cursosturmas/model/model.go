package model

// Curso representa a tabela curso
type Curso struct {
	ID             int    `json:"id" db:"id_curso"`
	Nome           string `json:"nome" db:"nome"`
	VagasTotais    int    `json:"vagasTotais" db:"vagas_totais"`
	Ativo          bool   `json:"ativo" db:"ativo"`
	VagasRestantes int    `json:"vagasRestantes" db:"vagas_restantes"`
}

// Turma representa a tabela turma
type Turma struct {
	ID         int    `json:"id" db:"id_turma"`
	CursoID    int    `json:"cursoId" db:"cursos_id_curso"`
	DiaSemana  string `json:"diaSemana" db:"dia_semana"`
	VagasTurma int    `json:"vagasTurma" db:"vagas_turma"`
	NomeTurma  string `json:"nomeTurma" db:"nome_turma"`
	Descricao  string `json:"descricao" db:"descricao"`
	HoraInicio string `json:"horaInicio" db:"hora_inicio"`
	HoraFim    string `json:"horaFim" db:"hora_fim"`
	DataInicio string `json:"dataInicio" db:"data_inicio"` // Formato: YYYY-MM-DD
	DataFim    string `json:"dataFim" db:"data_fim"`       // Formato: YYYY-MM-DD
}

// CreateCursoPayload payload para criar um curso
type CreateCursoPayload struct {
	Nome        string `json:"nome" binding:"required"`
	VagasTotais int    `json:"vagasTotais" binding:"required,min=1"`
	Ativo       bool   `json:"ativo"`
}

// UpdateCursoPayload payload para atualizar um curso
type UpdateCursoPayload struct {
	Nome           string `json:"nome"`
	VagasTotais    *int   `json:"vagasTotais"`
	Ativo          *bool  `json:"ativo"`
	VagasRestantes *int   `json:"vagasRestantes"`
}

// CreateTurmaPayload payload para criar uma turma
type CreateTurmaPayload struct {
	CursoID    int    `json:"cursoId" binding:"required"`
	DiaSemana  string `json:"diaSemana" binding:"required"`
	VagasTurma int    `json:"vagasTurma" binding:"required,min=1"`
	NomeTurma  string `json:"nomeTurma" binding:"required"`
	Descricao  string `json:"descricao"`
	HoraInicio string `json:"horaInicio"`
	HoraFim    string `json:"horaFim"`
	DataInicio string `json:"dataInicio" binding:"required"` // Formato: YYYY-MM-DD
	DataFim    string `json:"dataFim" binding:"required"`    // Formato: YYYY-MM-DD
}

// UpdateTurmaPayload payload para atualizar uma turma
type UpdateTurmaPayload struct {
	CursoID    *int    `json:"cursoId"`
	DiaSemana  string  `json:"diaSemana"`
	VagasTurma *int    `json:"vagasTurma"`
	NomeTurma  string  `json:"nomeTurma"`
	Descricao  *string `json:"descricao"`
	HoraInicio *string `json:"horaInicio"`
	HoraFim    *string `json:"horaFim"`
	DataInicio *string `json:"dataInicio"` // Formato: YYYY-MM-DD
	DataFim    *string `json:"dataFim"`   // Formato: YYYY-MM-DD
}

// CursoComTurmas representa um curso com suas turmas
type CursoComTurmas struct {
	Curso  Curso   `json:"curso"`
	Turmas []Turma `json:"turmas"`
}

// AlunoSimplificado representa apenas ID e Nome do aluno
type AlunoSimplificado struct {
	ID   int    `json:"id" db:"id_aluno"`
	Nome string `json:"nome" db:"nome_completo"`
}
