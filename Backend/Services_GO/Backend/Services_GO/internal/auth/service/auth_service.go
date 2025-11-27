package service

import (
	"errors"
	"time"

	"sysocial/internal/auth/model"
	authrepository "sysocial/internal/auth/repository"
	"sysocial/internal/shared/config"
	"sysocial/internal/shared/jwt"
	"sysocial/internal/shared/logger"
	usermodel "sysocial/internal/user/model"
	userrepository "sysocial/internal/user/repository"

	"golang.org/x/crypto/bcrypt"
)

// AuthService interface para o serviço de autenticação
type AuthService interface {
	Login(req *model.LoginRequest) (*model.AuthResponse, error)
	Register(req *model.RegisterRequest) (*model.AuthResponse, error)
	ValidateToken(token string) (*model.TokenInfo, error)
}

type authService struct {
	authRepo authrepository.AuthRepository
	userRepo userrepository.UserRepository
	logger   logger.Logger
	jwtMgr   *jwt.JWTManager
}

// NewAuthService cria uma nova instância do AuthService
func NewAuthService(authRepo authrepository.AuthRepository, userRepo userrepository.UserRepository, logger logger.Logger) AuthService {
	cfg := config.Load()

	// Parsear duração do token
	tokenDuration, err := time.ParseDuration(cfg.JWT.Expiration)
	if err != nil {
		tokenDuration = 24 * time.Hour // Default 24h
	}

	jwtMgr := jwt.NewJWTManager(cfg.JWT.Secret, tokenDuration)

	return &authService{
		authRepo: authRepo,
		userRepo: userRepo,
		logger:   logger,
		jwtMgr:   jwtMgr,
	}
}

// Login autentica um usuário
func (s *authService) Login(req *model.LoginRequest) (*model.AuthResponse, error) {
	// Buscar usuário por username
	user, err := s.userRepo.GetByUsername(req.Username)
	if err != nil {
		s.logger.Error("Erro ao buscar usuário", err)
		return nil, errors.New("credenciais inválidas")
	}

	// Verificar senha
	err = bcrypt.CompareHashAndPassword([]byte(user.SenhaHash), []byte(req.Senha))
	if err != nil {
		s.logger.Error("Senha inválida", err)
		return nil, errors.New("credenciais inválidas")
	}

	// Gerar token JWT
	token, err := s.jwtMgr.GenerateToken(user.ID, user.Username, user.Email, user.Tipo)
	if err != nil {
		s.logger.Error("Erro ao gerar token", err)
		return nil, errors.New("erro interno do servidor")
	}

	// Calcular expiração
	expiresAt := time.Now().Add(24 * time.Hour).Unix()

	return &model.AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User: model.UserInfo{
			ID:         user.ID,
			Username:   user.Username,
			Nome:       user.Nome,
			Email:      user.Email,
			Tipo:       user.Tipo,
			TrocaSenha: user.TrocaSenha,
		},
	}, nil
}

// Register registra um novo usuário
func (s *authService) Register(req *model.RegisterRequest) (*model.AuthResponse, error) {
	// Verificar se usuário já existe
	existingUser, _ := s.userRepo.GetByUsername(req.Username)
	if existingUser != nil {
		return nil, errors.New("username já existe")
	}

	// Hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Senha), bcrypt.DefaultCost)
	if err != nil {
		s.logger.Error("Erro ao gerar hash da senha", err)
		return nil, errors.New("erro interno do servidor")
	}

	// Criar usuário
	user := &usermodel.User{
		Username:   req.Username,
		Nome:       req.Nome,
		Telefone:   req.Telefone,
		Email:      req.Email,
		SenhaHash:  string(hashedPassword),
		Tipo:       req.Tipo,
		TrocaSenha: req.TrocaSenha,
	}

	// Salvar usuário
	err = s.userRepo.Create(user)
	if err != nil {
		s.logger.Error("Erro ao criar usuário", err)
		return nil, errors.New("erro interno do servidor")
	}

	// Buscar usuário criado para obter o ID
	createdUser, err := s.userRepo.GetByUsername(user.Username)
	if err != nil {
		s.logger.Error("Erro ao buscar usuário criado", err)
		return nil, errors.New("erro interno do servidor")
	}

	// Gerar token JWT
	token, err := s.jwtMgr.GenerateToken(createdUser.ID, createdUser.Username, createdUser.Email, createdUser.Tipo)
	if err != nil {
		s.logger.Error("Erro ao gerar token", err)
		return nil, errors.New("erro interno do servidor")
	}

	// Calcular expiração
	expiresAt := time.Now().Add(24 * time.Hour).Unix()

	return &model.AuthResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User: model.UserInfo{
			ID:       createdUser.ID,
			Username: createdUser.Username,
			Nome:     createdUser.Nome,
			Email:    createdUser.Email,
			Tipo:     createdUser.Tipo,
		},
	}, nil
}

// ValidateToken valida um token JWT
func (s *authService) ValidateToken(token string) (*model.TokenInfo, error) {
	claims, err := s.jwtMgr.ValidateToken(token)
	if err != nil {
		return &model.TokenInfo{
			Valid: false,
		}, nil
	}

	return &model.TokenInfo{
		Valid:     true,
		UserID:    claims.UserID,
		Username:  claims.Username,
		ExpiresAt: claims.ExpiresAt.Time,
	}, nil
}
