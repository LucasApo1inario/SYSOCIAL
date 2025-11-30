package model

// Chamada representa a tabela chamada
type Chamada struct {
	ID        int    `json:"id" db:"id_chamada"`
	UsuarioID int    `json:"usuarioId" db:"users_id_usuario"`
	TurmaID   int    `json:"turmaId" db:"turmas_id_turma"`
	DataAula  string `json:"dataAula" db:"data_aula"` // Formato: YYYY-MM-DD
}

// Presenca representa a tabela presenca
type Presenca struct {
	ID         int    `json:"id" db:"id_presenca"`
	ChamadaID  int    `json:"chamadaId" db:"chamada_id_chamada"`
	AlunoID    int    `json:"alunoId" db:"aluno_id_aluno"`
	Presente   string `json:"presente" db:"presente"` // VARCHAR(2): "P", "F", etc.
	Observacao string `json:"observacao" db:"observacao"`
}

// CreateChamadaPayload payload para criar uma chamada
type CreateChamadaPayload struct {
	UsuarioID int    `json:"usuarioId" binding:"required"`
	TurmaID   int    `json:"turmaId" binding:"required"`
	DataAula  string `json:"dataAula" binding:"required"` // Formato: YYYY-MM-DD
}

// UpdateChamadaPayload payload para atualizar uma chamada
type UpdateChamadaPayload struct {
	UsuarioID *int    `json:"usuarioId"`
	TurmaID   *int    `json:"turmaId"`
	DataAula  *string `json:"dataAula"` // Formato: YYYY-MM-DD
}

// CreatePresencaPayload payload para criar uma presença individual
type CreatePresencaPayload struct {
	AlunoID    int    `json:"alunoId" binding:"required"`
	Presente   string `json:"presente"` // VARCHAR(2): "P", "F", etc.
	Observacao string `json:"observacao"`
}

// PresencaPorData representa uma presença por data
type PresencaPorData struct {
	PresencaID  *int   `json:"presencaId,omitempty"`
	Present     string `json:"present"`
	Observation string `json:"observation"`
}

// AlunoPresencas representa um aluno com suas presenças por data
type AlunoPresencas struct {
	AlunoID   int                        `json:"alunoId"`
	AlunoNome string                     `json:"alunoNome"`
	Presencas map[string]PresencaPorData `json:"presencas"` // Chave é a data (YYYY-MM-DD)
}

// DataChamada representa uma data com seu ID de chamada
type DataChamada struct {
	Data string `json:"data"` // Formato: YYYY-MM-DD
	ID   int    `json:"id"`   // ID da chamada
}

// ChamadasPorTurmaMesResponse resposta do GET de chamadas por turma e mês
type ChamadasPorTurmaMesResponse struct {
	Datas  []DataChamada    `json:"datas"` // Array de datas com IDs das chamadas
	Alunos []AlunoPresencas `json:"alunos"`
}

// CreatePresencasPayload payload para criar múltiplas presenças
type CreatePresencasPayload struct {
	ChamadaID int                     `json:"chamadaId" binding:"required"`
	Presencas []CreatePresencaPayload `json:"presencas" binding:"required"`
}

// UpsertPresencasPayload payload para criar/atualizar múltiplas presenças
type UpsertPresencasPayload struct {
	ChamadaID int                    `json:"chamadaId" binding:"required"`
	Records   []UpsertPresencaRecord `json:"records" binding:"required"`
}

// UpsertPresencaRecord representa um registro de presença para upsert
type UpsertPresencaRecord struct {
	IDEstudante int    `json:"idEstudante" binding:"required"`
	Present     string `json:"present"` // VARCHAR(2): "P", "F", "J", etc.
	Observation string `json:"observation"`
}
