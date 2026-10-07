@echo off
setlocal
cd /d "%~dp0"
title AI Fairness Lab - Node.js Server

echo ============================================================
echo           AI FAIRNESS LAB -- Starting Node.js Server
echo ============================================================
echo.

:: Detect Node executable
set "NODE_EXE="
if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not defined NODE_EXE (
    if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"
)
if not defined NODE_EXE (
    where node >nul 2>nul && set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo [ERROR] Node.js was not found.
    echo Please make sure Node.js is installed.
    echo.
    pause
    exit /b 1
)

echo [OK] Using Node.js: "%NODE_EXE%"
echo [OK] Launching web server on http://127.0.0.1:3000 ...
echo [OK] Opening browser automatically in 2 seconds...
echo.

:: Launch browser in background after 2 seconds to ensure server is listening
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:3000"

:: Start the Node server (keeps window open with logs)
"%NODE_EXE%" local-server.js
pause
