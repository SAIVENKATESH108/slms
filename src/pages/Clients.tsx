// import React, { useEffect, useState } from 'react';
// import { Plus } from 'lucide-react';
// import ClientCard from '../components/client/ClientCard';
// import ClientForm, { ClientFormData } from '../components/client/ClientForm';
// import { useClientStore } from '../stores/clientStore';

// interface ClientTransactionSummary {
//   totalSpent: number;
//   pendingAmount: number;
// }

// const Clients: React.FC = () => {
//   const { clients, loading, error, fetchClients, fetchClientTransactions, addClient } = useClientStore();
//   const [isAddingClient, setIsAddingClient] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [clientTransactions, setClientTransactions] = useState<Record<string, ClientTransactionSummary>>({});

//   useEffect(() => {
//     fetchClients();
//   }, [fetchClients]);

//   useEffect(() => {
//     const loadTransactions = async () => {
//       const transactionsMap: Record<string, ClientTransactionSummary> = {};
      
//       // Only load transactions if there's no client loading error
//       if (!error) {
//         await Promise.all(
//           clients.map(async (client) => {
//             try {
//               const transactions = await fetchClientTransactions(client.id);
              
//               // Safely calculate totals with additional error handling
//               const totalSpent = transactions.reduce((sum, t) => {
//                 const amount = typeof t.amount === 'number' ? t.amount : 0;
//                 return sum + amount;
//               }, 0);
              
//               const pendingAmount = transactions
//                 .filter(t => !t.isPaid)
//                 .reduce((sum, t) => {
//                   const amount = typeof t.amount === 'number' ? t.amount : 0;
//                   return sum + amount;
//                 }, 0);
                
//               transactionsMap[client.id] = { totalSpent, pendingAmount };
//             } catch (err) {
//               // eslint-disable-next-line no-console
//               console.error(`Error fetching transactions for client ${client.id}:`, err);
              
//               // Check if it's a date-related error
//               const errorMessage = err instanceof Error ? err.message : String(err);
//               if (errorMessage.includes('toDate is not a function')) {
//                 console.error('Date formatting error - check Firestore date field types');
//               }
              
//               // Set default values for any error
//               transactionsMap[client.id] = { totalSpent: 0, pendingAmount: 0 };
//             }
//           })
//         );
//       }
      
//       setClientTransactions(transactionsMap);
//     };

//     if (clients.length > 0) {
//       loadTransactions();
//     }
//   }, [clients, fetchClientTransactions, error]);

//   const handleAddClient = (data: ClientFormData) => {
//     try {
//       const clientData = { ...data, trustScore: 0 };
//       addClient(clientData);
//       setIsAddingClient(false);
//     } catch (error) {
//       // eslint-disable-next-line no-console
//       console.error('Error adding client:', error);
//     }
//   };

//   const filteredClients = clients.filter(client =>
//     client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     client.flatNumber.includes(searchQuery) ||
//     client.phone.includes(searchQuery) ||
//     (client.tags && client.tags.some(tag =>
//       tag.toLowerCase().includes(searchQuery.toLowerCase())
//     ))
//   );

//   return (
//     <div className="p-4 max-w-7xl mx-auto">
//       {/* Header Section */}
//       <div className="mb-6">
//         <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
//           <div className="flex-1">
//             <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
//             <p className="text-gray-600 mt-1">Manage your clients and their information</p>
//           </div>
          
//           <div className="flex-shrink-0">
//             <button
//               onClick={() => setIsAddingClient(true)}
//               className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md inline-flex items-center justify-center hover:bg-purple-700 transition duration-200 text-sm font-medium"
//             >
//               <Plus className="h-4 w-4 mr-2" />
//               Add New Client
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Search Section */}
//       <div className="mb-6">
//         <div className="relative max-w-md">
//           <input
//             type="text"
//             placeholder="Search clients..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm"
//           />
//           <div className="absolute left-3 top-2.5 text-gray-400">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
//             </svg>
//           </div>
//         </div>
//       </div>

//       {/* Add Client Form */}
//       {isAddingClient && (
//         <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
//             <button
//               onClick={() => setIsAddingClient(false)}
//               className="text-gray-400 hover:text-gray-600 text-sm"
//             >
//               Cancel
//             </button>
//           </div>
//           <ClientForm
//             onSubmit={handleAddClient}
//             onCancel={() => setIsAddingClient(false)}
//           />
//         </div>
//       )}

//       {/* Content Section */}
//       <div className="space-y-4">
//         {loading ? (
//           <div className="flex justify-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
//           </div>
//         ) : error ? (
//           <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
//             <div className="flex">
//               <div className="flex-shrink-0">
//                 <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//               </div>
//               <div className="ml-3">
//                 <h3 className="text-sm font-medium text-red-800">Database Error</h3>
//                 <div className="mt-2 text-sm text-red-700">
//                   {error.includes('index') ? (
//                     <>
//                       <p><strong>Index Required:</strong> A Firestore composite index is needed.</p>
//                       <p className="mt-1">Click the Firebase Console link to create it automatically.</p>
//                     </>
//                   ) : error.includes('toDate') ? (
//                     <>
//                       <p><strong>Date Format Error:</strong> Issue with date field formatting.</p>
//                       <p className="mt-1">Check that date fields in Firestore are stored as Timestamps, not strings.</p>
//                     </>
//                   ) : (
//                     <p>An error occurred while loading data.</p>
//                   )}
//                 </div>
//                 <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded font-mono break-all">
//                   {error}
//                 </div>
//                 {error.includes('toDate') && (
//                   <div className="mt-2 text-xs text-red-700">
//                     <p><strong>Common fixes:</strong></p>
//                     <ul className="list-disc list-inside mt-1 space-y-1">
//                       <li>Ensure date fields use Firestore Timestamp type</li>
//                       <li>Check your date handling code in the store</li>
//                       <li>Verify date field names match your database</li>
//                     </ul>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         ) : filteredClients.length > 0 ? (
//           <div className="grid gap-4">
//             {filteredClients.map(client => (
//               <ClientCard
//                 key={client.id}
//                 client={client}
//                 totalSpent={clientTransactions[client.id]?.totalSpent || 0}
//                 pendingAmount={clientTransactions[client.id]?.pendingAmount || 0}
//               />
//             ))}
//           </div>
//         ) : searchQuery ? (
//           <div className="text-center py-12 bg-white rounded-lg shadow-sm">
//             <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
//               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-medium text-gray-900">No clients found</h3>
//             <p className="mt-1 text-gray-500">Try adjusting your search query</p>
//             <button
//               onClick={() => setSearchQuery('')}
//               className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
//             >
//               Clear search
//             </button>
//           </div>
//         ) : (
//           <div className="text-center py-12 bg-white rounded-lg shadow-sm">
//             <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
//               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-medium text-gray-900">No clients yet</h3>
//             <p className="mt-1 text-gray-500 mb-4">Get started by adding your first client</p>
//             <button
//               onClick={() => setIsAddingClient(true)}
//               className="px-6 py-2 bg-purple-600 text-white rounded-md inline-flex items-center hover:bg-purple-700 transition duration-200 font-medium"
//             >
//               <Plus className="h-4 w-4 mr-2" />
//               Add New Client
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Clients;
import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Grid, List, SortAsc, SortDesc, Users, DollarSign, Clock, AlertCircle } from 'lucide-react';
import ClientCard from '../components/client/ClientCard';
import ClientForm, { ClientFormData } from '../components/client/ClientForm';
import { useClientStore } from '../stores/clientStore';

interface ClientTransactionSummary {
  totalSpent: number;
  pendingAmount: number;
}

type SortField = 'name' | 'flatNumber' | 'totalSpent' | 'pendingAmount' | 'trustScore' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

const Clients: React.FC = () => {
  const { clients, loading, error, fetchClients, fetchClientTransactions, addClient } = useClientStore();
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientTransactions, setClientTransactions] = useState<Record<string, ClientTransactionSummary>>({});
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [trustScoreFilter, setTrustScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const loadTransactions = async () => {
      const transactionsMap: Record<string, ClientTransactionSummary> = {};
      
      if (!error) {
        await Promise.all(
          clients.map(async (client) => {
            try {
              const transactions = await fetchClientTransactions(client.id);
              
              const totalSpent = transactions.reduce((sum, t) => {
                const amount = typeof t.amount === 'number' ? t.amount : 0;
                return sum + amount;
              }, 0);
              
              const pendingAmount = transactions
                .filter(t => !t.isPaid)
                .reduce((sum, t) => {
                  const amount = typeof t.amount === 'number' ? t.amount : 0;
                  return sum + amount;
                }, 0);
                
              transactionsMap[client.id] = { totalSpent, pendingAmount };
            } catch (err) {
              console.error(`Error fetching transactions for client ${client.id}:`, err);
              transactionsMap[client.id] = { totalSpent: 0, pendingAmount: 0 };
            }
          })
        );
      }
      
      setClientTransactions(transactionsMap);
    };

    if (clients.length > 0) {
      loadTransactions();
    }
  }, [clients, fetchClientTransactions, error]);

  const handleAddClient = (data: ClientFormData) => {
    try {
      const clientData = { ...data, trustScore: 100 };
      addClient(clientData);
      setIsAddingClient(false);
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getTrustScoreLevel = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const filteredAndSortedClients = clients
    .filter(client => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.flatNumber.includes(searchQuery) ||
        client.phone.includes(searchQuery) ||
        (client.tags && client.tags.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ));

      const matchesTrustScore = trustScoreFilter === 'all' || 
        getTrustScoreLevel(client.trustScore) === trustScoreFilter;

      const pendingAmount = clientTransactions[client.id]?.pendingAmount || 0;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'pending' && pendingAmount > 0) ||
        (statusFilter === 'paid' && pendingAmount === 0);

      return matchesSearch && matchesTrustScore && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'totalSpent':
          aValue = clientTransactions[a.id]?.totalSpent || 0;
          bValue = clientTransactions[b.id]?.totalSpent || 0;
          break;
        case 'pendingAmount':
          aValue = clientTransactions[a.id]?.pendingAmount || 0;
          bValue = clientTransactions[b.id]?.pendingAmount || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Statistics
  const totalClients = clients.length;
  const totalRevenue = Object.values(clientTransactions).reduce((sum, t) => sum + t.totalSpent, 0);
  const totalPending = Object.values(clientTransactions).reduce((sum, t) => sum + t.pendingAmount, 0);
  const clientsWithPending = Object.values(clientTransactions).filter(t => t.pendingAmount > 0).length;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="w-full">
        {/* Enhanced Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="p-2 md:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Users size={24} className="text-white md:w-7 md:h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  Clients
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">Manage your client relationships and track their activity</p>
              </div>
            </div>
            <button
              onClick={() => setIsAddingClient(true)}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl inline-flex items-center justify-center hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm md:text-base"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Add Client
            </button>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg md:rounded-xl">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">Total Clients</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{totalClients}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-green-100 rounded-lg md:rounded-xl">
                  <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-orange-100 rounded-lg md:rounded-xl">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">Pending Amount</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">₹{totalPending.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-red-100 rounded-lg md:rounded-xl">
                  <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                </div>
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">Clients with Pending</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{clientsWithPending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-3 pl-9 md:pl-11 border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 text-sm md:text-base"
                />
                <Search className="absolute left-2 md:left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl border-2 transition-all duration-200 flex items-center justify-center text-sm md:text-base ${
                  showFilters 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Filter className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Filters
              </button>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg md:rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 md:p-2 rounded-md md:rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 md:p-2 rounded-md md:rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg md:rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="text-xs md:text-sm font-semibold text-gray-700 mb-2 block">Trust Score</label>
                  <select
                    value={trustScoreFilter}
                    onChange={(e) => setTrustScoreFilter(e.target.value as any)}
                    className="w-full px-2 md:px-3 py-2 border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 text-sm md:text-base"
                  >
                    <option value="all">All Levels</option>
                    <option value="high">High (80+)</option>
                    <option value="medium">Medium (50-79)</option>
                    <option value="low">Low (&lt;50)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Payment Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Fully Paid</option>
                    <option value="pending">Has Pending</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setTrustScoreFilter('all');
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Client Form Modal */}
        {isAddingClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <ClientForm
                onSubmit={handleAddClient}
                onCancel={() => setIsAddingClient(false)}
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl">
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Database Error</h3>
                  <div className="text-red-700">
                    {error.includes('index') ? (
                      <p>Firestore composite index required. Check Firebase Console.</p>
                    ) : error.includes('toDate') ? (
                      <p>Date format error. Check Firestore date field types.</p>
                    ) : (
                      <p>An error occurred while loading data.</p>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-red-600 bg-red-100 p-3 rounded-xl font-mono break-all">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          ) : filteredAndSortedClients.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredAndSortedClients.map(client => (
                  <div key={client.id} className="h-full">
                    <ClientCard
                      client={client}
                      totalSpent={clientTransactions[client.id]?.totalSpent || 0}
                      pendingAmount={clientTransactions[client.id]?.pendingAmount || 0}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedClients.map(client => (
                  <div key={client.id} className="max-w-4xl">
                    <ClientCard
                      client={client}
                      totalSpent={clientTransactions[client.id]?.totalSpent || 0}
                      pendingAmount={clientTransactions[client.id]?.pendingAmount || 0}
                    />
                  </div>
                ))}
              </div>
            )
          ) : searchQuery || trustScoreFilter !== 'all' || statusFilter !== 'all' ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTrustScoreFilter('all');
                  setStatusFilter('all');
                }}
                className="px-6 py-3 text-purple-600 hover:text-purple-700 font-medium border-2 border-purple-200 rounded-xl hover:border-purple-300 transition-all duration-200"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first client</p>
              <button
                onClick={() => setIsAddingClient(true)}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl inline-flex items-center hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Client
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;