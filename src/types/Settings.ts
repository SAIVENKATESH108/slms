export interface OperatingHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'staff' | 'manager' | 'admin';
  commission: number;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  active: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    passwordExpiry: number;
  };
  loginAttempts: {
    maxAttempts: number;
    lockoutDuration: number;
  };
  apiKeys: Array<{
    id: string;
    name: string;
    key: string;
    permissions: string[];
    createdAt: string;
    lastUsed: string | null;
    active: boolean;
  }>;
  accessLogs: Array<{
    id: string;
    userId: string;
    action: string;
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
  }>;
  dataRetention: {
    logRetentionDays: number;
    backupRetentionDays: number;
    customerDataRetentionDays: number;
  };
  encryption: {
    encryptSensitiveData: boolean;
    encryptBackups: boolean;
  };
  notifications: {
    securityAlerts: boolean;
    loginNotifications: boolean;
    dataExportNotifications: boolean;
    suspiciousActivityAlerts: boolean;
  };
}

export interface Settings {
  // Account Settings
  ownerName: string;
  email: string;
  mobile: string;
  profilePicture: string | null;
  newPassword: string;
  
  // Business Information
  businessName: string;
  businessLogo: string | null;
  businessDescription: string;
  operatingHours: Record<string, OperatingHours>;
  address: string;
  gstNumber: string;
  
  // Payment Settings
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  paymentMethods: string[];
  flatCreditEnabled: boolean;
  creditLimit: number;
  autoNotifyUnpaid: boolean;
  reminderDays: number;
  
  // Notifications
  whatsappNotifications: boolean;
  emailReports: boolean;
  paymentAlerts: boolean;
  appointmentAlerts: boolean;
  whatsappApiKey: string;
  
  // System Customizations
  themeColor: string;
  darkMode: boolean;
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  
  // Advanced Theme Settings
  selectedThemeId: string;
  customThemes: Array<{
    id: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      accent: string;
      success: string;
      warning: string;
      error: string;
      border: string;
    };
    isDark: boolean;
  }>;
  enableCustomColors: boolean;
  enableAnimations: boolean;
  
  // Staff Management
  staff: StaffMember[];
  
  // Services
  services: Service[];
  
  // Security Settings
  security: SecuritySettings;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  metadata: {
    creationTime: string;
  };
}

export interface Message {
  type: 'success' | 'error';
  text: string;
}