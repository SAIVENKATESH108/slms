import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useClientStore } from '../../stores/clientStore';
import { useAuthStore } from '../../stores/authStore';

interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  service: string;
  amount: number;
  isPaid: boolean;
  dueDate: string;
  createdAt: string;
  paymentReference?: string;
  paymentMethods?: string[];
}

interface TransactionStats {
  totalTransactions: number;
  totalRevenue: number;
  paidTransactions: number;
  unpaidTransactions: number;
  overdueTransactions: number;
}

interface TransactionManagementProps {
  onSetMessage: (message: { type: 'success' | 'error', text: string }) => void;
}

const TransactionManagement: React.FC<TransactionManagementProps> = ({ onSetMessage }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    paidTransactions: 0,
    unpaidTransactions: 0,
    overdueTransactions: 0
  });
  const { user } = useAuthStore();
  const { clients, getAllTransactions, updateTransaction, deleteTransaction, fetchClients } = useClientStore();

  useEffect(() => {
    fetchClients();
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter, dateFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getAllTransactions();
      // Convert LegacyTransaction to Transaction format
      const convertedData = data.map(t => ({
        id: t.id,
        clientId: t.clientId,
        clientName: clients.find(c => c.id === t.clientId)?.name || 'Unknown Client',
        service: t.service,
        amount: t.amount,
        isPaid: t.isPaid,
        dueDate: t.dueDate.toISOString(),
        createdAt: t.createdAt.toISOString(),
        paymentReference: t.paymentReference,
        paymentMethods: t.paymentMethods
      }));
      setTransactions(convertedData);
      calculateStats(convertedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      onSetMessage({ type: 'error', text: 'Failed to load transactions' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactionData: Transaction[]) => {
    const now = new Date();
    const totalTransactions = transactionData.length;
    const totalRevenue = transactionData.reduce((sum, t) => sum + t.amount, 0);
    const paidTransactions = transactionData.filter(t => t.isPaid).length;
    const unpaidTransactions = transactionData.filter(t => !t.isPaid).length;
    const overdueTransactions = transactionData.filter(t => 
      !t.isPaid && new Date(t.dueDate) < now
    ).length;

    setStats({
      totalTransactions,
      totalRevenue,
      paidTransactions,
      unpaidTransactions,
      overdueTransactions
    });
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(t => {
        switch (statusFilter) {
          case 'paid':
            return t.isPaid;
          case 'unpaid':
            return !t.isPaid;
          case 'overdue':
            return !t.isPaid && new Date(t.dueDate) < now;
          default:
            return true;
        }
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.createdAt);
        switch (dateFilter) {
          case 'today':
            return transactionDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return transactionDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return transactionDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTransaction(transactionId);
      onSetMessage({ type: 'success', text: 'Transaction deleted successfully' });
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      onSetMessage({ type: 'error', text: 'Failed to delete transaction' });
    }
  };

  const handleMarkAsPaid = async (transactionId: string) => {
    try {
      await updateTransaction(transactionId, { 
        isPaid: true,
        paymentReference: `MANUAL_${Date.now()}`
      });
      onSetMessage({ type: 'success', text: 'Transaction marked as paid' });
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      onSetMessage({ type: 'error', text: 'Failed to update transaction' });
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Client', 'Service', 'Amount', 'Status', 'Due Date', 'Payment Reference'].join(','),
      ...filteredTransactions.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.clientName,
        t.service,
        t.amount,
        t.isPaid ? 'Paid' : 'Unpaid',
        new Date(t.dueDate).toLocaleDateString(),
        t.paymentReference || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (transaction: Transaction) => {
    if (transaction.isPaid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    const now = new Date();
    const dueDate = new Date(transaction.dueDate);
    
    if (dueDate < now) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (transaction: Transaction) => {
    if (transaction.isPaid) {
      return 'Paid';
    }
    
    const now = new Date();
    const dueDate = new Date(transaction.dueDate);
    
    if (dueDate < now) {
      return 'Overdue';
    }
    
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="mr-2" size={20} />
            Transaction Management
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Monitor and manage all financial transactions
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchTransactions}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportTransactions}
            className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalTransactions}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Paid</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.paidTransactions}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Unpaid</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.unpaidTransactions}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Overdue</p>
              <p className="text-2xl font-bold text-red-900">{stats.overdueTransactions}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center space-x-2"
            >
              <Filter size={16} />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client & Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.clientName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.service}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{transaction.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction)}
                        <span className={`text-sm font-medium ${
                          transaction.isPaid 
                            ? 'text-green-600' 
                            : new Date(transaction.dueDate) < new Date()
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}>
                          {getStatusText(transaction)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.paymentReference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {!transaction.isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(transaction.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Paid"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </span>
          <span>
            Total filtered amount: ₹{filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransactionManagement;