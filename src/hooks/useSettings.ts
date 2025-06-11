import { useState, useEffect } from 'react';
import { Settings, User, Message } from '../types/Settings';
import { useAuthStore } from '../stores/authStore';
import { firestore } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { usePaymentStore } from '../stores/paymentStore';
import { authService } from '../services/AuthService';

const DEFAULT_SETTINGS: Settings = {
  ownerName: '',
  email: '',
  mobile: '',
  profilePicture: null,
  newPassword: '',
  businessName: '',
  businessLogo: null,
  businessDescription: '',
  operatingHours: {
    monday: { open: '09:00', close: '20:00', closed: false },
    tuesday: { open: '09:00', close: '20:00', closed: false },
    wednesday: { open: '09:00', close: '20:00', closed: false },
    thursday: { open: '09:00', close: '20:00', closed: false },
    friday: { open: '09:00', close: '20:00', closed: false },
    saturday: { open: '09:00', close: '21:00', closed: false },
    sunday: { open: '10:00', close: '18:00', closed: false }
  },
  address: '',
  gstNumber: '',
  razorpayEnabled: false,
  razorpayKeyId: '',
  razorpayKeySecret: '',
  paymentMethods: ['cash'],
  flatCreditEnabled: true,
  creditLimit: 5000,
  autoNotifyUnpaid: true,
  reminderDays: 7,
  whatsappNotifications: true,
  emailReports: false,
  paymentAlerts: true,
  appointmentAlerts: true,
  whatsappApiKey: '',
  themeColor: '#8B5CF6',
  darkMode: false,
  language: 'en',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  selectedThemeId: 'light',
  customThemes: [],
  enableCustomColors: false,
  enableAnimations: true,
  staff: [],
  services: [],
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordExpiry: 90
    },
    loginAttempts: {
      maxAttempts: 5,
      lockoutDuration: 15
    },
    apiKeys: [],
    accessLogs: [
      {
        id: '1',
        userId: 'user123',
        action: 'Login',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true
      },
      {
        id: '2',
        userId: 'user123',
        action: 'Settings Update',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true
      }
    ],
    dataRetention: {
      logRetentionDays: 90,
      backupRetentionDays: 365,
      customerDataRetentionDays: 1095
    },
    encryption: {
      encryptSensitiveData: true,
      encryptBackups: true
    },
    notifications: {
      securityAlerts: true,
      loginNotifications: false,
      dataExportNotifications: true,
      suspiciousActivityAlerts: true
    }
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const authUser = useAuthStore(state => state.user);
  const generatePaymentReminder = usePaymentStore(state => state.generatePaymentReminder);

  // Helper function to check if user can access shared settings
  const canAccessSharedSettings = () => {
    const currentUser = authService.getCurrentUser();
    const role = currentUser?.customClaims?.role;
    return role === 'admin' || role === 'manager';
  };

  // Define which settings should always be user-specific (personal data)
  const personalSettingsFields = [
    'ownerName', 'email', 'mobile', 'profilePicture', 'newPassword',
    'businessName', 'businessLogo', 'businessDescription', 'address', 'gstNumber'
  ];

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      loadSettings(authUser.uid);
    }
  }, [authUser]);

  useEffect(() => {
    const hasChanged = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanged);
  }, [settings, originalSettings]);

  const loadSettings = async (uid: string) => {
    setLoading(true);
    try {
      let finalSettings = { ...DEFAULT_SETTINGS };

      // Always load personal settings (account & business data)
      const personalDocRef = doc(firestore, 'users', uid, 'settings', 'config');
      const personalDocSnap = await getDoc(personalDocRef);
      
      if (personalDocSnap.exists()) {
        const personalData = personalDocSnap.data() as Settings;
        // Merge personal settings
        personalSettingsFields.forEach(field => {
          if (personalData[field as keyof Settings] !== undefined) {
            finalSettings[field as keyof Settings] = personalData[field as keyof Settings];
          }
        });
      }

      // Load shared settings if user has access (admin/manager)
      if (canAccessSharedSettings()) {
        try {
          const sharedDocRef = doc(firestore, 'settings', 'shared');
          const sharedDocSnap = await getDoc(sharedDocRef);
          
          if (sharedDocSnap.exists()) {
            const sharedData = sharedDocSnap.data() as Settings;
            // Merge shared settings (excluding personal fields)
            Object.keys(sharedData).forEach(key => {
              if (!personalSettingsFields.includes(key)) {
                finalSettings[key as keyof Settings] = sharedData[key as keyof Settings];
              }
            });
          }
        } catch (sharedError) {
          console.warn('Could not load shared settings, using personal settings:', sharedError);
          // Fallback to personal settings for non-personal fields
          if (personalDocSnap.exists()) {
            const personalData = personalDocSnap.data() as Settings;
            Object.keys(personalData).forEach(key => {
              if (!personalSettingsFields.includes(key)) {
                finalSettings[key as keyof Settings] = personalData[key as keyof Settings];
              }
            });
          }
        }
      } else {
        // Employee: use personal settings for everything
        if (personalDocSnap.exists()) {
          const personalData = personalDocSnap.data() as Settings;
          finalSettings = { ...DEFAULT_SETTINGS, ...personalData };
        }
      }

      setSettings(finalSettings);
      setOriginalSettings(finalSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (field: string, value: any, section?: string) => {
    setSettings(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section as keyof Settings],
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const updateSecuritySettings = (field: string, value: any, subsection?: string) => {
    setSettings(prev => {
      if (subsection) {
        return {
          ...prev,
          security: {
            ...prev.security,
            [subsection]: {
              ...prev.security[subsection as keyof typeof prev.security],
              [field]: value
            }
          }
        };
      }
      return {
        ...prev,
        security: {
          ...prev.security,
          [field]: value
        }
      };
    });
  };

  const saveSettings = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'User not authenticated' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // Separate personal and shared settings
      const personalSettings: Partial<Settings> = {};
      const sharedSettings: Partial<Settings> = {};

      Object.keys(settings).forEach(key => {
        if (personalSettingsFields.includes(key)) {
          personalSettings[key as keyof Settings] = settings[key as keyof Settings];
        } else {
          sharedSettings[key as keyof Settings] = settings[key as keyof Settings];
        }
      });

      // Always save personal settings to user's collection
      const personalDocRef = doc(firestore, 'users', user.uid, 'settings', 'config');
      await setDoc(personalDocRef, personalSettings, { merge: true });

      // Save shared settings if user has access
      if (canAccessSharedSettings()) {
        const sharedDocRef = doc(firestore, 'settings', 'shared');
        await setDoc(sharedDocRef, {
          ...sharedSettings,
          updatedBy: user.uid,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } else {
        // Employee: save all settings to personal collection
        await setDoc(personalDocRef, settings);
      }

      setOriginalSettings(settings);
      setHasChanges(false);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      setUser(null);
      setSettings(DEFAULT_SETTINGS);
      setMessage({ type: 'success', text: 'Signed out successfully' });
    } catch (error) {
      console.error('Error signing out:', error);
      setMessage({
        type: 'error',
        text: 'Failed to sign out. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Example AI integration: generate payment reminder message
  const generatePaymentReminderMessage = async (clientName: string, amount: number) => {
    try {
      const message = await generatePaymentReminder(clientName, amount);
      return message;
    } catch (error) {
      console.error('Error generating payment reminder:', error);
      throw error;
    }
  };

  // Security functions
  const generateApiKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: `API Key ${settings.security.apiKeys.length + 1}`,
      key: 'sk_' + Math.random().toString(36).substr(2, 32),
      createdAt: new Date().toISOString(),
      lastUsed: null,
      permissions: ['read']
    };
    
    updateSecuritySettings('apiKeys', [...settings.security.apiKeys, newKey]);
    setMessage({ type: 'success', text: 'API key generated successfully' });
  };

  const revokeApiKey = (keyId: string) => {
    const updatedKeys = settings.security.apiKeys.map(key => 
      key.id === keyId ? { ...key, revoked: true } : key
    );
    updateSecuritySettings('apiKeys', updatedKeys);
    setMessage({ type: 'success', text: 'API key revoked successfully' });
  };

  const deleteApiKey = (keyId: string) => {
    const updatedKeys = settings.security.apiKeys.filter(key => key.id !== keyId);
    updateSecuritySettings('apiKeys', updatedKeys);
    setMessage({ type: 'success', text: 'API key deleted successfully' });
  };

  const clearAccessLogs = () => {
    updateSecuritySettings('accessLogs', []);
    setMessage({ type: 'success', text: 'Access logs cleared successfully' });
  };

  // Data management functions
  const exportData = () => {
    const dataToExport = {
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: 'Settings exported successfully' });
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      setSettings(DEFAULT_SETTINGS);
      setMessage({ type: 'success', text: 'Settings reset to default values' });
    }
  };

  return {
    settings,
    user,
    loading,
    message,
    hasChanges,
    updateSettings,
    updateSecuritySettings,
    generateApiKey,
    revokeApiKey,
    deleteApiKey,
    clearAccessLogs,
    saveSettings,
    signOut,
    exportData,
    resetSettings,
    setMessage,
    generatePaymentReminderMessage,
    canAccessSharedSettings // Export this for UI components to use
  };
};
