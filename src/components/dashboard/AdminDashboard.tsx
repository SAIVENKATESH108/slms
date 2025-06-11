import React from 'react';
import { Sidebar } from '../layout/Navbar';
import { Outlet } from 'react-router-dom';
import MobileNav from '../layout/MobileNav';

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="ml-64 md:ml-64 sm:ml-0 flex flex-col w-full">
        <div className="flex-shrink-0 p-4 border-b bg-white md:block hidden">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome, Admin! You have full access to all modules.</p>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="h-full w-full">
            <div className="w-full mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-20 md:pb-6">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default AdminDashboard;
