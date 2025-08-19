import React, { useState, useCallback, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Settings,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
  Building
} from 'lucide-react';

const LS_KEY = "vendor-sb:open";
const DEFAULT_OPEN = false; // collapsed by default

const VendorLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(DEFAULT_OPEN);
  const onOpenChange = useCallback((v) => setOpen(v), []);
  const location = useLocation();

  // Read saved preference once (stays collapsed if none saved)
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (saved !== null) setOpen(saved === "1");
  }, []);

  // Persist when user toggles
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, open ? "1" : "0");
  }, [open]);

  const navigation = [
    { name: 'Dashboard', href: '/vendor', icon: LayoutDashboard, exact: true },
    { name: 'Services', href: '/vendor/services', icon: Building },
    { name: 'Bookings', href: '/vendor/bookings', icon: Calendar },
    { name: 'Clients', href: '/vendor/clients', icon: Users },
    { name: 'Payments', href: '/vendor/payments', icon: CreditCard },
    { name: 'Analytics', href: '/vendor/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/vendor/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        open ? 'w-64' : 'w-16'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {open ? (
            <>
              <div className="flex items-center space-x-2">
                <img 
                  src="https://customer-assets.emergentagent.com/job_urevent-admin/artifacts/efthwf05_ureventlogos-02%20%281%29.png" 
                  alt="Urevent 360 Logo" 
                  className="h-8 w-8 object-contain"
                />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Urevent 360</h1>
                  <p className="text-xs text-green-600">Vendor Portal</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onOpenChange(true)}
              className="w-full flex justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              title="Expand sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
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
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700 border-r-2 border-green-700'
                      : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                  }`}
                  title={!open ? item.name : undefined}
                >
                  <Icon className={`${open ? 'mr-3' : ''} h-5 w-5 transition-colors ${
                    isActive ? 'text-green-700' : 'text-gray-400 group-hover:text-green-700'
                  }`} />
                  {open && item.name}
                </Link>
              );
            })}
          </div>

          {/* User Info */}
          {open && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center px-3 py-2">
                <img
                  src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=059669&color=fff`}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500">Vendor</p>
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
          )}
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onOpenChange(!open)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 transition-colors"
              aria-label={open ? "Collapse menu" : "Expand menu"}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                Vendor Portal
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;