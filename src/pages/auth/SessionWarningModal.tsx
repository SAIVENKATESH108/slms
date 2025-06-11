import React from 'react';
import { Clock, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface SessionWarningModalProps {
  show: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onSignOut: () => void;
  onDismiss: () => void;
}

const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  show,
  timeRemaining,
  onExtend,
  onSignOut,
  onDismiss
}) => {
  if (!show) return null;

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Session Expiring Soon
              </h3>
              <p className="text-sm text-gray-600">
                Your session will expire due to inactivity
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Time remaining: {formatTime(timeRemaining)}
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Click "Stay Signed In" to extend your session, or "Sign Out" to end your session now.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onExtend}
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Stay Signed In</span>
            </button>
            
            <button
              onClick={onSignOut}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            Dismiss (session will still expire)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;