import React from 'react';
import { Link } from 'react-router-dom';
import { Client } from '../../stores/clientStore';
import { UserCircle, Home, Phone, Star, Calendar, ArrowRight, Shield, Crown, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ClientCardProps {
  client: Client;
  totalSpent?: number;
  pendingAmount?: number;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, totalSpent = 0, pendingAmount = 0 }) => {
  // Function to determine trust score color and icon
  const getTrustScoreInfo = (score: number) => {
    if (score >= 80) return { 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      icon: Crown,
      label: 'Excellent'
    };
    if (score >= 50) return { 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      icon: Shield,
      label: 'Good'
    };
    return { 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      icon: AlertTriangle,
      label: 'Poor'
    };
  };

  const trustInfo = getTrustScoreInfo(client.trustScore);
  const TrustIcon = trustInfo.icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Link 
      to={`/clients/${client.id}`}
      className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-purple-200 relative overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Status indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                {client.name}
              </h3>
              <div className="flex items-center text-gray-500 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  Joined {format(new Date(client.createdAt), 'MMM yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Arrow Icon */}
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Flat Number</p>
              <p className="text-sm font-semibold text-gray-900">{client.flatNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Phone</p>
              <p className="text-sm font-semibold text-gray-900">{client.phone}</p>
            </div>
          </div>
        </div>

        {/* Financial Info */}
        {(totalSpent > 0 || pendingAmount > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">Total Spent</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totalSpent)}</p>
            </div>
            
            {pendingAmount > 0 && (
              <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-600 font-medium mb-1">Pending</p>
                <p className="text-lg font-bold text-orange-700">{formatCurrency(pendingAmount)}</p>
              </div>
            )}
          </div>
        )}

        {/* Trust Score & Tags */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${trustInfo.bgColor} ${trustInfo.borderColor} border`}>
            <TrustIcon className={`h-4 w-4 ${trustInfo.color}`} />
            <div>
              <p className="text-xs font-medium text-gray-600">Trust Score</p>
              <p className={`text-sm font-bold ${trustInfo.color}`}>
                {client.trustScore} • {trustInfo.label}
              </p>
            </div>
          </div>
          
          {client.tags && client.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {client.tags.slice(0, 2).map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 px-3 py-1 rounded-full font-medium border border-purple-200"
                >
                  {tag}
                </span>
              ))}
              {client.tags.length > 2 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium border border-gray-200">
                  +{client.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ClientCard;