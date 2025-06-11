import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Filter, 
  Search,
  Plus,
  Grid,
  List,
  Download,
  Bell,
  Settings
} from 'lucide-react';
import ClientOverview from '../components/client-management/ClientOverview';
import ClientList from '../components/client-management/ClientList';
import TransactionManager from '../components/client-management/TransactionManager';
import ServiceManager from '../components/client-management/ServiceManager';
import AppointmentCalendar from '../components/client-management/AppointmentCalendar';
import ClientStats from '../components/client-management/ClientStats';
import { useClientStore } from '../stores/clientStore';
import { ClientStats as ClientStatsType } from '../types/ClientManagement';

type TabType = 'overview' | 'clients' | 'transactions' | 'services' | 'appointments';

const ClientManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<ClientStatsType>({
    totalClients: 0,
    activeClients: 0,
    newClientsThisMonth: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0
  });

  const { clients, loading, fetchClients } = useClientStore();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    // Calculate stats from clients data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newClientsThisMonth = clients.filter(client => 
      client.createdAt >= startOfMonth
    ).length;

    const activeClients = clients.filter(client => 
      client.status === 'active'
    ).length;

    setStats({
      totalClients: clients.length,
      activeClients,
      newClientsThisMonth,
      totalRevenue: 0, // Will be calculated from transactions
      pendingPayments: 0, // Will be calculated from transactions
      upcomingAppointments: 0, // Will be calculated from appointments
      completedAppointments: 0, // Will be calculated from appointments
      cancelledAppointments: 0 // Will be calculated from appointments
    });
  }, [clients]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'services', label: 'Services', icon: Settings },
    { id: 'appointments', label: 'Appointments', icon: Calendar }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ClientOverview stats={stats}  />;
      case 'clients':
        return <ClientList />;
      case 'transactions':
        return <TransactionManager />;
      case 'services':
        return <ServiceManager />;
      case 'appointments':
        return <AppointmentCalendar />;
      default:
        return <ClientOverview stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Comprehensive client and business management dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Quick Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <ClientStats stats={stats} />
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ClientManagement;