import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReportsData, AIInsight, PredictionData } from '../types/reports';

class GeminiService {
  private genAI!: GoogleGenerativeAI;
  private model!: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found. AI features will be disabled.');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Fixed: Use the correct model name
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  private createBusinessContext(data: ReportsData): string {
    return `
BEAUTY SALON BUSINESS ANALYTICS DATA:

FINANCIAL OVERVIEW:
- Total Monthly Revenue: ₹${data.summary.totalRevenue.toLocaleString()}
- Growth Rate: ${data.summary.growthRate}%
- Total Clients: ${data.summary.totalClients}
- Total Appointments: ${data.summary.totalAppointments}
- Average Rating: ${data.summary.avgRating}/5

REVENUE TREND (Last 30 Days):
${data.revenue.slice(-30).map(r => `${r.date}: ₹${r.amount} (${r.transactions} transactions)`).join('\n')}

TOP SERVICES PERFORMANCE:
${data.services.map(s => `
- ${s.name} (${s.category}):
  * Revenue: ₹${s.revenue.toLocaleString()}
  * Bookings: ${s.bookings}
  * Rating: ${s.avgRating}/5
  * Cancellation Rate: ${s.cancellationRate}%
  * Profit Margin: ${s.profitMargin}%
`).join('')}

CLIENT SEGMENTS:
${data.clients.map(c => `- ${c.name}: ${c.segment} (₹${c.totalSpent} spent, ${c.visitCount} visits)`).join('\n')}

STAFF PERFORMANCE:
${data.staff.map(s => `- ${s.name}: ${s.appointmentsCompleted} appointments, ₹${s.revenue} revenue, ${s.avgRating}/5 rating, ${s.utilization}% utilization`).join('\n')}
    `;
  }

  async generateBusinessInsights(data: ReportsData): Promise<AIInsight[]> {
    if (!this.model) return [];

    try {
      const businessContext = this.createBusinessContext(data);
      
      const prompt = `
${businessContext}

As an expert AI business analyst for beauty salons, analyze this comprehensive data and provide 5-6 strategic insights that will help grow this business.

ANALYSIS REQUIREMENTS:
1. Identify revenue optimization opportunities
2. Detect performance anomalies or concerning trends
3. Suggest service portfolio improvements
4. Recommend client retention strategies
5. Highlight operational efficiency gains
6. Predict potential risks or opportunities

RESPONSE FORMAT - Return ONLY a valid JSON array:
[
  {
    "type": "trend|anomaly|recommendation|prediction",
    "title": "Compelling insight title (max 60 characters)",
    "description": "Detailed analysis with specific data points and actionable advice (150-200 words)",
    "impact": "high|medium|low",
    "actionable": true|false,
    "confidence": 85,
    "category": "revenue|services|clients|operations|marketing|staff",
    "priority": 1,
    "timeframe": "immediate|short-term|long-term",
    "expectedROI": "high|medium|low",
    "dataPoints": ["specific metric 1", "specific metric 2"]
  }
]

GUIDELINES:
- Use specific numbers from the data
- Focus on actionable recommendations
- Consider beauty industry seasonality
- Prioritize high-impact, low-effort wins
- Include confidence levels based on data quality
- Suggest specific next steps
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return insights.map((insight: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          ...insight
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return [];
    }
  }

  async generateRevenueForecast(revenueData: any[]): Promise<PredictionData[]> {
    if (!this.model) return [];

    try {
      const revenueContext = `
HISTORICAL REVENUE DATA (${revenueData.length} days):
${revenueData.map(r => `${r.date}: ₹${r.amount} (${r.transactions} transactions)`).join('\n')}

STATISTICAL SUMMARY:
- Average Daily Revenue: ₹${(revenueData.reduce((sum, r) => sum + r.amount, 0) / revenueData.length).toFixed(0)}
- Highest Day: ₹${Math.max(...revenueData.map(r => r.amount))}
- Lowest Day: ₹${Math.min(...revenueData.map(r => r.amount))}
- Total Transactions: ${revenueData.reduce((sum, r) => sum + r.transactions, 0)}
      `;

      const prompt = `
${revenueContext}

As a data scientist specializing in beauty salon forecasting, predict business performance for the next 30 days.

FORECASTING REQUIREMENTS:
1. Consider weekly patterns (weekends vs weekdays)
2. Account for beauty industry seasonality
3. Factor in growth trends
4. Include confidence intervals
5. Predict both revenue and client volume

RESPONSE FORMAT - Return ONLY a valid JSON array:
[
  {
    "type": "revenue",
    "period": "next_30_days",
    "predicted": 125000,
    "confidence": 78,
    "factors": ["weekend_boost", "seasonal_trend", "growth_momentum"],
    "range": {
      "min": 110000,
      "max": 140000
    },
    "breakdown": {
      "weekdays": 85000,
      "weekends": 40000
    },
    "methodology": "Time series analysis with seasonal adjustment"
  },
  {
    "type": "clients",
    "period": "next_30_days",
    "predicted": 180,
    "confidence": 82,
    "factors": ["retention_rate", "referral_growth", "marketing_impact"],
    "range": {
      "min": 165,
      "max": 195
    }
  },
  {
    "type": "appointments",
    "period": "next_week",
    "predicted": 45,
    "confidence": 90,
    "factors": ["booking_pattern", "staff_availability"],
    "breakdown": {
      "monday": 5,
      "tuesday": 6,
      "wednesday": 7,
      "thursday": 8,
      "friday": 9,
      "saturday": 10
    }
  }
]

GUIDELINES:
- Base predictions on historical patterns
- Include realistic confidence levels
- Consider external factors (holidays, seasons)
- Provide actionable insights with predictions
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Error generating forecast:', error);
      return [];
    }
  }

  async generateMarketingCopy(topServices: any[], clientData: any): Promise<string> {
    if (!this.model) return '';

    try {
      const marketingContext = `
TOP PERFORMING SERVICES:
${topServices.slice(0, 3).map(s => `
- ${s.name}: ₹${s.price}, ${s.bookings} bookings, ${s.avgRating}⭐ rating
`).join('')}

CLIENT BASE INSIGHTS:
- Total Clients: ${clientData.length}
- VIP Clients: ${clientData.filter((c: any) => c.segment === 'VIP').length}
- Regular Clients: ${clientData.filter((c: any) => c.segment === 'Regular').length}
- New Clients: ${clientData.filter((c: any) => c.segment === 'New').length}
      `;

      const prompt = `
${marketingContext}

Create an engaging Instagram post for this beauty salon that:

CONTENT REQUIREMENTS:
1. Highlights the top-performing service
2. Creates urgency and excitement
3. Includes social proof (ratings/reviews)
4. Has a clear call-to-action
5. Uses trending beauty hashtags
6. Maintains professional yet friendly tone
7. Encourages immediate booking

POST STRUCTURE:
- Hook (attention-grabbing opening)
- Value proposition (why choose this service)
- Social proof (ratings, client satisfaction)
- Urgency/scarcity element
- Clear call-to-action
- Relevant hashtags (10-15)
- Contact information

TONE: Enthusiastic, professional, trustworthy
LENGTH: 150-200 words
STYLE: Instagram-optimized with emojis and line breaks

Generate the complete Instagram post:
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating marketing copy:', error);
      return '';
    }
  }

  async generateBusinessSummary(data: ReportsData): Promise<string> {
    if (!this.model) return '';

    try {
      const businessContext = this.createBusinessContext(data);

      const prompt = `
${businessContext}

Create a comprehensive monthly business performance report for the salon owner.

REPORT STRUCTURE:
1. EXECUTIVE SUMMARY (Key highlights and achievements)
2. FINANCIAL PERFORMANCE (Revenue analysis, growth metrics)
3. SERVICE PORTFOLIO ANALYSIS (Top performers, underperformers)
4. CLIENT METRICS & INSIGHTS (Retention, acquisition, satisfaction)
5. OPERATIONAL PERFORMANCE (Staff productivity, efficiency)
6. MARKET POSITION & COMPETITIVE ANALYSIS
7. STRATEGIC RECOMMENDATIONS (Next month priorities)
8. RISK ASSESSMENT & MITIGATION STRATEGIES

REQUIREMENTS:
- Professional business language
- Specific metrics and percentages
- Actionable recommendations
- Data-driven insights
- Growth-focused perspective
- 500-600 words total
- Clear section headings
- Executive-level detail

Generate the complete business report:
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating business summary:', error);
      return '';
    }
  }

  async askAI(question: string, context: ReportsData): Promise<string> {
    if (!this.model) return 'AI service is not available.';

    try {
      const businessContext = this.createBusinessContext(context);

      const prompt = `
${businessContext}

SALON OWNER QUESTION: "${question}"

As an expert AI business consultant for beauty salons, provide a comprehensive answer that:

RESPONSE REQUIREMENTS:
1. Directly addresses the specific question
2. Uses relevant data from the business context
3. Provides actionable recommendations
4. Includes specific metrics when applicable
5. Suggests concrete next steps
6. Considers industry best practices
7. Maintains professional consulting tone

GUIDELINES:
- Be specific and data-driven
- Offer practical solutions
- Consider ROI implications
- Include implementation timelines
- Address potential challenges
- Provide confidence levels for recommendations

Generate your expert response:
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error with AI question:', error);
      return 'Sorry, I encountered an error processing your question.';
    }
  }
}

export const geminiService = new GeminiService();