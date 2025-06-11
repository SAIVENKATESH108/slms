import React from 'react';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';
import { ClientStats } from '../../types/ClientManagement';

interface ClientOverviewProps {
  stats: ClientStats;
}

const ClientOverview: React.FC<ClientOverviewProps> = ({ stats }) => {
  // Mock data for charts and recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'appointment',
      client: 'Sarah Johnson',
      action: 'Booked appointment for Hair Styling',
      time: '2 hours ago',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      id: 2,
      type: 'payment',
      client: 'Mike Chen',
      action: 'Payment received ₹2,500',
      time: '4 hours ago',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      id: 3,
      type: 'client',
      client: 'Emma Wilson',
      action: 'New client registered',
      time: '6 hours ago',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'review',
      client: 'David Brown',
      action: 'Left 5-star review',
      time: '1 day ago',
      icon: Star,
      color: 'text-yellow-600'
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      client: 'Alice Cooper',
      service: 'Facial Treatment',
      time: '10:00 AM',
      date: 'Today',
      status: 'confirmed'
    },
    {
      id: 2,
      client: 'Bob Wilson',
      service: 'Hair Cut & Style',
      time: '2:30 PM',
      date: 'Today',
      status: 'pending'
    },
    {
      id: 3,
      client: 'Carol Davis',
      service: 'Manicure & Pedicure',
      time: '11:00 AM',
      date: 'Tomorrow',
      status: 'confirmed'
    }
  ];

  const topServices = [
    { name: 'Hair Styling', bookings: 45, revenue: 67500 },
    { name: 'Facial Treatment', bookings: 32, revenue: 48000 },
    { name: 'Manicure', bookings: 28, revenue: 28000 },
    { name: 'Massage Therapy', bookings: 22, revenue: 44000 }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <Users className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">Add Client</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
            <Calendar className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">Book Appointment</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <DollarSign className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">Record Payment</span>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors">
            <TrendingUp className="h-6 w-6 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-600">View Reports</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full bg-gray-100`}>
                    <Icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.client}</p>
                    <p className="text-sm text-gray-500">{activity.action}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700">View Calendar</button>
          </div>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{appointment.client}</p>
                  <p className="text-sm text-gray-500">{appointment.service}</p>
                  <p className="text-xs text-gray-400">{appointment.time} • {appointment.date}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {appointment.status === 'confirmed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-orange-500" />
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    appointment.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">{service.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">₹{service.revenue.toLocaleString()}</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(service.bookings / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Overdue Payments</p>
                <p className="text-sm text-red-600">3 clients have overdue payments totaling ₹15,000</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Appointment Reminders</p>
                <p className="text-sm text-yellow-600">5 clients need appointment reminders for tomorrow</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Follow-up Required</p>
                <p className="text-sm text-blue-600">2 clients haven't visited in over 30 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOverview;