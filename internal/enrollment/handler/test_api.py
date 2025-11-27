import pytest
import requests

url = "http://localhost:8084"
def test_api_client():
    return requests.Session()

def test_health_api():
    URL = f"{url}/health"
    print(f"Testando {url}")
    response = requests.get(URL)
    assert response.status_code == 200
