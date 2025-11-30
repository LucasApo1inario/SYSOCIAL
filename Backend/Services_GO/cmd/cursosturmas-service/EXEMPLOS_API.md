# Exemplos de Requisições - Cursos e Turmas API

## Base URL
```
http://localhost:8080/api/v1  (via Gateway)
http://localhost:8085/api/v1    (direto no serviço)
```

---

## 🎓 ENDPOINTS DE CURSOS

### 1. Criar Curso
**POST** `/cursos`

**Request Body:**
```json
{
  "nome": "Matemática Básica",
  "vagasTotais": 30,
  "ativo": true
}
```

**Response (201 Created):**
```json
{
  "message": "Curso criado com sucesso",
  "id": 1
}
```

---

### 2. Listar Todos os Cursos
**GET** `/cursos`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "nome": "Matemática Básica",
    "vagasTotais": 30,
    "ativo": true,
    "vagasRestantes": 30
  },
  {
    "id": 2,
    "nome": "Português Avançado",
    "vagasTotais": 25,
    "ativo": true,
    "vagasRestantes": 20
  }
]
```

---

### 3. Buscar Curso por ID
**GET** `/cursos/1`

**Response (200 OK):**
```json
{
  "id": 1,
  "nome": "Matemática Básica",
  "vagasTotais": 30,
  "ativo": true,
  "vagasRestantes": 30
}
```

---

### 4. Atualizar Curso
**PUT** `/cursos/1`

**Request Body (todos os campos são opcionais):**
```json
{
  "nome": "Matemática Intermediária",
  "vagasTotais": 35,
  "ativo": true,
  "vagasRestantes": 28
}
```

**Response (200 OK):**
```json
{
  "message": "Curso atualizado com sucesso"
}
```

**Exemplo de atualização parcial:**
```json
{
  "nome": "Matemática Avançada"
}
```

---

### 5. Deletar Curso
**DELETE** `/cursos/1`

**Response (200 OK):**
```json
{
  "message": "Curso deletado com sucesso"
}
```

**Nota:** Não é possível deletar um curso que possui turmas associadas.

---

### 6. Buscar Curso com Todas as Turmas
**GET** `/cursos/1/turmas`

**Response (200 OK):**
```json
{
  "curso": {
    "id": 1,
    "nome": "Matemática Básica",
    "vagasTotais": 30,
    "ativo": true,
    "vagasRestantes": 30
  },
  "turmas": [
    {
      "id": 1,
      "cursoId": 1,
      "diaSemana": "Segunda-feira",
      "vagasTurma": 15,
      "nomeTurma": "Turma A - Manhã",
      "descricao": "Turma para iniciantes",
      "horaInicio": "08:00:00",
      "horaFim": "10:00:00",
      "dataInicio": "2025-01-15",
      "dataFim": "2025-06-30"
    },
    {
      "id": 2,
      "cursoId": 1,
      "diaSemana": "Quarta-feira",
      "vagasTurma": 15,
      "nomeTurma": "Turma B - Tarde",
      "descricao": "Turma para iniciantes",
      "horaInicio": "14:00:00",
      "horaFim": "16:00:00",
      "dataInicio": "2025-01-15",
      "dataFim": "2025-06-30"
    }
  ]
}
```

---

## 📚 ENDPOINTS DE TURMAS

### 1. Criar Turma
**POST** `/turmas`

**Request Body:**
```json
{
  "cursoId": 1,
  "diaSemana": "Segunda-feira",
  "vagasTurma": 15,
  "nomeTurma": "Turma A - Manhã",
  "descricao": "Turma para iniciantes em matemática básica",
  "horaInicio": "08:00:00",
  "horaFim": "10:00:00",
  "dataInicio": "2025-01-15",
  "dataFim": "2025-06-30"
}
```

**Campos opcionais:**
- `descricao`
- `horaInicio`
- `horaFim`

**Campos obrigatórios:**
- `cursoId`
- `diaSemana`
- `vagasTurma`
- `nomeTurma`
- `dataInicio` (formato: YYYY-MM-DD)
- `dataFim` (formato: YYYY-MM-DD)

**Exemplo mínimo (apenas campos obrigatórios):**
```json
{
  "cursoId": 1,
  "diaSemana": "Segunda-feira",
  "vagasTurma": 15,
  "nomeTurma": "Turma A - Manhã",
  "dataInicio": "2025-01-15",
  "dataFim": "2025-06-30"
}
```

**Response (201 Created):**
```json
{
  "message": "Turma criada com sucesso",
  "id": 1
}
```

---

### 2. Listar Todas as Turmas
**GET** `/turmas`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "cursoId": 1,
    "diaSemana": "Segunda-feira",
    "vagasTurma": 15,
    "nomeTurma": "Turma A - Manhã",
    "descricao": "Turma para iniciantes",
    "horaInicio": "08:00:00",
    "horaFim": "10:00:00",
    "dataInicio": "2025-01-15",
    "dataFim": "2025-06-30"
  },
  {
    "id": 2,
    "cursoId": 1,
    "diaSemana": "Quarta-feira",
    "vagasTurma": 15,
    "nomeTurma": "Turma B - Tarde",
    "descricao": "Turma para iniciantes",
    "horaInicio": "14:00:00",
    "horaFim": "16:00:00",
    "dataInicio": "2025-01-15",
    "dataFim": "2025-06-30"
  },
  {
    "id": 3,
    "cursoId": 2,
    "diaSemana": "Terça-feira",
    "vagasTurma": 20,
    "nomeTurma": "Turma Português - Manhã",
    "descricao": null,
    "horaInicio": null,
    "horaFim": null,
    "dataInicio": "2025-02-01",
    "dataFim": "2025-07-15"
  }
]
```

---

### 3. Buscar Turma por ID
**GET** `/turmas/1`

**Response (200 OK):**
```json
{
  "id": 1,
  "cursoId": 1,
  "diaSemana": "Segunda-feira",
  "vagasTurma": 15,
  "nomeTurma": "Turma A - Manhã",
  "descricao": "Turma para iniciantes",
  "horaInicio": "08:00:00",
  "horaFim": "10:00:00",
  "dataInicio": "2025-01-15",
  "dataFim": "2025-06-30"
}
```

---

### 4. Atualizar Turma
**PUT** `/turmas/1`

**Request Body (todos os campos são opcionais):**
```json
{
  "cursoId": 1,
  "diaSemana": "Terça-feira",
  "vagasTurma": 20,
  "nomeTurma": "Turma A - Manhã Atualizada",
  "descricao": "Nova descrição da turma",
  "horaInicio": "09:00:00",
  "horaFim": "11:00:00",
  "dataInicio": "2025-02-01",
  "dataFim": "2025-07-15"
}
```

**Exemplo de atualização parcial:**
```json
{
  "vagasTurma": 20,
  "nomeTurma": "Turma A - Manhã Expandida"
}
```

**Response (200 OK):**
```json
{
  "message": "Turma atualizada com sucesso"
}
```

---

### 5. Deletar Turma
**DELETE** `/turmas/1`

**Response (200 OK):**
```json
{
  "message": "Turma deletada com sucesso"
}
```

---

### 6. Buscar Alunos de uma Turma
**GET** `/turmas/1/alunos`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "nome": "João Silva"
  },
  {
    "id": 2,
    "nome": "Maria Santos"
  },
  {
    "id": 3,
    "nome": "Pedro Oliveira"
  }
]
```

**Nota:** Retorna apenas alunos ativos (`ativo = true`) que estão matriculados na turma. A lista é ordenada por nome.

---

## 📋 EXEMPLOS COMPLETOS DE FLUXO

### Fluxo 1: Criar um curso completo com turmas

**1. Criar o curso:**
```bash
POST /api/v1/cursos
{
  "nome": "Inglês Básico",
  "vagasTotais": 40,
  "ativo": true
}
```

**2. Criar turma 1:**
```bash
POST /api/v1/turmas
{
  "cursoId": 1,
  "diaSemana": "Segunda-feira",
  "vagasTurma": 20,
  "nomeTurma": "Turma Manhã - Segunda",
  "descricao": "Aulas de inglês básico pela manhã",
  "horaInicio": "08:00:00",
  "horaFim": "10:00:00",
  "dataInicio": "2025-01-15",
  "dataFim": "2025-06-30"
}
```

**3. Criar turma 2:**
```bash
POST /api/v1/turmas
{
  "cursoId": 1,
  "diaSemana": "Quarta-feira",
  "vagasTurma": 20,
  "nomeTurma": "Turma Tarde - Quarta",
  "descricao": "Aulas de inglês básico pela tarde",
  "horaInicio": "14:00:00",
  "horaFim": "16:00:00",
  "dataInicio": "2025-01-15",
  "dataFim": "2025-06-30"
}
```

**4. Buscar curso com todas as turmas:**
```bash
GET /api/v1/cursos/1/turmas
```

---

## ⚠️ VALIDAÇÕES E REGRAS

### Cursos:
- `nome`: obrigatório, string
- `vagasTotais`: obrigatório, inteiro maior que 0
- `ativo`: opcional, boolean (default: true)
- `vagasRestantes`: calculado automaticamente na criação (igual a vagasTotais)
- Não é possível deletar curso com turmas associadas

### Turmas:
- `cursoId`: obrigatório, deve existir na tabela curso
- `diaSemana`: obrigatório, string
- `vagasTurma`: obrigatório, inteiro maior que 0
- `nomeTurma`: obrigatório, string
- `dataInicio`: obrigatório, formato date (YYYY-MM-DD)
- `dataFim`: obrigatório, formato date (YYYY-MM-DD)
- `descricao`: opcional, string
- `horaInicio`: opcional, formato time (HH:MM:SS)
- `horaFim`: opcional, formato time (HH:MM:SS)

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
2. Campos opcionais podem ser omitidos nas requisições
3. Para atualizações (PUT), apenas os campos que deseja alterar precisam ser enviados
4. O formato de hora deve ser `HH:MM:SS` (ex: "08:00:00", "14:30:00")
5. O campo `vagasRestantes` é gerenciado automaticamente pelo sistema

