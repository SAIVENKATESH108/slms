import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Edit,
  Trash2,
  Eye,
  Clock,
  DollarSign,
  Tag,
  ToggleLeft,
  ToggleRight,
  Star
} from 'lucide-react';
import { Service } from '../../types/ClientManagement';

const ServiceManager: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    priceRange: {
      min: '',
      max: ''
    },
    durationRange: {
      min: '',
      max: ''
    }
  });

  // Mock service data - replace with actual API calls
  useEffect(() => {
    const mockServices: Service[] = [
      {
        id: '1',
        name: 'Hair Styling',
        description: 'Professional hair styling and cutting service',
        category: 'Hair Care',
        duration: 60,
        price: 2500,
        isActive: true,
        requirements: ['Hair wash', 'Consultation'],
        createdAt: new Date('2024-01-01')
      },
      {
        id: '2',
        name: 'Facial Treatment',
        description: 'Deep cleansing facial with moisturizing treatment',
        category: 'Skin Care',
        duration: 90,
        price: 1800,
        isActive: true,
        requirements: ['Skin analysis', 'Patch test'],
        createdAt: new Date('2024-01-02')
      },
      {
        id: '3',
        name: 'Manicure & Pedicure',
        description: 'Complete nail care and beautification',
        category: 'Nail Care',
        duration: 75,
        price: 1200,
        isActive: true,
        requirements: ['Nail cleaning'],
        createdAt: new Date('2024-01-03')
      },
      {
        id: '4',
        name: 'Massage Therapy',
        description: 'Relaxing full body massage therapy',
        category: 'Wellness',
        duration: 120,
        price: 3000,
        isActive: false,
        requirements: ['Health consultation'],
        createdAt: new Date('2024-01-04')
      },
      {
        id: '5',
        name: 'Eyebrow Threading',
        description: 'Precise eyebrow shaping and threading',
        category: 'Beauty',
        duration: 30,
        price: 500,
        isActive: true,
        requirements: [],
        createdAt: new Date('2024-01-05')
      }
    ];
    setServices(mockServices);
  }, []);

  const categories = useMemo(() => {
    const cats = services.map(service => service.category);
    return ['all', ...Array.from(new Set(cats))];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        service.category.toLowerCase().includes(searchLower);

      const matchesCategory = filters.category === 'all' || service.category === filters.category;
      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'active' && service.isActive) ||
        (filters.status === 'inactive' && !service.isActive);

      // Price range filter
      let matchesPriceRange = true;
      if (filters.priceRange.min || filters.priceRange.max) {
        const min = parseFloat(filters.priceRange.min) || 0;
        const max = parseFloat(filters.priceRange.max) || Infinity;
        matchesPriceRange = service.price >= min && service.price <= max;
      }

      // Duration range filter
      let matchesDurationRange = true;
      if (filters.durationRange.min || filters.durationRange.max) {
        const min = parseFloat(filters.durationRange.min) || 0;
        const max = parseFloat(filters.durationRange.max) || Infinity;
        matchesDurationRange = service.duration >= min && service.duration <= max;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesPriceRange && matchesDurationRange;
    });
  }, [services, searchQuery, filters]);

  const toggleServiceStatus = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, isActive: !service.isActive }
        : service
    ));
  };

  const deleteService = (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      setServices(prev => prev.filter(service => service.id !== serviceId));
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const ServiceCard: React.FC<{ service: Service }> = ({ service }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
            <button
              onClick={() => toggleServiceStatus(service.id)}
              className="flex items-center"
            >
              {service.isActive ? (
                <ToggleRight className="h-5 w-5 text-green-500" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-3">{service.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              {service.category}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDuration(service.duration)}
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              ₹{service.price.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {service.requirements && service.requirements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Requirements:</p>
          <div className="flex flex-wrap gap-1">
            {service.requirements.map((req, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          service.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {service.isActive ? 'Active' : 'Inactive'}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedService(service)}
            className="p-1 text-gray-400 hover:text-blue-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedService(service);
              setShowAddForm(true);
            }}
            className="p-1 text-gray-400 hover:text-green-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteService(service.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ToggleRight className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {services.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.length - 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Services</h2>
          <p className="text-sm text-gray-500">{filteredServices.length} services</p>
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
          <button
            onClick={() => {
              setSelectedService(null);
              setShowAddForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search services by name, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (₹)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min price"
                  value={filters.priceRange.min}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: { ...prev.priceRange, min: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max price"
                  value={filters.priceRange.max}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceRange: { ...prev.priceRange, max: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min duration"
                  value={filters.durationRange.min}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    durationRange: { ...prev.durationRange, min: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max duration"
                  value={filters.durationRange.max}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    durationRange: { ...prev.durationRange, max: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                category: 'all',
                status: 'all',
                priceRange: { min: '', max: '' },
                durationRange: { min: '', max: '' }
              })}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Services Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(service.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{service.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleServiceStatus(service.id)}
                      className="flex items-center"
                    >
                      {service.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                      <span className={`ml-2 text-sm ${service.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedService(service)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedService(service);
                          setShowAddForm(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
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

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== '' && (!Array.isArray(f) || f.length > 0))
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first service'
            }
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setSelectedService(null);
                  setShowAddForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceManager;