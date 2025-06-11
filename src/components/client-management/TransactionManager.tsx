import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Transaction } from '../../types/ClientManagement';
import { useClientStore } from '../../stores/clientStore';

const TransactionManager: React.FC = () => {
  const { clients } = useClientStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [filters, setFilters] = useState({
    paymentStatus: 'all',
    paymentMethod: 'all',
    type: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    amountRange: {
      min: '',
      max: ''
    }
  });

  // Mock transaction data - replace with actual API calls
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        clientId: 'client1',
        type: 'service',
        description: 'Hair Styling Service',
        amount: 2500,
        discount: 250,
        tax: 225,
        totalAmount: 2475,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        paymentDate: new Date('2024-01-15'),
        dueDate: new Date('2024-01-15'),
        invoiceNumber: 'INV-001',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        clientId: 'client2',
        type: 'service',
        description: 'Facial Treatment',
        amount: 1800,
        totalAmount: 1800,
        paymentMethod: 'upi',
        paymentStatus: 'pending',
        dueDate: new Date('2024-01-20'),
        invoiceNumber: 'INV-002',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18')
      },
      {
        id: '3',
        clientId: 'client3',
        type: 'product',
        description: 'Hair Care Products',
        amount: 1200,
        totalAmount: 1200,
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        paymentDate: new Date('2024-01-16'),
        dueDate: new Date('2024-01-16'),
        invoiceNumber: 'INV-003',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      }
    ];
    setTransactions(mockTransactions);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.invoiceNumber?.toLowerCase().includes(searchLower) ||
        transaction.id.toLowerCase().includes(searchLower);

      const matchesStatus = filters.paymentStatus === 'all' || transaction.paymentStatus === filters.paymentStatus;
      const matchesMethod = filters.paymentMethod === 'all' || transaction.paymentMethod === filters.paymentMethod;
      const matchesType = filters.type === 'all' || transaction.type === filters.type;

      // Date range filter
      let matchesDateRange = true;
      if (filters.dateRange.start && filters.dateRange.end) {
        const transactionDate = new Date(transaction.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        matchesDateRange = transactionDate >= startDate && transactionDate <= endDate;
      }

      // Amount range filter
      let matchesAmountRange = true;
      if (filters.amountRange.min || filters.amountRange.max) {
        const min = parseFloat(filters.amountRange.min) || 0;
        const max = parseFloat(filters.amountRange.max) || Infinity;
        matchesAmountRange = transaction.totalAmount >= min && transaction.totalAmount <= max;
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesType && matchesDateRange && matchesAmountRange;
    });
  }, [transactions, searchQuery, filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'refunded': return <XCircle className="h-4 w-4 text-blue-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'partial': return 'text-orange-600 bg-orange-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'upi': return <DollarSign className="h-4 w-4" />;
      case 'bank_transfer': return <DollarSign className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const totalRevenue = filteredTransactions
    .filter(t => t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const pendingAmount = filteredTransactions
    .filter(t => t.paymentStatus === 'pending')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.filter(t => t.paymentStatus === 'paid').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.filter(t => {
                  const transactionDate = new Date(t.createdAt);
                  const now = new Date();
                  return transactionDate.getMonth() === now.getMonth() && 
                         transactionDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-sm text-gray-500">{filteredTransactions.length} transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
              showFilters ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'
            } hover:bg-gray-50`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search transactions by description, invoice number, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="service">Service</option>
                <option value="product">Product</option>
                <option value="package">Package</option>
                <option value="membership">Membership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.amountRange.min}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    amountRange: { ...prev.amountRange, min: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.amountRange.max}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    amountRange: { ...prev.amountRange, max: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                paymentStatus: 'all',
                paymentMethod: 'all',
                type: 'all',
                dateRange: { start: '', end: '' },
                amountRange: { min: '', max: '' }
              })}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-sm text-gray-500">
                      {transaction.invoiceNumber} • {transaction.type}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getClientName(transaction.clientId)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">₹{transaction.totalAmount.toLocaleString()}</div>
                  {transaction.discount && (
                    <div className="text-sm text-gray-500">Discount: ₹{transaction.discount}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getPaymentMethodIcon(transaction.paymentMethod)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">
                      {transaction.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(transaction.paymentStatus)}
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.paymentStatus)}`}>
                      {transaction.paymentStatus}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                  {transaction.paymentDate && (
                    <div className="text-sm text-gray-500">
                      Paid: {new Date(transaction.paymentDate).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '' && (!Array.isArray(f) || f.length > 0))
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first transaction'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;