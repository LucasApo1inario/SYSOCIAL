import pytest
import requests
import random

url = "http://localhost:8082"
# Abre uma única requisição no servidor para rodar todos os testes
@pytest.fixture
def api_client():
    return requests.Session()

# Testa se a API está rodando
def test_health_api(api_client):
    response = api_client.get(f"{url}/health")
    assert response.status_code == 200 #API funcionando

# Testa a criação de um usuários com o formato do json adequado
def test_new_user_correct(api_client):
    r = random.randint(1000, 99999)
    email = f"{r}@teste.com"
    teste_json = {
        "username" : f"{r}_user",
        "nome": "Arthur Luz",
        "email": email,
        "senha": "SenhaTeste123",
        "tipo": "A",
        "troca_senha": False
    }
    rota = f"{url}/api/v1/auth/register"
    response = api_client.post(rota, json=teste_json)
    assert response.status_code == 201 #Usuário criado com sucesso
# Testa a criação de um usuário com formato do json fora do padrão estabelecido
def test_new_user_wrong(api_client):
   json_errado = {
        "username": "teste",
        "nome": "Arthur",
        "email": "email-sem-arroba", # Email fora de formatação
        "senha": "123",  # Senha curta demais            
        "tipo": "X"     # Letra Inválida             
    }
   rota = f"{url}/api/v1/auth/register"
   response = api_client.post(rota, json=json_errado)
   assert response.status_code == 400 # Dados inválidos
# Testa a criação de um usuário duplicado
def test_duplicates_user(api_client):
    r = random.randint(1000, 99999)
    json_duplicado = {
        "username": f"teste-duplicado{r}",
        "nome": "Arthur-duplicado",
        "email": f"duplicado@teste{r}.com", 
        "senha": "SenhaDuplicada!",            
        "tipo": "A"
    }
    rota = f"{url}/api/v1/auth/register"
    response_1 = api_client.post(rota, json=json_duplicado)
    response_2 = api_client.post(rota, json=json_duplicado) # Chamado pela segunda vez para criar o mesmo usuário
    assert response_1.status_code == 201 #Usuário criado com sucesso
    assert response_2.status_code == 400 # Dados inválidos (Duplicados)


