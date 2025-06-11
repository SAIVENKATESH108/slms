import React, { useState, useEffect } from 'react';
import { Scissors, Trash2, Edit2, Check, X, Upload } from 'lucide-react';
import { firestoreService, Service, ServiceData } from '../../services/firestoreService';
// Add this import for Firebase Auth
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/config';

const ServiceSettings = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState<string | null>(null);

  // Get current user
  const [user, loading] = useAuthState(auth);

  // Helper function to parse nested service structure
  const parseNestedServices = (data: Record<string, any>): ServiceData[] => {
    const services: ServiceData[] = [];
    
    // Function to recursively parse nested objects
    const parseCategory = (obj: Record<string, any>, categoryName: string, parentKey: string = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // If it's an object, recursively parse it
          parseCategory(value, categoryName, key);
        } else {
          // It's a service with a price
          const serviceName = parentKey ? `${parentKey} - ${key}` : key;
          const price = typeof value === 'number' ? value : 0;
          
          // Skip non-numeric prices or design-based services for now
          if (typeof value === 'number') {
            services.push({
              name: serviceName,
              category: categoryName.toLowerCase().replace(/\s+/g, '_'),
              price: price,
              description: `${categoryName} - ${serviceName}`
            });
          }
        }
      });
    };


    // Parse each top-level category
    Object.entries(data).forEach(([categoryName, categoryData]) => {
      if (typeof categoryData === 'object' && categoryData !== null) {
        parseCategory(categoryData, categoryName);
      }
    });

    return services;
  };

  const fetchServices = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setError(null);
    try {
      console.log('ServicesSettings: Loading services for user:', user.uid);
      // Load services from user-specific collection: users/{userId}/services
      const data = await firestoreService.loadServicesSettings(user.uid);
      console.log('ServicesSettings: Loaded', data.length, 'services');
      setServices(data || []);
    } catch (err) {
      setError('Failed to fetch services.');
      console.error('Error fetching user services:', err);
      setServices([]);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchServices();
    }
  }, [user, loading]);

  const addService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      name: '',
      category: '',
      price: 0,
      description: '',
      userId: user?.uid
    };
    setServices([...services, newService]);
    setEditIndex(services.length);
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const updatedServices = [...services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setServices(updatedServices);
  };

  const saveService = async (index: number) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    const service = services[index];
    setError(null);
    try {
      // Check if this is a new service (temporary ID) or existing service
      if (service.id && service.id.length > 10) { // Existing service has Firestore ID
        // Update service in user-specific collection
        await firestoreService.updateService(service.id, service, user.uid);
      } else {
        // New service - save to user-specific collection
        const serviceData: ServiceData = {
          name: service.name,
          category: service.category,
          price: service.price,
          description: service.description,
          userId: user.uid
        };
        // Add service to user-specific collection
        await firestoreService.addService(serviceData);
      }
      setEditIndex(null);
      await fetchServices();
    } catch (err) {
      setError('Failed to save service.');
      console.error('Error saving service:', err);
    }
  };

  const cancelEdit = (index: number) => {
    // If it's a new service (temporary ID), remove it
    if (services[index].id && services[index].id.length <= 10) {
      const updatedServices = services.filter((_, i) => i !== index);
      setServices(updatedServices);
    } else {
      // If it's an existing service, just refresh the data
      fetchServices();
    }
    setEditIndex(null);
  };

  const removeService = async (index: number) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    const serviceId = services[index].id;
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    setError(null);
    try {
      // Delete service from user-specific collection
      await firestoreService.deleteService(serviceId, user.uid);
      const updatedServices = services.filter((_, i) => i !== index);
      setServices(updatedServices);
    } catch (err) {
      setError('Failed to delete service.');
      console.error('Error deleting service:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setFileError('User not authenticated');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    setFileError(null);
    setFileSuccess(null);

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        let content: unknown = event.target?.result;
        let parsedContent: any;

        if (file.type === 'application/json') {
          parsedContent = JSON.parse(content as string);
        } else {
          // For text files, try to parse as JSON first, otherwise treat as plain text
          try {
            parsedContent = JSON.parse(content as string);
          } catch {
            setFileError('Text file must contain valid JSON format.');
            setFileLoading(false);
            return;
          }
        }

        // Validate and normalize the content
        let servicesData: any[] = [];

        if (Array.isArray(parsedContent)) {
          // Content is directly an array of services
          servicesData = parsedContent;
        } else if (parsedContent && typeof parsedContent === 'object' && Array.isArray(parsedContent.services)) {
          // Content is an object with a services property
          servicesData = parsedContent.services;
        } else if (parsedContent && typeof parsedContent === 'object') {
          // Handle nested category structure like your beauty_services.json
          servicesData = parseNestedServices(parsedContent);
        } else {
          setFileError('Invalid file format. Expected an array of services, an object with a "services" property, or a nested category structure.');
          setFileLoading(false);
          return;
        }

        // Validate that each service has the required fields
        const validServices = servicesData.filter(service => {
          return service && 
                 typeof service === 'object' && 
                 typeof service.name === 'string' && 
                 typeof service.category === 'string' && 
                 (typeof service.price === 'number' || !isNaN(Number(service.price))) &&
                 typeof service.description === 'string';
        });

        if (validServices.length === 0) {
          setFileError('No valid services found in file. Each service must have name, category, price, and description.');
          setFileLoading(false);
          return;
        }

        if (validServices.length < servicesData.length) {
          setFileError(`Warning: ${servicesData.length - validServices.length} invalid services were skipped. ${validServices.length} services will be imported.`);
        }

        // Normalize the services data
        const normalizedServices = validServices.map(service => ({
          name: service.name,
          category: service.category,
          price: typeof service.price === 'number' ? service.price : Number(service.price),
          description: service.description,
          userId: user.uid
        }));

        // Add each service to user-specific collection
        for (const serviceData of normalizedServices) {
          await firestoreService.addService(serviceData);
        }
        
        setFileSuccess(`Successfully imported ${normalizedServices.length} services.`);
        await fetchServices();
      } catch (err) {
        setFileError('Failed to read or save file content. Please check the file format.');
        console.error('Error uploading file:', err);
      } finally {
        setFileLoading(false);
      }
    };

    if (file.type === 'application/json' || file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      setFileError('Unsupported file type. Please upload a JSON or text file.');
      setFileLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-red-500">Please log in to access service settings.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Service Settings</h1>
        <button
          onClick={addService}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2"
        >
          <Scissors size={16} />
          <span>Add Service</span>
        </button>
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-medium">Upload JSON or Text File</label>
        <div className="mb-2 text-sm text-gray-600">
          <p>Upload a JSON file with services in one of these formats:</p>
          <div className="mt-1 pl-4 space-y-1">
            <p>• <strong>Array format:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{`[{"name": "Haircut", "category": "haircut", "price": 500, "description": "Basic haircut"}]`}</code></p>
            <p>• <strong>Object format:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{`{"services": [{"name": "Haircut", ...}]}`}</code></p>
            <p>• <strong>Nested format:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{`{"Hair Cuts": {"BABY CUT": 350, "U CUT": 400}}`}</code></p>
          </div>
        </div>
        <label
          htmlFor="file-upload"
          className="cursor-pointer inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 space-x-2"
        >
          <Upload size={16} />
          <span>Upload File</span>
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".json,text/plain"
          onChange={handleFileUpload}
          disabled={fileLoading}
          className="hidden"
        />
        {fileLoading && <p className="text-blue-600 mt-2">Uploading file...</p>}
        {fileError && <p className="text-red-600 mt-2">{fileError}</p>}
        {fileSuccess && <p className="text-green-600 mt-2">{fileSuccess}</p>}
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {services.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Scissors size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No services added yet</p>
          <p className="text-sm">Click "Add Service" to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service, index) => {
            const isEditing = editIndex === index;
            return (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Haircut"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={service.category}
                      onChange={(e) => updateService(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={!isEditing}
                    >
                      <option value="haircut">Haircut</option>
                      <option value="coloring">Hair Coloring</option>
                      <option value="styling">Hair Styling</option>
                      <option value="facial">Facial</option>
                      <option value="massage">Massage</option>
                      <option value="manicure">Manicure</option>
                      <option value="pedicure">Pedicure</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateService(index, 'price', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Brief description of the service"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            saveService(index);
                          }}
                          className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-md"
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            cancelEdit(index);
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditIndex(index);
                          }}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            removeService(index);
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Remove service"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServiceSettings;