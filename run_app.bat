@echo off
title CYBER-RADAR | Fake Profile Detection System Launcher
echo ===================================================================
echo   CYBER-RADAR: Social Media Fake Profile Detection System
echo   Architecture: Modern HTML5/CSS3/JS UI + Python FastAPI Backend
echo ===================================================================
echo.
cd /d "%~dp0"
call .venv\Scripts\activate.bat

echo Starting FastAPI server at http://127.0.0.1:8000 ...
start "" "http://127.0.0.1:8000"
uvicorn server:app --host 127.0.0.1 --port 8000 --reload
pause
