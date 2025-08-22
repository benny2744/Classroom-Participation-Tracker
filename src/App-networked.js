import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Minus, Download, Upload, RotateCcw, Users, Calendar, Camera, UserPlus, Trash2, X, ChevronUp, ChevronDown, Settings, Shuffle, Target, Wifi, WifiOff, Server, Presentation } from 'lucide-react';
import io from 'socket.io-client';

const ClassroomTracker = () => {
  const [classes, setClasses] = useState({});
  const [currentClass, setCurrentClass] = useState('');
  const [students, setStudents] = useState([]);
  const [currentWeek, setCurrentWeek] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const [toolsMinimized, setToolsMinimized] = useState(false);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(null);
  const [presentationMode, setPresentationMode] = useState(false);
  
  // Network-related state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [connectedDevices, setConnectedDevices] = useState(0);
  const [connectionError, setConnectionError] = useState('');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  
  const fileInputRefs = useRef({});
  const reconnectTimeoutRef = useRef(null);
  const [processingOperations, setProcessingOperations] = useState(new Set());
  const socketRef = useRef(null);
  const mountedRef = useRef(true);

  // Auto-detect server URL
  const detectServerUrl = useCallback(() => {
    const hostname = window.location.hostname;
    const serverUrl = `http://${hostname}:3001`;
    console.log('Detected server URL:', serverUrl);
    return serverUrl;
  }, []);

  // API helper functions
  const apiCall = useCallback(async (endpoint, options = {}) => {
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
        throw new Error(`API call failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      setConnectionError(`API Error: ${error.message}`);
      throw error;
    }
  }, [serverUrl]);

  // Initialize connection - only once
  useEffect(() => {
    mountedRef.current = true;
    
    const savedMinimized = JSON.parse(localStorage.getItem('controlsMinimized') || 'false');
    const savedToolsMinimized = JSON.parse(localStorage.getItem('toolsMinimized') || 'false');
    setControlsMinimized(savedMinimized);
    setToolsMinimized(savedToolsMinimized);

    const detectedUrl = detectServerUrl();
    setServerUrl(detectedUrl);
    
    // Only connect if we don't have an existing socket
    if (!socketRef.current) {
      connectToServer(detectedUrl);
    }
    
    // Cleanup on unmount
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
  }, []); // Empty dependency array - only run once

  // Connect to server - fixed to prevent duplicate listeners
  const connectToServer = useCallback((url) => {
    // Clean up existing socket if any
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
      reconnectionDelay: 1000
    });

    // Store socket in ref
    socketRef.current = newSocket;

    // Connection events
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
    });

    // Listen for initial data
    newSocket.on('initial-data', (data) => {
      if (!mountedRef.current) return;
      setClasses(data.classroomData);
      setCurrentWeek(data.currentWeek);
      setConnectedDevices(data.serverInfo.connectedDevices);
    });

    // Real-time event listeners - all check mountedRef
    newSocket.on('class-created', (data) => {
      if (!mountedRef.current) return;
      setClasses(prev => ({
        ...prev,
        [data.className]: data.data
      }));
    });

    newSocket.on('class-deleted', (data) => {
      if (!mountedRef.current) return;
      setClasses(prev => {
        const updated = { ...prev };
        delete updated[data.className];
        return updated;
      });
      setCurrentClass(prevClass => prevClass === data.className ? '' : prevClass);
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
      
      // Clear selection if deleted student was selected
      setSelectedStudentIndex(prevIndex => {
        if (data.studentIndex === prevIndex) return null;
        if (prevIndex !== null && prevIndex > data.studentIndex) return prevIndex - 1;
        return prevIndex;
      });
    });

    newSocket.on('student-points-updated', (data) => {
      if (!mountedRef.current) return;
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
      setCurrentWeek(data.week);
      loadClassData();
    });

    setSocket(newSocket);
  }, []); // Empty dependencies - only create once

  // Load class data
  const loadClassData = useCallback(async () => {
    if (!serverUrl || !mountedRef.current) return;
    
    try {
      const data = await apiCall('/api/classes');
      if (data && mountedRef.current) {
        setClasses(data);
      }
    } catch (error) {
      console.error('Failed to load class data:', error);
    }
  }, [apiCall, serverUrl]);

  // Update current students when class changes - with cleanup
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

  // Save minimized state to localStorage
  const toggleControls = () => {
    const newMinimizedState = !controlsMinimized;
    setControlsMinimized(newMinimizedState);
    localStorage.setItem('controlsMinimized', JSON.stringify(newMinimizedState));
  };

  const toggleTools = () => {
    const newToolsMinimizedState = !toolsMinimized;
    setToolsMinimized(newToolsMinimizedState);
    localStorage.setItem('toolsMinimized', JSON.stringify(newToolsMinimizedState));
  };

  // Create new class - with processing flag
  const createClass = async () => {
    if (!newClassName.trim() || !isConnected) return;
    
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

  // Add/remove points - with optimistic updates
  const updatePoints = async (studentIndex, change) => {
    if (!currentClass || !isConnected || !students[studentIndex]) return;
    
    const student = students[studentIndex];
    const operationKey = `points-${student.id}-${change}`;
    
    // Check if this specific operation is already in progress
    if (processingOperations.has(operationKey)) return;
    
    console.log('Updating points for student:', student.name, 'change:', change);
    
    // Calculate new points value
    const newPoints = Math.max(0, Math.min(20, student.points + change));
    
    // Optimistic update - update local state immediately
    setStudents(prev => prev.map((s, idx) => 
      idx === studentIndex 
        ? { ...s, points: newPoints }
        : s
    ));
    
    // Mark this operation as processing
    setProcessingOperations(prev => new Set(prev).add(operationKey));
    
    try {
      const result = await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/students/${student.id}/points`, {
        method: 'PUT',
        body: JSON.stringify({ change })
      });
      
      if (result) {
        console.log('Points update result:', result);
      }
    } catch (error) {
      // Revert the optimistic update on error
      setStudents(prev => prev.map((s, idx) => 
        idx === studentIndex 
          ? { ...s, points: student.points }
          : s
      ));
      console.error('Points update error:', error);
      alert('Failed to update points. Please check your connection.');
    } finally {
      // Remove the operation from processing set
      setProcessingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  };

  // Add new student
  const addStudent = async () => {
    if (!newStudentName.trim() || !currentClass || !isConnected) return;
    
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

  // Delete student - with processing flag
  const confirmDeleteStudent = async () => {
    if (showDeleteConfirm === null || !currentClass || !isConnected) return;
    
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

  // Reset week - with processing flag
  const resetWeek = async () => {
    if (!currentClass || !isConnected) return;
    
    try {
      await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/reset-week`, {
        method: 'POST'
      });
    } catch (error) {
      alert('Failed to reset week. Please check your connection.');
    }
  };

  // Add points to all students - with optimistic updates
  const addPointToAll = async () => {
    if (!currentClass || students.length === 0 || !isConnected) return;
    
    const operationKey = 'add-all-points';
    
    // Check if this operation is already in progress
    if (processingOperations.has(operationKey)) return;
    
    // Optimistic update - update local state immediately
    setStudents(prev => prev.map(student => ({
      ...student,
      points: Math.max(0, Math.min(20, student.points + 1))
    })));
    
    // Mark this operation as processing
    setProcessingOperations(prev => new Set(prev).add(operationKey));
    
    try {
      await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/all-points`, {
        method: 'POST',
        body: JSON.stringify({ change: 1 })
      });
    } catch (error) {
      // Revert the optimistic update on error
      setStudents(prev => prev.map(student => ({
        ...student,
        points: Math.max(0, Math.min(20, student.points - 1))
      })));
      alert('Failed to update all students. Please check your connection.');
    } finally {
      // Remove the operation from processing set
      setProcessingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  };

  // Subtract points from all students - with optimistic updates
  const subtractPointFromAll = async () => {
    if (!currentClass || students.length === 0 || !isConnected) return;
    
    const operationKey = 'subtract-all-points';
    
    // Check if this operation is already in progress
    if (processingOperations.has(operationKey)) return;
    
    // Optimistic update - update local state immediately
    setStudents(prev => prev.map(student => ({
      ...student,
      points: Math.max(0, Math.min(20, student.points - 1))
    })));
    
    // Mark this operation as processing
    setProcessingOperations(prev => new Set(prev).add(operationKey));
    
    try {
      await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/all-points`, {
        method: 'POST',
        body: JSON.stringify({ change: -1 })
      });
    } catch (error) {
      // Revert the optimistic update on error
      setStudents(prev => prev.map(student => ({
        ...student,
        points: Math.max(0, Math.min(20, student.points + 1))
      })));
      alert('Failed to update all students. Please check your connection.');
    } finally {
      // Remove the operation from processing set
      setProcessingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  };

  // Random student selection - using socketRef
  const selectRandomStudent = () => {
    if (students.length === 0 || !socketRef.current) {
      alert('No students available to select!');
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * students.length);
    const student = students[randomIndex];
    
    socketRef.current.emit('select-random-student', {
      className: currentClass,
      studentIndex: randomIndex,
      studentId: student.id
    });
    
    // Auto-scroll to the selected student
    setTimeout(() => {
      const studentCard = document.querySelector(`[data-student-index="${randomIndex}"]`);
      if (studentCard) {
        studentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Clear selection - using socketRef
  const clearSelection = () => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('clear-selection', {
      className: currentClass
    });
  };

  // Update student profile - with processing flag
  const updateStudentProfile = async (studentIndex, updates) => {
    if (!currentClass || !isConnected || !students[studentIndex]) return;
    
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
    if (!file || !currentClass || !isConnected) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Validate file size (max 2MB for network transfer)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB');
      return;
    }
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        
        await updateStudentProfile(studentIndex, {
          avatar: base64,
          hasCustomAvatar: true
        });
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try a different photo.');
    }
    
    // Reset the input
    event.target.value = '';
  };

  // Reset to default avatar
  const resetToDefaultAvatar = async (studentIndex) => {
    if (!currentClass || !isConnected) return;
    
    const student = students[studentIndex];
    await updateStudentProfile(studentIndex, {
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
      hasCustomAvatar: false
    });
  };

  // Export CSV
  const exportCSV = () => {
    if (!students.length) {
      alert('No students to export!');
      return;
    }
    
    const csvContent = [
      'Name,Points',
      ...students.map(s => `"${s.name}",${s.points}`)
    ].join('\n');
    
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${currentClass || 'class'}-${currentWeek}-participation.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Import CSV - fixed with processing flag
  const importCSV = async (event) => {
    const file = event.target.files[0];
    if (!file || !currentClass || !isConnected) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file must have at least a header and one student row.');
        return;
      }
      
      try {
        // Import students one by one to ensure proper server sync
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const studentName = values[0]?.replace(/"/g, '').trim();
          
          if (studentName && mountedRef.current) {
            await apiCall(`/api/classes/${encodeURIComponent(currentClass)}/students`, {
              method: 'POST',
              body: JSON.stringify({
                student: {
                  name: studentName,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentName}`,
                  hasCustomAvatar: false
                }
              })
            });
            
            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        if (mountedRef.current) {
          alert(`Successfully imported ${lines.length - 1} students!`);
        }
      } catch (error) {
        console.error('CSV import error:', error);
        alert('Failed to import some students. Please check your connection and try again.');
      }
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

  // Get border color based on point ranges
  const getBorderColor = (points) => {
    if (points === 0) return 'border-gray-300';
    if (points <= 5) return 'border-green-500';
    if (points <= 10) return 'border-blue-500';
    if (points <= 15) return 'border-purple-500';
    return 'border-yellow-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Connection Status Bar */}
        <div className={`mb-4 p-3 rounded-lg flex items-center justify-between text-sm transition-colors duration-200 ${
          isConnected 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="font-medium">
              {isConnected ? 'Connected to server' : 'Disconnected from server'}
            </span>
            {isConnected && connectedDevices > 1 && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                {connectedDevices} devices online
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Presentation Mode Toggle */}
            {currentClass && (
              <button
                onClick={() => setPresentationMode(!presentationMode)}
                className={`px-3 py-1 rounded-md flex items-center gap-2 transition-colors duration-200 text-xs ${
                  presentationMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Presentation size={14} />
                {presentationMode ? 'Exit Presentation' : 'Presentation Mode'}
              </button>
            )}
            {!isConnected && (
              <button
                onClick={() => connectToServer(serverUrl)}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>

        {/* Connection Error Modal */}
        {showConnectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Server className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Connection Error</h3>
                  <p className="text-sm text-gray-600">Cannot connect to the server</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                {connectionError}
              </p>
              
              <div className="text-sm text-gray-600 mb-6">
                <p><strong>Make sure:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The server is running</li>
                  <li>You're connected to the same network</li>
                  <li>The server URL is correct</li>
                </ul>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConnectionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => connectToServer(serverUrl)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header - Collapsible - Hidden in Presentation Mode */}
        {!presentationMode && (
          <div className={`bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out ${controlsMinimized ? 'mb-3' : 'mb-6'}`}>
            {/* Always Visible Header Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h1 className={`font-bold text-gray-800 flex items-center gap-2 transition-all duration-300 ${controlsMinimized ? 'text-xl' : 'text-3xl'}`}>
                    <Users className="text-blue-600" />
                    {controlsMinimized ? 'Tracker' : 'Classroom Participation Tracker'}
                    {!isConnected && <span className="text-red-500 text-sm">(Offline)</span>}
                  </h1>
                  
                  {/* Minimized Info Display */}
                  {controlsMinimized && currentClass && (
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium text-blue-600">{currentClass}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {currentWeek}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {students.length} students
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Toggle Button */}
                <button
                  onClick={toggleControls}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  title={controlsMinimized ? 'Show controls' : 'Hide controls'}
                >
                  <Settings size={16} />
                  {controlsMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${controlsMinimized ? 'max-h-0' : 'max-h-96'}`}>
              <div className="p-6 pt-4">
                {/* Class Management */}
                <div className="flex flex-wrap gap-4 items-center mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New class name"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                      onKeyPress={(e) => e.key === 'Enter' && createClass()}
                      disabled={!isConnected}
                    />
                    <button
                      onClick={createClass}
                      disabled={!isConnected}
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
                    <option value="">Select a class...</option>
                    {Object.keys(classes).map(className => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>

                {/* Controls */}
                {currentClass && (
                  <div className="space-y-4">
                    {/* Add Student Section */}
                    <div className="flex flex-wrap gap-3 items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Student name"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          className="px-3 py-2 border rounded-md"
                          onKeyPress={(e) => e.key === 'Enter' && addStudent()}
                          disabled={!isConnected}
                        />
                        <button
                          onClick={addStudent}
                          disabled={!isConnected}
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
                    
                    {/* Main Controls */}
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        Week: {currentWeek}
                      </div>
                      
                      <label className="px-4 py-2 bg-green-600 text-white rounded-md cursor-pointer hover:bg-green-700 flex items-center gap-2">
                        <Upload size={16} />
                        Import CSV
                        <input
                          type="file"
                          accept=".csv"
                          onChange={importCSV}
                          className="hidden"
                          disabled={!isConnected}
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
                        disabled={!isConnected}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-2"
                      >
                        <RotateCcw size={16} />
                        Reset Week
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tools Section - Collapsible - Hidden in Presentation Mode */}
        {currentClass && !presentationMode && (
          <div className={`bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out ${toolsMinimized ? 'mb-3' : 'mb-6'}`}>
            {/* Tools Header Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className={`font-semibold text-gray-700 flex items-center gap-2 transition-all duration-300 ${toolsMinimized ? 'text-lg' : 'text-xl'}`}>
                    <Target className="text-purple-600" />
                    Tools
                  </h2>
                  
                  {/* Minimized Tools Info */}
                  {toolsMinimized && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>Random selection & class actions available</span>
                      {selectedStudentIndex !== null && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                          {students[selectedStudentIndex]?.name} selected
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Tools Toggle Button */}
                <button
                  onClick={toggleTools}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  title={toolsMinimized ? 'Show tools' : 'Hide tools'}
                >
                  <Target size={16} />
                  {toolsMinimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
            </div>

            {/* Collapsible Tools Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${toolsMinimized ? 'max-h-0' : 'max-h-96'}`}>
              <div className="p-6 pt-4 space-y-4">
                {/* Random Student Selection */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mr-4">
                    <Shuffle size={16} />
                    Student Selection:
                  </div>
                  
                  <button
                    onClick={selectRandomStudent}
                    disabled={students.length === 0 || !isConnected}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
                  >
                    <Shuffle size={16} />
                    Random Student
                  </button>
                  
                  {selectedStudentIndex !== null && (
                    <button
                      onClick={clearSelection}
                      disabled={!isConnected}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 flex items-center gap-2 transition-colors duration-200"
                    >
                      <X size={16} />
                      Clear Selection
                    </button>
                  )}
                  
                  {selectedStudentIndex !== null && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Target size={16} className="text-purple-600" />
                      <span className="text-purple-700 font-medium">
                        Selected: {students[selectedStudentIndex]?.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Class-wide Actions */}
                <div className="flex flex-wrap gap-3 items-center border-t pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mr-4">
                    <Users size={16} />
                    Class Actions:
                  </div>
                  
                  <button
                    onClick={addPointToAll}
                    disabled={students.length === 0 || !isConnected}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
                  >
                    <Plus size={16} />
                    All +1
                  </button>
                  
                  <button
                    onClick={subtractPointFromAll}
                    disabled={students.length === 0 || !isConnected}
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
          </div>
        )}

        {/* Students Grid */}
        {currentClass ? (
          <>
            <div className={`grid gap-4 ${
              presentationMode 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10' 
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            }`}>
              {students.map((student, index) => (
                presentationMode ? (
                  /* Presentation Mode - Compact Cards */
                  <div 
                    key={student.id} 
                    data-student-index={index}
                    className={`bg-white rounded-lg shadow-md p-3 text-center relative transition-all duration-300 border-4 ${
                      getBorderColor(student.points)
                    } ${
                      selectedStudentIndex === index 
                        ? 'ring-4 ring-purple-400 ring-opacity-75 bg-purple-50 shadow-lg transform scale-105' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {selectedStudentIndex === index && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">
                        <Target size={12} />
                      </div>
                    )}
                    
                    {/* Student Name */}
                    <h3 className="font-bold text-gray-800 mb-2 text-sm leading-tight">
                      <span className="text-center">{student.name}</span>
                    </h3>
                    
                    {/* Points Display - Large and Prominent */}
                    <div className="bg-gray-50 rounded-lg p-2 mb-2">
                      <div className="text-xl font-bold text-gray-800">
                        {student.points}
                      </div>
                      <div className="text-xs text-gray-500">
                        points
                      </div>
                    </div>
                    
                    {/* Minimal Control Buttons */}
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => updatePoints(index, -1)}
                        disabled={student.points === 0 || !isConnected}
                        className="w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                      >
                        <Minus size={10} />
                      </button>
                      
                      <button
                        onClick={() => updatePoints(index, 1)}
                        disabled={student.points === 20 || !isConnected}
                        className="w-6 h-6 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal Mode - Full Cards */
                  <div 
                    key={student.id} 
                    data-student-index={index}
                    className={`bg-white rounded-lg shadow-md p-6 text-center relative group transition-all duration-300 ${
                      selectedStudentIndex === index 
                        ? 'ring-4 ring-purple-400 ring-opacity-75 bg-purple-50 shadow-lg transform scale-105' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {selectedStudentIndex === index && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg animate-pulse">
                        <Target size={16} />
                      </div>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => setShowDeleteConfirm(index)}
                      disabled={!isConnected}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete student"
                    >
                      <Trash2 size={12} />
                    </button>
                    
                    {/* Profile Picture with Upload */}
                    <div className="relative group mb-4">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-24 h-24 rounded-full mx-auto bg-gray-100 object-cover shadow-md"
                      />
                      
                      {/* Upload overlay - appears on hover */}
                      {isConnected && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Camera size={24} className="text-white" />
                        </div>
                      )}
                      
                      {/* Hidden file input */}
                      {isConnected && (
                        <input
                          ref={el => fileInputRefs.current[student.id] = el}
                          type="file"
                          accept="image/*"
                          onChange={(e) => uploadProfilePic(index, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={false}
                        />
                      )}
                      
                      {/* Reset button for custom avatars */}
                      {student.hasCustomAvatar && isConnected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetToDefaultAvatar(index);
                          }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                          title="Reset to default avatar"
                          disabled={false}
                        >
                          ×
                        </button>
                      )}
                      
                      {/* Small Points Display - positioned over avatar */}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-200 rounded-full px-2 py-1 shadow-sm">
                        <span className="text-xs font-medium text-gray-600">
                          {student.points}/20
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 mb-3 text-lg leading-tight px-1 min-h-[3rem] flex items-center justify-center">
                      <span className="text-center">{student.name}</span>
                    </h3>
                    
                    {/* Participation Lights */}
                    <div className="flex justify-center gap-1 mb-4">
                      {renderLights(student.points)}
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex gap-2 justify-center mt-2">
                      <button
                        onClick={() => updatePoints(index, -1)}
                        disabled={student.points === 0 || !isConnected}
                        className="w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                      >
                        <Minus size={16} />
                      </button>
                      
                      <button
                        onClick={() => updatePoints(index, 1)}
                        disabled={student.points === 20 || !isConnected}
                        className="w-10 h-10 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center transition-colors duration-200"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm !== null && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="text-red-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Delete Student</h3>
                      <p className="text-sm text-gray-600">This action cannot be undone</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold">
                      {students[showDeleteConfirm]?.name}
                    </span>
                    ? All their participation data will be permanently removed.
                  </p>
                  
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteStudent}
                      disabled={!isConnected}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Student
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h2 className="text-xl text-gray-600 mb-2">
              {isConnected ? 'No class selected' : 'Waiting for server connection'}
            </h2>
            <p className="text-gray-500">
              {isConnected 
                ? 'Create a new class or select an existing one to get started!' 
                : 'Please make sure the server is running and you are connected to the network.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomTracker;