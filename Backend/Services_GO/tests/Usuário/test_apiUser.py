import requests
import pytest
import random
url = "http://localhost:8082"

# Abre uma única requisição no servidor para rodar todos os testes
@pytest.fixture
def api_client():
    return requests.Session()

# Testa se a API está rodando
def test_health_api(api_client):
    response = api_client.get(f"{url}/health")
    assert response.status_code == 200 #API funcionando corretamente

# Testa a criação de um usuários com o formato do json adequado
def test_new_user_correct(api_client):
    r = random.randint(1, 100000)
    teste_json = {
        "username": f"Arthur{r} Luz",
        "nome": "Arthur",
        "telefone": "11999999999",
        "email": f"arthur@teste{r}.com", 
        "senha": "1234567",            
        "tipo": "U",
        "troca_senha": False
    }

    rota = f"{url}/api/v1/auth/register"
    response = api_client.post(rota, json=teste_json)
    assert response.status_code == 201 #Usuário criado com sucesso

# Testa a criação de um usuário com formato do json fora do padrão estabelecido
def test_new_user_wrong(api_client):
   r = random.randint(1, 100000)
   json_errado = {
        "username": "teste",
        "nome": "Arthur",
        "telefone": "11999999991",
        "email": f"teste@email{r}.com", 
        "senha": "1234567",            
        "tipo": "X", # Letra Inválida   
        "troca_senha": False              
    }
   rota = f"{url}/api/v1/auth/register"
   response = api_client.post(rota, json=json_errado)
   assert response.status_code == 400 #Dados inválidos

# Testa a criação de um usuário duplicado
def test_duplicated_user(api_client):
    r = random.randint(1, 100000)
    json_duplicado = {
        "username": f"teste-duplicado{r}",
        "nome": "Arthur-duplicado",
        "telefone": "11999999992",
        "email": "duplicado@teste.com", 
        "senha": "SenhaDuplicada!",            
        "tipo": "A",
        "troca_senha": False
    }

    rota = f"{url}/api/v1/auth/register"
    response_1 = api_client.post(rota, json=json_duplicado)
    response_2 = api_client.post(rota, json=json_duplicado) # Chamado pela segunda vez para criar o mesmo usuário
    assert response_1.status_code == 201 #Usuário criado
    assert response_2.status_code == 400 # Dados inválidos/duplicados

# Testa os limites de tamanho de senha e username
def test_limits(api_client):
    r = random.randint(1, 100000)
    json_name_limit = { # O username tem limite de 20 caracteres para ser aceito
        "username": "a" *21,
        "nome": "Nome_teste",
        "telefone": "11999999993",
        "email": "nomegramde@teste.com", 
        "senha": "SenhaNormal",            
        "tipo": "U",
        "troca_senha": False
    }

    json_password_limit = { # A senha precisa ter no mínimo 6 caracteres
        "username": "Username-Normal",
        "nome": "Senha-Limite",
        "telefone": "11999999994",
        "email": "senhacurta@teste.com", 
        "senha": "12345",            
        "tipo": "U",
        "troca_senha": False
    }
    rota = f"{url}/api/v1/auth/register"
    response_1 = api_client.post(rota, json=json_name_limit)
    response_2 = api_client.post(rota, json=json_password_limit)
    assert response_1.status_code == 400 # Falha na criação do usuário pois 21 ultrapassa o limite de 20 caracteres do username
    assert response_2.status_code == 400   # Falha na criação do usuário pois são necessários no mínimo 6 caracteres para registrar uma senha

# Testa a criação do usuário com campos obrigatórios não preenchidos
def test_compulsory_fields_missing(api_client):
    r = random.randint(1, 100000)
    json_compulsory = {
        "username": "Username",
        "nome": "Nome",
        "telefone": "11999999995",
        #"email": "senhacurta@teste.com",
        "senha": "12345678",            
        "tipo": "A",
        "troca_senha": False
    }
    rota = f"{url}/api/v1/auth/register"
    response = api_client.post(rota, json=json_compulsory)
    assert response.status_code == 400 # Falha na criação



    