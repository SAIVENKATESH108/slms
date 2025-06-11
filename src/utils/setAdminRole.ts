import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';

// Utility function to set admin role for a user
export const setAdminRole = async (userId: string) => {
  try {
    const userRef = doc(firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        role: 'admin'
      });
      console.log('Admin role set successfully for user:', userId);
    } else {
      await setDoc(userRef, {
        role: 'admin',
        createdAt: new Date()
      });
      console.log('Admin role created successfully for user:', userId);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting admin role:', error);
    return false;
  }
};

// Function to set manager role
export const setManagerRole = async (userId: string) => {
  try {
    const userRef = doc(firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        role: 'manager'
      });
      console.log('Manager role set successfully for user:', userId);
    } else {
      await setDoc(userRef, {
        role: 'manager',
        createdAt: new Date()
      });
      console.log('Manager role created successfully for user:', userId);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting manager role:', error);
    return false;
  }
};

// Function to set employee role
export const setEmployeeRole = async (userId: string) => {
  try {
    const userRef = doc(firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        role: 'employee'
      });
      console.log('Employee role set successfully for user:', userId);
    } else {
      await setDoc(userRef, {
        role: 'employee',
        createdAt: new Date()
      });
      console.log('Employee role created successfully for user:', userId);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting employee role:', error);
    return false;
  }
};

// Function to get user role
export const getUserRole = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(firestore, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().role || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Make functions available in the global scope for testing
(window as any).setAdminRole = setAdminRole;
(window as any).setManagerRole = setManagerRole;
(window as any).setEmployeeRole = setEmployeeRole;
(window as any).getUserRole = getUserRole;