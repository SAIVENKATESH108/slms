import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Upload,
  Download,
  FileText,
  DollarSign,
  Clock,
  Tag,
  Filter
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { authService } from '../services/AuthService';
import { serviceManagementService, Service } from '../services/serviceManagementService';

// Service interface is now imported from serviceManagementService

const Services = () => {
  const { user } = useAuthStore();
  const { role } = useUserStore();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [bulkData, setBulkData] = useState('');

  // Helper function to check if user can manage services
  const canManageServices = () => {
    return role === 'admin' || role === 'manager';
  };

  // Fetch services from fileContents collection
  const fetchServices = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const servicesData = await serviceManagementService.getAllServices();
      setServices(servicesData);
      setFilteredServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter services based on search and category
  useEffect(() => {
    let filtered = services;
    
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }
    
    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchServices();
  }, [user]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  // Add new service
  const handleAddService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!user || !canManageServices()) return;
    
    try {
      await serviceManagementService.addService(serviceData);
      await fetchServices();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service: ' + error.message);
    }
  };

  // Update service
  const handleUpdateService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!user || !editingService || !canManageServices()) return;
    
    try {
      await serviceManagementService.updateService(editingService.id, serviceData);
      await fetchServices();
      setEditingService(null);
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service: ' + error.message);
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId: string) => {
    if (!user || !canManageServices()) return;
    
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceManagementService.deleteService(serviceId);
        await fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service: ' + error.message);
      }
    }
  };

  // Bulk upload services
  const handleBulkUpload = async () => {
    if (!user || !canManageServices() || !bulkData.trim()) return;
    
    try {
      const servicesData = serviceManagementService.parseCSVForBulkUpload(bulkData);
      await serviceManagementService.bulkUploadServices(servicesData);
      
      await fetchServices();
      setShowBulkUpload(false);
      setBulkData('');
    } catch (error) {
      console.error('Error bulk uploading services:', error);
      alert('Failed to bulk upload services: ' + error.message);
    }
  };

  // Export services to CSV
  const handleExportServices = () => {
    const csvContent = serviceManagementService.exportServicesToCSV(services);
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'services.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Services 💼
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Manage your service offerings and pricing
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportServices}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            
            {canManageServices() && (
              <>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </button>
                
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {service.category}
                </span>
              </div>
              
              {canManageServices() && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingService(service)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>Price</span>
                </div>
                <span className="font-semibold text-green-600">{formatCurrency(service.price)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Duration</span>
                </div>
                <span className="text-sm text-gray-700">{service.duration} min</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Tag className="w-4 h-4 mr-1" />
                  <span>Status</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  service.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first service'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {(showAddModal || editingService) && (
        <ServiceModal
          service={editingService}
          onSave={editingService ? handleUpdateService : handleAddService}
          onClose={() => {
            setShowAddModal(false);
            setEditingService(null);
          }}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          data={bulkData}
          onChange={setBulkData}
          onUpload={handleBulkUpload}
          onClose={() => {
            setShowBulkUpload(false);
            setBulkData('');
          }}
        />
      )}
    </div>
  );
};

// Service Modal Component
const ServiceModal: React.FC<{
  service?: Service | null;
  onSave: (data: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  onClose: () => void;
}> = ({ service, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || 0,
    duration: service?.duration || 0,
    category: service?.category || '',
    isActive: service?.isActive !== false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.description && formData.category) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (INR)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active service
              </label>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {service ? 'Update' : 'Add'} Service
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Bulk Upload Modal Component
const BulkUploadModal: React.FC<{
  data: string;
  onChange: (data: string) => void;
  onUpload: () => void;
  onClose: () => void;
}> = ({ data, onChange, onUpload, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Upload Services</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Enter service data in CSV format. Each line should contain:
            </p>
            <code className="text-xs bg-gray-100 p-2 rounded block">
              Name, Description, Price, Duration (minutes), Category
            </code>
            <p className="text-xs text-gray-500 mt-1">
              Example: Hair Cut, Professional hair cutting service, 500, 30, Hair Care
            </p>
          </div>
          
          <textarea
            value={data}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Hair Cut, Professional hair cutting service, 500, 30, Hair Care&#10;Hair Color, Hair coloring and styling, 1500, 90, Hair Care&#10;Facial, Deep cleansing facial treatment, 800, 45, Skin Care"
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
          />
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onUpload}
              disabled={!data.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;