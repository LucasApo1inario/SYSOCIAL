@echo off
setlocal

REM ============================================
REM CONFIGURAÇÕES
REM ============================================
set BUILD_DIR=C:\Users\Arthur\Downloads\SYSOCIAL\SYSOCIAL\browser
set ZIP_NAME=build.zip

set SERVER_USER=ubuntu
set SERVER_IP=64.181.170.230
set SERVER_DIR=/var/www/html
set PEM_KEY=E:\OneDrive\Faculdade\ProjetoES\Oracle\ssh-key-2025-10-25.key

REM ============================================
REM ZIP DA BUILD
REM ============================================
echo Compactando build...
powershell Compress-Archive -Path "%BUILD_DIR%\*" -DestinationPath "%ZIP_NAME%" -Force

IF %ERRORLEVEL% NEQ 0 (
    echo ERRO ao compactar a build.
    exit /b 1
)

REM ============================================
REM UPLOAD VIA SCP
REM ============================================
echo Enviando build para o servidor...
scp -i "%PEM_KEY%" "%ZIP_NAME%" %SERVER_USER%@%SERVER_IP%:/tmp/%ZIP_NAME%

IF %ERRORLEVEL% NEQ 0 (
    echo ERRO ao enviar via SCP.
    exit /b 1
)

REM ============================================
REM DEPLOY VIA SSH
REM ============================================
echo Executando deploy no servidor...

ssh -i "%PEM_KEY%" %SERVER_USER%@%SERVER_IP% "sudo rm -rf %SERVER_DIR%/* ; sudo unzip -o /tmp/%ZIP_NAME% -d %SERVER_DIR% || true ; sudo rm /tmp/%ZIP_NAME% ; sudo systemctl restart nginx"

IF %ERRORLEVEL% NEQ 0 (
    echo ERRO durante o deploy no servidor.
    exit /b 1
)

echo ============================================
echo DEPLOY CONCLUIDO COM SUCESSO!
echo ============================================

pause
