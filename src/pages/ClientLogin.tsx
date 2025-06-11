import React, { useState } from 'react';
import { AlertCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase/config';

const ClientLogin: React.FC = () => {
  const [apartment, setApartment] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!apartment || !flatNumber) {
        throw new Error('Please enter both apartment and flat number');
      }

      // Query Firestore for client with matching apartment and flat number
      const clientsRef = collection(firestore, 'clients');
      const q = query(
        clientsRef, 
        where('apartment', '==', apartment.toLowerCase()),
        where('flatNumber', '==', flatNumber)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Try user-specific collections if no client found in shared collection
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        let clientFound = false;
        
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const userClientsRef = collection(firestore, `users/${userId}/clients`);
          const userQuery = query(
            userClientsRef,
            where('apartment', '==', apartment.toLowerCase()),
            where('flatNumber', '==', flatNumber)
          );
          
          const userClientsSnapshot = await getDocs(userQuery);
          
          if (!userClientsSnapshot.empty) {
            const clientData = {
              id: userClientsSnapshot.docs[0].id,
              ...userClientsSnapshot.docs[0].data(),
              userId // Store which user this client belongs to
            };
            
            // Check password if provided, otherwise use default password (flatNumber)
            const clientPassword = password || flatNumber;
            const expectedPassword = clientData.password || flatNumber; // Use flat number as default password
            
            if (clientPassword === expectedPassword) {
              // Store client data in session storage
              sessionStorage.setItem('clientData', JSON.stringify(clientData));
              navigate('/appointment');
              clientFound = true;
              break;
            } else {
              throw new Error('Invalid password');
            }
          }
        }
        
        if (!clientFound) {
          throw new Error('No client found with these credentials');
        }
      } else {
        const clientData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
        
        // Check password if provided, otherwise use default password (flatNumber)
        const clientPassword = password || flatNumber;
        const expectedPassword = clientData.password || flatNumber; // Use flat number as default password
        
        if (clientPassword === expectedPassword) {
          // Store client data in session storage
          sessionStorage.setItem('clientData', JSON.stringify(clientData));
          navigate('/appointment');
        } else {
          throw new Error('Invalid password');
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Client Login</h2>
          <p className="text-gray-600 mt-2">Access your appointments and services</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-1">
              Apartment
            </label>
            <select
              id="apartment"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              required
            >
              <option value="">Select your apartment</option>
              <option value="tulip">Tulip</option>
              <option value="elysian">Elysian</option>
            </select>
          </div>

          <div>
            <label htmlFor="flatNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Flat Number
            </label>
            <input
              id="flatNumber"
              type="text"
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              placeholder="Enter your flat number"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password (Optional)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Default is your flat number"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to use your flat number as password
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-70 disabled:transform-none disabled:shadow-none"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your building manager
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;