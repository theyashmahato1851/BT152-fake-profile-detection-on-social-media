@echo off
title Fake Profile Detection System - Launcher
echo ========================================================
echo  Launching Fake Profile Detection Web Application
echo ========================================================
echo.
cd /d "%~dp0"
call .venv\Scripts\activate.bat
echo Starting Streamlit server on http://localhost:8501 ...
streamlit run fake.py
pause
