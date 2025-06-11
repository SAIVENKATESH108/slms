export interface RevenueData {
  date: string;
  amount: number;
  transactions: number;
}

export interface ServiceData {
  id: string;
  name: string;
  category: string;
  bookings: number;
  revenue: number;
  avgRating: number;
  cancellationRate: number;
  profitMargin: number;
}

export interface ClientData {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  visitCount: number;
  lastVisit: string;
  segment: 'VIP' | 'Regular' | 'New' | 'At-Risk';
  acquisitionSource: string;
}

export interface StaffData {
  id: string;
  name: string;
  appointmentsCompleted: number;
  revenue: number;
  avgRating: number;
  utilization: number;
}

export interface AppointmentData {
  date: string;
  hour: number;
  bookings: number;
  cancellations: number;
  noShows: number;
}

export interface PredictionData {
  type: 'revenue' | 'clients' | 'appointments';
  period: string;
  predicted: number;
  confidence: number;
  factors: string[];
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

export interface ReportsData {
  revenue: RevenueData[];
  services: ServiceData[];
  clients: ClientData[];
  staff: StaffData[];
  appointments: AppointmentData[];
  predictions: PredictionData[];
  insights: AIInsight[];
  summary: {
    totalRevenue: number;
    totalClients: number;
    totalAppointments: number;
    avgRating: number;
    growthRate: number;
  };
}