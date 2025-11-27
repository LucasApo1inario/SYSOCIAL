package service

import (
	"encoding/base64"
	"fmt"

	"sysocial/internal/file/model"
	"sysocial/internal/file/repository"
)

// FileService interface define os métodos de negócio para arquivos
type FileService interface {
	UploadFile(req *model.UploadRequest) (*model.AnexoResponse, error)
	DownloadFile(id int64) (*model.AnexoResponse, error)
}

// fileService implementa FileService
type fileService struct {
	fileRepo repository.FileRepository
	logger   Logger
}

// Logger interface para logging
type Logger interface {
	Info(args ...interface{})
	Error(args ...interface{})
	Debug(args ...interface{})
}

// NewFileService cria uma nova instância do serviço
func NewFileService(fileRepo repository.FileRepository, logger Logger) FileService {
	return &fileService{
		fileRepo: fileRepo,
		logger:   logger,
	}
}

// UploadFile faz upload de um arquivo
func (s *fileService) UploadFile(req *model.UploadRequest) (*model.AnexoResponse, error) {
	// Decodificar base64 para bytes
	arquivoBytes, err := base64.StdEncoding.DecodeString(req.ArquivoBase64)
	if err != nil {
		return nil, fmt.Errorf("erro ao decodificar arquivo base64: %w", err)
	}

	// Criar anexo
	anexo := &model.Anexo{
		EntidadePai:   req.EntidadePai,
		IDEntidadePai: req.IDEntidadePai,
		Arquivo:       arquivoBytes,
		NomeArquivo:   req.NomeArquivo,
		Extensao:      req.Extensao,
		Observacao:    req.Observacao,
	}

	// Salvar no banco
	err = s.fileRepo.Create(anexo)
	if err != nil {
		return nil, fmt.Errorf("erro ao salvar arquivo: %w", err)
	}

	s.logger.Info("Arquivo salvo com sucesso", "anexo_id", anexo.ID, "nome_arquivo", anexo.NomeArquivo)

	// Converter para response (sem arquivo, apenas metadados)
	response := &model.AnexoResponse{
		ID:            anexo.ID,
		EntidadePai:   anexo.EntidadePai,
		IDEntidadePai: anexo.IDEntidadePai,
		NomeArquivo:   anexo.NomeArquivo,
		Extensao:      anexo.Extensao,
		Observacao:    anexo.Observacao,
	}

	return response, nil
}

// DownloadFile recupera um arquivo do banco
func (s *fileService) DownloadFile(id int64) (*model.AnexoResponse, error) {
	// Buscar anexo no banco
	anexo, err := s.fileRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Converter bytes para base64
	arquivoBase64 := base64.StdEncoding.EncodeToString(anexo.Arquivo)

	s.logger.Info("Arquivo recuperado com sucesso", "anexo_id", anexo.ID, "nome_arquivo", anexo.NomeArquivo)

	// Criar response com arquivo em base64
	response := &model.AnexoResponse{
		ID:            anexo.ID,
		EntidadePai:   anexo.EntidadePai,
		IDEntidadePai: anexo.IDEntidadePai,
		ArquivoBase64: arquivoBase64,
		NomeArquivo:   anexo.NomeArquivo,
		Extensao:      anexo.Extensao,
		Observacao:    anexo.Observacao,
	}

	return response, nil
}





