@echo off
REM Setup script for Nostressia Backend - WINDOWS ONLY
REM This script ensures Python 3.10 is used for the virtual environment

echo ================================================
echo Nostressia Backend Environment Setup
echo ================================================
echo.

REM Check if .venv exists and is in use
if exist .venv (
    echo [WARNING] Existing .venv detected.
    echo Please ensure no Python processes are using it.
    echo Press Ctrl+C to cancel, or
    pause
    echo Removing old .venv...
    rmdir /s /q .venv
    if errorlevel 1 (
        echo [ERROR] Failed to remove .venv. Please close all Python processes and try again.
        pause
        exit /b 1
    )
)

echo Creating new virtual environment with Python 3.10...
py -3.10 -m venv .venv

if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment.
    echo Make sure Python 3.10 is installed: py -3.10 --version
    pause
    exit /b 1
)

echo.
echo Verifying Python version...
.venv\Scripts\python --version

echo.
echo Installing dependencies...
.venv\Scripts\python -m pip install --upgrade pip
.venv\Scripts\pip install -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo ================================================
echo Setup complete!
echo ================================================
echo.
echo To activate the environment, run:
echo   .venv\Scripts\activate
echo.
echo To start the backend server, run:
echo   .venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
echo.
pause
