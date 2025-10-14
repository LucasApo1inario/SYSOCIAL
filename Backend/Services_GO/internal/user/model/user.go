package model

import "time"

// User representa um usuário no sistema
type User struct {
	ID        int       `json:"id" db:"id_usuario"`
	Username  string    `json:"username" db:"username"`
	Nome      string    `json:"nome" db:"nome"`
	Telefone  string    `json:"telefone" db:"telefone"`
	Email     string    `json:"email" db:"email"`
	Tipo      string    `json:"tipo" db:"tipo"`
	SenhaHash string    `json:"-" db:"senha_hash"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CreateUserRequest representa a requisição de criação de usuário
type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=20"`
	Nome     string `json:"nome" validate:"required,min=2,max=50"`
	Telefone string `json:"telefone" validate:"omitempty,min=10,max=15"`
	Email    string `json:"email" validate:"required,email"`
	Senha    string `json:"senha" validate:"required,min=6"`
	Tipo     string `json:"tipo" validate:"required,oneof=admin user moderator"`
}

// UpdateUserRequest representa a requisição de atualização de usuário
type UpdateUserRequest struct {
	Nome     string `json:"nome" validate:"omitempty,min=2,max=50"`
	Telefone string `json:"telefone" validate:"omitempty,min=10,max=15"`
	Email    string `json:"email" validate:"omitempty,email"`
	Tipo     string `json:"tipo" validate:"omitempty,oneof=admin user moderator"`
}

// UserResponse representa a resposta de usuário (sem dados sensíveis)
type UserResponse struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Nome      string    `json:"nome"`
	Telefone  string    `json:"telefone"`
	Email     string    `json:"email"`
	Tipo      string    `json:"tipo"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToResponse converte User para UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Nome:      u.Nome,
		Telefone:  u.Telefone,
		Email:     u.Email,
		Tipo:      u.Tipo,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

