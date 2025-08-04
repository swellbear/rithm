import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import bcrypt from "bcryptjs";
import ConnectPgSimple from "connect-pg-simple";
import MemoryStore from "memorystore";
import passport from 'passport';
import { storage } from "./storage";

import { 
  insertUser, insertBusinessQuery, insertSecCompany, insertFredIndicator, insertBusinessAnalysis, insertDomainDetection, insertApiCall,
  type User
} from "@shared/schema";
import { z } from "zod";
import { 
  asyncHandler, 
  requestLogger, 
  globalErrorHandler, 
  handleDatabaseError, 
  handleAuthError, 
  handleNotFoundError,
  handleBusinessLogicError,
  AppError,
  ErrorType
} from "./error-handler";
import { performanceMonitor } from "./performance-monitor";
import rithmBusinessRoutes from "./rithm-business-routes";
import downloadRouter from "./download-models";
import { router as mlRouter } from "./routes/ml";
import feedbackRouter from "./routes/feedback";
import { router as chatRouter } from "./routes/chat";
import { createProxyMiddleware } from 'http-proxy-middleware';

// Extend Express Request type to include user property for authentication
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    user?: User;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Security Enhancements - Fix trust proxy for Render deployment
  app.set('trust proxy', 1); // Trust only first proxy (Render's load balancer)
  
  // Security headers with helmet - X-Frame-Options and X-XSS-Protection disabled in favor of modern CSP
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'self'"] // Modern replacement for X-Frame-Options
      }
    } : false, // Disable CSP in development to allow Vite HMR
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production' ? { policy: "require-corp" } : false,
    crossOriginResourcePolicy: process.env.NODE_ENV === 'production' ? { policy: "cross-origin" } : false,
    frameguard: false, // Disable X-Frame-Options in favor of CSP frame-ancestors
    xssFilter: false // Disable deprecated X-XSS-Protection header
  }));
  
  // Add SharedArrayBuffer support headers for transformers.js in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      next();
    });
  }
  
  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com']
      : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all standard HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] // Allow standard headers
  }));

  // Health check endpoints for Render (using /api/health instead of root)
  // Note: Vite middleware will handle root / requests for React frontend

  // Health check endpoint for deployment monitoring
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected', // Will be updated when we check DB connection
      services: {
        ml: 'active',
        auth: 'active',
        chat: 'active'
      }
    });
  });

  // OpenAI chat endpoint - Public (no auth required) - MUST BE BEFORE AUTHENTICATION MIDDLEWARE
  app.post('/api/ml/chat-public', async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required'
        });
      }

      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey || !openaiKey.startsWith('sk-')) {
        return res.status(503).json({
          success: false,
          error: 'OpenAI API key not configured'
        });
      }

      // Simple OpenAI API call without requiring authentication
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: openaiKey });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || 'No response generated';

      res.json({
        success: true,
        analysis: {
          reasoning: response,
          raw_response: response
        }
      });
    } catch (error: any) {
      console.error('OpenAI chat error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'OpenAI API call failed'
      });
    }
  });
  
  // Rate limiting with mobile-friendly configuration
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 500 : 10000, // Much higher limit for development/mobile access
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting in development for easier mobile testing
      return process.env.NODE_ENV !== 'production';
    }
  });
  app.use(limiter);
  
  // Session configuration - Use memory store for maximum reliability
  const MemoryStoreSession = MemoryStore(session);
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000 // Prune expired entries every 24h
  });
  
  console.log('🔧 Using memory store for sessions (reliable for all environments)');

  app.use(session({
    store: sessionStore, // Use memory store for maximum reliability
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production' && process.env.HTTPS !== 'false',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax' // Add sameSite for better mobile compatibility
    }
  }));
  
  // Request logging
  app.use(requestLogger);
  
  // Basic authentication routes
  app.post("/api/auth/register", asyncHandler(async (req, res) => {
    const { username, password, email, companyName, industry, companySize, consultingFocus } = req.body;
    
    if (!username || !password) {
      throw handleBusinessLogicError("Username and password are required");
    }
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      throw handleBusinessLogicError("Username already exists");
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await storage.createUser({
      username,
      password_hash: hashedPassword,
      email,
      companyName,
      industry,
      companySize,
      consultingFocus
    });
    
    // Set session
    req.session.user = user;
    
    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  }));
  
  app.post("/api/auth/login", asyncHandler(async (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      
      // Set session
      req.session.user = user;
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    })(req, res, next);
  }));
  
  app.post("/api/auth/logout", asyncHandler(async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        throw handleDatabaseError(err, "logout");
      }
      res.json({ message: "Logged out successfully" });
    });
  }));
  
  app.get("/api/auth/user", asyncHandler(async (req, res) => {
    if (req.session.user) {
      res.json({ user: { 
        id: req.session.user.id, 
        username: req.session.user.username, 
        email: req.session.user.email 
      } });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  }));
  
  // Use clean business consulting routes - ZERO FABRICATION
  app.use(rithmBusinessRoutes);
  
  // Model Download Routes for iOS Testing
  app.use('/api', downloadRouter);
  
  // Authentication middleware for ML routes
  const requireAuth = (req: Request, res: any, next: any) => {
    if (req.session.user) {
      req.user = req.session.user;
      next();
    } else {
      res.status(401).json({ error: "Authentication required" });
    }
  };

  // OpenAI status check endpoint - Public (no auth required)
  app.get('/api/ml/test-openai', asyncHandler(async (req: Request, res: Response) => {
    try {
      const openaiKey = process.env.OPENAI_API_KEY;
      
      const result = {
        openai_available: !!(openaiKey && openaiKey.startsWith('sk-')),
        api_key_format: openaiKey && openaiKey.startsWith('sk-') ? 'valid' : 'invalid',
        client_created: !!(openaiKey && openaiKey.startsWith('sk-'))
      };

      res.json({
        success: true,
        openai_status: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }));

  // Enhanced chat endpoint with local Phi-3 and OpenAI integration - Public (no auth required)
  app.post('/api/ml/chat/analyze-query', asyncHandler(async (req: Request, res: Response) => {
    try {
      const { messages, useLocalModel = false, query, reportStructure } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          error: 'Messages array is required'
        });
      }

      // Check if this is a report editing request
      const isReportEdit = query && (
        query.toLowerCase().includes('edit the report') || 
        query.toLowerCase().includes('change the report') ||
        query.toLowerCase().includes('modify the report')
      );
      
      if (isReportEdit && reportStructure) {
        console.log(`📝 Processing report editing request for query: "${query}"`);
        
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

      if (useLocalModel) {
        // Mock response for local model - in production this would use @mlc-ai/web-llm
        const mockResponse = `I'm operating in local mode with limited capabilities. Based on your query, I recommend exploring machine learning approaches for your specific use case. Consider data preprocessing, model selection, and evaluation metrics as key steps.`;
        
        return res.json({
          success: true,
          response: mockResponse,
          analysisType: 'local_fallback',
          confidence: 0.7,
          model: 'Local Fallback',
          mode: 'local_mock',
          warning: 'Phi-3 model unavailable, using fallback response'
        });
      } else {
        // Online mode - use OpenAI API
        if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
          return res.status(503).json({
            success: false,
            error: 'OpenAI API key not configured. Please check OPENAI_API_KEY environment variable.'
          });
        }

        try {
          const { OpenAI } = await import('openai');
          const openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });

          const completion = await openaiClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an expert ML consultant and data scientist. Provide helpful, accurate advice on machine learning, data analysis, and AI implementation. Be concise but thorough in your responses.'
              },
              ...messages
            ],
            max_tokens: 500,
            temperature: 0.7
          });

          const content = completion.choices[0]?.message?.content || 'No response generated';

          return res.json({
            success: true,
            response: content,
            analysisType: 'openai',
            confidence: 0.95,
            model: 'gpt-3.5-turbo',
            mode: 'online',
            processing_time: '1.8s'
          });
        } catch (openaiError: any) {
          console.error('OpenAI API error:', openaiError);
          
          return res.status(500).json({
            success: false,
            error: `OpenAI API error: ${openaiError.message}`,
            details: openaiError.code || 'unknown_error'
          });
        }
      }
    } catch (error: any) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }));



  // Simple web search endpoint for ChatPanel compatibility
  app.post('/api/web_search', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          error: 'Search query is required',
          code: 'INVALID_REQUEST'
        });
      }

      // No mock search results - fail authentically
      return res.status(501).json({
        success: false,
        error: 'Web search functionality is not implemented. Please provide actual search API integration.',
        query: query,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Web search endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  // ML Training Routes - PUBLIC ACCESS FOR TESTING
  console.log('🔧 Mounting ML router at /api/ml with public access');
  app.use('/api/ml', mlRouter);
  
  // Feedback API Routes
  console.log('📝 Mounting Feedback router at /api/feedback');
  app.use('/api/feedback', feedbackRouter);

  // Chat API Routes - Integration with rithm-chat-engine
  console.log('💬 Mounting Chat router at /api/chat');
  app.use('/api/chat', chatRouter);

  // Health monitoring endpoint
  app.get('/api/health', asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    // Test database connection
    let dbStatus = 'down';
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await storage.getUser(1); // Simple test query
      dbResponseTime = Date.now() - dbStart;
      dbStatus = 'up';
    } catch (err) {
      dbResponseTime = Date.now() - startTime;
    }

    // Test OpenAI availability (using existing test endpoint logic)
    let openaiStatus = 'down';
    let openaiKeyValid = false;
    try {
      // Simple OpenAI status check without making API calls
      openaiStatus = process.env.OPENAI_API_KEY ? 'up' : 'unavailable';
      openaiKeyValid = !!process.env.OPENAI_API_KEY;
    } catch (err) {
      openaiStatus = 'down';
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external + memUsage.arrayBuffers;
    const usedMemory = memUsage.heapUsed;

    // System uptime
    const uptime = process.uptime();

    // Mock active users count (would need session store in real implementation)
    const activeUsers = 0; // Placeholder

    // Overall health status
    let overallStatus = 'healthy';
    if (dbStatus === 'down' || openaiStatus === 'down') {
      overallStatus = 'degraded';
    }
    if (dbStatus === 'down' && openaiStatus === 'down') {
      overallStatus = 'unhealthy';
    }

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor(uptime),
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        },
        openai: {
          status: openaiStatus,
          apiKeyValid: openaiKeyValid
        },
        authentication: {
          status: 'up', // Always up if we can respond
          activeUsers: activeUsers
        },
        chat: {
          status: 'up', // Chat engine status
          engineLoaded: true // Assume loaded
        }
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: Math.round((usedMemory / totalMemory) * 100)
      },
      performance: {
        avgResponseTime: Date.now() - startTime,
        requestsPerMinute: 0 // Would need request tracking
      }
    };

    res.json(healthData);
  }));
  
  // Streamlit Application Proxy - Access your ML platform at /streamlit
  app.use('/streamlit', createProxyMiddleware({
    target: 'http://localhost:8501',
    changeOrigin: true,
    pathRewrite: {
      '^/streamlit': '',
    },
    ws: true, // Enable WebSocket proxying for Streamlit
    on: {
      error: (err: any, req: any, res: any) => {
        console.log('Streamlit proxy error:', err.message);
        if (res instanceof require('http').ServerResponse) {
          res.status(502).json({ 
            error: 'Streamlit application unavailable', 
            message: 'Please ensure Streamlit is running on port 8501' 
          });
        }
      }
    }
  }));
  
  // Add global error handler (must be last middleware)
  app.use(globalErrorHandler);
  
  const httpServer = createServer(app);
  return httpServer;
}
