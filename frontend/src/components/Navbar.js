import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  Bell, Menu, Search, User, Settings, LogOut, Edit, Lock, 
  Globe, Shield, HelpCircle, Smartphone, Eye, Link as LinkIcon,
  ChevronRight, Camera, Mail, Phone, UserCog, Languages,
  CreditCard, MessageCircle
} from 'lucide-react';

const Navbar = ({ setSidebarOpen }) => {
  const { user, logout } = useContext(AuthContext);

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
          
          <div className="relative group">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=7c3aed&color=fff`}
                alt={user?.name}
                className="h-8 w-8 rounded-full"
              />
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
              <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Profile
              </a>
              <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Settings
              </a>
              <hr className="my-1" />
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;