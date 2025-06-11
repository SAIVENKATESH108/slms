
import React, { useState, useEffect } from 'react';
import { Camera, Upload, Eye, EyeOff, LogOut, User, Mail, Phone, Shield, Calendar, Key, CheckCircle, AlertTriangle, Loader, Save, RefreshCw, Edit3, UserCheck, Lock, Image } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore, UserSettings } from '../../stores/userStore';
import Card from '../ui/Card';
import Button from '../ui/Button';

const AccountSettings: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    settings, 
    loading, 
    error, 
    fetchUserSettings, 
    updateUserProfile, 
    uploadProfilePicture, 
    signOutUser 
  } = useUserStore();
  
  const [localSettings, setLocalSettings] = useState<UserSettings>({
    ownerName: '',
    email: '',
    mobile: '',
    currentPassword: '',
    newPassword: '',
    profilePicture: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user settings on component mount
  useEffect(() => {
    if (user) {
      fetchUserSettings();
    }
  }, [user, fetchUserSettings]);

  // Update local settings when store settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        ownerName: settings.ownerName || '',
        email: settings.email || '',
        mobile: settings.mobile || '',
        currentPassword: '',
        newPassword: '',
        profilePicture: settings.profilePicture || ''
      });
    }
  }, [settings]);

  // Show error notifications from the store
  useEffect(() => {
    if (error) {
      showNotification('error', error);
    }
  }, [error]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!localSettings.ownerName.trim()) {
      errors.ownerName = 'Owner name is required';
    }
    
    if (!localSettings.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(localSettings.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!localSettings.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(localSettings.mobile)) {
      errors.mobile = 'Mobile number is invalid';
    }
    
    if (localSettings.newPassword) {
      if (!localSettings.currentPassword) {
        errors.currentPassword = 'Current password is required to change password';
      }
      if (localSettings.newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      } else if (!/[A-Z]/.test(localSettings.newPassword)) {
        errors.newPassword = 'Password should contain at least one uppercase letter';
      } else if (!/[0-9]/.test(localSettings.newPassword)) {
        errors.newPassword = 'Password should contain at least one number';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = (field: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (validateForm()) {
      setIsSaving(true);
      try {
        await updateUserProfile(localSettings);
        
        // Clear password fields after update attempt
        if (localSettings.newPassword) {
          setLocalSettings(prev => ({ ...prev, newPassword: '', currentPassword: '' }));
          setShowPassword(false);
        }
        
        // Check if there was a partial success (profile updated but password failed)
        if (error && error.includes('password requires a recent login')) {
          showNotification('success', 'Profile information updated successfully!');
          // The error about password will be shown separately by the useEffect that watches for errors
        } else {
          showNotification('success', 'Profile updated successfully!');
        }
      } catch (error: any) {
        // For Firebase auth errors, provide more user-friendly messages
        let errorMessage = error.message || 'Failed to update profile';
        
        if (errorMessage.includes('auth/requires-recent-login') || 
            errorMessage.includes('recent login')) {
          errorMessage = 'For security reasons, this action requires a recent login. Please sign out and sign back in.';
        } else if (errorMessage.includes('auth/email-already-in-use')) {
          errorMessage = 'This email is already in use by another account.';
        } else if (errorMessage.includes('auth/invalid-email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (errorMessage.includes('auth/weak-password')) {
          errorMessage = 'Password should be at least 6 characters.';
        }
        
        showNotification('error', errorMessage);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'File size must be less than 5MB');
        return;
      }
      
      setUploadingImage(true);
      try {
        await uploadProfilePicture(file);
        showNotification('success', 'Profile picture updated successfully!');
      } catch (error: any) {
        showNotification('error', error.message || 'Failed to upload image');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      showNotification('success', 'Signed out successfully!');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to sign out');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header */} 
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl mb-6 shadow-xl">
            <User className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <UserCheck className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600 text-lg">Manage your profile and account preferences</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Loading State */}
        {loading && !isSaving && !uploadingImage && (
          <div className="flex justify-center items-center mb-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-md flex items-center">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mr-3" />
              <span className="text-gray-700">Loading your profile...</span>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-xl shadow-md ${
            notification.type === 'success' 
              ? 'bg-green-50 border-l-4 border-green-500 text-green-700' 
              : 'bg-red-50 border-l-4 border-red-500 text-red-700'
          } transition-all duration-300`}>
            <div className="flex items-center">
              {notification.type === 'success' ? 
                <CheckCircle className="w-5 h-5 mr-2" /> : 
                <AlertTriangle className="w-5 h-5 mr-2" />
              }
              {notification.message}
            </div>
          </div>
        )}

        {!user ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Not Signed In</h3>
            <p className="text-gray-600">Please sign in to access your account settings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Image className="w-5 h-5 text-blue-600" />
              </div>
              Profile Picture
            </h3>
            
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  {localSettings.profilePicture ? (
                    <img src={localSettings.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-white" />
                  )}
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="profile-upload"
                disabled={uploadingImage || loading}
              />
              <label
                htmlFor="profile-upload"
                className={`mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg ${
                  (uploadingImage || loading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingImage ? (
                  <>
                    <Loader size={16} className="mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Change Picture
                  </>
                )}
              </label>
            </div>
          </Card>

            {/* Account Info */}
            {user && (
              <Card className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Account Info
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Joined:</span>
                    <span className="ml-2 font-medium">{new Date(user.metadata.creationTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Key className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">ID:</span>
                    <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{user.uid}</span>
                  </div>
                </div>
              </Card>
            )}
            </div>

            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-100 p-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Edit3 className="w-6 h-6 text-blue-600" />
                  </div>
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <div className="p-1 bg-blue-100 rounded mr-2">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      Owner Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={localSettings.ownerName}
                        onChange={(e) => handleUpdate('ownerName', e.target.value)}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm ${
                          formErrors.ownerName ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                        placeholder="Enter your full name"
                        required
                        disabled={loading}
                      />
                    </div>
                    {formErrors.ownerName && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {formErrors.ownerName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <div className="p-1 bg-green-100 rounded mr-2">
                        <Mail className="w-4 h-4 text-green-600" />
                      </div>
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={localSettings.email}
                        onChange={(e) => handleUpdate('email', e.target.value)}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm ${
                          formErrors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-green-300'
                        }`}
                        placeholder="your.email@example.com"
                        required
                        disabled={loading}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      value={localSettings.mobile}
                      onChange={(e) => handleUpdate('mobile', e.target.value)}
                      placeholder="+91 9876543210"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        formErrors.mobile ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/50'
                      }`}
                      required
                      disabled={loading}
                    />
                    {formErrors.mobile && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={localSettings.currentPassword}
                      onChange={(e) => handleUpdate('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        formErrors.currentPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/50'
                      }`}
                      disabled={loading}
                    />
                    {formErrors.currentPassword && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.currentPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={localSettings.newPassword}
                        onChange={(e) => handleUpdate('newPassword', e.target.value)}
                        placeholder="Enter new password"
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                          formErrors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/50'
                        }`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formErrors.newPassword ? (
                      <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
                    ) : (
                      <p className="text-gray-500 text-xs mt-1">
                        {localSettings.newPassword 
                          ? "Password must have at least 6 characters, 1 uppercase letter, and 1 number" 
                          : "Leave blank to keep your current password"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleSave}
                    disabled={loading || isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader className="animate-spin mr-2" size={18} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={18} />
                        Save Changes
                      </>
                    )}
                  </Button>
  
                  <Button
                    variant="danger"
                    onClick={handleSignOut}
                    disabled={loading}
                  >
                    <LogOut size={18} className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;