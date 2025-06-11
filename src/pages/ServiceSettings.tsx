import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Save, 
  Upload, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  Database,
  Users,
  Shield,
  DollarSign
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { authService } from '../services/AuthService';
import { serviceManagementService, ServiceSettings as ServiceSettingsType } from '../services/serviceManagementService';

// ServiceSettings interface is now imported from serviceManagementService

const defaultSettings: ServiceSettingsType = {
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

const ServiceSettings = () => {
  const { user } = useAuthStore();
  const { role } = useUserStore();
  const [settings, setSettings] = useState<ServiceSettingsType>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    categories: 0,
    lastUpdated: null as Date | null
  });

  // Check if user can access service settings
  const canAccessSettings = () => {
    return role === 'admin' || role === 'manager';
  };

  // Fetch service settings
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

  // Fetch service statistics
  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const statsData = await serviceManagementService.getServiceStats();
      const services = await serviceManagementService.getAllServices();
      
      let lastUpdated: Date | null = null;
      services.forEach(service => {
        if (service.updatedAt && service.updatedAt.toDate) {
          const updatedDate = service.updatedAt.toDate();
          if (!lastUpdated || updatedDate > lastUpdated) {
            lastUpdated = updatedDate;
          }
        }
      });
      
      setStats({
        totalServices: statsData.totalServices,
        activeServices: statsData.activeServices,
        categories: statsData.categoriesCount,
        lastUpdated
      });
    } catch (error) {
      console.error('Error fetching service stats:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, [user]);

  // Save settings
  const handleSaveSettings = async () => {
    if (!user || !canAccessSettings()) return;
    
    setSaving(true);
    try {
      const settingsRef = doc(firestore, 'serviceSettings', 'main');
      const { id, ...settingsData } = settings;
      
      await updateDoc(settingsRef, {
        ...settingsData,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Add new category
  const handleAddCategory = () => {
    const newCategory = prompt('Enter new category name:');
    if (newCategory && !settings.categories.includes(newCategory)) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory]
      });
    }
  };

  // Remove category
  const handleRemoveCategory = (category: string) => {
    if (settings.categories.length > 1) {
      setSettings({
        ...settings,
        categories: settings.categories.filter(c => c !== category)
      });
    }
  };

  // Export settings
  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'service-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import settings
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...importedSettings });
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

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Service Settings ⚙️
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Configure service management and permissions
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">📊 Total Services</p>
              <p className="text-2xl font-bold text-blue-800">{stats.totalServices}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">✅ Active Services</p>
              <p className="text-2xl font-bold text-green-800">{stats.activeServices}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">🏷️ Categories</p>
              <p className="text-2xl font-bold text-purple-800">{stats.categories}</p>
            </div>
            <Database className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">🕒 Last Updated</p>
              <p className="text-sm font-bold text-orange-800">
                {stats.lastUpdated ? stats.lastUpdated.toLocaleDateString() : 'Never'}
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        {/* Price Range Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
            Price Range
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Price (INR)
              </label>
              <input
                type="number"
                value={settings.priceRanges.min}
                onChange={(e) => setSettings({
                  ...settings,
                  priceRanges: { ...settings.priceRanges, min: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Price (INR)
              </label>
              <input
                type="number"
                value={settings.priceRanges.max}
                onChange={(e) => setSettings({
                  ...settings,
                  priceRanges: { ...settings.priceRanges, max: parseFloat(e.target.value) || 10000 }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-purple-600" />
            Permissions
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Services
              </label>
              <div className="space-y-1">
                {['admin', 'manager', 'employee'].map(role => (
                  <div key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`view-${role}`}
                      checked={settings.permissions.viewServices.includes(role)}
                      onChange={(e) => {
                        const newPermissions = e.target.checked
                          ? [...settings.permissions.viewServices, role]
                          : settings.permissions.viewServices.filter(r => r !== role);
                        setSettings({
                          ...settings,
                          permissions: { ...settings.permissions, viewServices: newPermissions }
                        });
                      }}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor={`view-${role}`} className="ml-2 text-sm text-gray-700 capitalize">
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edit Services
              </label>
              <div className="space-y-1">
                {['admin', 'manager', 'employee'].map(role => (
                  <div key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`edit-${role}`}
                      checked={settings.permissions.editServices.includes(role)}
                      onChange={(e) => {
                        const newPermissions = e.target.checked
                          ? [...settings.permissions.editServices, role]
                          : settings.permissions.editServices.filter(r => r !== role);
                        setSettings({
                          ...settings,
                          permissions: { ...settings.permissions, editServices: newPermissions }
                        });
                      }}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor={`edit-${role}`} className="ml-2 text-sm text-gray-700 capitalize">
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
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

export default ServiceSettings;