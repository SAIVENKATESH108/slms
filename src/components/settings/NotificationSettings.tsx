import React from 'react';
import { Settings } from '../../types/Settings';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Bell, MessageCircle, Mail, CreditCard, Calendar, Shield, Smartphone, Globe } from 'lucide-react';
import Card from '../ui/Card';

interface NotificationSettingsProps {
  settings: Settings;
  onUpdate: (field: string, value: any) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onUpdate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-10">
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl mb-6 shadow-xl">
            <Bell className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Notification Settings
          </h1>
          <p className="text-gray-600 text-lg">Configure how you want to receive notifications and alerts</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Notification Preferences Card */}
        <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-100 p-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            Notification Preferences
          </h3>
          <div className="space-y-8">
            {/* WhatsApp Notifications */}
            <div className="bg-white/60 rounded-xl p-6 border border-green-200/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <ToggleSwitch
                    enabled={settings.whatsappNotifications}
                    onChange={(value) => onUpdate('whatsappNotifications', value)}
                    label="WhatsApp Notifications"
                    description="Send notifications via WhatsApp Business API"
                  />
                </div>
              </div>
              
              {settings.whatsappNotifications && (
                <div className="ml-12 mt-4 p-4 bg-green-50/50 rounded-lg border border-green-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-green-600" />
                    WhatsApp API Key
                  </label>
                  <input
                    type="password"
                    value={settings.whatsappApiKey}
                    onChange={(e) => onUpdate('whatsappApiKey', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80"
                    placeholder="Enter WhatsApp Business API key"
                  />
                </div>
              )}
            </div>

            {/* Email Reports */}
            <div className="bg-white/60 rounded-xl p-6 border border-blue-200/50">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <ToggleSwitch
                    enabled={settings.emailReports}
                    onChange={(value) => onUpdate('emailReports', value)}
                    label="Email Reports"
                    description="Receive daily/weekly business reports via email"
                  />
                </div>
              </div>
            </div>

            {/* Payment Alerts */}
            <div className="bg-white/60 rounded-xl p-6 border border-purple-200/50">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <ToggleSwitch
                    enabled={settings.paymentAlerts}
                    onChange={(value) => onUpdate('paymentAlerts', value)}
                    label="Payment Alerts"
                    description="Get notified for payment success/failure"
                  />
                </div>
              </div>
            </div>

            {/* Appointment Alerts */}
            <div className="bg-white/60 rounded-xl p-6 border border-orange-200/50">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <ToggleSwitch
                    enabled={settings.appointmentAlerts}
                    onChange={(value) => onUpdate('appointmentAlerts', value)}
                    label="Appointment Alerts"
                    description="Notifications for bookings and cancellations"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotificationSettings;