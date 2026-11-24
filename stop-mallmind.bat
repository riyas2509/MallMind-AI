@echo off
title Stop MallMind Services
color 0C
echo ===================================================
echo           STOPPING ALL MALLMIND SERVICES
echo ===================================================
echo.

echo Stopping processes on port 8001 (Python AI Service)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo Stopping processes on port 8085 (Spring Boot Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8085 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo Stopping processes on port 5173 (Vite Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo.
echo [OK] All MallMind services have been stopped.
timeout /t 3 >nul
