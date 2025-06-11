import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { jwtService } from './JWTService';
import {sessionService} from './SessionData';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  customClaims?: {
    admin?: boolean;
    role?: string;
    permissions?: string[];
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  businessName?: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    this.initializeAuthListener();
  }

  private initializeAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get custom claims and create session
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const customClaims = idTokenResult.claims;
          
          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            metadata: {
              creationTime: firebaseUser.metadata.creationTime || '',
              lastSignInTime: firebaseUser.metadata.lastSignInTime || ''
            },
            customClaims: {
              admin: customClaims.admin || false,
              role: customClaims.role || 'user',
              permissions: customClaims.permissions || []
            }
          };

          // Create JWT session
          const sessionToken = await jwtService.createSession(authUser, idTokenResult.token);
          sessionService.setSession(sessionToken, authUser);
          
          this.currentUser = authUser;
          this.notifyAuthStateListeners(authUser);
        } catch (error) {
          console.error('Error processing auth state change:', error);
          this.handleSignOut();
        }
      } else {
        this.handleSignOut();
      }
    });
  }

  private handleSignOut() {
    this.currentUser = null;
    sessionService.clearSession();
    jwtService.clearTokens();
    this.notifyAuthStateListeners(null);
  }

  private notifyAuthStateListeners(user: AuthUser | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  // Authentication methods
  async signIn(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const { email, password, rememberMe = false } = credentials;
      
      // Validate session before attempting sign in
      if (this.currentUser && sessionService.isSessionValid()) {
        throw new Error('User already signed in');
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (!result.user) {
        throw new Error('Sign in failed');
      }

      // Get fresh ID token with custom claims
      const idTokenResult = await result.user.getIdTokenResult(true);
      
      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
        metadata: {
          creationTime: result.user.metadata.creationTime || '',
          lastSignInTime: result.user.metadata.lastSignInTime || ''
        },
        customClaims: {
          admin: idTokenResult.claims.admin || false,
          role: idTokenResult.claims.role || 'user',
          permissions: idTokenResult.claims.permissions || []
        }
      };

      // Create session with appropriate expiration
      const sessionToken = await jwtService.createSession(
        authUser, 
        idTokenResult.token,
        rememberMe ? '30d' : '24h'
      );
      
      sessionService.setSession(sessionToken, authUser, rememberMe);
      
      // Log successful sign in
      this.logSecurityEvent('user_signin', {
        userId: authUser.uid,
        email: authUser.email,
        timestamp: new Date().toISOString(),
        rememberMe
      });

      return authUser;
    } catch (error: any) {
      // Log failed sign in attempt
      this.logSecurityEvent('signin_failed', {
        email: credentials.email,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(error.message || 'Sign in failed');
    }
  }

  async signUp(signupData: SignupData): Promise<AuthUser> {
    try {
      const { email, password, displayName, businessName } = signupData;
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (!result.user) {
        throw new Error('Account creation failed');
      }

      // Update profile with display name
      await updateProfile(result.user, { 
        displayName: displayName 
      });

      // Get ID token
      const idTokenResult = await result.user.getIdTokenResult();
      
      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
        metadata: {
          creationTime: result.user.metadata.creationTime || '',
          lastSignInTime: result.user.metadata.lastSignInTime || ''
        },
        customClaims: {
          admin: false,
          role: 'user',
          permissions: ['read:own_data', 'write:own_data']
        }
      };

      // Create initial session
      const sessionToken = await jwtService.createSession(authUser, idTokenResult.token);
      sessionService.setSession(sessionToken, authUser);

      // Log successful signup
      this.logSecurityEvent('user_signup', {
        userId: authUser.uid,
        email: authUser.email,
        businessName,
        timestamp: new Date().toISOString()
      });

      return authUser;
    } catch (error: any) {
      throw new Error(error.message || 'Account creation failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.currentUser) {
        this.logSecurityEvent('user_signout', {
          userId: this.currentUser.uid,
          timestamp: new Date().toISOString()
        });
      }

      await firebaseSignOut(auth);
      this.handleSignOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Force local cleanup even if Firebase signout fails
      this.handleSignOut();
      throw new Error('Sign out failed');
    }
  }

  // Session management
  async refreshSession(): Promise<boolean> {
    try {
      if (!auth.currentUser) {
        return false;
      }

      // Get fresh ID token
      const idTokenResult = await auth.currentUser.getIdTokenResult(true);
      
      if (this.currentUser) {
        // Update custom claims
        this.currentUser.customClaims = {
          admin: idTokenResult.claims.admin || false,
          role: idTokenResult.claims.role || 'user',
          permissions: idTokenResult.claims.permissions || []
        };

        // Create new session token
        const sessionToken = await jwtService.createSession(this.currentUser, idTokenResult.token);
        sessionService.refreshSession(sessionToken, this.currentUser);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }

  validateSession(): boolean {
    return sessionService.isSessionValid() && jwtService.isTokenValid();
  }

  getCurrentUser(): AuthUser | null {
    if (this.validateSession()) {
      return this.currentUser;
    }
    return null;
  }

  // Permission checking
  hasPermission(permission: string): boolean {
    if (!this.currentUser?.customClaims?.permissions) {
      return false;
    }
    return this.currentUser.customClaims.permissions.includes(permission);
  }

  isAdmin(): boolean {
    return this.currentUser?.customClaims?.admin === true;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.customClaims?.role === role;
  }

  // Event listeners
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Security logging
  private logSecurityEvent(event: string, data: any) {
    const logEntry = {
      event,
      data,
      userAgent: navigator.userAgent,
      ipAddress: 'client-side', // Would be populated server-side
      timestamp: new Date().toISOString()
    };
    
    // Store in session storage for potential server sync
    const existingLogs = sessionStorage.getItem('security_logs');
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(logEntry);
    
    // Keep only last 50 entries
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50);
    }
    
    sessionStorage.setItem('security_logs', JSON.stringify(logs));
    
    console.log('Security Event:', logEntry);
  }

  // Get security logs
  getSecurityLogs(): any[] {
    const logs = sessionStorage.getItem('security_logs');
    return logs ? JSON.parse(logs) : [];
  }

  // Clear security logs
  clearSecurityLogs(): void {
    sessionStorage.removeItem('security_logs');
  }
}

export const authService = new AuthService();