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

// Helper function to get network IP
const getNetworkIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initialize sample data if empty
if (Object.keys(classroomData).length === 0) {
  classroomData = {
    "Sample Class": {
      students: [
        {
          id: generateId(),
          name: "Alice Johnson",
          points: 3,
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice Johnson",
          hasCustomAvatar: false,
          lastUpdated: new Date().toISOString()
        },
        {
          id: generateId(),
          name: "Bob Smith",
          points: 7,
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob Smith",
          hasCustomAvatar: false,
          lastUpdated: new Date().toISOString()
        },
        {
          id: generateId(),
          name: "Carol Davis",
          points: 12,
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol Davis",
          hasCustomAvatar: false,
          lastUpdated: new Date().toISOString()
        }
      ],
      currentWeek: "Week 1",
      lastUpdated: new Date().toISOString()
    }
  };
  saveDataToFile();
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connectedDevices: connectedDevices.size
  });
});

// Get all classes
app.get('/api/classes', (req, res) => {
  res.json({ classes: classroomData });
});

// Create new class
app.post('/api/classes', (req, res) => {
  const { className } = req.body;
  
  if (!className || typeof className !== 'string') {
    return res.status(400).json({ error: 'Class name is required' });
  }
  
  if (classroomData[className]) {
    return res.status(409).json({ error: 'Class already exists' });
  }
  
  classroomData[className] = {
    students: [],
    currentWeek: 'Week 1',
    lastUpdated: new Date().toISOString()
  };
  
  saveDataToFile();
  io.emit('class-created', { className, currentWeek: 'Week 1' });
  res.json({ success: true, className });
});

// Delete class
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

// Get students in a class
app.get('/api/classes/:className/students', (req, res) => {
  const { className } = req.params;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  res.json({ 
    students: classroomData[className].students.map(s => ({ name: s.name, points: s.points })),
    currentWeek: classroomData[className].currentWeek
  });
});

// Add student to class
app.post('/api/classes/:className/students', (req, res) => {
  const { className } = req.params;
  const { student } = req.body;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  if (!student || !student.name) {
    return res.status(400).json({ error: 'Student name is required' });
  }
  
  const newStudent = {
    id: generateId(),
    name: student.name,
    points: 0,
    avatar: student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
    hasCustomAvatar: student.hasCustomAvatar || false,
    lastUpdated: new Date().toISOString()
  };
  
  classroomData[className].students.push(newStudent);
  classroomData[className].lastUpdated = new Date().toISOString();
  saveDataToFile();
  
  io.emit('student-added', { className, student: newStudent });
  res.json({ success: true, student: newStudent });
});

// Delete student from class
app.delete('/api/classes/:className/students/:studentId', (req, res) => {
  const { className, studentId } = req.params;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  const studentIndex = classroomData[className].students.findIndex(s => s.id == studentId);
  if (studentIndex === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  const deletedStudent = classroomData[className].students.splice(studentIndex, 1)[0];
  classroomData[className].lastUpdated = new Date().toISOString();
  saveDataToFile();
  
  io.emit('student-deleted', { className, studentId, studentIndex });
  res.json({ success: true, deletedStudent });
});

app.put('/api/classes/:className/students/:studentId/points', (req, res) => {
  const { className, studentId } = req.params;
  const { points, change } = req.body;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  const student = classroomData[className].students.find(s => s.id == studentId);
  if (!student) {
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
  
  io.emit('student-points-updated', { 
    className, 
    studentId, 
    points: student.points,
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
  
  const student = classroomData[className].students.find(s => s.id == studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  // Update allowed fields
  const allowedUpdates = ['name', 'avatar', 'hasCustomAvatar'];
  allowedUpdates.forEach(field => {
    if (updates[field] !== undefined) {
      student[field] = updates[field];
    }
  });
  
  student.lastUpdated = new Date().toISOString();
  classroomData[className].lastUpdated = new Date().toISOString();
  saveDataToFile();
  
  io.emit('student-updated', { className, studentId, updates });
  res.json({ success: true, student });
});

// Reset week (set all points to 0)
app.post('/api/classes/:className/reset-week', (req, res) => {
  const { className } = req.params;
  
  if (!classroomData[className]) {
    return res.status(404).json({ error: 'Class not found' });
  }
  
  // Reset points for new week
  classroomData[className].students.forEach(student => {
    student.points = 0;
    student.lastUpdated = new Date().toISOString();
  });
  
  classroomData[className].lastUpdated = new Date().toISOString();
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
  console.log(`📱 Device connected: ${socket.id} (Total: ${connectedDevices.size})`);
  
  // Send current data to newly connected client
  socket.emit('classes-updated', { classes: classroomData });
  
  // Handle student selection broadcasting
  socket.on('student-selected', (data) => {
    socket.broadcast.emit('student-selected', data);
  });
  
  socket.on('selection-cleared', (data) => {
    socket.broadcast.emit('selection-cleared', data);
  });
  
  socket.on('disconnect', () => {
    connectedDevices.delete(socket.id);
    console.log(`📱 Device disconnected: ${socket.id} (Total: ${connectedDevices.size})`);
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
const networkIP = getNetworkIP();

server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Classroom Participation Tracker Server Started!');
  console.log(`📡 Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${networkIP}:${PORT}`);
  console.log(`📊 Classes loaded: ${Object.keys(classroomData).length}`);
  console.log(`👥 Total students: ${Object.values(classroomData).reduce((sum, cls) => sum + cls.students.length, 0)}`);
  console.log('\n💡 Connect multiple devices to the same network and use the Network URL for real-time sync!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  saveDataToFile();
  server.close(() => {
    console.log('✅ Server shut down gracefully');
    process.exit(0);
  });
});