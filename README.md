# Classroom Participation Tracker

A modern web-based classroom participation tracking system with **real-time multi-device synchronization**. Track student engagement across multiple devices with visual indicators and export weekly reports.

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- npm (comes with Node.js)

### Installation & Running
```bash
# 1. Clone the repository
git clone https://github.com/benny2744/Classroom-Participation-Tracker.git
cd Classroom-Participation-Tracker

# 2. Install dependencies
npm install

# 3. Start the application (frontend + backend)
npm run dev
```

The app will automatically open in your browser at `http://localhost:3000`

### Alternative Commands
```bash
# Start frontend only
npm start

# Start backend only  
npm run server

# Build for production
npm run build
npm run production
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
- **Presentation Mode**: Optimized grid layout for classroom projectors and large displays
- Collapsible sections for clean UI
- Connection status indicators
- Real-time device count display

## 🆕 Recent Updates

- **Presentation Mode**: Added toggle for optimized classroom display with compact student cards
- **Network Synchronization**: Full real-time multi-device support with WebSocket connections
- **Improved Performance**: Fixed button responsiveness and optimized data handling
- **Enhanced UI**: Better visual feedback and connection status indicators
- **Modernized Codebase**: Updated to latest React patterns and dependencies
- **Docker Support**: Added containerization for easy deployment

## 🌐 Network Access & Multi-Device Setup

Once started, the app is available at:
- **Local access**: http://localhost:3000
- **Network access**: Check terminal output for your network IP (e.g., http://192.168.1.100:3000)
- **API health check**: http://localhost:3001/api/health

### Setting up Multiple Devices
1. Start the application on your main device (teacher station)
2. Note the network IP address from the terminal output
3. Connect other devices (tablets, phones) to the same Wi-Fi network  
4. Open the network URL on each device
5. All devices will sync automatically in real-time

## 🎯 Usage Guide

1. **Create a Class**: Enter class name and click "Create Class"
2. **Add Students**: 
   - Manually: Enter names one by one
   - Bulk import: Use "Import CSV" with student names
3. **Track Participation**: Click +/- buttons on student cards
4. **Use Tools**:
   - Random student selection
   - **Presentation Mode**: Toggle for classroom display optimization
   - Class-wide point adjustments
   - Export weekly reports

### 📺 Presentation Mode

The **Presentation Mode** feature is specifically designed for classroom environments with projectors, smart boards, or large displays:

**Features:**
- **Compact Grid Layout**: Displays up to 12 students per row on large screens
- **Optimized Spacing**: Reduced padding for maximum screen utilization
- **Enhanced Visibility**: Responsive design that scales from phones to projectors
- **Real-time Updates**: All participation changes appear instantly on the display

**How to Use:**
1. Click the "Presentation Mode" toggle in the class tools section
2. Connect your display device (projector, smart board, etc.)
3. The layout automatically optimizes for your screen size
4. Use other devices for input while the main display shows real-time updates

**Perfect for:**
- Classroom projectors and smart boards
- Parent-teacher conferences
- Student engagement displays
- Real-time participation monitoring during lessons

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

- **Frontend**: React 18, CSS3, Lucide Icons
- **Backend**: Node.js, Express, Socket.io
- **Real-time**: WebSocket connections for instant sync
- **Storage**: File-based persistence with auto-save
- **Development**: Concurrently for running both frontend and backend

## 🐳 Docker Alternative

For containerized deployment:

```bash
# Build and run with Docker
docker-compose up -d

# Access at http://localhost:3000
```

## 🆘 Troubleshooting

- **Port conflicts**: Ports 3000/3001 already in use → Close other Node.js apps or change ports
- **Network issues**: Ensure all devices are on the same Wi-Fi network
- **Dependencies**: Run `npm install` if getting module errors  
- **Connection issues**: Check firewall settings and network permissions

## 📁 Project Structure

```
classroom-participation-tracker/
├── README.md
├── package.json                    # Dependencies and scripts
├── server.js                       # Backend server with Socket.io
├── Dockerfile                      # Docker configuration
├── docker-compose.yml              # Docker Compose setup
├── classroom-data.json             # Student data persistence
├── src/
│   ├── App-networked.js            # Main React component  
│   ├── index.js                    # App entry point
│   ├── index.css                   # Styles
│   └── App.test.js                 # Tests
└── public/
    ├── index.html                  # HTML template
    └── manifest.json               # PWA manifest
```

## 🤝 Contributing

Issues and pull requests welcome! This project focuses on classroom management tools and educational technology.

---

**🎓 Ready to track classroom participation with real-time sync? Just run `npm run dev` and get started!**
