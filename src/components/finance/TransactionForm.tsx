import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Client } from '../../stores/clientStore';
import { firestoreService, Service } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { X, CreditCard, User, Scissors, DollarSign, Calendar, CheckCircle, Clock, Zap } from 'lucide-react';

interface TransactionFormData {
  clientId: string;
  service: string;
  amount: number;
  isPaid: boolean;
  dueDate: string;
  paymentReference?: string;
  paymentMethods?: string[];
}

interface TransactionFormProps {
  clients: Client[];
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  initialValues?: Partial<TransactionFormData>;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  clients,
  onSubmit,
  onCancel,
  initialValues = {
    clientId: '',
    service: '',
    amount: 0,
    isPaid: true,
    dueDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
  },
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues: initialValues,
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [usePayNowMode, setUsePayNowMode] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { user } = useAuthStore();
  const isPaid = watch('isPaid', initialValues.isPaid);
  const selectedService = watch('service');
  const clientId = watch('clientId');
  const amount = watch('amount');

  useEffect(() => {
    const fetchServices = async () => {
      if (!user?.uid) {
        console.log('TransactionForm: No user found, cannot fetch services');
        return;
      }

      try {
        setLoading(true);
        console.log('TransactionForm: Fetching services for user:', user.uid);
        
        // Load services from both shared collection and user's specific collection
        const loadedServices = await firestoreService.loadServicesSettings(user.uid);
        console.log('TransactionForm: loadServicesSettings returned', loadedServices.length, 'services');
        
        setServices(loadedServices);
      } catch (error) {
        console.error('Failed to load services:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [user?.uid]);

  // Auto-fill amount when service is selected
  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service && service.price && service.price > 0) {
        setValue('amount', service.price);
      }
    }
  }, [selectedService, services, setValue]);

  const handleFormSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment successful:', paymentData);
    setPaymentProcessing(false);
    
    // Auto-fill payment details
    setValue('isPaid', true);
    setValue('paymentReference', paymentData.paymentId || paymentData.transactionId);
    
    // Auto-submit the form with payment data
    const formData = {
      clientId,
      service: selectedService,
      amount,
      isPaid: true,
      dueDate: new Date().toISOString().split('T')[0],
      paymentReference: paymentData.paymentId || paymentData.transactionId,
      paymentMethods: ['Razorpay'],
    };
    
    onSubmit(formData);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    setPaymentProcessing(false);
    alert(`Payment failed: ${error}`);
  };

  const getSelectedClient = () => {
    return clients.find(client => client.id === clientId);
  };

  const canShowPayNow = () => {
    return clientId && selectedService && amount > 0 && !isPaid;
  };

  const shouldShowPayNowButton = () => {
    return usePayNowMode && canShowPayNow();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Transaction</h2>
                <p className="text-green-100 text-sm">Create a new financial record</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <User className="h-4 w-4 mr-2 text-green-600" />
                Client *
              </label>
              <div className="relative">
                <select
                  className={`w-full px-4 py-3 pl-11 border-2 ${
                    errors.clientId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  } rounded-xl shadow-sm focus:ring-4 focus:ring-green-100 transition-all duration-200 appearance-none bg-white`}
                  {...register('clientId', { required: 'Client is required' })}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - Flat {client.flatNumber}
                    </option>
                  ))}
                </select>
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {errors.clientId && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {errors.clientId.message}
                </p>
              )}
            </div>

            {/* Service Selection */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Scissors className="h-4 w-4 mr-2 text-green-600" />
                Service *
              </label>
              <div className="relative">
                <select
                  className={`w-full px-4 py-3 pl-11 border-2 ${
                    errors.service ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  } rounded-xl shadow-sm focus:ring-4 focus:ring-green-100 transition-all duration-200 appearance-none bg-white`}
                  {...register('service', { required: 'Service is required' })}
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ₹{service.price}
                      {service.isShared && " (Shared)"}
                    </option>
                  ))}
                </select>
                <Scissors className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {errors.service && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {errors.service.message}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                Amount (₹) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  className={`w-full px-4 py-3 pl-11 border-2 ${
                    errors.amount ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  } rounded-xl shadow-sm focus:ring-4 focus:ring-green-100 transition-all duration-200`}
                  placeholder="Enter amount"
                  {...register('amount', { 
                    required: 'Amount is required',
                    valueAsNumber: true,
                    min: { value: 1, message: 'Amount must be greater than 0' }
                  })}
                />
                <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Payment Status */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPaid"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  {...register('isPaid')}
                />
                <label htmlFor="isPaid" className="text-sm text-gray-700 flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Payment received
                </label>
              </div>

              {/* Pay Now Mode Toggle */}
              {canShowPayNow() && (
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="usePayNowMode"
                    checked={usePayNowMode}
                    onChange={(e) => setUsePayNowMode(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="usePayNowMode" className="text-sm text-gray-700">
                    Use Pay Now (Process payment immediately)
                  </label>
                </div>
              )}
            </div>

            {/* Payment Reference (if paid) */}
            {isPaid && (
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Payment Reference
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 pl-11 border-2 border-gray-200 focus:border-green-500 rounded-xl shadow-sm focus:ring-4 focus:ring-green-100 transition-all duration-200"
                    placeholder="Enter payment reference"
                    {...register('paymentReference')}
                  />
                  <CheckCircle className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            )}

            {/* Due Date (if not paid) */}
            {!isPaid && !shouldShowPayNowButton() && (
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="h-4 w-4 mr-2 text-green-600" />
                  Due Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className={`w-full px-4 py-3 pl-11 border-2 ${
                      errors.dueDate ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                    } rounded-xl shadow-sm focus:ring-4 focus:ring-green-100 transition-all duration-200`}
                    {...register('dueDate', { required: !isPaid && !shouldShowPayNowButton() && 'Due date is required' })}
                  />
                  <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.dueDate && (
                  <p className="text-sm text-red-600 flex items-center">
                    <X className="h-4 w-4 mr-1" />
                    {errors.dueDate.message}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              {/* Show regular submit button only when not in Pay Now mode */}
              {!shouldShowPayNowButton() && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : (isPaid ? 'Save Transaction' : 'Create Payment Reminder')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;