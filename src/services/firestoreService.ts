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
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ServiceData {
  name: string;
  category: string;
  price: number;
  description: string;
  userId?: string;
}

export interface Service extends ServiceData {
  id: string;
  createdAt?: Timestamp;
}

export const firestoreService = {
  // ✅ Load services from user's subcollection: users/{userId}/services (for backward compatibility)
  loadServicesSettings: async (userId: string): Promise<Service[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to load services');
      }
      
      const servicesCol = collection(db, 'users', userId, 'services');
      const snapshot = await getDocs(servicesCol);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        userId // Ensure userId is included
      })) as Service[];
    } catch (error) {
      console.error('Error loading services:', error);
      throw error;
    }
  },

  // ✅ Load services from shared collection (for all users to access)
  loadSharedServices: async (): Promise<Service[]> => {
    try {
      const servicesCol = collection(db, 'services');
      const snapshot = await getDocs(servicesCol);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      })) as Service[];
    } catch (error) {
      console.error('Error loading shared services:', error);
      throw error;
    }
  },

  // ✅ Add a new service to user's subcollection (for backward compatibility)
  addService: async (service: ServiceData): Promise<Service> => {
    try {
      if (!service.userId) {
        throw new Error('UserId is required to add service');
      }

      const newService = {
        ...service,
        createdAt: Timestamp.now()
      };
      
      const servicesCol = collection(db, 'users', service.userId, 'services');
      const docRef = await addDoc(servicesCol, newService);
      
      return { id: docRef.id, ...newService };
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  },

  // ✅ Add a new service to shared collection (for all users to access)
  addSharedService: async (service: ServiceData, createdBy: string): Promise<Service> => {
    try {
      const newService = {
        ...service,
        createdAt: Timestamp.now(),
        createdBy
      };
      
      const servicesCol = collection(db, 'services');
      const docRef = await addDoc(servicesCol, newService);
      
      return { id: docRef.id, ...newService };
    } catch (error) {
      console.error('Error adding shared service:', error);
      throw error;
    }
  },

  // ✅ Update an existing service in user's subcollection (for backward compatibility)
  updateService: async (userId: string, serviceId: string, service: Partial<ServiceData>): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to update service');
      }

      const docRef = doc(db, 'users', userId, 'services', serviceId);
      await updateDoc(docRef, { 
        ...service,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  },

  // ✅ Update an existing service in shared collection
  updateSharedService: async (serviceId: string, service: Partial<ServiceData>, updatedBy: string): Promise<void> => {
    try {
      const docRef = doc(db, 'services', serviceId);
      await updateDoc(docRef, { 
        ...service,
        updatedAt: Timestamp.now(),
        updatedBy
      });
    } catch (error) {
      console.error('Error updating shared service:', error);
      throw error;
    }
  },

  // ✅ Delete a service from user's subcollection (for backward compatibility)
  deleteService: async (userId: string, serviceId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to delete service');
      }

      const docRef = doc(db, 'users', userId, 'services', serviceId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  },

  // ✅ Delete a service from shared collection
  deleteSharedService: async (serviceId: string): Promise<void> => {
    try {
      const docRef = doc(db, 'services', serviceId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting shared service:', error);
      throw error;
    }
  },

  // ✅ Add services in bulk to shared collection (for all users to access)
  addFileContent: async (content: Record<string, any>, userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to add services');
      }

      const services = Array.isArray(content) ? content : content.services;
      if (!services || !Array.isArray(services)) {
        throw new Error('Invalid file content format. Expected array of services or object with services property.');
      }

      const promises = services.map(service => 
        firestoreService.addSharedService({
          ...service
        }, userId)
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error adding file content:', error);
      throw error;
    }
  },

  // ✅ Get a single service by ID from user's subcollection
  getService: async (userId: string, serviceId: string): Promise<Service | null> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get service');
      }

      const docRef = doc(db, 'users', userId, 'services', serviceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { 
          id: docSnap.id, 
          ...docSnap.data(),
          userId 
        } as Service;
      }
      return null;
    } catch (error) {
      console.error('Error getting service:', error);
      throw error;
    }
  },

  // ✅ Fetch transactions from shared collection (for reports - all users can see all transactions)
  getTransactions: async (userId: string | null, startDate: Date, endDate: Date): Promise<Record<string, any>[]> => {
    try {
      const transactionsCol = collection(db, 'transactions');
      let q;
      
      if (userId) {
        // Fetch transactions for specific user
        q = query(
          transactionsCol,
          where('userId', '==', userId),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate))
        );
      } else {
        // Fetch all transactions (for reports)
        q = query(
          transactionsCol,
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          where('createdAt', '<=', Timestamp.fromDate(endDate))
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  },

  // ✅ Fetch all transactions from shared collection (for reports)
  getAllTransactions: async (startDate: Date, endDate: Date): Promise<Record<string, any>[]> => {
    try {
      const transactionsCol = collection(db, 'transactions');
      const q = query(
        transactionsCol,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw error;
    }
  },

  // ✅ Fetch clients from shared collection (for reports - all users can see all clients)
  getClients: async (): Promise<Record<string, any>[]> => {
    try {
      const clientsCol = collection(db, 'clients');
      const snapshot = await getDocs(clientsCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting clients:', error);
      throw error;
    }
  },

  // ✅ Fetch clients from user's subcollection (for user-specific operations)
  getUserClients: async (userId: string): Promise<Record<string, any>[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get user clients');
      }

      const clientsCol = collection(db, 'users', userId, 'clients');
      const snapshot = await getDocs(clientsCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user clients:', error);
      throw error;
    }
  },

  // ✅ Add a client to user's subcollection
  addClient: async (clientData: Record<string, any>, userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to add client');
      }

      const clientsCol = collection(db, 'users', userId, 'clients');
      await addDoc(clientsCol, {
        ...clientData,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },

  // ✅ Add a transaction to user's subcollection
  addTransaction: async (transactionData: Record<string, any>, userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to add transaction');
      }

      // Add to user's subcollection
      const userTransactionsCol = collection(db, 'users', userId, 'transactions');
      await addDoc(userTransactionsCol, {
        ...transactionData,
        createdAt: Timestamp.now()
      });

      // Add to shared transactions collection with userId
      const sharedTransactionsCol = collection(db, 'transactions');
      await addDoc(sharedTransactionsCol, {
        ...transactionData,
        userId,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  // ✅ Initialize user document (call this when user first signs up)
  initializeUser: async (userId: string, userData: Record<string, any> = {}): Promise<void> => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  },

  // ✅ Fetch appointments for a user from subcollection
  getAppointments: async (userId: string, startDate: Date, endDate: Date): Promise<Record<string, any>[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get appointments');
      }

      const appointmentsCol = collection(db, 'users', userId, 'appointments');
      const q = query(
        appointmentsCol,
        where('scheduledAt', '>=', Timestamp.fromDate(startDate)),
        where('scheduledAt', '<=', Timestamp.fromDate(endDate))
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting appointments:', error);
      throw error;
    }
  },

  // ✅ Fetch all appointments from shared collection (for reports)
  getAllAppointments: async (startDate: Date, endDate: Date): Promise<Record<string, any>[]> => {
    try {
      const appointmentsCol = collection(db, 'appointments');
      const q = query(
        appointmentsCol,
        where('scheduledAt', '>=', Timestamp.fromDate(startDate)),
        where('scheduledAt', '<=', Timestamp.fromDate(endDate))
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all appointments:', error);
      throw error;
    }
  },

  // ✅ Fetch staff for a user from subcollection
  getStaff: async (userId: string): Promise<Record<string, any>[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get staff');
      }

      const staffCol = collection(db, 'users', userId, 'staff');
      const snapshot = await getDocs(staffCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting staff:', error);
      throw error;
    }
  },

  // ✅ Fetch all staff from shared collection (for reports)
  getAllStaff: async (): Promise<Record<string, any>[]> => {
    try {
      const staffCol = collection(db, 'staff');
      const snapshot = await getDocs(staffCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting all staff:', error);
      throw error;
    }
  },

  // ✅ Get services using the existing loadServicesSettings method with a consistent name
  getServices: async (userId: string): Promise<Service[]> => {
    return firestoreService.loadServicesSettings(userId);
  },

  // ✅ Fetch all services from shared collection (for reports)
  getAllServices: async (): Promise<Service[]> => {
    try {
      const servicesCol = collection(db, 'services');
      const snapshot = await getDocs(servicesCol);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      })) as Service[];
    } catch (error) {
      console.error('Error getting all services:', error);
      throw error;
    }
  },

  // ✅ Add an appointment to user's subcollection
  addAppointment: async (appointmentData: Record<string, any>, userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to add appointment');
      }

      const appointmentsCol = collection(db, 'users', userId, 'appointments');
      await addDoc(appointmentsCol, {
        ...appointmentData,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw error;
    }
  },

  // ✅ Add a staff member to user's subcollection
  addStaff: async (staffData: Record<string, any>, userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to add staff');
      }

      const staffCol = collection(db, 'users', userId, 'staff');
      await addDoc(staffCol, {
        ...staffData,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding staff:', error);
      throw error;
    }
  },

  // ✅ Get business settings for a user
  getBusinessSettings: async (userId: string): Promise<Record<string, any> | null> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get business settings');
      }
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return data?.businessSettings || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting business settings:', error);
      throw error;
    }
  },

  // ✅ Update business settings for a user
  updateBusinessSettings: async (userId: string, settings: Record<string, any>): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to update business settings');
      }
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        businessSettings: settings,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating business settings:', error);
      throw error;
    }
  },

  // ✅ Get transactions for a user within a date range
  getTransactions: async (userId: string, startDate: Date, endDate: Date): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get transactions');
      }

      console.log(`firestoreService.getTransactions: Fetching transactions for user ${userId} from ${startDate} to ${endDate}`);

      // Try both shared transactions and user-specific transactions
      const sharedTransactionsRef = collection(db, 'transactions');
      const userTransactionsRef = collection(db, 'users', userId, 'transactions');

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      // First, let's check if there are any transactions at all
      const allSharedSnapshot = await getDocs(sharedTransactionsRef);
      const allUserSnapshot = await getDocs(userTransactionsRef);
      
      console.log(`Total transactions in shared collection: ${allSharedSnapshot.docs.length}`);
      console.log(`Total transactions in user collection: ${allUserSnapshot.docs.length}`);

      // Query shared transactions
      const sharedQuery = query(
        sharedTransactionsRef,
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );

      // Query user-specific transactions
      const userQuery = query(
        userTransactionsRef,
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );

      const [sharedSnapshot, userSnapshot] = await Promise.all([
        getDocs(sharedQuery),
        getDocs(userQuery)
      ]);

      const transactions = [
        ...sharedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];

      console.log(`Found ${transactions.length} transactions for user ${userId} between ${startDate} and ${endDate}`);
      console.log('Sample transaction data:', transactions.length > 0 ? transactions[0] : 'No transactions found');
      
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  },

  // ✅ Get appointments for a user within a date range
  getAppointments: async (userId: string, startDate: Date, endDate: Date): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get appointments');
      }

      const appointmentsRef = collection(db, 'users', userId, 'appointments');
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      const q = query(
        appointmentsRef,
        where('scheduledAt', '>=', startTimestamp),
        where('scheduledAt', '<=', endTimestamp)
      );

      const snapshot = await getDocs(q);
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`Found ${appointments.length} appointments for user ${userId} between ${startDate} and ${endDate}`);
      return appointments;
    } catch (error) {
      console.error('Error getting appointments:', error);
      throw error;
    }
  },

  // ✅ Get clients for a user
  getUserClients: async (userId: string): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get clients');
      }

      // Try both shared clients and user-specific clients
      const sharedClientsRef = collection(db, 'clients');
      const userClientsRef = collection(db, 'users', userId, 'clients');

      const [sharedSnapshot, userSnapshot] = await Promise.all([
        getDocs(sharedClientsRef),
        getDocs(userClientsRef)
      ]);

      const clients = [
        ...sharedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];

      // Remove duplicates based on id
      const uniqueClients = clients.filter((client, index, self) => 
        index === self.findIndex(c => c.id === client.id)
      );

      console.log(`Found ${uniqueClients.length} clients for user ${userId}`);
      return uniqueClients;
    } catch (error) {
      console.error('Error getting clients:', error);
      throw error;
    }
  },

  // ✅ Get staff for a user
  getStaff: async (userId: string): Promise<any[]> => {
    try {
      if (!userId) {
        throw new Error('UserId is required to get staff');
      }

      const staffRef = collection(db, 'users', userId, 'staff');
      const snapshot = await getDocs(staffRef);
      const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`Found ${staff.length} staff members for user ${userId}`);
      return staff;
    } catch (error) {
      console.error('Error getting staff:', error);
      throw error;
    }
  }
};
