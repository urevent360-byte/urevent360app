import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  CalendarDays,
  MapPin, 
  Users, 
  CreditCard, 
  DollarSign, 
  Mail, 
  BarChart3, 
  Camera, 
  MessageCircle,
  X,
  Heart,
  History,
  Menu
} from 'lucide-react';

const Sidebar = ({ open, onOpenChange }) => {
  const location = useLocation();

  // Development environment check for prop validation
  if (process.env.NODE_ENV !== "production") {
    if (typeof onOpenChange !== "function") {
      console.error("Sidebar expected onOpenChange function, got:", typeof onOpenChange);
    }
  }

  const toggle = () => onOpenChange(!open);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Create Event', href: '/events/new', icon: Calendar },
    { name: 'Calendar & Appointments', href: '/calendar', icon: CalendarDays },
    { name: 'Venues', href: '/venues', icon: MapPin },
    { name: 'Vendors', href: '/vendors', icon: Users },
    { name: 'Preferred Vendors', href: '/preferred-vendors', icon: Heart },
    { name: 'Event History', href: '/history', icon: History },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Loans', href: '/loans', icon: DollarSign },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside 
      data-sb 
      className={`fixed left-0 top-0 h-screen ${open ? "w-64" : "w-16"} transition-all duration-300 border-r bg-white shadow-lg z-30`}
    >
      {/* Header + collapse button */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        {open ? (
          <>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="text-xl font-bold text-gray-800">Urevent 360</span>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-label="Expand sidebar"
            className="w-full flex justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav items (active via pathname) */}
      <nav className="mt-2 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-violet-50 text-violet-700 border-r-2 border-violet-700' 
                    : 'text-gray-700 hover:text-violet-700 hover:bg-violet-50'
                }`}
                title={!open ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-violet-700' : 'text-gray-400 group-hover:text-violet-700'
                }`} />
                {open && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        {open && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="mt-3 space-y-1">
              <Link
                to="/events/new"
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-violet-700 hover:bg-violet-50"
              >
                <Calendar className="mr-3 h-4 w-4 text-gray-400 group-hover:text-violet-700" />
                New Event
              </Link>
              <Link
                to="/venues"
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-violet-700 hover:bg-violet-50"
              >
                <MapPin className="mr-3 h-4 w-4 text-gray-400 group-hover:text-violet-700" />
                Find Venue
              </Link>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;