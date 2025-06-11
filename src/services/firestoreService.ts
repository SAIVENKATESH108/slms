import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ServiceData {
  name: string;
  category: string;
  price: number;
  description: string;
  userId?: string;
  duration?: number;
  isActive?: boolean;
}

export interface Service extends ServiceData {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
}

export const firestoreService = {
  // Load services from user's subcollection or shared collection
  loadServicesSettings: async (userId: string): Promise<Service[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to load services');
      }
      
      // First try to get services from shared collection
      const sharedServicesCol = collection(db, 'services');
      const sharedSnapshot = await getDocs(sharedServicesCol);
      
      // Then get user-specific services
      const userServicesCol = collection(db, 'users', userId, 'services');
      const userSnapshot = await getDocs(userServicesCol);
      
      // Combine both sets of services
      const sharedServices = sharedSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isShared: true
      }));
      
      const userServices = userSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        userId,
        isShared: false
      }));
      
      // Combine and return all services
      return [...sharedServices, ...userServices] as Service[];
    } catch (error) {
      console.error('Error loading services:', error);
      throw error;
    }
  },

  // Add a new service to user's subcollection or shared collection
  addService: async (service: ServiceData): Promise<Service> => {
    try {
      const isAdmin = await firestoreService.isUserAdmin(service.userId);
      
      const newService = {
        ...service,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: service.isActive !== false
      };
      
      let docRef;
      
      // If admin, add to shared collection
      if (isAdmin) {
        const servicesCol = collection(db, 'services');
        docRef = await addDoc(servicesCol, newService);
      } else {
        // Otherwise add to user's subcollection
        if (!service.userId) {
          throw new Error('UserId is required to add service');
        }
        const servicesCol = collection(db, 'users', service.userId, 'services');
        docRef = await addDoc(servicesCol, newService);
      }
      
      return { id: docRef.id, ...newService };
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  },

  // Update an existing service
  updateService: async (serviceId: string, updates: Partial<ServiceData>, userId?: string): Promise<void> => {
    try {
      const isAdmin = await firestoreService.isUserAdmin(userId);
      
      // Check if service exists in shared collection first
      const sharedServiceRef = doc(db, 'services', serviceId);
      const sharedServiceDoc = await getDoc(sharedServiceRef);
      
      if (sharedServiceDoc.exists()) {
        // Only admins can update shared services
        if (isAdmin) {
          await updateDoc(sharedServiceRef, { 
            ...updates,
            updatedAt: Timestamp.now()
          });
        } else {
          throw new Error('Only admins can update shared services');
        }
      } else if (userId) {
        // Update in user's subcollection
        const userServiceRef = doc(db, 'users', userId, 'services', serviceId);
        await updateDoc(userServiceRef, { 
          ...updates,
          updatedAt: Timestamp.now()
        });
      } else {
        throw new Error('Service not found or userId not provided');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  // Delete a service
  deleteService: async (serviceId: string, userId?: string): Promise<void> => {
    try {
      const isAdmin = await firestoreService.isUserAdmin(userId);
      
      // Check if service exists in shared collection first
      const sharedServiceRef = doc(db, 'services', serviceId);
      const sharedServiceDoc = await getDoc(sharedServiceRef);
      
      if (sharedServiceDoc.exists()) {
        // Only admins can delete shared services
        if (isAdmin) {
          await deleteDoc(sharedServiceRef);
        } else {
          throw new Error('Only admins can delete shared services');
        }
      } else if (userId) {
        // Delete from user's subcollection
        const userServiceRef = doc(db, 'users', userId, 'services', serviceId);
        await deleteDoc(userServiceRef);
      } else {
        throw new Error('Service not found or userId not provided');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },

  // Check if a user is an admin
  isUserAdmin: async (userId?: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role === 'admin';
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // Get user clients
  getUserClients: async (userId: string): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get user clients');
      }

      const isAdmin = await firestoreService.isUserAdmin(userId);
      let clients = [];
      
      // Get user-specific clients
      const userClientsCol = collection(db, 'users', userId, 'clients');
      const userSnapshot = await getDocs(userClientsCol);
      const userClients = userSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      clients = [...userClients];
      
      // If admin, also get all clients from shared collection
      if (isAdmin) {
        const sharedClientsCol = collection(db, 'clients');
        const sharedSnapshot = await getDocs(sharedClientsCol);
        const sharedClients = sharedSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          isShared: true
        }));
        
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
      console.error('Error getting user clients:', error);
      throw error;
    }
  },

  // Get transactions with proper role-based access
  getTransactions: async (userId: string, startDate: Date, endDate: Date): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get transactions');
      }

      const isAdmin = await firestoreService.isUserAdmin(userId);
      let transactions = [];
      
      // Get user-specific transactions
      const userTransactionsCol = collection(db, 'users', userId, 'transactions');
      const userQuery = query(
        userTransactionsCol,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      const userSnapshot = await getDocs(userQuery);
      const userTransactions = userSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      transactions = [...userTransactions];
      
      // If admin, also get all transactions from shared collection
      if (isAdmin) {
        const sharedTransactionsCol = collection(db, 'transactions');
        const sharedQuery = query(
          sharedTransactionsCol,
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate))
        );
        const sharedSnapshot = await getDocs(sharedQuery);
        const sharedTransactions = sharedSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          isShared: true
        }));
        
        // Merge transactions, avoiding duplicates
        const transactionIds = new Set(transactions.map(t => t.id));
        for (const transaction of sharedTransactions) {
          if (!transactionIds.has(transaction.id)) {
            transactions.push(transaction);
            transactionIds.add(transaction.id);
          }
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  },

  // Get appointments with proper role-based access
  getAppointments: async (userId: string, startDate: Date, endDate: Date): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get appointments');
      }

      const isAdmin = await firestoreService.isUserAdmin(userId);
      let appointments = [];
      
      // Get user-specific appointments
      const userAppointmentsCol = collection(db, 'users', userId, 'appointments');
      const userQuery = query(
        userAppointmentsCol,
        where('scheduledAt', '>=', Timestamp.fromDate(startDate)),
        where('scheduledAt', '<=', Timestamp.fromDate(endDate))
      );
      const userSnapshot = await getDocs(userQuery);
      const userAppointments = userSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      appointments = [...userAppointments];
      
      // If admin, also get all appointments from shared collection
      if (isAdmin) {
        const sharedAppointmentsCol = collection(db, 'appointments');
        const sharedQuery = query(
          sharedAppointmentsCol,
          where('scheduledAt', '>=', Timestamp.fromDate(startDate)),
          where('scheduledAt', '<=', Timestamp.fromDate(endDate))
        );
        const sharedSnapshot = await getDocs(sharedQuery);
        const sharedAppointments = sharedSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          isShared: true
        }));
        
        // Merge appointments, avoiding duplicates
        const appointmentIds = new Set(appointments.map(a => a.id));
        for (const appointment of sharedAppointments) {
          if (!appointmentIds.has(appointment.id)) {
            appointments.push(appointment);
            appointmentIds.add(appointment.id);
          }
        }
      }
      
      return appointments;
    } catch (error) {
      console.error('Error getting appointments:', error);
      throw error;
    }
  },

  // Get staff with proper role-based access
  getStaff: async (userId: string): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get staff');
      }

      const isAdmin = await firestoreService.isUserAdmin(userId);
      let staff = [];
      
      // Get user-specific staff
      const userStaffCol = collection(db, 'users', userId, 'staff');
      const userSnapshot = await getDocs(userStaffCol);
      const userStaff = userSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      staff = [...userStaff];
      
      // If admin, also get all staff from shared collection
      if (isAdmin) {
        const sharedStaffCol = collection(db, 'staff');
        const sharedSnapshot = await getDocs(sharedStaffCol);
        const sharedStaff = sharedSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          isShared: true
        }));
        
        // Merge staff, avoiding duplicates
        const staffIds = new Set(staff.map(s => s.id));
        for (const member of sharedStaff) {
          if (!staffIds.has(member.id)) {
            staff.push(member);
            staffIds.add(member.id);
          }
        }
      }
      
      return staff;
    } catch (error) {
      console.error('Error getting staff:', error);
      throw error;
    }
  },

  // Add a client with proper role-based access
  addClient: async (clientData: any, userId: string): Promise<string> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to add client');
      }

      const isAdmin = await firestoreService.isUserAdmin(userId);
      const newClient = {
        ...clientData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId
      };
      
      let docRef;
      
      // If admin, add to shared collection
      if (isAdmin) {
        const clientsCol = collection(db, 'clients');
        docRef = await addDoc(clientsCol, newClient);
      } else {
        // Otherwise add to user's subcollection
        const clientsCol = collection(db, 'users', userId, 'clients');
        docRef = await addDoc(clientsCol, newClient);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },

  // Add a transaction with proper role-based access
  addTransaction: async (transactionData: any, userId: string): Promise<string> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to add transaction');
      }

      const isAdmin = await firestoreService.isUserAdmin(userId);
      const newTransaction = {
        ...transactionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId
      };
      
      // Always add to user's subcollection
      const userTransactionsCol = collection(db, 'users', userId, 'transactions');
      const userDocRef = await addDoc(userTransactionsCol, newTransaction);
      
      // If admin, also add to shared collection
      if (isAdmin) {
        const sharedTransactionsCol = collection(db, 'transactions');
        await addDoc(sharedTransactionsCol, {
          ...newTransaction,
          originalId: userDocRef.id
        });
      }
      
      return userDocRef.id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  // Get business settings
  getBusinessSettings: async (userId: string): Promise<any | null> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get business settings');
      }
      
      // First try to get shared settings
      const sharedSettingsRef = doc(db, 'settings', 'business');
      const sharedSettingsDoc = await getDoc(sharedSettingsRef);
      
      // Then get user-specific settings
      const userSettingsRef = doc(db, 'users', userId, 'settings', 'business');
      const userSettingsDoc = await getDoc(userSettingsRef);
      
      // Merge settings, with user-specific settings taking precedence
      let settings = {};
      
      if (sharedSettingsDoc.exists()) {
        settings = { ...sharedSettingsDoc.data() };
      }
      
      if (userSettingsDoc.exists()) {
        settings = { ...settings, ...userSettingsDoc.data() };
      }
      
      return Object.keys(settings).length > 0 ? settings : null;
    } catch (error) {
      console.error('Error getting business settings:', error);
      throw error;
    }
  },

  // Update business settings
  updateBusinessSettings: async (userId: string, settings: any): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to update business settings');
      }
      
      const isAdmin = await firestoreService.isUserAdmin(userId);
      
      // If admin, update shared settings
      if (isAdmin) {
        const sharedSettingsRef = doc(db, 'settings', 'business');
        await setDoc(sharedSettingsRef, {
          ...settings,
          updatedAt: Timestamp.now(),
          updatedBy: userId
        }, { merge: true });
      } else {
        // Otherwise update user-specific settings
        const userSettingsRef = doc(db, 'users', userId, 'settings', 'business');
        await setDoc(userSettingsRef, {
          ...settings,
          updatedAt: Timestamp.now()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating business settings:', error);
      throw error;
    }
  }
};