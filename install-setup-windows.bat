@echo off
title Classroom Participation Tracker - Installation & Setup

REM Classroom Participation Tracker - Install & Configuration Script for Windows
REM This script installs Node.js, sets up the project, and configures everything

echo.
echo 🚀 Classroom Participation Tracker - Installation ^& Setup
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

cd /d "%~dp0"
set SCRIPT_DIR=%CD%

echo 🔧 Step 1: Checking System Requirements
echo.

REM Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo ✅ Running on Windows %VERSION%

REM Check if Node.js is installed
echo 🔧 Step 2: Checking Node.js Installation
echo.

node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js is already installed: !NODE_VERSION!
    
    REM Check Node.js version (basic check for v16+)
    for /f "tokens=1 delims=v" %%a in ('node --version') do (
        for /f "tokens=1 delims=." %%b in ("%%a") do (
            if %%b LSS 16 (
                echo ⚠️  Node.js version is too old. Please update to version 16 or higher
                echo    Visit: https://nodejs.org/ to download the latest version
                pause
                exit /b 1
            )
        )
    )
    echo ✅ Node.js version is compatible
) else (
    echo ❌ Node.js is not installed!
    echo.
    echo 📋 To install Node.js:
    echo    1. Visit https://nodejs.org/
    echo    2. Download the LTS version for Windows
    echo    3. Run the installer with default settings
    echo    4. Restart this script after installation
    echo.
    pause
    start https://nodejs.org/
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm is available: v!NPM_VERSION!
) else (
    echo ❌ npm is not available
    pause
    exit /b 1
)

REM Check Git (optional but recommended)
echo 🔧 Step 3: Checking Git Installation
echo.

git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo ✅ Git is available: !GIT_VERSION!
) else (
    echo ⚠️  Git is not installed ^(optional but recommended^)
    echo    Visit: https://git-scm.com/download/windows to install Git
)

REM Install project dependencies
echo 🔧 Step 4: Installing Project Dependencies
echo.

if exist "package.json" (
    echo 📦 Installing npm dependencies...
    npm install
    if %errorlevel% equ 0 (
        echo ✅ Dependencies installed successfully
    ) else (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ❌ package.json not found! Make sure you're in the project directory.
    pause
    exit /b 1
)

REM Windows Firewall configuration
echo 🔧 Step 5: Windows Firewall Configuration
echo.

echo ℹ️  Configuring Windows Firewall for Node.js...
echo    This allows other devices to connect to your classroom tracker

REM Try to add firewall rules (requires admin rights)
netsh advfirewall firewall show rule name="Node.js Server" >nul 2>&1
if %errorlevel% neq 0 (
    echo 📋 Adding firewall rules for ports 3000 and 3001...
    netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
    netsh advfirewall firewall add rule name="Node.js Server Port 3001" dir=in action=allow protocol=TCP localport=3001 >nul 2>&1
    
    if %errorlevel% equ 0 (
        echo ✅ Firewall rules added successfully
    ) else (
        echo ⚠️  Could not automatically add firewall rules ^(requires admin rights^)
        echo    You may need to manually allow Node.js through Windows Firewall
    )
) else (
    echo ✅ Firewall rules already configured
)

REM Create desktop shortcuts
echo 🔧 Step 6: Setting up Desktop Shortcuts
echo.

set /p CREATE_SHORTCUTS="Create desktop shortcuts for easy access? (y/n): "
if /i "%CREATE_SHORTCUTS%"=="y" (
    REM Create batch file shortcut
    echo Creating desktop shortcut...
    
    set DESKTOP=%USERPROFILE%\Desktop
    set SHORTCUT_NAME=Classroom Participation Tracker.lnk
    
    REM Use PowerShell to create shortcut
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%'); $Shortcut.TargetPath = '%SCRIPT_DIR%\start-classroom-tracker.bat'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.IconLocation = 'shell32.dll,21'; $Shortcut.Description = 'Start Classroom Participation Tracker'; $Shortcut.Save()" >nul 2>&1
    
    if exist "%DESKTOP%\%SHORTCUT_NAME%" (
        echo ✅ Desktop shortcut created successfully
    ) else (
        echo ⚠️  Could not create desktop shortcut
    )
)

REM Network configuration check
echo 🔧 Step 7: Network Configuration
echo.

echo ℹ️  Testing network interfaces...

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)
set LOCAL_IP=127.0.0.1

:found_ip
if "%LOCAL_IP%"=="127.0.0.1" (
    echo ⚠️  No active network connection detected
    echo    App will be available locally at http://localhost:3000
) else (
    echo ✅ Network detected. App will be accessible at:
    echo    • Local: http://localhost:3000
    echo    • Network: http://%LOCAL_IP%:3000
)

echo.
echo ℹ️  For multi-device access, ensure:
echo    • All devices are on the same Wi-Fi network
echo    • Windows Firewall allows Node.js connections
echo    • Router doesn't block local network traffic

REM Final setup verification
echo 🔧 Step 8: Verifying Installation
echo.

echo ℹ️  Running quick verification...

REM Test Node.js
node -e "console.log('Node.js OK')" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js is working
) else (
    echo ❌ Node.js verification failed
)

REM Test npm
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ npm is working
) else (
    echo ❌ npm verification failed
)

REM Check required files
set ALL_FILES_PRESENT=true

if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json missing
    set ALL_FILES_PRESENT=false
)

if exist "server.js" (
    echo ✅ server.js found
) else (
    echo ❌ server.js missing
    set ALL_FILES_PRESENT=false
)

if exist "src\App-networked.js" (
    echo ✅ src\App-networked.js found
) else (
    echo ❌ src\App-networked.js missing
    set ALL_FILES_PRESENT=false
)

if exist "src\index.js" (
    echo ✅ src\index.js found
) else (
    echo ❌ src\index.js missing
    set ALL_FILES_PRESENT=false
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if "%ALL_FILES_PRESENT%"=="true" (
    echo ✅ 🎉 Installation completed successfully!
    echo.
    echo 🚀 Ready to start! Choose your preferred method:
    echo.
    echo    1. Double-click 'start-classroom-tracker.bat' ^(easiest^)
    echo    2. Double-click 'start-classroom-tracker.ps1' ^(PowerShell with colors^)
    echo    3. Run 'npm run dev' in Command Prompt
    echo.
    echo 📱 For multi-device setup:
    echo    • Start the app on your main device
    echo    • Connect other devices to the same Wi-Fi
    echo    • Open http://%LOCAL_IP%:3000 on each device
    echo.
) else (
    echo ❌ Installation completed with issues. Please check the errors above.
)

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM Optionally start the app right now
echo.
set /p START_NOW="Start the Classroom Participation Tracker now? (y/n): "
if /i "%START_NOW%"=="y" (
    echo ℹ️  Starting application...
    call start-classroom-tracker.bat
) else (
    echo.
    echo 👋 Setup complete! Use any of the startup methods above when ready.
    pause
)