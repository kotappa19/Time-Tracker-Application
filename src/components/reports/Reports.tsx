'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Calendar,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react';
import { getTimeEntries, getProjects, getTasks } from '@/lib/firestore';
import { TimeEntry, Project, Task } from '@/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const { currentUser } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(new Date()), 'yyyy-MM-dd'));
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [currentUser, startDate, endDate]);

  const fetchData = async () => {
    if (!currentUser) return;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const [timeEntriesData, projectsData, tasksData] = await Promise.all([
        getTimeEntries(currentUser.uid),
        getProjects(currentUser.uid),
        getTasks(undefined, currentUser.uid)
      ]);
      
      // Filter time entries by date range
      const filteredEntries = timeEntriesData.filter(entry => {
        const entryDate = new Date(entry.startTime);
        return entryDate >= start && entryDate <= end;
      });
      
      setTimeEntries(filteredEntries);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: 'week' | 'month' | 'custom') => {
    setDateRange(range);
    
    if (range === 'week') {
      setStartDate(format(startOfWeek(new Date()), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(new Date()), 'yyyy-MM-dd'));
    } else if (range === 'month') {
      setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setExporting(true);
    try {
      // Temporarily replace lab() colors with hex colors to avoid html2canvas issues
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        * {
          color: #000000 !important;
          background-color: #ffffff !important;
        }
        .bg-blue-100 { background-color: #dbeafe !important; }
        .bg-green-100 { background-color: #dcfce7 !important; }
        .bg-purple-100 { background-color: #f3e8ff !important; }
        .bg-yellow-100 { background-color: #fef3c7 !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-gray-100 { background-color: #f3f4f6 !important; }
        .bg-white { background-color: #ffffff !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-green-600 { color: #16a34a !important; }
        .text-purple-600 { color: #9333ea !important; }
        .text-yellow-600 { color: #ca8a04 !important; }
        .text-gray-900 { color: #111827 !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-white { color: #ffffff !important; }
        .border-gray-200 { border-color: #e5e7eb !important; }
        .border-gray-300 { border-color: #d1d5db !important; }
        .bg-blue-600 { background-color: #2563eb !important; }
        .bg-green-600 { background-color: #16a34a !important; }
        .bg-red-600 { background-color: #dc2626 !important; }
        .bg-purple-600 { background-color: #9333ea !important; }
        .bg-yellow-600 { background-color: #ca8a04 !important; }
        .hover\\:bg-blue-700:hover { background-color: #1d4ed8 !important; }
        .hover\\:bg-green-700:hover { background-color: #15803d !important; }
        .hover\\:bg-red-700:hover { background-color: #b91c1c !important; }
        .hover\\:bg-purple-700:hover { background-color: #7c3aed !important; }
        .hover\\:bg-yellow-700:hover { background-color: #a16207 !important; }
        .hover\\:bg-gray-200:hover { background-color: #e5e7eb !important; }
        .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important; }
        .rounded-lg { border-radius: 0.5rem !important; }
        .rounded-md { border-radius: 0.375rem !important; }
        .border { border-width: 1px !important; }
        .border-b { border-bottom-width: 1px !important; }
      `;
      document.head.appendChild(styleElement);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: (element) => {
          // Ignore elements that might cause issues
          return element.tagName === 'BUTTON' && (element.textContent?.includes('Export') ?? false);
        }
      });
      
      // Remove the temporary style
      document.head.removeChild(styleElement);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `time-tracker-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Calculate total hours from time entries
  const totalHours = timeEntries.reduce((total, entry) => {
    if (entry.duration) {
      return total + (entry.duration / 60); // Convert minutes to hours
    }
    return total;
  }, 0);

  // Hours by project
  const hoursByProject = projects.map(project => {
    const projectEntries = timeEntries.filter(entry => entry.projectId === project.id);
    const hours = projectEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + (entry.duration / 60); // Convert minutes to hours
      }
      return total;
    }, 0);
    return {
      name: project.name,
      hours: parseFloat(hours.toFixed(1))
    };
  }).filter(item => item.hours > 0);

  // Hours by day
  const hoursByDay = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate)
  }).map(date => {
    const dayEntries = timeEntries.filter(entry => 
      format(new Date(entry.startTime), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    const hours = dayEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + (entry.duration / 60); // Convert minutes to hours
      }
      return total;
    }, 0);
    return {
      date: format(date, 'MMM dd'),
      hours: parseFloat(hours.toFixed(1))
    };
  });

  // Task completion status
  const taskStatus = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length },
    { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length }
  ];

  // Top tasks by hours
  const topTasks = tasks.map(task => {
    const taskEntries = timeEntries.filter(entry => entry.taskId === task.id);
    const hours = taskEntries.reduce((total, entry) => {
      if (entry.duration) {
        return total + (entry.duration / 60); // Convert minutes to hours
      }
      return total;
    }, 0);
    return {
      name: task.title,
      hours: parseFloat(hours.toFixed(1))
    };
  }).filter(item => item.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div ref={reportRef}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">Track your productivity and time management insights.</p>
        </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDateRangeChange('week')}
                className={`px-3 py-1 text-sm rounded-md ${
                  dateRange === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => handleDateRangeChange('month')}
                className={`px-3 py-1 text-sm rounded-md ${
                  dateRange === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setDateRange('custom')}
                className={`px-3 py-1 text-sm rounded-md ${
                  dateRange === 'custom' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom
              </button>
            </div>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Hours by Day */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours by Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hoursByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hours by Project */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hours by Project</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={hoursByProject}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="hours"
              >
                {hoursByProject.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => {
                  // Only show label if segment is large enough (>5%) or has a value > 0
                  if ((percent ?? 0) > 0.05 || (value ?? 0) > 0) {
                    return `${name} ${((percent ?? 0) * 100).toFixed(0)}%`;
                  }
                  return null;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} tasks`, name]}
                labelFormatter={(label) => `Status: ${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Tasks by Hours */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tasks by Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTasks} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="hours" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
            <p className="text-sm text-gray-600">Download your time tracking data in different formats</p>
          </div>
          <button 
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            {exporting ? 'Generating PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
