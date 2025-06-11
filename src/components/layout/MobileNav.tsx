import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  DollarSign, 
  BarChart2, 
  Building2,
  Menu
} from 'lucide-react';
import { useState } from 'react';
import { useUserStore } from '../../stores/userStore';

const MobileNav = () => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const role = useUserStore((state) => state.role);
  
  const getActiveClass = (path: string) => {
    const isActive = location.pathname === path || 
                    (path === '/' && location.pathname === '/dashboard');
    return isActive 
      ? 'text-purple-600 bg-purple-50' 
      : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50';
  };
  
  const mainNavItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/finances', icon: DollarSign, label: 'Finances' },
    { path: '/flats', icon: Building2, label: 'Flats' },
  ];

  const moreNavItems = [
    ...(role === 'admin' || role === 'manager' ? [{ path: '/reports', icon: BarChart2, label: 'Reports' }] : []),
    ...(role === 'admin' ? [
      { path: '/settings', icon: BarChart2, label: 'Settings' }
    ] : []),
  ];
  
  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black opacity-25"
            onClick={() => setShowMore(false)}
          />
          <div className="
            absolute bottom-16 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2
            iphone-se:bottom-14 iphone-se:left-2 iphone-se:right-2 iphone-se:p-1
            galaxy-s8:bottom-14 galaxy-s8:left-2 galaxy-s8:right-2 galaxy-s8:p-1
            galaxy-fold:bottom-14 galaxy-fold:left-1 galaxy-fold:right-1 galaxy-fold:p-1
            iphone-xr:bottom-16 iphone-xr:left-3 iphone-xr:right-3
            iphone-12-pro:bottom-16 iphone-12-pro:left-3 iphone-12-pro:right-3
            iphone-14-pro-max:bottom-18 iphone-14-pro-max:left-4 iphone-14-pro-max:right-4
            pixel-7:bottom-16 pixel-7:left-3 pixel-7:right-3
            galaxy-s20:bottom-16 galaxy-s20:left-3 galaxy-s20:right-3
            galaxy-a51:bottom-16 galaxy-a51:left-3 galaxy-a51:right-3
            surface-duo:bottom-18 surface-duo:left-6 surface-duo:right-6
          ">
            <div className="
              grid grid-cols-2 gap-2
              iphone-se:grid-cols-1 iphone-se:gap-1
              galaxy-s8:grid-cols-1 galaxy-s8:gap-1
              galaxy-fold:grid-cols-1 galaxy-fold:gap-1
              surface-duo:grid-cols-3
            ">
              {moreNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={`
                    flex flex-col items-center p-3 rounded-lg transition-colors
                    iphone-se:p-2 galaxy-s8:p-2 galaxy-fold:p-2
                    ${getActiveClass(item.path)}
                  `}
                >
                  <item.icon className="
                    w-5 h-5
                    iphone-se:w-4 iphone-se:h-4
                    galaxy-s8:w-4 galaxy-s8:h-4
                    galaxy-fold:w-4 galaxy-fold:h-4
                    iphone-14-pro-max:w-6 iphone-14-pro-max:h-6
                  " />
                  <span className="
                    text-xs mt-1 font-medium
                    iphone-se:text-xs galaxy-s8:text-xs galaxy-fold:text-xs
                  ">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="
        fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 md:hidden z-30 safe-area-pb
        /* Mobile-specific adjustments */
        iphone-se:px-1 iphone-se:py-1
        galaxy-s8:px-1 galaxy-s8:py-1
        galaxy-fold:px-1 galaxy-fold:py-1
        iphone-xr:px-2 iphone-xr:py-1
        iphone-12-pro:px-2 iphone-12-pro:py-1
        iphone-14-pro-max:px-2 iphone-14-pro-max:py-2
        pixel-7:px-2 pixel-7:py-1
        galaxy-s20:px-2 galaxy-s20:py-1
        galaxy-a51:px-2 galaxy-a51:py-1
        surface-duo:px-3 surface-duo:py-2
      ">
        <div className="
          flex justify-around items-center max-w-md mx-auto
          iphone-se:max-w-xs galaxy-s8:max-w-xs galaxy-fold:max-w-xs
          iphone-xr:max-w-sm iphone-12-pro:max-w-sm
          iphone-14-pro-max:max-w-md pixel-7:max-w-sm galaxy-s20:max-w-sm galaxy-a51:max-w-sm
          surface-duo:max-w-lg
        ">
          {mainNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center px-2 py-2 rounded-lg transition-colors min-w-0 flex-1
                iphone-se:px-1 iphone-se:py-1
                galaxy-s8:px-1 galaxy-s8:py-1
                galaxy-fold:px-1 galaxy-fold:py-1
                ${getActiveClass(item.path)}
              `}
            >
              <item.icon className="
                flex-shrink-0 w-5 h-5
                iphone-se:w-4 iphone-se:h-4
                galaxy-s8:w-4 galaxy-s8:h-4
                galaxy-fold:w-4 galaxy-fold:h-4
                iphone-14-pro-max:w-6 iphone-14-pro-max:h-6
              " />
              <span className="
                text-xs mt-1 font-medium truncate
                iphone-se:text-xs galaxy-s8:text-xs galaxy-fold:text-xs
              ">{item.label}</span>
            </Link>
          ))}
          
          {moreNavItems.length > 0 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className={`
                flex flex-col items-center px-2 py-2 rounded-lg transition-colors min-w-0 flex-1
                iphone-se:px-1 iphone-se:py-1
                galaxy-s8:px-1 galaxy-s8:py-1
                galaxy-fold:px-1 galaxy-fold:py-1
                ${showMore ? 'text-purple-600 bg-purple-50' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}
              `}
            >
              <Menu className="
                flex-shrink-0 w-5 h-5
                iphone-se:w-4 iphone-se:h-4
                galaxy-s8:w-4 galaxy-s8:h-4
                galaxy-fold:w-4 galaxy-fold:h-4
                iphone-14-pro-max:w-6 iphone-14-pro-max:h-6
              " />
              <span className="
                text-xs mt-1 font-medium
                iphone-se:text-xs galaxy-s8:text-xs galaxy-fold:text-xs
              ">More</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileNav;