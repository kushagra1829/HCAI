@echo off
setlocal
cd /d "%~dp0"
title AI Fairness Lab - Python Server

echo ============================================================
echo           AI FAIRNESS LAB -- Starting Python Server
echo ============================================================
echo.

:: Detect Python executable
set "PYTHON_EXE="
if exist "C:\Python314\python.exe" set "PYTHON_EXE=C:\Python314\python.exe"
if not defined PYTHON_EXE (
    if exist "%LocalAppData%\Programs\Python\Python312\python.exe" set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python312\python.exe"
)
if not defined PYTHON_EXE (
    if exist "%LocalAppData%\Programs\Python\Python311\python.exe" set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python311\python.exe"
)
if not defined PYTHON_EXE (
    where py >nul 2>nul && set "PYTHON_EXE=py"
)
if not defined PYTHON_EXE (
    where python >nul 2>nul && set "PYTHON_EXE=python"
)

if not defined PYTHON_EXE (
    echo [ERROR] Python was not found.
    echo Please make sure Python is installed.
    echo.
    pause
    exit /b 1
)

echo [OK] Using Python: "%PYTHON_EXE%"
echo [OK] Launching web server on http://127.0.0.1:8000 ...
echo [OK] Opening browser automatically in 2 seconds...
echo.

:: Launch browser in background after 2 seconds to ensure server is listening
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8000"

:: Start the Python server (keeps window open with logs)
"%PYTHON_EXE%" server.py
pause
