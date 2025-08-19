# Classroom Participation Tracker - Install & Configuration Script for Windows PowerShell
# This script installs Node.js (if needed), sets up the project, and configures everything

# Set window title and enable colors
$Host.UI.RawUI.WindowTitle = "Classroom Participation Tracker - Installation & Setup"

# Change to script directory
Set-Location -Path $PSScriptRoot
$ScriptDir = Get-Location

Write-Host ""
Write-Host "🚀 Classroom Participation Tracker - Installation & Setup" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Function definitions for colored output
function Write-Status {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Header {
    param($Message)
    Write-Host "🔧 $Message" -ForegroundColor Magenta
}

# Step 1: System Requirements
Write-Header "Step 1: Checking System Requirements"
Write-Host ""

$WindowsVersion = (Get-WmiObject -Class Win32_OperatingSystem).Caption
Write-Status "Running on $WindowsVersion"

# Check PowerShell version
$PSVersion = $PSVersionTable.PSVersion.Major
if ($PSVersion -ge 5) {
    Write-Status "PowerShell $($PSVersionTable.PSVersion) is compatible"
} else {
    Write-Warning "PowerShell version is old. Some features may not work optimally."
}

# Step 2: Node.js Installation Check
Write-Header "Step 2: Checking Node.js Installation"
Write-Host ""

try {
    $NodeVersion = node --version
    Write-Status "Node.js is already installed: $NodeVersion"
    
    # Check if version is 16 or higher
    $NodeMajor = [int]($NodeVersion -replace 'v(\d+)\..*', '$1')
    if ($NodeMajor -lt 16) {
        Write-Warning "Node.js version is too old. Please update to version 16 or higher"
        Write-Info "Visit: https://nodejs.org/ to download the latest version"
        Read-Host "Press Enter to open Node.js website, then restart this script"
        Start-Process "https://nodejs.org/"
        exit 1
    } else {
        Write-Status "Node.js version is compatible"
    }
} catch {
    Write-Error "Node.js is not installed!"
    Write-Host ""
    Write-Host "📋 To install Node.js:" -ForegroundColor Yellow
    Write-Host "   1. Visit https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "   2. Download the LTS version for Windows" -ForegroundColor Yellow
    Write-Host "   3. Run the installer with default settings" -ForegroundColor Yellow
    Write-Host "   4. Restart this script after installation" -ForegroundColor Yellow
    Write-Host ""
    
    $InstallNode = Read-Host "Open Node.js website now? (y/n)"
    if ($InstallNode -match '^[Yy]') {
        Start-Process "https://nodejs.org/"
    }
    exit 1
}

# Check npm
try {
    $NpmVersion = npm --version
    Write-Status "npm is available: v$NpmVersion"
} catch {
    Write-Error "npm is not available"
    exit 1
}

# Step 3: Git Check (optional)
Write-Header "Step 3: Checking Git Installation"
Write-Host ""

try {
    $GitVersion = git --version
    Write-Status "Git is available: $GitVersion"
} catch {
    Write-Warning "Git is not installed (optional but recommended)"
    Write-Info "Visit: https://git-scm.com/download/windows to install Git"
}

# Step 4: Install Dependencies
Write-Header "Step 4: Installing Project Dependencies"
Write-Host ""

if (Test-Path "package.json") {
    Write-Info "Installing npm dependencies..."
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Dependencies installed successfully"
    } else {
        Write-Error "Failed to install dependencies"
        exit 1
    }
} else {
    Write-Error "package.json not found! Make sure you're in the project directory."
    exit 1
}

# Step 5: Windows Firewall Configuration
Write-Header "Step 5: Windows Firewall Configuration"
Write-Host ""

Write-Info "Configuring Windows Firewall for Node.js..."
Write-Host "   This allows other devices to connect to your classroom tracker" -ForegroundColor Cyan

# Check if running as administrator
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if ($IsAdmin) {
    Write-Info "Running with administrator privileges - configuring firewall..."
    
    # Check if firewall rules already exist
    $ExistingRule = Get-NetFirewallRule -DisplayName "Node.js Server*" -ErrorAction SilentlyContinue
    
    if (-not $ExistingRule) {
        Write-Info "Adding firewall rules for ports 3000 and 3001..."
        try {
            New-NetFirewallRule -DisplayName "Node.js Server Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow | Out-Null
            New-NetFirewallRule -DisplayName "Node.js Server Port 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow | Out-Null
            Write-Status "Firewall rules added successfully"
        } catch {
            Write-Warning "Could not add firewall rules automatically"
        }
    } else {
        Write-Status "Firewall rules already configured"
    }
} else {
    Write-Warning "Not running as administrator - cannot automatically configure firewall"
    Write-Info "You may need to manually allow Node.js through Windows Firewall"
    Write-Info "Or run this script as Administrator for automatic configuration"
}

# Step 6: Desktop Shortcuts
Write-Header "Step 6: Setting up Desktop Shortcuts"
Write-Host ""

$CreateShortcuts = Read-Host "Create desktop shortcuts for easy access? (y/n)"
if ($CreateShortcuts -match '^[Yy]') {
    Write-Info "Creating desktop shortcuts..."
    
    $Desktop = [Environment]::GetFolderPath("Desktop")
    $ShortcutPath = Join-Path $Desktop "Classroom Participation Tracker.lnk"
    
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = Join-Path $ScriptDir "start-classroom-tracker.bat"
        $Shortcut.WorkingDirectory = $ScriptDir
        $Shortcut.IconLocation = "shell32.dll,21"
        $Shortcut.Description = "Start Classroom Participation Tracker"
        $Shortcut.Save()
        
        Write-Status "Desktop shortcut created successfully"
    } catch {
        Write-Warning "Could not create desktop shortcut: $($_.Exception.Message)"
    }
    
    # Also create PowerShell shortcut
    $PSShortcutPath = Join-Path $Desktop "Classroom Tracker (PowerShell).lnk"
    try {
        $PSShortcut = $WshShell.CreateShortcut($PSShortcutPath)
        $PSShortcut.TargetPath = "powershell.exe"
        $PSShortcut.Arguments = "-ExecutionPolicy Bypass -File `\"$(Join-Path $ScriptDir 'start-classroom-tracker.ps1')`\""
        $PSShortcut.WorkingDirectory = $ScriptDir
        $PSShortcut.IconLocation = "powershell.exe,0"
        $PSShortcut.Description = "Start Classroom Participation Tracker (PowerShell)"
        $PSShortcut.Save()
        
        Write-Status "PowerShell shortcut created successfully"
    } catch {
        Write-Warning "Could not create PowerShell shortcut: $($_.Exception.Message)"
    }
}

# Step 7: Network Configuration
Write-Header "Step 7: Network Configuration"
Write-Host ""

Write-Info "Testing network interfaces..."

# Get local IP address
try {
    $LocalIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.AddressState -eq "Preferred" -and $_.PrefixOrigin -eq "Dhcp"}).IPAddress | Select-Object -First 1
    
    if (-not $LocalIP) {
        $LocalIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.AddressState -eq "Preferred" -and $_.IPAddress -ne "127.0.0.1"}).IPAddress | Select-Object -First 1
    }
    
    if ($LocalIP) {
        Write-Status "Network detected. App will be accessible at:"
        Write-Host "   • Local: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "   • Network: http://$LocalIP:3000" -ForegroundColor Cyan
    } else {
        throw "No network detected"
    }
} catch {
    Write-Warning "No active network connection detected"
    Write-Info "App will be available locally at http://localhost:3000"
    $LocalIP = "127.0.0.1"
}

Write-Host ""
Write-Info "For multi-device access, ensure:"
Write-Host "   • All devices are on the same Wi-Fi network" -ForegroundColor Cyan
Write-Host "   • Windows Firewall allows Node.js connections" -ForegroundColor Cyan
Write-Host "   • Router doesn't block local network traffic" -ForegroundColor Cyan

# Step 8: Final Verification
Write-Header "Step 8: Verifying Installation"
Write-Host ""

Write-Info "Running quick verification..."

# Test Node.js
try {
    $null = node -e "console.log('Node.js OK')"
    Write-Status "Node.js is working"
} catch {
    Write-Error "Node.js verification failed"
}

# Test npm
try {
    $null = npm --version
    Write-Status "npm is working"
} catch {
    Write-Error "npm verification failed"
}

# Check required files
$RequiredFiles = @("package.json", "server.js", "src\App-networked.js", "src\index.js")
$AllFilesPresent = $true

foreach ($file in $RequiredFiles) {
    if (Test-Path $file) {
        Write-Status "$file found"
    } else {
        Write-Error "$file missing"
        $AllFilesPresent = $false
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($AllFilesPresent) {
    Write-Host "✅ 🎉 Installation completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to start! Choose your preferred method:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   1. Double-click 'start-classroom-tracker.bat' (easiest)" -ForegroundColor Cyan
    Write-Host "   2. Double-click 'start-classroom-tracker.ps1' (PowerShell with colors)" -ForegroundColor Cyan
    Write-Host "   3. Run 'npm run dev' in Command Prompt" -ForegroundColor Cyan
    Write-Host "   4. Use the desktop shortcuts (if created)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 For multi-device setup:" -ForegroundColor Yellow
    Write-Host "   • Start the app on your main device" -ForegroundColor Cyan
    Write-Host "   • Connect other devices to the same Wi-Fi" -ForegroundColor Cyan
    Write-Host "   • Open http://$LocalIP`:3000 on each device" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Error "Installation completed with issues. Please check the errors above."
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Optionally start the app right now
Write-Host ""
$StartNow = Read-Host "Start the Classroom Participation Tracker now? (y/n)"
if ($StartNow -match '^[Yy]') {
    Write-Info "Starting application..."
    & ".\start-classroom-tracker.ps1"
} else {
    Write-Host ""
    Write-Host "👋 Setup complete! Use any of the startup methods above when ready." -ForegroundColor Green
    Read-Host "Press Enter to exit"
}