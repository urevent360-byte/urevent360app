import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Square, Calendar, BarChart3 } from 'lucide-react';

const TimeTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);  
  const [currentTask, setCurrentTask] = useState('');
  const [timeEntries, setTimeEntries] = useState([
    {
      id: '1',
      task: 'Johnson Wedding Setup',
      date: '2024-02-13',
      startTime: '09:00',
      endTime: '17:00',
      duration: 8.0,
      description: 'Venue decoration and setup coordination'
    },
    {
      id: '2', 
      task: 'Client Meeting - TechCorp',
      date: '2024-02-12',
      startTime: '14:00',
      endTime: '16:30',
      duration: 2.5,
      description: 'Initial consultation and requirement gathering'
    }
  ]);

  const weeklyHours = {
    target: 40,
    current: 38.5,
    overtime: 0
  };

  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setCurrentTime(time => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTracking = () => {
    if (currentTask.trim()) {
      setIsTracking(true);
    }
  };

  const pauseTracking = () => {
    setIsTracking(false);
  };

  const stopTracking = () => {
    if (currentTime > 0 && currentTask.trim()) {
      const newEntry = {
        id: Date.now().toString(),
        task: currentTask,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date(Date.now() - currentTime * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        duration: parseFloat((currentTime / 3600).toFixed(2)),
        description: ''
      };
      
      setTimeEntries([newEntry, ...timeEntries]);
    }
    
    setIsTracking(false);
    setCurrentTime(0);
    setCurrentTask('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600">Track your work hours and manage time entries</p>
        </div>
      </div>

      {/* Time Tracker */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="text-4xl font-mono font-bold text-orange-600 mb-4">
            {formatTime(currentTime)}
          </div>
          <div className="max-w-md mx-auto mb-4">
            <input
              type="text"
              placeholder="What are you working on?"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center justify-center gap-3">
            {!isTracking ? (
              <button
                onClick={startTracking}
                disabled={!currentTask.trim()}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-5 h-5" />
                Start
              </button>
            ) : (
              <button
                onClick={pauseTracking}
                className="flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}
            <button
              onClick={stopTracking}
              disabled={currentTime === 0}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">This Week</h3>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {weeklyHours.current}h
          </div>
          <div className="text-sm text-gray-600">
            Target: {weeklyHours.target}h
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-orange-500 h-2 rounded-full"
              style={{ width: `${Math.min((weeklyHours.current / weeklyHours.target) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Today</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {timeEntries
              .filter(entry => entry.date === new Date().toISOString().split('T')[0])
              .reduce((total, entry) => total + entry.duration, 0)
              .toFixed(1)}h
          </div>
          <div className="text-sm text-gray-600">
            Hours logged today
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Average</h3>
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            7.7h
          </div>
          <div className="text-sm text-gray-600">
            Daily average this week
          </div>
        </div>
      </div>

      {/* Time Entries */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Time Entries</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {timeEntries.map(entry => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{entry.task}</h3>
                    {entry.description && (
                      <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(entry.date).toLocaleDateString()}</span>
                      <span>{entry.startTime} - {entry.endTime}</span>
                      <span className="font-medium text-orange-600">
                        {entry.duration}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;