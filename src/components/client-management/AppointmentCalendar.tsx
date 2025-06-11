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
  Bell
} from 'lucide-react';
import { Appointment, CalendarEvent } from '../../types/ClientManagement';
import { useClientStore } from '../../stores/clientStore';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

const AppointmentCalendar: React.FC = () => {
  const { clients } = useClientStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [filters, setFilters] = useState({
    status: 'all',
    service: 'all',
    staff: 'all',
    timeRange: 'all'
  });

  // Mock appointment data - replace with actual API calls
  useEffect(() => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        clientId: 'client1',
        serviceId: 'service1',
        staffId: 'staff1',
        date: new Date('2024-01-20'),
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmed',
        notes: 'Regular customer, prefers specific stylist',
        reminderSent: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        clientId: 'client2',
        serviceId: 'service2',
        date: new Date('2024-01-20'),
        startTime: '14:30',
        endTime: '16:00',
        status: 'scheduled',
        notes: 'First time customer',
        reminderSent: false,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18')
      },
      {
        id: '3',
        clientId: 'client3',
        serviceId: 'service3',
        date: new Date('2024-01-21'),
        startTime: '11:00',
        endTime: '12:15',
        status: 'completed',
        notes: 'Satisfied with service',
        reminderSent: true,
        createdAt: new Date('2024-01-19'),
        updatedAt: new Date('2024-01-21')
      },
      {
        id: '4',
        clientId: 'client4',
        serviceId: 'service4',
        date: new Date('2024-01-22'),
        startTime: '09:00',
        endTime: '11:00',
        status: 'cancelled',
        notes: 'Client cancelled due to emergency',
        reminderSent: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-22')
      }
    ];
    setAppointments(mockAppointments);
  }, []);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
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
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        clientName.toLowerCase().includes(searchLower) ||
        appointment.notes?.toLowerCase().includes(searchLower);

      const matchesStatus = filters.status === 'all' || appointment.status === filters.status;
      const matchesService = filters.service === 'all' || appointment.serviceId === filters.service;
      const matchesStaff = filters.staff === 'all' || appointment.staffId === filters.staff;

      return matchesSearch && matchesStatus && matchesService && matchesStaff;
    });
  }, [appointments, searchQuery, filters, clients]);

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
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.toDateString() === date.toDateString();
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
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
            Time
          </div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
              <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
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
        <div className="max-h-96 overflow-y-auto">
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
                  <div key={`${day.toISOString()}-${hour}`} className="bg-white p-1 min-h-[60px]">
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
      const dateA = new Date(`${a.date.toDateString()} ${a.startTime}`);
      const dateB = new Date(`${b.date.toDateString()} ${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {sortedAppointments.map(appointment => (
            <div key={appointment.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {getClientName(appointment.clientId)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {appointment.date.toLocaleDateString()} • {appointment.startTime} - {appointment.endTime}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                  <button
                    onClick={() => setSelectedAppointment(appointment)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    switch (viewType) {
      case 'month': return renderMonthView();
      case 'week': return renderWeekView();
      case 'agenda': return renderAgendaView();
      default: return renderMonthView();
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
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </button>
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
                <option value="service1">Hair Styling</option>
                <option value="service2">Facial Treatment</option>
                <option value="service3">Manicure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff</label>
              <select
                value={filters.staff}
                onChange={(e) => setFilters(prev => ({ ...prev, staff: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Staff</option>
                <option value="staff1">Sarah Johnson</option>
                <option value="staff2">Mike Chen</option>
                <option value="staff3">Emma Wilson</option>
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
              {viewType === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {viewType === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              {viewType === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
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
      {renderCalendarView()}

      {/* Empty State */}
      {filteredAppointments.length === 0 && (
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
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;