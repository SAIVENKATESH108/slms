import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Scissors, 
  User, 
  CheckCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  Info,
  AlertCircle,
  MessageSquare,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { firestoreService, Service } from '../services/firestoreService';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { format, addDays, isSameDay, parseISO, isAfter } from 'date-fns';

// Client login component
const ClientLogin: React.FC<{onLogin: (clientData: any) => void}> = ({ onLogin }) => {
  const [apartment, setApartment] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
              onLogin(clientData);
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
          onLogin(clientData);
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

// Appointment booking component
const AppointmentBooking: React.FC<{clientData: any, onLogout: () => void}> = ({ clientData, onLogout }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Generate dates for the next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  
  // Generate time slots from 9 AM to 7 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 19; hour++) {
      const hourFormatted = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      slots.push(`${hourFormatted}:00 ${ampm}`);
      slots.push(`${hourFormatted}:30 ${ampm}`);
    }
    return slots;
  };
  
  const allTimeSlots = generateTimeSlots();
  
  // Fetch services and existing appointments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch services
        let servicesList: Service[] = [];
        
        // First try to get services from shared collection
        const sharedServicesCol = collection(firestore, 'services');
        const sharedServicesSnapshot = await getDocs(sharedServicesCol);
        servicesList = sharedServicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Service));
        
        // If client has a userId, also get services from that user's collection
        if (clientData.userId) {
          const userServicesCol = collection(firestore, `users/${clientData.userId}/services`);
          const userServicesSnapshot = await getDocs(userServicesCol);
          const userServices = userServicesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Service));
          
          // Merge services, avoiding duplicates
          const serviceIds = new Set(servicesList.map(s => s.id));
          for (const service of userServices) {
            if (!serviceIds.has(service.id)) {
              servicesList.push(service);
              serviceIds.add(service.id);
            }
          }
        }
        
        // Filter out inactive services
        servicesList = servicesList.filter(service => service.isActive !== false);
        
        setServices(servicesList);
        
        // Fetch client's existing appointments
        await fetchAppointments();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clientData]);
  
  // Fetch client's appointments
  const fetchAppointments = async () => {
    try {
      const appointmentsArray = [];
      
      // Check shared appointments collection
      const sharedAppointmentsCol = collection(firestore, 'appointments');
      const sharedQuery = query(sharedAppointmentsCol, where('clientId', '==', clientData.id));
      const sharedSnapshot = await getDocs(sharedQuery);
      
      for (const doc of sharedSnapshot.docs) {
        appointmentsArray.push({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        });
      }
      
      // If client has a userId, also check that user's appointments collection
      if (clientData.userId) {
        const userAppointmentsCol = collection(firestore, `users/${clientData.userId}/appointments`);
        const userQuery = query(userAppointmentsCol, where('clientId', '==', clientData.id));
        const userSnapshot = await getDocs(userQuery);
        
        for (const doc of userSnapshot.docs) {
          appointmentsArray.push({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate()
          });
        }
      }
      
      // Sort appointments by date (newest first)
      appointmentsArray.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setAppointments(appointmentsArray);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  
  // Update available times when date or service changes
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setAvailableTimes([]);
      return;
    }
    
    // Filter out times that are already booked
    const bookedTimes = appointments
      .filter(apt => isSameDay(apt.date, selectedDate))
      .map(apt => ({
        start: apt.startTime,
        end: apt.endTime
      }));
    
    // Filter out past times for today
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);
    
    const available = allTimeSlots.filter(timeSlot => {
      // Parse the time slot
      const [time, period] = timeSlot.split(' ');
      const [hour, minute] = time.split(':').map(Number);
      let hour24 = hour;
      if (period === 'PM' && hour !== 12) hour24 += 12;
      if (period === 'AM' && hour === 12) hour24 = 0;
      
      // Check if time is in the past for today
      if (isToday) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour24, minute);
        if (slotTime <= now) return false;
      }
      
      // Check if time slot conflicts with any booked appointment
      for (const bookedTime of bookedTimes) {
        const bookedStart = bookedTime.start;
        const bookedEnd = bookedTime.end;
        
        // Simple check: if the time slot is the same as the start time of a booking
        if (timeSlot === bookedStart) return false;
      }
      
      return true;
    });
    
    setAvailableTimes(available);
    
    // Clear selected time if it's no longer available
    if (selectedTime && !available.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [selectedDate, selectedService, appointments]);
  
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };
  
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setError('Please complete all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Parse the time slot to get end time
      const [startTime, period] = selectedTime.split(' ');
      const [startHour, startMinute] = startTime.split(':').map(Number);
      let startHour24 = startHour;
      if (period === 'PM' && startHour !== 12) startHour24 += 12;
      if (period === 'AM' && startHour === 12) startHour24 = 0;
      
      // Calculate end time based on service duration
      const serviceDuration = selectedService.duration || 30; // Default to 30 minutes
      const endDate = new Date(selectedDate);
      endDate.setHours(startHour24, startMinute + serviceDuration);
      
      const endHour = endDate.getHours();
      const endMinute = endDate.getMinutes();
      
      // Format end time
      const endHour12 = endHour % 12 === 0 ? 12 : endHour % 12;
      const endPeriod = endHour < 12 ? 'AM' : 'PM';
      const endTime = `${endHour12}:${endMinute.toString().padStart(2, '0')} ${endPeriod}`;
      
      // Create appointment object
      const appointmentData = {
        clientId: clientData.id,
        serviceId: selectedService.id,
        date: Timestamp.fromDate(selectedDate),
        startTime: selectedTime,
        endTime: endTime,
        status: 'scheduled',
        notes: notes,
        reminderSent: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Determine where to save the appointment
      if (clientData.userId) {
        // Save to the user's appointments collection
        const appointmentsCol = collection(firestore, `users/${clientData.userId}/appointments`);
        await addDoc(appointmentsCol, appointmentData);
      } else if (user) {
        // If client doesn't have a userId but we have a logged-in user, use that
        const appointmentsCol = collection(firestore, `users/${user.uid}/appointments`);
        await addDoc(appointmentsCol, appointmentData);
      } else {
        // Fallback to shared appointments collection
        const appointmentsCol = collection(firestore, 'appointments');
        await addDoc(appointmentsCol, appointmentData);
      }
      
      setSuccess(true);
      
      // Refresh appointments list
      await fetchAppointments();
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetBooking = () => {
    setSelectedService(null);
    setSelectedDate(new Date());
    setSelectedTime('');
    setNotes('');
    setStep(1);
    setSuccess(false);
    setError('');
  };
  
  // Format appointment status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'scheduled': return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
      case 'confirmed': return { label: 'Confirmed', color: 'bg-green-100 text-green-800' };
      case 'in-progress': return { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' };
      case 'completed': return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
      case 'cancelled': return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
      case 'no-show': return { label: 'No Show', color: 'bg-orange-100 text-orange-800' };
      default: return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Get service name by ID
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg mr-3">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BeautiFlow</h1>
                <p className="text-sm text-gray-600">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{clientData.name}</p>
                <p className="text-xs text-gray-500">{clientData.apartment.charAt(0).toUpperCase() + clientData.apartment.slice(1)} - Flat {clientData.flatNumber}</p>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Client Info & Appointments */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Client Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{clientData.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{clientData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{clientData.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Your Appointments</h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading appointments...</p>
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map(appointment => (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{getServiceName(appointment.serviceId)}</h3>
                            <p className="text-sm text-gray-500">
                              {format(appointment.date, 'EEEE, MMMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.startTime} - {appointment.endTime}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${formatStatus(appointment.status).color}`}>
                            {formatStatus(appointment.status).label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No appointments yet</p>
                    <p className="text-sm text-gray-400 mt-1">Book your first appointment now</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Book an Appointment</h2>
              </div>
              
              {success ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Appointment Booked!</h3>
                  <p className="text-gray-600 mb-6">
                    Your appointment has been successfully scheduled. We look forward to seeing you!
                  </p>
                  <button
                    onClick={resetBooking}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Book Another Appointment
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  {/* Progress Steps */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          <Scissors className="h-5 w-5" />
                        </div>
                        <span className="text-xs mt-2">Service</span>
                      </div>
                      <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          <Calendar className="h-5 w-5" />
                        </div>
                        <span className="text-xs mt-2">Date & Time</span>
                      </div>
                      <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <span className="text-xs mt-2">Confirm</span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  ) : (
                    <>
                      {/* Step 1: Select Service */}
                      {step === 1 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Service</h3>
                          
                          {services.length === 0 ? (
                            <div className="text-center py-8">
                              <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500">No services available</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {services.map(service => (
                                <div
                                  key={service.id}
                                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-colors"
                                  onClick={() => handleServiceSelect(service)}
                                >
                                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                                  <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center text-gray-500 text-sm">
                                      <Clock className="h-4 w-4 mr-1" />
                                      <span>{service.duration || 30} min</span>
                                    </div>
                                    <div className="font-medium text-purple-600">₹{service.price}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 2: Select Date and Time */}
                      {step === 2 && (
                        <div>
                          <div className="flex items-center mb-4">
                            <button
                              onClick={() => setStep(1)}
                              className="text-purple-600 hover:text-purple-800 mr-2"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h3 className="text-lg font-medium text-gray-900">Select Date & Time</h3>
                          </div>
                          
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Service</h4>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium text-purple-900">{selectedService?.name}</p>
                                <p className="text-xs text-purple-700">{selectedService?.duration || 30} minutes</p>
                              </div>
                              <p className="font-medium text-purple-900">₹{selectedService?.price}</p>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Select Date</h4>
                            <div className="flex overflow-x-auto pb-2 space-x-2">
                              {dates.map(date => (
                                <div
                                  key={date.toISOString()}
                                  className={`flex-shrink-0 w-20 h-24 flex flex-col items-center justify-center rounded-lg cursor-pointer border-2 ${
                                    isSameDay(date, selectedDate)
                                      ? 'border-purple-600 bg-purple-50'
                                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                  } transition-colors`}
                                  onClick={() => handleDateSelect(date)}
                                >
                                  <p className="text-xs font-medium text-gray-500">{format(date, 'EEE')}</p>
                                  <p className="text-lg font-bold text-gray-900">{format(date, 'd')}</p>
                                  <p className="text-xs text-gray-500">{format(date, 'MMM')}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Select Time</h4>
                            {availableTimes.length > 0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {availableTimes.map(time => (
                                  <div
                                    key={time}
                                    className={`py-2 px-3 text-center rounded-lg cursor-pointer border ${
                                      selectedTime === time
                                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                    } transition-colors`}
                                    onClick={() => handleTimeSelect(time)}
                                  >
                                    <span className="text-sm">{time}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 bg-gray-50 rounded-lg">
                                <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">No available times for this date</p>
                                <p className="text-sm text-gray-400 mt-1">Please select another date</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 3: Confirm Booking */}
                      {step === 3 && (
                        <div>
                          <div className="flex items-center mb-4">
                            <button
                              onClick={() => setStep(2)}
                              className="text-purple-600 hover:text-purple-800 mr-2"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <h3 className="text-lg font-medium text-gray-900">Confirm Booking</h3>
                          </div>
                          
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                            <h4 className="font-medium text-purple-900 mb-4">Appointment Summary</h4>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-purple-700">Service:</span>
                                <span className="font-medium text-purple-900">{selectedService?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700">Date:</span>
                                <span className="font-medium text-purple-900">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700">Time:</span>
                                <span className="font-medium text-purple-900">{selectedTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700">Duration:</span>
                                <span className="font-medium text-purple-900">{selectedService?.duration || 30} minutes</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-purple-700">Price:</span>
                                <span className="font-medium text-purple-900">₹{selectedService?.price}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                              Additional Notes (Optional)
                            </label>
                            <textarea
                              id="notes"
                              rows={3}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Any special requests or information we should know"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                            />
                          </div>
                          
                          <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                            <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                            <p className="text-sm text-blue-700">
                              By confirming this appointment, you agree to our cancellation policy. Please arrive 10 minutes before your scheduled time.
                            </p>
                          </div>
                          
                          <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70"
                          >
                            {loading ? 'Processing...' : 'Confirm Appointment'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
const ClientAppointment: React.FC = () => {
  const [clientData, setClientData] = useState<any>(null);
  
  const handleLogin = (data: any) => {
    setClientData(data);
  };
  
  const handleLogout = () => {
    setClientData(null);
  };
  
  return (
    <div>
      {clientData ? (
        <AppointmentBooking clientData={clientData} onLogout={handleLogout} />
      ) : (
        <ClientLogin onLogin={handleLogin} />
      )}
    </div>
  );
};

export default ClientAppointment;