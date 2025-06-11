import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Info,
  DollarSign,
  Calendar as CalendarIcon,
  MessageSquare,
  Save,
  AlertCircle,
  Star,
  Shield,
  Bell,
  Phone,
  Mail
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, isSameDay, isAfter, isBefore, addMinutes, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { useClientStore } from '../stores/clientStore';
import { firestoreService, Service } from '../services/firestoreService';
import { useAuthStore } from '../stores/authStore';
import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../firebase/config';

interface TimeSlot {
  time: string;
  available: boolean;
  selected?: boolean;
}

interface AppointmentFormData {
  clientId: string;
  serviceId: string;
  date: Date;
  startTime: string;
  notes: string;
  sendReminder: boolean;
  reminderType: 'sms' | 'email' | 'both';
}

interface StaffMember {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  available: boolean;
}

const ClientAppointment: React.FC = () => {
  const { clients, loading: clientsLoading } = useClientStore();
  const { user } = useAuthStore();
  
  // State for services
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // State for staff
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  
  // State for appointment booking
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState<AppointmentFormData>({
    clientId: '',
    serviceId: '',
    date: new Date(),
    startTime: '',
    notes: '',
    sendReminder: true,
    reminderType: 'sms'
  });
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      if (!user?.uid) return;
      
      try {
        setLoadingServices(true);
        const loadedServices = await firestoreService.loadServicesSettings(user.uid);
        const activeServices = loadedServices.filter(service => service.isActive !== false);
        setServices(activeServices);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(activeServices.map(service => service.category)));
        setCategories(['all', ...uniqueCategories]);
        
        // Set filtered services
        setFilteredServices(activeServices);
      } catch (error) {
        console.error('Error loading services:', error);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoadingServices(false);
      }
    };
    
    fetchServices();
  }, [user?.uid]);
  
  // Fetch staff members
  useEffect(() => {
    const fetchStaff = async () => {
      if (!user?.uid) return;
      
      try {
        // Mock staff data - in a real app, you would fetch this from Firestore
        const mockStaff: StaffMember[] = [
          {
            id: 'staff1',
            name: 'Sarah Johnson',
            specialties: ['Hair Care', 'Skin Care'],
            rating: 4.9,
            available: true
          },
          {
            id: 'staff2',
            name: 'Michael Chen',
            specialties: ['Massage', 'Skin Care'],
            rating: 4.7,
            available: true
          },
          {
            id: 'staff3',
            name: 'Priya Patel',
            specialties: ['Nail Care', 'Hair Care'],
            rating: 4.8,
            available: true
          },
          {
            id: 'staff4',
            name: 'David Wilson',
            specialties: ['Massage', 'Skin Care'],
            rating: 4.6,
            available: false
          }
        ];
        
        setStaff(mockStaff);
      } catch (error) {
        console.error('Error loading staff:', error);
      }
    };
    
    fetchStaff();
  }, [user?.uid]);
  
  // Filter services when category changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredServices(services);
    } else {
      setFilteredServices(services.filter(service => service.category === selectedCategory));
    }
  }, [selectedCategory, services]);
  
  // Generate time slots for selected date
  useEffect(() => {
    if (!selectedDate) return;
    
    // Business hours
    const startHour = 9; // 9 AM
    const endHour = 19; // 7 PM
    const slotDuration = 30; // 30 minutes per slot
    
    const slots: TimeSlot[] = [];
    
    // Generate slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if this slot conflicts with existing appointments
        const isAvailable = !existingAppointments.some(appointment => {
          const appointmentDate = appointment.date.toDate();
          const appointmentStartTime = appointment.startTime;
          
          // Check if appointment is on the same day
          if (!isSameDay(appointmentDate, selectedDate)) return false;
          
          // Parse appointment time
          const [startHour, startMinute] = appointmentStartTime.split(':').map(Number);
          const appointmentStart = new Date(appointmentDate);
          appointmentStart.setHours(startHour, startMinute, 0, 0);
          
          // Calculate appointment end time based on service duration
          const serviceDuration = services.find(s => s.id === appointment.serviceId)?.duration || 60;
          const appointmentEnd = addMinutes(appointmentStart, serviceDuration);
          
          // Parse current slot time
          const [slotHour, slotMinute] = time.split(':').map(Number);
          const slotTime = new Date(selectedDate);
          slotTime.setHours(slotHour, slotMinute, 0, 0);
          
          // Check if slot time is within appointment time range
          return (
            (isAfter(slotTime, appointmentStart) && isBefore(slotTime, appointmentEnd)) ||
            isSameDay(slotTime, appointmentStart)
          );
        });
        
        slots.push({ time, available: isAvailable });
      }
    }
    
    setTimeSlots(slots);
  }, [selectedDate, existingAppointments, services]);
  
  // Fetch existing appointments for the selected date
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedDate || !user?.uid) return;
      
      try {
        // Get appointments for the selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const appointments = await firestoreService.getAppointments(
          user.uid,
          startOfDay,
          endOfDay
        );
        
        setExistingAppointments(appointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };
    
    fetchAppointments();
  }, [selectedDate, user?.uid]);
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setFormData(prev => ({ ...prev, date }));
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
    setFormData(prev => ({ ...prev, startTime: time }));
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError('You must be logged in to book an appointment');
      return;
    }
    
    if (!formData.clientId || !formData.serviceId || !selectedDate || !selectedTimeSlot) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate end time based on service duration
      const selectedService = services.find(s => s.id === formData.serviceId);
      const serviceDuration = selectedService?.duration || 60; // Default to 60 minutes
      
      const [startHour, startMinute] = selectedTimeSlot.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(startHour, startMinute, 0, 0);
      
      const endDate = addMinutes(startDate, serviceDuration);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Create appointment object
      const appointmentData = {
        clientId: formData.clientId,
        serviceId: formData.serviceId,
        staffId: selectedStaff,
        date: Timestamp.fromDate(selectedDate),
        startTime: selectedTimeSlot,
        endTime,
        status: 'scheduled',
        notes: formData.notes,
        reminderSent: false,
        sendReminder: formData.sendReminder,
        reminderType: formData.reminderType,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Add to user's appointments collection
      const appointmentsRef = collection(firestore, `users/${user.uid}/appointments`);
      await addDoc(appointmentsRef, appointmentData);
      
      // If user is admin, also add to shared appointments collection
      const isAdmin = await firestoreService.isUserAdmin(user.uid);
      if (isAdmin) {
        const sharedAppointmentsRef = collection(firestore, 'appointments');
        await addDoc(sharedAppointmentsRef, {
          ...appointmentData,
          createdBy: user.uid
        });
      }
      
      // Show success message
      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          clientId: '',
          serviceId: '',
          date: new Date(),
          startTime: '',
          notes: '',
          sendReminder: true,
          reminderType: 'sms'
        });
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        setSelectedStaff(null);
        setCurrentStep(1);
      }, 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start from Sunday
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startDate, i));
    }
    
    return days;
  };
  
  // Navigate to previous/next week
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addWeeks(prev, direction === 'prev' ? -1 : 1));
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get selected service details
  const getSelectedService = () => {
    return services.find(s => s.id === formData.serviceId);
  };
  
  // Get selected client details
  const getSelectedClient = () => {
    return clients.find(c => c.id === formData.clientId);
  };
  
  // Get selected staff details
  const getSelectedStaffMember = () => {
    return staff.find(s => s.id === selectedStaff);
  };
  
  // Check if form is valid for current step
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!formData.clientId && !!formData.serviceId;
      case 2:
        return !!selectedDate && !!selectedTimeSlot;
      case 3:
        return true; // Notes and staff selection are optional
      default:
        return false;
    }
  };
  
  // Move to next step
  const nextStep = () => {
    if (isStepValid()) {
      setCurrentStep(prev => prev + 1);
    } else {
      setError('Please complete all required fields before proceeding');
    }
  };
  
  // Move to previous step
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Get date label (Today, Tomorrow, etc.)
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE');
  };
  
  // Loading state
  if (clientsLoading || loadingServices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Book Your Appointment
          </h1>
          <p className="text-gray-600 mt-2">
            Schedule your beauty services in just a few simple steps
          </p>
        </div>
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step} 
                className={`flex-1 relative ${step < 4 ? 'after:content-[""] after:h-1 after:w-full after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1/2 after:bg-gray-200 after:z-0' : ''}`}
              >
                <div className="flex items-center justify-center relative z-10">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step < currentStep 
                        ? 'bg-green-500 text-white' 
                        : step === currentStep 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span>{step}</span>
                    )}
                  </div>
                </div>
                <div className="text-center mt-2 text-sm font-medium">
                  {step === 1 && 'Select Service'}
                  {step === 2 && 'Choose Date & Time'}
                  {step === 3 && 'Additional Details'}
                  {step === 4 && 'Confirmation'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Appointment Booked Successfully!</p>
              <p className="text-sm mt-1">Your appointment has been scheduled. You'll receive a confirmation shortly.</p>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Service and Client */}
            {currentStep === 1 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Select Client & Service
                </h2>
                
                <div className="space-y-6">
                  {/* Client Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Client *
                    </label>
                    <select
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} - Flat {client.flatNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Service Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            selectedCategory === category
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category === 'all' ? 'All Categories' : category}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Service Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Service *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredServices.map(service => (
                        <div
                          key={service.id}
                          onClick={() => setFormData(prev => ({ ...prev, serviceId: service.id }))}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            formData.serviceId === service.id
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{service.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-purple-600">{formatCurrency(service.price)}</span>
                              <span className="text-xs text-gray-500 mt-1">{service.duration || 60} min</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                              {service.category}
                            </span>
                            {service.isShared && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                Shared
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {filteredServices.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No services found in this category</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Service Details */}
                  {formData.serviceId && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <h3 className="font-medium text-purple-800 mb-2">Selected Service Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Service</p>
                          <p className="font-medium">{getSelectedService()?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Price</p>
                          <p className="font-medium">{formatCurrency(getSelectedService()?.price || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-medium">{getSelectedService()?.duration || 60} minutes</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Category</p>
                          <p className="font-medium">{getSelectedService()?.category}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 2: Select Date and Time */}
            {currentStep === 2 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                  Select Date & Time
                </h2>
                
                <div className="space-y-6">
                  {/* Calendar Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => navigateWeek('prev')}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h3 className="text-lg font-medium text-gray-900">
                      {format(currentDate, 'MMMM yyyy')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateWeek('next')}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {generateCalendarDays().map((day, index) => {
                      const isCurrentDay = isToday(day);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isPast = isBefore(day, new Date()) && !isCurrentDay;
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => !isPast && handleDateSelect(day)}
                          disabled={isPast}
                          className={`p-2 rounded-lg flex flex-col items-center justify-center h-20 transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md transform scale-105'
                              : isCurrentDay
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : isPast
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          <span className="text-xs font-medium">
                            {getDateLabel(day)}
                          </span>
                          <span className={`text-lg ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                            {format(day, 'd')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Time Slots */}
                  {selectedDate ? (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-purple-600" />
                        Available Time Slots
                      </h3>
                      
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {timeSlots.map((slot, index) => (
                          <button
                            key={index}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => slot.available && handleTimeSlotSelect(slot.time)}
                            className={`p-3 rounded-lg text-center transition-all ${
                              selectedTimeSlot === slot.time
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md transform scale-105'
                                : slot.available
                                ? 'bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                      
                      {timeSlots.length === 0 && (
                        <div className="text-center py-8">
                          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Loading available time slots...</p>
                        </div>
                      )}
                      
                      {timeSlots.length > 0 && timeSlots.every(slot => !slot.available) && (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No available time slots for this date</p>
                          <p className="text-sm text-gray-400 mt-1">Please select another date</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">Please select a date to view available time slots</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 3: Additional Details */}
            {currentStep === 3 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                  Additional Details
                </h2>
                
                <div className="space-y-6">
                  {/* Staff Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Preferred Staff (Optional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {staff.filter(s => s.available).map(staffMember => (
                        <div
                          key={staffMember.id}
                          onClick={() => setSelectedStaff(staffMember.id)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedStaff === staffMember.id
                              ? 'border-purple-500 bg-purple-50 shadow-md'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{staffMember.name}</h3>
                              <div className="flex items-center mt-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-gray-600 ml-1">{staffMember.rating}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex flex-wrap gap-1 mt-1">
                                {staffMember.specialties.map((specialty, index) => (
                                  <span key={index} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                    {specialty}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {staff.filter(s => s.available).length === 0 && (
                      <div className="text-center py-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No staff members available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions or Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Any special requests or information we should know about..."
                    />
                  </div>
                  
                  {/* Reminder Preferences */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                      <Bell className="w-4 h-4 mr-2" />
                      Appointment Reminders
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sendReminder"
                          name="sendReminder"
                          checked={formData.sendReminder}
                          onChange={handleCheckboxChange}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="sendReminder" className="ml-2 text-sm text-gray-700">
                          Send me a reminder before my appointment
                        </label>
                      </div>
                      
                      {formData.sendReminder && (
                        <div className="ml-6 mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reminder Method
                          </label>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="reminderSms"
                                name="reminderType"
                                value="sms"
                                checked={formData.reminderType === 'sms'}
                                onChange={handleChange}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                              />
                              <label htmlFor="reminderSms" className="ml-2 text-sm text-gray-700 flex items-center">
                                <Phone className="w-4 h-4 mr-1 text-gray-500" />
                                SMS Reminder
                              </label>
                            </div>
                            
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="reminderEmail"
                                name="reminderType"
                                value="email"
                                checked={formData.reminderType === 'email'}
                                onChange={handleChange}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                              />
                              <label htmlFor="reminderEmail" className="ml-2 text-sm text-gray-700 flex items-center">
                                <Mail className="w-4 h-4 mr-1 text-gray-500" />
                                Email Reminder
                              </label>
                            </div>
                            
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id="reminderBoth"
                                name="reminderType"
                                value="both"
                                checked={formData.reminderType === 'both'}
                                onChange={handleChange}
                                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                              />
                              <label htmlFor="reminderBoth" className="ml-2 text-sm text-gray-700 flex items-center">
                                <Bell className="w-4 h-4 mr-1 text-gray-500" />
                                Both SMS & Email
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Appointment Summary */}
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                    <h3 className="font-medium text-purple-800 mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Appointment Summary
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="text-gray-700">Client</span>
                        </div>
                        <span className="font-medium">{getSelectedClient()?.name}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                        <div className="flex items-center">
                          <Scissors className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="text-gray-700">Service</span>
                        </div>
                        <span className="font-medium">{getSelectedService()?.name}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="text-gray-700">Price</span>
                        </div>
                        <span className="font-medium">{formatCurrency(getSelectedService()?.price || 0)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pb-3 border-b border-purple-200">
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="text-gray-700">Date</span>
                        </div>
                        <span className="font-medium">{selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Not selected'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-purple-600 mr-2" />
                          <span className="text-gray-700">Time</span>
                        </div>
                        <span className="font-medium">{selectedTimeSlot || 'Not selected'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />
                  Confirm Your Appointment
                </h2>
                
                <div className="space-y-6">
                  {/* Appointment Details */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                    <h3 className="font-semibold text-purple-800 mb-4 text-lg">Appointment Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Client</p>
                          <p className="font-medium text-gray-900 flex items-center">
                            <User className="w-4 h-4 mr-2 text-purple-600" />
                            {getSelectedClient()?.name}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Service</p>
                          <p className="font-medium text-gray-900 flex items-center">
                            <Scissors className="w-4 h-4 mr-2 text-purple-600" />
                            {getSelectedService()?.name}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium text-gray-900 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-purple-600" />
                            {getSelectedService()?.duration || 60} minutes
                          </p>
                        </div>
                        
                        {selectedStaff && (
                          <div>
                            <p className="text-sm text-gray-500">Staff</p>
                            <p className="font-medium text-gray-900 flex items-center">
                              <User className="w-4 h-4 mr-2 text-purple-600" />
                              {getSelectedStaffMember()?.name}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium text-gray-900 flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-2 text-purple-600" />
                            {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Not selected'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="font-medium text-gray-900 flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-purple-600" />
                            {selectedTimeSlot || 'Not selected'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-medium text-gray-900 flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-purple-600" />
                            {formatCurrency(getSelectedService()?.price || 0)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Reminders</p>
                          <p className="font-medium text-gray-900 flex items-center">
                            <Bell className="w-4 h-4 mr-2 text-purple-600" />
                            {formData.sendReminder ? (
                              formData.reminderType === 'sms' ? 'SMS Reminder' :
                              formData.reminderType === 'email' ? 'Email Reminder' :
                              'SMS & Email Reminders'
                            ) : 'No Reminders'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {formData.notes && (
                      <div className="mt-6 pt-4 border-t border-purple-200">
                        <p className="text-sm text-gray-500">Special Instructions</p>
                        <p className="text-gray-700 mt-1">{formData.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Cancellation Policy */}
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Cancellation Policy
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Please note that cancellations must be made at least 24 hours before your scheduled appointment. 
                      Late cancellations may incur a fee of 50% of the service price.
                    </p>
                  </div>
                  
                  {/* Terms and Conditions */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          type="checkbox"
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          required
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="font-medium text-gray-700">
                          I agree to the terms and conditions
                        </label>
                        <p className="text-gray-500">
                          By booking this appointment, I agree to the cancellation policy and understand that I may be charged for late cancellations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className={`ml-auto px-4 py-2 rounded-lg flex items-center transition-all ${
                    isStepValid()
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md hover:shadow-lg transition-all"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Book Appointment
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Additional Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Easy Booking</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Book your appointment in minutes with our simple and intuitive booking system.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Reminders</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Receive timely reminders via SMS or email so you never miss your appointment.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Secure Booking</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Your personal information is always protected with our secure booking system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAppointment;