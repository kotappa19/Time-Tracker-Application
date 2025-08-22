'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Play, 
  Pause, 
  Save
} from 'lucide-react';
import { 
  createTimeEntry, 
  updateTimeEntry, 
  getActiveTimeEntry, 
  getTasks,
  getTimeEntries 
} from '@/lib/firestore';
import { Task, TimeEntry } from '@/types';
import { format } from 'date-fns';

export default function TimeTracker() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTimeEntries = async () => {
    if (!currentUser) return;
    try {
      const entriesData = await getTimeEntries(currentUser.uid);
      setTimeEntries(entriesData);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        const [tasksData, entriesData, activeEntryData] = await Promise.all([
          getTasks(undefined, currentUser.uid),
          getTimeEntries(currentUser.uid),
          getActiveTimeEntry(currentUser.uid)
        ]);
        
        setTasks(tasksData);
        setTimeEntries(entriesData);
        setActiveEntry(activeEntryData);
        
        if (activeEntryData) {
          setSelectedTask(activeEntryData.taskId);
          setDescription(activeEntryData.description);
          // Calculate initial elapsed time for existing active entry
          const startTime = new Date(activeEntryData.startTime);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setElapsedTime(elapsed);
        }
      } catch (error) {
        console.error('Error fetching time tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeEntry) {
      interval = setInterval(() => {
        const now = new Date();
        const start = new Date(activeEntry.startTime);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeEntry]);

  const startTimer = async () => {
    if (!selectedTask || !description.trim()) {
      alert('Please select a task and enter a description');
      return;
    }

    if (activeEntry) {
      alert('Please stop the current timer first');
      return;
    }

    try {
      const task = tasks.find(t => t.id === selectedTask);
      if (!task) return;

      const newEntry: Omit<TimeEntry, 'id'> = {
        taskId: selectedTask,
        userId: currentUser!.uid,
        projectId: task.projectId,
        startTime: new Date(),
        description: description.trim(),
        isActive: true
      };

      const entryId = await createTimeEntry(newEntry);
      const createdEntry = { ...newEntry, id: entryId };
      setActiveEntry(createdEntry);
      
      // Refresh the time entries list
      await fetchTimeEntries();
      
      setElapsedTime(0); // Reset elapsed time for new timer
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Failed to start timer');
    }
  };

  const pauseTimer = async () => {
    if (!activeEntry) return;

    try {
      const endTime = new Date();
      const startTime = new Date(activeEntry.startTime);
      const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const durationInMinutes = Math.floor(durationInSeconds / 60);

      // Update the time entry with end time, duration, and set as inactive
      await updateTimeEntry(activeEntry.id, {
        endTime: endTime,
        duration: durationInMinutes,
        isActive: false
      });

      // Clear the active entry
      setActiveEntry(null);
      setElapsedTime(0);
      setSelectedTask('');
      setDescription('');

      // Refresh the time entries list to show the updated entry
      await fetchTimeEntries();
      
    } catch (error) {
      console.error('Error pausing timer:', error);
      alert('Failed to pause timer');
    }
  };

  const saveManualEntry = async () => {
    if (!selectedTask || !description.trim() || !manualHours || !manualMinutes) {
      alert('Please fill in all fields');
      return;
    }

    const hours = parseInt(manualHours);
    const minutes = parseInt(manualMinutes);

    if (hours < 0 || minutes < 0 || minutes > 59) {
      alert('Please enter valid time values');
      return;
    }

    try {
      const task = tasks.find(t => t.id === selectedTask);
      if (!task) return;

      const newEntry: Omit<TimeEntry, 'id'> = {
        taskId: selectedTask,
        userId: currentUser!.uid,
        projectId: task.projectId,
        startTime: new Date(),
        endTime: new Date(),
        duration: hours * 60 + minutes,
        description: description.trim(),
        isActive: false
      };

      await createTimeEntry(newEntry);
      
      // Reset form
      setSelectedTask('');
      setDescription('');
      setManualHours('');
      setManualMinutes('');
      setIsManualEntry(false);
      
      // Refresh entries
      await fetchTimeEntries();
    } catch (error) {
      console.error('Error saving manual entry:', error);
      alert('Failed to save manual entry');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
        <p className="mt-2 text-gray-600">Track your time and manage your productivity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timer Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Timer</h2>
          
          {activeEntry ? (
            <div className="text-center">
              <div className="text-4xl font-mono text-blue-600 mb-4">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-gray-600 mb-4">{activeEntry.description}</p>
              <button
                onClick={pauseTimer}
                className="flex items-center justify-center w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop Timer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Task
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="">Choose a task...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500"
                  rows={3}
                />
              </div>

              <button
                onClick={startTimer}
                disabled={!selectedTask || !description.trim()}
                className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </button>
            </div>
          )}
        </div>

        {/* Manual Entry Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Manual Entry</h2>
            <button
              onClick={() => setIsManualEntry(!isManualEntry)}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              {isManualEntry ? 'Cancel' : 'Add Entry'}
            </button>
          </div>

          {isManualEntry ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Task
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="">Choose a task...</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours
                  </label>
                  <input
                    type="number"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minutes
                  </label>
                  <input
                    type="number"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    min="0"
                    max="59"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
              </div>

              <button
                onClick={saveManualEntry}
                className="flex items-center justify-center w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Click &quot;Add Entry&quot; to manually log your time
            </p>
          )}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Time Entries</h3>
        </div>
        <div className="p-6">
          {timeEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No time entries found</p>
          ) : (
            <div className="space-y-4">
              {timeEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{entry.description}</h4>
                    <p className="text-sm text-gray-600">
                      {format(entry.startTime, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    {entry.duration ? (
                      <p className="font-medium text-gray-900">
                        {formatDuration(entry.duration)}
                      </p>
                    ) : (
                      <p className="font-medium text-blue-600">Active</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
