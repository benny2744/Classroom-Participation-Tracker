import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Download, Upload, RotateCcw, Users, Calendar, Camera } from 'lucide-react';

const ClassroomTracker = () => {
  const [classes, setClasses] = useState({});
  const [currentClass, setCurrentClass] = useState('');
  const [students, setStudents] = useState([]);
  const [currentWeek, setCurrentWeek] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const fileInputRefs = useRef({});

  // Initialize data and current week
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('classroomData') || '{}');
    setClasses(savedData);
    
    const weekKey = getWeekKey();
    setCurrentWeek(weekKey);
    
    // Auto-reset if new week
    checkAndResetWeek(savedData, weekKey);
  }, []);

  // Get current week key (year-week format)
  const getWeekKey = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNum}`;
  };

  // Check if we need to reset for new week
  const checkAndResetWeek = (data, weekKey) => {
    Object.keys(data).forEach(className => {
      if (data[className].lastWeek !== weekKey) {
        // Archive current week data
        if (!data[className].weeklyHistory) data[className].weeklyHistory = {};
        if (data[className].lastWeek) {
          data[className].weeklyHistory[data[className].lastWeek] = 
            data[className].students.map(s => ({ name: s.name, points: s.points }));
        }
        
        // Reset points for new week
        data[className].students.forEach(student => {
          student.points = 0;
        });
        data[className].lastWeek = weekKey;
      }
    });
    
    setClasses(data);
    localStorage.setItem('classroomData', JSON.stringify(data));
  };

  // Update current students when class changes
  useEffect(() => {
    if (currentClass && classes[currentClass]) {
      setStudents([...classes[currentClass].students]);
    } else {
      setStudents([]);
    }
  }, [currentClass, classes]);

  // Save data to localStorage
  const saveData = (updatedClasses) => {
    localStorage.setItem('classroomData', JSON.stringify(updatedClasses));
    setClasses(updatedClasses);
  };

  // Create new class
  const createClass = () => {
    if (!newClassName.trim()) return;
    
    const updatedClasses = {
      ...classes,
      [newClassName]: {
        students: [],
        lastWeek: currentWeek,
        weeklyHistory: {}
      }
    };
    
    saveData(updatedClasses);
    setCurrentClass(newClassName);
    setNewClassName('');
  };

  // Add/remove points
  const updatePoints = (studentIndex, change) => {
    if (!currentClass) return;
    
    const updatedStudents = [...students];
    const newPoints = Math.max(0, Math.min(20, updatedStudents[studentIndex].points + change));
    updatedStudents[studentIndex].points = newPoints;
    
    const updatedClasses = {
      ...classes,
      [currentClass]: {
        ...classes[currentClass],
        students: updatedStudents
      }
    };
    
    setStudents(updatedStudents);
    saveData(updatedClasses);
  };

  // Reset current week points
  const resetWeek = () => {
    if (!currentClass) return;
    
    const resetStudents = students.map(s => ({ ...s, points: 0 }));
    const updatedClasses = {
      ...classes,
      [currentClass]: {
        ...classes[currentClass],
        students: resetStudents
      }
    };
    
    setStudents(resetStudents);
    saveData(updatedClasses);
  };

  // Generate CSV
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

  // Compress image before storing
  const compressImage = (file, maxWidth = 200, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Check localStorage size
  const getStorageSize = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  };

  // Upload custom profile picture
  const uploadProfilePic = async (studentIndex, event) => {
    const file = event.target.files[0];
    if (!file || !currentClass) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Validate file size (max 10MB original)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB');
      return;
    }
    
    try {
      // Compress the image
      const compressedImage = await compressImage(file, 200, 0.6);
      
      // Check if adding this image would exceed storage
      const estimatedSize = compressedImage.length;
      const currentSize = getStorageSize();
      const maxSize = 5 * 1024 * 1024; // 5MB localStorage limit (conservative)
      
      if (currentSize + estimatedSize > maxSize) {
        alert('Storage full! Try removing some custom photos or use smaller images.');
        return;
      }
      
      const updatedStudents = [...students];
      updatedStudents[studentIndex].avatar = compressedImage;
      updatedStudents[studentIndex].hasCustomAvatar = true;
      
      const updatedClasses = {
        ...classes,
        [currentClass]: {
          ...classes[currentClass],
          students: updatedStudents
        }
      };
      
      setStudents(updatedStudents);
      saveData(updatedClasses);
      
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try a different photo.');
    }
    
    // Reset the input
    event.target.value = '';
  };

  // Reset to default avatar
  const resetToDefaultAvatar = (studentIndex) => {
    if (!currentClass) return;
    
    const updatedStudents = [...students];
    const student = updatedStudents[studentIndex];
    updatedStudents[studentIndex].avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`;
    updatedStudents[studentIndex].hasCustomAvatar = false;
    
    const updatedClasses = {
      ...classes,
      [currentClass]: {
        ...classes[currentClass],
        students: updatedStudents
      }
    };
    
    setStudents(updatedStudents);
    saveData(updatedClasses);
  };
  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file || !currentClass) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      const importedStudents = lines.slice(1).map((line, index) => {
        const values = line.split(',');
        return {
          id: index,
          name: values[0]?.trim() || `Student ${index + 1}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values[0]?.trim() || index}`,
          points: 0
        };
      });
      
      const updatedClasses = {
        ...classes,
        [currentClass]: {
          ...classes[currentClass],
          students: importedStudents
        }
      };
      
      setStudents(importedStudents);
      saveData(updatedClasses);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Render participation lights
  const renderLights = (points) => {
    const lights = [];
    for (let i = 0; i < 5; i++) {
      let lightClass = 'w-4 h-4 rounded-full border-2 ';
      
      // Determine which "round" of points we're in and which light position
      const currentPoint = i + 1;
      
      if (points >= currentPoint) {
        // First round (1-5): Green
        if (points <= 5) {
          lightClass += 'bg-green-400 border-green-500';
        } 
        // Second round (6-10): Blue lights replace green one by one
        else if (points <= 10) {
          if (points >= currentPoint + 5) {
            lightClass += 'bg-blue-400 border-blue-500';
          } else {
            lightClass += 'bg-green-400 border-green-500';
          }
        }
        // Third round (11-15): Purple lights replace blue one by one
        else if (points <= 15) {
          if (points >= currentPoint + 10) {
            lightClass += 'bg-purple-400 border-purple-500';
          } else if (points >= currentPoint + 5) {
            lightClass += 'bg-blue-400 border-blue-500';
          } else {
            lightClass += 'bg-green-400 border-green-500';
          }
        }
        // Fourth round (16-20): Gold lights replace purple one by one
        else {
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="text-blue-600" />
            Classroom Participation Tracker
          </h1>
          
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
              />
              <button
                onClick={createClass}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Class
              </button>
            </div>
            
            <select
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Select a class...</option>
              {Object.keys(classes).map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          {/* Controls */}
          {currentClass && (
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                Week: {currentWeek}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                📊 Storage: {Math.round(getStorageSize() / 1024)}KB used
              </div>
              
              <label className="px-4 py-2 bg-green-600 text-white rounded-md cursor-pointer hover:bg-green-700 flex items-center gap-2">
                <Upload size={16} />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={importCSV}
                  className="hidden"
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset Week
              </button>
            </div>
          )}
        </div>

        {/* Students Grid */}
        {currentClass ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {students.map((student, index) => (
              <div key={student.id} className="bg-white rounded-lg shadow-md p-4 text-center">
                {/* Profile Picture with Upload */}
                <div className="relative group mb-3">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-16 h-16 rounded-full mx-auto bg-gray-100 object-cover"
                  />
                  
                  {/* Upload overlay - appears on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera size={20} className="text-white" />
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={el => fileInputRefs.current[student.id] = el}
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadProfilePic(index, e)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {/* Reset button for custom avatars */}
                  {student.hasCustomAvatar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetToDefaultAvatar(index);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                      title="Reset to default avatar"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-800 mb-2 text-sm truncate">
                  {student.name}
                </h3>
                
                {/* Participation Lights */}
                <div className="flex justify-center gap-1 mb-3">
                  {renderLights(student.points)}
                </div>
                
                {/* Points Display */}
                <div className="text-lg font-bold text-gray-700 mb-3">
                  {student.points}/20
                </div>
                
                {/* Control Buttons */}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => updatePoints(index, -1)}
                    disabled={student.points === 0}
                    className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center"
                  >
                    <Minus size={14} />
                  </button>
                  
                  <button
                    onClick={() => updatePoints(index, 1)}
                    disabled={student.points === 20}
                    className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-400 mb-4" size={64} />
            <h2 className="text-xl text-gray-600 mb-2">No class selected</h2>
            <p className="text-gray-500">Create a new class or select an existing one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomTracker;
