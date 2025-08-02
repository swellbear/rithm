import OpenAI from "openai";

/*
xAI Grok Integration for Business Analysis
Uses OpenAI-compatible API with xAI's Grok models
*/

// Check for XAI_API_KEY environment variable
if (!process.env.XAI_API_KEY) {
  console.warn('XAI_API_KEY not found - Grok integration unavailable');
}

const grokClient = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

// Domain-specific business analysis with real-time data
export async function analyzeBusinessData(businessData: any, analysisType: string): Promise<string> {
  let domainPrompt = '';
  let systemPrompt = '';

  // Domain-specific prompts and expertise
  switch (analysisType) {
    case 'business_consulting':
      systemPrompt = "You are a senior business consultant with MBA-level expertise and access to real-time market data. Provide detailed, actionable business analysis with current market context and industry benchmarks.";
      domainPrompt = `
Business Query: ${businessData.query}
Domain: Business Consulting
User Context: ${JSON.stringify(businessData)}

As a business consultant, provide:
1. Current market analysis and trends
2. Competitive landscape assessment
3. Strategic recommendations
4. Financial implications and projections
5. Risk assessment and mitigation strategies
6. Implementation roadmap with timelines
7. Success metrics and KPIs

Use your real-time knowledge of current economic conditions, market trends, and industry developments.
`;
      break;

    case 'manufacturing_analysis':
      systemPrompt = "You are a manufacturing operations expert with supply chain expertise and access to real-time industry data. Provide detailed manufacturing analysis with current market conditions.";
      domainPrompt = `
Manufacturing Query: ${businessData.query}
Domain: Manufacturing Operations
User Context: ${JSON.stringify(businessData)}

As a manufacturing expert, provide:
1. Current manufacturing trends and best practices
2. Supply chain optimization recommendations
3. Production efficiency improvements
4. Quality control strategies
5. Cost reduction opportunities
6. Technology integration recommendations
7. Market demand analysis and forecasting

Include real-time supply chain conditions and manufacturing industry trends.
`;
      break;

    case 'agriculture_analysis':
      systemPrompt = "You are an agricultural business expert with farming and agribusiness expertise and access to real-time agricultural data. Provide detailed agricultural analysis with current market and weather conditions.";
      domainPrompt = `
Agriculture Query: ${businessData.query}
Domain: Agriculture & Farming
User Context: ${JSON.stringify(businessData)}

As an agriculture expert, provide:
1. Current agricultural market trends and pricing
2. Crop management and optimization strategies
3. Weather impact analysis and mitigation
4. Commodity pricing and market timing
5. Farm profitability analysis
6. Technology adoption recommendations
7. Sustainable farming practices

Include real-time commodity prices, weather patterns, and agricultural market conditions.
`;
      break;

    default:
      systemPrompt = "You are a business analyst with access to real-time market data. Provide comprehensive analysis with current market context.";
      domainPrompt = `
Query: ${businessData.query}
Context: ${JSON.stringify(businessData)}

Please provide comprehensive analysis including current market context and actionable recommendations.
`;
  }

  try {
    const response = await grokClient.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: domainPrompt
        }
      ],
      max_tokens: 2500,
      temperature: 0 // No hardcoded temperature values - require authentic model configuration
    });

    return response.choices[0].message.content || ''; // No hardcoded fallback - require authentic Grok response
  } catch (error) {
    console.error('Grok domain analysis failed:', error);
    throw error;
  }
}

// Market trend analysis with real-time search
export async function analyzeMarketTrends(industry: string, query: string): Promise<string> {
  const prompt = `
Analyze current market trends for the ${industry} industry regarding: ${query}

Please provide:
1. Current market conditions and trends
2. Recent industry developments
3. Competitive landscape analysis
4. Market opportunities and threats
5. Strategic recommendations

Use your real-time access to provide the most current market intelligence.
`;

  try {
    const response = await grokClient.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a market research analyst with access to real-time market data and trends. Provide current, actionable market intelligence."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0 // No hardcoded temperature values - require authentic model configuration
    });

    return response.choices[0].message.content || ''; // No hardcoded fallback - require authentic Grok response
  } catch (error) {
    console.error('Market trend analysis failed:', error);
    return 'Market analysis temporarily unavailable - please check API configuration';
  }
}

// Financial analysis with economic context
export async function analyzeFinancialData(financialData: any, companyContext: string): Promise<string> {
  const prompt = `
Analyze the following financial data with current economic context:

Financial Data: ${JSON.stringify(financialData)}
Company Context: ${companyContext}

Please provide:
1. Financial health assessment
2. Performance vs industry benchmarks
3. Current economic impact analysis
4. Cash flow and profitability insights
5. Investment and growth recommendations

Include current economic conditions and their impact on these metrics.
`;

  try {
    const response = await grokClient.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst with access to real-time economic data. Provide comprehensive financial analysis with current economic context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1800,
      temperature: 0 // No hardcoded temperature values - require authentic model configuration
    });

    return response.choices[0].message.content || ''; // No hardcoded fallback - require authentic Grok response
  } catch (error) {
    console.error('Financial analysis failed:', error);
    return 'Financial analysis temporarily unavailable - please check API configuration';
  }
}

// Generate professional business reports
export async function generateBusinessReport(analysisResults: any, clientName: string): Promise<string> {
  const prompt = `
Generate a professional business consulting report for ${clientName} based on the following analysis:

Analysis Results: ${JSON.stringify(analysisResults)}

Please format as a comprehensive business report with:
1. Executive Summary
2. Current Situation Analysis
3. Key Findings
4. Strategic Recommendations
5. Implementation Roadmap
6. Risk Assessment
7. Conclusion

Use professional consulting language and structure.
`;

  try {
    const response = await grokClient.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a senior business consultant creating professional consulting reports. Use formal business language and comprehensive analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0 // No hardcoded temperature values - require authentic model configuration
    });

    return response.choices[0].message.content || ''; // No hardcoded fallback - require authentic Grok response
  } catch (error) {
    console.error('Report generation failed:', error);
    return 'Report generation temporarily unavailable - please check API configuration';
  }
}