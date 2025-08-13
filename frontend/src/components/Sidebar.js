import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  DollarSign, 
  Mail, 
  BarChart3, 
  Camera, 
  MessageCircle,
  X 
} from 'lucide-react';

const Sidebar = ({ open, setOpen, className = "" }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Create Event', href: '/events/create', icon: Calendar },
    { name: 'Venues', href: '/venues', icon: MapPin },
    { name: 'Vendors', href: '/vendors', icon: Users },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Loans', href: '/loans', icon: DollarSign },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className={`bg-white w-64 shadow-lg flex-shrink-0 ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <span className="text-xl font-bold text-gray-800">Urevent 360</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setOpen(false)}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-700' 
                    : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50'
                  }
                `}
              >
                <Icon className={`
                  mr-3 h-5 w-5 transition-colors
                  ${isActive ? 'text-purple-700' : 'text-gray-400 group-hover:text-purple-700'}
                `} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Quick Actions
          </h3>
          <div className="mt-3 space-y-1">
            <Link
              to="/events/create"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-purple-700 hover:bg-purple-50"
            >
              <Calendar className="mr-3 h-4 w-4 text-gray-400 group-hover:text-purple-700" />
              New Event
            </Link>
            <Link
              to="/venues"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-purple-700 hover:bg-purple-50"
            >
              <MapPin className="mr-3 h-4 w-4 text-gray-400 group-hover:text-purple-700" />
              Find Venue
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;