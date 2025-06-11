import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Filter, SortAsc, SortDesc, Calendar, DollarSign, TrendingUp, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import TransactionFormCompact from '../components/finance/TransactionFormCompact';
import StatCard from '../components/dashboard/StatCard';
import { useClientStore } from '../stores/clientStore';
import { format, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay } from 'date-fns';

const Finances = () => {
  const { clients, fetchClients, fetchClientTransactions, addTransaction } = useClientStore();
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Filter and Sort states
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'pending'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'client', 'service'
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (clients.length === 0) {
          await fetchClients();
        }
        setLoading(false);
      } catch {
        setError('Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, [fetchClients, clients.length]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        if (clients.length > 0) {
          let allTransactions: any[] = [];
          for (const client of clients) {
            const clientTransactions = await fetchClientTransactions(client.id);
            allTransactions = allTransactions.concat(clientTransactions.map(t => ({
              ...t,
              clientName: client.name
            })));
          }
          allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setTransactions(allTransactions);
        }
      } catch {
        setError('Failed to load transactions');
      }
    };

    loadTransactions();
  }, [clients, fetchClientTransactions]);

  const handleAddTransaction = async (data: any) => {
    try {
      await addTransaction(data);
      setMessage('Transaction saved successfully');
      
      // FIXED: Reload all transactions to show the new one
      const loadTransactions = async () => {
        try {
          let allTransactions: any[] = [];
          for (const client of clients) {
            const clientTransactions = await fetchClientTransactions(client.id);
            allTransactions = allTransactions.concat(clientTransactions.map(t => ({
              ...t,
              clientName: client.name
            })));
          }
          allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setTransactions(allTransactions);
        } catch (err) {
          setError('Failed to reload transactions');
        }
      };
      
      await loadTransactions();
      setIsAddingTransaction(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setError('Failed to add transaction');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply date filter
    if (dateFilter !== 'all') {
      filtered = filtered.filter(transaction => {
        const transactionDate = transaction.createdAt;
        switch (dateFilter) {
          case 'today':
            return isToday(transactionDate);
          case 'week':
            return isThisWeek(transactionDate);
          case 'month':
            return isThisMonth(transactionDate);
          case 'custom':
            if (customDateFrom && customDateTo) {
              const fromDate = startOfDay(new Date(customDateFrom));
              const toDate = endOfDay(new Date(customDateTo));
              return transactionDate >= fromDate && transactionDate <= toDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => {
        if (statusFilter === 'paid') return transaction.isPaid;
        if (statusFilter === 'pending') return !transaction.isPaid;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'client':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
        case 'service':
          comparison = a.service.localeCompare(b.service);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, dateFilter, statusFilter, sortBy, sortOrder, customDateFrom, customDateTo]);

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    const todayTransactions = transactions.filter(t => isToday(t.createdAt) && t.isPaid);
    const weekTransactions = transactions.filter(t => isThisWeek(t.createdAt) && t.isPaid);
    const monthTransactions = transactions.filter(t => isThisMonth(t.createdAt) && t.isPaid);
    const pendingTransactions = transactions.filter(t => !t.isPaid);

    return {
      todayRevenue: todayTransactions.reduce((sum, t) => sum + t.amount, 0),
      weekRevenue: weekTransactions.reduce((sum, t) => sum + t.amount, 0),
      monthRevenue: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
      pendingAmount: pendingTransactions.reduce((sum, t) => sum + t.amount, 0),
      totalTransactions: transactions.length,
      paidTransactions: transactions.filter(t => t.isPaid).length
    };
  }, [transactions]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setDateFilter('all');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-full mt-4">
      {error && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 border border-red-400">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}
      {message && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm z-50 border border-green-400">
          <div className="flex items-center space-x-2">
            <CheckCircle size={16} />
            <span>{message}</span>
          </div>
        </div>
      )}

      <div className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <DollarSign size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                Finances
              </h1>
              <p className="text-gray-600 mt-1">Track your income and manage transactions</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingTransaction(true)}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl inline-flex items-center justify-center hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Transaction
          </button>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          colorScheme="green"
        />
        <StatCard
          title="This Week"
          value={formatCurrency(stats.weekRevenue)}
          icon={TrendingUp}
          colorScheme="blue"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.monthRevenue)}
          icon={Calendar}
          colorScheme="purple"
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(stats.pendingAmount)}
          icon={CreditCard}
          colorScheme="yellow"
        />
      </div>

        {/* Filters and Sort Controls */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Date Filter */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Date Filter</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="client">Client</option>
                  <option value="service">Service</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Results Count and Reset */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
            </div>
            {(dateFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'date' || sortOrder !== 'desc') && (
              <button
                onClick={resetFilters}
                className="text-sm text-purple-600 hover:text-purple-800 underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {isAddingTransaction && (
        <TransactionFormCompact 
          clients={clients || []}
          onSubmit={handleAddTransaction}
          onCancel={() => setIsAddingTransaction(false)}
        />
      )}

        {filteredAndSortedTransactions.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full overflow-hidden">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="space-y-3 p-3">
              {filteredAndSortedTransactions.map((transaction: any) => (
                <div key={transaction.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{transaction.clientName}</p>
                      <p className="text-xs text-gray-500">{format(transaction.createdAt, 'MMM d, yyyy')}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.isPaid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{transaction.service}</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th 
                    className="px-3 lg:px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 lg:px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('client')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Client</span>
                      {sortBy === 'client' && (
                        sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 lg:px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('service')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Service</span>
                      {sortBy === 'service' && (
                        sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 lg:px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      {sortBy === 'amount' && (
                        sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 lg:px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTransactions.map((transaction: any) => (
                  <tr key={transaction.id}>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {format(transaction.createdAt, 'MMM d, yyyy')}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <div className="truncate max-w-[120px] sm:max-w-none">{transaction.clientName}</div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      <div className="truncate max-w-[100px] sm:max-w-none">{transaction.service}</div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                      <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                        transaction.isPaid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
          <div className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-gray-400 mb-4">
            {transactions.length === 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <Filter className="h-16 w-16 sm:h-24 sm:w-24" />
            )}
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
          </h3>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            {transactions.length === 0 
              ? 'Get started by adding your first transaction'
              : 'Try adjusting your filters to see more results'
            }
          </p>
          {transactions.length === 0 && (
            <button
              onClick={() => setIsAddingTransaction(true)}
              className="mt-4 w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md inline-flex items-center justify-center hover:bg-purple-700 transition duration-200 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              Add Transaction
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default Finances;
