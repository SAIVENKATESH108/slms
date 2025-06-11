import { AuthUser } from './authService';

interface SessionData {
  user: AuthUser;
  token: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  persistent: boolean;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

interface SessionConfig {
  maxInactiveTime: number; // 30 minutes default
  maxSessionTime: number; // 24 hours default
  persistentSessionTime: number; // 30 days for "remember me"
  warningTime: number; // 5 minutes before expiry
}

class SessionService {
  private session: SessionData | null = null;
  private sessionTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private activityListeners: (() => void)[] = [];
  private expirationCallbacks: (() => void)[] = [];

  private config: SessionConfig = {
    maxInactiveTime: 30 * 60 * 1000, // 30 minutes
    maxSessionTime: 24 * 60 * 60 * 1000, // 24 hours
    persistentSessionTime: 30 * 24 * 60 * 60 * 1000, // 30 days
    warningTime: 5 * 60 * 1000 // 5 minutes
  };

  constructor() {
    this.loadSessionFromStorage();
    this.setupActivityTracking();
    this.setupPeriodicValidation();
  }

  // Create new session
  setSession(token: string, user: AuthUser, persistent: boolean = false): void {
    const now = Date.now();
    const maxTime = persistent ? this.config.persistentSessionTime : this.config.maxSessionTime;

    this.session = {
      user,
      token,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + maxTime,
      persistent,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    this.saveSessionToStorage();
    this.startSessionTimers();
    this.trackActivity();
  }

  // Refresh existing session
  refreshSession(newToken: string, updatedUser: AuthUser): void {
    if (!this.session) {
      return;
    }

    this.session.token = newToken;
    this.session.user = updatedUser;
    this.session.lastActivity = Date.now();
    
    this.saveSessionToStorage();
  }

  // Validate current session
  isSessionValid(): boolean {
    if (!this.session) {
      return false;
    }

    const now = Date.now();
    
    // Check if session has expired
    if (now > this.session.expiresAt) {
      this.clearSession();
      return false;
    }

    // Check if session has been inactive too long
    const inactiveTime = now - this.session.lastActivity;
    if (inactiveTime > this.config.maxInactiveTime) {
      this.clearSession();
      return false;
    }

    return true;
  }

  // Get current session
  getSession(): SessionData | null {
    if (this.isSessionValid()) {
      return this.session;
    }
    return null;
  }

  // Get current user from session
  getCurrentUser(): AuthUser | null {
    const session = this.getSession();
    return session ? session.user : null;
  }

  // Clear session
  clearSession(): void {
    this.session = null;
    this.clearSessionTimers();
    this.removeSessionFromStorage();
  }

  // Track user activity
  trackActivity(): void {
    if (!this.session) {
      return;
    }

    this.session.lastActivity = Date.now();
    this.saveSessionToStorage();
    
    // Reset inactivity timer
    this.startSessionTimers();
    
    // Notify activity listeners
    this.activityListeners.forEach(listener => listener());
  }

  // Session timing management
  private startSessionTimers(): void {
    this.clearSessionTimers();

    if (!this.session) {
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = this.session.expiresAt - now;
    const timeUntilInactive = this.config.maxInactiveTime - (now - this.session.lastActivity);

    // Set timer for session expiry
    if (timeUntilExpiry > 0) {
      this.sessionTimer = setTimeout(() => {
        this.handleSessionExpiry();
      }, Math.min(timeUntilExpiry, timeUntilInactive));
    }

    // Set warning timer
    const warningTime = Math.min(timeUntilExpiry, timeUntilInactive) - this.config.warningTime;
    if (warningTime > 0) {
      this.warningTimer = setTimeout(() => {
        this.handleSessionWarning();
      }, warningTime);
    }
  }

  private clearSessionTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private handleSessionExpiry(): void {
    console.log('Session expired');
    this.clearSession();
    this.expirationCallbacks.forEach(callback => callback());
  }

  private handleSessionWarning(): void {
    console.log('Session expiring soon');
    // Could show a warning modal here
    const event = new CustomEvent('sessionWarning', {
      detail: {
        timeRemaining: this.getTimeUntilExpiry()
      }
    });
    window.dispatchEvent(event);
  }

  // Activity tracking setup
  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const throttledTrackActivity = this.throttle(() => {
      this.trackActivity();
    }, 30000); // Track activity at most once per 30 seconds

    events.forEach(event => {
      document.addEventListener(event, throttledTrackActivity, true);
    });
  }

  // Periodic session validation
  private setupPeriodicValidation(): void {
    setInterval(() => {
      if (this.session && !this.isSessionValid()) {
        this.handleSessionExpiry();
      }
    }, 60000); // Check every minute
  }

  // Storage management
  private saveSessionToStorage(): void {
    if (!this.session) {
      return;
    }

    const storageKey = 'beautiflow_session';
    const storageData = {
      ...this.session,
      // Don't store sensitive token in localStorage for non-persistent sessions
      token: this.session.persistent ? this.session.token : undefined
    };

    if (this.session.persistent) {
      localStorage.setItem(storageKey, JSON.stringify(storageData));
    } else {
      sessionStorage.setItem(storageKey, JSON.stringify(storageData));
    }
  }

  private loadSessionFromStorage(): void {
    const storageKey = 'beautiflow_session';
    
    // Try localStorage first (persistent sessions)
    let sessionData = localStorage.getItem(storageKey);
    if (!sessionData) {
      // Try sessionStorage (non-persistent sessions)
      sessionData = sessionStorage.getItem(storageKey);
    }

    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        this.session = parsed;
        
        // Validate loaded session
        if (!this.isSessionValid()) {
          this.clearSession();
        } else {
          this.startSessionTimers();
        }
      } catch (error) {
        console.error('Failed to load session from storage:', error);
        this.removeSessionFromStorage();
      }
    }
  }

  private removeSessionFromStorage(): void {
    const storageKey = 'beautiflow_session';
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
  }

  // Session information
  getSessionInfo(): any {
    if (!this.session) {
      return null;
    }

    const now = Date.now();
    return {
      userId: this.session.user.uid,
      email: this.session.user.email,
      createdAt: new Date(this.session.createdAt),
      lastActivity: new Date(this.session.lastActivity),
      expiresAt: new Date(this.session.expiresAt),
      timeUntilExpiry: this.session.expiresAt - now,
      timeUntilInactive: this.config.maxInactiveTime - (now - this.session.lastActivity),
      isPersistent: this.session.persistent,
      deviceInfo: this.session.deviceInfo
    };
  }

  getTimeUntilExpiry(): number {
    if (!this.session) {
      return 0;
    }
    return Math.max(0, this.session.expiresAt - Date.now());
  }

  // Event listeners
  onActivity(callback: () => void): () => void {
    this.activityListeners.push(callback);
    return () => {
      const index = this.activityListeners.indexOf(callback);
      if (index > -1) {
        this.activityListeners.splice(index, 1);
      }
    };
  }

  onExpiration(callback: () => void): () => void {
    this.expirationCallbacks.push(callback);
    return () => {
      const index = this.expirationCallbacks.indexOf(callback);
      if (index > -1) {
        this.expirationCallbacks.splice(index, 1);
      }
    };
  }

  // Utility methods
  private throttle(func: Function, limit: number): Function {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Session extension
  extendSession(additionalTime: number = this.config.maxSessionTime): void {
    if (!this.session) {
      return;
    }

    this.session.expiresAt = Math.min(
      this.session.expiresAt + additionalTime,
      this.session.createdAt + (this.session.persistent ? this.config.persistentSessionTime : this.config.maxSessionTime)
    );
    
    this.saveSessionToStorage();
    this.startSessionTimers();
  }

  // Force session refresh
  async forceRefresh(): Promise<boolean> {
    if (!this.session) {
      return false;
    }

    try {
      // This would typically make an API call to refresh the session
      this.session.lastActivity = Date.now();
      this.saveSessionToStorage();
      this.startSessionTimers();
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }
}

export const sessionService = new SessionService();