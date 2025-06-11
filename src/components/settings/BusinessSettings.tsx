import React, { useState, useEffect } from 'react';
import { Settings, OperatingHours } from '../../types/settings';
import { useAuth } from '../../hooks/useAuth';
import { firestoreService } from '../../services/firestoreService';
import { Store, MapPin, Phone, Mail, Clock, Edit3, Save, Loader, CheckCircle, AlertTriangle, Building, Globe, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface BusinessSettingsProps {
  settings: Settings;
  onUpdate: (field: string, value: any, section?: string) => void;
}

const BusinessSettings: React.FC<BusinessSettingsProps> = ({ settings, onUpdate }) => {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (user?.uid) {
        setLoading(true);
        try {
          const fetchedSettings = await firestoreService.getBusinessSettings(user.uid);
          if (fetchedSettings) {
            setLocalSettings(fetchedSettings as Settings);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to load business settings');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSettings();
  }, [user]);

  const handleOperatingHoursChange = (day: string, field: string, value: any) => {
    if (!localSettings) return;
    const currentHours = localSettings.operatingHours[day];
    const updatedHours = { ...currentHours, [field]: value };
    const updatedOperatingHours = { ...localSettings.operatingHours, [day]: updatedHours };
    const updatedSettings = { ...localSettings, operatingHours: updatedOperatingHours };
    setLocalSettings(updatedSettings);
    onUpdate(day, updatedHours, 'operatingHours');
    saveSettings(updatedSettings);
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!localSettings) return;
    const updatedSettings = { ...localSettings, [field]: value };
    setLocalSettings(updatedSettings);
    onUpdate(field, value);
    saveSettings(updatedSettings);
  };

  const saveSettings = async (settingsToSave: Settings) => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }
    try {
      await firestoreService.updateBusinessSettings(user.uid, settingsToSave);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save business settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-md flex items-center">
              <Loader className="w-5 h-5 text-blue-600 animate-spin mr-3" />
              <span className="text-gray-700">Loading business settings...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">Error: {error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!localSettings) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl mb-6 shadow-xl">
            <Building className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
              <Store className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Business Settings
          </h1>
          <p className="text-gray-600 text-lg">Configure your business information and operating hours</p>
          <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-teal-600 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Edit Mode Toggle */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setEditMode(!editMode)}
            variant={editMode ? "secondary" : "primary"}
            className="flex items-center space-x-2"
          >
            {editMode ? (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Exit Edit</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Enable Edit Mode</span>
              </>
            )}
          </Button>
        </div>

        {/* Business Information Card */}
        <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-100 p-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            Business Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <div className="p-1 bg-blue-100 rounded mr-2">
                  <Store className="w-4 h-4 text-blue-600" />
                </div>
                Business Name *
              </label>
              <input
                type="text"
                value={localSettings.businessName}
                onChange={(e) => handleFieldChange('businessName', e.target.value)}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm ${
                  !editMode ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-200 hover:border-green-300'
                }`}
                placeholder="Enter your business name"
                required
                disabled={!editMode}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <div className="p-1 bg-purple-100 rounded mr-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                </div>
                Business Description
              </label>
              <textarea
                value={localSettings.businessDescription}
                onChange={(e) => handleFieldChange('businessDescription', e.target.value)}
                rows={4}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none ${
                  !editMode ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-200 hover:border-purple-300'
                }`}
                placeholder="Brief description of your salon services and specialties"
                disabled={!editMode}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <div className="p-1 bg-orange-100 rounded mr-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                </div>
                Business Address
              </label>
              <textarea
                value={localSettings.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                rows={3}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none ${
                  !editMode ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-200 hover:border-orange-300'
                }`}
                placeholder="Complete business address with city, state, and postal code"
                disabled={!editMode}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <div className="p-1 bg-indigo-100 rounded mr-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                </div>
                GST Number
              </label>
              <input
                type="text"
                value={localSettings.gstNumber}
                onChange={(e) => handleFieldChange('gstNumber', e.target.value)}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm ${
                  !editMode ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-200 hover:border-indigo-300'
                }`}
                placeholder="GST123456789"
                disabled={!editMode}
              />
            </div>
          </div>
        </Card>

        {/* Operating Hours Card */}
        <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100 p-8 mt-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            Operating Hours
          </h3>
          <div className="space-y-4">
            {Object.entries(localSettings.operatingHours).map(([day, hours]) => (
              <div key={day} className="bg-white/60 rounded-xl p-4 border border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-semibold text-gray-700 capitalize flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      {day}
                    </div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => handleOperatingHoursChange(day, 'closed', !e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                        disabled={!editMode}
                      />
                      <span className="text-sm font-medium text-gray-700">Open</span>
                    </label>
                  </div>
                  {!hours.closed && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                        className={`px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          !editMode ? 'bg-gray-50 cursor-not-allowed border-gray-200' : 'border-blue-200 hover:border-blue-300'
                        }`}
                        disabled={!editMode}
                      />
                      <span className="text-gray-500 font-medium">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                        className={`px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          !editMode ? 'bg-gray-50 cursor-not-allowed border-gray-200' : 'border-blue-200 hover:border-blue-300'
                        }`}
                        disabled={!editMode}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BusinessSettings;
