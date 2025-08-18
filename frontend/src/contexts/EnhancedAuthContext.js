import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced Authentication Context
const EnhancedAuthContext = createContext();

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};

// Token management utilities
const TokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
  },
  getRememberMe: () => localStorage.getItem('remember_me') === 'true',
  setRememberMe: (remember) => localStorage.setItem('remember_me', remember.toString())
};

// Axios interceptor for automatic token refresh
const setupAxiosInterceptors = (refreshAccessToken, logout) => {
  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  // Request interceptor to add auth header
  axios.interceptors.request.use(
    (config) => {
      const token = TokenManager.getAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for token refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

export const EnhancedAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [retryAfter, setRetryAfter] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = TokenManager.getAccessToken();

      if (storedUser && accessToken) {
        try {
          setUser(JSON.parse(storedUser));
          await fetchUserRoles();
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          TokenManager.clearTokens();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Setup axios interceptors
  useEffect(() => {
    setupAxiosInterceptors(refreshAccessToken, logout);
  }, []);

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get(`${API}/auth/user/roles`);
      if (response.data.success) {
        setAvailableRoles(response.data.data.available_roles);
      }
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
    }
  };

  const enhancedLogin = async (email, password, rememberMe = false, twoFactorCode = null) => {
    setLoading(true);
    setAuthError(null);
    setRetryAfter(null);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
        remember_me: rememberMe,
        two_factor_code: twoFactorCode
      });

      if (response.data.success) {
        const { access_token, refresh_token, user: userData } = response.data.data;
        
        // Store tokens and user data
        TokenManager.setTokens(access_token, refresh_token);
        TokenManager.setRememberMe(rememberMe);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setAvailableRoles(userData.available_roles || []);
        setTwoFactorRequired(false);
        
        return { success: true, user: userData };
      }
    } catch (error) {
      const errorData = error.response?.data;
      
      if (error.response?.status === 401 && errorData?.data?.requires_2fa) {
        setTwoFactorRequired(true);
        return { success: false, requires2FA: true };
      }
      
      if (error.response?.status === 429) {
        setRetryAfter(errorData?.retry_after || 300);
        setAuthError(errorData?.message || 'Too many attempts. Please try again later.');
      } else {
        setAuthError(errorData?.message || 'Login failed. Please try again.');
      }
      
      return { success: false, error: errorData?.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API}/auth/refresh`, {
        refresh_token: refreshToken
      });

      if (response.data.success) {
        const { access_token } = response.data.data;
        TokenManager.setTokens(access_token);
        return access_token;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      TokenManager.clearTokens();
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    const refreshToken = TokenManager.getRefreshToken();
    
    try {
      await axios.post(`${API}/auth/logout`, { refresh_token: refreshToken });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    TokenManager.clearTokens();
    setUser(null);
    setAvailableRoles([]);
    setTwoFactorRequired(false);
    setAuthError(null);
    setRetryAfter(null);
  };

  const switchRole = async (newRole) => {
    try {
      const response = await axios.post(`${API}/auth/switch-role`, { role: newRole });
      
      if (response.data.success) {
        // Update user role in state and localStorage
        const updatedUser = { ...user, role: newRole, active_role: newRole };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Role switch failed' 
      };
    }
  };

  const setupTwoFactor = async () => {
    try {
      const response = await axios.post(`${API}/auth/2fa/setup`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to setup 2FA');
    }
  };

  const enableTwoFactor = async (verificationCode) => {
    try {
      await axios.post(`${API}/auth/2fa/enable`, { verification_code: verificationCode });
      
      // Update user state to reflect 2FA is now enabled
      const updatedUser = { ...user, two_factor_enabled: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to enable 2FA' 
      };
    }
  };

  const disableTwoFactor = async (currentPassword) => {
    try {
      await axios.post(`${API}/auth/2fa/disable`, { current_password: currentPassword });
      
      // Update user state
      const updatedUser = { ...user, two_factor_enabled: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to disable 2FA' 
      };
    }
  };

  const getActiveSessions = async () => {
    try {
      const response = await axios.get(`${API}/auth/security/sessions`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch sessions');
    }
  };

  const revokeSession = async (sessionId) => {
    try {
      await axios.delete(`${API}/auth/security/sessions/${sessionId}`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to revoke session' 
      };
    }
  };

  const revokeAllSessions = async () => {
    try {
      await axios.delete(`${API}/auth/security/sessions`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to revoke all sessions' 
      };
    }
  };

  const getEnhancedProfile = async () => {
    try {
      const response = await axios.get(`${API}/auth/profile/enhanced`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch profile');
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
    setRetryAfter(null);
  };

  // Legacy compatibility methods for existing components
  const login = (token, userData) => {
    TokenManager.setTokens(token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    // User state
    user,
    loading,
    availableRoles,
    twoFactorRequired,
    authError,
    retryAfter,
    
    // Authentication methods
    enhancedLogin,
    logout,
    refreshAccessToken,
    clearAuthError,
    
    // Role management
    switchRole,
    
    // Two-factor authentication
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    
    // Session management
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
    
    // Profile management
    getEnhancedProfile,
    
    // Legacy compatibility
    login,
    
    // Utility methods
    isAuthenticated: !!user,
    canSwitchRoles: availableRoles.length > 1,
    currentRole: user?.role || user?.active_role,
    hasRole: (role) => availableRoles.includes(role),
    requiresTwoFactor: user?.role === 'admin' || user?.role === 'vendor',
    twoFactorEnabled: user?.two_factor_enabled || false
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};