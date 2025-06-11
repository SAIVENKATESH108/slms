import React, { useState, useEffect } from 'react';
import { unifiedDataService } from '../services/unifiedDataService';

// Example component showing how to use the new unified data service
const UnifiedDataServiceExample: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all data types using the unified service
      const [clientsData, servicesData, transactionsData] = await Promise.all([
        unifiedDataService.getClients(),
        unifiedDataService.getServices(),
        unifiedDataService.getTransactions()
      ]);

      setClients(clientsData);
      setServices(servicesData);
      setTransactions(transactionsData);

      console.log('Data loaded successfully:', {
        clients: clientsData.length,
        services: servicesData.length,
        transactions: transactionsData.length
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example: Add a new client
  const addNewClient = async () => {
    try {
      const newClientData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        apartment: 'A-101',
        flatNumber: '101',
        trustScore: 85,
        notes: 'New client from referral',
        tags: ['vip', 'referral'],
        status: 'active',
        preferredContactMethod: 'email',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const clientId = await unifiedDataService.addClient(newClientData);
      console.log('New client added with ID:', clientId);

      // Reload clients to show the new one
      const updatedClients = await unifiedDataService.getClients();
      setClients(updatedClients);

    } catch (err: any) {
      setError(err.message);
      console.error('Error adding client:', err);
    }
  };

  // Example: Update a client
  const updateClient = async (clientId: string) => {
    try {
      const updates = {
        trustScore: 95,
        notes: 'Updated trust score after successful payment',
        updatedAt: new Date()
      };

      await unifiedDataService.updateClient(clientId, updates);
      console.log('Client updated successfully');

      // Reload clients to show the update
      const updatedClients = await unifiedDataService.getClients();
      setClients(updatedClients);

    } catch (err: any) {
      setError(err.message);
      console.error('Error updating client:', err);
    }
  };

  // Example: Add a new service
  const addNewService = async () => {
    try {
      const newServiceData = {
        name: 'Premium Facial',
        description: 'Luxury facial treatment with organic products',
        category: 'Facial',
        duration: 90, // minutes
        price: 150,
        isActive: true,
        requirements: ['Skin consultation required'],
        createdAt: new Date()
      };

      const serviceId = await unifiedDataService.addService(newServiceData);
      console.log('New service added with ID:', serviceId);

      // Reload services
      const updatedServices = await unifiedDataService.getServices();
      setServices(updatedServices);

    } catch (err: any) {
      setError(err.message);
      console.error('Error adding service:', err);
    }
  };

  // Example: Add a new transaction
  const addNewTransaction = async () => {
    try {
      const newTransactionData = {
        clientId: clients[0]?.id || 'sample-client-id',
        serviceId: services[0]?.id || 'sample-service-id',
        type: 'service',
        description: 'Premium Facial Treatment',
        amount: 150,
        discount: 15,
        tax: 13.5,
        totalAmount: 148.5,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        paymentDate: new Date(),
        invoiceNumber: `INV-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const transactionId = await unifiedDataService.addTransaction(newTransactionData);
      console.log('New transaction added with ID:', transactionId);

      // Reload transactions
      const updatedTransactions = await unifiedDataService.getTransactions();
      setTransactions(updatedTransactions);

    } catch (err: any) {
      setError(err.message);
      console.error('Error adding transaction:', err);
    }
  };

  // Example: Search functionality
  const searchClients = async (searchTerm: string) => {
    try {
      const searchResults = await unifiedDataService.searchRecords('client', searchTerm);
      setClients(searchResults);
      console.log(`Found ${searchResults.length} clients matching "${searchTerm}"`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error searching clients:', err);
    }
  };

  // Example: Get data summary
  const getDataSummary = async () => {
    try {
      const summary = await unifiedDataService.getDataSummary();
      console.log('Data Summary:', summary);
      alert(`Data Summary:\nClients: ${summary.clients}\nServices: ${summary.services}\nTransactions: ${summary.transactions}\nAppointments: ${summary.appointments}\nStaff: ${summary.staff}`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error getting data summary:', err);
    }
  };

  // Example: View audit trail
  const viewAuditTrail = async (recordId: string) => {
    try {
      const auditTrail = await unifiedDataService.getAuditTrail(recordId);
      console.log('Audit Trail:', auditTrail);
      
      // Display audit trail in a simple format
      const auditInfo = auditTrail.map(entry => 
        `${entry.action} by ${entry.userId} at ${entry.timestamp}`
      ).join('\n');
      
      alert(`Audit Trail for ${recordId}:\n\n${auditInfo}`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error getting audit trail:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Unified Data Service Example</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800 font-medium">Error:</div>
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={addNewClient}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Add Client
        </button>
        <button
          onClick={addNewService}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Add Service
        </button>
        <button
          onClick={addNewTransaction}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Add Transaction
        </button>
        <button
          onClick={getDataSummary}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Data Summary
        </button>
      </div>

      {/* Search Example */}
      <div className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search clients..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                searchClients((e.target as HTMLInputElement).value);
              }
            }}
          />
          <button
            onClick={loadAllData}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Data Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Clients */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Clients ({clients.length})</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {clients.map((client) => (
              <div key={client.id} className="border border-gray-200 rounded p-3">
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-gray-600">{client.email}</div>
                <div className="text-xs text-gray-500">Trust Score: {client.trustScore}</div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => updateClient(client.id)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => viewAuditTrail(client.id)}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Services ({services.length})</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {services.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded p-3">
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-gray-600">{service.category}</div>
                <div className="text-xs text-gray-500">
                  ${service.price} • {service.duration}min
                </div>
                <button
                  onClick={() => viewAuditTrail(service.id)}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mt-2"
                >
                  Audit
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Transactions ({transactions.length})</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border border-gray-200 rounded p-3">
                <div className="font-medium">{transaction.description}</div>
                <div className="text-sm text-gray-600">
                  ${transaction.totalAmount} • {transaction.paymentStatus}
                </div>
                <div className="text-xs text-gray-500">
                  {transaction.paymentMethod} • {transaction.invoiceNumber}
                </div>
                <button
                  onClick={() => viewAuditTrail(transaction.id)}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mt-2"
                >
                  Audit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Demonstration */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Features Demonstrated</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ Centralized data storage in single collection</li>
          <li>✅ Automatic encryption of sensitive data</li>
          <li>✅ Role-based access control</li>
          <li>✅ Audit trail tracking for all operations</li>
          <li>✅ Search functionality across data types</li>
          <li>✅ CRUD operations with proper permissions</li>
          <li>✅ Data summary and analytics</li>
          <li>✅ Metadata tracking (created/updated by, timestamps)</li>
        </ul>
      </div>
    </div>
  );
};

export default UnifiedDataServiceExample;