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
  ArrowLeft
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
      id: 'user',
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
      const response = await axios.post(`${API}/auth/login`, formData);
      const userData = response.data.user;
      
      // Validate that the user role matches the selected role
      if (selectedRole !== 'user' && userData.role !== selectedRole) {
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

  if (step === 'role-selection') {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">U</span>
              </div>
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-white">
              Welcome to Urevent 360
            </h2>
            <p className="mt-2 text-lg text-purple-100">
              Choose your account type to get started
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {roleOptions.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105 transform"
                >
                  <div className="p-8">
                    {/* Icon */}
                    <div className={`mx-auto h-16 w-16 bg-gradient-to-r ${role.color} rounded-full flex items-center justify-center mb-6`}>
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
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Continue Button */}
                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center group-hover:shadow-lg">
                      Continue as {role.title}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Demo Credentials Info */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 mt-8">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Demo Credentials Available
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-purple-100">
                <strong>Client:</strong> Use any email/password or register
              </div>
              <div className="text-purple-100">
                <strong>Vendor:</strong> vendor@example.com / vendor123
              </div>
              <div className="text-purple-100">
                <strong>Admin:</strong> admin@urevent360.com / admin123
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Form Step
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="flex items-center text-purple-200 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to role selection
        </button>

        {/* Header */}
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 bg-gradient-to-r ${selectedRoleData?.color} rounded-full flex items-center justify-center shadow-lg`}>
            {selectedRoleData && React.createElement(selectedRoleData.icon, { 
              className: "w-8 h-8 text-white" 
            })}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            {selectedRoleData?.title} Login
          </h2>
          <p className="mt-2 text-sm text-purple-100">
            {selectedRoleData?.description}
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-purple-100 mb-2">
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
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-purple-100 mb-2">
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
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Demo Credentials Note */}
          {selectedRole === 'admin' && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <strong>Demo Admin:</strong> Credentials are pre-filled for testing
            </div>
          )}

          {selectedRole === 'vendor' && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">
              <strong>Demo Vendor:</strong> Credentials are pre-filled for testing
            </div>
          )}

          {/* Login Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r ${selectedRoleData?.color} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                `Sign in as ${selectedRoleData?.title}`
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <span className="text-purple-100">Don't have an account? </span>
            <Link
              to="/register"
              className="font-medium text-white hover:text-purple-200 underline"
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;