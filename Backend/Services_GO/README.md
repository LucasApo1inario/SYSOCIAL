# SYSOCIAL - Microsserviços Go

Sistema de microsserviços desenvolvido em Go para gerenciamento de usuários e autenticação, seguindo as melhores práticas de Clean Architecture e Domain-Driven Design.

## 📁 Estrutura do Projeto

```
Backend/Services_GO/
├── cmd/                                    # Pontos de entrada dos microsserviços
│   ├── user-service/
│   │   └── main.go                        # Serviço de usuários (porta 8081)
│   ├── auth-service/
│   │   └── main.go                        # Serviço de autenticação (porta 8082)
│   ├── notification-service/
│   │   └── main.go                        # Serviço de notificações (porta 8083)
│   └── api-gateway/
│       └── main.go                        # Gateway da API (porta 8080)
├── internal/                              # Código privado da aplicação
│   ├── user/                              # Domínio User
│   │   ├── handler/
│   │   │   └── user_handler.go            # HTTP handlers
│   │   ├── service/
│   │   │   └── user_service.go            # Lógica de negócio
│   │   ├── repository/
│   │   │   └── user_repository.go         # Acesso a dados
│   │   ├── model/
│   │   │   └── user.go                    # Estruturas de dados
│   │   └── middleware/                    # Middlewares específicos do domínio
│   ├── auth/                              # Domínio Auth
│   │   ├── handler/
│   │   ├── service/
│   │   ├── repository/
│   │   └── model/
│   │       └── auth.go                    # Modelos de autenticação
│   └── shared/                            # Código compartilhado
│       ├── config/
│       │   └── config.go                 # Configurações centralizadas
│       ├── database/
│       │   └── database.go               # Conexão com banco de dados
│       ├── logger/
│       │   └── logger.go                 # Sistema de logs
│       ├── utils/                         # Utilitários compartilhados
│       └── middleware/                    # Middlewares globais
├── pkg/                                   # Código público reutilizável
│   ├── client/                            # Clientes HTTP/gRPC
│   ├── validator/                         # Validações customizadas
│   └── crypto/                           # Funções de criptografia
├── api/                                   # Especificações de API
│   ├── openapi/                          # Documentação OpenAPI/Swagger
│   └── proto/                            # Arquivos .proto para gRPC
├── deployments/                          # Configurações de deploy
│   ├── docker/                           # Dockerfiles
│   ├── kubernetes/                       # Manifests Kubernetes
│   └── docker-compose/                   # Docker Compose
├── scripts/                              # Scripts de automação
│   ├── build.sh                          # Script de build
│   ├── test.sh                           # Script de testes
│   └── deploy.sh                         # Script de deploy
├── tests/                                # Testes de integração
│   ├── integration/                      # Testes de integração
│   └── e2e/                              # Testes end-to-end
├── docs/                                 # Documentação
├── configs/                              # Arquivos de configuração
│   └── dev.env                           # Configurações de desenvolvimento
├── migrations/                           # Migrações de banco de dados
│   ├── user/                             # Migrações do domínio user
│   └── auth/                             # Migrações do domínio auth
├── go.mod                                # Módulo Go
├── go.sum                                # Checksums das dependências
├── config.env                            # Variáveis de ambiente
└── README.md                             # Este arquivo
```

## 🏗️ Arquitetura

### Clean Architecture

O projeto segue os princípios da Clean Architecture, organizando o código em camadas:

- **Handlers**: Camada de apresentação (HTTP)
- **Services**: Camada de aplicação (lógica de negócio)
- **Repositories**: Camada de infraestrutura (acesso a dados)
- **Models**: Entidades de domínio

### Domain-Driven Design (DDD)

Cada domínio é organizado de forma independente:

- **User Domain**: Gerenciamento de usuários
- **Auth Domain**: Autenticação e autorização
- **Shared**: Código compartilhado entre domínios

## 🚀 Microsserviços

### 1. User Service (Porta 8081)

**Responsabilidades:**
- CRUD de usuários
- Validação de senhas
- Gerenciamento de perfis

**Endpoints:**
- `POST /api/v1/users/` - Criar usuário
- `GET /api/v1/users/:id` - Buscar usuário por ID
- `PUT /api/v1/users/:id` - Atualizar usuário
- `DELETE /api/v1/users/:id` - Deletar usuário
- `GET /api/v1/users/` - Listar usuários (com paginação)
- `POST /api/v1/users/validate` - Validar senha

### 2. Auth Service (Porta 8082)

**Responsabilidades:**
- Login/Logout
- Geração de tokens JWT
- Validação de tokens
- Refresh tokens

**Endpoints:**
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/validate` - Validar token

### 3. API Gateway (Porta 8080)

**Responsabilidades:**
- Roteamento de requisições
- Load balancing
- Rate limiting
- Autenticação centralizada

### 4. Notification Service (Porta 8083)

**Responsabilidades:**
- Envio de notificações
- Templates de email
- Webhooks

## 🛠️ Tecnologias Utilizadas

### Backend
- **Go 1.21+**: Linguagem principal
- **Gin**: Framework web
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e sessões
- **JWT**: Autenticação
- **PBKDF2**: Hash de senhas

### Ferramentas
- **Docker**: Containerização
- **Kubernetes**: Orquestração
- **Git**: Controle de versão
- **Make**: Automação

## 📋 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DB_HOST=aws-1-sa-east-1.pooler.supabase.com
DB_PORT=5432
DB_USER=postgres.vujwxqbjsiznaoyhzaod
DB_PASSWORD=unifesp@engsoft##sysocial
DB_NAME=postgres
DB_SSLMODE=require

# Portas dos Serviços
USER_SERVICE_PORT=8081
AUTH_SERVICE_PORT=8082
NOTIFICATION_SERVICE_PORT=8083
GATEWAY_PORT=8080

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# Logs
LOG_LEVEL=debug
LOG_FORMAT=json

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 🚀 Executando o Projeto

### Pré-requisitos

- Go 1.21+
- PostgreSQL
- Redis (opcional)

### Instalação

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd SYSOCIAL/Backend/Services_GO
```

2. **Instale as dependências:**
```bash
go mod tidy
```

3. **Configure as variáveis de ambiente:**
```bash
cp configs/dev.env .env
# Edite o arquivo .env com suas configurações
```

4. **Execute os serviços:**

**User Service:**
```bash
go run cmd/user-service/main.go
```

**Auth Service:**
```bash
go run cmd/auth-service/main.go
```

**API Gateway:**
```bash
go run cmd/api-gateway/main.go
```

### Docker

```bash
# Build das imagens
docker build -t sysocial/user-service -f deployments/docker/user-service.Dockerfile .
docker build -t sysocial/auth-service -f deployments/docker/auth-service.Dockerfile .

# Executar com Docker Compose
docker-compose -f deployments/docker-compose/docker-compose.yml up -d
```

## 🧪 Testes

### Testes Unitários
```bash
go test ./...
```

### Testes com Cobertura
```bash
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

### Testes de Integração
```bash
go test ./tests/integration/...
```

## 📊 Monitoramento

### Health Checks

Cada serviço possui um endpoint de health check:

- User Service: `GET http://localhost:8081/health`
- Auth Service: `GET http://localhost:8082/health`
- API Gateway: `GET http://localhost:8080/health`

### Logs

Os logs são estruturados em JSON e incluem:
- Timestamp
- Level (debug, info, warn, error)
- Message
- Context (user_id, request_id, etc.)

## 🔒 Segurança

### Hash de Senhas
- **Algoritmo**: PBKDF2 com SHA-256
- **Iterações**: 100.000
- **Salt**: 32 bytes aleatórios
- **Hash**: 32 bytes

### JWT
- **Algoritmo**: HS256
- **Expiração**: Configurável (padrão 24h)
- **Refresh Token**: Implementado

### Validação
- **Entrada**: Validação de dados com tags
- **SQL Injection**: Proteção com prepared statements
- **XSS**: Sanitização de entrada

## 📈 Escalabilidade

### Horizontal Scaling
- Cada microsserviço pode ser escalado independentemente
- Load balancer no API Gateway
- Stateless services

### Vertical Scaling
- Otimização de queries
- Connection pooling
- Cache com Redis

## 🔧 Desenvolvimento

### Estrutura de Commits
```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração
test: adiciona testes
chore: tarefas de manutenção
```

### Code Review
- Pull requests obrigatórios
- Testes devem passar
- Cobertura mínima de 80%
- Lint sem erros

## 📚 Documentação da API

### Swagger/OpenAPI
A documentação da API está disponível em:
- User Service: `http://localhost:8081/docs`
- Auth Service: `http://localhost:8082/docs`
- API Gateway: `http://localhost:8080/docs`

### Exemplos de Uso

**Criar Usuário:**
```bash
curl -X POST http://localhost:8081/api/v1/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "nome": "Usuário Teste",
    "email": "teste@example.com",
    "senha": "senha123",
    "tipo": "user"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8082/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "senha": "senha123"
  }'
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

- **Desenvolvedor**: [Seu Nome]
- **Email**: [seu.email@exemplo.com]

## 📞 Suporte

Para suporte, entre em contato:
- **Email**: suporte@sysocial.com
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/sysocial/issues)

---

**Última atualização**: Dezembro 2024

