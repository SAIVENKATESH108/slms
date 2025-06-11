import React, { useEffect } from 'react';
import { useAuthSession } from '../../hooks/AuthSession';
import SessionWarningModal from './SessionWarningModal';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  requiredPermissions?: string[];
  requiredRole?: string;
  adminOnly?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireAuth = true,
  requiredPermissions = [],
  requiredRole,
  adminOnly = false
}) => {
  const {
    user,
    loading,
    isAuthenticated,
    sessionWarning,
    hasPermission,
    hasRole,
    isAdmin,
    extendSession,
    signOut,
    dismissSessionWarning,
    trackActivity
  } = useAuthSession();

  // Track activity when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      trackActivity();
    }
  }, [isAuthenticated, trackActivity]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication required but user not authenticated
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Admin only access
  if (adminOnly && !isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Insufficient Permissions</h2>
          <p className="text-gray-600">Your role doesn't allow access to this page.</p>
        </div>
      </div>
    );
  }

  // Permission-based access
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
            <p className="text-gray-600">You don't have the required permissions for this page.</p>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {children}
      <SessionWarningModal
        show={sessionWarning.show}
        timeRemaining={sessionWarning.timeRemaining}
        onExtend={extendSession}
        onSignOut={signOut}
        onDismiss={dismissSessionWarning}
      />
    </>
  );
};

export default AuthGuard;