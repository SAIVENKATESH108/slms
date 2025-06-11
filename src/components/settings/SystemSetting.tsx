import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Save, 
  X,
  Sparkles,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import { Settings } from '../../types/settings';
import { useThemeStore, PREDEFINED_THEMES, Theme, ThemeColors } from '../../stores/themeStore';
import ToggleSwitch from '../ui/ToggleSwitch';

interface SystemSettingsProps {
  settings: Settings;
  onUpdate: (field: string, value: any) => void;
}

interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, colors: ThemeColors, isDark: boolean) => void;
  editingTheme?: Theme | null;
}

const CustomThemeModal: React.FC<CustomThemeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingTheme 
}) => {
  const [themeName, setThemeName] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [colors, setColors] = useState<ThemeColors>({
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    accent: '#10B981',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    border: '#E5E7EB',
  });

  useEffect(() => {
    if (editingTheme) {
      setThemeName(editingTheme.name);
      setIsDark(editingTheme.isDark);
      setColors(editingTheme.colors);
    } else {
      setThemeName('');
      setIsDark(false);
      setColors({
        primary: '#8B5CF6',
        secondary: '#A78BFA',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text: '#111827',
        textSecondary: '#6B7280',
        accent: '#10B981',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        border: '#E5E7EB',
      });
    }
  }, [editingTheme, isOpen]);

  const handleSave = () => {
    if (themeName.trim()) {
      onSave(themeName.trim(), colors, isDark);
      onClose();
    }
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTheme ? 'Edit Custom Theme' : 'Create Custom Theme'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme Name
              </label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="My Custom Theme"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <ToggleSwitch
                enabled={isDark}
                onChange={setIsDark}
                label="Dark Theme"
                description="Enable dark mode for this theme"
              />
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Color Palette</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
                      className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Preview</h4>
            <div 
              className="p-4 rounded-lg border-2 border-dashed border-gray-300"
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              }}
            >
              <div 
                className="p-3 rounded-md mb-3"
                style={{ backgroundColor: colors.surface }}
              >
                <h5 style={{ color: colors.primary }} className="font-semibold mb-2">
                  Sample Card
                </h5>
                <p style={{ color: colors.textSecondary }} className="text-sm mb-2">
                  This is how your theme will look in the application.
                </p>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 rounded text-sm font-medium text-white"
                    style={{ backgroundColor: colors.primary }}
                  >
                    Primary
                  </button>
                  <button
                    className="px-3 py-1 rounded text-sm font-medium text-white"
                    style={{ backgroundColor: colors.accent }}
                  >
                    Accent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!themeName.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save size={16} />
            <span>{editingTheme ? 'Update' : 'Create'} Theme</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SystemSettings: React.FC<SystemSettingsProps> = ({ settings, onUpdate }) => {
  const { 
    currentTheme, 
    customThemes, 
    setTheme, 
    createCustomTheme, 
    updateCustomTheme, 
    deleteCustomTheme 
  } = useThemeStore();
  
  const [showCustomThemeModal, setShowCustomThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  const allThemes = [...PREDEFINED_THEMES, ...customThemes];

  const handleThemeSelect = (theme: Theme) => {
    setTheme(theme);
    onUpdate('selectedThemeId', theme.id);
    onUpdate('darkMode', theme.isDark);
  };

  const handleCreateCustomTheme = (name: string, colors: ThemeColors, isDark: boolean) => {
    const newTheme = createCustomTheme(name, colors, isDark);
    setTheme(newTheme);
    onUpdate('selectedThemeId', newTheme.id);
    onUpdate('darkMode', isDark);
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setShowCustomThemeModal(true);
  };

  const handleUpdateTheme = (name: string, colors: ThemeColors, isDark: boolean) => {
    if (editingTheme && 'isCustom' in editingTheme) {
      updateCustomTheme(editingTheme.id, { name, colors, isDark });
    }
    setEditingTheme(null);
  };

  const handleDeleteTheme = (themeId: string) => {
    if (window.confirm('Are you sure you want to delete this custom theme?')) {
      deleteCustomTheme(themeId);
    }
  };

  return (
    <div className="space-y-8">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Palette className="text-purple-600" size={20} />
          <span>Theme & Appearance</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {allThemes.map((theme) => (
            <div
              key={theme.id}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                currentTheme.id === theme.id
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleThemeSelect(theme)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {theme.isDark ? (
                    <Moon size={16} className="text-gray-600" />
                  ) : (
                    <Sun size={16} className="text-yellow-500" />
                  )}
                  <span className="font-medium text-gray-900">{theme.name}</span>
                </div>
                
                {('isCustom' in theme) && (
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTheme(theme);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTheme(theme.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-1 mb-2">
                {Object.entries(theme.colors).slice(0, 6).map(([key, color]) => (
                  <div
                    key={key}
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                    title={key}
                  />
                ))}
              </div>
              
              {currentTheme.id === theme.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
          
          <button
            onClick={() => setShowCustomThemeModal(true)}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex flex-col items-center justify-center space-y-2 text-gray-600 hover:text-purple-600"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Create Custom Theme</span>
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Sparkles className="text-purple-600" size={20} />
          <span>Advanced Customization</span>
        </h3>
        
        <div className="space-y-4">
          <ToggleSwitch
            enabled={settings.enableCustomColors || false}
            onChange={(value) => onUpdate('enableCustomColors', value)}
            label="Enable Custom Colors"
            description="Allow fine-tuning of individual color elements"
          />
          
          <ToggleSwitch
            enabled={settings.enableAnimations !== false}
            onChange={(value) => onUpdate('enableAnimations', value)}
            label="Enable Animations"
            description="Show smooth transitions and animations throughout the app"
          />
        </div>
      </div>

      {/* Localization */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Monitor className="text-purple-600" size={20} />
          <span>Localization & Format</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={settings.language}
              onChange={(e) => onUpdate('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => onUpdate('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="INR">₹ Indian Rupee (INR)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => onUpdate('dateFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
            <select
              value={settings.timeFormat}
              onChange={(e) => onUpdate('timeFormat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="12h">12 Hour (AM/PM)</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legacy Theme Color (for backward compatibility) */}
      {settings.enableCustomColors && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legacy Theme Color</h3>
          <div className="flex items-center space-x-3">
            <Palette size={16} className="text-gray-400" />
            <input
              type="color"
              value={settings.themeColor}
              onChange={(e) => onUpdate('themeColor', e.target.value)}
              className="w-12 h-12 border border-gray-300 rounded-md cursor-pointer"
            />
            <input
              type="text"
              value={settings.themeColor}
              onChange={(e) => onUpdate('themeColor', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="#8B5CF6"
            />
          </div>
        </div>
      )}

      <CustomThemeModal
        isOpen={showCustomThemeModal}
        onClose={() => {
          setShowCustomThemeModal(false);
          setEditingTheme(null);
        }}
        onSave={editingTheme ? handleUpdateTheme : handleCreateCustomTheme}
        editingTheme={editingTheme}
      />
    </div>
  );
};

export default SystemSettings;