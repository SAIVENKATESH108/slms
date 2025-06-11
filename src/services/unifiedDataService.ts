import { centralizedDataService, DataType, UserRole } from './centralizedDataService';
import { authService } from './AuthService';

// Wrapper service that provides easy-to-use methods for your existing codebase
// This maintains compatibility with your current code while using the centralized structure

interface UnifiedServiceOptions {
  businessId?: string;
  tags?: string[];
  includeAuditTrail?: boolean;
}

class UnifiedDataService {
  
  // Helper to get current user info
  private getCurrentUserInfo(): { userId: string; userRole: UserRole } {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const userRole = (currentUser.customClaims?.role as UserRole) || 'staff';
    return {
      userId: currentUser.uid,
      userRole
    };
  }

  // CLIENT MANAGEMENT
  async getClients(options?: UnifiedServiceOptions): Promise<any[]> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const records = await centralizedDataService.readRecords(
      'client',
      userId,
      userRole,
      {
        businessId: options?.businessId,
        tags: options?.tags
      }
    );

    return records.map(record => ({
      id: record.id,
      ...record.data,
      _metadata: record.metadata,
      _auditTrail: options?.includeAuditTrail ? record.auditTrail : undefined
    }));
  }

  async addClient(clientData: any, options?: UnifiedServiceOptions): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    return await centralizedDataService.createRecord(
      'client',
      clientData,
      userId,
      userRole,
      options?.businessId
    );
  }

  async updateClient(clientId: string, updates: any): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.updateRecord(
      clientId,
      updates,
      userId,
      userRole
    );
  }

  async deleteClient(clientId: string): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.deleteRecord(
      clientId,
      userId,
      userRole
    );
  }

  // SERVICE MANAGEMENT
  async getServices(options?: UnifiedServiceOptions): Promise<any[]> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const records = await centralizedDataService.readRecords(
      'service',
      userId,
      userRole,
      {
        businessId: options?.businessId,
        tags: options?.tags
      }
    );

    return records.map(record => ({
      id: record.id,
      ...record.data,
      _metadata: record.metadata,
      _auditTrail: options?.includeAuditTrail ? record.auditTrail : undefined
    }));
  }

  async addService(serviceData: any, options?: UnifiedServiceOptions): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    return await centralizedDataService.createRecord(
      'service',
      serviceData,
      userId,
      userRole,
      options?.businessId
    );
  }

  async updateService(serviceId: string, updates: any): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.updateRecord(
      serviceId,
      updates,
      userId,
      userRole
    );
  }

  async deleteService(serviceId: string): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.deleteRecord(
      serviceId,
      userId,
      userRole
    );
  }

  // TRANSACTION MANAGEMENT
  async getTransactions(
    startDate?: Date,
    endDate?: Date,
    options?: UnifiedServiceOptions
  ): Promise<any[]> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const records = await centralizedDataService.readRecords(
      'transaction',
      userId,
      userRole,
      {
        businessId: options?.businessId,
        tags: options?.tags,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined
      }
    );

    return records.map(record => ({
      id: record.id,
      ...record.data,
      _metadata: record.metadata,
      _auditTrail: options?.includeAuditTrail ? record.auditTrail : undefined
    }));
  }

  async addTransaction(transactionData: any, options?: UnifiedServiceOptions): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    return await centralizedDataService.createRecord(
      'transaction',
      transactionData,
      userId,
      userRole,
      options?.businessId
    );
  }

  async updateTransaction(transactionId: string, updates: any): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.updateRecord(
      transactionId,
      updates,
      userId,
      userRole
    );
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.deleteRecord(
      transactionId,
      userId,
      userRole
    );
  }

  // APPOINTMENT MANAGEMENT
  async getAppointments(
    startDate?: Date,
    endDate?: Date,
    options?: UnifiedServiceOptions
  ): Promise<any[]> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const records = await centralizedDataService.readRecords(
      'appointment',
      userId,
      userRole,
      {
        businessId: options?.businessId,
        tags: options?.tags,
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined
      }
    );

    return records.map(record => ({
      id: record.id,
      ...record.data,
      _metadata: record.metadata,
      _auditTrail: options?.includeAuditTrail ? record.auditTrail : undefined
    }));
  }

  async addAppointment(appointmentData: any, options?: UnifiedServiceOptions): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    return await centralizedDataService.createRecord(
      'appointment',
      appointmentData,
      userId,
      userRole,
      options?.businessId
    );
  }

  async updateAppointment(appointmentId: string, updates: any): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.updateRecord(
      appointmentId,
      updates,
      userId,
      userRole
    );
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.deleteRecord(
      appointmentId,
      userId,
      userRole
    );
  }

  // STAFF MANAGEMENT
  async getStaff(options?: UnifiedServiceOptions): Promise<any[]> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const records = await centralizedDataService.readRecords(
      'staff',
      userId,
      userRole,
      {
        businessId: options?.businessId,
        tags: options?.tags
      }
    );

    return records.map(record => ({
      id: record.id,
      ...record.data,
      _metadata: record.metadata,
      _auditTrail: options?.includeAuditTrail ? record.auditTrail : undefined
    }));
  }

  async addStaff(staffData: any, options?: UnifiedServiceOptions): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    return await centralizedDataService.createRecord(
      'staff',
      staffData,
      userId,
      userRole,
      options?.businessId
    );
  }

  async updateStaff(staffId: string, updates: any): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.updateRecord(
      staffId,
      updates,
      userId,
      userRole
    );
  }

  async deleteStaff(staffId: string): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.deleteRecord(
      staffId,
      userId,
      userRole
    );
  }

  // SETTINGS MANAGEMENT
  async getSettings(options?: UnifiedServiceOptions): Promise<any> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const records = await centralizedDataService.readRecords(
      'settings',
      userId,
      userRole,
      {
        businessId: options?.businessId,
        createdBy: userId // Get user's own settings
      },
      1 // Limit to 1 record
    );

    return records.length > 0 ? {
      id: records[0].id,
      ...records[0].data,
      _metadata: records[0].metadata
    } : null;
  }

  async saveSettings(settingsData: any, options?: UnifiedServiceOptions): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    // Check if settings already exist
    const existingSettings = await this.getSettings(options);
    
    if (existingSettings) {
      // Update existing settings
      await centralizedDataService.updateRecord(
        existingSettings.id,
        settingsData,
        userId,
        userRole
      );
      return existingSettings.id;
    } else {
      // Create new settings
      return await centralizedDataService.createRecord(
        'settings',
        settingsData,
        userId,
        userRole,
        options?.businessId
      );
    }
  }

  // THEME MANAGEMENT
  async getThemes(options?: UnifiedServiceOptions): Promise<any[]> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const records = await centralizedDataService.readRecords(
      'theme',
      userId,
      userRole,
      {
        businessId: options?.businessId,
        tags: options?.tags
      }
    );

    return records.map(record => ({
      id: record.id,
      ...record.data,
      _metadata: record.metadata
    }));
  }

  async saveTheme(themeData: any, options?: UnifiedServiceOptions): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    return await centralizedDataService.createRecord(
      'theme',
      themeData,
      userId,
      userRole,
      options?.businessId
    );
  }

  async updateTheme(themeId: string, updates: any): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.updateRecord(
      themeId,
      updates,
      userId,
      userRole
    );
  }

  async deleteTheme(themeId: string): Promise<void> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    await centralizedDataService.deleteRecord(
      themeId,
      userId,
      userRole
    );
  }

  // USER PROFILE MANAGEMENT
  async getUserProfile(userId?: string): Promise<any> {
    const currentUserInfo = this.getCurrentUserInfo();
    const targetUserId = userId || currentUserInfo.userId;
    
    const records = await centralizedDataService.readRecords(
      'user_profile',
      currentUserInfo.userId,
      currentUserInfo.userRole,
      {
        createdBy: targetUserId
      },
      1
    );

    return records.length > 0 ? {
      id: records[0].id,
      ...records[0].data,
      _metadata: records[0].metadata
    } : null;
  }

  async updateUserProfile(profileData: any): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const existingProfile = await this.getUserProfile();
    
    if (existingProfile) {
      await centralizedDataService.updateRecord(
        existingProfile.id,
        profileData,
        userId,
        userRole
      );
      return existingProfile.id;
    } else {
      return await centralizedDataService.createRecord(
        'user_profile',
        profileData,
        userId,
        userRole,
        userId
      );
    }
  }

  // AUDIT AND SECURITY
  async getAuditTrail(recordId: string): Promise<any[]> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    return await centralizedDataService.getAuditTrail(recordId, userId, userRole);
  }

  async logSecurityEvent(eventData: any): Promise<string> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    return await centralizedDataService.createRecord(
      'security_log',
      {
        ...eventData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      },
      userId,
      userRole
    );
  }

  // BULK OPERATIONS
  async bulkImport(
    dataType: DataType,
    records: any[],
    options?: UnifiedServiceOptions
  ): Promise<string[]> {
    const { userId, userRole } = this.getCurrentUserInfo();
    
    const recordsToImport = records.map(data => ({
      dataType,
      data,
      businessId: options?.businessId
    }));

    return await centralizedDataService.bulkImport(recordsToImport, userId, userRole);
  }

  // SEARCH AND FILTERING
  async searchRecords(
    dataType: DataType,
    searchTerm: string,
    options?: UnifiedServiceOptions
  ): Promise<any[]> {
    // Get all records first, then filter client-side
    // For better performance, you could implement server-side search
    const records = await this.getRecordsByType(dataType, options);
    
    const searchLower = searchTerm.toLowerCase();
    return records.filter(record => {
      const recordString = JSON.stringify(record).toLowerCase();
      return recordString.includes(searchLower);
    });
  }

  private async getRecordsByType(dataType: DataType, options?: UnifiedServiceOptions): Promise<any[]> {
    switch (dataType) {
      case 'client':
        return this.getClients(options);
      case 'service':
        return this.getServices(options);
      case 'transaction':
        return this.getTransactions(undefined, undefined, options);
      case 'appointment':
        return this.getAppointments(undefined, undefined, options);
      case 'staff':
        return this.getStaff(options);
      case 'theme':
        return this.getThemes(options);
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
  }

  // ANALYTICS AND REPORTING
  async getDataSummary(businessId?: string): Promise<{
    clients: number;
    services: number;
    transactions: number;
    appointments: number;
    staff: number;
  }> {
    const options = { businessId };
    
    const [clients, services, transactions, appointments, staff] = await Promise.all([
      this.getClients(options),
      this.getServices(options),
      this.getTransactions(undefined, undefined, options),
      this.getAppointments(undefined, undefined, options),
      this.getStaff(options)
    ]);

    return {
      clients: clients.length,
      services: services.length,
      transactions: transactions.length,
      appointments: appointments.length,
      staff: staff.length
    };
  }
}

export const unifiedDataService = new UnifiedDataService();
export type { UnifiedServiceOptions };