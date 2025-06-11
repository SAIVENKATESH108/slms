import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List, 
  Plus,
  Download,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { useClientStore } from '../../stores/clientStore';
import { Client, FilterOptions, SortOptions } from '../../types/ClientManagement';
import EnhancedClientForm from './EnhancedClientForm';

type ViewMode = 'grid' | 'list';

const ClientList: React.FC = () => {
  const { clients, loading, fetchClients, addClient, updateClient, deleteClient } = useClientStore();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    trustScore: 'all',
    paymentStatus: 'all',
    dateRange: {},
    tags: [],
    apartment: ''
  });

  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'name',
    direction: 'asc'
  });

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter(client => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        client.name.toLowerCase().includes(searchLower) ||
        client.phone.includes(searchQuery) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.flatNumber.includes(searchQuery) ||
        client.tags.some(tag => tag.toLowerCase().includes(searchLower));

      // Status filter
      const matchesStatus = filters.status === 'all' || client.status === filters.status;

      // Trust score filter
      let matchesTrustScore = true;
      if (filters.trustScore !== 'all') {
        if (filters.trustScore === 'high' && client.trustScore < 80) matchesTrustScore = false;
        if (filters.trustScore === 'medium' && (client.trustScore < 50 || client.trustScore >= 80)) matchesTrustScore = false;
        if (filters.trustScore === 'low' && client.trustScore >= 50) matchesTrustScore = false;
      }

      // Apartment filter
      const matchesApartment = !filters.apartment || client.apartment === filters.apartment;

      // Tags filter
      const matchesTags = filters.tags.length === 0 || 
        filters.tags.some(tag => client.tags.includes(tag));

      return matchesSearch && matchesStatus && matchesTrustScore && matchesApartment && matchesTags;
    });

    // Sort clients
    filtered.sort((a, b) => {
      let aValue: any = a[sortOptions.field];
      let bValue: any = b[sortOptions.field];

      if (sortOptions.field === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOptions.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [clients, searchQuery, filters, sortOptions]);

  const handleSort = (field: SortOptions['field']) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAddClient = async (clientData: any) => {
    try {
      await addClient(clientData);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleEditClient = async (clientData: any) => {
    if (selectedClient) {
      try {
        await updateClient(selectedClient.id, clientData);
        setShowEditForm(false);
        setSelectedClient(null);
      } catch (error) {
        console.error('Error updating client:', error);
      }
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(clientId);
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500">{filteredAndSortedClients.length} of {clients.length} clients</p>
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
          <div className="flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name, phone, email, or flat number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortOptions.field}
            onChange={(e) => handleSort(e.target.value as SortOptions['field'])}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Name</option>
            <option value="createdAt">Date Added</option>
            <option value="trustScore">Trust Score</option>
          </select>
          <button
            onClick={() => setSortOptions(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {sortOptions.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trust Score</label>
              <select
                value={filters.trustScore}
                onChange={(e) => setFilters(prev => ({ ...prev, trustScore: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Scores</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (50-79)</option>
                <option value="low">Low (&lt;50)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apartment</label>
              <input
                type="text"
                placeholder="Filter by apartment"
                value={filters.apartment}
                onChange={(e) => setFilters(prev => ({ ...prev, apartment: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  status: 'all',
                  trustScore: 'all',
                  paymentStatus: 'all',
                  dateRange: {},
                  tags: [],
                  apartment: ''
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.apartment} - {client.flatNumber}</p>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {client.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {client.email}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {client.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTrustScoreColor(client.trustScore)}`}>
                  <Star className="h-3 w-3 mr-1" />
                  {client.trustScore}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Added {new Date(client.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setShowEditForm(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trust Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">Added {new Date(client.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.phone}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.apartment}</div>
                    <div className="text-sm text-gray-500">Flat {client.flatNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTrustScoreColor(client.trustScore)}`}>
                      <Star className="h-3 w-3 mr-1" />
                      {client.trustScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowEditForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Client</h2>
              <EnhancedClientForm
                onSubmit={handleAddClient}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditForm && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Client</h2>
              <EnhancedClientForm
                initialData={selectedClient}
                onSubmit={handleEditClient}
                onCancel={() => {
                  setShowEditForm(false);
                  setSelectedClient(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '' && (!Array.isArray(f) || f.length > 0))
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first client'
            }
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientList;