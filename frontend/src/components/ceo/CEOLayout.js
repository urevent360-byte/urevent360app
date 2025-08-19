import React, { useState, useContext } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Shield,
  BarChart3,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  Lock,
  History,
  AlertTriangle,
  Brain,
  Zap
} from 'lucide-react';

// CEO Components
import CEODashboard from './CEODashboard';
import CEOSuccession from '../CEOSuccession';
import CEOAnalytics from './CEOAnalytics';
import CEOSecurity from './CEOSecurity';
import AICopilot from './AICopilot';
import AIIntelligenceCenter from './AIIntelligenceCenter';

const CEOLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Ensure only CEO can access this layout
  if (!user || user.role !== 'ROLE_CEO') {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'CEO Dashboard', href: '/ceo', icon: LayoutDashboard, exact: true },
    { name: 'AI Co-Pilot', href: '/ceo/ai-copilot', icon: Brain },
    { name: 'Intelligence Center', href: '/ceo/intelligence', icon: Zap },
    { name: 'Executive Analytics', href: '/ceo/analytics', icon: BarChart3 },
    { name: 'Succession Management', href: '/ceo/succession', icon: Shield },
    { name: 'Security Center', href: '/ceo/security', icon: Lock },
    { name: 'Audit History', href: '/ceo/history', icon: History }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* CEO Sidebar */}
      <div className={`bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-64 hidden lg:block'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">CEO Console</h1>
              <p className="text-xs text-gray-300">Executive Control Center</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
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
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* CEO Security Alert */}
          <div className="mt-8 p-4 bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-lg border border-red-700/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-200">Security Notice</span>
            </div>
            <p className="text-xs text-orange-300">
              All CEO actions are monitored and logged for security compliance.
            </p>
          </div>

          {/* CEO Info */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-center px-3 py-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'CEO'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-blue-300">Chief Executive Officer</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:text-white hover:bg-red-600/20 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Secure Logout
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

      {/* Main CEO Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* CEO Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">CEO Executive Console</h1>
                  <p className="text-sm text-gray-600">Secure command center for {user?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Security Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Secure Session
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* CEO Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<CEODashboard />} />
            <Route path="/ai-copilot" element={<AICopilot />} />
            <Route path="/intelligence" element={<AIIntelligenceCenter />} />
            <Route path="/analytics" element={<CEOAnalytics />} />
            <Route path="/succession" element={<CEOSuccession />} />
            <Route path="/security" element={<CEOSecurity />} />
            <Route path="/history" element={<div className="text-center py-12"><h2 className="text-xl font-semibold">CEO Audit History Coming Soon</h2></div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default CEOLayout;