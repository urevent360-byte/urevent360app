import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // Special case for CEO role
    if (requiredRole === 'ROLE_CEO' && user?.role !== 'ROLE_CEO') {
      return <Navigate to="/login" replace />;
    }
    // Special case for admin role - allow both admin and ROLE_ADMIN
    if (requiredRole === 'admin' && user?.role !== 'admin' && user?.role !== 'ROLE_ADMIN') {
      return <Navigate to="/login" replace />;
    }
    // For other roles, redirect to login
    if (requiredRole !== 'admin' && requiredRole !== 'ROLE_CEO' && user?.role !== requiredRole) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;