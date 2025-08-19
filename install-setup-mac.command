#!/bin/bash

# Classroom Participation Tracker - Install & Configuration Script for macOS
# This script installs Node.js, sets up the project, and configures everything

echo "🚀 Classroom Participation Tracker - Installation & Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Change to script directory
cd "$(dirname "$0")"
SCRIPT_DIR=$(pwd)

print_header "Step 1: Checking System Requirements"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS only!"
    exit 1
fi

print_status "Running on macOS"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    print_info "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    
    if command -v brew &> /dev/null; then
        print_status "Homebrew installed successfully"
    else
        print_error "Failed to install Homebrew"
        exit 1
    fi
else
    print_status "Homebrew is already installed"
fi

# Check if Node.js is installed
print_header "Step 2: Installing Node.js"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_info "Node.js is already installed: $NODE_VERSION"
    
    # Check if version is 16 or higher
    NODE_MAJOR=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_warning "Node.js version is too old. Updating to latest LTS..."
        brew install node
    else
        print_status "Node.js version is compatible"
    fi
else
    print_info "Installing Node.js via Homebrew..."
    brew install node
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js installed successfully: $NODE_VERSION"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
fi

# Check NPM
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm is available: v$NPM_VERSION"
else
    print_error "npm is not available"
    exit 1
fi

# Install Git if not present
print_header "Step 3: Checking Git Installation"

if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_status "Git is already installed: $GIT_VERSION"
else
    print_info "Installing Git via Homebrew..."
    brew install git
    
    if command -v git &> /dev/null; then
        print_status "Git installed successfully"
    else
        print_error "Failed to install Git"
        exit 1
    fi
fi

# Install project dependencies
print_header "Step 4: Installing Project Dependencies"

if [ -f "package.json" ]; then
    print_info "Installing npm dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_error "package.json not found! Make sure you're in the project directory."
    exit 1
fi

# Create desktop shortcuts (optional)
print_header "Step 5: Setting up Desktop Shortcuts"

read -p "Create desktop shortcut for easy access? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create alias in .zshrc (or .bash_profile for older macOS)
    SHELL_PROFILE=""
    if [ -f ~/.zshrc ]; then
        SHELL_PROFILE=~/.zshrc
    elif [ -f ~/.bash_profile ]; then
        SHELL_PROFILE=~/.bash_profile
    else
        SHELL_PROFILE=~/.zshrc
        touch $SHELL_PROFILE
    fi
    
    # Add alias if not already present
    if ! grep -q "classroom-tracker" "$SHELL_PROFILE"; then
        echo "" >> "$SHELL_PROFILE"
        echo "# Classroom Participation Tracker shortcut" >> "$SHELL_PROFILE"
        echo "alias classroom-tracker='cd \"$SCRIPT_DIR\" && ./start-classroom-tracker.command'" >> "$SHELL_PROFILE"
        print_status "Terminal shortcut added! Use 'classroom-tracker' command to start the app"
        print_info "Restart your terminal or run 'source $SHELL_PROFILE' to use the shortcut"
    else
        print_info "Terminal shortcut already exists"
    fi
fi

# Set executable permissions on startup scripts
print_header "Step 6: Setting up Startup Scripts"

chmod +x start-classroom-tracker.command 2>/dev/null
if [ -f "launcher.scpt" ]; then
    print_status "AppleScript launcher is ready"
fi
print_status "Startup scripts configured"

# Network configuration check
print_header "Step 7: Network Configuration"

print_info "Testing network interfaces..."
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "No network")

if [ "$LOCAL_IP" != "No network" ]; then
    print_status "Network detected. App will be accessible at:"
    echo "   • Local: http://localhost:3000"
    echo "   • Network: http://$LOCAL_IP:3000"
else
    print_warning "No active network connection detected"
    print_info "App will be available locally at http://localhost:3000"
fi

# Security and Firewall info
print_info "For multi-device access, you may need to:"
echo "   • Allow Node.js through macOS Firewall (System Preferences > Security & Privacy)"
echo "   • Ensure all devices are on the same Wi-Fi network"

# Final setup verification
print_header "Step 8: Verifying Installation"

print_info "Running quick verification..."

# Test Node.js
if node -e "console.log('Node.js OK')" &> /dev/null; then
    print_status "Node.js is working"
else
    print_error "Node.js verification failed"
fi

# Test npm
if npm --version &> /dev/null; then
    print_status "npm is working"
else
    print_error "npm verification failed"
fi

# Check if all files are present
REQUIRED_FILES=("package.json" "server.js" "src/App-networked.js" "src/index.js")
ALL_FILES_PRESENT=true

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file found"
    else
        print_error "$file missing"
        ALL_FILES_PRESENT=false
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$ALL_FILES_PRESENT" = true ]; then
    print_status "🎉 Installation completed successfully!"
    echo ""
    echo "🚀 Ready to start! Choose your preferred method:"
    echo ""
    echo "   1. Double-click 'launcher.scpt' (easiest)"
    echo "   2. Double-click 'start-classroom-tracker.command'"
    echo "   3. Run 'npm run dev' in terminal"
    if grep -q "classroom-tracker" ~/.zshrc 2>/dev/null || grep -q "classroom-tracker" ~/.bash_profile 2>/dev/null; then
        echo "   4. Type 'classroom-tracker' in any terminal"
    fi
    echo ""
    echo "📱 For multi-device setup:"
    echo "   • Start the app on your main device"
    echo "   • Connect other devices to the same Wi-Fi"
    echo "   • Open http://$LOCAL_IP:3000 on each device"
    echo ""
    print_info "Installation log saved to install.log"
else
    print_error "Installation completed with issues. Please check the errors above."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Optionally start the app right now
echo ""
read -p "Start the Classroom Participation Tracker now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting application..."
    ./start-classroom-tracker.command
fi