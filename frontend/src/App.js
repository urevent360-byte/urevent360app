import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import EventCreation from './components/EventCreation';
import VenueBrowser from './components/VenueBrowser';
import VendorMarketplace from './components/VendorMarketplace';
import EventPlanning from './components/EventPlanning';
import PaymentCenter from './components/PaymentCenter';
import LoanCenter from './components/LoanCenter';
import GuestManagement from './components/GuestManagement';
import LiveEvent from './components/LiveEvent';
import PostEvent from './components/PostEvent';
import Profile from './components/Profile';
import Messages from './components/Messages';

// Admin Components
import AdminLayout from './components/admin/AdminLayout';

// Vendor Components
import VendorLayout from './components/vendor/VendorLayout';

// Employee Components
import EmployeeLayout from './components/employee/EmployeeLayout';

// Customer Service Component
import CustomerService from './components/CustomerService';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/profile`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, token }}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {user ? (
            // Check user role and show appropriate layout
            user.role === 'admin' ? (
              // Admin Layout
              <Routes>
                <Route path="/admin/*" element={<AdminLayout />} />
                <Route path="*" element={<Navigate to="/admin" />} />
              </Routes>
            ) : user.role === 'vendor' ? (
              // Vendor Layout
              <Routes>
                <Route path="/vendor/*" element={<VendorLayout />} />
                <Route path="*" element={<Navigate to="/vendor" />} />
              </Routes>
            ) : user.role === 'employee' ? (
              // Employee Layout
              <Routes>
                <Route path="/employee/*" element={<EmployeeLayout />} />
                <Route path="*" element={<Navigate to="/employee" />} />
              </Routes>
            ) : (
              // Regular User Layout
              <div className="flex h-screen">
                {/* Sidebar */}
                <Sidebar 
                  open={sidebarOpen} 
                  setOpen={setSidebarOpen} 
                  className="hidden lg:block"
                />
                
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                  <div 
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Sidebar 
                      open={sidebarOpen} 
                      setOpen={setSidebarOpen} 
                      className="absolute left-0 top-0 h-full"
                    />
                  </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Navbar setSidebarOpen={setSidebarOpen} />
                  
                  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-6">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/events/create" element={<EventCreation />} />
                      <Route path="/events/:eventId/planning" element={<EventPlanning />} />
                      <Route path="/venues" element={<VenueBrowser />} />
                      <Route path="/vendors" element={<VendorMarketplace />} />
                      <Route path="/payments" element={<PaymentCenter />} />
                      <Route path="/loans" element={<LoanCenter />} />
                      <Route path="/guests/:eventId" element={<GuestManagement />} />
                      <Route path="/live/:eventId" element={<LiveEvent />} />
                      <Route path="/post-event/:eventId" element={<PostEvent />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </main>
                </div>
              </div>
            )
          ) : (
            // Unauthenticated Layout
            <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </div>
          )}
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export { AuthContext };
export default App;