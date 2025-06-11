import React from 'react';
import { Edit, Trash2, DollarSign, Clock, Tag } from 'lucide-react';
import { Service } from '../../services/firestoreService';

interface ServiceCardProps {
  service: Service;
  canManage: boolean;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, canManage, onEdit, onDelete }) => {
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            {service.category}
          </span>
          {service.isShared && (
            <span className="inline-block ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Shared
            </span>
          )}
        </div>
        
        {canManage && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(service)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(service.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
      
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
          <span className="text-sm text-gray-700">{service.duration || 30} min</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Tag className="w-4 h-4 mr-1" />
            <span>Status</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            service.isActive !== false
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {service.isActive !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;