import React, { useState, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  MessageSquareText,
  Target,
  Award
} from 'lucide-react';

// Employee Components
import EmployeeDashboard from './EmployeeDashboard';
import TaskManagement from './TaskManagement';
import PerformanceTracking from './PerformanceTracking';
import LeaveManagement from './LeaveManagement';
import TimeTracking from './TimeTracking';
import EmployeeProfile from './EmployeeProfile';
import JobManagement from './JobManagement';
import SalesTracking from './SalesTracking';
import FinancialTracking from './FinancialTracking';
import ProjectUpdates from './ProjectUpdates';

const EmployeeLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/employee', icon: LayoutDashboard, exact: true },
    { name: 'Task Management', href: '/employee/tasks', icon: CheckSquare },
    { name: 'Job Management', href: '/employee/jobs', icon: FileText },
    { name: 'Performance', href: '/employee/performance', icon: Award },
    { name: 'Time Tracking', href: '/employee/time', icon: Clock },
    { name: 'Leave Management', href: '/employee/leave', icon: Calendar },
    { name: 'Sales Tracking', href: '/employee/sales', icon: Target },
    { name: 'Financial', href: '/employee/financial', icon: DollarSign },
    { name: 'Project Updates', href: '/employee/projects', icon: MessageSquareText },
    { name: 'Profile', href: '/employee/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-64 hidden lg:block'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <img 
              src="https://customer-assets.emergentagent.com/job_urevent-admin/artifacts/efthwf05_ureventlogos-02%20%281%29.png" 
              alt="Urevent 360 Logo" 
              className="h-8 w-8 object-contain"
            />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Urevent 360</h1>
              <p className="text-xs text-gray-500">Employee Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-orange-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-orange-700' : 'text-gray-400 group-hover:text-orange-700'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 px-2">
          <div className="flex items-center px-3 py-2">
            <img
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=ea580c&color=fff`}
              alt={user?.name}
              className="h-8 w-8 rounded-full"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">Employee Account</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                Employee Portal
              </h1>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                Active
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-orange-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<EmployeeDashboard />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/jobs" element={<JobManagement />} />
            <Route path="/performance" element={<PerformanceTracking />} />
            <Route path="/time" element={<TimeTracking />} />
            <Route path="/leave" element={<LeaveManagement />} />
            <Route path="/sales" element={<SalesTracking />} />
            <Route path="/financial" element={<FinancialTracking />} />
            <Route path="/projects" element={<ProjectUpdates />} />
            <Route path="/profile" element={<EmployeeProfile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;