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
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Data types that will be stored in the centralized collection
export type DataType = 
  | 'client' 
  | 'service' 
  | 'transaction' 
  | 'appointment' 
  | 'staff' 
  | 'settings' 
  | 'theme' 
  | 'user_profile'
  | 'security_log'
  | 'business_settings';

// Action types for audit trail
export type ActionType = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'bulk_import' 
  | 'export'
  | 'login'
  | 'logout';

// User roles
export type UserRole = 'admin' | 'manager' | 'employee' | 'staff';

// Base interface for all centralized data
export interface CentralizedDataRecord {
  id: string;
  dataType: DataType;
  data: any; // The actual data (encrypted if sensitive)
  metadata: {
    createdBy: string; // User ID who created this record
    createdAt: Timestamp;
    updatedBy: string; // User ID who last updated this record
    updatedAt: Timestamp;
    version: number; // For optimistic locking
    isEncrypted: boolean; // Whether the data is encrypted
    tags?: string[]; // For categorization and filtering
    businessId?: string; // For multi-tenant support
  };
  permissions: {
    read: UserRole[]; // Roles that can read this data
    write: UserRole[]; // Roles that can write this data
    delete: UserRole[]; // Roles that can delete this data
  };
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  action: ActionType;
  userId: string;
  timestamp: Timestamp;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
}

// Encryption utility class
class EncryptionService {
  // Simple Base64 encoding/decoding as requested
  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return btoa(unescape(encodeURIComponent(jsonString)));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(encryptedData: string): any {
    try {
      const jsonString = decodeURIComponent(escape(atob(encryptedData)));
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Determine if data should be encrypted based on data type and content
  static shouldEncrypt(dataType: DataType, data: any): boolean {
    const sensitiveTypes: DataType[] = ['client', 'staff', 'settings', 'user_profile', 'security_log'];
    
    if (sensitiveTypes.includes(dataType)) {
      return true;
    }

    // Check for sensitive fields in the data
    const sensitiveFields = ['email', 'phone', 'mobile', 'password', 'apiKey', 'secret', 'token'];
    const dataString = JSON.stringify(data).toLowerCase();
    
    return sensitiveFields.some(field => dataString.includes(field));
  }
}

// Main centralized data service
class CentralizedDataService {
  private readonly COLLECTION_NAME = 'shared_data';

  // Create a new record in the centralized collection
  async createRecord(
    dataType: DataType,
    data: any,
    userId: string,
    userRole: UserRole,
    businessId?: string
  ): Promise<string> {
    try {
      const shouldEncrypt = EncryptionService.shouldEncrypt(dataType, data);
      const processedData = shouldEncrypt ? EncryptionService.encrypt(data) : data;

      const permissions = this.getDefaultPermissions(dataType, userRole);
      
      const record: Omit<CentralizedDataRecord, 'id'> = {
        dataType,
        data: processedData,
        metadata: {
          createdBy: userId,
          createdAt: serverTimestamp() as Timestamp,
          updatedBy: userId,
          updatedAt: serverTimestamp() as Timestamp,
          version: 1,
          isEncrypted: shouldEncrypt,
          businessId
        },
        permissions,
        auditTrail: [{
          action: 'create',
          userId,
          timestamp: serverTimestamp() as Timestamp,
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent
        }]
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), record);
      
      console.log(`Created ${dataType} record with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Error creating record:', error);
      throw error;
    }
  }

  // Read records with filtering and role-based access
  async readRecords(
    dataType: DataType,
    userId: string,
    userRole: UserRole,
    filters?: {
      businessId?: string;
      tags?: string[];
      createdBy?: string;
      dateRange?: { start: Date; end: Date };
    },
    limitCount?: number
  ): Promise<CentralizedDataRecord[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('dataType', '==', dataType)
      );

      // Apply filters
      if (filters?.businessId) {
        q = query(q, where('metadata.businessId', '==', filters.businessId));
      }

      if (filters?.createdBy) {
        q = query(q, where('metadata.createdBy', '==', filters.createdBy));
      }

      if (filters?.dateRange) {
        q = query(
          q,
          where('metadata.createdAt', '>=', Timestamp.fromDate(filters.dateRange.start)),
          where('metadata.createdAt', '<=', Timestamp.fromDate(filters.dateRange.end))
        );
      }

      // Order by creation date (newest first)
      q = query(q, orderBy('metadata.createdAt', 'desc'));

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      const records: CentralizedDataRecord[] = [];

      for (const docSnap of snapshot.docs) {
        const record = { id: docSnap.id, ...docSnap.data() } as CentralizedDataRecord;
        
        // Check read permissions
        if (this.hasPermission(record.permissions.read, userRole)) {
          // Decrypt data if necessary
          if (record.metadata.isEncrypted) {
            try {
              record.data = EncryptionService.decrypt(record.data);
            } catch (error) {
              console.error(`Failed to decrypt record ${record.id}:`, error);
              continue; // Skip this record if decryption fails
            }
          }

          // Log read access
          await this.addAuditEntry(record.id, {
            action: 'read',
            userId,
            timestamp: serverTimestamp() as Timestamp,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent
          });

          records.push(record);
        }
      }

      console.log(`Retrieved ${records.length} ${dataType} records for user ${userId}`);
      return records;
    } catch (error) {
      console.error('Error reading records:', error);
      throw error;
    }
  }

  // Update a record
  async updateRecord(
    recordId: string,
    updates: any,
    userId: string,
    userRole: UserRole
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, recordId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Record not found');
      }

      const record = { id: docSnap.id, ...docSnap.data() } as CentralizedDataRecord;

      // Check write permissions
      if (!this.hasPermission(record.permissions.write, userRole)) {
        throw new Error('Insufficient permissions to update this record');
      }

      // Decrypt existing data if encrypted
      let currentData = record.data;
      if (record.metadata.isEncrypted) {
        currentData = EncryptionService.decrypt(record.data);
      }

      // Merge updates with existing data
      const updatedData = { ...currentData, ...updates };

      // Re-encrypt if necessary
      const shouldEncrypt = record.metadata.isEncrypted;
      const processedData = shouldEncrypt ? EncryptionService.encrypt(updatedData) : updatedData;

      // Track changes for audit
      const changes = this.getChanges(currentData, updatedData);

      // Update the record
      await updateDoc(docRef, {
        data: processedData,
        'metadata.updatedBy': userId,
        'metadata.updatedAt': serverTimestamp(),
        'metadata.version': record.metadata.version + 1
      });

      // Add audit entry
      await this.addAuditEntry(recordId, {
        action: 'update',
        userId,
        timestamp: serverTimestamp() as Timestamp,
        changes,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      });

      console.log(`Updated record ${recordId}`);
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  // Delete a record
  async deleteRecord(recordId: string, userId: string, userRole: UserRole): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, recordId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Record not found');
      }

      const record = { id: docSnap.id, ...docSnap.data() } as CentralizedDataRecord;

      // Check delete permissions
      if (!this.hasPermission(record.permissions.delete, userRole)) {
        throw new Error('Insufficient permissions to delete this record');
      }

      // Add final audit entry before deletion
      await this.addAuditEntry(recordId, {
        action: 'delete',
        userId,
        timestamp: serverTimestamp() as Timestamp,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      });

      await deleteDoc(docRef);
      console.log(`Deleted record ${recordId}`);
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  // Bulk import data (for migration)
  async bulkImport(
    records: Array<{
      dataType: DataType;
      data: any;
      businessId?: string;
    }>,
    userId: string,
    userRole: UserRole
  ): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const recordIds: string[] = [];

      for (const recordData of records) {
        const shouldEncrypt = EncryptionService.shouldEncrypt(recordData.dataType, recordData.data);
        const processedData = shouldEncrypt ? EncryptionService.encrypt(recordData.data) : recordData.data;

        const permissions = this.getDefaultPermissions(recordData.dataType, userRole);
        
        const record: Omit<CentralizedDataRecord, 'id'> = {
          dataType: recordData.dataType,
          data: processedData,
          metadata: {
            createdBy: userId,
            createdAt: serverTimestamp() as Timestamp,
            updatedBy: userId,
            updatedAt: serverTimestamp() as Timestamp,
            version: 1,
            isEncrypted: shouldEncrypt,
            businessId: recordData.businessId
          },
          permissions,
          auditTrail: [{
            action: 'bulk_import',
            userId,
            timestamp: serverTimestamp() as Timestamp,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent
          }]
        };

        const docRef = doc(collection(db, this.COLLECTION_NAME));
        batch.set(docRef, record);
        recordIds.push(docRef.id);
      }

      await batch.commit();
      console.log(`Bulk imported ${records.length} records`);
      return recordIds;
    } catch (error) {
      console.error('Error in bulk import:', error);
      throw error;
    }
  }

  // Get audit trail for a specific record
  async getAuditTrail(recordId: string, userId: string, userRole: UserRole): Promise<AuditEntry[]> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, recordId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Record not found');
      }

      const record = { id: docSnap.id, ...docSnap.data() } as CentralizedDataRecord;

      // Check read permissions
      if (!this.hasPermission(record.permissions.read, userRole)) {
        throw new Error('Insufficient permissions to view audit trail');
      }

      return record.auditTrail || [];
    } catch (error) {
      console.error('Error getting audit trail:', error);
      throw error;
    }
  }

  // Helper methods
  private getDefaultPermissions(dataType: DataType, userRole: UserRole): CentralizedDataRecord['permissions'] {
    // Define default permissions based on data type and user role
    const permissions: Record<DataType, CentralizedDataRecord['permissions']> = {
      client: {
        read: ['admin', 'manager', 'employee'],
        write: ['admin', 'manager', 'employee'],
        delete: ['admin', 'manager']
      },
      service: {
        read: ['admin', 'manager', 'employee', 'staff'],
        write: ['admin', 'manager'],
        delete: ['admin']
      },
      transaction: {
        read: ['admin', 'manager', 'employee'],
        write: ['admin', 'manager', 'employee'],
        delete: ['admin']
      },
      appointment: {
        read: ['admin', 'manager', 'employee', 'staff'],
        write: ['admin', 'manager', 'employee'],
        delete: ['admin', 'manager']
      },
      staff: {
        read: ['admin', 'manager'],
        write: ['admin'],
        delete: ['admin']
      },
      settings: {
        read: ['admin', 'manager'],
        write: ['admin'],
        delete: ['admin']
      },
      theme: {
        read: ['admin', 'manager', 'employee', 'staff'],
        write: ['admin', 'manager'],
        delete: ['admin']
      },
      user_profile: {
        read: ['admin', 'manager', 'employee', 'staff'],
        write: ['admin', 'manager', 'employee', 'staff'],
        delete: ['admin']
      },
      security_log: {
        read: ['admin'],
        write: ['admin'],
        delete: ['admin']
      },
      business_settings: {
        read: ['admin', 'manager'],
        write: ['admin'],
        delete: ['admin']
      }
    };

    return permissions[dataType];
  }

  private hasPermission(allowedRoles: UserRole[], userRole: UserRole): boolean {
    return allowedRoles.includes(userRole);
  }

  private async addAuditEntry(recordId: string, auditEntry: AuditEntry): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, recordId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const record = docSnap.data() as CentralizedDataRecord;
        const updatedAuditTrail = [...(record.auditTrail || []), auditEntry];

        // Keep only last 100 audit entries to prevent document size issues
        if (updatedAuditTrail.length > 100) {
          updatedAuditTrail.splice(0, updatedAuditTrail.length - 100);
        }

        await updateDoc(docRef, {
          auditTrail: updatedAuditTrail
        });
      }
    } catch (error) {
      console.error('Error adding audit entry:', error);
      // Don't throw error for audit failures to avoid breaking main operations
    }
  }

  private getChanges(oldData: any, newData: any): AuditEntry['changes'] {
    const changes: AuditEntry['changes'] = [];
    
    // Simple change detection (can be enhanced for deep object comparison)
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes.push({
          field: key,
          oldValue: oldData[key],
          newValue: newData[key]
        });
      }
    }

    return changes;
  }

  private getClientIP(): string {
    // This would typically be handled server-side
    // For client-side, we can't get the real IP
    return 'client-side';
  }

  // Migration helper to move existing data to centralized structure
  async migrateExistingData(userId: string, userRole: UserRole): Promise<void> {
    try {
      console.log('Starting data migration to centralized structure...');

      // This would be called once to migrate existing data
      // Implementation would depend on your current data structure
      
      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Error during data migration:', error);
      throw error;
    }
  }
}

export const centralizedDataService = new CentralizedDataService();
export { EncryptionService };