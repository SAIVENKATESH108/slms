import { useState, useEffect } from 'react';
import { ReportsData, AIInsight, PredictionData } from '../types/Reports';
import { geminiService } from '../services/GeminiService';
import { firestoreService } from '../services/firestoreService';
import { useAuthSession } from './AuthSession';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';

export const useReportsData = () => {
  const { user, isAuthenticated } = useAuthSession();
  const [data, setData] = useState<ReportsData>({
    revenue: [],
    services: [],
    clients: [],
    staff: [],
    appointments: [],
    predictions: [],
    insights: [],
    summary: {
      totalRevenue: 0,
      totalClients: 0,
      totalAppointments: 0,
      avgRating: 0,
      growthRate: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch comprehensive reports data from Firebase
  const fetchReportsData = async () => {
    if (!user || !isAuthenticated) {
      
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get date ranges for analysis - expanded to last 3 months for better data coverage
      const currentMonth = {
        start: startOfMonth(subMonths(new Date(), 2)), // Start from 3 months ago
        end: endOfMonth(new Date()) // End at current month
      };
      
      const lastMonth = {
        start: startOfMonth(subMonths(new Date(), 1)),
        end: endOfMonth(subMonths(new Date(), 1))
      };

      // Fetch all data in parallel for better performance
      // UPDATED: Fetch user-specific data for reports
      
      
      const [
        currentTransactions,
        lastMonthTransactions,
        currentAppointments,
        services,
        clients,
        staff
      ] = await Promise.all([
        // Get transactions from user's collection and shared collection
        firestoreService.getTransactions(user.uid, currentMonth.start, currentMonth.end),
        firestoreService.getTransactions(user.uid, lastMonth.start, lastMonth.end),
        // Get appointments from user's collection
        firestoreService.getAppointments(user.uid, currentMonth.start, currentMonth.end),
        // Get services from user's collection
        firestoreService.loadServicesSettings(user.uid),
        // Get clients from user's collection
        firestoreService.getUserClients(user.uid),
        // Get staff from user's collection
        firestoreService.getStaff(user.uid)
      ]);
      
      

      // Process revenue data
       
      const revenueData = await processRevenueData(currentTransactions, currentMonth);
      const lastMonthRevenue = lastMonthTransactions
        .filter(t => t.isPaid)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Process service performance
      
      const servicePerformance = await processServicePerformance(
        services, 
        currentTransactions, 
        currentAppointments
      );

      // Process client analytics
      
      const clientAnalytics = await processClientAnalytics(
        clients, 
        currentTransactions, 
        currentAppointments
      );

      // Process staff performance
      
      const staffPerformance = await processStaffPerformance(
        staff, 
        currentTransactions, 
        currentAppointments
      );

      // Process appointment analytics
      
      const appointmentAnalytics = await processAppointmentAnalytics(currentAppointments);

      // Calculate summary metrics
      
      const totalRevenue = revenueData.reduce((sum, r) => sum + r.amount, 0);
      const totalAppointments = currentAppointments.length;
      const avgRating = staffPerformance.length > 0 
        ? staffPerformance.reduce((sum, s) => sum + (s.avgRating || 0), 0) / staffPerformance.length 
        : 0;
      
      const growthRate = lastMonthRevenue > 0 
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      

      // Update state with processed data
      setData({
        revenue: revenueData,
        services: servicePerformance,
        clients: clientAnalytics,
        staff: staffPerformance,
        appointments: appointmentAnalytics,
        predictions: [],
        insights: [],
        summary: {
          totalRevenue,
          totalClients: clients.length,
          totalAppointments,
          avgRating,
          growthRate
        }
      });

      

    } catch {
      setError('Failed to load reports data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Process revenue data into chart-friendly format
  const processRevenueData = async (transactions: any[], dateRange: { start: Date; end: Date }) => {
    
    
    const days = eachDayOfInterval(dateRange);
    const dailyRevenue = new Map<string, { amount: number; transactions: number }>();

    // Initialize all days with zero values
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      dailyRevenue.set(dateKey, { amount: 0, transactions: 0 });
    });

    // Aggregate transaction data by day
    transactions
      .filter(t => {
        // Check if transaction has required fields
        const hasRequiredFields = t.isPaid !== undefined && t.amount !== undefined && t.createdAt;
        if (!hasRequiredFields) {
        
        }
        return t.isPaid && hasRequiredFields;
      })
      .forEach(transaction => {
        try {
          // Handle both Firestore Timestamp and Date objects
          let transactionDate;
          if (transaction.createdAt && transaction.createdAt.toDate) {
            transactionDate = transaction.createdAt.toDate();
          } else if (transaction.createdAt instanceof Date) {
            transactionDate = transaction.createdAt;
          } else {
            transactionDate = new Date(transaction.createdAt);
          }
          
          const date = format(transactionDate, 'yyyy-MM-dd');
          const existing = dailyRevenue.get(date) || { amount: 0, transactions: 0 };
          dailyRevenue.set(date, {
            amount: existing.amount + (transaction.amount || 0),
            transactions: existing.transactions + 1
          });
        } catch {
          
        }
      });

    const result = Array.from(dailyRevenue.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      transactions: data.transactions
    }));
    
    return result;
  };

  // Process service performance metrics
  const processServicePerformance = async (services: any[], transactions: any[], appointments: any[]) => {
    
    
    return services.map(service => {
      // Match transactions by service name since we might not have serviceId
      const serviceTransactions = transactions.filter(t => 
        (t.serviceId === service.id || t.service === service.name) && t.isPaid
      );
      const serviceAppointments = appointments.filter(a => 
        a.serviceId === service.id || a.service === service.name
      );
      const completedAppointments = serviceAppointments.filter(a => a.status === 'completed');
      const cancelledAppointments = serviceAppointments.filter(a => a.status === 'cancelled');

      const revenue = serviceTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const bookings = serviceAppointments.length;
      const cancellationRate = bookings > 0 ? (cancelledAppointments.length / bookings) * 100 : 0;
      
      // Calculate average rating (would need rating data in appointments)
      const avgRating = 4.5 + (Math.random() * 0.5); // Mock rating for now
      
      // Calculate profit margin (would need cost data)
      const profitMargin = 60 + (Math.random() * 20); // Mock profit margin

      return {
        id: service.id,
        name: service.name,
        category: service.category || 'General',
        bookings,
        revenue,
        avgRating: Number(avgRating.toFixed(1)),
        cancellationRate: Number(cancellationRate.toFixed(1)),
        profitMargin: Number(profitMargin.toFixed(1))
      };
    });
  };

  // Process client analytics and segmentation
  const processClientAnalytics = async (clients: any[], transactions: any[], appointments: any[]) => {
    
    
    return clients.map(client => {
      const clientTransactions = transactions.filter(t => t.clientId === client.id && t.isPaid);
      const clientAppointments = appointments.filter(a => a.clientId === client.id);
      
      const totalSpent = clientTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const visitCount = clientAppointments.filter(a => a.status === 'completed').length;
      
      // Determine client segment based on spending and frequency
      let segment: 'VIP' | 'Regular' | 'New' | 'At-Risk';
      if (totalSpent > 10000 && visitCount > 10) {
        segment = 'VIP';
      } else if (totalSpent > 3000 && visitCount > 5) {
        segment = 'Regular';
      } else if (visitCount <= 2) {
        segment = 'New';
      } else {
        segment = 'At-Risk';
      }

      // Handle lastVisit date safely
      let lastVisitFormatted = '';
      try {
        if (client.lastVisit) {
          if (client.lastVisit.toDate) {
            lastVisitFormatted = format(client.lastVisit.toDate(), 'yyyy-MM-dd');
          } else if (client.lastVisit instanceof Date) {
            lastVisitFormatted = format(client.lastVisit, 'yyyy-MM-dd');
          } else {
            lastVisitFormatted = format(new Date(client.lastVisit), 'yyyy-MM-dd');
          }
        }
      } catch {
          
      }

      return {
        id: client.id,
        name: client.name || 'Unknown',
        email: client.email || client.phone || '',
        totalSpent,
        visitCount,
        lastVisit: lastVisitFormatted,
        segment,
        acquisitionSource: 'Direct' // Would need to track this
      };
    });
  };

  // Process staff performance metrics
  const processStaffPerformance = async (staff: any[], transactions: any[], appointments: any[]) => {
    
    
    return staff.map(staffMember => {
      const staffTransactions = transactions.filter(t => t.staffId === staffMember.id && t.isPaid);
      const staffAppointments = appointments.filter(a => a.staffId === staffMember.id);
      const completedAppointments = staffAppointments.filter(a => a.status === 'completed');

      const revenue = staffTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const appointmentsCompleted = completedAppointments.length;
      
      // Mock rating and utilization (would need actual data)
      const avgRating = 4.3 + (Math.random() * 0.7);
      const utilization = 70 + (Math.random() * 25);

      return {
        id: staffMember.id,
        name: staffMember.name || 'Unknown Staff',
        appointmentsCompleted,
        revenue,
        avgRating: Number(avgRating.toFixed(1)),
        utilization: Number(utilization.toFixed(0))
      };
    });
  };

  // Process appointment analytics
  const processAppointmentAnalytics = async (appointments: any[]) => {
    
    
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourAppointments = appointments.filter(apt => {
        try {
          let appointmentDate;
          if (apt.scheduledAt && apt.scheduledAt.toDate) {
            appointmentDate = apt.scheduledAt.toDate();
          } else if (apt.scheduledAt instanceof Date) {
            appointmentDate = apt.scheduledAt;
          } else if (apt.scheduledAt) {
            appointmentDate = new Date(apt.scheduledAt);
          } else {
            return false;
          }
          
          const appointmentHour = appointmentDate.getHours();
          return appointmentHour === hour;
        } catch {
          
          return false;
        }
      });

      return {
        date: format(new Date(), 'yyyy-MM-dd'),
        hour,
        bookings: hourAppointments.length,
        cancellations: hourAppointments.filter(a => a.status === 'cancelled').length,
        noShows: hourAppointments.filter(a => a.status === 'no-show').length
      };
    });

    return hourlyData;
  };

  // Generate AI insights using the enhanced Gemini service
  const generateAIInsights = async () => {
    if (!data.revenue.length) {
      return;
    }

    setLoading(true);
    try {
      const insights = await geminiService.generateBusinessInsights(data);
      setAiInsights(insights);

      const forecast = await geminiService.generateRevenueForecast(data.revenue);
      setPredictions(forecast);
    } catch {
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // AI-powered question answering
  const askAI = async (question: string): Promise<string> => {
    try {
      return await geminiService.askAI(question, data);
    } catch {
      return 'Sorry, I encountered an error processing your question. Please try again.';
    }
  };

  // Generate marketing copy
  const generateMarketingCopy = async (): Promise<string> => {
    try {
      return await geminiService.generateMarketingCopy(data.services, data.clients);
    } catch {
      return 'Unable to generate marketing copy at this time.';
    }
  };

  // Generate business summary
  const generateBusinessSummary = async (): Promise<string> => {
    try {
      return await geminiService.generateBusinessSummary(data);
    } catch {
      return 'Unable to generate business summary at this time.';
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await fetchReportsData();
    if (data.revenue.length > 0) {
      await generateAIInsights();
    }
  };

  // Auto-fetch data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchReportsData();
    }
  }, [isAuthenticated, user]);

  // Auto-generate insights when data is loaded
  useEffect(() => {
    if (data.revenue.length > 0 && aiInsights.length === 0) {
      generateAIInsights();
    }
  }, [data.revenue.length]);

  return {
    data: { ...data, insights: aiInsights, predictions },
    loading,
    error,
    fetchReportsData,
    generateAIInsights,
    askAI,
    generateMarketingCopy,
    generateBusinessSummary,
    refreshData,
    clearError: () => setError(null)
  };
};