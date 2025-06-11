import React from 'react';
import { Sidebar } from '../layout/Navbar';
import { Outlet } from 'react-router-dom';
import MobileNav from '../layout/MobileNav';

const ManagerDashboard: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 md:ml-64 sm:ml-0 flex flex-col">
        <div className="flex-shrink-0 p-4 border-b bg-white">
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, Manager! You have access to clients, finances, analytics, flats, and marketing.</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="h-full w-full max-w-none overflow-y-auto p-4">
            <div className="max-w-5xl mx-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default ManagerDashboard;
