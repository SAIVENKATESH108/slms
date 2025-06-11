import React from 'react';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { ClientStats as ClientStatsType } from '../../types/ClientManagement';

interface ClientStatsProps {
  stats: ClientStatsType;
}

const ClientStats: React.FC<ClientStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase' as const
    },
    {
      title: 'Active Clients',
      value: stats.activeClients,
      icon: UserPlus,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'increase' as const
    },
    {
      title: 'New This Month',
      value: stats.newClientsThisMonth,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+23%',
      changeType: 'increase' as const
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%',
      changeType: 'increase' as const
    },
    {
      title: 'Pending Payments',
      value: `₹${stats.pendingPayments.toLocaleString()}`,
      icon: Clock,
      color: 'bg-orange-500',
      change: '-5%',
      changeType: 'decrease' as const
    },
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments,
      icon: Calendar,
      color: 'bg-indigo-500',
      change: '+18%',
      changeType: 'increase' as const
    },
    {
      title: 'Completed Appointments',
      value: stats.completedAppointments,
      icon: CheckCircle,
      color: 'bg-green-600',
      change: '+10%',
      changeType: 'increase' as const
    },
    {
      title: 'Cancelled Appointments',
      value: stats.cancelledAppointments,
      icon: XCircle,
      color: 'bg-red-500',
      change: '-3%',
      changeType: 'decrease' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const ChangeIcon = stat.changeType === 'increase' ? TrendingUp : TrendingDown;
        
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <ChangeIcon 
                className={`h-4 w-4 ${
                  stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                }`} 
              />
              <span 
                className={`ml-1 text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="ml-1 text-sm text-gray-500">vs last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientStats;