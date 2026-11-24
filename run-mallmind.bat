@echo off
title MallMind Launcher
color 0A
echo ===================================================
echo     MALLMIND AI - ALPHA ONE MALL DIGITAL TWIN
echo   Nexus Ahmedabad One, Vastrapur, Ahmedabad, Gujarat
echo   Multilingual ASR (Gujarati / Hindi / English)
echo   RAG Vector Database + LLM + Google Maps Wayfinding
echo ===================================================
echo.

:: 1. Ensure Docker Postgres container is up
echo [1/4] Checking PostgreSQL Docker container...
docker start mallmind-postgres >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] PostgreSQL container 'mallmind-postgres' is active on port 5433.
) else (
    echo [NOTE] Docker container 'mallmind-postgres' already running or Docker not in PATH.
)
echo.

:: 2. Launch Python Model Service (Port 8001)
echo [2/4] Starting AI Model Service on http://localhost:8001...
start "MallMind AI Service (Port 8001)" cmd /k "cd /d %~dp0model-service && .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8001 --reload"
timeout /t 3 /nobreak >nul
echo [OK] AI Model Service launched.
echo.

:: 3. Launch Java Spring Boot Backend (Port 8085)
echo [3/4] Starting Spring Boot Backend on http://localhost:8085...
start "MallMind Backend (Port 8085)" cmd /k "cd /d %~dp0backend && java -jar target\mallmind-backend-0.0.1-SNAPSHOT.jar --server.port=8085"
timeout /t 4 /nobreak >nul
echo [OK] Java Spring Boot Backend launched.
echo.

:: 4. Launch Vite Frontend (Port 5173)
echo [4/4] Starting React Vite Frontend on http://localhost:5173...
start "MallMind Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo [OK] Frontend server launched.
echo.

echo ===================================================
echo   All 3 services are running in their own windows!
echo   Opening MallMind AI in your default browser...
echo ===================================================
start http://localhost:5173
echo.
echo Press any key to exit this launcher window (services stay running).
pause >nul
