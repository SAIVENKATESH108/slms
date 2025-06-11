import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Save, 
  Upload, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
  Database,
  Users
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { serviceManagementService, ServiceSettings as ServiceSettingsType } from '../services/serviceManagementService';

const ServiceSettingsCompact = () => {
  const { user } = useAuthStore();
  const { role } = useUserStore();
  const [settings, setSettings] = useState<ServiceSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    categories: 0
  });

  const canAccessSettings = () => {
    // Temporarily allow all users to access settings for testing
    return true;
    // return role === 'admin' || role === 'manager';
  };

  const fetchSettings = async () => {
    if (!user || !canAccessSettings()) return;
    
    setLoading(true);
    try {
      const settingsData = await serviceManagementService.getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching service settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const statsData = await serviceManagementService.getServiceStats();
      setStats({
        totalServices: statsData.totalServices,
        activeServices: statsData.activeServices,
        categories: statsData.categoriesCount
      });
    } catch (error) {
      console.error('Error fetching service stats:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user || !canAccessSettings() || !settings) return;
    
    setSaving(true);
    try {
      const { id, ...settingsData } = settings;
      await serviceManagementService.updateSettings(settingsData);
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!settings) return;
    
    const newCategory = prompt('Enter new category name:');
    if (newCategory && !settings.categories.includes(newCategory)) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory]
      });
    }
  };

  const handleRemoveCategory = (category: string) => {
    if (!settings || settings.categories.length <= 1) return;
    
    setSettings({
      ...settings,
      categories: settings.categories.filter(c => c !== category)
    });
  };

  const handleExportSettings = () => {
    if (!settings) return;
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'service-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...settings, ...importedSettings });
        setMessage({ type: 'success', text: 'Settings imported successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid settings file' });
        setTimeout(() => setMessage(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  if (!canAccessSettings()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to access service settings.</p>
        </div>
      </div>
    );
  }

  if (loading || !settings) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Settings ⚙️</h1>
          <p className="text-gray-600">Configure service management</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportSettings}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <label className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="hidden"
            />
          </label>
          
          <button
            onClick={fetchStats}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Services</p>
              <p className="text-2xl font-bold text-blue-800">{stats.totalServices}</p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Active Services</p>
              <p className="text-2xl font-bold text-green-800">{stats.activeServices}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Categories</p>
              <p className="text-2xl font-bold text-purple-800">{stats.categories}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-purple-600" />
            General Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Duration (minutes)
              </label>
              <input
                type="number"
                value={settings.defaultDuration}
                onChange={(e) => setSettings({ ...settings, defaultDuration: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Category
              </label>
              <select
                value={settings.defaultCategory}
                onChange={(e) => setSettings({ ...settings, defaultCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {settings.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApproval"
                  checked={settings.autoApproval}
                  onChange={(e) => setSettings({ ...settings, autoApproval: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="autoApproval" className="ml-2 text-sm text-gray-700">
                  Auto-approve new services
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowBulkUpload"
                  checked={settings.allowBulkUpload}
                  onChange={(e) => setSettings({ ...settings, allowBulkUpload: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="allowBulkUpload" className="ml-2 text-sm text-gray-700">
                  Allow bulk upload
                </label>
              </div>
            </div>
            
            {settings.allowBulkUpload && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Bulk Upload Size
                </label>
                <input
                  type="number"
                  value={settings.maxBulkUploadSize}
                  onChange={(e) => setSettings({ ...settings, maxBulkUploadSize: parseInt(e.target.value) || 100 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
              </div>
            )}
          </div>
        </div>

        {/* Categories Management */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="w-5 h-5 mr-2 text-purple-600" />
            Categories
          </h2>
          
          <div className="space-y-3">
            {settings.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{category}</span>
                {settings.categories.length > 1 && (
                  <button
                    onClick={() => handleRemoveCategory(category)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            
            <button
              onClick={handleAddCategory}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-purple-400 hover:text-purple-600 transition-colors text-sm"
            >
              + Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default ServiceSettingsCompact;