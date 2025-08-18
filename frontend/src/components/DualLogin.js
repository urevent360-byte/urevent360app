import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '../contexts/EnhancedAuthContext';
import GoogleLoginButton from './GoogleLoginButton';
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
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone,
  Zap
} from 'lucide-react';

const DualLogin = () => {
  const { 
    enhancedLogin, 
    loading, 
    authError, 
    retryAfter, 
    twoFactorRequired,
    clearAuthError
  } = useEnhancedAuth();
  
  const navigate = useNavigate();
  const [step, setStep] = useState('role-selection');
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(false);

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

  // Handle retry countdown
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      setRetryCountdown(retryAfter);
      const interval = setInterval(() => {
        setRetryCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            clearAuthError();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [retryAfter, clearAuthError]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep('dual-login');
    clearAuthError();
    
    // Pre-fill demo credentials based on role
    if (role === 'admin') {
      setFormData({
        email: 'admin@urevent360.com',
        password: 'admin123',
        twoFactorCode: ''
      });
    } else if (role === 'vendor') {
      setFormData({
        email: 'vendor@example.com',
        password: 'vendor123',
        twoFactorCode: ''
      });
    } else if (role === 'employee') {
      setFormData({
        email: 'employee@example.com',
        password: 'employee123',
        twoFactorCode: ''
      });
    } else {
      setFormData({
        email: '',
        password: '',
        twoFactorCode: ''
      });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (authError) {
      clearAuthError();
    }
  };

  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    
    if (retryCountdown > 0) {
      return;
    }
    
    const result = await enhancedLogin(
      formData.email, 
      formData.password, 
      rememberMe,
      formData.twoFactorCode || null
    );

    if (result.success) {
      navigate('/');
    } else if (result.requires2FA) {
      setStep('2fa');
    }
  };

  const handleGoogleLoginSuccess = (authData) => {
    console.log('Google login successful:', authData);
    // Navigation will happen automatically due to auth state change
    navigate('/');
  };

  const handleGoogleLoginError = (error) => {
    console.error('Google login error:', error);
    // You could set a local error state here if needed
    alert(`Google login failed: ${error}`);
  };

  const goBack = () => {
    if (step === '2fa') {
      setStep('dual-login');
    } else {
      setStep('role-selection');
      setSelectedRole('');
      setShowTraditionalLogin(false);
    }
    setFormData({ email: '', password: '', twoFactorCode: '' });
    setRememberMe(false);
    clearAuthError();
  };

  const selectedRoleData = roleOptions.find(role => role.id === selectedRole);

  // Error Display Component
  const ErrorDisplay = ({ error, retryCountdown }) => {
    if (!error) return null;

    const isRateLimit = retryCountdown > 0;
    const isTemporary = error.includes('temporarily') || error.includes('30 seconds');

    return (
      <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
        isRateLimit 
          ? 'bg-orange-50 border-orange-200 text-orange-800' 
          : isTemporary 
          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        {isRateLimit ? (
          <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
        ) : isTemporary ? (
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <div className="font-medium">
            {isRateLimit ? 'Rate Limited' : isTemporary ? 'Temporary Issue' : 'Authentication Failed'}
          </div>
          <div className="text-sm mt-1">
            {error}
            {retryCountdown > 0 && (
              <div className="mt-2 font-medium">
                Retry in {retryCountdown} seconds
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Role Selection Step
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
              Choose your login method
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
            {roleOptions.filter(role => role.id !== 'admin' && role.id !== 'employee').map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.id}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer group hover:scale-105 transform border border-white/20"
                >
                  <div className="p-8">
                    <div className={`mx-auto h-16 w-16 bg-gradient-to-r ${role.color} rounded-full flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{role.title}</h3>
                      <p className="text-gray-600">{role.description}</p>
                    </div>

                    <div className="space-y-2 mb-6">
                      {role.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => handleRoleSelect(role.id)}
                      className={`w-full bg-gradient-to-r ${role.color} text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center`}
                    >
                      Continue as {role.title}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Security Features */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mt-8 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Dual Authentication Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-white/90 bg-white/10 rounded-lg p-3 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                <span><strong>Traditional Login</strong><br/>Secure email & password</span>
              </div>
              <div className="text-white/90 bg-white/10 rounded-lg p-3 flex items-center">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                </svg>
                <span><strong>Google Login</strong><br/>Fast & secure OAuth</span>
              </div>
            </div>
          </div>

          {/* Employee Portal Link */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => handleRoleSelect('employee')}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 text-white/70 hover:text-white text-sm"
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

  // Two-Factor Authentication Step
  if (step === '2fa') {
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
        <div className="max-w-md w-full space-y-8 relative z-10">
          <button
            onClick={goBack}
            className="flex items-center text-white/80 hover:text-white transition-colors mb-4 backdrop-blur-sm bg-white/10 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </button>

          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl border border-white/20">
              <Smartphone className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-white drop-shadow-lg">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-white/90 drop-shadow">
              Enter the code from your authenticator app
            </p>
          </div>

          <form className="mt-8 space-y-6 bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20" onSubmit={handleTraditionalLogin}>
            <div>
              <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-2">
                Authentication Code
              </label>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                required
                value={formData.twoFactorCode}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            <ErrorDisplay error={authError} retryCountdown={retryCountdown} />

            <button
              type="submit"
              disabled={loading || retryCountdown > 0}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify & Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dual Login Step
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
      <div className="max-w-md w-full space-y-8 relative z-10">
        <button
          onClick={goBack}
          className="flex items-center text-white/80 hover:text-white transition-colors mb-4 backdrop-blur-sm bg-white/10 px-3 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to role selection
        </button>

        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl border border-white/20">
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
            Choose your preferred login method
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20 space-y-6">
          {/* Google Login Option */}
          <div className="space-y-4">
            <GoogleLoginButton
              role={selectedRole}
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              disabled={loading}
            />
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Traditional Login Toggle */}
            <button
              onClick={() => setShowTraditionalLogin(!showTraditionalLogin)}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 font-medium text-gray-700"
            >
              <Mail className="w-5 h-5 mr-3" />
              Sign in with Email & Password
              <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${showTraditionalLogin ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {/* Traditional Login Form (Collapsible) */}
          {showTraditionalLogin && (
            <form className="space-y-4 pt-4 border-t border-gray-200" onSubmit={handleTraditionalLogin}>
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
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

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
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me for 30 days
                </label>
              </div>

              <ErrorDisplay error={authError} retryCountdown={retryCountdown} />

              {/* Demo Credentials Note */}
              {selectedRole === 'admin' && (
                <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-xl text-sm">
                  <strong>Demo Admin Access:</strong> Credentials pre-filled for testing
                </div>
              )}

              <button
                type="submit"
                disabled={loading || retryCountdown > 0}
                className={`w-full bg-gradient-to-r ${selectedRoleData?.color} text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : retryCountdown > 0 ? (
                  `Retry in ${retryCountdown}s`
                ) : (
                  `Access ${selectedRoleData?.title} Portal`
                )}
              </button>
            </form>
          )}

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <span className="text-gray-600">Don't have an account? </span>
            <Link
              to="/register"
              className="font-medium text-purple-600 hover:text-purple-500 underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualLogin;