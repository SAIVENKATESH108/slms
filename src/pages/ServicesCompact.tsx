import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Upload,
  Download,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { serviceManagementService, Service } from '../services/serviceManagementService';
import ServiceCard from '../components/services/ServiceCard';
import ServiceModal from '../components/services/ServiceModal';
import BulkUploadModal from '../components/services/BulkUploadModal';

const ServicesCompact = () => {
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

  const canManageServices = () => {
    // Temporarily allow all users to manage services for testing
    return true;
    // return role === 'admin' || role === 'manager';
  };

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

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  const handleAddService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    try {
      await serviceManagementService.addService(serviceData);
      await fetchServices();
      setShowAddModal(false);
    } catch (error: any) {
      alert('Failed to add service: ' + error.message);
    }
  };

  const handleUpdateService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!editingService) return;
    
    try {
      await serviceManagementService.updateService(editingService.id, serviceData);
      await fetchServices();
      setEditingService(null);
    } catch (error: any) {
      alert('Failed to update service: ' + error.message);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceManagementService.deleteService(serviceId);
        await fetchServices();
      } catch (error: any) {
        alert('Failed to delete service: ' + error.message);
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkData.trim()) return;
    
    try {
      const servicesData = serviceManagementService.parseCSVForBulkUpload(bulkData);
      await serviceManagementService.bulkUploadServices(servicesData);
      
      await fetchServices();
      setShowBulkUpload(false);
      setBulkData('');
    } catch (error: any) {
      alert('Failed to bulk upload services: ' + error.message);
    }
  };

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

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services 💼</h1>
          <p className="text-gray-600">Manage your service offerings</p>
        </div>
        
        <div className="flex gap-2">
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
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
          <ServiceCard
            key={service.id}
            service={service}
            canManage={canManageServices()}
            onEdit={setEditingService}
            onDelete={handleDeleteService}
          />
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

      {/* Modals */}
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

export default ServicesCompact;