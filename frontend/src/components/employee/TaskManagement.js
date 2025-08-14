import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  CheckSquare, 
  AlertCircle,
  Edit3,
  Trash2,
  Eye,
  Flag
} from 'lucide-react';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    assignedBy: '',
    estimatedHours: '',
    category: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const fetchTasks = async () => {
    // Mock data - in real app, fetch from API
    const mockTasks = [
      {
        id: '1',
        title: 'Wedding Venue Setup - Johnson Wedding',
        description: 'Coordinate venue setup for Johnson wedding including decoration placement, seating arrangement, and lighting setup.',
        priority: 'high',
        status: 'in_progress',
        dueDate: '2024-02-15',
        assignedBy: 'Sarah Manager',
        estimatedHours: 8,
        actualHours: 6,
        category: 'Event Setup',
        progress: 75,
        createdAt: '2024-02-10'
      },
      {
        id: '2',
        title: 'Client Consultation - Corporate Event',
        description: 'Meet with TechCorp representatives to discuss their annual gala requirements and preferences.',
        priority: 'medium',
        status: 'pending',
        dueDate: '2024-02-18',
        assignedBy: 'Mike Supervisor',
        estimatedHours: 2,
        actualHours: 0,
        category: 'Client Meeting',
        progress: 0,
        createdAt: '2024-02-12'
      },
      {
        id: '3',
        title: 'Vendor Coordination - Catering Services',
        description: 'Coordinate with Elite Catering for menu finalization and service timeline for upcoming events.',
        priority: 'medium',
        status: 'completed',
        dueDate: '2024-02-12',
        assignedBy: 'Lisa Lead',
        estimatedHours: 3,
        actualHours: 3.5,
        category: 'Vendor Management',
        progress: 100,
        createdAt: '2024-02-08'
      },
      {
        id: '4',
        title: 'Equipment Inventory Check',
        description: 'Conduct monthly inventory check of all event equipment and update the system records.',
        priority: 'low',
        status: 'pending',
        dueDate: '2024-02-25',
        assignedBy: 'Sarah Manager',
        estimatedHours: 4,
        actualHours: 0,
        category: 'Maintenance',
        progress: 0,
        createdAt: '2024-02-13'
      },
      {
        id: '5',
        title: 'Post-Event Cleanup Coordination',
        description: 'Oversee cleanup crew and ensure venue restoration after Smith anniversary celebration.',
        priority: 'high',
        status: 'overdue',
        dueDate: '2024-02-11',
        assignedBy: 'Mike Supervisor',
        estimatedHours: 4,
        actualHours: 2,
        category: 'Event Cleanup',
        progress: 50,
        createdAt: '2024-02-09'
      }
    ];
    setTasks(mockTasks);
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.category.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredTasks(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCreateTask = () => {
    const newTask = {
      id: Date.now().toString(),
      ...taskForm,
      progress: 0,
      actualHours: 0,
      createdAt: new Date().toISOString().split('T')[0],
      assignedBy: 'Self-Assigned'
    };
    setTasks([newTask, ...tasks]);
    setShowTaskModal(false);
    resetTaskForm();
  };

  const handleUpdateTask = (taskId, updates) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      assignedBy: '',
      estimatedHours: '',
      category: ''
    });
    setSelectedTask(null);
  };

  const updateProgress = (taskId, progress) => {
    handleUpdateTask(taskId, { 
      progress,
      status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending'
    });
  };

  const logHours = (taskId, hours) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      handleUpdateTask(taskId, { actualHours: task.actualHours + parseFloat(hours) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Manage your assigned tasks and track progress</p>
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', priority: '', search: '' })}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {tasks.filter(t => t.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {tasks.filter(t => t.status === 'overdue').length}
          </div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{task.description}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setSelectedTask(task);
                    setTaskForm({ ...task });
                    setShowTaskModal(true);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{task.assignedBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{task.actualHours}h / {task.estimatedHours}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  <span>{task.category}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={task.progress}
                  onChange={(e) => updateProgress(task.id, parseInt(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => {
                    const hours = prompt('Log hours worked:');
                    if (hours && !isNaN(hours)) {
                      logHours(task.id, hours);
                    }
                  }}
                  className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                >
                  Log Hours
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">
            {tasks.length === 0 ? 'Create your first task to get started.' : 'Try adjusting your filters.'}
          </p>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {selectedTask ? 'Edit Task' : 'Create New Task'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter task description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      value={taskForm.estimatedHours}
                      onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Hours"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    <option value="Event Setup">Event Setup</option>
                    <option value="Client Meeting">Client Meeting</option>
                    <option value="Vendor Management">Vendor Management</option>
                    <option value="Event Cleanup">Event Cleanup</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Planning">Planning</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    resetTaskForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={selectedTask ? () => handleUpdateTask(selectedTask.id, taskForm) : handleCreateTask}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  {selectedTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;