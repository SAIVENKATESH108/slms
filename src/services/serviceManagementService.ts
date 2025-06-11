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
    if (role === 'admin') {
      return true; // Allow all operations for admins
    }
    
    if (role === 'manager') {
      switch (action) {
        case 'view':
        case 'edit':
        case 'bulkUpload':
          return true;
        case 'delete':
          return false; // Only admins can delete
        default:
          return false;
      }
    }
    
    if (role === 'employee') {
      switch (action) {
        case 'view':
          return true; // Employees can view services
        case 'edit':
        case 'delete':
        case 'bulkUpload':
          return false; // Employees can't modify services
        default:
          return false;
      }
    }

    return false; // Default deny
  }

  async getAllServices(): Promise<Service[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    return firestoreService.loadServicesSettings(currentUser.uid);
  }

  async getActiveServices(): Promise<Service[]> {
    const allServices = await this.getAllServices();
    return allServices.filter(service => service.isActive !== false);
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

    await firestoreService.updateService(serviceId, serviceData, currentUser.uid);
  }

  async deleteService(serviceId: string): Promise<void> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('delete', settings)) throw new Error('Permission denied: Cannot delete services');

    await firestoreService.deleteService(serviceId, currentUser.uid);
  }

  async bulkUploadServices(servicesData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[]): Promise<string[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const settings = await this.getSettings();
    if (!this.hasPermission('bulkUpload', settings)) throw new Error('Permission denied: Cannot bulk upload services');

    if (!settings.allowBulkUpload) throw new Error('Bulk upload is disabled');

    if (servicesData.length > settings.maxBulkUploadSize) throw new Error(`Bulk upload size exceeds limit of ${settings.maxBulkUploadSize}`);

    const results = await Promise.all(servicesData.map(service => firestoreService.addService({
      ...service,
      userId: currentUser.uid
    })));
    
    return results.map(r => r.id);
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

  async getServiceStats(): Promise<{
    totalServices: number;
    activeServices: number;
    categoriesCount: number;
  }> {
    const services = await this.getAllServices();
    
    const categories = new Set(services.map(s => s.category));
    
    return {
      totalServices: services.length,
      activeServices: services.filter(s => s.isActive !== false).length,
      categoriesCount: categories.size
    };
  }

  // Parse CSV data for bulk upload
  parseCSVForBulkUpload(csvData: string): Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] {
    const lines = csvData.trim().split('\n');
    const services: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [];
    
    for (const line of lines) {
      const [name, description, price, duration, category] = line.split(',').map(item => item.trim());
      
      if (name && description && price && category) {
        services.push({
          name,
          description,
          price: parseFloat(price) || 0,
          duration: parseInt(duration) || 30,
          category,
          isActive: true
        });
      }
    }
    
    return services;
  }

  // Export services to CSV format
  exportServicesToCSV(services: Service[]): string {
    const headers = ['Name', 'Description', 'Price', 'Duration (minutes)', 'Category', 'Status'];
    const rows = services.map(service => [
      `"${service.name}"`,
      `"${service.description}"`,
      service.price.toString(),
      (service.duration || 30).toString(),
      `"${service.category}"`,
      service.isActive !== false ? 'Active' : 'Inactive'
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

export const serviceManagementService = new ServiceManagementService();