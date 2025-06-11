import React from 'react';
import { Download, Upload, AlertCircle, Trash2 } from 'lucide-react';
import { Settings } from '../../types/settings';

interface BackupSettingsProps {
  onExport: () => void;
  onImport: (data: any) => void;
  onReset: () => void;
}

const BackupSettings: React.FC<BackupSettingsProps> = ({ onExport, onImport, onReset }) => {
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          onImport(importedData);
        } catch (error) {
          console.error('Failed to import settings:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Download size={20} className="text-blue-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Export Settings</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download all your settings as a JSON file for backup or migration purposes.
                </p>
                <button
                  onClick={onExport}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download size={16} />
                  <span>Export Settings</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Upload size={20} className="text-yellow-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">Import Settings</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Upload a previously exported settings file to restore your configuration.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-settings"
                />
                <label
                  htmlFor="import-settings"
                  className="mt-3 inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 cursor-pointer space-x-2"
                >
                  <Upload size={16} />
                  <span>Import Settings</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-red-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Reset All Settings</h4>
                <p className="text-sm text-red-700 mt-1">
                  This will reset all settings to their default values. This action cannot be undone.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all settings? This action cannot be undone.')) {
                      onReset();
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Reset All Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;