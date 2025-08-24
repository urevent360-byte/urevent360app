import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 AuthRedirect - Loading:', loading);
    console.log('🔍 AuthRedirect - Authenticated:', isAuthenticated());
    console.log('🔍 AuthRedirect - User:', user);

    if (!loading) {
      if (isAuthenticated() && user) {
        // Redirect based on user role
        console.log('🔀 Redirecting authenticated user with role:', user.role);
        
        if (user.role === 'admin' || user.role === 'ROLE_ADMIN') {
          navigate('/admin', { replace: true });
        } else if (user.role === 'vendor') {
          navigate('/vendor', { replace: true });
        } else if (user.role === 'employee') {
          navigate('/employee', { replace: true });
        } else if (user.role === 'ROLE_CEO') {
          navigate('/ceo', { replace: true });
        } else {
          // Default to client dashboard
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Not authenticated, show login
        console.log('🔀 User not authenticated, staying on login page');
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // If not authenticated, show the Login component
  return null;
};

export default AuthRedirect;