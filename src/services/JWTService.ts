import { AuthUser } from './authService';

interface JWTPayload {
  sub: string; // user ID
  email: string | null;
  name: string | null;
  role: string;
  permissions: string[];
  admin: boolean;
  iat: number; // issued at
  exp: number; // expiration
  iss: string; // issuer
  aud: string; // audience
  sessionId: string;
  firebaseToken: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class JWTService {
  private readonly SECRET_KEY = 'your-jwt-secret-key'; // In production, use environment variable
  private readonly ISSUER = 'beautiflow-app';
  private readonly AUDIENCE = 'beautiflow-users';
  
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  // Create session tokens
  async createSession(user: AuthUser, firebaseToken: string, expiresIn: string = '24h'): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Math.floor(Date.now() / 1000);
    const expiration = this.parseExpirationTime(expiresIn);

    const payload: JWTPayload = {
      sub: user.uid,
      email: user.email,
      name: user.displayName,
      role: user.customClaims?.role || 'user',
      permissions: user.customClaims?.permissions || [],
      admin: user.customClaims?.admin || false,
      iat: now,
      exp: now + expiration,
      iss: this.ISSUER,
      aud: this.AUDIENCE,
      sessionId,
      firebaseToken
    };

    // Create access token (short-lived)
    const accessTokenPayload = { ...payload, exp: now + 3600 }; // 1 hour
    this.accessToken = this.createToken(accessTokenPayload);

    // Create refresh token (long-lived)
    const refreshTokenPayload = { 
      sub: user.uid, 
      sessionId, 
      type: 'refresh',
      iat: now,
      exp: now + expiration,
      iss: this.ISSUER,
      aud: this.AUDIENCE
    };
    this.refreshToken = this.createToken(refreshTokenPayload);

    this.saveTokensToStorage();
    
    return this.accessToken;
  }

  // Create JWT token
  private createToken(payload: any): string {
    // Simple JWT implementation for demo - in production use a proper JWT library
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  // Verify and decode token
  verifyToken(token: string): JWTPayload | null {
    try {
      const [headerB64, payloadB64, signature] = token.split('.');
      
      if (!headerB64 || !payloadB64 || !signature) {
        return null;
      }

      // Verify signature
      const expectedSignature = this.createSignature(`${headerB64}.${payloadB64}`);
      if (signature !== expectedSignature) {
        console.error('Invalid token signature');
        return null;
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(payloadB64));
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.error('Token expired');
        return null;
      }

      // Verify issuer and audience
      if (payload.iss !== this.ISSUER || payload.aud !== this.AUDIENCE) {
        console.error('Invalid token issuer or audience');
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Check if current access token is valid
  isTokenValid(): boolean {
    if (!this.accessToken) {
      return false;
    }

    const payload = this.verifyToken(this.accessToken);
    return payload !== null;
  }

  // Get current access token
  getAccessToken(): string | null {
    if (this.isTokenValid()) {
      return this.accessToken;
    }
    return null;
  }

  // Get decoded payload from current token
  getTokenPayload(): JWTPayload | null {
    if (!this.accessToken) {
      return null;
    }
    return this.verifyToken(this.accessToken);
  }

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      return null;
    }

    const refreshPayload = this.verifyToken(this.refreshToken);
    if (!refreshPayload || refreshPayload.type !== 'refresh') {
      return null;
    }

    try {
      // In a real app, you'd make an API call to refresh the token
      // For now, we'll create a new access token with the same session
      const now = Math.floor(Date.now() / 1000);
      const newAccessPayload = {
        ...refreshPayload,
        type: undefined,
        exp: now + 3600, // 1 hour
        iat: now
      };

      this.accessToken = this.createToken(newAccessPayload);
      this.saveTokensToStorage();
      
      return this.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  // Clear all tokens
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.removeTokensFromStorage();
  }

  // Storage management
  private saveTokensToStorage(): void {
    if (this.accessToken) {
      localStorage.setItem('beautiflow_access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('beautiflow_refresh_token', this.refreshToken);
    }
  }

  private loadTokensFromStorage(): void {
    this.accessToken = localStorage.getItem('beautiflow_access_token');
    this.refreshToken = localStorage.getItem('beautiflow_refresh_token');
  }

  private removeTokensFromStorage(): void {
    localStorage.removeItem('beautiflow_access_token');
    localStorage.removeItem('beautiflow_refresh_token');
  }

  // Utility methods
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private parseExpirationTime(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 86400; // Default to 24 hours
    }
  }

  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    str += '='.repeat((4 - str.length % 4) % 4);
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }

  private createSignature(data: string): string {
    // Simple signature for demo - in production use proper HMAC
    let hash = 0;
    const combined = data + this.SECRET_KEY;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Token introspection
  getTokenInfo(): any {
    const payload = this.getTokenPayload();
    if (!payload) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      isAdmin: payload.admin,
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(payload.exp * 1000),
      sessionId: payload.sessionId,
      timeUntilExpiry: payload.exp - Math.floor(Date.now() / 1000)
    };
  }
}

export const jwtService = new JWTService();