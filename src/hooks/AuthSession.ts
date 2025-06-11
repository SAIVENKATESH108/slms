import { useState, useEffect, useCallback } from 'react';
import { authService, AuthUser } from '../services/AuthService';
import {sessionService} from '../services/SessionData';
import { jwtService } from '../services/JWTService';

interface AuthSessionState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  sessionInfo: any;
  isAuthenticated: boolean;
}

interface SessionWarning {
  show: boolean;
  timeRemaining: number;
}

export const useAuthSession = () => {
  const [state, setState] = useState<AuthSessionState>({
    user: null,
    loading: true,
    error: null,
    sessionInfo: null,
    isAuthenticated: false
  });

  const [sessionWarning, setSessionWarning] = useState<SessionWarning>({
    show: false,
    timeRemaining: 0
  });

  // Update state helper
  const updateState = useCallback((updates: Partial<AuthSessionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      updateState({
        user,
        loading: false,
        isAuthenticated: !!user,
        sessionInfo: sessionService.getSessionInfo()
      });
      if (user) {
        // Fetch clients after user is authenticated
        const clientStore = (await import('../stores/clientStore')).useClientStore;
        clientStore.getState().fetchClients();
      }
    });

    return unsubscribe;
  }, [updateState]);

  // Session warning listener
  useEffect(() => {
    const handleSessionWarning = (event: CustomEvent) => {
      setSessionWarning({
        show: true,
        timeRemaining: event.detail.timeRemaining
      });
    };

    window.addEventListener('sessionWarning', handleSessionWarning as EventListener);
    
    return () => {
      window.removeEventListener('sessionWarning', handleSessionWarning as EventListener);
    };
  }, []);

  // Session expiration listener
  useEffect(() => {
    const unsubscribe = sessionService.onExpiration(() => {
      updateState({
        user: null,
        isAuthenticated: false,
        sessionInfo: null,
        error: 'Session expired. Please sign in again.'
      });
    });

    return unsubscribe;
  }, [updateState]);

  // Periodic session info update
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isAuthenticated) {
        updateState({
          sessionInfo: sessionService.getSessionInfo()
        });
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [state.isAuthenticated, updateState]);

  // Authentication methods
  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      updateState({ loading: true, error: null });
      
      const user = await authService.signIn({ email, password, rememberMe });
      
      updateState({
        user,
        loading: false,
        isAuthenticated: true,
        sessionInfo: sessionService.getSessionInfo()
      });
      
      return user;
    } catch (error: any) {
      updateState({
        loading: false,
        error: error.message || 'Sign in failed'
      });
      throw error;
    }
  }, [updateState]);

  const signUp = useCallback(async (email: string, password: string, displayName: string, businessName?: string) => {
    try {
      updateState({ loading: true, error: null });
      
      const user = await authService.signUp({ email, password, displayName, businessName });
      
      updateState({
        user,
        loading: false,
        isAuthenticated: true,
        sessionInfo: sessionService.getSessionInfo()
      });
      
      return user;
    } catch (error: any) {
      updateState({
        loading: false,
        error: error.message || 'Sign up failed'
      });
      throw error;
    }
  }, [updateState]);

  const signOut = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      
      await authService.signOut();
      
      updateState({
        user: null,
        loading: false,
        isAuthenticated: false,
        sessionInfo: null
      });
    } catch (error: any) {
      updateState({
        loading: false,
        error: error.message || 'Sign out failed'
      });
      throw error;
    }
  }, [updateState]);

  // Session management methods
  const refreshSession = useCallback(async () => {
    try {
      const success = await authService.refreshSession();
      if (success) {
        updateState({
          sessionInfo: sessionService.getSessionInfo()
        });
      }
      return success;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [updateState]);

  const extendSession = useCallback((additionalTime?: number) => {
    sessionService.extendSession(additionalTime);
    updateState({
      sessionInfo: sessionService.getSessionInfo()
    });
    setSessionWarning({ show: false, timeRemaining: 0 });
  }, [updateState]);

  const dismissSessionWarning = useCallback(() => {
    setSessionWarning({ show: false, timeRemaining: 0 });
  }, []);

  // Permission checking methods
  const hasPermission = useCallback((permission: string): boolean => {
    return authService.hasPermission(permission);
  }, []);

  const isAdmin = useCallback((): boolean => {
    return authService.isAdmin();
  }, []);

  const hasRole = useCallback((role: string): boolean => {
    return authService.hasRole(role);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Get token info
  const getTokenInfo = useCallback(() => {
    return jwtService.getTokenInfo();
  }, []);

  // Get security logs
  const getSecurityLogs = useCallback(() => {
    return authService.getSecurityLogs();
  }, []);

  return {
    // State
    ...state,
    sessionWarning,
    
    // Authentication methods
    signIn,
    signUp,
    signOut,
    
    // Session management
    refreshSession,
    extendSession,
    dismissSessionWarning,
    
    // Permission checking
    hasPermission,
    isAdmin,
    hasRole,
    
    // Utility methods
    clearError,
    getTokenInfo,
    getSecurityLogs,
    
    // Session validation
    validateSession: () => authService.validateSession(),
    
    // Activity tracking
    trackActivity: () => sessionService.trackActivity()
  };
};