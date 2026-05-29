@echo off
title Murza Inversiones — CPG Sync

:: ── CONFIGURACIÓN ─────────────────────────────────────────────────────────
:: Cambia esta ruta si instalaste el CPG en otro lugar
set CPG_DIR=C:\IBGateway

:: Contraseña del portal admin
set ADMIN_PASS=Portal2026

:: ──────────────────────────────────────────────────────────────────────────

if "%ADMIN_PASS%"=="" (
  echo ERROR: Agrega tu password en este archivo ^(linea 9^)
  pause
  exit /b 1
)

if not exist "%CPG_DIR%\bin\run.bat" (
  echo ERROR: No se encontro el CPG en %CPG_DIR%
  echo Descargalo de: https://www.interactivebrokers.com/en/trading/ib-api.php
  pause
  exit /b 1
)

echo Iniciando IB Client Portal Gateway ^(paper trading^)...
start "IB Gateway" cmd /k "cd /d %CPG_DIR% && bin\run.bat root\conf.yaml"

echo Esperando 15 segundos para que inicie el gateway...
timeout /t 15 /nobreak >nul

echo Abriendo browser para autenticacion...
start "" https://localhost:5000

echo.
echo ────────────────────────────────────────────
echo  Haz login en el browser con tu cuenta IB
echo  paper trading ^(DUH274100^)
echo.
echo  Cuando termines de hacer login, presiona
echo  cualquier tecla para iniciar el sync.
echo ────────────────────────────────────────────
echo.
pause

echo.
echo Iniciando keepalive y sync automatico...
echo ^(Deja esta ventana abierta — cierra para detener^)
echo.

cd /d %~dp0backend
set ADMIN_PASS=%ADMIN_PASS%
node keepalive.mjs

pause
