# Classroom Participation Tracker - One-Click Startup Script for Windows PowerShell
# This script starts both the backend server and frontend React app

# Set window title
$Host.UI.RawUI.WindowTitle = "Classroom Participation Tracker"

# Change to script directory
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "🚀 Starting Classroom Participation Tracker..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Visit: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Kill any existing Node.js processes (more precise cleanup)
Write-Host "🔍 Checking for existing processes..." -ForegroundColor Blue
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "🛑 Stopping existing Node.js processes..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
}

# Start the application using npm run dev
Write-Host "🌟 Launching Classroom Participation Tracker..." -ForegroundColor Green
Write-Host "   - Backend server will start on port 3001" -ForegroundColor Cyan
Write-Host "   - Frontend React app will start on port 3000" -ForegroundColor Cyan
Write-Host "   - Your browser should open automatically" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To stop the application, press Ctrl+C in this window" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Start both services
try {
    npm run dev
} catch {
    Write-Host ""
    Write-Host "❌ Application encountered an error" -ForegroundColor Red
}

Write-Host ""
Write-Host "👋 Application stopped. Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")