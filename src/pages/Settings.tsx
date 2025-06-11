import React, { useState } from 'react';
import {
  User,
  Store,
  Users,
  Scissors,
  Bell,
  Palette,
  Download,
  Shield,
  Wrench,
  Save,
  CheckCircle,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import AccountSettings from '../components/settings/AccountSettings';
import BusinessSettings from '../components/settings/BusinessSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SystemSettings from '../components/settings/SystemSetting';
// import StaffSettings from '../components/settings/StaffSettings'; // Removed as part of employee/staff deletion
import ServicesSettings from '../components/settings/ServicesSettings';
import BackupSettings from '../components/settings/BackupSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import ClientManagement from '../components/settings/ClientManagement';
import TransactionManagement from '../components/settings/TransactionManagement';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const {
    settings,
    user,
    loading,
    message,
    hasChanges,
    updateSettings,
    updateSecuritySettings,
    generateApiKey,
    revokeApiKey,
    deleteApiKey,
    clearAccessLogs,
    saveSettings,
    signOut,
    exportData,
    resetSettings,
    setMessage,
    canAccessSharedSettings
  } = useSettings();

  const handleFileUpload = async (file: File, field: string) => {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        updateSettings(field, e.target?.result);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to upload file' 
      });
    }
  };

  const handleImport = (importedData: any) => {
    try {
      if (importedData.settings) {
        Object.entries(importedData.settings).forEach(([key, value]) => {
          updateSettings(key, value);
        });
        setMessage({ type: 'success', text: 'Settings imported successfully' });
      } else {
        throw new Error('Invalid settings file format');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to import settings' 
      });
    }
  };

  const tabs = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'business', name: 'Business', icon: Store },
    { id: 'clients', name: 'Clients', icon: Users },
    { id: 'transactions', name: 'Transactions', icon: Receipt },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'system', name: 'System', icon: Palette },
    // { id: 'staff', name: 'Staff', icon: Users }, // Removed as part of employee/staff deletion
    { id: 'services', name: 'Services', icon: Scissors },
    { id: 'backup', name: 'Backup', icon: Download },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <AccountSettings
            settings={settings}
            user={user}
            loading={loading}
            onUpdate={updateSettings}
            onSignOut={signOut}
            onFileUpload={handleFileUpload}
          />
        );
      case 'business':
        return <BusinessSettings settings={settings} onUpdate={updateSettings} />;
      case 'clients':
        return <ClientManagement onSetMessage={setMessage} />;
      case 'transactions':
        return <TransactionManagement onSetMessage={setMessage} />;
      case 'notifications':
        return <NotificationSettings settings={settings} onUpdate={updateSettings} />;
      case 'system':
        return <SystemSettings settings={settings} onUpdate={updateSettings} />;
      // case 'staff':
      //   return <StaffSettings settings={settings} onUpdate={updateSettings} />; // Removed as part of employee/staff deletion
      case 'services':
        return <ServicesSettings settings={settings} onUpdate={updateSettings} />;
      case 'backup':
        return (
          <BackupSettings
            onExport={exportData}
            onImport={handleImport}
            onReset={resetSettings}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            settings={settings.security}
            onUpdate={updateSecuritySettings}
            onGenerateApiKey={generateApiKey}
            onRevokeApiKey={revokeApiKey}
            onDeleteApiKey={deleteApiKey}
            onClearAccessLogs={clearAccessLogs}
            onSetMessage={setMessage}
          />
        );
      default:
        return (
          <div className="py-8 md:py-12 text-center px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-100 mb-4">
              <Wrench className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            </div>
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Under Construction</h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm md:text-base">
              This section is currently being developed and will be available soon.
            </p>
          </div>
        );
    }
  };

  if (loading && !user) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-8 md:py-12">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="w-full py-4 md:py-6">
        <div className="mb-6 md:mb-8 px-4 md:px-0">
          <div className="flex items-center space-x-3 md:space-x-4 mb-4">
            <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Wrench size={24} className="text-white md:w-7 md:h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Customize your business management experience
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 md:mb-6 mx-4 md:mx-0 p-3 md:p-4 rounded-lg flex items-center space-x-2 md:space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={18} className="md:w-5 md:h-5 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="md:w-5 md:h-5 flex-shrink-0" />
            )}
            <span className="text-sm md:text-base">{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-100 overflow-hidden mx-4 md:mx-0">
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <nav className="flex space-x-1 px-3 md:px-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 md:py-4 px-2 md:px-4 font-medium text-xs md:text-sm flex items-center space-x-1 md:space-x-2 whitespace-nowrap rounded-t-lg transition-all duration-200 flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-white text-purple-600 shadow-sm border-b-2 border-purple-500 transform -translate-y-0.5'
                        : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Icon size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 md:p-6">
            {renderTabContent()}
          </div>

          <div className="border-t border-gray-100 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              {hasChanges ? (
                <>
                  <AlertCircle size={14} className="text-amber-500 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm text-amber-600 font-medium">You have unsaved changes</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} className="text-green-500 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm text-green-600 font-medium">All changes saved</span>
                </>
              )}
            </div>
            <button
              onClick={saveSettings}
              disabled={loading || !hasChanges}
              className={`w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-200 text-sm md:text-base ${
                hasChanges
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Save size={14} className="md:w-4 md:h-4" />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
