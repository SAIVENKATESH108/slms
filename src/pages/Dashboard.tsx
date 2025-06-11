// 
import React, { useEffect, useState } from 'react';
import StatCard from '../components/dashboard/StatCard';
import { 
  DollarSign, 
  Users, 
  ClipboardList, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  CreditCard,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { useAuthStore } from '../stores/authStore';
import { useClientStore } from '../stores/clientStore';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';

interface Transaction {
  id: string;
  amount: number;
  isPaid: boolean;
  dueDate?: Timestamp;
  clientId: string;
  clientName: string;
  description: string;
  createdAt: Timestamp;
}

interface DashboardStats {
  totalRevenue: number;
  pendingAmount: number;
  clientCount: number;
  pendingPayments: number;
  monthlyRevenue: number;
  weeklyGrowth: number;
}

interface RevenueData {
  date: string;
  amount: number;
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    pendingAmount: 0,
    clientCount: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    weeklyGrowth: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to check if user can access shared data
  const canAccessSharedData = () => {
    const currentUser = authService.getCurrentUser();
    const role = currentUser?.customClaims?.role;
    return role === 'admin' || role === 'manager';
  };
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Fetch clients if not already loaded
        if (clients.length === 0) {
          await fetchClients();
        }
        
        // Fetch transactions data based on user role
        let transactionsRef;
        let transactionsQuery;
        
        if (canAccessSharedData()) {
          // Admin and Manager: Access shared transactions collection
          transactionsRef = collection(firestore, 'transactions');
          transactionsQuery = query(
            transactionsRef,
            orderBy('createdAt', 'desc')
          );
        } else {
          // Employee: Access only their own transactions
          transactionsRef = collection(firestore, `users/${user.uid}/transactions`);
          transactionsQuery = query(
            transactionsRef,
            orderBy('createdAt', 'desc')
          );
        }
        
        const transactionsSnapshot = await getDocs(transactionsQuery);
        
        const allTransactions: Transaction[] = [];
        let totalRevenue = 0;
        let pendingAmount = 0;
        let pendingPayments = 0;
        
        // Process transactions
        transactionsSnapshot.forEach(doc => {
          const transaction = doc.data();
          const amount = transaction.amount || 0;
          
          const transactionData: Transaction = {
            id: doc.id,
            amount: amount,
            isPaid: transaction.isPaid || false,
            dueDate: transaction.dueDate,
            clientId: transaction.clientId || '',
            clientName: transaction.clientName || 'Unknown Client',
            description: transaction.description || 'Service Payment',
            createdAt: transaction.createdAt
          };
          
          allTransactions.push(transactionData);
          totalRevenue += amount;
          
          if (!transaction.isPaid) {
            pendingAmount += amount;
            pendingPayments++;
          }
        });
        
        setTransactions(allTransactions);
        
        // Calculate monthly revenue
        const currentMonth = new Date();
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        
        const monthlyRevenue = allTransactions
          .filter(t => t.isPaid && t.createdAt && 
            isWithinInterval(t.createdAt.toDate(), { start: monthStart, end: monthEnd }))
          .reduce((sum, t) => sum + t.amount, 0);
        
        // Calculate weekly growth (simplified)
        const lastWeek = subDays(new Date(), 7);
        const weeklyRevenue = allTransactions
          .filter(t => t.isPaid && t.createdAt && 
            t.createdAt.toDate() >= lastWeek)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const previousWeekRevenue = allTransactions
          .filter(t => t.isPaid && t.createdAt && 
            t.createdAt.toDate() >= subDays(lastWeek, 7) && 
            t.createdAt.toDate() < lastWeek)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const weeklyGrowth = previousWeekRevenue > 0 
          ? ((weeklyRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 
          : 0;
        
        // Generate revenue chart data for last 30 days
        const chartData: RevenueData[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dayRevenue = allTransactions
            .filter(t => t.isPaid && t.createdAt && 
              format(t.createdAt.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
            .reduce((sum, t) => sum + t.amount, 0);
          
          chartData.push({
            date: format(date, 'MMM dd'),
            amount: dayRevenue
          });
        }
        
        setRevenueData(chartData);
        
        // Get upcoming payments (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const upcoming = allTransactions
          .filter(t => !t.isPaid && t.dueDate && 
            t.dueDate.toDate() <= nextWeek)
          .sort((a, b) => a.dueDate!.toDate().getTime() - b.dueDate!.toDate().getTime())
          .slice(0, 5);
        
        setUpcomingPayments(upcoming);
        
        // Update stats
        setStats({
          totalRevenue,
          pendingAmount,
          clientCount: clients.length,
          pendingPayments,
          monthlyRevenue,
          weeklyGrowth
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, clients.length, fetchClients]);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 mt-4">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard 📊
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Welcome back! Here's an overview of your business performance.</p>
          </div>
          
          {/* Role Indicator */}
          <div className="flex items-center space-x-2">
            {(() => {
              const currentUser = authService.getCurrentUser();
              const role = currentUser?.customClaims?.role || 'user';
              const isSharedData = canAccessSharedData();
              
              return (
                <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                  role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : role === 'manager' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className="hidden sm:inline">{role.toUpperCase()} • {isSharedData ? 'All Data' : 'Personal Data'}</span>
                  <span className="sm:hidden">{role.toUpperCase()}</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">💰 Total Revenue</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">⏳ Pending Amount</p>
              <p className="text-2xl font-bold text-yellow-800">{formatCurrency(stats.pendingAmount)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">👥 Total Clients</p>
              <p className="text-2xl font-bold text-blue-800">{stats.clientCount}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">📋 Pending Payments</p>
              <p className="text-2xl font-bold text-red-800">{stats.pendingPayments}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>
      
      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">📅 This Month</p>
              <p className="text-xl font-bold text-purple-800">{formatCurrency(stats.monthlyRevenue)}</p>
            </div>
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-50 to-cyan-100 rounded-xl p-6 border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 text-sm font-medium">📈 Weekly Growth</p>
              <p className="text-xl font-bold text-teal-800">
                {stats.weeklyGrowth > 0 ? '+' : ''}{stats.weeklyGrowth.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-teal-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">💳 Avg Transaction</p>
              <p className="text-xl font-bold text-orange-800">
                {formatCurrency(transactions.length > 0 ? stats.totalRevenue / transactions.length : 0)}
              </p>
            </div>
            <CreditCard className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>
      
      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
              📊 Revenue Timeline (30 Days)
            </h2>
          </div>
          
          <div className="h-64 flex items-end justify-between space-x-1">
            {revenueData.map((data, index) => {
              const maxAmount = Math.max(...revenueData.map(d => d.amount));
              const height = maxAmount > 0 ? (data.amount / maxAmount) * 200 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-sm w-full min-h-[2px] transition-all duration-300 hover:from-indigo-600 hover:to-purple-600"
                    style={{ height: `${height}px` }}
                    title={`${data.date}: ${formatCurrency(data.amount)}`}
                  />
                  {index % 5 === 0 && (
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                      {data.date}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Recent Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            👤 Recent Clients
          </h2>
          
          {clients.length > 0 ? (
            <div className="space-y-3">
              {clients.slice(0, 5).map((client, index) => (
                <div key={client.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{client.name}</p>
                      <p className="text-sm text-gray-500">🏠 Flat {client.flatNumber}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(client.createdAt, 'MMM d')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No clients added yet</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            ⏰ Upcoming Payments
          </h2>
          
          {upcomingPayments.length > 0 ? (
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                  <div>
                    <p className="font-medium text-gray-800">{payment.clientName}</p>
                    <p className="text-sm text-gray-500">{payment.description}</p>
                    <p className="text-xs text-orange-600">
                      📅 Due: {payment.dueDate ? format(payment.dueDate.toDate(), 'MMM d, yyyy') : 'No due date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-700">{formatCurrency(payment.amount)}</p>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">✅ No upcoming payments</p>
              <p className="text-sm text-gray-400 mt-1">All payments are up to date!</p>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-green-600" />
            🚀 Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/clients/add')}
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200 text-left hover:from-blue-100 hover:to-indigo-200 transition-all duration-200"
            >
              <div className="text-2xl mb-2">👤</div>
              <p className="text-sm font-medium text-blue-800">Add Client</p>
            </button>
            
            <button 
              onClick={() => navigate('/payments/new')}
              className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-200 text-left hover:from-green-100 hover:to-emerald-200 transition-all duration-200"
            >
              <div className="text-2xl mb-2">💰</div>
              <p className="text-sm font-medium text-green-800">New Payment</p>
            </button>
            
            <button 
              onClick={() => navigate('/reports')}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg border border-purple-200 text-left hover:from-purple-100 hover:to-pink-200 transition-all duration-200"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm font-medium text-purple-800">View Reports</p>
            </button>
            
            <button 
              onClick={() => navigate('/settings')}
              className="p-4 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg border border-yellow-200 text-left hover:from-yellow-100 hover:to-orange-200 transition-all duration-200"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <p className="text-sm font-medium text-yellow-800">Settings</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;