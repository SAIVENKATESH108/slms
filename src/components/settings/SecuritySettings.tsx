import React, { useState } from 'react';
import { 
  Shield, 
  Key, 
  Clock, 
  Lock, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Copy, 
  AlertTriangle,
  Activity,
  Database,
  Bell,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { SecuritySettings as SecuritySettingsType } from '../../types/settings';
import ToggleSwitch from '../ui/ToggleSwitch';

interface SecuritySettingsProps {
  settings: SecuritySettingsType;
  onUpdate: (field: string, value: any, subsection?: string) => void;
  onGenerateApiKey: (name: string, permissions: string[]) => any;
  onRevokeApiKey: (keyId: string) => void;
  onDeleteApiKey: (keyId: string) => void;
  onClearAccessLogs: () => void;
  onSetMessage: (message: { type: 'success' | 'error', text: string }) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  onUpdate,
  onGenerateApiKey,
  onRevokeApiKey,
  onDeleteApiKey,
  onClearAccessLogs,
  onSetMessage
}) => {
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());

  const availablePermissions = [
    'read:appointments',
    'write:appointments',
    'read:customers',
    'write:customers',
    'read:services',
    'write:services',
    'read:staff',
    'write:staff',
    'read:payments',
    'write:payments',
    'read:reports',
    'admin:settings'
  ];

  const handleGenerateApiKey = () => {
    if (!newApiKeyName.trim()) {
      onSetMessage({ type: 'error', text: 'Please enter a name for the API key' });
      return;
    }
    if (selectedPermissions.length === 0) {
      onSetMessage({ type: 'error', text: 'Please select at least one permission' });
      return;
    }

    onGenerateApiKey(newApiKeyName, selectedPermissions);
    setNewApiKeyName('');
    setSelectedPermissions([]);
    setShowApiKeyForm(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onSetMessage({ type: 'success', text: 'Copied to clipboard' });
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleApiKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleApiKeys(newVisible);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Authentication & Access */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="mr-2" size={20} />
          Authentication & Access
        </h3>
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <ToggleSwitch
            enabled={settings.twoFactorEnabled}
            onChange={(value) => onUpdate('twoFactorEnabled', value)}
            label="Two-Factor Authentication"
            description="Require a verification code in addition to your password"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <select
              value={settings.sessionTimeout}
              onChange={(e) => onUpdate('sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
              <option value={480}>8 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="mr-2" size={20} />
          Password Policy
        </h3>
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Length
              </label>
              <input
                type="number"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => onUpdate('minLength', parseInt(e.target.value) || 8, 'passwordPolicy')}
                min="6"
                max="32"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Expiry (days)
              </label>
              <select
                value={settings.passwordPolicy.passwordExpiry}
                onChange={(e) => onUpdate('passwordExpiry', parseInt(e.target.value), 'passwordPolicy')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
                <option value={0}>Never</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            <ToggleSwitch
              enabled={settings.passwordPolicy.requireUppercase}
              onChange={(value) => onUpdate('requireUppercase', value, 'passwordPolicy')}
              label="Require Uppercase Letters"
              description="Password must contain at least one uppercase letter"
            />
            <ToggleSwitch
              enabled={settings.passwordPolicy.requireLowercase}
              onChange={(value) => onUpdate('requireLowercase', value, 'passwordPolicy')}
              label="Require Lowercase Letters"
              description="Password must contain at least one lowercase letter"
            />
            <ToggleSwitch
              enabled={settings.passwordPolicy.requireNumbers}
              onChange={(value) => onUpdate('requireNumbers', value, 'passwordPolicy')}
              label="Require Numbers"
              description="Password must contain at least one number"
            />
            <ToggleSwitch
              enabled={settings.passwordPolicy.requireSpecialChars}
              onChange={(value) => onUpdate('requireSpecialChars', value, 'passwordPolicy')}
              label="Require Special Characters"
              description="Password must contain at least one special character"
            />
          </div>
        </div>
      </div>

      {/* Login Security */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="mr-2" size={20} />
          Login Security
        </h3>
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.loginAttempts.maxAttempts}
                onChange={(e) => onUpdate('maxAttempts', parseInt(e.target.value) || 5, 'loginAttempts')}
                min="3"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lockout Duration (minutes)
              </label>
              <select
                value={settings.loginAttempts.lockoutDuration}
                onChange={(e) => onUpdate('lockoutDuration', parseInt(e.target.value), 'loginAttempts')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Management */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Key className="mr-2" size={20} />
            API Keys
          </h3>
          <button
            onClick={() => setShowApiKeyForm(!showApiKeyForm)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Generate API Key</span>
          </button>
        </div>

        {showApiKeyForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Generate New API Key</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input
                  type="text"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                  placeholder="e.g., Mobile App Integration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleGenerateApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Generate Key
                </button>
                <button
                  onClick={() => setShowApiKeyForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {settings.apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No API keys generated yet</p>
              <p className="text-sm">Click "Generate API Key" to create your first key</p>
            </div>
          ) : (
            settings.apiKeys.map(apiKey => (
              <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                    <p className="text-sm text-gray-500">
                      Created: {formatDate(apiKey.createdAt)}
                      {apiKey.lastUsed && ` • Last used: ${formatDate(apiKey.lastUsed)}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      apiKey.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {apiKey.active ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type={visibleApiKeys.has(apiKey.id) ? 'text' : 'password'}
                      value={apiKey.key}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    />
                    <button
                      onClick={() => toggleApiKeyVisibility(apiKey.id)}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {visibleApiKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key)}
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.map(permission => (
                      <span key={permission} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {apiKey.active ? (
                    <button
                      onClick={() => onRevokeApiKey(apiKey.id)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      Revoke
                    </button>
                  ) : (
                    <button
                      onClick={() => onDeleteApiKey(apiKey.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center space-x-1"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Access Logs */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="mr-2" size={20} />
            Access Logs
          </h3>
          <button
            onClick={onClearAccessLogs}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Clear Logs</span>
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {settings.accessLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No access logs available</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">IP Address</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.accessLogs.map(log => (
                    <tr key={log.id} className="border-t border-gray-200">
                      <td className="px-4 py-2">{formatDate(log.timestamp)}</td>
                      <td className="px-4 py-2">{log.action}</td>
                      <td className="px-4 py-2 font-mono">{log.ipAddress}</td>
                      <td className="px-4 py-2">
                        {log.success ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <XCircle size={16} className="text-red-600" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="mr-2" size={20} />
          Data Retention
        </h3>
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Logs (days)
              </label>
              <select
                value={settings.dataRetention.logRetentionDays}
                onChange={(e) => onUpdate('logRetentionDays', parseInt(e.target.value), 'dataRetention')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backups (days)
              </label>
              <select
                value={settings.dataRetention.backupRetentionDays}
                onChange={(e) => onUpdate('backupRetentionDays', parseInt(e.target.value), 'dataRetention')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
                <option value={1095}>3 years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Data (days)
              </label>
              <select
                value={settings.dataRetention.customerDataRetentionDays}
                onChange={(e) => onUpdate('customerDataRetentionDays', parseInt(e.target.value), 'dataRetention')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
                <option value={1095}>3 years</option>
                <option value={1825}>5 years</option>
                <option value={3650}>10 years</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Encryption */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="mr-2" size={20} />
          Data Encryption
        </h3>
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <ToggleSwitch
            enabled={settings.encryption.encryptSensitiveData}
            onChange={(value) => onUpdate('encryptSensitiveData', value, 'encryption')}
            label="Encrypt Sensitive Data"
            description="Encrypt customer data, payment information, and other sensitive data"
          />
          <ToggleSwitch
            enabled={settings.encryption.encryptBackups}
            onChange={(value) => onUpdate('encryptBackups', value, 'encryption')}
            label="Encrypt Backups"
            description="Encrypt all backup files for additional security"
          />
        </div>
      </div>

      {/* Security Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="mr-2" size={20} />
          Security Notifications
        </h3>
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <ToggleSwitch
            enabled={settings.notifications.securityAlerts}
            onChange={(value) => onUpdate('securityAlerts', value, 'notifications')}
            label="Security Alerts"
            description="Get notified about security events and potential threats"
          />
          <ToggleSwitch
            enabled={settings.notifications.loginNotifications}
            onChange={(value) => onUpdate('loginNotifications', value, 'notifications')}
            label="Login Notifications"
            description="Receive notifications for all login attempts"
          />
          <ToggleSwitch
            enabled={settings.notifications.dataExportNotifications}
            onChange={(value) => onUpdate('dataExportNotifications', value, 'notifications')}
            label="Data Export Notifications"
            description="Get notified when data is exported or downloaded"
          />
          <ToggleSwitch
            enabled={settings.notifications.suspiciousActivityAlerts}
            onChange={(value) => onUpdate('suspiciousActivityAlerts', value, 'notifications')}
            label="Suspicious Activity Alerts"
            description="Receive alerts for unusual or suspicious account activity"
          />
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;