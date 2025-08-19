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

## 🔧 Prerequisites

- Node.js 16+ and npm
- All devices on the same Wi-Fi network for multi-device sync

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/benny2744/Classroom-Participation-Tracker.git
cd Classroom-Participation-Tracker

# Install dependencies
npm install

# Use one-click startup scripts OR manual commands above
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
├── server.js                    # Backend server
├── start-classroom-tracker.*    # One-click startup scripts
├── launcher.scpt               # Mac AppleScript launcher
├── src/
│   ├── App-networked.js        # Main React component
│   ├── index.js               # App entry point
│   └── index.css              # Styles
└── public/
    └── index.html             # HTML template
```

## 🤝 Contributing

Issues and pull requests welcome! This project focuses on classroom management tools and educational technology.

---

**🎓 Ready to track classroom participation with real-time sync? Use the one-click startup scripts above!**