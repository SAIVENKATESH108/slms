import { GoogleGenerativeAI } from '@google/generative-ai';
import { ReportsData, AIInsight, PredictionData } from '../types/reports';

interface GeminiConfig {
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

class EnhancedGeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: GeminiConfig;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found. AI features will be disabled.');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.config = {
      model: "gemini-1.5-pro",
      temperature: 0.7,
      maxOutputTokens: 2048
    };
    
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
      }
    });
  }

  private createStructuredPrompt(context: string, task: string, format: string, examples?: string): string {
    return `
CONTEXT: You are an expert AI business analyst specializing in beauty salon operations and analytics.

BUSINESS CONTEXT: ${context}

TASK: ${task}

OUTPUT FORMAT: ${format}

${examples ? `EXAMPLES: ${examples}` : ''}

GUIDELINES:
- Be specific and actionable
- Use data-driven insights
- Consider beauty industry best practices
- Provide confidence levels where applicable
- Focus on ROI and business growth
- Consider seasonal trends in beauty industry

Please provide your analysis:
    `.trim();
  }

  async generateBusinessInsights(data: ReportsData): Promise<AIInsight[]> {
    if (!this.model) return this.getFallbackInsights();

    try {
      const context = `
Beauty salon with:
- Monthly Revenue: ₹${data.summary.totalRevenue.toLocaleString()}
- Growth Rate: ${data.summary.growthRate}%
- Total Clients: ${data.summary.totalClients}
- Average Rating: ${data.summary.avgRating}/5
- Top Services: ${data.services.slice(0, 3).map(s => `${s.name} (₹${s.revenue})`).join(', ')}
- Recent Revenue Trend: ${data.revenue.slice(-7).map(r => r.amount).join(', ')}
      `;

      const task = `
Analyze this beauty salon's performance and generate 4-6 actionable business insights.
Focus on:
1. Revenue optimization opportunities
2. Service performance analysis
3. Client retention strategies
4. Operational efficiency improvements
5. Growth opportunities
6. Risk identification
      `;

      const format = `
Return a JSON array of insights with this exact structure:
[
  {
    "type": "trend|anomaly|recommendation|prediction",
    "title": "Brief, compelling title (max 60 chars)",
    "description": "Detailed explanation with specific data points (100-150 words)",
    "impact": "high|medium|low",
    "actionable": true|false,
    "confidence": 85,
    "category": "revenue|services|clients|operations|marketing",
    "priority": 1-5,
    "timeframe": "immediate|short-term|long-term",
    "expectedROI": "high|medium|low"
  }
]
      `;

      const examples = `
{
  "type": "recommendation",
  "title": "Promote High-Margin Facial Services",
  "description": "Your facial treatments show 70% profit margin vs 45% average. With only 15% of total bookings, increasing facial bookings by 30% could boost monthly profit by ₹25,000. Consider targeted promotions during weekday slow hours.",
  "impact": "high",
  "actionable": true,
  "confidence": 92,
  "category": "revenue",
  "priority": 1,
  "timeframe": "short-term",
  "expectedROI": "high"
}
      `;

      const prompt = this.createStructuredPrompt(context, task, format, examples);
      
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
      
      return this.getFallbackInsights();
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getFallbackInsights();
    }
  }

  async generateRevenueForecast(revenueData: any[]): Promise<PredictionData[]> {
    if (!this.model) return [];

    try {
      const context = `
Beauty salon revenue data for the past ${revenueData.length} days:
${revenueData.map(r => `${r.date}: ₹${r.amount}`).join('\n')}

Recent trends:
- Average daily revenue: ₹${(revenueData.reduce((sum, r) => sum + r.amount, 0) / revenueData.length).toFixed(0)}
- Highest day: ₹${Math.max(...revenueData.map(r => r.amount))}
- Lowest day: ₹${Math.min(...revenueData.map(r => r.amount))}
      `;

      const task = `
Generate revenue forecasts for the next 30 days considering:
1. Weekly patterns (weekends vs weekdays)
2. Seasonal beauty industry trends
3. Growth trajectory
4. Market conditions
5. Holiday impacts
      `;

      const format = `
Return a JSON array with forecasts:
[
  {
    "type": "revenue",
    "period": "next_30_days",
    "predicted": 125000,
    "confidence": 78,
    "factors": ["seasonal_trend", "weekend_boost", "growth_momentum"],
    "range": {
      "min": 110000,
      "max": 140000
    },
    "breakdown": {
      "weekdays": 85000,
      "weekends": 40000
    }
  },
  {
    "type": "clients",
    "period": "next_30_days", 
    "predicted": 180,
    "confidence": 82,
    "factors": ["retention_rate", "referral_growth"]
  }
]
      `;

      const prompt = this.createStructuredPrompt(context, task, format);

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
    if (!this.model) return this.getFallbackMarketingCopy();

    try {
      const context = `
Beauty salon with top services:
${topServices.map(s => `- ${s.name}: ₹${s.price}, ${s.bookings} bookings, ${s.avgRating}⭐`).join('\n')}

Client base: ${clientData.length} total clients
Recent client segments: VIP (${clientData.filter((c: any) => c.segment === 'VIP').length}), Regular (${clientData.filter((c: any) => c.segment === 'Regular').length})
      `;

      const task = `
Create an engaging Instagram post that:
1. Highlights the top-performing service
2. Creates urgency or excitement
3. Includes a clear call-to-action
4. Uses beauty industry hashtags
5. Maintains professional yet friendly tone
6. Encourages bookings
      `;

      const format = `
Create a single Instagram post (150-200 words) with:
- Engaging opening line
- Service highlight with benefits
- Social proof (ratings/reviews)
- Call-to-action
- Relevant hashtags
- Booking information
      `;

      const prompt = this.createStructuredPrompt(context, task, format);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating marketing copy:', error);
      return this.getFallbackMarketingCopy();
    }
  }

  async generateBusinessSummary(data: ReportsData): Promise<string> {
    if (!this.model) return this.getFallbackBusinessSummary();

    try {
      const context = `
Beauty salon monthly performance:
- Total Revenue: ₹${data.summary.totalRevenue.toLocaleString()}
- Growth Rate: ${data.summary.growthRate}%
- Total Clients: ${data.summary.totalClients}
- Total Appointments: ${data.summary.totalAppointments}
- Average Rating: ${data.summary.avgRating}/5

Top 5 Services by Revenue:
${data.services.slice(0, 5).map((s, i) => `${i+1}. ${s.name}: ₹${s.revenue.toLocaleString()} (${s.bookings} bookings)`).join('\n')}

Revenue Trend: ${data.revenue.slice(-7).map(r => `₹${r.amount}`).join(' → ')}
      `;

      const task = `
Write a comprehensive monthly business summary report for the salon owner including:
1. Executive Summary (key highlights)
2. Financial Performance Analysis
3. Service Performance Review
4. Client Metrics & Insights
5. Operational Highlights
6. Recommendations for Next Month
7. Risk Assessment & Mitigation
      `;

      const format = `
Professional business report format (400-500 words):
- Use clear headings
- Include specific metrics and percentages
- Provide actionable recommendations
- Maintain professional tone
- Focus on business growth opportunities
      `;

      const prompt = this.createStructuredPrompt(context, task, format);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating business summary:', error);
      return this.getFallbackBusinessSummary();
    }
  }

  async askAI(question: string, context: ReportsData): Promise<string> {
    if (!this.model) return 'AI service is not available at the moment.';

    try {
      const businessContext = `
Beauty salon business data:
- Monthly Revenue: ₹${context.summary.totalRevenue.toLocaleString()}
- Growth: ${context.summary.growthRate}%
- Clients: ${context.summary.totalClients}
- Rating: ${context.summary.avgRating}/5
- Top Services: ${context.services.slice(0, 5).map(s => s.name).join(', ')}
      `;

      const task = `
Answer this specific question about the beauty salon business: "${question}"
      `;

      const format = `
Provide a helpful, specific, and actionable answer that:
- Directly addresses the question
- Uses the provided business data
- Offers practical recommendations
- Maintains professional tone
- Includes specific metrics when relevant
- Suggests next steps if applicable
      `;

      const prompt = this.createStructuredPrompt(businessContext, task, format);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error with AI question:', error);
      return 'I apologize, but I encountered an error processing your question. Please try again.';
    }
  }

  async generateServiceOptimization(services: any[]): Promise<string[]> {
    if (!this.model) return [];

    try {
      const context = `
Beauty salon services performance:
${services.map(s => `
- ${s.name}: ₹${s.price}, ${s.bookings} bookings, ${s.avgRating}⭐, ${s.profitMargin}% margin, ${s.cancellationRate}% cancellation
`).join('')}
      `;

      const task = `
Analyze service performance and provide 5 specific optimization recommendations for:
1. Pricing strategy
2. Service bundling opportunities
3. Underperforming service improvements
4. New service suggestions
5. Operational efficiency
      `;

      const format = `
Return a JSON array of specific recommendations:
["Increase facial service prices by 15% - demand exceeds capacity with 4.9 rating", "Bundle manicure + pedicure for ₹200 savings to increase average transaction", ...]
      `;

      const prompt = this.createStructuredPrompt(context, task, format);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Error generating service optimization:', error);
      return [];
    }
  }

  // Fallback methods for when AI is unavailable
  private getFallbackInsights(): AIInsight[] {
    return [
      {
        id: 'fallback-1',
        type: 'recommendation',
        title: 'AI Service Temporarily Unavailable',
        description: 'Unable to generate AI insights at the moment. Please check your API configuration and try again.',
        impact: 'low',
        actionable: false
      }
    ];
  }

  private getFallbackMarketingCopy(): string {
    return `✨ Transform Your Look Today! ✨

Book your appointment now and experience our premium beauty services. Our expert team is ready to make you look and feel amazing!

📞 Call now to book
💅 #BeautyTransformation #SalonLife #BookNow`;
  }

  private getFallbackBusinessSummary(): string {
    return `Monthly Business Summary

AI-powered business analysis is temporarily unavailable. Please ensure your Gemini API key is properly configured to access detailed business insights and recommendations.

For manual analysis, review your:
- Revenue trends and growth patterns
- Top-performing services
- Client retention rates
- Operational efficiency metrics`;
  }
}

export const enhancedGeminiService = new EnhancedGeminiService();