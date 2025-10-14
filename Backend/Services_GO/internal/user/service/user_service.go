package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"sysocial/internal/user/model"
	"sysocial/internal/user/repository"

	"golang.org/x/crypto/pbkdf2"
)

// UserService interface define os métodos de negócio para usuários
type UserService interface {
	CreateUser(req *model.CreateUserRequest) (*model.UserResponse, error)
	GetUserByID(id int) (*model.UserResponse, error)
	GetUserByUsername(username string) (*model.UserResponse, error)
	UpdateUser(id int, req *model.UpdateUserRequest) (*model.UserResponse, error)
	DeleteUser(id int) error
	ListUsers(limit, offset int) ([]*model.UserResponse, int, error)
	ValidatePassword(username, password string) (*model.UserResponse, error)
}

// userService implementa UserService
type userService struct {
	userRepo repository.UserRepository
	logger   Logger
}

// Logger interface para logging
type Logger interface {
	Info(args ...interface{})
	Error(args ...interface{})
	Debug(args ...interface{})
}

// NewUserService cria uma nova instância do serviço
func NewUserService(userRepo repository.UserRepository, logger Logger) UserService {
	return &userService{
		userRepo: userRepo,
		logger:   logger,
	}
}

// CreateUser cria um novo usuário
func (s *userService) CreateUser(req *model.CreateUserRequest) (*model.UserResponse, error) {
	// Verificar se username já existe
	existingUser, err := s.userRepo.GetByUsername(req.Username)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("username já existe")
	}

	// Verificar se email já existe
	existingUser, err = s.userRepo.GetByEmail(req.Email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("email já existe")
	}

	// Hash da senha
	hashedPassword, err := s.hashPassword(req.Senha)
	if err != nil {
		return nil, fmt.Errorf("erro ao processar senha: %w", err)
	}

	// Criar usuário
	user := &model.User{
		Username:  req.Username,
		Nome:      req.Nome,
		Telefone:  req.Telefone,
		Email:     req.Email,
		Tipo:      req.Tipo,
		SenhaHash: hashedPassword,
	}

	err = s.userRepo.Create(user)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar usuário: %w", err)
	}

	s.logger.Info("Usuário criado com sucesso", "user_id", user.ID, "username", user.Username)
	response := user.ToResponse()
	return &response, nil
}

// GetUserByID busca usuário por ID
func (s *userService) GetUserByID(id int) (*model.UserResponse, error) {
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	response := user.ToResponse()
	return &response, nil
}

// GetUserByUsername busca usuário por username
func (s *userService) GetUserByUsername(username string) (*model.UserResponse, error) {
	user, err := s.userRepo.GetByUsername(username)
	if err != nil {
		return nil, err
	}

	response := user.ToResponse()
	return &response, nil
}

// UpdateUser atualiza um usuário
func (s *userService) UpdateUser(id int, req *model.UpdateUserRequest) (*model.UserResponse, error) {
	// Buscar usuário existente
	user, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Atualizar campos fornecidos
	if req.Nome != "" {
		user.Nome = req.Nome
	}
	if req.Telefone != "" {
		user.Telefone = req.Telefone
	}
	if req.Email != "" {
		// Verificar se email já existe em outro usuário
		existingUser, err := s.userRepo.GetByEmail(req.Email)
		if err == nil && existingUser != nil && existingUser.ID != id {
			return nil, fmt.Errorf("email já existe")
		}
		user.Email = req.Email
	}
	if req.Tipo != "" {
		user.Tipo = req.Tipo
	}

	err = s.userRepo.Update(user)
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar usuário: %w", err)
	}

	s.logger.Info("Usuário atualizado com sucesso", "user_id", user.ID)
	response := user.ToResponse()
	return &response, nil
}

// DeleteUser remove um usuário
func (s *userService) DeleteUser(id int) error {
	err := s.userRepo.Delete(id)
	if err != nil {
		return err
	}

	s.logger.Info("Usuário deletado com sucesso", "user_id", id)
	return nil
}

// ListUsers lista usuários com paginação
func (s *userService) ListUsers(limit, offset int) ([]*model.UserResponse, int, error) {
	users, err := s.userRepo.List(limit, offset)
	if err != nil {
		return nil, 0, err
	}

	total, err := s.userRepo.Count()
	if err != nil {
		return nil, 0, err
	}

	var userResponses []*model.UserResponse
	for _, user := range users {
		response := user.ToResponse()
		userResponses = append(userResponses, &response)
	}

	return userResponses, total, nil
}

// ValidatePassword valida senha do usuário
func (s *userService) ValidatePassword(username, password string) (*model.UserResponse, error) {
	user, err := s.userRepo.GetByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("usuário não encontrado")
	}

	// Verificar senha
	if !s.verifyPassword(password, user.SenhaHash) {
		return nil, fmt.Errorf("senha inválida")
	}

	s.logger.Info("Senha validada com sucesso", "user_id", user.ID, "username", user.Username)
	response := user.ToResponse()
	return &response, nil
}

// hashPassword gera hash da senha usando PBKDF2
func (s *userService) hashPassword(password string) (string, error) {
	salt := make([]byte, 32)
	_, err := rand.Read(salt)
	if err != nil {
		return "", err
	}

	hash := pbkdf2.Key([]byte(password), salt, 100000, 32, sha256.New)
	combined := append(salt, hash...)
	return hex.EncodeToString(combined), nil
}

// verifyPassword verifica se a senha está correta
func (s *userService) verifyPassword(password, storedHash string) bool {
	decoded, err := hex.DecodeString(storedHash)
	if err != nil {
		return false
	}

	salt := decoded[:32]
	storedHashBytes := decoded[32:]

	hash := pbkdf2.Key([]byte(password), salt, 100000, 32, sha256.New)
	return hex.EncodeToString(hash) == hex.EncodeToString(storedHashBytes)
}
