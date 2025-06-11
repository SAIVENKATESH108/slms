import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  enabled, 
  onChange, 
  label, 
  description, 
  disabled = false 
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
          enabled ? 'bg-purple-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="switch"
        aria-checked={enabled}
      >
        <span className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
      </button>
    </div>
  );
};

export default ToggleSwitch;