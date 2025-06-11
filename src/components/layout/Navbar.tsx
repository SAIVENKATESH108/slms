import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  Menu, 
  X, 
  Scissors,
  Home,
  Users,
  Building,
  DollarSign,
  BarChart3,
  Settings as SettingsIcon,
  UserCog,
  Calendar
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore } from '../../stores/userStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const role = useUserStore((state) => state.role);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    const isCurrentPath = location.pathname === path || 
      (path === '/dashboard' && location.pathname === '/');
    
    return isCurrentPath ? 
      'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105' : 
      'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 hover:shadow-md';
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'employee'] },
    { path: '/clients', label: 'Clients', icon: Users, roles: ['admin', 'manager', 'employee'] },
    { path: '/appointment', label: 'Book Appointment', icon: Calendar, roles: ['admin', 'manager', 'employee'] },
    { path: '/flats', label: 'Flats', icon: Building, roles: ['admin', 'manager', 'employee'] },
    { path: '/finances', label: 'Finances', icon: DollarSign, roles: ['admin', 'manager', 'employee'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { path: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !role || item.roles.includes(role)
  );

  return (
    <>
      {/* Sidebar Navigation (Desktop) */}
      <aside className="bg-white shadow-xl fixed left-0 top-0 bottom-0 w-64 hidden md:block z-10 transition-all duration-300 border-r border-gray-100">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                BeautiFlow
              </h1>
              <p className="text-xs text-gray-500">Business Management</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`px-4 py-3 rounded-xl flex items-center space-x-3 transition-all duration-200 font-medium ${isActive(item.path)}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
          {user && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg w-full transition duration-200 text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const role = useUserStore((state) => state.role);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    const isCurrentPath = location.pathname === path || 
      (path === '/dashboard' && location.pathname === '/');
    
    return isCurrentPath ? 
      'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' : 
      'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700';
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'employee'] },
    { path: '/clients', label: 'Clients', icon: Users, roles: ['admin', 'manager', 'employee'] },
    { path: '/appointment', label: 'Book Appointment', icon: Calendar, roles: ['admin', 'manager', 'employee'] },
    { path: '/flats', label: 'Flats', icon: Building, roles: ['admin', 'manager', 'employee'] },
    { path: '/finances', label: 'Finances', icon: DollarSign, roles: ['admin', 'manager', 'employee'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { path: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !role || item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="bg-white shadow-lg fixed top-0 left-0 w-full z-20 md:hidden border-b border-gray-100">
        <div className="
          px-4 py-3 flex justify-between items-center
          /* Mobile-specific adjustments */
          iphone-se:px-2 iphone-se:py-2
          galaxy-s8:px-2 galaxy-s8:py-2
          galaxy-fold:px-1 galaxy-fold:py-2
          iphone-xr:px-3 iphone-xr:py-3
          iphone-12-pro:px-3 iphone-12-pro:py-3
          iphone-14-pro-max:px-4 iphone-14-pro-max:py-3
          pixel-7:px-3 pixel-7:py-3
          galaxy-s20:px-3 galaxy-s20:py-3
          galaxy-a51:px-3 galaxy-a51:py-3
          surface-duo:px-4 surface-duo:py-3
        ">
          <div className="flex items-center space-x-3">
            <div className="
              p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md
              iphone-se:p-1 galaxy-s8:p-1 galaxy-fold:p-1
            ">
              <Scissors className="
                h-5 w-5 text-white
                iphone-se:h-4 iphone-se:w-4
                galaxy-s8:h-4 galaxy-s8:w-4
                galaxy-fold:h-4 galaxy-fold:w-4
              " />
            </div>
            <div>
              <h1 className="
                text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent
                iphone-se:text-base galaxy-s8:text-base galaxy-fold:text-base
                iphone-xr:text-lg iphone-12-pro:text-lg iphone-14-pro-max:text-xl
                pixel-7:text-lg galaxy-s20:text-lg galaxy-a51:text-lg
                surface-duo:text-lg
              ">
                BeautiFlow
              </h1>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="
              p-2 rounded-xl text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 shadow-sm
              iphone-se:p-1 galaxy-s8:p-1 galaxy-fold:p-1
            "
          >
            {isOpen ? 
              <X className="
                h-6 w-6
                iphone-se:h-5 iphone-se:w-5
                galaxy-s8:h-5 galaxy-s8:w-5
                galaxy-fold:h-5 galaxy-fold:w-5
              " /> : 
              <Menu className="
                h-6 w-6
                iphone-se:h-5 iphone-se:w-5
                galaxy-s8:h-5 galaxy-s8:w-5
                galaxy-fold:h-5 galaxy-fold:w-5
              " />
            }
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Menu (when open) */}
      {isOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="
            absolute top-0 left-0 bottom-0 bg-white shadow-2xl z-40 flex flex-col
            w-80 max-w-[85vw]
            iphone-se:w-72 iphone-se:max-w-[90vw]
            galaxy-s8:w-72 galaxy-s8:max-w-[90vw]
            galaxy-fold:w-64 galaxy-fold:max-w-[95vw]
            iphone-xr:w-80 iphone-xr:max-w-[85vw]
            iphone-12-pro:w-80 iphone-12-pro:max-w-[85vw]
            iphone-14-pro-max:w-80 iphone-14-pro-max:max-w-[80vw]
            pixel-7:w-80 pixel-7:max-w-[85vw]
            galaxy-s20:w-80 galaxy-s20:max-w-[85vw]
            galaxy-a51:w-80 galaxy-a51:max-w-[85vw]
            surface-duo:w-80 surface-duo:max-w-[75vw]
          ">
            {/* Mobile Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <Scissors className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                      BeautiFlow
                    </h1>
                    <p className="text-xs text-gray-500">Business Management</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto min-h-0">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={`px-4 py-3 rounded-xl flex items-center space-x-3 transition-all duration-200 font-medium ${isActive(item.path)}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile User Section */}
            {user && (
              <div className="
                flex-shrink-0 border-t border-gray-100 bg-gray-50 safe-area-pb
                p-4
                iphone-se:p-3 galaxy-s8:p-3 galaxy-fold:p-2
                iphone-xr:p-4 iphone-12-pro:p-4 iphone-14-pro-max:p-4
                pixel-7:p-4 galaxy-s20:p-4 galaxy-a51:p-4
                surface-duo:p-4
              ">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="
                      w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center
                      iphone-se:w-8 iphone-se:h-8 galaxy-s8:w-8 galaxy-s8:h-8 galaxy-fold:w-8 galaxy-fold:h-8
                    ">
                      <span className="
                        text-white font-semibold
                        iphone-se:text-sm galaxy-s8:text-sm galaxy-fold:text-sm
                      ">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="
                        text-sm font-medium text-gray-900 truncate
                        iphone-se:text-xs galaxy-s8:text-xs galaxy-fold:text-xs
                      ">
                        {user.displayName || 'User'}
                      </p>
                      <p className="
                        text-xs text-gray-500 truncate
                        iphone-se:text-xs galaxy-s8:text-xs galaxy-fold:text-xs
                      ">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="
                      flex items-center space-x-2 text-red-600 hover:bg-red-50 rounded-lg w-full transition duration-200 font-medium
                      px-3 py-2
                      iphone-se:px-2 iphone-se:py-2 iphone-se:text-sm
                      galaxy-s8:px-2 galaxy-s8:py-2 galaxy-s8:text-sm
                      galaxy-fold:px-2 galaxy-fold:py-1 galaxy-fold:text-sm
                    "
                  >
                    <LogOut className="
                      h-4 w-4
                      iphone-se:h-4 iphone-se:w-4
                      galaxy-s8:h-4 galaxy-s8:w-4
                      galaxy-fold:h-4 galaxy-fold:w-4
                    " />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;