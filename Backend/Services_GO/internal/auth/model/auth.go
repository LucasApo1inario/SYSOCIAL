package model

import "time"

// LoginRequest representa a requisição de login
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Senha    string `json:"senha" validate:"required"`
}

// RegisterRequest representa a requisição de registro
type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=20"`
	Nome     string `json:"nome" validate:"required,min=2,max=50"`
	Telefone string `json:"telefone" validate:"omitempty,min=10,max=15"`
	Email    string `json:"email" validate:"required,email"`
	Senha    string `json:"senha" validate:"required,min=6"`
	Tipo     string `json:"tipo" validate:"required,oneof=admin user moderator"`
}

// AuthResponse representa a resposta de autenticação
type AuthResponse struct {
	Token     string   `json:"token"`
	ExpiresAt int64    `json:"expires_at"`
	User      UserInfo `json:"user"`
}

// UserInfo representa informações básicas do usuário
type UserInfo struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Nome     string `json:"nome"`
	Email    string `json:"email"`
	Tipo     string `json:"tipo"`
}

// RefreshTokenRequest representa a requisição de refresh token
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// LogoutRequest representa a requisição de logout
type LogoutRequest struct {
	Token string `json:"token" validate:"required"`
}

// ValidateTokenRequest representa a requisição de validação de token
type ValidateTokenRequest struct {
	Token string `json:"token" validate:"required"`
}

// TokenInfo representa informações do token
type TokenInfo struct {
	Valid     bool      `json:"valid"`
	UserID    int       `json:"user_id,omitempty"`
	Username  string    `json:"username,omitempty"`
	ExpiresAt time.Time `json:"expires_at,omitempty"`
}

