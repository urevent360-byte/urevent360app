import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../App';
import {
  CheckSquare,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Target,
  Award,
  FileText,
  Users,
  BarChart3
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeTasks: 0,
      completedTasks: 0,
      hoursWorked: 0,
      performanceScore: 0,
      salesTarget: 0,
      currentSales: 0,
      upcomingDeadlines: 0
    },
    recentTasks: [],
    upcomingSchedule: [],
    performanceMetrics: {},
    notifications: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for demonstration
      setDashboardData({
        stats: {
          activeTasks: 8,
          completedTasks: 45,
          hoursWorked: 38.5,
          performanceScore: 87,
          salesTarget: 25000,
          currentSales: 18750,
          upcomingDeadlines: 3
        },
        recentTasks: [
          {
            id: '1',
            title: 'Coordinate Smith Wedding Setup',
            status: 'in_progress',
            priority: 'high',
            dueDate: '2024-02-15',
            progress: 75
          },
          {
            id: '2',
            title: 'Corporate Event Planning - TechCorp',
            status: 'pending',
            priority: 'medium',
            dueDate: '2024-02-18',
            progress: 40
          },
          {
            id: '3',
            title: 'Vendor Coordination - Catering Services',
            status: 'completed',
            priority: 'low',
            dueDate: '2024-02-12',
            progress: 100
          }
        ],
        upcomingSchedule: [
          {
            id: '1',
            title: 'Team Meeting',
            time: '9:00 AM',
            date: '2024-02-15',
            type: 'meeting'
          },
          {
            id: '2',
            title: 'Client Site Visit - Grand Ballroom',
            time: '2:00 PM',
            date: '2024-02-15',
            type: 'site_visit'
          },
          {
            id: '3',
            title: 'Wedding Rehearsal',
            time: '4:00 PM',
            date: '2024-02-16',
            type: 'event'
          }
        ],
        performanceMetrics: {
          taskCompletionRate: 94,
          clientSatisfaction: 4.8,
          punctuality: 98,
          teamCollaboration: 4.6
        },
        notifications: [
          {
            id: '1',
            type: 'deadline',
            message: 'Smith Wedding setup due in 2 days',
            time: '2 hours ago'
          },
          {
            id: '2',
            type: 'approval',
            message: 'Leave request approved by manager',
            time: '4 hours ago'
          },
          {
            id: '3',
            type: 'task',
            message: 'New task assigned: Corporate Event Planning',
            time: '6 hours ago'
          }
        ]
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const StatCard = ({ title, value, change, icon: Icon, color = 'orange', suffix = '' }) => {
    const colorClasses = {
      orange: 'from-orange-500 to-orange-600',
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600'
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {typeof value === 'number' && value > 1000 
                ? `${(value/1000).toFixed(1)}k${suffix}` 
                : `${value}${suffix}`}
            </p>
            {change && (
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{change}% this week
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            {user?.employee_info?.position || 'Employee'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Tasks"
          value={dashboardData.stats.activeTasks}
          change={12}
          icon={CheckSquare}
          color="orange"
        />
        <StatCard
          title="Hours This Week"
          value={dashboardData.stats.hoursWorked}
          change={5}
          icon={Clock}
          color="blue"
          suffix="h"
        />
        <StatCard
          title="Performance Score"
          value={dashboardData.stats.performanceScore}
          change={3}
          icon={Award}
          color="green"
          suffix="%"
        />
        <StatCard
          title="Sales Progress"
          value={Math.round((dashboardData.stats.currentSales / dashboardData.stats.salesTarget) * 100)}
          change={8}
          icon={Target}
          color="purple"
          suffix="%"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
              View All Tasks
            </button>
          </div>
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Schedule</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.upcomingSchedule.map(schedule => (
                <div key={schedule.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{schedule.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{new Date(schedule.date).toLocaleDateString()}</span>
                      <span>{schedule.time}</span>
                    </div>
                    <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mt-2">
                      {schedule.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
              View Full Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{dashboardData.performanceMetrics.taskCompletionRate}%</div>
              <div className="text-sm text-gray-600">Task Completion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dashboardData.performanceMetrics.clientSatisfaction}/5</div>
              <div className="text-sm text-gray-600">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dashboardData.performanceMetrics.punctuality}%</div>
              <div className="text-sm text-gray-600">Punctuality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dashboardData.performanceMetrics.teamCollaboration}/5</div>
              <div className="text-sm text-gray-600">Team Collaboration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dashboardData.notifications.map(notification => (
              <div key={notification.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  {notification.type === 'deadline' && <AlertCircle className="w-5 h-5 text-orange-600" />}
                  {notification.type === 'approval' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {notification.type === 'task' && <FileText className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Create Task</h3>
              <p className="text-sm text-gray-600">Add new task or project</p>
            </div>
          </div>
        </button>

        <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Track Time</h3>
              <p className="text-sm text-gray-600">Log work hours</p>
            </div>
          </div>
        </button>

        <button className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600">Performance analytics</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default EmployeeDashboard;