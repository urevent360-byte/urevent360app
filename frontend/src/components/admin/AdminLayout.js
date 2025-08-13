import React, { useState, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  LayoutDashboard,
  Users,
  Building,
  UserCheck,
  Truck,
  Settings,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut
} from 'lucide-react';

// Admin Components
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import BusinessManagement from './BusinessManagement';
import AssociateManagement from './AssociateManagement';
import VendorManagement from './VendorManagement';
import OperationsManagement from './OperationsManagement';
import AdminReports from './AdminReports';

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Businesses', href: '/admin/businesses', icon: Building },
    { name: 'Associates', href: '/admin/associates', icon: UserCheck },
    { name: 'Vendors', href: '/admin/vendors', icon: Truck },
    { name: 'Operations', href: '/admin/operations', icon: Settings },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
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
              <p className="text-xs text-gray-500">Admin Console</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
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
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-700'
                      : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-purple-700' : 'text-gray-400 group-hover:text-purple-700'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center px-3 py-2">
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=7c3aed&color=fff`}
                alt={user?.name}
                className="h-8 w-8 rounded-full"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
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
        </nav>
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
              className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                Urevent 360 Administration
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/businesses" element={<BusinessManagement />} />
            <Route path="/associates" element={<AssociateManagement />} />
            <Route path="/vendors" element={<VendorManagement />} />
            <Route path="/operations" element={<OperationsManagement />} />
            <Route path="/reports" element={<AdminReports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;