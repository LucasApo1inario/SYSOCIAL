package model

// Anexo representa um anexo no sistema
type Anexo struct {
	ID            int64  `json:"id" db:"id"`
	EntidadePai   string `json:"entidade_pai" db:"entidade_pai"`
	IDEntidadePai string `json:"id_entidade_pai" db:"id_entidade_pai"`
	Arquivo       []byte `json:"-" db:"arquivo"`
	NomeArquivo   string `json:"nome_arquivo" db:"nome_arquivo"`
	Extensao      string `json:"extensao" db:"extensao"`
	Observacao    string `json:"observacao" db:"observacao"`
}

// UploadRequest representa a requisição de upload de arquivo
type UploadRequest struct {
	EntidadePai   string `json:"entidade_pai" validate:"required"`
	IDEntidadePai string `json:"id_entidade_pai" validate:"required"`
	ArquivoBase64 string `json:"arquivo_base64" validate:"required"`
	NomeArquivo   string `json:"nome_arquivo" validate:"required"`
	Extensao      string `json:"extensao" validate:"required"`
	Observacao    string `json:"observacao"`
}

// AnexoResponse representa a resposta de anexo (com arquivo em base64)
type AnexoResponse struct {
	ID            int64  `json:"id"`
	EntidadePai   string `json:"entidade_pai"`
	IDEntidadePai string `json:"id_entidade_pai"`
	ArquivoBase64 string `json:"arquivo_base64"`
	NomeArquivo   string `json:"nome_arquivo"`
	Extensao      string `json:"extensao"`
	Observacao    string `json:"observacao"`
}
