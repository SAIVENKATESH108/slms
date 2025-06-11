import { useEffect } from 'react';
import { useClientStore } from '../stores/clientStore';

export const useClients = () => {
  const {
    clients,
    loading,
    error,
    fetchClients,
    addClient: storeAddClient,
    updateClient: storeUpdateClient,
    deleteClient: storeDeleteClient,
  } = useClientStore();

  // Auto-fetch clients on hook initialization
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (clientData: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    notes?: string;
    status: 'active' | 'inactive';
  }) => {
    // Transform the data to match the store's expected format
    const transformedData = {
      name: clientData.name,
      phone: clientData.phone,
      flatNumber: clientData.address || '', // Map address to flatNumber for compatibility
      trustScore: 100, // Default trust score
      notes: clientData.notes || '',
      tags: [], // Default empty tags
      email: clientData.email,
      status: clientData.status,
    };

    return await storeAddClient(transformedData);
  };

  const updateClient = async (id: string, clientData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    status?: 'active' | 'inactive';
  }) => {
    // Transform the data to match the store's expected format
    const transformedData: any = {};
    
    if (clientData.name !== undefined) transformedData.name = clientData.name;
    if (clientData.phone !== undefined) transformedData.phone = clientData.phone;
    if (clientData.address !== undefined) transformedData.flatNumber = clientData.address;
    if (clientData.notes !== undefined) transformedData.notes = clientData.notes;
    if (clientData.email !== undefined) transformedData.email = clientData.email;
    if (clientData.status !== undefined) transformedData.status = clientData.status;

    return await storeUpdateClient(id, transformedData);
  };

  const deleteClient = async (id: string) => {
    return await storeDeleteClient(id);
  };

  const refreshClients = async () => {
    return await fetchClients();
  };

  // Transform clients to match the expected format for the component
  const transformedClients = clients.map(client => ({
    ...client,
    address: client.flatNumber || '', // Map flatNumber back to address
    email: client.email || '', // Ensure email exists
    status: client.status || 'active', // Ensure status exists
  }));

  return {
    clients: transformedClients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    refreshClients,
  };
};