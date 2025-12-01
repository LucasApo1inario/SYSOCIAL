import requests
import pytest
import random
url = "http://localhost:8085"

# Abre uma única requisição no servidor para rodar todos os testes
@pytest.fixture
def api_client():
    return requests.Session()

@pytest.fixture
def valid_course_id(api_client):
    r = random.randint(1000, 9999)
    teste_json = {
        "nome": f"Curso-Fixture-{r}",
        "vagasTotais": 30,
        "ativo": True
    }
    rota_curso = f"{url}/api/v1/cursos"
    response = api_client.post(rota_curso, json=teste_json)
    
    assert response.status_code == 201, f"Falha ao criar curso fixture: {response.status_code}"
    course_id = response.json().get('id')
    assert course_id is not None, "ID do curso não foi retornado"
    return course_id

# Testa se a API está rodando
def test_health_api(api_client):
    response = api_client.get(f"{url}/health")
    assert response.status_code == 200 #API funcionando corretamente

# Testa a criação de um curso com o formato do json adequado
def test_new_course_correct(api_client):
    t = random.randint(1, 30)
    r = random.randint(1000, 10000)
    teste_json = {
        "nome": f"Arthur-Teste{r}",
        "vagasTotais": t,
        "ativo": False
    }
    rota = f"{url}/api/v1/cursos"
    response = api_client.post(rota, json=teste_json)
    assert response.status_code == 201 # Curso criado com sucesso

# Testa a criação de uma turma com o formato json adequado
def test_new_class_correct(api_client, valid_course_id):
    nova_classe = {
        "cursoId": valid_course_id,
        "diaSemana": "Terça Feira",
        "vagasTurma": 30,
        "nomeTurma": "Turma 1",
        "descricao": "Turma do curso X",
        "horaInicio": "14:00:00",
        "horaFim": "16:00:00",
        "dataInicio": "2025-01-15",
        "dataFim": "2025-06-30"
    }
    rota = f"{url}/api/v1/turmas"
    response = api_client.post(rota, json=nova_classe)    
    assert response.status_code == 201 # Turma criada com sucesso

# Testa a criação de um curso com formato do json fora do padrão estabelecido
def test_new_course_wrong(api_client):
    r = random.randint(1000, 10000)
    json_wrong = {
        "nome": f"Testando {r}",
        "vagasTotais": 0,
        "ativo": True
    }
    rota = f"{url}/api/v1/cursos"
    response = api_client.post(rota, json=json_wrong)
    assert response.status_code == 400 # Um curso precisa ter no mínimo uma vaga

# Testa a criação de uma turma com formato do json fora do padrão estabelecido
def test_new_class_wrong(api_client, valid_course_id):
    json_class_wrong = {
        "cursoId": valid_course_id,
        "diaSemana": "Quarta",
        "vagasTurma": 12,
        "nomeTurma": "Turma 2",
        "descricao": "Turma do curso Y",
        "horaInicio": "15:00:00",
        "horaFim": "17:00:00",
        "dataInicio": "25-01-16", # Data fora do padrão estabelecido
        "dataFim": "25-07-30" # Data fora do padrão estabelecido
    }
    rota = f"{url}/api/v1/turmas"
    response = api_client.post(rota, json=json_class_wrong)
    assert response.status_code == 400 

# Testa a criação de um curso duplicado
def test_duplicated_course(api_client):
    r = random.randint(1000, 10000)
    json_duplicated = {
        "nome": f"Curso1{r}",
        "vagasTotais": 30,
        "ativo": True
    }
    rota = f"{url}/api/v1/cursos"
    response_1 = api_client.post(rota, json=json_duplicated)
    response_2 = api_client.post(rota, json=json_duplicated)
    assert response_1.status_code == 201 #Curso criado
    assert response_2.status_code == 400 # Dados inválidos/duplicados

# Testa a criação de uma turma duplicada
def test_duplicated_class(api_client, valid_course_id):
    r = random.randint(1000, 10000)
    json_class_duplicado = {
        "cursoId": valid_course_id,
        "diaSemana": "Quinta Feira",
        "vagasTurma": 5,
        "nomeTurma": f"Turma {r}",
        "descricao": "Turma do curso Z",
        "horaInicio": "08:00:00",
        "horaFim": "10:00:00",
        "dataInicio": "2025-01-15",
        "dataFim": "2025-06-30" 
    }
    rota = f"{url}/api/v1/turmas"
    response_1 = api_client.post(rota, json=json_class_duplicado)
    response_2 = api_client.post(rota, json=json_class_duplicado)
    assert response_1.status_code == 201 #Turma criada
    assert response_2.status_code == 400 # Dados inválidos/duplicados


# Testa os limites dos campos de turma
def test_limits_class(api_client, valid_course_id):
    json_limite = {
        "cursoId": valid_course_id,
        "diaSemana": "Quinta Feira",
        "vagasTurma": -1, # Precisa haver no mínimo 1 vaga na turma cadastrada
        "nomeTurma": "Turma 4",
        "descricao": "Turma do curso w",
        "horaInicio": "09:00:00",
        "horaFim": "11:00:00",
        "dataInicio": "2025-01-17",
        "dataFim": "2025-06-29"
    }
    rota = f"{url}/api/v1/turmas"
    response = api_client.post(rota, json=json_limite)
    assert response.status_code == 400

# Testa se há campos obrigatórios vazios na criação do curso  
def test_compulsory_fields_missing_course(api_client):
    json = {
        "nome": "teste",
        #"vagasTotais": 14,
        "ativo": True
    }
    rota = f"{url}/api/v1/cursos"
    response = api_client.post(rota, json=json)
    assert response.status_code == 400

# Testa se há campos obrigatórios vazios na criação da turma
def test_compulsory_fields_missing_class(api_client, valid_course_id):
     json_missing = {
        "cursoId": valid_course_id,
        #"diaSemana": "Sexta Feira",
        "vagasTurma": 18, 
        "nomeTurma": "Turma 6",
        "descricao": "Turma do curso M",
        "horaInicio": "09:00:00",
        "horaFim": "11:00:00",
        "dataInicio": "2025-01-18",
        "dataFim": "2025-06-26"
    }
     rota = f"{url}/api/v1/turmas"
     response = api_client.post(rota, json= json_missing)
     assert response.status_code == 400







    
