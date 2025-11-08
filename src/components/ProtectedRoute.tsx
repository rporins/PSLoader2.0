import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireLevel?: number;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireLevel = 3 }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const securityLevel = authService.getSecurityLevel();

  // Check if user has required security level
  if (!isAuthenticated || securityLevel < requireLevel) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;