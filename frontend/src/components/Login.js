import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  Building, 
  ChevronRight,
  ArrowLeft,
  Users
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const { login } = useContext(AuthContext);
  const [step, setStep] = useState('role-selection'); // 'role-selection' or 'login-form'
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    {
      id: 'client',
      title: 'Client',
      description: 'Plan and manage your events',
      icon: User,
      color: 'from-blue-500 to-blue-600',
      features: ['Create Events', 'Find Vendors', 'Manage Bookings', 'Track Budgets']
    },
    {
      id: 'vendor',
      title: 'Vendor Company',
      description: 'Offer your services to event planners',
      icon: Building,
      color: 'from-green-500 to-green-600',
      features: ['Manage Services', 'View Bookings', 'Client Communication', 'Business Analytics']
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage platform operations',
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      features: ['User Management', 'Platform Analytics', 'Vendor Oversight', 'System Control']
    },
    {
      id: 'employee',
      title: 'Employee',
      description: 'Manage tasks and track performance',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      features: ['Task Management', 'Performance Tracking', 'Leave Management', 'Project Updates']
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep('login-form');
    setError('');
    
    // Pre-fill demo credentials based on role
    if (role === 'admin') {
      setFormData({
        email: 'admin@urevent360.com',
        password: 'admin123'
      });
    } else if (role === 'vendor') {
      setFormData({
        email: 'vendor@example.com',
        password: 'vendor123'
      });
    } else if (role === 'employee') {
      setFormData({
        email: 'employee@example.com',
        password: 'employee123'
      });
    } else {
      setFormData({
        email: '',
        password: ''
      });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/login`, formData);
      const userData = response.data.user;
      
      // Validate that the user role matches the selected role
      if (selectedRole !== 'client' && userData.role !== selectedRole) {
        setError(`This account is not registered as a ${selectedRole}. Please select the correct account type or contact support.`);
        setLoading(false);
        return;
      }
      
      // For regular users, allow login regardless of role in database
      login(response.data.access_token, userData);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(err.response?.data?.detail || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('role-selection');
    setSelectedRole('');
    setFormData({ email: '', password: '' });
    setError('');
  };

  const selectedRoleData = roleOptions.find(role => role.id === selectedRole);

  console.log('Login component render - step:', step, 'selectedRole:', selectedRole);

  if (step === 'role-selection') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1513104361122-8200eb486a94')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Admin Access Icon - Top Right */}
        <button
          onClick={() => handleRoleSelect('admin')}
          className="absolute top-6 right-6 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 group"
          title="Administrator Access"
        >
          <Shield className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Elegant overlay pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
        
        <div className="max-w-5xl w-full space-y-8 relative z-10">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-white/95 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/20">
              <img 
                src="https://customer-assets.emergentagent.com/job_urevent-admin/artifacts/efthwf05_ureventlogos-02%20%281%29.png" 
                alt="Urevent 360 Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-white drop-shadow-lg">
              Welcome to Urevent 360
            </h2>
            <p className="mt-2 text-lg text-white/90 drop-shadow">
              Premium Event Planning Excellence
            </p>
            <div className="mt-2 text-sm text-white/80">
              Choose your account type to access our exclusive platform
            </div>
          </div>

          {/* Role Selection Cards - Only Client and Vendor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
            {roleOptions.filter(role => role.id !== 'admin' && role.id !== 'employee').map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer group hover:scale-105 transform border border-white/20"
                >
                  <div className="p-8">
                    {/* Icon */}
                    <div className={`mx-auto h-16 w-16 bg-gradient-to-r ${role.color} rounded-full flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title & Description */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{role.title}</h3>
                      <p className="text-gray-600">{role.description}</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {role.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-3"></div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Continue Button */}
                    <div className={`w-full bg-gradient-to-r ${role.color} text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center group-hover:shadow-xl cursor-pointer`}>
                      Continue as {role.title}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Demo Credentials Info */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mt-8 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Demo Access Available
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-white/90 bg-white/10 rounded-lg p-3">
                <strong>Client Portal:</strong><br/>
                Register with any email or use existing account
              </div>
              <div className="text-white/90 bg-white/10 rounded-lg p-3">
                <strong>Vendor Access:</strong><br/>
                vendor@example.com / vendor123
              </div>
            </div>
          </div>

          {/* Premium Features Highlight */}
          <div className="text-center mt-6">
            <div className="flex items-center justify-center space-x-6 text-white/80 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gold rounded-full mr-2"></div>
                Premium Venues
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gold rounded-full mr-2"></div>
                Luxury Services
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gold rounded-full mr-2"></div>
                Exclusive Access
              </div>
            </div>
          </div>

          {/* Employee Portal Link - Discrete Bottom Access */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handleRoleSelect('employee')}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 text-white/70 hover:text-white text-sm"
              title="Employee Portal Access"
            >
              <img 
                src="https://customer-assets.emergentagent.com/job_urevent-admin/artifacts/efthwf05_ureventlogos-02%20%281%29.png" 
                alt="Urevent 360 Logo" 
                className="h-4 w-4 object-contain"
              />
              <span className="text-xs font-medium">Employee Portal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login Form Step
  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Admin Access Icon - Top Right (only show if not already on admin login) */}
      {selectedRole !== 'admin' && (
        <button
          onClick={() => handleRoleSelect('admin')}
          className="absolute top-6 right-6 z-20 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 group"
          title="Administrator Access"
        >
          <Shield className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Elegant overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-blue-900/30"></div>
      
      {/* Employee Portal Link - Discrete Bottom Access */}
      {selectedRole !== 'employee' && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => handleRoleSelect('employee')}
            className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md rounded-full border border-gray-200 hover:bg-white transition-all duration-200 text-gray-600 hover:text-orange-600 text-sm shadow-lg"
            title="Employee Portal Access"
          >
            <img 
              src="https://customer-assets.emergentagent.com/job_urevent-admin/artifacts/efthwf05_ureventlogos-02%20%281%29.png" 
              alt="Urevent 360 Logo" 
              className="h-4 w-4 object-contain"
            />
            <span className="text-xs font-medium">Employee Portal</span>
          </button>
        </div>
      )}
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="flex items-center text-white/80 hover:text-white transition-colors mb-4 backdrop-blur-sm bg-white/10 px-3 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to role selection
        </button>

        {/* Header */}
        <div className="text-center">
          <div className={`mx-auto h-20 w-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl border border-white/20`}>
            <img 
              src="https://customer-assets.emergentagent.com/job_urevent-admin/artifacts/efthwf05_ureventlogos-02%20%281%29.png" 
              alt="Urevent 360 Logo" 
              className="h-12 w-12 object-contain"
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white drop-shadow-lg">
            {selectedRoleData?.title} Portal
          </h2>
          <p className="mt-2 text-sm text-white/90 drop-shadow">
            {selectedRoleData?.description}
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Demo Credentials Note */}
          {selectedRole === 'admin' && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-xl text-sm">
              <strong>Demo Admin Access:</strong> Credentials are pre-filled for testing
            </div>
          )}

          {selectedRole === 'vendor' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              <strong>Demo Vendor Access:</strong> Credentials are pre-filled for testing
            </div>
          )}

          {selectedRole === 'employee' && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm">
              <strong>Demo Employee Access:</strong> Credentials are pre-filled for testing
            </div>
          )}

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r ${selectedRoleData?.color} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                `Access ${selectedRoleData?.title} Portal`
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              to="/register"
              className="font-medium text-purple-600 hover:text-purple-500 underline"
            >
              Create Account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;