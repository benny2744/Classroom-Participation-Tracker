import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Minus, Download, Upload, RotateCcw, Users, Calendar, Camera, UserPlus, Trash2, X, ChevronUp, ChevronDown, Settings, Shuffle, Target, Wifi, WifiOff, Server, Monitor, Eye, EyeOff } from 'lucide-react';
import io from 'socket.io-client';

const ClassroomTracker = () => {
  const [classes, setClasses] = useState({});
  const [currentClass, setCurrentClass] = useState('');
  const [students, setStudents] = useState([]);
  const [currentWeek, setCurrentWeek] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const [toolsMinimized, setToolsMinimized] = useState(false);
  const [presenterView, setPresenterView] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  
  const fileInputRefs = useRef({});
  const reconnectTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const socketRef = useRef(null);
  const mountedRef = useRef(true);

  // Auto-detect server URL
  const detectServerUrl = useCallback(() => {
    const hostname = window.location.hostname;
    const serverUrl = `http://${hostname}:3001`;
    console.log('Detected server URL:', serverUrl);
    return serverUrl;
  }, []);

  // API helper functions with processing flag
  const apiCall = useCallback(async (endpoint, options = {}) => {
    if (isProcessingRef.current) {
      console.log('Skipping API call - already processing');
      return null;
    }
    
    isProcessingRef.current = true;
    
    const url = `${serverUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call error:', error);
      setConnectionError(`API Error: ${error.message}`);
      throw error;
    } finally {
      // Reset processing flag immediately after request completes
      isProcessingRef.current = false;
    }
  }, [serverUrl]);

  // Initialize connection - only once
  useEffect(() => {
    mountedRef.current = true;
    
    const savedMinimized = JSON.parse(localStorage.getItem('controlsMinimized') || 'false');
    const savedToolsMinimized = JSON.parse(localStorage.getItem('toolsMinimized') || 'false');
    const savedPresenterView = JSON.parse(localStorage.getItem('presenterView') || 'false');
    setControlsMinimized(savedMinimized);
    setToolsMinimized(savedToolsMinimized);
    setPresenterView(savedPresenterView);

    const detectedUrl = detectServerUrl();
    setServerUrl(detectedUrl);
    connectToServer(detectedUrl);
    
    return () => {
      mountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Connect to server - fixed to prevent duplicate listeners
  const connectToServer = useCallback((url) => {
    if (socketRef.current) {
      console.log('Cleaning up existing socket');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionError('');
    
    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true  // Force new connection to prevent event listener duplication
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      if (!mountedRef.current) return;
      console.log('✅ Connected to server');
      setIsConnected(true);
      setConnectionError('');
      setShowConnectionModal(false);
    });

    newSocket.on('disconnect', () => {
      if (!mountedRef.current) return;
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      if (!mountedRef.current) return;
      console.error('Connection error:', error);
      setIsConnected(false);
      setConnectionError(`Cannot connect to server at ${url}`);
      setShowConnectionModal(true);
      
      // Auto-retry connection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connectToServer(url);
        }
      }, 5000);
    });

    // Socket event listeners
    newSocket.on('classes-updated', (data) => {
      if (!mountedRef.current) return;
      setClasses(data.classes);
    });

    newSocket.on('class-created', (data) => {
      if (!mountedRef.current) return;
      setClasses(prev => ({
        ...prev,
        [data.className]: {
          students: [],
          currentWeek: data.currentWeek || 'Week 1'
        }
      }));
    });

    newSocket.on('class-deleted', (data) => {
      if (!mountedRef.current) return;
      setClasses(prev => {
        const newClasses = { ...prev };
        delete newClasses[data.className];
        return newClasses;
      });
      if (currentClass === data.className) {
        setCurrentClass('');
      }
    });

    newSocket.on('student-added', (data) => {
      if (!mountedRef.current) return;
      setClasses(prev => ({
        ...prev,
        [data.className]: {
          ...prev[data.className],
          students: [...(prev[data.className]?.students || []), data.student]
        }
      }));
    });

    newSocket.on('student-deleted', (data) => {
      if (!mountedRef.current) return;
      setClasses(prev => ({
        ...prev,
        [data.className]: {
          ...prev[data.className],
          students: prev[data.className]?.students.filter(s => s.id !== data.studentId) || []
        }
      }));
      setSelectedStudentIndex(prevIndex => {
        if (prevIndex === null) return null;
        if (prevIndex === data.studentIndex) return null;
        if (prevIndex !== null && prevIndex > data.studentIndex) return prevIndex - 1;
        return prevIndex;
      });
    });

    newSocket.on('student-points-updated', (data) => {
      if (!mountedRef.current) return;
      console.log('Received student-points-updated:', data);
      
      // Ensure we have valid data for individual student update
      if (!data.studentId || typeof data.points !== 'number') {
        console.error('Invalid student-points-updated data:', data);
        return;
      }
      
      setClasses(prev => ({
        ...prev,
        [data.className]: {
          ...prev[data.className],
          students: prev[data.className]?.students.map(student =>
            student.id === data.studentId
              ? { ...student, points: data.points }
              : student
          ) || []
        }
      }));
    });

    newSocket.on('student-updated', (data) => {
      if (!mountedRef.current) return;
      setClasses(prev => ({
        ...prev,
        [data.className]: {
          ...prev[data.className],
          students: prev[data.className]?.students.map(student =>
            student.id === data.studentId
              ? { ...student, ...data.updates }
              : student
          ) || []
        }
      }));
    });

    newSocket.on('week-reset', (data) => {
      if (!mountedRef.current) return;
      setClasses(prev => ({
        ...prev,
        [data.className]: {
          ...prev[data.className],
          students: prev[data.className]?.students.map(student => ({ ...student, points: 0 })) || []
        }
      }));
    });

    newSocket.on('all-points-updated', (data) => {
      if (!mountedRef.current) return;
      console.log('Received all-points-updated:', data);
      
      // Ensure we have valid data for all-student update
      if (typeof data.change !== 'number') {
        console.error('Invalid all-points-updated data:', data);
        return;
      }
      
      setClasses(prev => ({
        ...prev,
        [data.className]: {
          ...prev[data.className],
          students: prev[data.className]?.students.map(student => ({
            ...student,
            points: Math.max(0, Math.min(20, student.points + data.change))
          })) || []
        }
      }));
    });

    newSocket.on('student-selected', (data) => {
      if (!mountedRef.current) return;
      setCurrentClass(prevClass => {
        if (data.className === prevClass) {
          setSelectedStudentIndex(data.studentIndex);
        }
        return prevClass;
      });
    });

    newSocket.on('selection-cleared', (data) => {
      if (!mountedRef.current) return;
      setCurrentClass(prevClass => {
        if (data.className === prevClass) {
          setSelectedStudentIndex(null);
        }
        return prevClass;
      });
    });

    newSocket.on('data-reset', (data) => {
      if (!mountedRef.current) return;
      setClasses({});
      setCurrentClass('');
      setStudents([]);
    });

    if (!serverUrl || !mountedRef.current) return;

    // Load initial data
    const loadInitialData = async () => {
      try {
        const response = await fetch(`${url}/api/classes`);
        if (response.ok) {
          const data = await response.json();
          if (mountedRef.current) {
            setClasses(data.classes);
          }
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Update current students when class changes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    if (currentClass && classes[currentClass]) {
      const newStudents = [...classes[currentClass].students];
      console.log('Syncing students from classes:', newStudents.length, 'students');
      setStudents(newStudents);
    } else {
      setStudents([]);
    }
    setSelectedStudentIndex(null);
  }, [currentClass, classes]);

  // Update current week when class changes
  useEffect(() => {
    if (currentClass && classes[currentClass]) {
      setCurrentWeek(classes[currentClass].currentWeek || 'Week 1');
    } else {
      setCurrentWeek('');
    }
  }, [currentClass, classes]);

  // Save UI preferences
  const toggleControlsMinimized = () => {
    const newMinimized = !controlsMinimized;
    setControlsMinimized(newMinimized);
    localStorage.setItem('controlsMinimized', JSON.stringify(newMinimized));
  };

  const toggleToolsMinimized = () => {
    const newToolsMinimized = !toolsMinimized;
    setToolsMinimized(newToolsMinimized);
    localStorage.setItem('toolsMinimized', JSON.stringify(newToolsMinimized));
  };

  const togglePresenterView = () => {
    const newPresenterView = !presenterView;
    setPresenterView(newPresenterView);
    localStorage.setItem('presenterView', JSON.stringify(newPresenterView));
  };

  // Create new class
  const createClass = async () => {
    if (!newClassName.trim() || !isConnected || isProcessingRef.current) return;
    
    try {
      const result = await apiCall('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ className: newClassName.trim() })
      });
      
      if (result) {
        setCurrentClass(newClassName.trim());
        setNewClassName('');
      }
    } catch (error) {
      alert('Failed to create class. Please check your connection.');
    }
  };

  // Add/remove points
  const updatePoints = async (studentIndex, change) => {
    if (!currentClass || !isConnected || !students[studentIndex] || isProcessingRef.current) return;
    
    const student = students[studentIndex];
    console.log('Updating points for student:', student.name, 'change:', change);
    
    try {
      const result = await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/students/${student.id}/points`, {
        method: 'PUT',
        body: JSON.stringify({ change })
      });
      
      if (result) {
        console.log('Points update result:', result);
      }
    } catch (error) {
      console.error('Points update error:', error);
      alert('Failed to update points. Please check your connection.');
    }
  };

  // Add new student
  const addStudent = async () => {
    if (!newStudentName.trim() || !currentClass || !isConnected || isProcessingRef.current) return;
    
    try {
      const result = await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/students`, {
        method: 'POST',
        body: JSON.stringify({
          student: {
            name: newStudentName.trim(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStudentName.trim()}`,
            hasCustomAvatar: false
          }
        })
      });
      
      if (result) {
        setNewStudentName('');
      }
    } catch (error) {
      alert('Failed to add student. Please check your connection.');
    }
  };

  // Delete student
  const confirmDeleteStudent = async () => {
    if (showDeleteConfirm === null || !currentClass || !isConnected || isProcessingRef.current) return;
    
    const student = students[showDeleteConfirm];
    try {
      const result = await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/students/${student.id}`, {
        method: 'DELETE'
      });
      
      if (result) {
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      alert('Failed to delete student. Please check your connection.');
    }
  };

  // Reset week
  const resetWeek = async () => {
    if (!currentClass || !isConnected || isProcessingRef.current) return;
    
    try {
      await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/reset-week`, {
        method: 'POST'
      });
    } catch (error) {
      alert('Failed to reset week. Please check your connection.');
    }
  };

  // Add points to all students
  const addPointToAll = async () => {
    if (!currentClass || students.length === 0 || !isConnected || isProcessingRef.current) return;
    
    try {
      await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/all-points`, {
        method: 'POST',
        body: JSON.stringify({ change: 1 })
      });
    } catch (error) {
      alert('Failed to update all students. Please check your connection.');
    }
  };

  // Subtract points from all students
  const subtractPointFromAll = async () => {
    if (!currentClass || students.length === 0 || !isConnected || isProcessingRef.current) return;
    
    try {
      await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/all-points`, {
        method: 'POST',
        body: JSON.stringify({ change: -1 })
      });
    } catch (error) {
      alert('Failed to update all students. Please check your connection.');
    }
  };

  // Random student selection
  const selectRandomStudent = () => {
    if (students.length === 0) return;
    const randomIndex = Math.floor(Math.random() * students.length);
    setSelectedStudentIndex(randomIndex);
    
    if (socketRef.current && currentClass) {
      socketRef.current.emit('student-selected', {
        className: currentClass,
        studentIndex: randomIndex
      });
    }
  };

  const clearSelection = () => {
    setSelectedStudentIndex(null);
    if (socketRef.current && currentClass) {
      socketRef.current.emit('selection-cleared', {
        className: currentClass
      });
    }
  };

  // Update student profile
  const updateStudentProfile = async (studentIndex, updates) => {
    if (!currentClass || !isConnected || !students[studentIndex] || isProcessingRef.current) return;
    
    const student = students[studentIndex];
    try {
      await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (error) {
      alert('Failed to update student profile. Please check your connection.');
    }
  };

  // Upload custom profile picture
  const uploadProfilePic = async (studentIndex, event) => {
    const file = event.target.files[0];
    if (!file || !currentClass || !isConnected || isProcessingRef.current) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        await updateStudentProfile(studentIndex, {
          avatar: base64,
          hasCustomAvatar: true
        });
      } catch (error) {
        alert('Failed to upload profile picture. Please try again.');
      }
    };
    reader.readAsDataURL(file);
    
    // Clear the input
    event.target.value = '';
  };

  // Reset to default avatar
  const resetToDefaultAvatar = async (studentIndex) => {
    if (!currentClass || !isConnected || isProcessingRef.current) return;
    
    const student = students[studentIndex];
    await updateStudentProfile(studentIndex, {
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
      hasCustomAvatar: false
    });
  };

  // Export CSV
  const exportCSV = () => {
    if (students.length === 0) {
      alert('No students to export');
      return;
    }
    
    const csvContent = [
      'Name,Points',
      ...students.map(s => `"${s.name}",${s.points}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentClass || 'classroom'}-${currentWeek || 'data'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Import CSV
  const importCSV = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentClass || !isConnected || isProcessingRef.current) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file must have at least a header and one student row.');
        return;
      }
      
      const header = lines[0].toLowerCase();
      if (!header.includes('name')) {
        alert('CSV must have a "Name" column.');
        return;
      }
      
      const hasPoints = header.includes('points');
      const nameIndex = header.split(',').findIndex(col => col.trim().replace(/"/g, '').includes('name'));
      const pointsIndex = hasPoints ? header.split(',').findIndex(col => col.trim().replace(/"/g, '').includes('points')) : -1;
      
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        const name = columns[nameIndex]?.trim().replace(/"/g, '');
        
        if (name) {
          try {
            const studentData = {
              name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
              hasCustomAvatar: false
            };
            
            const result = await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/students`, {
              method: 'POST',
              body: JSON.stringify({ student: studentData })
            });
            
            // If points column exists and student was added successfully, update points
            if (hasPoints && pointsIndex >= 0 && result && result.student) {
              const points = parseInt(columns[pointsIndex]?.trim().replace(/"/g, '')) || 0;
              if (points > 0) {
                await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/students/${result.student.id}/points`, {
                  method: 'PUT',
                  body: JSON.stringify({ points: Math.max(0, Math.min(20, points)) })
                });
              }
            }
          } catch (error) {
            console.error(`Failed to import student ${name}:`, error);
          }
        }
      }
      
      alert(`Import completed! Added students from CSV.`);
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  // Render participation lights
  const renderLights = (points) => {
    const lights = [];
    for (let i = 0; i < 5; i++) {
      let lightClass = 'w-4 h-4 rounded-full border-2 ';
      const currentPoint = i + 1;
      
      if (points >= currentPoint) {
        if (points <= 5) {
          lightClass += 'bg-green-400 border-green-500';
        } else if (points <= 10) {
          if (points >= currentPoint + 5) {
            lightClass += 'bg-blue-400 border-blue-500';
          } else {
            lightClass += 'bg-green-400 border-green-500';
          }
        } else if (points <= 15) {
          if (points >= currentPoint + 10) {
            lightClass += 'bg-purple-400 border-purple-500';
          } else if (points >= currentPoint + 5) {
            lightClass += 'bg-blue-400 border-blue-500';
          } else {
            lightClass += 'bg-green-400 border-green-500';
          }
        } else {
          if (points >= currentPoint + 15) {
            lightClass += 'bg-yellow-400 border-yellow-500';
          } else if (points >= currentPoint + 10) {
            lightClass += 'bg-purple-400 border-purple-500';
          } else if (points >= currentPoint + 5) {
            lightClass += 'bg-blue-400 border-blue-500';
          } else {
            lightClass += 'bg-green-400 border-green-500';
          }
        }
      } else {
        lightClass += 'bg-gray-200 border-gray-300';
      }
      
      lights.push(<div key={i} className={lightClass}></div>);
    }
    return lights;
  };

  // Get point color for presenter view
  const getPointColor = (points) => {
    if (points === 0) return 'text-gray-500';
    if (points <= 5) return 'text-green-500';
    if (points <= 10) return 'text-blue-500';
    if (points <= 15) return 'text-purple-500';
    return 'text-yellow-500';
  };

  // Get background color for presenter view
  const getCardBgColor = (points) => {
    if (points === 0) return 'bg-gray-50';
    if (points <= 5) return 'bg-green-50';
    if (points <= 10) return 'bg-blue-50';
    if (points <= 15) return 'bg-purple-50';
    return 'bg-yellow-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {isConnected ? (
            <>
              <Wifi size={16} />
              Connected
            </>
          ) : (
            <>
              <WifiOff size={16} />
              Disconnected
            </>
          )}
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <Server className="text-red-500" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Connection Error</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {connectionError || 'Unable to connect to the server. Please check if the server is running.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConnectionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setShowConnectionModal(false);
                  connectToServer(serverUrl);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Users className="text-blue-600" size={40} />
            Classroom Participation Tracker
          </h1>
          <p className="text-gray-600">Track student participation with real-time updates</p>
          {currentWeek && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <Calendar size={16} />
              {currentWeek}
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Settings size={20} />
              Controls
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={togglePresenterView}
                className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2 ${
                  presenterView 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {presenterView ? <Eye size={16} /> : <EyeOff size={16} />}
                {presenterView ? 'Presenter View' : 'Normal View'}
              </button>
              <button
                onClick={toggleControlsMinimized}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                {controlsMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            </div>
          </div>
          
          {!controlsMinimized && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class Management */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Monitor size={18} />
                    Class Management
                  </h3>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Enter class name"
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && createClass()}
                      disabled={!isConnected}
                    />
                    <button
                      onClick={createClass}
                      disabled={!isConnected || isProcessingRef.current}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      Create Class
                    </button>
                  </div>
                  
                  <select
                    value={currentClass}
                    onChange={(e) => setCurrentClass(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                    disabled={!isConnected}
                  >
                    <option value="">Select a class</option>
                    {Object.keys(classes).map(className => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>

                {/* Student Management */}
                {currentClass && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                      <UserPlus size={18} />
                      Student Management
                    </h3>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="Enter student name"
                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addStudent()}
                        disabled={!isConnected}
                      />
                      <button
                        onClick={addStudent}
                        disabled={!isConnected || isProcessingRef.current}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                      >
                        <UserPlus size={16} />
                        Add Student
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Students: {students.length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tools Panel */}
        {currentClass && (
          <div className="bg-white rounded-lg shadow-lg mb-6">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Target size={20} />
                Tools
              </h2>
              <button
                onClick={toggleToolsMinimized}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                {toolsMinimized ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
            </div>
            
            {!toolsMinimized && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Data Management */}
                  <div className="space-y-3">
                    <div className="font-semibold text-gray-700 text-sm">
                      Data Management:
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer flex items-center gap-2 text-center justify-center">
                        <Upload size={16} />
                        Import CSV
                        <input
                          type="file"
                          accept=".csv"
                          onChange={importCSV}
                          className="hidden"
                          disabled={!isConnected || isProcessingRef.current}
                        />
                      </label>
                      
                      <button
                        onClick={exportCSV}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                      >
                        <Download size={16} />
                        Export CSV
                      </button>
                      
                      <button
                        onClick={resetWeek}
                        disabled={!isConnected || isProcessingRef.current}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-2"
                      >
                        <RotateCcw size={16} />
                        Reset Week
                      </button>
                    </div>
                  </div>

                  {/* Student Selection */}
                  <div className="space-y-3">
                    <div className="font-semibold text-gray-700 text-sm">
                      Student Selection:
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={selectRandomStudent}
                        disabled={students.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 flex items-center gap-2"
                      >
                        <Shuffle size={16} />
                        Random Student
                      </button>
                      
                      <button
                        onClick={clearSelection}
                        disabled={selectedStudentIndex === null}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 flex items-center gap-2"
                      >
                        <X size={16} />
                        Clear Selection
                      </button>
                      
                      {selectedStudentIndex !== null && (
                        <div className="text-sm text-gray-600 text-center p-2 bg-indigo-50 rounded-md">
                          Selected: {students[selectedStudentIndex]?.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Class Actions */}
                  <div className="space-y-3">
                    <div className="font-semibold text-gray-700 text-sm">
                      Class Actions:
                    </div>
                    
                    <button
                      onClick={addPointToAll}
                      disabled={students.length === 0 || !isConnected || isProcessingRef.current}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
                    >
                      <Plus size={16} />
                      All +1
                    </button>
                    
                    <button
                      onClick={subtractPointFromAll}
                      disabled={students.length === 0 || !isConnected || isProcessingRef.current}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
                    >
                      <Minus size={16} />
                      All -1
                    </button>
                    
                    <div className="text-sm text-gray-500">
                      Affects all {students.length} students
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Students Grid */}
        {currentClass && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Users size={20} />
                {currentClass} - Students ({students.length})
              </h2>
            </div>
            
            {students.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No students added yet. Add your first student above!</p>
              </div>
            ) : (
              <div className={`p-6 ${
                presenterView 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                  : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
              }`}>
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-300 ${
                      selectedStudentIndex === index
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg transform scale-105'
                        : presenterView
                        ? `border-gray-200 ${getCardBgColor(student.points)} hover:shadow-md`
                        : 'border-gray-200 bg-white hover:shadow-md'
                    }`}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={() => setShowDeleteConfirm(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                      title="Delete student"
                    >
                      <Trash2 size={12} />
                    </button>
                    
                    {/* Avatar */}
                    <div className="relative mb-3 flex justify-center">
                      <div className="relative">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className={`w-16 h-16 rounded-full border-4 ${
                            selectedStudentIndex === index
                              ? 'border-indigo-400'
                              : 'border-gray-300'
                          }`}
                        />
                        
                        {/* Upload overlay for custom avatars */}
                        {isConnected && (
                          <input
                            ref={el => fileInputRefs.current[student.id] = el}
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadProfilePic(index, e)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isProcessingRef.current}
                          />
                        )}
                      </div>
                      
                      {/* Reset button for custom avatars */}
                      {student.hasCustomAvatar && isConnected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetToDefaultAvatar(index);
                          }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                          title="Reset to default avatar"
                          disabled={isProcessingRef.current}
                        >
                          ×
                        </button>
                      )}
                      
                      {/* Points Display */}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-200 rounded-full px-2 py-1 shadow-sm">
                        <span className="text-xs font-medium text-gray-600">
                          {student.points}/20
                        </span>
                      </div>
                    </div>
                    
                    {/* Student Name */}
                    <h3 className={`text-center font-medium mb-3 ${
                      presenterView ? `text-lg ${getPointColor(student.points)}` : 'text-sm text-gray-800'
                    }`}>
                      {student.name}
                    </h3>
                    
                    {/* Participation Lights */}
                    <div className="flex justify-center gap-1 mb-4">
                      {renderLights(student.points)}
                    </div>
                    
                    {/* Progress Bar for Presenter View */}
                    {presenterView && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              student.points === 0 ? 'bg-gray-400' :
                              student.points <= 5 ? 'bg-green-400' :
                              student.points <= 10 ? 'bg-blue-400' :
                              student.points <= 15 ? 'bg-purple-400' :
                              'bg-yellow-400'
                            }`}
                            style={{ width: `${(student.points / 20) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Control Buttons */}
                    <div className="flex gap-2 justify-center mt-2">
                      <button
                        onClick={() => updatePoints(index, -1)}
                        disabled={student.points === 0 || !isConnected || isProcessingRef.current}
                        className="w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <button
                        onClick={() => updatePoints(index, 1)}
                        disabled={student.points === 20 || !isConnected || isProcessingRef.current}
                        className="w-10 h-10 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Delete Student</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{students[showDeleteConfirm]?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteStudent}
                  disabled={!isConnected || isProcessingRef.current}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomTracker;