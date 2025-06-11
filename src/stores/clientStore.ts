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
  migrateDateFields: () => Promise<void>; // Migration function
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

      // Get user-specific clients
      const userClientsCol = collection(firestore, `users/${user.uid}/clients`);
      const userQuery = query(userClientsCol, orderBy('createdAt', 'desc'));
      const userSnapshot = await getDocs(userQuery);
      
      let clients = userSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email || '',
          phone: data.phone,
          apartment: data.apartment || '',
          flatNumber: data.flatNumber,
          trustScore: data.trustScore || 100,
          notes: data.notes || '',
          tags: data.tags || [],
          status: data.status || 'active',
          preferredContactMethod: data.preferredContactMethod || 'phone',
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt || data.createdAt)
        };
      }) as Client[];
      
      // If admin or manager, also get shared clients
      if (canAccessSharedData()) {
        const sharedClientsCol = collection(firestore, 'clients');
        const sharedQuery = query(sharedClientsCol, orderBy('createdAt', 'desc'));
        const sharedSnapshot = await getDocs(sharedQuery);
        
        const sharedClients = sharedSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email || '',
            phone: data.phone,
            apartment: data.apartment || '',
            flatNumber: data.flatNumber,
            trustScore: data.trustScore || 100,
            notes: data.notes || '',
            tags: data.tags || [],
            status: data.status || 'active',
            preferredContactMethod: data.preferredContactMethod || 'phone',
            createdAt: safeToDate(data.createdAt),
            updatedAt: safeToDate(data.updatedAt || data.createdAt),
            isShared: true
          };
        }) as Client[];
        
        // Merge clients, avoiding duplicates
        const clientIds = new Set(clients.map(c => c.id));
        for (const client of sharedClients) {
          if (!clientIds.has(client.id)) {
            clients.push(client);
            clientIds.add(client.id);
          }
        }
      }
      
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

      // Get user-specific clients for this flat
      const userClientsCol = collection(firestore, `users/${user.uid}/clients`);
      const userQuery = query(userClientsCol, where('flatNumber', '==', flatNumber));
      const userSnapshot = await getDocs(userQuery);
      
      let clients = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: safeToDate(doc.data().createdAt)
      })) as Client[];
      
      // If admin or manager, also get shared clients for this flat
      if (canAccessSharedData()) {
        const sharedClientsCol = collection(firestore, 'clients');
        const sharedQuery = query(sharedClientsCol, where('flatNumber', '==', flatNumber));
        const sharedSnapshot = await getDocs(sharedQuery);
        
        const sharedClients = sharedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: safeToDate(doc.data().createdAt),
          isShared: true
        })) as Client[];
        
        // Merge clients, avoiding duplicates
        const clientIds = new Set(clients.map(c => c.id));
        for (const client of sharedClients) {
          if (!clientIds.has(client.id)) {
            clients.push(client);
            clientIds.add(client.id);
          }
        }
      }
      
      return clients;
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

      // Get user-specific transactions for this client
      const userTransactionsCol = collection(firestore, `users/${user.uid}/transactions`);
      const userQuery = query(userTransactionsCol, where('clientId', '==', clientId));
      const userSnapshot = await getDocs(userQuery);
      
      let transactions = userSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: safeToDate(data.dueDate),
          paymentDate: data.paymentDate ? safeToDate(data.paymentDate) : undefined,
          createdAt: safeToDate(data.createdAt)
        };
      }) as LegacyTransaction[];
      
      // If admin or manager, also get shared transactions for this client
      if (canAccessSharedData()) {
        const sharedTransactionsCol = collection(firestore, 'transactions');
        const sharedQuery = query(sharedTransactionsCol, where('clientId', '==', clientId));
        const sharedSnapshot = await getDocs(sharedQuery);
        
        const sharedTransactions = sharedSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dueDate: safeToDate(data.dueDate),
            paymentDate: data.paymentDate ? safeToDate(data.paymentDate) : undefined,
            createdAt: safeToDate(data.createdAt),
            isShared: true
          };
        }) as LegacyTransaction[];
        
        // Merge transactions, avoiding duplicates
        const transactionIds = new Set(transactions.map(t => t.id));
        for (const transaction of sharedTransactions) {
          if (!transactionIds.has(transaction.id)) {
            transactions.push(transaction);
            transactionIds.add(transaction.id);
          }
        }
      }
      
      // Sort in memory
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
      // Helper function to check if user is admin
      const isAdmin = async () => {
        const currentUser = authService.getCurrentUser();
        return currentUser?.customClaims?.role === 'admin';
      };

      const newClient = {
        ...client,
        trustScore: client.trustScore || 100,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      let docRef;
      
      // If admin, add to shared collection
      if (await isAdmin()) {
        const clientsCol = collection(firestore, 'clients');
        docRef = await addDoc(clientsCol, {
          ...newClient,
          createdBy: user.uid
        });
      } else {
        // Otherwise add to user's subcollection
        const clientsCol = collection(firestore, `users/${user.uid}/clients`);
        docRef = await addDoc(clientsCol, newClient);
      }
      
      // Update local state
      const { clients } = get();
      set({ 
        clients: [{ 
          id: docRef.id, 
          ...client,
          trustScore: client.trustScore || 100,
          createdAt: new Date(),
          updatedAt: new Date()
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
      // Helper function to check if user is admin
      const isAdmin = async () => {
        const currentUser = authService.getCurrentUser();
        return currentUser?.customClaims?.role === 'admin';
      };

      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };
      
      // Check if client exists in shared collection
      const sharedClientRef = doc(firestore, 'clients', id);
      const sharedClientDoc = await getDoc(sharedClientRef);
      
      if (sharedClientDoc.exists()) {
        // Only admins can update shared clients
        if (await isAdmin()) {
          await updateDoc(sharedClientRef, updateData);
        } else {
          throw new Error('Only admins can update shared clients');
        }
      } else {
        // Update in user's subcollection
        const clientRef = doc(firestore, `users/${user.uid}/clients`, id);
        await updateDoc(clientRef, updateData);
      }
      
      // Update local state
      const { clients } = get();
      set({
        clients: clients.map(client => 
          client.id === id ? { ...client, ...data, updatedAt: new Date() } : client
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
      // Helper function to check if user is admin
      const isAdmin = async () => {
        const currentUser = authService.getCurrentUser();
        return currentUser?.customClaims?.role === 'admin';
      };

      // Check if client exists in shared collection
      const sharedClientRef = doc(firestore, 'clients', id);
      const sharedClientDoc = await getDoc(sharedClientRef);
      
      if (sharedClientDoc.exists()) {
        // Only admins can delete shared clients
        if (await isAdmin()) {
          await deleteDoc(sharedClientRef);
        } else {
          throw new Error('Only admins can delete shared clients');
        }
      } else {
        // Delete from user's subcollection
        const clientRef = doc(firestore, `users/${user.uid}/clients`, id);
        await deleteDoc(clientRef);
      }
      
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
      // Helper function to check if user is admin
      const isAdmin = async () => {
        const currentUser = authService.getCurrentUser();
        return currentUser?.customClaims?.role === 'admin';
      };

      const newTransaction = {
        ...transaction,
        dueDate: toFirestoreTimestamp(transaction.dueDate),
        paymentDate: transaction.paymentDate ? toFirestoreTimestamp(transaction.paymentDate) : null,
        createdAt: Timestamp.now()
      };
      
      // Always add to user's subcollection
      const userTransactionsCol = collection(firestore, `users/${user.uid}/transactions`);
      const userDocRef = await addDoc(userTransactionsCol, newTransaction);
      
      // If admin, also add to shared collection
      if (await isAdmin()) {
        const sharedTransactionsCol = collection(firestore, 'transactions');
        await addDoc(sharedTransactionsCol, {
          ...newTransaction,
          createdBy: user.uid,
          originalId: userDocRef.id
        });
      }
      
      // Update local state
      const { transactions } = get();
      set({ 
        transactions: [{ 
          id: userDocRef.id, 
          ...transaction,
          createdAt: new Date()
        } as LegacyTransaction, ...transactions] 
      });
      
      return userDocRef.id;
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
      // Helper function to check if user is admin
      const isAdmin = async () => {
        const currentUser = authService.getCurrentUser();
        return currentUser?.customClaims?.role === 'admin';
      };

      const updateData = { ...data };
      
      // Convert dates to Firestore Timestamps
      if (updateData.dueDate instanceof Date) {
        updateData.dueDate = Timestamp.fromDate(updateData.dueDate);
      }
      if (updateData.paymentDate instanceof Date) {
        updateData.paymentDate = Timestamp.fromDate(updateData.paymentDate);
      }
      
      updateData.updatedAt = Timestamp.now();
      
      // Check if transaction exists in shared collection
      const sharedTransactionRef = doc(firestore, 'transactions', id);
      const sharedTransactionDoc = await getDoc(sharedTransactionRef);
      
      // Update in user's subcollection
      const userTransactionRef = doc(firestore, `users/${user.uid}/transactions`, id);
      await updateDoc(userTransactionRef, updateData);
      
      // If admin and transaction exists in shared collection, update it there too
      if (sharedTransactionDoc.exists() && await isAdmin()) {
        await updateDoc(sharedTransactionRef, updateData);
      }
      
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
      // Helper function to check if user is admin
      const isAdmin = async () => {
        const currentUser = authService.getCurrentUser();
        return currentUser?.customClaims?.role === 'admin';
      };

      // Check if transaction exists in shared collection
      const sharedTransactionRef = doc(firestore, 'transactions', id);
      const sharedTransactionDoc = await getDoc(sharedTransactionRef);
      
      // Delete from user's subcollection
      const userTransactionRef = doc(firestore, `users/${user.uid}/transactions`, id);
      await deleteDoc(userTransactionRef);
      
      // If admin and transaction exists in shared collection, delete it there too
      if (sharedTransactionDoc.exists() && await isAdmin()) {
        await deleteDoc(sharedTransactionRef);
      }
      
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

      // Get user-specific transactions
      const userTransactionsCol = collection(firestore, `users/${user.uid}/transactions`);
      const userQuery = query(userTransactionsCol, orderBy('createdAt', 'desc'));
      const userSnapshot = await getDocs(userQuery);
      
      let transactions = userSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: safeToDate(data.dueDate),
          paymentDate: data.paymentDate ? safeToDate(data.paymentDate) : undefined,
          createdAt: safeToDate(data.createdAt)
        };
      }) as LegacyTransaction[];
      
      // If admin or manager, also get shared transactions
      if (canAccessSharedData()) {
        const sharedTransactionsCol = collection(firestore, 'transactions');
        const sharedQuery = query(sharedTransactionsCol, orderBy('createdAt', 'desc'));
        const sharedSnapshot = await getDocs(sharedQuery);
        
        const sharedTransactions = sharedSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dueDate: safeToDate(data.dueDate),
            paymentDate: data.paymentDate ? safeToDate(data.paymentDate) : undefined,
            createdAt: safeToDate(data.createdAt),
            isShared: true
          };
        }) as LegacyTransaction[];
        
        // Merge transactions, avoiding duplicates
        const transactionIds = new Set(transactions.map(t => t.id));
        for (const transaction of sharedTransactions) {
          if (!transactionIds.has(transaction.id)) {
            transactions.push(transaction);
            transactionIds.add(transaction.id);
          }
        }
      }
      
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