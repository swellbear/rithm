import { Router } from 'express';
import OpenAI from 'openai';
import { 
  asyncHandler, 
  handleBusinessLogicError 
} from '../error-handler';

export const router = Router();

// Chat Analysis Route - OpenAI ChatGPT Integration with report editing capability
router.post('/analyze-query', asyncHandler(async (req, res) => {
  const { query, messages = [], useLocalModel = false, reportStructure } = req.body;
  
  if (!query || typeof query !== 'string') {
    throw handleBusinessLogicError("Query is required and must be a string");
  }

  console.log(`💬 Processing chat query: "${query.substring(0, 50)}..." (useLocalModel: ${useLocalModel})`);
  console.log(`🔑 OpenAI API Key available: ${!!process.env.OPENAI_API_KEY}`);
  
  // Check if this is a report editing request
  const isReportEdit = query.toLowerCase().includes('edit the report') || 
                      query.toLowerCase().includes('change the report') ||
                      query.toLowerCase().includes('modify the report');
  
  if (isReportEdit && reportStructure) {
    console.log(`📝 Processing report editing request...`);
    
    // Parse the editing instruction
    let modifiedStructure = JSON.parse(JSON.stringify(reportStructure));
    
    // Handle heading changes
    if (query.toLowerCase().includes('heading') || query.toLowerCase().includes('title')) {
      const match = query.match(/(?:heading|title).*?(?:to|:)\s*["']?([^"']+)["']?/i);
      if (match && match[1]) {
        const newHeading = match[1].trim();
        // Update the first heading in the structure
        if (modifiedStructure.sections && modifiedStructure.sections.length > 0) {
          const firstSection = modifiedStructure.sections[0];
          if (firstSection.type === 'heading') {
            firstSection.content = newHeading;
          } else {
            // Insert new heading at the beginning
            modifiedStructure.sections.unshift({
              type: 'heading',
              content: newHeading,
              level: 1
            });
          }
        }
        
        console.log(`✅ Updated report heading to: "${newHeading}"`);
        
        return res.json({
          success: true,
          response: `Report updated successfully! Changed the heading to "${newHeading}".`,
          reportEdited: true,
          modifiedStructure: modifiedStructure,
          editType: 'heading_change',
          analysisType: 'Report Editor',
          confidence: 1.0,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Handle other report edits (content, sections, etc.)
    // Add more editing logic here as needed
    
    console.log(`ℹ️ Report edit request recognized but no specific changes made`);
  }

  // Try OpenAI ChatGPT first if not using local model and API key is available
  if (!useLocalModel && process.env.OPENAI_API_KEY) {
    console.log(`🚀 Attempting OpenAI ChatGPT call...`);
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: 'system',
            content: 'You are an expert ML consultant and data scientist. Provide helpful, accurate advice on machine learning, data analysis, and AI implementation. Be concise but thorough in your responses.'
          },
          ...messages,
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = completion.choices[0]?.message?.content || 'No response generated';

      console.log(`✅ OpenAI response generated successfully`);

      return res.json({
        success: true,
        response: content,
        suggestedActions: [
          "Upload data for analysis", 
          "Ask follow-up questions", 
          "Request specific ML guidance"
        ],
        requiredData: [],
        analysisType: 'OpenAI ChatGPT',
        confidence: 0.95,
        canUseFrameworks: true,
        followUpQuestions: [],
        model: 'gpt-4o',
        mode: 'online',
        timestamp: new Date().toISOString()
      });

    } catch (openaiError: any) {
      console.error('❌ OpenAI API error:', openaiError);
      // Fall through to local engine fallback
    }
  }

  // Fallback to local rithm-chat-engine or offline response
  try {
    // Dynamic import to handle potential issues with rithm-chat-engine
    const { RithmChatEngine } = await import('../rithm-chat-engine');
    const chatEngine = new RithmChatEngine();
    
    // Parse the query using rithm-chat-engine
    const parsedQuery = chatEngine.parseQuery(query);
    
    // Generate response using parsed query
    const response = chatEngine.generateResponse(query, parsedQuery);
    
    console.log(`✅ Local chat engine response generated`);
    
    // Return comprehensive response structure
    res.json({
      success: true,
      response: response.response,
      suggestedActions: response.suggestedActions || [],
      requiredData: response.requiredData || [],
      analysisType: response.analysisType || 'Local Engine',
      confidence: response.confidence || 0.8,
      canUseFrameworks: response.canUseFrameworks || false,
      followUpQuestions: response.followUpQuestions || [],
      mode: 'offline',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('🚨 Chat engine error:', error);
    
    // Final fallback response
    res.json({
      success: true,
      response: "I'm here to help with your ML and data analysis questions. Please describe what you'd like to analyze or ask about.",
      suggestedActions: [
        "Upload data for analysis", 
        "Ask about ML models", 
        "Request data insights",
        "Explore mathematical frameworks"
      ],
      requiredData: [],
      analysisType: "Fallback Response",
      confidence: 0.8,
      canUseFrameworks: false,
      followUpQuestions: [
        "What type of data analysis are you interested in?", 
        "Do you have specific ML questions?",
        "Would you like to explore advanced mathematical frameworks?"
      ],
      mode: 'fallback',
      timestamp: new Date().toISOString()
    });
  }
}));

// Health check for chat functionality
router.get('/health', asyncHandler(async (req, res) => {
  try {
    // Test rithm-chat-engine availability
    const { RithmChatEngine } = await import('../rithm-chat-engine');
    const chatEngine = new RithmChatEngine();
    
    // Quick test query
    const testQuery = chatEngine.parseQuery("test");
    
    res.json({
      success: true,
      status: 'healthy',
      chatEngineAvailable: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: true,
      status: 'degraded',
      chatEngineAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}));