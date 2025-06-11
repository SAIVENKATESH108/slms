import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';

// Utility function to set admin role for a user
export const setAdminRole = async (userId: string) => {
  try {
    const userRef = doc(firestore, `users/${userId}`);
    
    await updateDoc(userRef, {
      role: 'admin'
    });
    
    console.log('Admin role set successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('Error setting admin role:', error);
    
    // If document doesn't exist, create it
    try {
      await setDoc(userRef, {
        role: 'admin',
        createdAt: new Date()
      }, { merge: true });
      
      console.log('Admin role created successfully for user:', userId);
      return true;
    } catch (createError) {
      console.error('Error creating admin role:', createError);
      return false;
    }
  }
};

// Function to call from browser console for testing
(window as any).setAdminRole = setAdminRole;