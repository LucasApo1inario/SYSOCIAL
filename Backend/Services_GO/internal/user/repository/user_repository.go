package repository

import (
	"database/sql"
	"fmt"

	"sysocial/internal/user/model"
)

// UserRepository interface define os métodos para operações de usuário
type UserRepository interface {
	Create(user *model.User) error
	GetByID(id int) (*model.User, error)
	GetByUsername(username string) (*model.User, error)
	GetByEmail(email string) (*model.User, error)
	Update(user *model.User, updateSenha bool) error
	Delete(id int) error
	List(limit, offset int) ([]*model.User, error)
	ListAll() ([]*model.User, error)
	Count() (int, error)
}

// userRepository implementa UserRepository
type userRepository struct {
	db *sql.DB
}

// NewUserRepository cria uma nova instância do repositório
func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

// Create cria um novo usuário
func (r *userRepository) Create(user *model.User) error {
	query := `
		INSERT INTO usuarios (username, nome, telefone, email, tipo, troca_senha, senha_hash, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id_usuario, created_at, updated_at`

	err := r.db.QueryRow(
		query,
		user.Username,
		user.Nome,
		user.Telefone,
		user.Email,
		user.Tipo,
		user.TrocaSenha,
		user.SenhaHash,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return fmt.Errorf("erro ao criar usuário: %w", err)
	}

	return nil
}

// GetByID busca usuário por ID
func (r *userRepository) GetByID(id int) (*model.User, error) {
	query := `
		SELECT id_usuario, username, nome, telefone, email, tipo, troca_senha, senha_hash, created_at, updated_at
		FROM usuarios WHERE id_usuario = $1`

	user := &model.User{}
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Nome,
		&user.Telefone,
		&user.Email,
		&user.Tipo,
		&user.TrocaSenha,
		&user.SenhaHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("usuário não encontrado")
		}
		return nil, fmt.Errorf("erro ao buscar usuário: %w", err)
	}

	return user, nil
}

// GetByUsername busca usuário por username
func (r *userRepository) GetByUsername(username string) (*model.User, error) {
	query := `
		SELECT id_usuario, username, nome, telefone, email, tipo, troca_senha, senha_hash, created_at, updated_at
		FROM usuarios WHERE username = $1`

	user := &model.User{}
	err := r.db.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Nome,
		&user.Telefone,
		&user.Email,
		&user.Tipo,
		&user.TrocaSenha,
		&user.SenhaHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("usuário não encontrado")
		}
		return nil, fmt.Errorf("erro ao buscar usuário: %w", err)
	}

	return user, nil
}

// GetByEmail busca usuário por email
func (r *userRepository) GetByEmail(email string) (*model.User, error) {
	query := `
		SELECT id_usuario, username, nome, telefone, email, tipo, troca_senha, senha_hash, created_at, updated_at
		FROM usuarios WHERE email = $1`

	user := &model.User{}
	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Nome,
		&user.Telefone,
		&user.Email,
		&user.Tipo,
		&user.TrocaSenha,
		&user.SenhaHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("usuário não encontrado")
		}
		return nil, fmt.Errorf("erro ao buscar usuário: %w", err)
	}

	return user, nil
}

// Update atualiza um usuário
func (r *userRepository) Update(user *model.User, updateSenha bool) error {
	var query string
	var result sql.Result
	var err error

	if updateSenha {
		// Atualizar incluindo senha
		query = `
			UPDATE usuarios 
			SET username = $1, nome = $2, telefone = $3, email = $4, tipo = $5, troca_senha = $6, senha_hash = $7, updated_at = NOW()
			WHERE id_usuario = $8`
		result, err = r.db.Exec(query, user.Username, user.Nome, user.Telefone, user.Email, user.Tipo, user.TrocaSenha, user.SenhaHash, user.ID)
	} else {
		// Atualizar sem senha
		query = `
			UPDATE usuarios 
			SET username = $1, nome = $2, telefone = $3, email = $4, tipo = $5, troca_senha = $6, updated_at = NOW()
			WHERE id_usuario = $7`
		result, err = r.db.Exec(query, user.Username, user.Nome, user.Telefone, user.Email, user.Tipo, user.TrocaSenha, user.ID)
	}
	if err != nil {
		return fmt.Errorf("erro ao atualizar usuário: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("erro ao verificar linhas afetadas: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("usuário não encontrado")
	}

	return nil
}

// Delete remove um usuário
func (r *userRepository) Delete(id int) error {
	query := `DELETE FROM usuarios WHERE id_usuario = $1`

	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("erro ao deletar usuário: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("erro ao verificar linhas afetadas: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("usuário não encontrado")
	}

	return nil
}

// List lista usuários com paginação
func (r *userRepository) List(limit, offset int) ([]*model.User, error) {
	query := `
		SELECT id_usuario, username, nome, telefone, email, tipo, troca_senha, senha_hash, created_at, updated_at
		FROM usuarios 
		ORDER BY created_at DESC 
		LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar usuários: %w", err)
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		user := &model.User{}
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Nome,
			&user.Telefone,
			&user.Email,
			&user.Tipo,
			&user.TrocaSenha,
			&user.SenhaHash,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear usuário: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

// ListAll lista todos os usuários sem paginação
func (r *userRepository) ListAll() ([]*model.User, error) {
	query := `
		SELECT id_usuario, username, nome, telefone, email, tipo, troca_senha, senha_hash, created_at, updated_at
		FROM usuarios 
		ORDER BY created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar usuários: %w", err)
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		user := &model.User{}
		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.Nome,
			&user.Telefone,
			&user.Email,
			&user.Tipo,
			&user.TrocaSenha,
			&user.SenhaHash,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear usuário: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}

// Count retorna o total de usuários
func (r *userRepository) Count() (int, error) {
	query := `SELECT COUNT(*) FROM usuarios`

	var count int
	err := r.db.QueryRow(query).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("erro ao contar usuários: %w", err)
	}

	return count, nil
}
