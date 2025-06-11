import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Phone, 
  Home, 
  Star, 
  DollarSign, 
  Clock, 
  Tag,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Crown,
  Shield,
  AlertTriangle,
  MapPin,
  User,
  CreditCard,
  FileText,
  Activity
} from 'lucide-react';
import { useClientStore } from '../stores/clientStore';

interface Transaction {
  id: string;
  clientId: string;
  service: string;
  amount: number;
  isPaid: boolean;
  paymentDate?: Date;
  dueDate: Date;
  createdAt: Date;
}

const ClientDetail: React.FC = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { clients, fetchClientTransactions } = useClientStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = clients.find(c => c.id === clientId);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!clientId) return;
      try {
        console.log('Fetching transactions for clientId:', clientId);
        const clientTransactions = await fetchClientTransactions(clientId);
        console.log('Fetched transactions:', clientTransactions);
        setTransactions(clientTransactions);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [clientId, fetchClientTransactions]);

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Client not found</p>
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 text-purple-600 hover:text-purple-700"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  const getTrustScoreInfo = (score: number) => {
    if (score >= 80) return { 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      icon: Crown,
      label: 'Excellent',
      description: 'Highly trusted client'
    };
    if (score >= 50) return { 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      icon: Shield,
      label: 'Good',
      description: 'Reliable client'
    };
    return { 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      icon: AlertTriangle,
      label: 'Needs Attention',
      description: 'Monitor closely'
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const pendingAmount = transactions
    .filter(t => !t.isPaid)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const paidTransactions = transactions.filter(t => t.isPaid).length;
  const totalTransactions = transactions.length;
  const trustInfo = getTrustScoreInfo(client.trustScore);
  const TrustIcon = trustInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-gray-600 hover:text-purple-700 inline-flex items-center px-4 py-2 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="font-medium">Back to Clients</span>
        </button>

        {/* Client Header Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          {/* Header Background */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-white" />
                </div>
                
                {/* Client Info */}
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{client.name}</h1>
                  <div className="flex items-center space-x-6 text-purple-100">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Flat {client.flatNumber}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Join Date */}
              <div className="text-right text-purple-100">
                <div className="flex items-center mb-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">Client since</span>
                </div>
                <div className="text-white font-semibold">
                  {format(new Date(client.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            {/* Trust Score Section */}
            <div className={`flex items-center justify-between p-6 rounded-2xl ${trustInfo.bgColor} ${trustInfo.borderColor} border mb-6`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${trustInfo.bgColor}`}>
                  <TrustIcon className={`h-8 w-8 ${trustInfo.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Trust Score</h3>
                  <p className="text-gray-600">{trustInfo.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${trustInfo.color}`}>
                  {client.trustScore}
                </div>
                <div className={`text-sm font-medium ${trustInfo.color}`}>
                  {trustInfo.label}
                </div>
              </div>
            </div>

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-200 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Notes
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-700">{client.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Spent */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              {pendingAmount > 0 ? (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending Amount</p>
              <p className={`text-2xl font-bold ${pendingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(pendingAmount)}
              </p>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
            </div>
          </div>

          {/* Payment Success Rate */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <Star className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Payment Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalTransactions > 0 ? Math.round((paidTransactions / totalTransactions) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Activity className="h-6 w-6 mr-3 text-purple-600" />
                  Transaction History
                </h2>
                <p className="text-gray-600 mt-1">Complete payment and service history</p>
              </div>
              {transactions.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction, index) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${transaction.isPaid ? 'bg-green-100' : 'bg-orange-100'}`}>
                        {transaction.isPaid ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Clock className="h-6 w-6 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{transaction.service}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {!transaction.isPaid && transaction.dueDate && (
                            <div className="flex items-center text-orange-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">
                                Due: {format(new Date(transaction.dueDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        transaction.isPaid 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        {transaction.isPaid ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-1" />
                            Pending
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500">This client hasn't made any transactions yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
