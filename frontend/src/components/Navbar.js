import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  Bell, Menu, Search, User, Settings, LogOut, Edit, Lock, 
  Globe, Shield, HelpCircle, Smartphone, Eye, Link as LinkIcon,
  ChevronRight, ChevronDown, Camera, Mail, Phone, UserCog, Languages,
  CreditCard, MessageCircle
} from 'lucide-react';

const Navbar = ({ setSidebarOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    profile: false,
    settings: false
  });
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden sm:flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search events, vendors..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={toggleDropdown}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=7c3aed&color=fff`}
                alt={user?.name}
                className="h-8 w-8 rounded-full"
              />
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=7c3aed&color=fff`}
                      alt={user?.name}
                      className="h-12 w-12 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                        Client Account
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Menu Section */}
                <div className="py-2">
                  <div className="px-3 py-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profile</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">View Profile</span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </Link>

                  <Link
                    to="/profile/edit"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Edit Profile</span>
                    <Camera className="h-3 w-3 text-gray-400" />
                  </Link>

                  <Link
                    to="/profile/change-password"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Lock className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Change Password</span>
                  </Link>

                  <Link
                    to="/profile/language"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Globe className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Language Settings</span>
                    <span className="text-xs text-gray-400">English</span>
                  </Link>

                  <Link
                    to="/profile/security"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Shield className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Security & Two-Factor Auth</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </Link>

                  <Link
                    to="/help"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <HelpCircle className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Help & Support</span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* Settings Menu Section */}
                <div className="py-2">
                  <div className="px-3 py-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</p>
                  </div>

                  <Link
                    to="/settings/account"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserCog className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Account Settings</span>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3 text-gray-300" />
                      <Phone className="h-3 w-3 text-gray-300" />
                    </div>
                  </Link>

                  <Link
                    to="/settings/security"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Shield className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Security Settings</span>
                    <Smartphone className="h-3 w-3 text-gray-400" />
                  </Link>

                  <Link
                    to="/settings/notifications"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Notification Preferences</span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    </span>
                  </Link>

                  <Link
                    to="/settings/language"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Languages className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Language Preferences</span>
                    <span className="text-xs text-gray-400">🇺🇸 EN</span>
                  </Link>

                  <Link
                    to="/settings/privacy"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Privacy Settings</span>
                  </Link>

                  <Link
                    to="/settings/integrations"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LinkIcon className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Linked Accounts & Integrations</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">3</span>
                  </Link>

                  <Link
                    to="/settings/billing"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CreditCard className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Billing & Payments</span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </Link>

                  <Link
                    to="/help/support"
                    onClick={closeDropdown}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <MessageCircle className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="flex-1">Help & Support Center</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      24/7
                    </span>
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 my-1"></div>

                {/* Sign Out */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      logout();
                      closeDropdown();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="flex-1 text-left">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;