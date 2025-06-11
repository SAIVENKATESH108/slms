import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  where,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { centralizedDataService, DataType, UserRole } from './centralizedDataService';

interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  currentStep: string;
  errors: string[];
}

interface MigrationResult {
  success: boolean;
  progress: MigrationProgress;
  migratedRecords: {
    [key in DataType]?: number;
  };
}

class MigrationService {
  private progress: MigrationProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    currentStep: 'Initializing',
    errors: []
  };

  // Main migration function
  async migrateAllData(
    adminUserId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    try {
      console.log('🚀 Starting complete data migration to centralized structure...');
      
      this.resetProgress();
      const migratedRecords: { [key in DataType]?: number } = {};

      // Step 1: Count total records to migrate
      this.updateProgress('Counting existing records...', onProgress);
      const totalCount = await this.countExistingRecords();
      this.progress.total = totalCount;

      // Step 2: Migrate users and their data
      this.updateProgress('Migrating user data...', onProgress);
      const userMigrationResult = await this.migrateUsers(adminUserId, onProgress);
      migratedRecords.user_profile = userMigrationResult;

      // Step 3: Migrate shared collections
      this.updateProgress('Migrating shared services...', onProgress);
      migratedRecords.service = await this.migrateSharedServices(adminUserId, onProgress);

      this.updateProgress('Migrating shared transactions...', onProgress);
      migratedRecords.transaction = await this.migrateSharedTransactions(adminUserId, onProgress);

      this.updateProgress('Migrating shared clients...', onProgress);
      migratedRecords.client = await this.migrateSharedClients(adminUserId, onProgress);

      this.updateProgress('Migrating shared staff...', onProgress);
      migratedRecords.staff = await this.migrateSharedStaff(adminUserId, onProgress);

      this.updateProgress('Migrating shared appointments...', onProgress);
      migratedRecords.appointment = await this.migrateSharedAppointments(adminUserId, onProgress);

      // Step 4: Final validation
      this.updateProgress('Validating migration...', onProgress);
      await this.validateMigration();

      this.updateProgress('Migration completed successfully!', onProgress);

      return {
        success: true,
        progress: this.progress,
        migratedRecords
      };

    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.progress.errors.push(`Migration failed: ${error.message}`);
      
      return {
        success: false,
        progress: this.progress,
        migratedRecords: {}
      };
    }
  }

  // Count existing records across all collections
  private async countExistingRecords(): Promise<number> {
    let total = 0;

    try {
      // Count users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      total += usersSnapshot.size;

      // Count shared collections
      const collections = ['services', 'transactions', 'clients', 'staff', 'appointments'];
      
      for (const collectionName of collections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          total += snapshot.size;
        } catch (error) {
          console.warn(`Collection ${collectionName} not found or empty`);
        }
      }

      // Count user subcollections
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const subcollections = ['services', 'transactions', 'clients', 'staff', 'appointments'];
        
        for (const subcollection of subcollections) {
          try {
            const snapshot = await getDocs(collection(db, 'users', userId, subcollection));
            total += snapshot.size;
          } catch (error) {
            // Subcollection might not exist
          }
        }
      }

      console.log(`📊 Total records to migrate: ${total}`);
      return total;
    } catch (error) {
      console.error('Error counting records:', error);
      return 0;
    }
  }

  // Migrate user profiles and their subcollections
  private async migrateUsers(
    adminUserId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<number> {
    let migratedCount = 0;

    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          const userId = userDoc.id;
          const userData = userDoc.data();

          // Migrate user profile
          await centralizedDataService.createRecord(
            'user_profile',
            {
              ...userData,
              originalUserId: userId
            },
            adminUserId,
            'admin',
            userId // Use userId as businessId for multi-tenant support
          );

          migratedCount++;
          this.progress.completed++;

          // Migrate user's subcollections
          await this.migrateUserSubcollections(userId, adminUserId);

          this.updateProgress(`Migrated user: ${userId}`, onProgress);

        } catch (error) {
          console.error(`Error migrating user ${userDoc.id}:`, error);
          this.progress.failed++;
          this.progress.errors.push(`User ${userDoc.id}: ${error.message}`);
        }
      }

      return migratedCount;
    } catch (error) {
      console.error('Error migrating users:', error);
      throw error;
    }
  }

  // Migrate user's subcollections
  private async migrateUserSubcollections(
    userId: string,
    adminUserId: string
  ): Promise<void> {
    const subcollections = [
      { name: 'services', dataType: 'service' as DataType },
      { name: 'transactions', dataType: 'transaction' as DataType },
      { name: 'clients', dataType: 'client' as DataType },
      { name: 'staff', dataType: 'staff' as DataType },
      { name: 'appointments', dataType: 'appointment' as DataType }
    ];

    for (const subcol of subcollections) {
      try {
        const snapshot = await getDocs(collection(db, 'users', userId, subcol.name));
        
        for (const doc of snapshot.docs) {
          try {
            await centralizedDataService.createRecord(
              subcol.dataType,
              {
                ...doc.data(),
                originalDocId: doc.id,
                originalUserId: userId
              },
              adminUserId,
              'admin',
              userId
            );

            this.progress.completed++;
          } catch (error) {
            console.error(`Error migrating ${subcol.name} ${doc.id}:`, error);
            this.progress.failed++;
            this.progress.errors.push(`${subcol.name} ${doc.id}: ${error.message}`);
          }
        }
      } catch (error) {
        console.warn(`Subcollection ${subcol.name} not found for user ${userId}`);
      }
    }
  }

  // Migrate shared services collection
  private async migrateSharedServices(
    adminUserId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<number> {
    return this.migrateSharedCollection('services', 'service', adminUserId, onProgress);
  }

  // Migrate shared transactions collection
  private async migrateSharedTransactions(
    adminUserId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<number> {
    return this.migrateSharedCollection('transactions', 'transaction', adminUserId, onProgress);
  }

  // Migrate shared clients collection
  private async migrateSharedClients(
    adminUserId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<number> {
    return this.migrateSharedCollection('clients', 'client', adminUserId, onProgress);
  }

  // Migrate shared staff collection
  private async migrateSharedStaff(
    adminUserId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<number> {
    return this.migrateSharedCollection('staff', 'staff', adminUserId, onProgress);
  }

  // Migrate shared appointments collection
  private async migrateSharedAppointments(
    adminUserId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<number> {
    return this.migrateSharedCollection('appointments', 'appointment', adminUserId, onProgress);
  }

  // Generic method to migrate shared collections
  private async migrateSharedCollection(
    collectionName: string,
    dataType: DataType,
    adminUserId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<number> {
    let migratedCount = 0;

    try {
      const snapshot = await getDocs(collection(db, collectionName));
      
      for (const doc of snapshot.docs) {
        try {
          const data = doc.data();
          
          await centralizedDataService.createRecord(
            dataType,
            {
              ...data,
              originalDocId: doc.id,
              originalCollection: collectionName
            },
            adminUserId,
            'admin',
            data.userId || data.businessId || 'shared' // Use existing businessId or mark as shared
          );

          migratedCount++;
          this.progress.completed++;
          this.updateProgress(`Migrated ${dataType}: ${doc.id}`, onProgress);

        } catch (error) {
          console.error(`Error migrating ${dataType} ${doc.id}:`, error);
          this.progress.failed++;
          this.progress.errors.push(`${dataType} ${doc.id}: ${error.message}`);
        }
      }

      return migratedCount;
    } catch (error) {
      console.warn(`Collection ${collectionName} not found or empty`);
      return 0;
    }
  }

  // Validate migration by checking record counts
  private async validateMigration(): Promise<void> {
    try {
      // Get count of migrated records
      const migratedRecords = await getDocs(collection(db, 'shared_data'));
      const migratedCount = migratedRecords.size;

      console.log(`✅ Migration validation: ${migratedCount} records in centralized collection`);
      
      if (migratedCount === 0) {
        throw new Error('No records found in centralized collection after migration');
      }

      // Additional validation can be added here
      // e.g., check data integrity, encryption status, etc.

    } catch (error) {
      console.error('Migration validation failed:', error);
      throw error;
    }
  }

  // Helper methods
  private resetProgress(): void {
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      currentStep: 'Initializing',
      errors: []
    };
  }

  private updateProgress(
    step: string, 
    onProgress?: (progress: MigrationProgress) => void
  ): void {
    this.progress.currentStep = step;
    console.log(`📝 ${step} (${this.progress.completed}/${this.progress.total})`);
    
    if (onProgress) {
      onProgress({ ...this.progress });
    }
  }

  // Rollback migration (if needed)
  async rollbackMigration(adminUserId: string): Promise<void> {
    try {
      console.log('🔄 Starting migration rollback...');
      
      // Delete all records from centralized collection
      const snapshot = await getDocs(collection(db, 'shared_data'));
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log('✅ Migration rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  // Get migration status
  getProgress(): MigrationProgress {
    return { ...this.progress };
  }
}

export const migrationService = new MigrationService();
export type { MigrationProgress, MigrationResult };