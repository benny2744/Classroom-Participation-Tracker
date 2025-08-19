@echo off
title Classroom Participation Tracker

REM Classroom Participation Tracker - One-Click Startup Script for Windows
REM This script starts both the backend server and frontend React app

cd /d "%~dp0"

echo.
echo 🚀 Starting Classroom Participation Tracker...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Kill any existing Node.js processes (rough cleanup)
echo 🔍 Checking for existing processes...
taskkill /f /im node.exe >nul 2>&1

REM Start the application using npm run dev
echo 🌟 Launching Classroom Participation Tracker...
echo    - Backend server will start on port 3001
echo    - Frontend React app will start on port 3000
echo    - Your browser should open automatically
echo.
echo 💡 To stop the application, press Ctrl+C in this window
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Start both services
npm run dev

echo.
echo 👋 Application stopped. Press any key to exit...
pause >nul