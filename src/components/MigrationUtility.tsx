import React, { useState, useEffect } from 'react';
import { migrationService, MigrationProgress } from '../services/migrationService';
import { authService } from '../services/AuthService';

interface MigrationUtilityProps {
  onMigrationComplete?: () => void;
}

const MigrationUtility: React.FC<MigrationUtilityProps> = ({ onMigrationComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.customClaims?.admin || currentUser?.customClaims?.role === 'admin';

  useEffect(() => {
    // Get initial progress if migration is already running
    const currentProgress = migrationService.getProgress();
    if (currentProgress.total > 0) {
      setProgress(currentProgress);
    }
  }, []);

  const handleStartMigration = async () => {
    if (!currentUser || !isAdmin) {
      alert('Only administrators can run data migration');
      return;
    }

    setIsRunning(true);
    setResult(null);
    setShowConfirmation(false);

    try {
      const migrationResult = await migrationService.migrateAllData(
        currentUser.uid,
        (progress) => {
          setProgress(progress);
        }
      );

      setResult(migrationResult);
      
      if (migrationResult.success && onMigrationComplete) {
        onMigrationComplete();
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setResult({
        success: false,
        error: error.message,
        progress: migrationService.getProgress()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRollback = async () => {
    if (!currentUser || !isAdmin) {
      alert('Only administrators can rollback migration');
      return;
    }

    if (!confirm('Are you sure you want to rollback the migration? This will delete all centralized data.')) {
      return;
    }

    try {
      await migrationService.rollbackMigration(currentUser.uid);
      alert('Migration rollback completed successfully');
      setResult(null);
      setProgress(null);
    } catch (error) {
      console.error('Rollback failed:', error);
      alert(`Rollback failed: ${error.message}`);
    }
  };

  const getProgressPercentage = () => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
        <p className="text-red-600">Only administrators can access the migration utility.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Migration Utility</h2>
        <p className="text-gray-600">
          Migrate your existing data to the new centralized structure with encryption and audit trails.
        </p>
      </div>

      {/* Warning Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>This migration will restructure your entire database</li>
                <li>All data will be encrypted and centralized into a single collection</li>
                <li>Audit trails will be created for all records</li>
                <li>Make sure to backup your database before proceeding</li>
                <li>The migration process may take several minutes depending on data size</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {!isRunning && !result && (
          <button
            onClick={() => setShowConfirmation(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Start Migration
          </button>
        )}

        {result && (
          <button
            onClick={handleRollback}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Rollback Migration
          </button>
        )}

        {isRunning && (
          <button
            disabled
            className="bg-gray-400 text-white px-6 py-2 rounded-lg font-medium cursor-not-allowed"
          >
            Migration Running...
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Migration</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to start the database migration? This process cannot be undone easily.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleStartMigration}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
            >
              Yes, Start Migration
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Progress Section */}
      {progress && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Migration Progress</h3>
            <span className="text-sm text-gray-600">
              {getProgressPercentage()}% Complete
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-600">Completed</div>
              <div className="text-2xl font-bold text-green-800">{progress.completed}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm text-red-600">Failed</div>
              <div className="text-2xl font-bold text-red-800">{progress.failed}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-600">Total</div>
              <div className="text-2xl font-bold text-blue-800">{progress.total}</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-600">Current Step:</div>
            <div className="font-medium text-gray-900">{progress.currentStep}</div>
          </div>

          {progress.errors.length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">Errors ({progress.errors.length})</h4>
              <div className="max-h-32 overflow-y-auto">
                {progress.errors.slice(-5).map((error, index) => (
                  <div key={index} className="text-xs text-red-600 mb-1">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Migration Results</h3>
          
          {result.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">Migration Completed Successfully!</span>
              </div>
              
              {result.migratedRecords && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(result.migratedRecords).map(([type, count]) => (
                    <div key={type} className="bg-white border border-green-200 rounded p-2">
                      <div className="text-xs text-green-600 capitalize">{type.replace('_', ' ')}</div>
                      <div className="text-lg font-bold text-green-800">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">Migration Failed</span>
              </div>
              
              {result.error && (
                <div className="text-red-600 text-sm">{result.error}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Next Steps After Migration</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Deploy the new Firestore security rules</li>
          <li>Create the required database indexes</li>
          <li>Update your application code to use the unified data service</li>
          <li>Test all functionality thoroughly</li>
          <li>Monitor performance and adjust indexes if needed</li>
        </ol>
      </div>
    </div>
  );
};

export default MigrationUtility;