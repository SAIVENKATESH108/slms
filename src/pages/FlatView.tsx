import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClientStore } from '../stores/clientStore';
import ClientCard from '../components/client/ClientCard';
import { Home } from 'lucide-react';

const FlatView = () => {
  const { flatId } = useParams();
  const { fetchClientsByFlat } = useClientStore();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadClients = async () => {
      try {
        const flatClients = await fetchClientsByFlat(flatId || '');
        setClients(flatClients);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    loadClients();
  }, [flatId, fetchClientsByFlat]);
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        Error loading flat data: {error}
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <div className="bg-purple-100 rounded-full p-2 mr-3">
            <Home className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Flat {flatId}</h1>
            <p className="text-gray-600">{clients.length} clients in this flat</p>
          </div>
        </div>
      </div>
      
      {clients.length > 0 ? (
        <div className="space-y-4">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <Home className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No clients in this flat</h3>
          <p className="mt-1 text-gray-500">Add clients to start tracking services and payments</p>
        </div>
      )}
    </div>
  );
};

export default FlatView;