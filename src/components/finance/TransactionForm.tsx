

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Client } from '../../stores/clientStore';
import { serviceManagementService, Service } from '../../services/serviceManagementService';
import { useAuthStore } from '../../stores/authStore';

import { usePayment } from '../../hooks/usePayment';

interface TransactionFormData {
  clientId: string;
  service: string; // This will now hold service ID instead of name
  amount: number;
  isPaid: boolean;
  dueDate: string;
  paymentReference?: string;
  paymentMethods?: string[];
}

interface TransactionFormProps {
  clients: Client[];
  services: Service[]; // add services as prop
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  initialValues?: Partial<TransactionFormData>;
}

const paymentMethodOptions = [
  'UPI',
  'Razorpay',
  'GPay',
  'PhonePe',
  'Paytm',
];

const TransactionForm = ({
  clients,
  services,
  onSubmit,
  onCancel,
  initialValues = {
    clientId: '',
    service: '',
    amount: 0,
    isPaid: true,
    dueDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    paymentMethods: [],
  },
}: TransactionFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues: initialValues,
  });

  const [showDrawer, setShowDrawer] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'manual' | 'gateway'>('manual');
  const isPaid = watch('isPaid', initialValues.isPaid);
  const paymentMethods = watch('paymentMethods', initialValues.paymentMethods || []) || [];
  const clientId = watch('clientId');
  const service = watch('service');
  const amount = watch('amount');

  // Payment gateway status
  const { availableGateways } = usePayment();
  const hasAvailableGateway = availableGateways.some(g => g.available);

  const handlePaymentMethodChange = (method: string) => {
    if (paymentMethods.includes(method)) {
      setValue('paymentMethods', paymentMethods.filter(m => m !== method));
    } else {
      setValue('paymentMethods', [...paymentMethods, method]);
    }
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment successful:', paymentData);
    setPaymentProcessing(false);

    // Auto-fill payment details
    setValue('isPaid', true);
    setValue('paymentReference', paymentData.paymentId || paymentData.transactionId);
    setValue('paymentMethods', ['Razorpay']); // or based on the gateway used

    // Set payment mode to gateway and reset drawer
    setPaymentMode('gateway');
    setShowDrawer(false);

    // Auto-submit the form with payment data
    const formData = {
      clientId,
      service,
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
    return clientId && service && amount > 0 && !isPaid;
  };

  const addNewService = () => {
    if (newServiceName.trim() === '') {
      alert('Service name cannot be empty');
      return;
    }
    // Add new service to services list and select it
    const newService: Service = {
      id: `new-${Date.now()}`, // temporary id
      name: newServiceName.trim(),
      category: 'General',
      price: 0,
      description: '',
      isActive: true,
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      createdBy: '',
    };
    setValue('service', newService.id);
    setShowDrawer(false);
    setNewServiceName('');
    // Optionally, you can notify parent component about new service addition
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
            Client
          </label>
          <select
            id="clientId"
            className={`w-full px-3 py-2 border ${errors.clientId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500`}
            {...register('clientId', { required: 'Client is required' })}
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} (Flat {client.flatNumber})
              </option>
            ))}
          </select>
          {errors.clientId && (
            <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
            Service
          </label>
          <div className="flex space-x-2 items-center">
            <input
              type="text"
              id="serviceInput"
              className={`flex-grow px-3 py-2 border ${errors.service ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500`}
              placeholder="Select or add a service"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              onFocus={() => setShowDrawer(true)}
              {...register('service', { required: 'Service is required' })}
            />
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Select Service
            </button>
          </div>
          {errors.service && (
            <p className="mt-1 text-sm text-red-600">{errors.service.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (INR)
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="1"
            className={`w-full px-3 py-2 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500`}
            placeholder="0"
            {...register('amount', {
              required: 'Amount is required',
              valueAsNumber: true,
              min: { value: 1, message: 'Amount must be greater than 0' },
            })}
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
        </div>

        {/* Payment Status Section */}
        <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Information
          </h3>
          
          {/* ... rest of the form remains unchanged ... */}
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            style={{ minWidth: '100px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={paymentProcessing}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: '100px' }}
          >
            {paymentProcessing ? 'Processing...' : isPaid ? 'Save Transaction' : 'Create Payment Reminder'}
          </button>
        </div>
      </form>

      {/* Drawer for selecting or adding service */}
      {showDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="bg-white w-80 p-4 h-full shadow-lg overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Select or Add Service</h2>
            <input
              type="text"
              placeholder="Search or add a service"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="max-h-64 overflow-auto mb-4">
              {services
                .filter(s => s.name.toLowerCase().includes(newServiceName.toLowerCase()))
                .map(service => (
                  <div
                    key={service.id}
                    className="p-2 cursor-pointer hover:bg-gray-100 rounded"
                    onClick={() => {
                      setValue('service', service.id);
                      setNewServiceName(service.name);
                      setShowDrawer(false);
                    }}
                  >
                    {service.name}
                  </div>
                ))}
              {newServiceName && !services.some(s => s.name.toLowerCase() === newServiceName.toLowerCase()) && (
                <div className="p-2 cursor-pointer hover:bg-green-100 rounded text-green-700 font-semibold"
                  onClick={addNewService}
                >
                  Add new service: "{newServiceName}"
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="px-3 py-1 border rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionForm;

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount (INR)
        </label>
        <input
          id="amount"
          type="number"
          min="0"
          step="1"
          className={`w-full px-3 py-2 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500`}
          placeholder="0"
          {...register('amount', {
            required: 'Amount is required',
            valueAsNumber: true,
            min: { value: 1, message: 'Amount must be greater than 0' },
          })}
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
      </div>

      {/* Payment Status Section */}
      <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Payment Information
        </h3>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="isPaid"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                {...register('isPaid')}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setPaymentMode('manual');
                    setShowPaymentGateway(false);
                    setPayNowMode(false);
                  }
                }}
              />
              <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-700">
                Payment received
              </label>
            </div>

            {/* Pay Now Checkbox */}
            {!isPaid && canShowPayNow() && (
              <div className={`border rounded-lg p-3 ml-6 ${payNowMode ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center">
                  <input
                    id="payNowMode"
                    type="checkbox"
                    checked={payNowMode}
                    onChange={(e) => {
                      setPayNowMode(e.target.checked);
                      if (e.target.checked) {
                        setPaymentMode('gateway');
                        setShowPaymentGateway(true);
                      } else {
                        setShowPaymentGateway(false);
                      }
                    }}
                    disabled={!hasAvailableGateway}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <label htmlFor="payNowMode" className={`ml-2 block text-sm font-medium flex items-center ${!hasAvailableGateway ? 'text-gray-400' : payNowMode ? 'text-green-700' : 'text-blue-700'}`}>
                    Pay Now (Process payment immediately)
                    {hasAvailableGateway ? (
                      <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 ml-1" />
                    )}
                  </label>
                </div>
                <p className={`text-xs mt-1 ${!hasAvailableGateway ? 'text-gray-500' : payNowMode ? 'text-green-600' : 'text-blue-600'}`}>
                  {hasAvailableGateway 
                    ? (payNowMode 
                        ? 'Payment gateway will be used to process payment before saving transaction'
                        : 'Check this to redirect to payment gateway and auto-save after successful payment'
                      )
                    : 'Payment gateway not configured. Check Payment Demo page for setup instructions.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Payment Mode Selection */}
          {isPaid && (
            <div className="space-y-3 pl-6 border-l-2 border-purple-200">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="manual"
                      checked={paymentMode === 'manual'}
                      onChange={(e) => {
                        setPaymentMode('manual');
                        setShowPaymentGateway(false);
                      }}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Manual Entry</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="gateway"
                      checked={paymentMode === 'gateway'}
                      onChange={(e) => {
                        setPaymentMode('gateway');
                        setShowPaymentGateway(true);
                      }}
                      disabled={!hasAvailableGateway}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 disabled:opacity-50"
                    />
                    <span className={`ml-2 text-sm flex items-center ${!hasAvailableGateway ? 'text-gray-400' : 'text-gray-700'}`}>
                      Payment Gateway
                      {hasAvailableGateway ? (
                        <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500 ml-1" />
                      )}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Process Payment Now for Unpaid */}
          {!isPaid && canShowPayNow() && (
            <div className={`border rounded-lg p-3 ${hasAvailableGateway ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-medium ${hasAvailableGateway ? 'text-blue-800' : 'text-yellow-800'}`}>
                    Process Payment Now
                  </h4>
                  <p className={`text-xs ${hasAvailableGateway ? 'text-blue-600' : 'text-yellow-600'}`}>
                    {hasAvailableGateway 
                      ? 'Collect payment immediately using payment gateway'
                      : 'Payment gateway not configured. Check Payment Demo page for setup instructions.'
                    }
                  </p>
                </div>
                {hasAvailableGateway ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentGateway(!showPaymentGateway);
                      if (!showPaymentGateway) {
                        setPaymentMode('gateway');
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {showPaymentGateway ? 'Hide' : 'Pay Now'}
                  </button>
                ) : (
                  <a
                    href="/payment-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Setup Guide
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Payment Details */}
      {isPaid && paymentMode === 'manual' && (
        <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-semibold text-gray-800">Manual Payment Details</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Reference
              </label>
              <input
                id="paymentReference"
                type="text"
                className={`w-full px-3 py-2 border ${errors.paymentReference ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500`}
                placeholder="Enter payment reference"
                {...register('paymentReference')}
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Payment Methods</span>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethodOptions.map((method) => (
                  <label key={method} className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={paymentMethods.includes(method)}
                      onChange={() => handlePaymentMethodChange(method)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Section */}
      {(showPaymentGateway || (isPaid && paymentMode === 'gateway')) && canShowPayNow() && (
        <div className={`border rounded-lg p-4 ${hasAvailableGateway ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h3 className={`text-sm font-semibold mb-3 flex items-center ${hasAvailableGateway ? 'text-green-800' : 'text-red-800'}`}>
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Gateway
          </h3>
          <div className="space-y-3">
            {hasAvailableGateway ? (
              <>
                <div className="bg-white rounded-md p-3 border border-green-200">
                  <PayNowButton
                    amount={amount}
                    clientId={clientId}
                    clientName={getSelectedClient()?.name || 'Unknown Client'}
                    service={service}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                    disabled={paymentProcessing}
                    className="w-full"
                  />
                </div>
                <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                  <p><strong>Note:</strong> Payment will be processed securely through our payment gateway. Transaction details will be automatically filled upon successful payment.</p>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-md p-3 border border-red-200">
                <div className="text-center py-4">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <h4 className="text-sm font-medium text-red-800 mb-1">Payment Gateway Not Available</h4>
                  <p className="text-xs text-red-600 mb-3">
                    No payment gateways are configured. Please set up your payment gateway credentials.
                  </p>
                  <a
                    href="/payment-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                  >
                    View Setup Guide
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pay Now Mode Section */}
      {payNowMode && hasAvailableGateway && !isPaid && (
        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
          <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Now Mode Active
          </h3>
          <div className="space-y-3">
            <div className="bg-white rounded-md p-3 border border-green-200">
              <p className="text-sm text-green-700 mb-3">
                <strong>Ready to process payment:</strong> Click the button below to redirect to the payment gateway. After successful payment, the transaction will be automatically saved.
              </p>
              <PayNowButton
                amount={amount}
                clientId={clientId}
                clientName={getSelectedClient()?.name || 'Unknown Client'}
                service={service}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                disabled={paymentProcessing}
                className="w-full"
              />
            </div>
            <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
              <p><strong>Note:</strong> You will be redirected to the payment gateway. After successful payment, you'll be brought back and the transaction will be saved automatically.</p>
            </div>
          </div>
        </div>
      )}

      {!isPaid && (
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            id="dueDate"
            type="date"
            className={`w-full px-3 py-2 border ${errors.dueDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500`}
            {...register('dueDate', { required: !isPaid && 'Due date is required' })}
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
          )}
        </div>
      )}



      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          style={{ minWidth: '100px' }}
        >
          Cancel
        </button>
        
        {/* Show different submit buttons based on payment status and mode */}
        {!payNowMode && !showPaymentGateway && (
          <button
            type="submit"
            disabled={paymentProcessing || payNowMode}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: '100px' }}
          >
            {paymentProcessing ? 'Processing...' : 
             isPaid ? 'Save Transaction' : 
             payNowMode ? 'Use Payment Button Above' : 'Create Payment Reminder'}
          </button>
        )}


        
        {/* Show payment gateway toggle for unpaid transactions */}
        {!isPaid && canShowPayNow() && !showPaymentGateway && !payNowMode && (
          <button
            type="button"
            onClick={() => setShowPaymentGateway(true)}
            disabled={!hasAvailableGateway}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              hasAvailableGateway 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                : 'bg-gray-400'
            }`}
            style={{ minWidth: '120px' }}
            title={!hasAvailableGateway ? 'Payment gateway not configured' : 'Process payment using gateway'}
          >
            Process Payment
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
