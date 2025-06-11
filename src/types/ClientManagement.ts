export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  apartment: string;
  flatNumber: string;
  trustScore: number;
  notes: string;
  tags: string[];
  status: 'active' | 'inactive' | 'pending';
  preferredContactMethod: 'phone' | 'email' | 'whatsapp';
  dateOfBirth?: Date;
  anniversary?: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  price: number;
  isActive: boolean;
  requirements?: string[];
  createdAt: Date;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  staffId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  clientId: string;
  appointmentId?: string;
  serviceId?: string;
  type: 'service' | 'product' | 'package' | 'membership';
  description: string;
  amount: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'online';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded' | 'cancelled';
  paymentDate?: Date;
  dueDate?: Date;
  invoiceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  totalRevenue: number;
  pendingPayments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

export interface FilterOptions {
  status: 'all' | 'active' | 'inactive' | 'pending';
  trustScore: 'all' | 'high' | 'medium' | 'low';
  paymentStatus: 'all' | 'paid' | 'pending' | 'overdue';
  dateRange: {
    start?: Date;
    end?: Date;
  };
  tags: string[];
  apartment: string;
}

export interface SortOptions {
  field: 'name' | 'createdAt' | 'trustScore' | 'totalSpent' | 'lastVisit' | 'nextAppointment';
  direction: 'asc' | 'desc';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'appointment' | 'reminder' | 'follow-up';
  clientId: string;
  serviceId?: string;
  status: string;
  color?: string;
}