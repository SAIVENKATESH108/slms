import { authService } from './AuthService';
import { useUserStore } from '../stores/userStore';
import { firestoreService, Service as FirestoreService, ServiceData } from './firestoreService';

export interface Service extends FirestoreService {}

export interface ServiceSettings {
  id?: string;
  defaultDuration: number;
  defaultCategory: string;
  autoApproval: boolean;
  allowBulkUpload: boolean;
  maxBulkUploadSize: number;
  categories: string[];
  priceRanges: {
    min: number;
    max: number;
  };
  businessHours: {
    start: string;
    end: string;
    days: string[];
  };
  notifications: {
    newService: boolean;
    serviceUpdated: boolean;
    serviceDeleted: boolean;
  };
  permissions: {
    viewServices: string[];
    editServices: string[];
    deleteServices: string[];
    bulkUpload: string[];
  };
}

class ServiceManagementService {
  // Check user permissions
  private hasPermission(action: 'view' | 'edit' | 'delete' | 'bulkUpload', settings?: ServiceSettings): boolean {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      console.log('hasPermission: No current user');
      return false;
    }

    // Try to get role from custom claims first
    let role = currentUser.customClaims?.role;
    console.log('hasPermission: role from customClaims:', role);

    // If no role in custom claims, get role from userStore
    if (!role) {
      role = useUserStore.getState().role || 'user';
      console.log('hasPermission: role from userStore:', role);
    }

    // If still no role, assume 'user'
    if (!role) {
      role = 'user';
      console.log('hasPermission: defaulting role to user');
    }

    // For now, allow basic operations to test the functionality
    if (role === 'user') {
      console.log(`hasPermission: role is 'user', action: ${action}, allowing all operations for testing`);
      switch (action) {
        case 'view':
          return true; // Allow all users to view services
        case 'edit':
        case 'delete':
        case 'bulkUpload':
          return true; // Temporarily allow all operations for testing
        default:
          return false;
      }
    }

    if (!settings) {
      // Default permissions if settings not loaded
      console.log('hasPermission: no settings loaded, using default permissions');
      switch (action) {
        case 'view':
          return ['admin', 'manager', 'employee'].includes(role);
        case 'edit':
          return ['admin', 'manager'].includes(role);
        case 'delete':
          return role === 'admin';
        case 'bulkUpload':
          return ['admin', 'manager'].includes(role);
        default:
          return false;
      }
    }

    const permissionKey = `${action}Services` as keyof ServiceSettings['permissions'];
    const hasPerm = settings.permissions[permissionKey]?.includes(role) || false;
    console.log(`hasPermission: checking permission for action ${action}, role ${role}: ${hasPerm}`);
    return hasPerm;
  }

  async getAllServices(): Promise<Service[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    return firestoreService.loadServicesSettings(currentUser.uid);
  }

  async getActiveServices(): Promise<Service[]> {
    const allServices = await this.getAllServices();
    return allServices.filter(service => service.isActive);
  }

  async addService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('edit', settings)) throw new Error('Permission denied: Cannot add services');

    const newService = await firestoreService.addService({
      ...serviceData,
      userId: currentUser.uid
    });

    return newService.id;
  }

  async updateService(serviceId: string, serviceData: Partial<Omit<Service, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('edit', settings)) throw new Error('Permission denied: Cannot update services');

    await firestoreService.updateService(currentUser.uid, serviceId, serviceData);
  }

  async deleteService(serviceId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('delete', settings)) throw new Error('Permission denied: Cannot delete services');

    await firestoreService.deleteService(currentUser.uid, serviceId);
  }

  async bulkUploadServices(servicesData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[]): Promise<string[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('bulkUpload', settings)) throw new Error('Permission denied: Cannot bulk upload services');

    if (!settings.allowBulkUpload) throw new Error('Bulk upload is disabled');

    if (servicesData.length > settings.maxBulkUploadSize) throw new Error(`Bulk upload size exceeds limit of ${settings.maxBulkUploadSize}`);

    return Promise.all(servicesData.map(service => firestoreService.addService({
      ...service,
      userId: currentUser.uid
    }))).then(results => results.map(r => r.id));
  }

  async getSettings(): Promise<ServiceSettings> {
    // Return default settings for simplicity
    return {
      defaultDuration: 30,
      defaultCategory: 'General',
      autoApproval: false,
      allowBulkUpload: true,
      maxBulkUploadSize: 100,
      categories: ['General', 'Hair Care', 'Skin Care', 'Nail Care', 'Massage', 'Makeup'],
      priceRanges: {
        min: 0,
        max: 10000
      },
      businessHours: {
        start: '09:00',
        end: '18:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      notifications: {
        newService: true,
        serviceUpdated: true,
        serviceDeleted: false
      },
      permissions: {
        viewServices: ['admin', 'manager', 'employee'],
        editServices: ['admin', 'manager'],
        deleteServices: ['admin'],
        bulkUpload: ['admin', 'manager']
      }
    };
  }
}

export const serviceManagementService = new ServiceManagementService();

  private getUserServicesCollectionRef(userId: string) {
    return collection(firestore, this.SETTINGS_COLLECTION, userId, this.SERVICES_SUBCOLLECTION);
  }

  async getAllServices(): Promise<Service[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const servicesRef = this.getUserServicesCollectionRef(currentUser.uid);
    const servicesQuery = query(servicesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(servicesQuery);

    const services: Service[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      services.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        duration: data.duration || 0,
        category: data.category || 'General',
        isActive: data.isActive !== false,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
        createdBy: data.createdBy || ''
      });
    });

    return services;
  }

  async getActiveServices(): Promise<Service[]> {
    const allServices = await this.getAllServices();
    return allServices.filter(service => service.isActive);
  }

  async addService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('edit', settings)) throw new Error('Permission denied: Cannot add services');

    const servicesRef = this.getUserServicesCollectionRef(currentUser.uid);
    const docRef = await addDoc(servicesRef, {
      ...serviceData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: currentUser.uid
    });

    return docRef.id;
  }

  async updateService(serviceId: string, serviceData: Partial<Omit<Service, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('edit', settings)) throw new Error('Permission denied: Cannot update services');

    const serviceRef = doc(firestore, this.SETTINGS_COLLECTION, currentUser.uid, this.SERVICES_SUBCOLLECTION, serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: Timestamp.now()
    });
  }

  async deleteService(serviceId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('delete', settings)) throw new Error('Permission denied: Cannot delete services');

    const serviceRef = doc(firestore, this.SETTINGS_COLLECTION, currentUser.uid, this.SERVICES_SUBCOLLECTION, serviceId);
    await deleteDoc(serviceRef);
  }

  async bulkUploadServices(servicesData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[]): Promise<string[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('bulkUpload', settings)) throw new Error('Permission denied: Cannot bulk upload services');

    if (!settings.allowBulkUpload) throw new Error('Bulk upload is disabled');

    if (servicesData.length > settings.maxBulkUploadSize) throw new Error(`Bulk upload size exceeds limit of ${settings.maxBulkUploadSize}`);

    const servicesRef = this.getUserServicesCollectionRef(currentUser.uid);
    const addedIds: string[] = [];

    for (const serviceData of servicesData) {
      const docRef = await addDoc(servicesRef, {
        ...serviceData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: currentUser.uid
      });
      addedIds.push(docRef.id);
    }

    return addedIds;
  }

  async getSettings(): Promise<ServiceSettings> {
    // Return default settings for simplicity
    return {
      defaultDuration: 30,
      defaultCategory: 'General',
      autoApproval: false,
      allowBulkUpload: true,
      maxBulkUploadSize: 100,
      categories: ['General', 'Hair Care', 'Skin Care', 'Nail Care', 'Massage', 'Makeup'],
      priceRanges: {
        min: 0,
        max: 10000
      },
      businessHours: {
        start: '09:00',
        end: '18:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      notifications: {
        newService: true,
        serviceUpdated: true,
        serviceDeleted: false
      },
      permissions: {
        viewServices: ['admin', 'manager', 'employee'],
        editServices: ['admin', 'manager'],
        deleteServices: ['admin'],
        bulkUpload: ['admin', 'manager']
      }
    };
  }
}

export const serviceManagementService = new ServiceManagementService();

export const serviceManagementService = new ServiceManagementService();

  // Get all services from fileContents collection and serviceSettings document
  async getAllServices(): Promise<Service[]> {
    try {
      let services: Service[] = [];
      
      // First, try to get services from fileContents collection
      try {
        const servicesRef = collection(firestore, this.COLLECTION_NAME);
        const servicesQuery = query(servicesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(servicesQuery);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          services.push({
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            price: data.price || 0,
            duration: data.duration || 0,
            category: data.category || 'General',
            isActive: data.isActive !== false,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || Timestamp.now(),
            createdBy: data.createdBy || ''
          });
        });
        
        console.log('Found', services.length, 'services in fileContents collection');
      } catch (fileContentsError) {
        console.warn('Error fetching from fileContents collection:', fileContentsError);
      }
      
      // If no services found in fileContents, try serviceSettings document
      if (services.length === 0) {
        try {
          console.log('No services in fileContents, checking serviceSettings document...');
          const settingsRef = doc(firestore, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID);
          const settingsDoc = await getDoc(settingsRef);
          
          if (settingsDoc.exists()) {
            const settingsData = settingsDoc.data();
            console.log('ServiceSettings document data:', settingsData);
            
            // Check if services are stored in the settings document
            if (settingsData.services && Array.isArray(settingsData.services)) {
              services = settingsData.services.map((serviceData: any, index: number) => ({
                id: serviceData.id || `service_${index}`,
                name: serviceData.name || '',
                description: serviceData.description || '',
                price: serviceData.price || 0,
                duration: serviceData.duration || 30,
                category: serviceData.category || 'General',
                isActive: serviceData.isActive !== false,
                createdAt: serviceData.createdAt || Timestamp.now(),
                updatedAt: serviceData.updatedAt || Timestamp.now(),
                createdBy: serviceData.createdBy || ''
              }));
              console.log('Found', services.length, 'services in serviceSettings document');
            }
          }
        } catch (settingsError) {
          console.warn('Error fetching from serviceSettings document:', settingsError);
        }
      }
      
      return services;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw new Error('Failed to fetch services');
    }
  }

  // Get services by category
  async getServicesByCategory(category: string): Promise<Service[]> {
    try {
      // Get all services first
      const allServices = await this.getAllServices();
      
      // Filter by category
      const categoryServices = allServices.filter(service => service.category === category);
      
      // Sort by creation date (newest first)
      return categoryServices.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    } catch (error) {
      console.error('Error fetching services by category:', error);
      throw new Error('Failed to fetch services by category');
    }
  }

  // Get active services only
  async getActiveServices(): Promise<Service[]> {
    try {
      // Get all services first
      const allServices = await this.getAllServices();
      
      // Filter for active services
      const activeServices = allServices.filter(service => service.isActive);
      
      // Sort by creation date (newest first)
      return activeServices.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    } catch (error) {
      console.error('Error fetching active services:', error);
      throw new Error('Failed to fetch active services');
    }
  }

  // Add new service
  async addService(serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const settings = await this.getSettings();
    if (!this.hasPermission('edit', settings)) {
      throw new Error('Permission denied: Cannot add services');
    }

    try {
      const servicesRef = collection(firestore, this.COLLECTION_NAME);
      const docRef = await addDoc(servicesRef, {
        ...serviceData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: currentUser.uid
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding service:', error);
      throw new Error('Failed to add service');
    }
  }

  // Update service
  async updateService(serviceId: string, serviceData: Partial<Omit<Service, 'id' | 'createdAt' | 'createdBy'>>): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const settings = await this.getSettings();
    if (!this.hasPermission('edit', settings)) {
      throw new Error('Permission denied: Cannot update services');
    }

    try {
      const serviceRef = doc(firestore, this.COLLECTION_NAME, serviceId);
      await updateDoc(serviceRef, {
        ...serviceData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating service:', error);
      throw new Error('Failed to update service');
    }
  }

  // Delete service
  async deleteService(serviceId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const settings = await this.getSettings();
    if (!this.hasPermission('delete', settings)) {
      throw new Error('Permission denied: Cannot delete services');
    }

    try {
      const serviceRef = doc(firestore, this.COLLECTION_NAME, serviceId);
      await deleteDoc(serviceRef);
    } catch (error) {
      console.error('Error deleting service:', error);
      throw new Error('Failed to delete service');
    }
  }

  // Bulk upload services
  async bulkUploadServices(servicesData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[]): Promise<string[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const settings = await this.getSettings();
    if (!this.hasPermission('bulkUpload', settings)) {
      throw new Error('Permission denied: Cannot bulk upload services');
    }

    if (!settings.allowBulkUpload) {
      throw new Error('Bulk upload is disabled');
    }

    if (servicesData.length > settings.maxBulkUploadSize) {
      throw new Error(`Bulk upload size exceeds limit of ${settings.maxBulkUploadSize}`);
    }

    try {
      const servicesRef = collection(firestore, this.COLLECTION_NAME);
      const addedIds: string[] = [];
      
      for (const serviceData of servicesData) {
        const docRef = await addDoc(servicesRef, {
          ...serviceData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: currentUser.uid
        });
        addedIds.push(docRef.id);
      }
      
      return addedIds;
    } catch (error) {
      console.error('Error bulk uploading services:', error);
      throw new Error('Failed to bulk upload services');
    }
  }

  // Get services specifically from serviceSettings document
  async getServicesFromSettings(): Promise<Service[]> {
    try {
      console.log('Fetching services from serviceSettings document...');
      const settingsRef = doc(firestore, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data();
        console.log('ServiceSettings document exists, data:', settingsData);
        
        // Check if services are stored in the settings document
        if (settingsData.services && Array.isArray(settingsData.services)) {
          const services = settingsData.services.map((serviceData: any, index: number) => ({
            id: serviceData.id || `service_${index}`,
            name: serviceData.name || '',
            description: serviceData.description || '',
            price: serviceData.price || 0,
            duration: serviceData.duration || 30,
            category: serviceData.category || 'General',
            isActive: serviceData.isActive !== false,
            createdAt: serviceData.createdAt || Timestamp.now(),
            updatedAt: serviceData.updatedAt || Timestamp.now(),
            createdBy: serviceData.createdBy || ''
          }));
          console.log('Found', services.length, 'services in serviceSettings document');
          return services;
        } else {
          console.log('No services array found in serviceSettings document');
          return [];
        }
      } else {
        console.log('ServiceSettings document does not exist');
        return [];
      }
    } catch (error) {
      console.error('Error fetching services from settings:', error);
      return [];
    }
  }

  // Get service settings
  async getSettings(): Promise<ServiceSettings> {
    try {
      const settingsRef = doc(firestore, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        return { id: settingsDoc.id, ...settingsDoc.data() } as ServiceSettings;
      } else {
        // Return default settings if none exist
        const defaultSettings: ServiceSettings = {
          defaultDuration: 30,
          defaultCategory: 'General',
          autoApproval: false,
          allowBulkUpload: true,
          maxBulkUploadSize: 100,
          categories: ['General', 'Hair Care', 'Skin Care', 'Nail Care', 'Massage', 'Makeup'],
          priceRanges: {
            min: 0,
            max: 10000
          },
          businessHours: {
            start: '09:00',
            end: '18:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          },
          notifications: {
            newService: true,
            serviceUpdated: true,
            serviceDeleted: false
          },
          permissions: {
            viewServices: ['admin', 'manager', 'employee'],
            editServices: ['admin', 'manager'],
            deleteServices: ['admin'],
            bulkUpload: ['admin', 'manager']
          }
        };
        
        // Try to create default settings, but don't fail if permission denied
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            await setDoc(settingsRef, {
              ...defaultSettings,
              createdAt: Timestamp.now(),
              createdBy: currentUser.uid
            });
          }
        } catch (createError) {
          console.warn('Could not create default settings, using in-memory defaults:', createError);
        }
        
        return { id: this.SETTINGS_DOC_ID, ...defaultSettings };
      }
    } catch (error) {
      console.error('Error fetching service settings:', error);
      
      // Return default settings as fallback
      const fallbackSettings: ServiceSettings = {
        id: this.SETTINGS_DOC_ID,
        defaultDuration: 30,
        defaultCategory: 'General',
        autoApproval: false,
        allowBulkUpload: true,
        maxBulkUploadSize: 100,
        categories: ['General', 'Hair Care', 'Skin Care', 'Nail Care', 'Massage', 'Makeup'],
        priceRanges: {
          min: 0,
          max: 10000
        },
        businessHours: {
          start: '09:00',
          end: '18:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        notifications: {
          newService: true,
          serviceUpdated: true,
          serviceDeleted: false
        },
        permissions: {
          viewServices: ['admin', 'manager', 'employee'],
          editServices: ['admin', 'manager'],
          deleteServices: ['admin'],
          bulkUpload: ['admin', 'manager']
        }
      };
      
      return fallbackSettings;
    }
  }

  // Save services to serviceSettings document
  async saveServicesToSettings(services: Service[]): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Saving', services.length, 'services to serviceSettings document...');
      const settingsRef = doc(firestore, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID);
      
      // Get existing settings first
      const existingSettings = await this.getSettings();
      
      // Update with services
      await setDoc(settingsRef, {
        ...existingSettings,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          category: service.category,
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: Timestamp.now(),
          createdBy: service.createdBy || currentUser.uid
        })),
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.uid
      }, { merge: true });
      
      console.log('Services saved to serviceSettings document successfully');
    } catch (error) {
      console.error('Error saving services to settings:', error);
      throw new Error('Failed to save services to settings');
    }
  }

  // Update service settings
  async updateSettings(settings: Omit<ServiceSettings, 'id'>): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Temporarily disable role checking for testing
    // const role = currentUser.customClaims?.role;
    // if (role !== 'admin' && role !== 'manager') {
    //   throw new Error('Permission denied: Cannot update service settings');
    // }

    try {
      const settingsRef = doc(firestore, this.SETTINGS_COLLECTION, this.SETTINGS_DOC_ID);
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.uid
      }, { merge: true });
    } catch (error) {
      console.error('Error updating service settings:', error);
      throw new Error('Failed to update service settings');
    }
  }

  // Get service statistics
  async getServiceStats(): Promise<{
    totalServices: number;
    activeServices: number;
    inactiveServices: number;
    categoriesCount: number;
    categories: { name: string; count: number }[];
    averagePrice: number;
    averageDuration: number;
  }> {
    try {
      const services = await this.getAllServices();
      
      const totalServices = services.length;
      const activeServices = services.filter(s => s.isActive).length;
      const inactiveServices = totalServices - activeServices;
      
      const categoryMap = new Map<string, number>();
      let totalPrice = 0;
      let totalDuration = 0;
      
      services.forEach(service => {
        categoryMap.set(service.category, (categoryMap.get(service.category) || 0) + 1);
        totalPrice += service.price;
        totalDuration += service.duration;
      });
      
      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
      const averagePrice = totalServices > 0 ? totalPrice / totalServices : 0;
      const averageDuration = totalServices > 0 ? totalDuration / totalServices : 0;
      
      return {
        totalServices,
        activeServices,
        inactiveServices,
        categoriesCount: categoryMap.size,
        categories,
        averagePrice,
        averageDuration
      };
    } catch (error) {
      console.error('Error fetching service statistics:', error);
      throw new Error('Failed to fetch service statistics');
    }
  }

  // Search services
  async searchServices(searchTerm: string): Promise<Service[]> {
    try {
      const allServices = await this.getAllServices();
      
      const searchTermLower = searchTerm.toLowerCase();
      return allServices.filter(service => 
        service.name.toLowerCase().includes(searchTermLower) ||
        service.description.toLowerCase().includes(searchTermLower) ||
        service.category.toLowerCase().includes(searchTermLower)
      );
    } catch (error) {
      console.error('Error searching services:', error);
      throw new Error('Failed to search services');
    }
  }

  // Export services to CSV format
  exportServicesToCSV(services: Service[]): string {
    const headers = ['Name', 'Description', 'Price', 'Duration (minutes)', 'Category', 'Status', 'Created Date'];
    const rows = services.map(service => [
      `"${service.name}"`,
      `"${service.description}"`,
      service.price.toString(),
      service.duration.toString(),
      `"${service.category}"`,
      service.isActive ? 'Active' : 'Inactive',
      service.createdAt.toDate().toLocaleDateString()
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Parse CSV data for bulk upload
  parseCSVForBulkUpload(csvData: string): Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] {
    const lines = csvData.trim().split('\n');
    const services: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [];
    
    for (const line of lines) {
      const [name, description, price, duration, category] = line.split(',').map(item => item.trim());
      
      if (name && description && price && duration && category) {
        services.push({
          name,
          description,
          price: parseFloat(price) || 0,
          duration: parseInt(duration) || 0,
          category,
          isActive: true
        });
      }
    }
    
    return services;
  }
}

export const serviceManagementService = new ServiceManagementService();