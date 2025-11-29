# Exemplos de Requisições - Chamadas e Presenças API

## Base URL
```
http://localhost:8080/api/v1  (via Gateway)
http://localhost:8086/api/v1    (direto no serviço)
```

---

## 📋 ENDPOINTS DE CHAMADAS

### 1. Criar Chamada
**POST** `/chamadas`

**Request Body:**
```json
{
  "usuarioId": 1,
  "turmaId": 5,
  "dataAula": "2024-01-15"
}
```

**Response (201 Created):**
```json
{
  "message": "Chamada criada com sucesso",
  "id": 1
}
```

---

### 2. Listar Chamadas por Turma
**GET** `/chamadas/turma/:turmaId`

**Exemplo:**
```
GET /api/v1/chamadas/turma/5
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "usuarioId": 1,
    "turmaId": 5,
    "dataAula": "2024-01-15"
  },
  {
    "id": 2,
    "usuarioId": 1,
    "turmaId": 5,
    "dataAula": "2024-01-22"
  },
  {
    "id": 3,
    "usuarioId": 2,
    "turmaId": 5,
    "dataAula": "2024-01-29"
  }
]
```

**Nota:** As chamadas são ordenadas por data (mais recente primeiro).

---

### 3. Atualizar Chamada
**PUT** `/chamadas/:id`

**Request Body (todos os campos são opcionais):**
```json
{
  "usuarioId": 2,
  "turmaId": 6,
  "dataAula": "2024-01-20"
}
```

**Exemplo de atualização parcial:**
```json
{
  "dataAula": "2024-01-20"
}
```

**Response (200 OK):**
```json
{
  "message": "Chamada atualizada com sucesso"
}
```

---

## ✅ ENDPOINTS DE PRESENÇAS

### 4. Listar Presenças por Chamada
**GET** `/presencas/chamada/:chamadaId`

**Exemplo:**
```
GET /api/v1/presencas/chamada/1
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "chamadaId": 1,
    "alunoId": 10,
    "presente": true,
    "observacao": "Chegou atrasado"
  },
  {
    "id": 2,
    "chamadaId": 1,
    "alunoId": 11,
    "presente": false,
    "observacao": "Falta justificada"
  },
  {
    "id": 3,
    "chamadaId": 1,
    "alunoId": 12,
    "presente": true,
    "observacao": ""
  }
]
```

**Nota:** As presenças são ordenadas por ID do aluno.

---

### 5. Criar Múltiplas Presenças
**POST** `/presencas`

**Request Body:**
```json
{
  "chamadaId": 1,
  "presencas": [
    {
      "alunoId": 10,
      "presente": true,
      "observacao": "Chegou atrasado"
    },
    {
      "alunoId": 11,
      "presente": false,
      "observacao": "Falta justificada"
    },
    {
      "alunoId": 12,
      "presente": true,
      "observacao": ""
    }
  ]
}
```

**Campos opcionais:**
- `observacao` (pode ser string vazia ou omitida)

**Exemplo mínimo:**
```json
{
  "chamadaId": 1,
  "presencas": [
    {
      "alunoId": 10,
      "presente": true
    },
    {
      "alunoId": 11,
      "presente": false
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Presenças criadas com sucesso",
  "quantidade": 3
}
```

**Nota:** Todas as presenças são criadas em uma única transação. Se houver erro em qualquer uma, todas são revertidas.

---

### 6. Deletar Todas as Presenças de uma Chamada
**DELETE** `/presencas/chamada/:chamadaId`

**Exemplo:**
```
DELETE /api/v1/presencas/chamada/1
```

**Response (200 OK):**
```json
{
  "message": "Presenças deletadas com sucesso"
}
```

**Nota:** Deleta todas as presenças associadas à chamada especificada.

---

## 📋 EXEMPLOS COMPLETOS DE FLUXO

### Fluxo 1: Criar chamada e registrar presenças

**1. Criar a chamada:**
```bash
POST /api/v1/chamadas
{
  "usuarioId": 1,
  "turmaId": 5,
  "dataAula": "2024-01-15"
}
```

**2. Registrar presenças:**
```bash
POST /api/v1/presencas
{
  "chamadaId": 1,
  "presencas": [
    {"alunoId": 10, "presente": true, "observacao": ""},
    {"alunoId": 11, "presente": false, "observacao": "Falta justificada"},
    {"alunoId": 12, "presente": true, "observacao": ""}
  ]
}
```

**3. Consultar presenças:**
```bash
GET /api/v1/presencas/chamada/1
```

**4. Se necessário, deletar e recriar:**
```bash
DELETE /api/v1/presencas/chamada/1
# Depois criar novamente com POST /api/v1/presencas
```

---

## ⚠️ VALIDAÇÕES E REGRAS

### Chamadas:
- `usuarioId`: obrigatório, deve existir na tabela usuarios
- `turmaId`: obrigatório, deve existir na tabela turma
- `dataAula`: obrigatório, formato YYYY-MM-DD
- Ao atualizar, se `turmaId` for alterado, a turma deve existir

### Presenças:
- `chamadaId`: obrigatório, deve existir na tabela chamada
- `alunoId`: obrigatório, deve existir na tabela aluno e estar ativo (`ativo = true`)
- `presente`: boolean (default: false se não informado)
- `observacao`: opcional, string
- Todas as presenças são criadas em transação única
- Se qualquer aluno não existir ou estiver inativo, toda a operação é revertida

---

## 🔍 CÓDIGOS DE STATUS HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Dados inválidos ou faltando
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

---

## 📝 NOTAS

1. Todos os endpoints retornam JSON
2. O formato de data deve ser `YYYY-MM-DD` (ex: "2024-01-15")
3. Campos opcionais podem ser omitidos nas requisições
4. Para atualizações (PUT), apenas os campos que deseja alterar precisam ser enviados
5. A criação de múltiplas presenças é atômica (transação única)
6. Apenas alunos ativos podem ter presenças registradas
7. Ao deletar presenças, todas as presenças da chamada são removidas



