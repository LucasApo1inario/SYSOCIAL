package proxy

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// ServiceConfig configuração de um serviço
type ServiceConfig struct {
	Name    string
	BaseURL string
	Health  string
	Timeout time.Duration
}

// ProxyManager gerencia os proxies para diferentes serviços
type ProxyManager struct {
	services map[string]*ServiceConfig
	client   *http.Client
}

// NewProxyManager cria um novo gerenciador de proxy
func NewProxyManager() *ProxyManager {
	return &ProxyManager{
		services: make(map[string]*ServiceConfig),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// RegisterService registra um serviço
func (pm *ProxyManager) RegisterService(name string, config *ServiceConfig) {
	pm.services[name] = config
}

// ProxyRequest faz proxy de uma requisição para um serviço
func (pm *ProxyManager) ProxyRequest(serviceName string, w http.ResponseWriter, r *http.Request) error {
	service, exists := pm.services[serviceName]
	if !exists {
		http.Error(w, "Serviço não encontrado", http.StatusNotFound)
		return fmt.Errorf("serviço %s não encontrado", serviceName)
	}

	// Construir URL de destino
	targetURL, err := pm.buildTargetURL(service, r)
	if err != nil {
		http.Error(w, "Erro ao construir URL de destino", http.StatusInternalServerError)
		return err
	}

	// Criar requisição para o serviço de destino
	req, err := pm.createTargetRequest(r, targetURL)
	if err != nil {
		http.Error(w, "Erro ao criar requisição", http.StatusInternalServerError)
		return err
	}

	// Executar requisição
	resp, err := pm.client.Do(req)
	if err != nil {
		http.Error(w, "Erro ao conectar com o serviço", http.StatusBadGateway)
		return err
	}
	defer resp.Body.Close()

	// Copiar headers da resposta
	pm.copyHeaders(resp.Header, w.Header())

	// Copiar status code
	w.WriteHeader(resp.StatusCode)

	// Copiar body da resposta
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		return fmt.Errorf("erro ao copiar resposta: %w", err)
	}

	return nil
}

// buildTargetURL constrói a URL de destino
func (pm *ProxyManager) buildTargetURL(service *ServiceConfig, r *http.Request) (string, error) {
	// Remover o prefixo do gateway da URL
	path := strings.TrimPrefix(r.URL.Path, "/api/v1")

	// Construir URL completa - manter o prefixo /api/v1 para os serviços
	targetURL := service.BaseURL + "/api/v1" + path
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	return targetURL, nil
}

// createTargetRequest cria a requisição para o serviço de destino
func (pm *ProxyManager) createTargetRequest(originalReq *http.Request, targetURL string) (*http.Request, error) {
	// Parse da URL de destino
	parsedURL, err := url.Parse(targetURL)
	if err != nil {
		return nil, err
	}

	// Ler body da requisição original
	var body io.Reader
	if originalReq.Body != nil {
		bodyBytes, err := io.ReadAll(originalReq.Body)
		if err != nil {
			return nil, err
		}
		body = bytes.NewReader(bodyBytes)
	}

	// Criar nova requisição
	req, err := http.NewRequest(originalReq.Method, parsedURL.String(), body)
	if err != nil {
		return nil, err
	}

	// Copiar headers (exceto alguns específicos)
	pm.copyHeaders(originalReq.Header, req.Header)

	// Remover headers que não devem ser proxied
	req.Header.Del("Host")
	req.Header.Del("Connection")
	req.Header.Del("Upgrade")
	req.Header.Del("Proxy-Connection")
	req.Header.Del("Proxy-Authenticate")
	req.Header.Del("Proxy-Authorization")
	req.Header.Del("Te")
	req.Header.Del("Trailers")
	req.Header.Del("Transfer-Encoding")

	// Adicionar headers de proxy
	req.Header.Set("X-Forwarded-For", originalReq.RemoteAddr)
	req.Header.Set("X-Forwarded-Proto", "http")
	req.Header.Set("X-Forwarded-Host", originalReq.Host)

	return req, nil
}

// copyHeaders copia headers de uma requisição/resposta para outra
func (pm *ProxyManager) copyHeaders(source http.Header, target http.Header) {
	for key, values := range source {
		for _, value := range values {
			target.Add(key, value)
		}
	}
}

// HealthCheck verifica a saúde de um serviço
func (pm *ProxyManager) HealthCheck(serviceName string) (bool, error) {
	service, exists := pm.services[serviceName]
	if !exists {
		return false, fmt.Errorf("serviço %s não encontrado", serviceName)
	}

	resp, err := pm.client.Get(service.BaseURL + service.Health)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK, nil
}

// GetAllServices retorna todos os serviços registrados
func (pm *ProxyManager) GetAllServices() map[string]*ServiceConfig {
	return pm.services
}
