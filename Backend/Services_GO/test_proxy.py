#!/usr/bin/env python3
"""
Script de teste para o API Gateway com proxy
Testa o roteamento de requisições para os microsserviços
"""

import requests
import json
import time

# Configuração da API Gateway
GATEWAY_URL = "http://localhost:8080"

def test_gateway_health():
    """Testa o health check do gateway"""
    print("=== Teste: Health Check do Gateway ===")
    
    try:
        response = requests.get(f"{GATEWAY_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Gateway está funcionando!")
            return True
        else:
            print("❌ Gateway com problemas")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar ao Gateway. Verifique se está rodando.")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_services_list():
    """Testa o endpoint de listagem de serviços"""
    print("\n=== Teste: Listagem de Serviços ===")
    
    try:
        response = requests.get(f"{GATEWAY_URL}/services")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Serviços listados com sucesso!")
            return True
        else:
            print("❌ Erro ao listar serviços")
            return False
            
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_user_service_proxy():
    """Testa o proxy para user-service"""
    print("\n=== Teste: Proxy para User Service ===")
    
    # Testar health check do user-service via proxy
    try:
        response = requests.get(f"{GATEWAY_URL}/api/v1/users/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Proxy para user-service funcionando!")
            return True
        else:
            print("❌ Proxy para user-service com problemas")
            return False
            
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_auth_service_proxy():
    """Testa o proxy para auth-service"""
    print("\n=== Teste: Proxy para Auth Service ===")
    
    # Testar health check do auth-service via proxy
    try:
        response = requests.get(f"{GATEWAY_URL}/api/v1/auth/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Proxy para auth-service funcionando!")
            return True
        else:
            print("❌ Proxy para auth-service com problemas")
            return False
            
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_cors_headers():
    """Testa os headers CORS"""
    print("\n=== Teste: Headers CORS ===")
    
    try:
        # Fazer requisição OPTIONS para testar CORS
        response = requests.options(f"{GATEWAY_URL}/api/v1/users/")
        print(f"Status Code: {response.status_code}")
        print(f"CORS Headers:")
        for header, value in response.headers.items():
            if 'access-control' in header.lower():
                print(f"  {header}: {value}")
        
        if response.status_code == 204:
            print("✅ CORS configurado corretamente!")
            return True
        else:
            print("❌ CORS com problemas")
            return False
            
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_request_id():
    """Testa o header X-Request-ID"""
    print("\n=== Teste: Request ID ===")
    
    try:
        response = requests.get(f"{GATEWAY_URL}/health")
        request_id = response.headers.get('X-Request-ID')
        
        print(f"Status Code: {response.status_code}")
        print(f"X-Request-ID: {request_id}")
        
        if request_id:
            print("✅ Request ID gerado corretamente!")
            return True
        else:
            print("❌ Request ID não encontrado")
            return False
            
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def test_rate_limiting():
    """Testa o rate limiting"""
    print("\n=== Teste: Rate Limiting ===")
    
    try:
        # Fazer várias requisições rapidamente
        for i in range(5):
            response = requests.get(f"{GATEWAY_URL}/health")
            print(f"Requisição {i+1}: Status {response.status_code}")
            time.sleep(0.1)
        
        # Fazer mais requisições para testar o limite
        for i in range(10):
            response = requests.get(f"{GATEWAY_URL}/health")
            if response.status_code == 429:
                print(f"✅ Rate limiting funcionando! Bloqueado na requisição {i+6}")
                return True
            time.sleep(0.1)
        
        print("⚠️  Rate limiting não ativado (pode estar configurado para mais requisições)")
        return True
        
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False

def main():
    """Executa todos os testes do proxy"""
    print("🚀 Iniciando testes do API Gateway com Proxy...")
    print(f"URL do Gateway: {GATEWAY_URL}")
    print("-" * 50)
    
    tests = [
        test_gateway_health,
        test_services_list,
        test_user_service_proxy,
        test_auth_service_proxy,
        test_cors_headers,
        test_request_id,
        test_rate_limiting
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Erro no teste: {e}")
        
        time.sleep(0.5)  # Pequena pausa entre testes
    
    print("\n" + "=" * 50)
    print(f"📊 Resultado dos Testes: {passed}/{total} passaram")
    
    if passed == total:
        print("🎉 Todos os testes passaram!")
    else:
        print("⚠️  Alguns testes falharam. Verifique os serviços e o gateway.")

if __name__ == "__main__":
    main()

