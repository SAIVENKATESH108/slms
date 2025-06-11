import { useState, useEffect, useCallback } from 'react';
import { authService, AuthUser } from '../services/AuthService';
import { sessionService } from '../services/SessionData';
import { jwtService } from '../services/JWTService';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';

interface AuthSessionState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  sessionInfo: any;
  isAuthenticated: boolean;
  role: string | null;
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
    isAuthenticated: false,
    role: null
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
      if (user) {
        try {
          // Fetch user role from Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          const role = userDoc.exists() ? userDoc.data().role : null;
          
          updateState({
            user,
            loading: false,
            isAuthenticated: true,
            sessionInfo: sessionService.getSessionInfo(),
            role
          });
          
          // Fetch clients after user is authenticated
          const clientStore = (await import('../stores/clientStore')).useClientStore;
          clientStore.getState().fetchClients();
        } catch (error) {
          console.error('Error fetching user role:', error);
          updateState({
            user,
            loading: false,
            isAuthenticated: true,
            sessionInfo: sessionService.getSessionInfo(),
            role: null
          });
        }
      } else {
        updateState({
          user: null,
          loading: false,
          isAuthenticated: false,
          sessionInfo: null,
          role: null
        });
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
        error: 'Session expired. Please sign in again.',
        role: null
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
      
      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const role = userDoc.exists() ? userDoc.data().role : null;
      
      updateState({
        user,
        loading: false,
        isAuthenticated: true,
        sessionInfo: sessionService.getSessionInfo(),
        role
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
      
      // Set default role for new users
      await setDoc(doc(firestore, 'users', user.uid), {
        email,
        displayName,
        role: 'employee', // Default role
        createdAt: new Date()
      }, { merge: true });
      
      updateState({
        user,
        loading: false,
        isAuthenticated: true,
        sessionInfo: sessionService.getSessionInfo(),
        role: 'employee'
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
        sessionInfo: null,
        role: null
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
    return state.role === 'admin';
  }, [state.role]);

  const hasRole = useCallback((role: string): boolean => {
    return state.role === role;
  }, [state.role]);

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