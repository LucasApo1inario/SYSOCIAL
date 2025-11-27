package repository

import (
	"database/sql"
)

// AuthRepository interface para o repositório de autenticação
type AuthRepository interface {
	// Métodos específicos de autenticação podem ser adicionados aqui
	// Por enquanto, usaremos o UserRepository para as operações
}

type authRepository struct {
	db *sql.DB
}

// NewAuthRepository cria uma nova instância do AuthRepository
func NewAuthRepository(db *sql.DB) AuthRepository {
	return &authRepository{
		db: db,
	}
}
