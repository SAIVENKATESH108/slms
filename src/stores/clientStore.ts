// import { create } from 'zustand';
// import { 
//   collection, 
//   query, 
//   where, 
//   getDocs, 
//   doc, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   orderBy 
// } from 'firebase/firestore';
// import { firestore } from '../firebase/config';
// import { useAuthStore } from './authStore';

// export interface Client {
//   id: string;
//   name: string;
//   phone: string;
//   flatNumber: string;
//   trustScore: number;
//   notes: string;
//   tags: string[];
//   createdAt: Date;
// }

// interface Transaction {
//   id: string;
//   clientId: string;
//   service: string;
//   amount: number;
//   isPaid: boolean;
//   paymentDate?: Date;
//   dueDate: Date;
//   createdAt: Date;
// }


// interface ClientState {
//   clients: Client[];
//   transactions: Transaction[];
//   loading: boolean;
//   error: string | null;
  
//   fetchClients: () => Promise<void>;
//   fetchClientsByFlat: (flatNumber: string) => Promise<Client[]>;
//   fetchClientTransactions: (clientId: string) => Promise<Transaction[]>;
//   addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<string>;
//   updateClient: (id: string, data: Partial<Client>) => Promise<void>;
//   deleteClient: (id: string) => Promise<void>;
//   addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string>;
//   updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
// }

// export const useClientStore = create<ClientState>((set, get) => ({
//   clients: [],
//   transactions: [],
//   loading: false,
//   error: null,
  
//   fetchClients: async () => {
//     const user = useAuthStore.getState().user;
//     if (!user) return;
    
//     set({ loading: true, error: null });
//     try {
//       const clientsRef = collection(firestore, `users/${user.uid}/clients`);
//       const q = query(clientsRef, orderBy('createdAt', 'desc'));
//       const snapshot = await getDocs(q);
      
//       const clients = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         createdAt: doc.data().createdAt?.toDate() || new Date()
//       })) as Client[];
      
//       set({ clients, loading: false });
//     } catch (error) {
//       set({ error: (error as Error).message, loading: false });
//     }
//   },
  
//   fetchClientsByFlat: async (flatNumber) => {
//     const user = useAuthStore.getState().user;
//     if (!user) return [];
    
//     try {
//       const clientsRef = collection(firestore, `users/${user.uid}/clients`);
//       const q = query(clientsRef, where('flatNumber', '==', flatNumber));
//       const snapshot = await getDocs(q);
      
//       return snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         createdAt: doc.data().createdAt?.toDate() || new Date()
//       })) as Client[];
//     } catch (error) {
//       set({ error: (error as Error).message });
//       return [];
//     }
//   },
  
//   fetchClientTransactions: async (clientId) => {
//     const user = useAuthStore.getState().user;
//     if (!user) return [];
    
//     try {
//       const transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
//       const q = query(transactionsRef, where('clientId', '==', clientId), orderBy('createdAt', 'desc'));
//       const snapshot = await getDocs(q);
      
//       return snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         dueDate: doc.data().dueDate?.toDate() || new Date(),
//         paymentDate: doc.data().paymentDate?.toDate(),
//         createdAt: doc.data().createdAt?.toDate() || new Date()
//       })) as Transaction[];
//     } catch (error) {
//       set({ error: (error as Error).message });
//       return [];
//     }
//   },
  
//   addClient: async (client) => {
//     const user = useAuthStore.getState().user;
//     if (!user) throw new Error('User not authenticated');
    
//     try {
//       const clientsRef = collection(firestore, `users/${user.uid}/clients`);
//       const newClient = {
//         ...client,
//         trustScore: 100, // Default trust score for new clients
//         createdAt: new Date()
//       };
      
//       const docRef = await addDoc(clientsRef, newClient);
      
//       // Update local state
//       const { clients } = get();
//       set({ 
//         clients: [{ id: docRef.id, ...newClient } as Client, ...clients] 
//       });
      
//       return docRef.id;
//     } catch (error) {
//       set({ error: (error as Error).message });
//       throw error;
//     }
//   },
  
//   updateClient: async (id, data) => {
//     const user = useAuthStore.getState().user;
//     if (!user) throw new Error('User not authenticated');
    
//     try {
//       const clientRef = doc(firestore, `users/${user.uid}/clients/${id}`);
//       await updateDoc(clientRef, data);
      
//       // Update local state
//       const { clients } = get();
//       set({
//         clients: clients.map(client => 
//           client.id === id ? { ...client, ...data } : client
//         )
//       });
//     } catch (error) {
//       set({ error: (error as Error).message });
//       throw error;
//     }
//   },
  
//   deleteClient: async (id) => {
//     const user = useAuthStore.getState().user;
//     if (!user) throw new Error('User not authenticated');
    
//     try {
//       const clientRef = doc(firestore, `users/${user.uid}/clients/${id}`);
//       await deleteDoc(clientRef);
      
//       // Update local state
//       const { clients } = get();
//       set({
//         clients: clients.filter(client => client.id !== id)
//       });
//     } catch (error) {
//       set({ error: (error as Error).message });
//       throw error;
//     }
//   },
  
//   addTransaction: async (transaction) => {
//     const user = useAuthStore.getState().user;
//     if (!user) throw new Error('User not authenticated');
    
//     try {
//       const transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
//       const newTransaction = {
//         ...transaction,
//         createdAt: new Date()
//       };
      
//       const docRef = await addDoc(transactionsRef, newTransaction);
      
//       // Update local state
//       const { transactions } = get();
//       set({ 
//         transactions: [{ id: docRef.id, ...newTransaction } as Transaction, ...transactions] 
//       });
      
//       return docRef.id;
//     } catch (error) {
//       set({ error: (error as Error).message });
//       throw error;
//     }
//   },
  
//   updateTransaction: async (id, data) => {
//     const user = useAuthStore.getState().user;
//     if (!user) throw new Error('User not authenticated');
    
//     try {
//       const transactionRef = doc(firestore, `users/${user.uid}/transactions/${id}`);
//       await updateDoc(transactionRef, data);
      
//       // Update local state
//       const { transactions } = get();
//       set({
//         transactions: transactions.map(transaction => 
//           transaction.id === id ? { ...transaction, ...data } : transaction
//         )
//       });
//     } catch (error) {
//       set({ error: (error as Error).message });
//       throw error;
//     }
//   }
// }));
import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { useAuthStore } from './authStore';
import { authService } from '../services/AuthService';
import { Client, Transaction as ClientTransaction } from '../types/ClientManagement';

// Using Transaction from types, but keeping legacy interface for backward compatibility
interface LegacyTransaction {
  id: string;
  clientId: string;
  service: string;
  amount: number;
  isPaid: boolean;
  paymentDate?: Date;
  dueDate: Date;
  createdAt: Date;
}

interface ClientState {
  clients: Client[];
  transactions: LegacyTransaction[];
  loading: boolean;
  error: string | null;
  
  fetchClients: () => Promise<void>;
  fetchClientsByFlat: (flatNumber: string) => Promise<Client[]>;
  fetchClientTransactions: (clientId: string) => Promise<LegacyTransaction[]>;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<LegacyTransaction, 'id' | 'createdAt'>) => Promise<string>;
  updateTransaction: (id: string, data: Partial<LegacyTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getAllTransactions: () => Promise<LegacyTransaction[]>;
  migrateDateFields: () => Promise<void>; // New migration function
}

// Helper function to safely convert Firestore data to Date
const safeToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate(); // Firestore Timestamp
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp); // String fallback
};

// Helper function to convert Date to Firestore Timestamp
const toFirestoreTimestamp = (date: Date | string): Timestamp => {
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  return Timestamp.fromDate(new Date(date));
};

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  transactions: [],
  loading: false,
  error: null,
  
  fetchClients: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    set({ loading: true, error: null });
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let clientsRef;
      let q;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Access shared clients collection
        clientsRef = collection(firestore, 'clients');
        q = query(clientsRef, orderBy('createdAt', 'desc'));
      } else {
        // Employee: Access only their own clients
        clientsRef = collection(firestore, `users/${user.uid}/clients`);
        q = query(clientsRef, orderBy('createdAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      
      const clients = snapshot.docs.map(doc => {
        const data = doc.data();
        // Return only limited fields for public access (if needed, here we assume no public access)
        return {
          id: doc.id,
          name: data.name,
          flatNumber: data.flatNumber,
          apartment: data.apartment,
          phone: data.phone,
          createdAt: safeToDate(data.createdAt)
        };
      }) as Client[];
      
      set({ clients, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  fetchClientsByFlat: async (flatNumber) => {
    const user = useAuthStore.getState().user;
    if (!user) return [];
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let clientsRef;
      let q;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Access shared clients collection
        clientsRef = collection(firestore, 'clients');
        q = query(clientsRef, where('flatNumber', '==', flatNumber));
      } else {
        // Employee: Access only their own clients
        clientsRef = collection(firestore, `users/${user.uid}/clients`);
        q = query(clientsRef, where('flatNumber', '==', flatNumber));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: safeToDate(doc.data().createdAt)
      })) as Client[];
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },
  
  fetchClientTransactions: async (clientId) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      return [];
    }
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let transactionsRef;
      let q;
      const hasSharedAccess = canAccessSharedData();
      
      if (hasSharedAccess) {
        // Admin and Manager: Access shared transactions collection
        transactionsRef = collection(firestore, 'transactions');
        q = query(transactionsRef, where('clientId', '==', clientId));
      } else {
        // Employee: Access only their own transactions
        transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
        q = query(transactionsRef, where('clientId', '==', clientId));
      }
      
      const snapshot = await getDocs(q);
      

      
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: safeToDate(data.dueDate),
          paymentDate: data.paymentDate ? safeToDate(data.paymentDate) : undefined,
          createdAt: safeToDate(data.createdAt)
        };
      }) as Transaction[];
      
      // Sort in memory instead of in the query
      transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // Update local state with fetched transactions
      set({ transactions });
      
      return transactions;
    } catch (error) {
      set({ error: (error as Error).message });
      return [];
    }
  },
  
  addClient: async (client) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let clientsRef;
      let newClient;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Save to shared clients collection
        clientsRef = collection(firestore, 'clients');
        newClient = {
          ...client,
          trustScore: client.trustScore || 100,
          createdAt: Timestamp.now(),
          createdBy: user.uid
        };
      } else {
        // Employee: Save to their own clients subcollection
        clientsRef = collection(firestore, `users/${user.uid}/clients`);
        newClient = {
          ...client,
          trustScore: client.trustScore || 100,
          createdAt: Timestamp.now()
        };
      }
      
      const docRef = await addDoc(clientsRef, newClient);
      
      // Update local state
      const { clients } = get();
      set({ 
        clients: [{ 
          id: docRef.id, 
          ...client,
          trustScore: client.trustScore || 100,
          createdAt: new Date(),
          createdBy: canAccessSharedData() ? user.uid : undefined
        } as Client, ...clients] 
      });
      
      return docRef.id;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
  
  updateClient: async (id, data) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let clientRef;
      let updateData;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Update in shared clients collection
        clientRef = doc(firestore, 'clients', id);
        updateData = { 
          ...data,
          updatedBy: user.uid,
          updatedAt: Timestamp.now()
        };
      } else {
        // Employee: Update in their own clients subcollection
        clientRef = doc(firestore, `users/${user.uid}/clients`, id);
        updateData = { ...data };
      }
      
      if (updateData.createdAt instanceof Date) {
        updateData.createdAt = Timestamp.fromDate(updateData.createdAt);
      }
      
      await updateDoc(clientRef, updateData);
      
      // Update local state
      const { clients } = get();
      set({
        clients: clients.map(client => 
          client.id === id ? { ...client, ...data } : client
        )
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let clientRef;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Delete from shared clients collection
        clientRef = doc(firestore, 'clients', id);
      } else {
        // Employee: Delete from their own clients subcollection
        clientRef = doc(firestore, `users/${user.uid}/clients`, id);
      }
      
      await deleteDoc(clientRef);
      
      // Update local state
      const { clients } = get();
      set({
        clients: clients.filter(client => client.id !== id)
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },
  
  addTransaction: async (transaction) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let transactionsRef;
      let newTransaction;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Save to shared transactions collection
        transactionsRef = collection(firestore, 'transactions');
        newTransaction = {
          ...transaction,
          dueDate: toFirestoreTimestamp(transaction.dueDate),
          paymentDate: transaction.paymentDate ? toFirestoreTimestamp(transaction.paymentDate) : null,
          createdAt: Timestamp.now(),
          createdBy: user.uid
        };
      } else {
        // Employee: Save to their own transactions subcollection
        transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
        newTransaction = {
          ...transaction,
          dueDate: toFirestoreTimestamp(transaction.dueDate),
          paymentDate: transaction.paymentDate ? toFirestoreTimestamp(transaction.paymentDate) : null,
          createdAt: Timestamp.now()
        };
      }
      
      const docRef = await addDoc(transactionsRef, newTransaction);
      
      // Update local state with Date objects
      const { transactions } = get();
      set({ 
        transactions: [{ 
          id: docRef.id, 
          ...transaction,
          createdAt: new Date(),
          createdBy: canAccessSharedData() ? user.uid : undefined
        } as Transaction, ...transactions] 
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
  
  updateTransaction: async (id, data) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let transactionRef;
      let updateData;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Update in shared transactions collection
        transactionRef = doc(firestore, 'transactions', id);
        updateData = { 
          ...data,
          updatedBy: user.uid,
          updatedAt: Timestamp.now()
        };
      } else {
        // Employee: Update in their own transactions subcollection
        transactionRef = doc(firestore, `users/${user.uid}/transactions`, id);
        updateData = { ...data };
      }
      
      if (updateData.dueDate instanceof Date) {
        updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
      }
      if (updateData.paymentDate instanceof Date) {
        updateData.paymentDate = Timestamp.fromDate(updateData.paymentDate);
      }
      if (updateData.createdAt instanceof Date) {
        updateData.createdAt = Timestamp.fromDate(updateData.createdAt);
      }
      
      await updateDoc(transactionRef, updateData);
      
      // Update local state
      const { transactions } = get();
      set({
        transactions: transactions.map(transaction => 
          transaction.id === id ? { ...transaction, ...data } : transaction
        )
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let transactionRef;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Delete from shared transactions collection
        transactionRef = doc(firestore, 'transactions', id);
      } else {
        // Employee: Delete from their own transactions subcollection
        transactionRef = doc(firestore, `users/${user.uid}/transactions`, id);
      }
      
      await deleteDoc(transactionRef);
      
      // Update local state
      const { transactions } = get();
      set({
        transactions: transactions.filter(transaction => transaction.id !== id)
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getAllTransactions: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return [];
    
    try {
      // Helper function to check if user can access shared data
      const canAccessSharedData = () => {
        const currentUser = authService.getCurrentUser();
        const role = currentUser?.customClaims?.role;
        return role === 'admin' || role === 'manager';
      };

      let transactionsRef;
      let q;
      
      if (canAccessSharedData()) {
        // Admin and Manager: Access shared transactions collection
        transactionsRef = collection(firestore, 'transactions');
        q = query(transactionsRef, orderBy('createdAt', 'desc'));
      } else {
        // Employee: Access only their own transactions
        transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
        q = query(transactionsRef, orderBy('createdAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: safeToDate(data.dueDate),
          paymentDate: data.paymentDate ? safeToDate(data.paymentDate) : undefined,
          createdAt: safeToDate(data.createdAt)
        };
      }) as LegacyTransaction[];
      
      // Update local state with fetched transactions
      set({ transactions });
      
      return transactions;
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      set({ error: (error as Error).message });
      return [];
    }
  },

  // Migration function to fix existing string dates
  migrateDateFields: async () => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');
    
    set({ loading: true, error: null });
    
    try {
      const batch = writeBatch(firestore);
      
      // Migrate transactions
      const transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
      const transactionsSnapshot = await getDocs(transactionsRef);
      
      let updateCount = 0;
      
      transactionsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const updates: any = {};
        
        // Check and convert dueDate
        if (data.dueDate && typeof data.dueDate === 'string') {
          updates.dueDate = Timestamp.fromDate(new Date(data.dueDate));
        }
        
        // Check and convert paymentDate
        if (data.paymentDate && typeof data.paymentDate === 'string') {
          updates.paymentDate = Timestamp.fromDate(new Date(data.paymentDate));
        }
        
        // Check and convert createdAt
        if (data.createdAt && typeof data.createdAt === 'string') {
          updates.createdAt = Timestamp.fromDate(new Date(data.createdAt));
        }
        
        if (Object.keys(updates).length > 0) {
          batch.update(docSnapshot.ref, updates);
          updateCount++;
        }
      });
      
      // Migrate clients
      const clientsRef = collection(firestore, `users/${user.uid}/clients`);
      const clientsSnapshot = await getDocs(clientsRef);
      
      clientsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const updates: any = {};
        
        // Check and convert createdAt
        if (data.createdAt && typeof data.createdAt === 'string') {
          updates.createdAt = Timestamp.fromDate(new Date(data.createdAt));
          updateCount++;
        }
        
        if (Object.keys(updates).length > 0) {
          batch.update(docSnapshot.ref, updates);
        }
      });
      
      if (updateCount > 0) {
        await batch.commit();
        console.log(`Successfully migrated ${updateCount} date fields`);
      } else {
        console.log('No date fields needed migration');
      }
      
      set({ loading: false });
      
    } catch (error) {
      console.error('Migration error:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  }
}));