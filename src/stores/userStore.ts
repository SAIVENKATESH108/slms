import { create } from 'zustand';
import { 
  updateProfile, 
  updateEmail, 
  updatePassword,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore, storage } from '../firebase/config';
import { useAuthStore } from './authStore';

export interface UserSettings {
  ownerName: string;
  email: string;
  mobile: string;
  newPassword?: string;
  currentPassword?: string;
  profilePicture: string;
}

interface UserState {
  settings: UserSettings | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  
  fetchUserSettings: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserSettings>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  signOutUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  settings: null,
  role: null,
  loading: false,
  error: null,
  
  fetchUserSettings: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    set({ loading: true, error: null });
    try {
      const userDoc = await getDoc(doc(firestore, `users/${user.uid}`));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        set({ 
          settings: userData.settings || {
            ownerName: user.displayName || '',
            email: user.email || '',
            mobile: '',
            profilePicture: user.photoURL || ''
          },
          role: userData.role || null
        });
      } else {
        // Create default settings if not exists
        const defaultSettings: UserSettings = {
          ownerName: user.displayName || '',
          email: user.email || '',
          mobile: '',
          profilePicture: user.photoURL || ''
        };
        
        await setDoc(doc(firestore, `users/${user.uid}`), {
          settings: defaultSettings,
          role: 'employee', // default role
          createdAt: new Date()
        });
        
        set({ settings: defaultSettings, role: 'employee' });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateUserProfile: async (updates: Partial<UserSettings>) => {
    const user = useAuthStore.getState().user;
    const { settings } = get();
    
    if (!user || !settings) throw new Error('User not authenticated');
    
    set({ loading: true, error: null });
    try {
      // Separate password update from other profile updates
      // to handle errors independently
      const hasPasswordUpdate = !!updates.newPassword;
      const { newPassword, currentPassword, ...otherUpdates } = updates;
      
      // First update profile and email if needed
      if (otherUpdates.ownerName && otherUpdates.ownerName !== user.displayName) {
        await updateProfile(user, { displayName: otherUpdates.ownerName });
      }
      
      if (otherUpdates.email && otherUpdates.email !== user.email) {
        try {
          await updateEmail(user, otherUpdates.email);
        } catch (error: any) {
          // Handle specific email update errors
          if (error.code === 'auth/requires-recent-login') {
            throw new Error('For security reasons, updating your email requires you to sign in again. Please sign out and sign back in to change your email.');
          } else {
            throw error;
          }
        }
      }
      
      // Update Firestore document with non-password updates
      const userRef = doc(firestore, `users/${user.uid}`);
      const updatedSettings = {
        ...settings,
        ...otherUpdates
      };
      
      await updateDoc(userRef, {
        settings: updatedSettings
      });
      
      // Now try to update password if requested
      if (hasPasswordUpdate && newPassword) {
        try {
          if (!currentPassword) {
            throw new Error('Current password is required to change password.');
          }
          // Reauthenticate user before password update
          const credential = EmailAuthProvider.credential(user.email || '', currentPassword);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);
        } catch (error: any) {
          // Handle specific password update errors
          if (error.code === 'auth/requires-recent-login') {
            // We'll still save other changes but inform the user about the password
            set({ 
              settings: updatedSettings,
              error: 'Your profile was updated, but changing your password requires a recent login. Please sign out and sign back in to change your password.'
            });
            return;
          } else {
            throw error;
          }
        }
      }
      
      // Update local state
      set({ settings: updatedSettings });
      
      return;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  uploadProfilePicture: async (file: File) => {
    const user = useAuthStore.getState().user;
    const { settings } = get();
    
    if (!user || !settings) throw new Error('User not authenticated');
    
    set({ loading: true, error: null });
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update auth profile
      await updateProfile(user, { photoURL: downloadURL });
      
      // Update Firestore
      const userRef = doc(firestore, `users/${user.uid}`);
      await updateDoc(userRef, {
        'settings.profilePicture': downloadURL
      });
      
      // Update local state
      set({ 
        settings: {
          ...settings,
          profilePicture: downloadURL
        }
      });
      
      return downloadURL;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  signOutUser: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ settings: null, role: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));
