import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';

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
  const role = useUserStore((state) => state.role);

  if (!role) {
    // Role not loaded yet or user not authenticated, redirect to login or fallback
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // User role not authorized for this route
    return <Navigate to={redirectPath} replace />;
  }

  // User authorized, render child routes
  return <Outlet />;
};

export default ProtectedRoute;
