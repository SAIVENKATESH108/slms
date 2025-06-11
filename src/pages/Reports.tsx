import React, { useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Star,
  Brain,
  Download,
  MessageCircle,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  FileText,
  Share2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useReportsData } from '../hooks/useReportsData';
import { useAuthSession } from '../hooks/AuthSession';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const { user, trackActivity } = useAuthSession();
  const { 
    data, 
    loading, 
    error,
    generateAIInsights, 
    askAI, 
    generateMarketingCopy, 
    generateBusinessSummary,
    refreshData,
    clearError
  } = useReportsData();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [marketingCopy, setMarketingCopy] = useState('');
  const [businessSummary, setBusinessSummary] = useState('');

  // Debug logging
  React.useEffect(() => {
    console.log('Reports: Data updated', {
      loading,
      error,
      totalRevenue: data.summary.totalRevenue,
      revenueDataLength: data.revenue.length,
      summary: data.summary,
      revenueData: data.revenue,
      servicesData: data.services,
      clientsData: data.clients
    });
  }, [data, loading, error]);

  // Track user activity when interacting with reports
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    trackActivity();
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    
    setAiLoading(true);
    trackActivity();
    try {
      const response = await askAI(aiQuestion);
      setAiResponse(response);
    } catch (error) {
      setAiResponse('Sorry, I encountered an error processing your question.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateMarketingCopy = async () => {
    setAiLoading(true);
    trackActivity();
    try {
      const copy = await generateMarketingCopy();
      setMarketingCopy(copy);
    } catch (error) {
      setMarketingCopy('Error generating marketing copy.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateBusinessSummary = async () => {
    setAiLoading(true);
    trackActivity();
    try {
      const summary = await generateBusinessSummary();
      setBusinessSummary(summary);
    } catch (error) {
      setBusinessSummary('Error generating business summary.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefreshData = async () => {
    trackActivity();
    await refreshData();
  };

  // Chart configurations
  const revenueChartData = {
    labels: data.revenue.map(r => format(new Date(r.date), 'MMM dd')),
    datasets: [
      {
        label: 'Daily Revenue',
        data: data.revenue.map(r => r.amount),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const servicesChartData = {
    labels: data.services.map(s => s.name),
    datasets: [
      {
        label: 'Revenue',
        data: data.services.map(s => s.revenue),
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  const clientSegmentData = {
    labels: ['VIP', 'Regular', 'New', 'At-Risk'],
    datasets: [
      {
        data: [
          data.clients.filter(c => c.segment === 'VIP').length,
          data.clients.filter(c => c.segment === 'Regular').length,
          data.clients.filter(c => c.segment === 'New').length,
          data.clients.filter(c => c.segment === 'At-Risk').length
        ],
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            if (typeof value === 'number') {
              return `INR ${value.toLocaleString()}`;
            }
            return value;
          }
        }
      }
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'revenue', name: 'Revenue Analytics', icon: TrendingUp },
    { id: 'services', name: 'Service Performance', icon: Target },
    { id: 'clients', name: 'Client Analytics', icon: Users },
    { id: 'predictions', name: 'AI Predictions', icon: Brain },
    { id: 'ai-assistant', name: 'AI Assistant', icon: MessageCircle }
  ];

  const StatCard = ({ title, value, change, icon: Icon, color = 'purple' }: any) => {
    // Handle both number and object formats for change
    const changeValue = typeof change === 'object' ? change?.value : change;
    const isPositive = typeof change === 'object' ? change?.isPositive : (changeValue >= 0);
    
    const colorClasses = {
      purple: 'from-purple-500 to-indigo-600',
      blue: 'from-blue-500 to-cyan-600',
      green: 'from-emerald-500 to-teal-600',
      yellow: 'from-amber-500 to-orange-600',
      red: 'from-red-500 to-pink-600'
    };
    
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl border border-gray-200/50 p-4 md:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide truncate">{title}</p>
            <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{value}</p>
            {changeValue !== undefined && changeValue !== null && (
              <div className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium mt-2 md:mt-3 ${
                isPositive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                ) : (
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1 rotate-180" />
                )}
                <span className="hidden sm:inline">{isPositive ? '+' : ''}{Number(changeValue).toFixed(1)}% from last month</span>
                <span className="sm:hidden">{isPositive ? '+' : ''}{Number(changeValue).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className={`p-2 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br ${colorClasses[color] || colorClasses.purple} shadow-lg flex-shrink-0`}>
            <Icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const InsightCard = ({ insight }: any) => {
    const getInsightStyles = () => {
      switch (insight.impact) {
        case 'high':
          return 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100';
        case 'medium':
          return 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100';
        default:
          return 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100';
      }
    };

    const getIconColor = () => {
      switch (insight.type) {
        case 'trend': return 'text-blue-600';
        case 'anomaly': return 'text-red-600';
        case 'recommendation': return 'text-purple-600';
        case 'prediction': return 'text-green-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${getInsightStyles()}`}>
        <div className="flex items-start space-x-3 md:space-x-4">
          <div className="p-2 rounded-lg md:rounded-xl bg-white/80 shadow-sm flex-shrink-0">
            {insight.type === 'trend' && <TrendingUp className={`h-5 w-5 md:h-6 md:w-6 ${getIconColor()}`} />}
            {insight.type === 'anomaly' && <AlertTriangle className={`h-5 w-5 md:h-6 md:w-6 ${getIconColor()}`} />}
            {insight.type === 'recommendation' && <Sparkles className={`h-5 w-5 md:h-6 md:w-6 ${getIconColor()}`} />}
            {insight.type === 'prediction' && <Brain className={`h-5 w-5 md:h-6 md:w-6 ${getIconColor()}`} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-base md:text-lg">{insight.title}</h4>
            <p className="text-gray-700 mt-1 md:mt-2 leading-relaxed text-sm md:text-base">{insight.description}</p>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 md:mt-4">
              {insight.actionable && (
                <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Actionable
                </span>
              )}
              {insight.confidence && (
                <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-gray-100 text-gray-800">
                  <Target className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  <span className="hidden sm:inline">{insight.confidence}% confidence</span>
                  <span className="sm:hidden">{insight.confidence}%</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-8 md:py-12">
        <div className="text-center px-4">
          <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Error Loading Reports</h2>
          <p className="text-sm md:text-base text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              handleRefreshData();
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm md:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                title="Total Revenue"
                value={`INR ${(data.summary.totalRevenue || 0).toLocaleString()}`}
                change={{
                  value: data.summary.growthRate || 0,
                  isPositive: (data.summary.growthRate || 0) >= 0
                }}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Total Clients"
                value={data.summary.totalClients || 0}
                change={{
                  value: 8.2,
                  isPositive: true
                }}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Appointments"
                value={data.summary.totalAppointments || 0}
                change={{
                  value: 15.3,
                  isPositive: true
                }}
                icon={Calendar}
                color="purple"
              />
              <StatCard
                title="Avg Rating"
                value={(data.summary.avgRating || 0).toFixed(1)}
                change={{
                  value: 2.1,
                  isPositive: true
                }}
                icon={Star}
                color="yellow"
              />
            </div>

            {/* AI Insights Panel */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg md:rounded-xl p-4 md:p-6 border border-purple-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="mr-2 text-purple-600" size={18} />
                  <span className="hidden sm:inline">AI Business Insights</span>
                  <span className="sm:hidden">AI Insights</span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleRefreshData}
                    disabled={loading}
                    className="px-3 py-1.5 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-1 text-sm"
                  >
                    <RefreshCw size={14} />
                    <span className="hidden sm:inline">Refresh Data</span>
                    <span className="sm:hidden">Refresh</span>
                  </button>
                  <button
                    onClick={generateAIInsights}
                    disabled={loading}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                  >
                    <Zap size={14} className="md:w-4 md:h-4" />
                    <span>{loading ? 'Analyzing...' : 'Generate Insights'}</span>
                  </button>
                </div>
              </div>
              
              {data.insights.length > 0 ? (
                <div className="space-y-3">
                  {data.insights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <Brain size={40} className="mx-auto mb-4 text-gray-300 md:w-12 md:h-12" />
                  <p className="text-gray-500 text-sm md:text-base px-4">
                    {loading ? 'Generating AI insights...' : 'Click "Generate Insights" to get AI-powered business analysis'}
                  </p>
                </div>
              )}
            </div>

            {/* Revenue Trend */}
            <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Revenue Trend (Last 30 Days)</h3>
              {data.revenue.length > 0 ? (
                <div className="h-64 md:h-80">
                  <Line data={revenueChartData} options={chartOptions} />
                </div>
              ) : (
                <div className="text-center py-6 md:py-8">
                  <p className="text-gray-500 text-sm md:text-base">No revenue data available</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
              {data.revenue.length > 0 ? (
                <Line data={revenueChartData} options={chartOptions} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No revenue data available</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
                {data.services.length > 0 ? (
                  <Bar data={servicesChartData} options={chartOptions} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No service data available</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Cash</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>UPI</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Card</span>
                    <span className="font-medium">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Performance</h3>
              {data.services.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3">Service</th>
                        <th className="text-left py-3">Bookings</th>
                        <th className="text-left py-3">Revenue</th>
                        <th className="text-left py-3">Rating</th>
                        <th className="text-left py-3">Cancellation Rate</th>
                        <th className="text-left py-3">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.services.map(service => (
                        <tr key={service.id} className="border-b border-gray-100">
                          <td className="py-3 font-medium">{service.name}</td>
                          <td className="py-3">{service.bookings}</td>
                          <td className="py-3">₹{service.revenue.toLocaleString()}</td>
                          <td className="py-3 flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            {service.avgRating}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              service.cancellationRate > 10 ? 'bg-red-100 text-red-800' :
                              service.cancellationRate > 5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {service.cancellationRate}%
                            </span>
                          </td>
                          <td className="py-3">{service.profitMargin}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No service data available</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'clients':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Segments</h3>
                {data.clients.length > 0 ? (
                  <Doughnut data={clientSegmentData} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No client data available</p>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h3>
                {data.clients.length > 0 ? (
                  <div className="space-y-3">
                    {data.clients.slice(0, 5).map(client => (
                      <div key={client.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-gray-600">{client.visitCount} visits</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{client.totalSpent.toLocaleString()}</p>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            client.segment === 'VIP' ? 'bg-purple-100 text-purple-800' :
                            client.segment === 'Regular' ? 'bg-blue-100 text-blue-800' :
                            client.segment === 'New' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {client.segment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No client data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'predictions':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="mr-2 text-blue-600" size={20} />
                AI Predictions & Forecasts
              </h3>
              
              {data.predictions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.predictions.map((prediction, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {prediction.type === 'revenue' ? 'Revenue Forecast' : 
                         prediction.type === 'clients' ? 'Client Growth' : 'Appointment Prediction'}
                      </h4>
                      <p className="text-2xl font-bold text-blue-600 mb-2">
                        {prediction.type === 'revenue' ? `₹${prediction.predicted.toLocaleString()}` : prediction.predicted}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">{prediction.period}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Confidence: {prediction.confidence}%</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${prediction.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">AI predictions will appear here after analysis</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'ai-assistant':
        return (
          <div className="space-y-6">
            {/* AI Chat Interface */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="mr-2 text-purple-600" size={20} />
                Ask AI Assistant
              </h3>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask about your business performance..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {aiLoading ? 'Thinking...' : 'Ask'}
                  </button>
                </div>
                
                {aiResponse && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Share2 className="mr-2 text-green-600" size={20} />
                  Marketing Copy Generator
                </h3>
                <button
                  onClick={handleGenerateMarketingCopy}
                  disabled={aiLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mb-4"
                >
                  {aiLoading ? 'Generating...' : 'Generate Instagram Post'}
                </button>
                
                {marketingCopy && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm">{marketingCopy}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="mr-2 text-blue-600" size={20} />
                  Business Summary
                </h3>
                <button
                  onClick={handleGenerateBusinessSummary}
                  disabled={aiLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
                >
                  {aiLoading ? 'Generating...' : 'Generate Monthly Report'}
                </button>
                
                {businessSummary && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm">{businessSummary}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-full">
      <div className="w-full py-4 md:py-6">
        {/* Enhanced Header */}
        <div className="text-center mb-8 md:mb-12 px-4">
          <div className="relative inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl md:rounded-3xl mb-4 md:mb-6 shadow-2xl">
            <BarChart3 className="w-8 h-8 md:w-12 md:h-12 text-white" />
            <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full border-2 md:border-3 border-white flex items-center justify-center">
              <Activity className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 md:mb-4">
            Advanced Analytics
          </h1>
          <p className="text-gray-600 text-base md:text-xl max-w-3xl mx-auto leading-relaxed px-4">
            AI-powered insights and comprehensive business analytics for {user?.displayName || 'your salon'}
          </p>
          <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full mx-auto mt-4 md:mt-6"></div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mt-6 md:mt-8 px-4">
            <button
              onClick={handleRefreshData}
              disabled={loading}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg md:rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 text-sm md:text-base"
            >
              <RefreshCw size={16} className={`md:w-[18px] md:h-[18px] ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh Data</span>
            </button>
            <button
              onClick={generateAIInsights}
              disabled={loading}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg md:rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 text-sm md:text-base"
            >
              <Sparkles size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="font-medium">Generate AI Insights</span>
            </button>
          </div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl border border-gray-200/50 mb-6 md:mb-8 overflow-hidden mx-4 md:mx-0">
          <div className="p-1 md:p-2">
            <nav className="flex space-x-1 md:space-x-2 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center space-x-2 md:space-x-3 whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/80'
                    }`}
                  >
                    <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-96 px-4 md:px-0">
          {loading && data.revenue.length === 0 ? (
            <div className="flex items-center justify-center py-8 md:py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm md:text-base">Loading your business data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 md:py-12">
              <div className="text-center">
                <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                <p className="text-gray-600 mb-4 text-sm md:text-base">{error}</p>
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 text-sm md:text-base"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Debug Info - Remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 md:p-4 bg-gray-100 rounded-lg text-xs md:text-sm">
                  <strong>Debug Info:</strong> Total Revenue: {data.summary.totalRevenue}, 
                  Revenue Data Length: {data.revenue.length}, 
                  Loading: {loading.toString()}
                </div>
              )}
              {renderTabContent()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;