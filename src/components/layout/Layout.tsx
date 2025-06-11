import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar, { Sidebar } from './Navbar';
import MobileNav from './MobileNav';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-background flex flex-col overflow-x-hidden transition-colors duration-300">
      <Sidebar />
      <Navbar />
      <main className="
        flex-1 w-full max-w-full transition-all duration-300 h-screen overflow-hidden
        /* Reduced padding with proper right padding and no top padding */
        pl-4 pr-6 pb-4 mb-16 md:mb-0 md:ml-64
        /* Only apply mobile-specific styles for actual mobile devices */
        iphone-se:px-2 iphone-se:py-3 iphone-se:mb-16 iphone-se:mt-16 iphone-se:ml-0 iphone-se:h-auto
        galaxy-s8:px-2 galaxy-s8:py-3 galaxy-s8:mb-16 galaxy-s8:mt-16 galaxy-s8:ml-0 galaxy-s8:h-auto
        galaxy-fold:px-1 galaxy-fold:py-2 galaxy-fold:mb-16 galaxy-fold:mt-16 galaxy-fold:ml-0 galaxy-fold:h-auto
        iphone-xr:px-3 iphone-xr:py-3 iphone-xr:mb-16 iphone-xr:mt-16 iphone-xr:ml-0 iphone-xr:h-auto
        iphone-12-pro:px-3 iphone-12-pro:py-3 iphone-12-pro:mb-16 iphone-12-pro:mt-16 iphone-12-pro:ml-0 iphone-12-pro:h-auto
        iphone-14-pro-max:px-3 iphone-14-pro-max:py-4 iphone-14-pro-max:mb-16 iphone-14-pro-max:mt-16 iphone-14-pro-max:ml-0 iphone-14-pro-max:h-auto
        pixel-7:px-3 pixel-7:py-3 pixel-7:mb-16 pixel-7:mt-16 pixel-7:ml-0 pixel-7:h-auto
        galaxy-s20:px-3 galaxy-s20:py-3 galaxy-s20:mb-16 galaxy-s20:mt-16 galaxy-s20:ml-0 galaxy-s20:h-auto
        galaxy-a51:px-3 galaxy-a51:py-3 galaxy-a51:mb-16 galaxy-a51:mt-16 galaxy-a51:ml-0 galaxy-a51:h-auto
        surface-duo:px-3 surface-duo:py-3 surface-duo:mb-16 surface-duo:mt-16 surface-duo:ml-0 surface-duo:h-auto
      ">
        <div className="
          /* Reduced max-width for better content containment with full height */
          max-w-4xl h-full overflow-y-auto
          /* Only adjust width for mobile devices */
          iphone-se:max-w-full
          galaxy-s8:max-w-full
          galaxy-fold:max-w-full
          iphone-xr:max-w-full
          iphone-12-pro:max-w-full
          iphone-14-pro-max:max-w-full
          pixel-7:max-w-full
          galaxy-s20:max-w-full
          galaxy-a51:max-w-full
          surface-duo:max-w-full
        ">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
