import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthSession } from '../../hooks/AuthSession';

interface ProtectedRouteProps {
  allowedRoles: string[];
  redirectPath?: string;
}

/**
 * ProtectedRoute component restricts access to routes based on user role.
 * It checks the user's role from userStore and renders child routes if allowed,
 * otherwise redirects to a fallback path (default: /403).
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, redirectPath = '/403' }) => {
  const { role, isAuthenticated, loading } = useAuthSession();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if role not loaded or not authorized
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectPath} replace />;
  }

  // User authorized, render child routes
  return <Outlet />;
};

export default ProtectedRoute;