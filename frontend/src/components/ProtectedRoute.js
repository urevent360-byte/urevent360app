import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Check authentication status
  const authenticated = isAuthenticated();
  
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but user data is not loaded yet, try to get from localStorage
  let currentUser = user;
  if (!currentUser) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
    } else {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // Check role-based access
  if (requiredRole) {
    // Special case for CEO role
    if (requiredRole === 'ROLE_CEO' && currentUser.role !== 'ROLE_CEO') {
      return <Navigate to="/login" replace />;
    }
    // Special case for admin role - allow both admin and ROLE_ADMIN
    if (requiredRole === 'admin' && currentUser.role !== 'admin' && currentUser.role !== 'ROLE_ADMIN') {
      return <Navigate to="/login" replace />;
    }
    // For other roles, check exact match
    if (requiredRole !== 'admin' && requiredRole !== 'ROLE_CEO' && currentUser.role !== requiredRole) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

export default ProtectedRoute;