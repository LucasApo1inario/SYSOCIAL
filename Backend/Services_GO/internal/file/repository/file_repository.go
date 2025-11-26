package repository

import (
	"database/sql"
	"fmt"

	"sysocial/internal/file/model"
)

// FileRepository interface define os métodos para operações de arquivo
type FileRepository interface {
	Create(anexo *model.Anexo) error
	GetByID(id int64) (*model.Anexo, error)
}

// fileRepository implementa FileRepository
type fileRepository struct {
	db *sql.DB
}

// NewFileRepository cria uma nova instância do repositório
func NewFileRepository(db *sql.DB) FileRepository {
	return &fileRepository{db: db}
}

// Create cria um novo anexo
func (r *fileRepository) Create(anexo *model.Anexo) error {
	query := `
		INSERT INTO anexos (entidade_pai, id_entidade_pai, arquivo, nome_arquivo, extensao, observacao)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	err := r.db.QueryRow(
		query,
		anexo.EntidadePai,
		anexo.IDEntidadePai,
		anexo.Arquivo,
		anexo.NomeArquivo,
		anexo.Extensao,
		anexo.Observacao,
	).Scan(&anexo.ID)

	if err != nil {
		return fmt.Errorf("erro ao criar anexo: %w", err)
	}

	return nil
}

// GetByID busca anexo por ID
func (r *fileRepository) GetByID(id int64) (*model.Anexo, error) {
	query := `
		SELECT id, entidade_pai, id_entidade_pai, arquivo, nome_arquivo, extensao, observacao
		FROM anexos WHERE id = $1`

	anexo := &model.Anexo{}
	err := r.db.QueryRow(query, id).Scan(
		&anexo.ID,
		&anexo.EntidadePai,
		&anexo.IDEntidadePai,
		&anexo.Arquivo,
		&anexo.NomeArquivo,
		&anexo.Extensao,
		&anexo.Observacao,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("anexo não encontrado")
		}
		return nil, fmt.Errorf("erro ao buscar anexo: %w", err)
	}

	return anexo, nil
}





