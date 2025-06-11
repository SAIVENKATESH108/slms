import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  UserPlus,
  Download,
  Upload,
  MoreVertical
} from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { format } from 'date-fns';

interface ClientManagementProps {
  onSetMessage: (message: { type: 'success' | 'error'; text: string }) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ onSetMessage }) => {
  const {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    refreshClients
  } = useClients();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    refreshClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.phone.includes(searchQuery);
    
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        onSetMessage({ type: 'success', text: 'Client updated successfully' });
        setEditingClient(null);
      } else {
        await addClient(formData);
        onSetMessage({ type: 'success', text: 'Client added successfully' });
        setShowAddForm(false);
      }
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        status: 'active'
      });
    } catch (error) {
      onSetMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save client' 
      });
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address || '',
      notes: client.notes || '',
      status: client.status
    });
    setShowAddForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(clientId);
        onSetMessage({ type: 'success', text: 'Client deleted successfully' });
      } catch (error) {
        onSetMessage({ 
          type: 'error', 
          text: error instanceof Error ? error.message : 'Failed to delete client' 
        });
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedClients.length} clients?`)) {
      try {
        await Promise.all(selectedClients.map(id => deleteClient(id)));
        onSetMessage({ type: 'success', text: `${selectedClients.length} clients deleted successfully` });
        setSelectedClients([]);
        setShowBulkActions(false);
      } catch (error) {
        onSetMessage({ 
          type: 'error', 
          text: 'Failed to delete some clients' 
        });
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  };

  const exportClients = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Address', 'Status', 'Created Date'],
      ...filteredClients.map(client => [
        client.name,
        client.email,
        client.phone,
        client.address || '',
        client.status,
        format(new Date(client.createdAt), 'yyyy-MM-dd')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="mr-2 text-purple-600" size={20} />
            Client Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your client database and relationships
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={exportClients}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 text-sm"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm"
          >
            <Plus size={16} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Clients</p>
              <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Clients</p>
              <p className="text-2xl font-bold text-green-900">
                {clients.filter(c => c.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Inactive Clients</p>
              <p className="text-2xl font-bold text-orange-900">
                {clients.filter(c => c.status === 'inactive').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {selectedClients.length > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Delete ({selectedClients.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-800">
              {selectedClients.length} client(s) selected for deletion
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => {
                  setShowBulkActions(false);
                  setSelectedClients([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {filteredClients.length} client(s)
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredClients.map((client) => (
            <div key={client.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClients([...selectedClients, client.id]);
                    } else {
                      setSelectedClients(selectedClients.filter(id => id !== client.id));
                    }
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{client.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Mail size={14} className="mr-1" />
                          {client.email}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Phone size={14} className="mr-1" />
                          {client.phone}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No clients found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingClient ? 'Edit Client' : 'Add New Client'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingClient(null);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      address: '',
                      notes: '',
                      status: 'active'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save size={16} />
                    <span>{loading ? 'Saving...' : 'Save Client'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingClient(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        notes: '',
                        status: 'active'
                      });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;