@echo off
cd /d %~dp0

docker build -f api-gateway/Dockerfile -t arthxrlosxno/sysocial:apigatewaye2.1 ../
docker build -f user-service/Dockerfile -t arthxrlosxno/sysocial:userservice2.1 ../
docker build -f auth-service/Dockerfile -t arthxrlosxno/sysocial:authservice2.1 ../
docker build -f file-service/Dockerfile -t arthxrlosxno/sysocial:fileservice2.1 ../
docker build -f enrollment-service/Dockerfile -t arthxrlosxno/sysocial:enrollservice2.1 ../
docker build -f cursosturmas-service/Dockerfile -t arthxrlosxno/sysocial:cursosturmaservice2.1 ../

docker push arthxrlosxno/sysocial:apigatewaye2.1
docker push arthxrlosxno/sysocial:userservice2.1
docker push arthxrlosxno/sysocial:authservice2.1
docker push arthxrlosxno/sysocial:fileservice2.1
docker push arthxrlosxno/sysocial:enrollservice2.1
docker push arthxrlosxno/sysocial:cursosturmaservice2.1