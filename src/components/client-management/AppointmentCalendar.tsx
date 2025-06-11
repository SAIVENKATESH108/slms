import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Search,
  Clock,
  User,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Bell,
  Scissors
} from 'lucide-react';
import { Appointment, CalendarEvent } from '../../types/ClientManagement';
import { useClientStore } from '../../stores/clientStore';
import { format, addDays, startOfWeek, addWeeks, isSameDay, parseISO, isToday, isTomorrow, isThisWeek, isThisMonth } from 'date-fns';
import { firestoreService, Service } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { collection, getDocs, query, where, Timestamp, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/config';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

const AppointmentCalendar: React.FC = () => {
  const { clients } = useClientStore();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: 'all',
    service: 'all',
    staff: 'all',
    timeRange: 'all'
  });

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        
        // Get start and end dates for query
        let startDate = new Date();
        let endDate = new Date();
        
        if (viewType === 'month') {
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        } else if (viewType === 'week') {
          startDate = startOfWeek(currentDate);
          endDate = addDays(startDate, 6);
        } else if (viewType === 'day') {
          startDate = currentDate;
          endDate = currentDate;
        } else {
          // For agenda view, get appointments for the next 30 days
          startDate = new Date();
          endDate = addDays(startDate, 30);
        }
        
        // Get appointments from Firestore
        const appointmentsRef = collection(firestore, `users/${user.uid}/appointments`);
        const q = query(
          appointmentsRef,
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'asc')
        );
        
        const snapshot = await getDocs(q);
        
        const fetchedAppointments = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            clientId: data.clientId,
            serviceId: data.serviceId,
            staffId: data.staffId,
            date: data.date.toDate(),
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status,
            notes: data.notes,
            reminderSent: data.reminderSent,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          };
        });
        
        setAppointments(fetchedAppointments);
        
        // Fetch services
        const loadedServices = await firestoreService.loadServicesSettings(user.uid);
        setServices(loadedServices);
        
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user?.uid, currentDate, viewType]);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };
  
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'no-show': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const clientName = getClientName(appointment.clientId);
      const serviceName = getServiceName(appointment.serviceId);
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        clientName.toLowerCase().includes(searchLower) ||
        serviceName.toLowerCase().includes(searchLower) ||
        appointment.notes?.toLowerCase().includes(searchLower);

      const matchesStatus = filters.status === 'all' || appointment.status === filters.status;
      const matchesService = filters.service === 'all' || appointment.serviceId === filters.service;
      const matchesStaff = filters.staff === 'all' || appointment.staffId === filters.staff;
      
      let matchesTimeRange = true;
      if (filters.timeRange === 'today') {
        matchesTimeRange = isToday(appointment.date);
      } else if (filters.timeRange === 'tomorrow') {
        matchesTimeRange = isTomorrow(appointment.date);
      } else if (filters.timeRange === 'week') {
        matchesTimeRange = isThisWeek(appointment.date);
      } else if (filters.timeRange === 'month') {
        matchesTimeRange = isThisMonth(appointment.date);
      }

      return matchesSearch && matchesStatus && matchesService && matchesStaff && matchesTimeRange;
    });
  }, [appointments, searchQuery, filters, clients, services]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(appointment => {
      return isSameDay(appointment.date, date);
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };
  
  // Delete appointment
  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user?.uid) return;
    
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const appointmentRef = doc(firestore, `users/${user.uid}/appointments`, appointmentId);
        await deleteDoc(appointmentRef);
        
        // Update local state
        setAppointments(prev => prev.filter(a => a.id !== appointmentId));
        
        // Close modal if open
        if (selectedAppointment?.id === appointmentId) {
          setSelectedAppointment(null);
        }
      } catch (error) {
        console.error('Error deleting appointment:', error);
        setError('Failed to delete appointment');
      }
    }
  };
  
  // Update appointment status
  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    if (!user?.uid) return;
    
    try {
      const appointmentRef = doc(firestore, `users/${user.uid}/appointments`, appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setAppointments(prev => prev.map(a => 
        a.id === appointmentId 
          ? { ...a, status: newStatus as any, updatedAt: new Date() } 
          : a
      ));
      
      // Update selected appointment if open
      if (selectedAppointment?.id === appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    }
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weekDays.map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day, index) => (
            <div
              key={index}
              className={`bg-white p-2 h-32 overflow-y-auto ${
                day ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={() => day && setSelectedDate(day)}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    day.toDateString() === new Date().toDateString() 
                      ? 'text-blue-600' 
                      : 'text-gray-900'
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {getAppointmentsForDate(day).slice(0, 3).map(appointment => (
                      <div
                        key={appointment.id}
                        className={`text-xs p-1 rounded border ${getStatusColor(appointment.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appointment);
                        }}
                      >
                        <div className="font-medium truncate">
                          {getClientName(appointment.clientId)}
                        </div>
                        <div className="truncate">
                          {appointment.startTime}
                        </div>
                      </div>
                    ))}
                    {getAppointmentsForDate(day).length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{getAppointmentsForDate(day).length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
            Time
          </div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
              <div>{format(day, 'EEE')}</div>
              <div className={`text-lg ${
                day.toDateString() === new Date().toDateString() 
                  ? 'text-blue-600 font-bold' 
                  : 'text-gray-900'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-px bg-gray-200 border-t border-gray-200">
              <div className="bg-white p-2 text-xs text-gray-500 text-center">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map(day => {
                const dayAppointments = getAppointmentsForDate(day).filter(apt => {
                  const startHour = parseInt(apt.startTime.split(':')[0]);
                  return startHour === hour;
                });
                
                return (
                  <div key={`${day.toISOString()}-${hour}`} className="bg-white p-1 min-h-[60px] relative">
                    {dayAppointments.map(appointment => (
                      <div
                        key={appointment.id}
                        className={`text-xs p-1 rounded border mb-1 cursor-pointer ${getStatusColor(appointment.status)}`}
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <div className="font-medium truncate">
                          {getClientName(appointment.clientId)}
                        </div>
                        <div className="truncate">
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
      // Sort by date first
      const dateComparison = a.date.getTime() - b.date.getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If same date, sort by time
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      
      const aMinutes = aTime[0] * 60 + aTime[1];
      const bMinutes = bTime[0] * 60 + bTime[1];
      
      return aMinutes - bMinutes;
    });
    
    // Group appointments by date
    const groupedAppointments: { [key: string]: Appointment[] } = {};
    
    sortedAppointments.forEach(appointment => {
      const dateKey = format(appointment.date, 'yyyy-MM-dd');
      if (!groupedAppointments[dateKey]) {
        groupedAppointments[dateKey] = [];
      }
      groupedAppointments[dateKey].push(appointment);
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {Object.entries(groupedAppointments).map(([dateKey, appointments]) => (
            <div key={dateKey} className="p-4">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                </h3>
              </div>
              
              <div className="space-y-3 ml-12">
                {appointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{getClientName(appointment.clientId)}</p>
                        <p className="text-sm text-gray-500">{getServiceName(appointment.serviceId)}</p>
                        <p className="text-xs text-gray-500">
                          {appointment.startTime} - {appointment.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {Object.keys(groupedAppointments).length === 0 && (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters or add a new appointment</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    switch (viewType) {
      case 'month': return renderMonthView();
      case 'week': return renderWeekView();
      case 'agenda': return renderAgendaView();
      default: return renderWeekView();
    }
  };

  const getNavigationHandler = () => {
    switch (viewType) {
      case 'week': return navigateWeek;
      case 'day': return navigateDay;
      default: return navigateMonth;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
          <p className="text-sm text-gray-500">{filteredAppointments.length} appointments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
              showFilters ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-700'
            } hover:bg-gray-50`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <a
            href="/appointment"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </a>
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search appointments by client name or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-gray-300 rounded-md">
            {(['month', 'week', 'agenda'] as ViewType[]).map(view => (
              <button
                key={view}
                onClick={() => setViewType(view)}
                className={`px-3 py-2 text-sm font-medium capitalize ${
                  viewType === view 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
              <select
                value={filters.service}
                onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Services</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  status: 'all',
                  service: 'all',
                  staff: 'all',
                  timeRange: 'all'
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Navigation */}
      {viewType !== 'agenda' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => getNavigationHandler()('prev')}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {viewType === 'month' && format(currentDate, 'MMMM yyyy')}
              {viewType === 'week' && `Week of ${format(getWeekDays(currentDate)[0], 'MMM d, yyyy')}`}
              {viewType === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            <button
              onClick={() => getNavigationHandler()('next')}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      )}

      {/* Calendar View */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      ) : (
        renderCalendarView()
      )}

      {/* Empty State */}
      {filteredAppointments.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || Object.values(filters).some(f => f !== 'all')
              ? 'Try adjusting your search or filters'
              : 'Get started by booking your first appointment'
            }
          </p>
          {!searchQuery && (
            <div className="mt-6">
              <a
                href="/appointment"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </a>
            </div>
          )}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Client</span>
                  </div>
                  <span className="font-medium">{getClientName(selectedAppointment.clientId)}</span>
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <Scissors className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Service</span>
                  </div>
                  <span className="font-medium">{getServiceName(selectedAppointment.serviceId)}</span>
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Date</span>
                  </div>
                  <span className="font-medium">{format(selectedAppointment.date, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Time</span>
                  </div>
                  <span className="font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime}</span>
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Reminder</span>
                  </div>
                  <span className="font-medium">{selectedAppointment.reminderSent ? 'Sent' : 'Not Sent'}</span>
                </div>
                
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Status</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
                
                {selectedAppointment.notes && (
                  <div className="pb-3 border-b border-gray-200">
                    <div className="flex items-center mb-2">
                      <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-600">Notes</span>
                    </div>
                    <p className="text-gray-700 text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
                
                {/* Status Update Buttons */}
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'confirmed')}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'in-progress')}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm hover:bg-yellow-200"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'cancelled')}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'no-show')}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm hover:bg-orange-200"
                    >
                      No Show
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                    className="px-3 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;