const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For base64 images
app.use(express.static(path.join(__dirname, 'build')));

// In-memory data store (you could replace with SQLite for persistence)
let classroomData = {};
let connectedDevices = new Map();

// Load data from file on startup (optional persistence)
const DATA_FILE = path.join(__dirname, 'classroom-data.json');
try {
  if (fs.existsSync(DATA_FILE)) {
    const savedData = fs.readFileSync(DATA_FILE, 'utf8');
    classroomData = JSON.parse(savedData);
    console.log('📚 Loaded existing classroom data');
  }
} catch (error) {
  console.log('📝 Starting with fresh data');
}

// Save data to file (periodic backup)
const saveDataToFile = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(classroomData, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Auto-save every 30 seconds
setInterval(saveDataToFile, 30000);

// Utility functions
const getWeekKey = () => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNum}`;
};

const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
};

// Initialize week check for all classes
const checkAndResetWeek = () => {
  const currentWeek = getWeekKey();
  let dataChanged = false;

  Object.keys(classroomData).forEach(className => {
    if (classroomData[className].lastWeek !== currentWeek) {
      // Archive current week data
      if (!classroomData[className].weeklyHistory) {
        classroomData[className].weeklyHistory = {};
      }
      
      if (classroomData[className].lastWeek) {
        classroomData[className].weeklyHistory[classroomData[className].lastWeek] = 
          classroomData[className].students.map(s => ({ name: s.name, points: s.points }));
      }
      
      // Reset points for new week
      classroomData[className].students.forEach(student => {
        student.points = 0;
      });
      
      classroomData[className].lastWeek = currentWeek;
      dataChanged = true;
    }
  });

  if (dataChanged) {
    saveDataToFile();
    io.emit('data-reset', { week: currentWeek });
  }
};

// Check for week reset on startup and every hour
checkAndResetWeek();
setInterval(checkAndResetWeek, 3600000); // Check every hour

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'Classroom Participation Tracker',
    ip: getLocalIP(),
    week: getWeekKey(),
    devices: connectedDevices.size
  });
});

app.get('/api/classes', (req, res) => {
  res.json(classroomData);
});

app.post('/api/classes', (req, res) => {
  const { className } = req.body;
  
  if (!className || classroomData[className]) {
    return res.status(400).json({ error: 'Class name required or already exists' });
  }
  
  classroomData[className] = {
    students: [],
    lastWeek: getWeekKey(),
    weeklyHistory: {},
    createdAt: new Date().toISOString()
  };
  
  saveDataToFile();
  io.emit('class-created', { className, data: classroomData[className] });
  res.json({ success: true, className });
});

app.delete('/api/classes/:className', (req, res) => {
  const { className } = req.params;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  delete classroomData[className];
  saveDataToFile();
  io.emit('class-deleted', { className });
  res.json({ success: true });
});

app.get('/api/classes/:className/students', (req, res) => {
  const { className } = req.params;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  res.json(classroomData[className].students);
});

app.post('/api/classes/:className/students', (req, res) => {
  const { className } = req.params;
  const { student } = req.body;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  const newStudent = {
    id: Date.now(),
    name: student.name,
    avatar: student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
    hasCustomAvatar: student.hasCustomAvatar || false,
    points: 0,
    createdAt: new Date().toISOString()
  };
  
  classroomData[className].students.push(newStudent);
  saveDataToFile();
  
  io.emit('student-added', { className, student: newStudent });
  res.json({ success: true, student: newStudent });
});

app.delete('/api/classes/:className/students/:studentId', (req, res) => {
  const { className, studentId } = req.params;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  // Convert studentId to number for comparison since it comes as string from URL
  const studentIdNum = parseInt(studentId, 10);
  const studentIndex = classroomData[className].students.findIndex(s => s.id === studentIdNum);
  
  if (studentIndex === -1) {
    console.log('Student not found. Looking for ID:', studentIdNum, 'in students:', classroomData[className].students.map(s => s.id));
    return res.status(404).json({ error: 'Student not found' });
  }
  
  const deletedStudent = classroomData[className].students.splice(studentIndex, 1)[0];
  saveDataToFile();
  
  console.log('Student deleted:', deletedStudent.name, 'from class:', className);
  io.emit('student-deleted', { className, studentId: studentIdNum, studentIndex });
  res.json({ success: true, deletedStudent });
});

app.put('/api/classes/:className/students/:studentId/points', (req, res) => {
  const { className, studentId } = req.params;
  const { points, change } = req.body;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  // Convert studentId to number for comparison
  const studentIdNum = parseInt(studentId, 10);
  const student = classroomData[className].students.find(s => s.id === studentIdNum);
  
  if (!student) {
    console.log('Student not found for points update. Looking for ID:', studentIdNum);
    return res.status(404).json({ error: 'Student not found' });
  }
  
  // Update points (either absolute value or change)
  if (typeof points === 'number') {
    student.points = Math.max(0, Math.min(20, points));
  } else if (typeof change === 'number') {
    student.points = Math.max(0, Math.min(20, student.points + change));
  }
  
  student.lastUpdated = new Date().toISOString();
  saveDataToFile();
  
  console.log('Points updated for', student.name, 'to', student.points);
  io.emit('student-points-updated', { 
    className, 
    studentId: studentIdNum, 
    points: student.points,
    change: change || 0,
    timestamp: student.lastUpdated
  });
  
  res.json({ success: true, points: student.points });
});

app.put('/api/classes/:className/students/:studentId', (req, res) => {
  const { className, studentId } = req.params;
  const updates = req.body;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  // Convert studentId to number for comparison
  const studentIdNum = parseInt(studentId, 10);
  const student = classroomData[className].students.find(s => s.id === studentIdNum);
  
  if (!student) {
    console.log('Student not found for update. Looking for ID:', studentIdNum);
    return res.status(404).json({ error: 'Student not found' });
  }
  
  // Update allowed fields
  const allowedFields = ['name', 'avatar', 'hasCustomAvatar'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      student[field] = updates[field];
    }
  });
  
  student.lastUpdated = new Date().toISOString();
  saveDataToFile();
  
  console.log('Student updated:', student.name);
  io.emit('student-updated', { className, studentId: studentIdNum, updates: student });
  res.json({ success: true, student });
});

app.post('/api/classes/:className/reset-week', (req, res) => {
  const { className } = req.params;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  // Reset all student points
  classroomData[className].students.forEach(student => {
    student.points = 0;
    student.lastUpdated = new Date().toISOString();
  });
  
  saveDataToFile();
  io.emit('week-reset', { className });
  res.json({ success: true });
});

app.post('/api/classes/:className/all-points', (req, res) => {
  const { className } = req.params;
  const { change } = req.body; // +1 or -1
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  if (typeof change !== 'number' || (change !== 1 && change !== -1)) {
    return res.status(400).json({ error: 'Change must be +1 or -1' });
  }
  
  // Update all students
  classroomData[className].students.forEach(student => {
    student.points = Math.max(0, Math.min(20, student.points + change));
    student.lastUpdated = new Date().toISOString();
  });
  
  saveDataToFile();
  io.emit('all-points-updated', { className, change });
  res.json({ success: true, change });
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  const deviceInfo = {
    id: socket.id,
    connectedAt: new Date().toISOString(),
    userAgent: socket.handshake.headers['user-agent'] || 'Unknown'
  };
  
  connectedDevices.set(socket.id, deviceInfo);
  console.log(`📱 Device connected: ${socket.id} (${connectedDevices.size} total devices)`);
  
  // Send current data to newly connected device
  socket.emit('initial-data', {
    classroomData,
    currentWeek: getWeekKey(),
    serverInfo: {
      ip: getLocalIP(),
      connectedDevices: connectedDevices.size
    }
  });
  
  // Handle random student selection
  socket.on('select-random-student', (data) => {
    io.emit('student-selected', {
      className: data.className,
      studentIndex: data.studentIndex,
      studentId: data.studentId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle selection clearing
  socket.on('clear-selection', (data) => {
    io.emit('selection-cleared', {
      className: data.className,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle device ping (for connection monitoring)
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
  
  socket.on('disconnect', () => {
    connectedDevices.delete(socket.id);
    console.log(`📱 Device disconnected: ${socket.id} (${connectedDevices.size} total devices)`);
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  saveDataToFile();
  process.exit(0);
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  console.log('\n🚀 Classroom Participation Tracker Server Started!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Local access:     http://localhost:${PORT}`);
  console.log(`🌐 Network access:   http://${localIP}:${PORT}`);
  console.log(`📊 Health check:     http://${localIP}:${PORT}/api/health`);
  console.log(`📅 Current week:     ${getWeekKey()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📱 Connect devices to the network URL above');
  console.log('⚡ Real-time sync enabled across all devices');
  console.log('💾 Data auto-saves every 30 seconds');
  console.log('\nPress Ctrl+C to stop the server\n');
});