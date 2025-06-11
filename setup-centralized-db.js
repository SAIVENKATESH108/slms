#!/usr/bin/env node

/**
 * Setup script for centralized database structure
 * Run this script to prepare your project for the new database structure
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Centralized Database Structure...\n');

// Check if required files exist
const requiredFiles = [
  'src/services/centralizedDataService.ts',
  'src/services/migrationService.ts',
  'src/services/unifiedDataService.ts',
  'src/components/MigrationUtility.tsx',
  'firestore.indexes.json',
  'firestore.rules'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are created.');
  process.exit(1);
}

console.log('\n✅ All required files are present!');

// Create backup directory
const backupDir = path.join(__dirname, 'backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
  console.log('📁 Created backup directory');
}

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'firebase',
    'react',
    'typescript'
  ];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

// Create example integration file
const integrationExample = `
// Example: How to integrate the new unified data service into your existing components

import React, { useState, useEffect } from 'react';
import { unifiedDataService } from '../services/unifiedDataService';

// Replace your existing data service calls with unified service
const YourExistingComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // OLD WAY:
      // const clients = await firestoreService.getUserClients(userId);
      
      // NEW WAY:
      const clients = await unifiedDataService.getClients();
      setData(clients);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addNewRecord = async (recordData) => {
    try {
      // OLD WAY:
      // await firestoreService.addClient(recordData, userId);
      
      // NEW WAY:
      await unifiedDataService.addClient(recordData);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error adding record:', error);
    }
  };

  // ... rest of your component
};

export default YourExistingComponent;
`;

const integrationPath = path.join(__dirname, 'src/examples/integration-example.tsx');
if (!fs.existsSync(path.dirname(integrationPath))) {
  fs.mkdirSync(path.dirname(integrationPath), { recursive: true });
}
fs.writeFileSync(integrationPath, integrationExample);
console.log('📝 Created integration example file');

// Create setup checklist
const checklist = `
# Centralized Database Setup Checklist

## Pre-Migration Steps
- [ ] Backup your current Firebase database
- [ ] Test in development environment first
- [ ] Ensure you have admin access to Firebase
- [ ] Verify all team members have proper roles assigned

## Migration Steps
- [ ] Deploy new Firestore security rules
- [ ] Create database indexes (firebase deploy --only firestore:indexes)
- [ ] Run the migration utility as admin user
- [ ] Verify data migration completed successfully
- [ ] Test application functionality

## Post-Migration Steps
- [ ] Update application code to use unifiedDataService
- [ ] Test all CRUD operations
- [ ] Verify role-based permissions work correctly
- [ ] Check encryption/decryption of sensitive data
- [ ] Monitor performance and adjust indexes if needed
- [ ] Train team on new data structure
- [ ] Set up monitoring and alerts

## Rollback Plan (if needed)
- [ ] Use rollback button in migration utility
- [ ] Restore from backup if necessary
- [ ] Fix issues and re-run migration

## Files Created
- src/services/centralizedDataService.ts - Core centralized data service
- src/services/migrationService.ts - Migration utility service
- src/services/unifiedDataService.ts - Easy-to-use wrapper service
- src/components/MigrationUtility.tsx - Migration UI component
- firestore.indexes.json - Database indexes configuration
- firestore.rules - Updated security rules
- CENTRALIZED_DATABASE_SETUP.md - Complete setup guide

## Next Steps
1. Read CENTRALIZED_DATABASE_SETUP.md for detailed instructions
2. Add MigrationUtility component to your admin panel
3. Run migration in development environment first
4. Update your components to use unifiedDataService
5. Deploy to production after thorough testing
`;

fs.writeFileSync(path.join(__dirname, 'SETUP_CHECKLIST.md'), checklist);
console.log('📋 Created setup checklist');

console.log('\n🎉 Setup completed successfully!');
console.log('\n📚 Next steps:');
console.log('1. Read CENTRALIZED_DATABASE_SETUP.md for detailed instructions');
console.log('2. Read SETUP_CHECKLIST.md for step-by-step checklist');
console.log('3. Test the migration in development environment first');
console.log('4. Add MigrationUtility component to your admin panel');
console.log('5. Run the migration as an admin user');
console.log('\n⚠️  Important: Always backup your database before running migration!');

console.log('\n🔧 Firebase CLI commands you\'ll need:');
console.log('firebase login');
console.log('firebase init firestore');
console.log('firebase deploy --only firestore:rules');
console.log('firebase deploy --only firestore:indexes');

console.log('\n📖 Documentation files created:');
console.log('- CENTRALIZED_DATABASE_SETUP.md - Complete setup guide');
console.log('- SETUP_CHECKLIST.md - Step-by-step checklist');
console.log('- src/examples/integration-example.tsx - Code integration example');
console.log('- src/examples/UnifiedDataServiceExample.tsx - Working example component');