package model

// Chamada representa a tabela chamada
type Chamada struct {
	ID          int    `json:"id" db:"id_chamada"`
	UsuarioID   int    `json:"usuarioId" db:"users_id_usuario"`
	TurmaID     int    `json:"turmaId" db:"turmas_id_turma"`
	DataAula    string `json:"dataAula" db:"data_aula"` // Formato: YYYY-MM-DD
}

// Presenca representa a tabela presenca
type Presenca struct {
	ID         int    `json:"id" db:"id_presenca"`
	ChamadaID  int    `json:"chamadaId" db:"chamada_id_chamada"`
	AlunoID    int    `json:"alunoId" db:"aluno_id_aluno"`
	Presente   string   `json:"presente" db:"presente"`
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
	Presente   string `json:"presente"`
	Observacao string `json:"observacao"`
}

// CreatePresencasPayload payload para criar múltiplas presenças
type CreatePresencasPayload struct {
	ChamadaID int                     `json:"chamadaId" binding:"required"`
	Presencas []CreatePresencaPayload `json:"presencas" binding:"required"`
}





