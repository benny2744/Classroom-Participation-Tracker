# 🎓 Classroom Participation Tracker

A **networked** web-based classroom participation tracking system inspired by ClassDojo. Track student engagement across multiple devices with real-time synchronization and visual indicators.

![Status](https://img.shields.io/badge/Status-Active-green)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![Platform](https://img.shields.io/badge/Platform-Web-orange)

## ✨ Features

### 🌟 **Core Features**
- 📊 **Visual Participation Tracking**: 5-light indicator system with color progression (Green → Blue → Purple → Gold)
- 👥 **Multi-Class Management**: Create and manage multiple classes with easy switching
- 📈 **Smart Point System**: 0-20 point range with immediate visual feedback
- 🔄 **Real-Time Sync**: All connected devices update instantly
- 📅 **Automatic Weekly Reset**: Points reset weekly with historical data preservation

### 🚀 **Advanced Features** 
- 📱 **Multi-Device Support**: Connect tablets, phones, and computers simultaneously
- 🎲 **Random Student Selection**: Built-in student picker with visual highlighting  
- 📁 **CSV Import/Export**: Bulk import student rosters and export participation reports
- 💾 **Persistent Data**: Auto-saves every 30 seconds with weekly history tracking
- 🎨 **Responsive UI**: Clean, modern design optimized for all screen sizes
- ⚡ **Optimistic Updates**: Buttons respond instantly with error recovery

### 🔧 **Recently Fixed**
- ✅ **Button Responsiveness**: Fixed button locking issues - all buttons now respond immediately
- ✅ **Network Stability**: Improved connection handling and error recovery
- ✅ **Performance**: Enhanced real-time synchronization across devices

## 🚀 Quick Start

### Option 1: Docker (Recommended)

**Prerequisites:** Docker and Docker Compose installed

```bash
# 1. Clone the repository
git clone https://github.com/benny2744/Classroom-Participation-Tracker.git
cd Classroom-Participation-Tracker

# 2. Switch to networked branch
git checkout Networked

# 3. Start with Docker Compose
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Option 2: Local Development

**Prerequisites:** 
- Node.js 16+ ([Download here](https://nodejs.org/))
- npm (comes with Node.js)
- Git

```bash
# 1. Clone the repository
git clone https://github.com/benny2744/Classroom-Participation-Tracker.git
cd Classroom-Participation-Tracker

# 2. Switch to networked branch
git checkout Networked

# 3. Install dependencies
npm install

# 4. Start the backend server (Terminal 1)
node server.js

# 5. Start the frontend app (Terminal 2)
npm start

# 6. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Option 3: One-Click Startup (Mac/Linux)

After cloning and installing dependencies:

```bash
# Make the script executable
chmod +x start-classroom-tracker.command

# Run the startup script
./start-classroom-tracker.command
```

## 📱 Multi-Device Setup

### 1. **Teacher's Device (Main)**
- Open http://localhost:3000 (if running locally)
- Create classes and manage students
- Use the main controls and tools

### 2. **Student Tablets/Secondary Devices**
- Connect to the same Wi-Fi network
- Open http://[YOUR-IP]:3001 (network URL shown in terminal)
- All devices sync in real-time automatically

### 3. **Finding Your Network URL**
When you start the server, look for output like:
```
🌐 Network access: http://192.168.1.100:3001
```
Use this URL on other devices on the same network.

## 📖 Usage Guide

### Getting Started
1. **Create a Class**: Enter a class name and click "Create Class"
2. **Add Students**: 
   - Manually: Type names and click "Add Student"
   - Bulk Import: Use "Import CSV" with a file containing student names
3. **Start Tracking**: Click +/- buttons to award/remove participation points

### Advanced Features
- **Random Student Selection**: Use the "Random Student" button in Tools section
- **Class-Wide Actions**: Use "All +1" or "All -1" to adjust all students at once
- **Weekly Reports**: Export participation data as CSV files
- **Profile Pictures**: Click on student avatars to upload custom photos

### Color System
- 🟢 **Green (1-5 points)**: Initial participation
- 🔵 **Blue (6-10 points)**: Good participation  
- 🟣 **Purple (11-15 points)**: Excellent participation
- 🟡 **Gold (16-20 points)**: Outstanding participation

## 📁 CSV Import Format

Create a CSV file with student names:

```csv
Name
John Doe
Jane Smith
Mike Johnson
Sarah Wilson
```

## 🛠️ Development

### Project Structure
```
classroom-participation-tracker/
├── README.md
├── package.json              # Dependencies and scripts
├── server.js                 # Backend server (Node.js + Socket.io)
├── docker-compose.yml        # Docker setup
├── public/
│   └── index.html            # HTML template
└── src/
    ├── App-networked.js      # Main React component (networked version)
    ├── index.js              # React entry point
    └── index.css             # Global styles
```

### Available Scripts
```bash
npm start          # Start development server
npm test           # Run tests
npm run build      # Build for production
npm run eject      # Eject from Create React App (use carefully)
```

### Technology Stack
- **Frontend**: React 18, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, Socket.io
- **Data Storage**: JSON file with auto-backup
- **Real-time**: WebSocket connections
- **Deployment**: Docker, Docker Compose

## 🔧 Configuration

### Environment Variables
```bash
PORT=3001                    # Backend server port
NODE_ENV=production          # Environment mode
```

### Server Features
- **Auto-save**: Data saves every 30 seconds
- **Weekly Reset**: Automatic point reset with history preservation
- **Health Check**: Available at `/api/health`
- **Multi-device**: Supports unlimited connected devices

## 🚨 Troubleshooting

### Common Issues

**🔴 "Cannot connect to server"**
- Make sure the backend server is running (`node server.js`)
- Check that port 3001 is not being used by another application
- Verify you're on the same Wi-Fi network for multi-device access

**🔴 "Port already in use"**
- Kill existing processes: `lsof -ti:3000,3001 | xargs kill -9`
- Or change ports in the configuration

**🔴 "Buttons not responding"**
- This was fixed in v2.0.0 - make sure you're on the `Networked` branch
- Refresh the page to get the latest updates

**🔴 "CSV import not working"**
- Ensure your CSV has a "Name" header
- Check file format (UTF-8 encoding recommended)
- Files should be under 5MB

### Getting Help
1. Check the browser console for error messages (F12)
2. Verify network connectivity between devices  
3. Restart both frontend and backend servers
4. Clear browser cache and localStorage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Inspired by ClassDojo's engagement tracking system
- Built with modern React and Node.js technologies
- Designed for real-world classroom environments

## 📞 Support

For questions, issues, or feature requests:
- 📧 Open an issue on GitHub
- 🐛 Report bugs with detailed steps to reproduce
- 💡 Suggest features via GitHub Discussions

---

**Made with ❤️ for educators worldwide**

*Last updated: August 2025*