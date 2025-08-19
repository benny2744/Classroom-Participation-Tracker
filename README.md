# Classroom Participation Tracker - Networked Edition

A web-based classroom participation tracking system with **real-time multi-device synchronization**. Track student engagement across multiple devices with visual indicators and export weekly reports.

## 🚀 One-Click Startup

### 🍎 macOS Users

#### Option 1: AppleScript Launcher (Recommended)
1. **Double-click `launcher.scpt`** 
2. Click "Start App" in the dialog
3. Terminal opens and starts both services
4. Browser opens automatically to the app

#### Option 2: Command File  
1. **Double-click `start-classroom-tracker.command`**
2. Services start automatically in Terminal

### 🪟 Windows Users

#### Option 1: Batch File (Recommended)
1. **Double-click `start-classroom-tracker.bat`**
2. Command Prompt opens and starts both services
3. Browser opens automatically to the app

#### Option 2: PowerShell Script
1. **Right-click `start-classroom-tracker.ps1`** → "Run with PowerShell"
2. If prompted about execution policy, type `Y` and press Enter
3. Services start with colorful output

### 💻 Manual Startup (All Platforms)
```bash
# Start both services together (recommended)
npm run dev

# OR start services separately:
# Terminal 1: Backend server
node server.js

# Terminal 2: Frontend
npm start
```

## ✨ Features

### 🔄 **Real-Time Multi-Device Sync**
- **Fixed button locking issue** - Buttons now respond immediately
- Connect multiple devices (tablets, phones, laptops) to the same network
- Changes sync instantly across all connected devices
- Perfect for classroom setups with teacher station + student devices

### 📊 **Visual Participation Tracking**
- 5-light indicator system with color progression
- 0-20 point range with responsive +/- buttons
- Optimistic updates for immediate feedback

### 👥 **Advanced Class Management**
- Create and manage multiple classes
- Custom student avatars with photo upload
- Random student selection tool
- Class-wide point operations (All +1, All -1)

### 📁 **Data Management**
- CSV import/export functionality
- Automatic weekly reset with history tracking
- Data persistence with 30-second auto-save
- Server-based storage for reliability

### 🎨 **Modern Interface**
- Mobile-friendly responsive design
- Collapsible sections for clean UI
- Connection status indicators
- Real-time device count display

## 🌐 Network Access

Once started, the app is available at:
- **Local access**: http://localhost:3000
- **Network access**: Check terminal output for your network IP (e.g., http://192.168.1.100:3000)
- **API health check**: http://localhost:3001/api/health

## 📱 Multi-Device Setup

1. Start the application on your main device (teacher station)
2. Note the network IP address from the terminal output
3. Connect other devices (tablets, phones) to the same Wi-Fi network
4. Open the network URL on each device
5. All devices will sync automatically in real-time

## 🛠 Installation & Setup

### 🎯 Quick Install (Recommended)

Choose your platform and run the install script:

### 🍎 **macOS Installation**
1. **Download or clone this repository**
2. **Double-click `install-setup-mac.command`**
3. **Follow the prompts** - the script will:
   - Install Homebrew (if needed)
   - Install Node.js (if needed)
   - Install Git (if needed)  
   - Install project dependencies
   - Configure network settings
   - Set up desktop shortcuts
   - Test everything

### 🪟 **Windows Installation**

#### Option 1: Batch Script (Easiest)
1. **Download or clone this repository**
2. **Double-click `install-setup-windows.bat`**
3. **Follow the prompts** - the script will guide you through everything

#### Option 2: PowerShell Script (Recommended for advanced users)
1. **Right-click `install-setup-windows.ps1`** → "Run with PowerShell"
2. **If prompted about execution policy**, type `Y` and press Enter
3. **Follow the prompts** - includes colored output and advanced features

Both Windows scripts will:
- Check for Node.js and guide installation if needed
- Install project dependencies
- Configure Windows Firewall
- Create desktop shortcuts
- Test network connectivity
- Verify installation

### 💻 Manual Installation (All Platforms)

If you prefer manual setup:

```bash
# 1. Install Node.js 16+ from https://nodejs.org/
# 2. Clone or download this repository
git clone https://github.com/benny2744/Classroom-Participation-Tracker.git
cd Classroom-Participation-Tracker

# 3. Install dependencies
npm install

# 4. You're ready! Use startup scripts or manual commands
```

## 🎯 Usage Guide

1. **Create a Class**: Enter class name and click "Create Class"
2. **Add Students**: 
   - Manually: Enter names one by one
   - Bulk import: Use "Import CSV" with student names
3. **Track Participation**: Click +/- buttons on student cards
4. **Use Tools**:
   - Random student selection
   - Class-wide point adjustments
   - Export weekly reports

## 🌈 Point System & Colors

- 🟢 **Green (1-5 points)**: Initial participation
- 🔵 **Blue (6-10 points)**: Good participation  
- 🟣 **Purple (11-15 points)**: Excellent participation
- 🟡 **Gold (16-20 points)**: Outstanding participation

## 📋 CSV Import Format

```csv
Name
John Doe
Jane Smith
Mike Johnson
```

## 🛠 Technology Stack

- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, Socket.io
- **Real-time**: WebSocket connections
- **Storage**: File-based persistence with auto-save

## 🐳 Docker Alternative

```bash
# Build and run with Docker
docker-compose up -d

# Access at http://localhost:3000
```

## ✨ What Do the Install Scripts Do?

The installation scripts automate the entire setup process:

### 🔧 **System Setup**
- **Check system compatibility** (Windows/macOS versions)
- **Install Node.js** if not present (guides you through download)
- **Install Homebrew** on macOS (if needed)
- **Install Git** (optional but recommended)

### 🌐 **Network Configuration**  
- **Configure firewall rules** for ports 3000 and 3001
- **Detect network IP address** for multi-device access
- **Test network connectivity**
- **Provide connection URLs** for all devices

### 🚀 **Project Setup**
- **Install npm dependencies** automatically
- **Verify all required files** are present
- **Test Node.js and npm** functionality
- **Create desktop shortcuts** (optional)

### 🎯 **Ready-to-Use Result**
After running an install script, you'll have:
- ✅ All dependencies installed
- ✅ Network configured for multi-device sync
- ✅ Desktop shortcuts created
- ✅ Everything tested and verified
- ✅ Ready to start with one click!

## 🆘 Troubleshooting

- **Port conflicts**: Ports 3000/3001 already in use → Close other Node.js apps
- **Network issues**: Ensure all devices on same Wi-Fi network
- **Dependencies**: Run `npm install` if getting module errors
- **Button issues**: This version has **fixed** the button locking problem!

## 📁 Project Structure

```
classroom-participation-tracker/
├── README.md
├── package.json
├── server.js                         # Backend server
├── install-setup-mac.command         # macOS install script
├── install-setup-windows.bat         # Windows install script (batch)
├── install-setup-windows.ps1         # Windows install script (PowerShell)
├── start-classroom-tracker.*         # One-click startup scripts
├── launcher.scpt                     # Mac AppleScript launcher
├── src/
│   ├── App-networked.js              # Main React component
│   ├── index.js                     # App entry point
│   └── index.css                    # Styles
└── public/
    └── index.html                   # HTML template
```

## 🤝 Contributing

Issues and pull requests welcome! This project focuses on classroom management tools and educational technology.

---

**🎓 Ready to track classroom participation with real-time sync? Use the one-click startup scripts above!**
