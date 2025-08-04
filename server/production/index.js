import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      workerSrc: ["'self'", "blob:"],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Session configuration
const pgSession = ConnectPgSimple(session);

app.use(session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'ml-platform-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // Database user authentication logic here
    // For now, simple check for demo
    if (username === 'admin' && password === 'admin') {
      return done(null, { id: 1, username: 'admin' });
    }
    return done(null, false, { message: 'Invalid credentials' });
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Fetch user from database by id
    const user = { id: 1, username: 'admin' };
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// ML API Routes
app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

app.get('/api/auth/user', requireAuth, (req, res) => {
  res.json(req.user);
});

// ML Training endpoint
app.post('/api/ml/train', requireAuth, async (req, res) => {
  try {
    const { data, algorithm, targetColumn } = req.body;
    
    // Real ML training implementation
    const result = await trainModel(data, algorithm, targetColumn);
    
    res.json({
      success: true,
      results: result
    });
  } catch (error) {
    console.error('ML Training Error:', error);
    res.status(500).json({ 
      error: 'Training failed',
      details: error.message 
    });
  }
});

// Data generation endpoint
app.post('/api/ml/generate-data', requireAuth, async (req, res) => {
  try {
    const { domain, sampleSize, useRealData } = req.body;
    
    if (!useRealData) {
      return res.status(400).json({
        error: 'Only authentic data sources are supported'
      });
    }
    
    const data = await generateAuthenticData(domain, sampleSize);
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Data Generation Error:', error);
    res.status(500).json({ 
      error: 'Data generation failed',
      details: error.message 
    });
  }
});

// Report generation endpoint
app.post('/api/ml/generate-report', requireAuth, async (req, res) => {
  try {
    const { trainingResults, format } = req.body;
    
    const report = await generateReport(trainingResults, format);
    
    res.json({
      success: true,
      blob: report.blob,
      structure: report.structure,
      format: format
    });
  } catch (error) {
    console.error('Report Generation Error:', error);
    res.status(500).json({ 
      error: 'Report generation failed',
      details: error.message 
    });
  }
});

// Chat analysis endpoint
app.post('/api/chat/analyze-query', requireAuth, async (req, res) => {
  try {
    const { message, useLocalModel } = req.body;
    
    const response = await analyzeQuery(message, useLocalModel);
    
    res.json({
      success: true,
      response: response.text,
      analysisType: response.type,
      confidence: response.confidence
    });
  } catch (error) {
    console.error('Chat Analysis Error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
});

// Serve static files from dist/public
app.use(express.static(join(__dirname, 'public')));

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// These will be moved to the top after all other code
let mlEngine, dataEngine;

// ML Implementation Functions
async function trainModel(data, algorithm, targetColumn) {
  if (!mlEngine) {
    throw new Error('ML engine not initialized - Python components required');
  }
  
  try {
    const result = await mlEngine.trainModel(data, algorithm, targetColumn);
    return result;
  } catch (error) {
    throw new Error(`ML training failed: ${error.message}`);
  }
}

async function generateAuthenticData(domain, sampleSize) {
  if (!dataEngine) {
    throw new Error('Data engine not initialized - API keys required');
  }
  
  try {
    return await dataEngine.getEconomicData(domain, sampleSize);
  } catch (error) {
    throw new Error(`Authentic data generation failed: ${error.message}`);
  }
}

async function generateReport(trainingResults, format) {
  // Implement real report generation
  // This should create actual documents
  
  return {
    blob: '', // Real document generation needed
    structure: {
      title: 'ML Analysis Report',
      sections: [],
      metadata: {
        generated: new Date().toISOString(),
        format: format
      }
    }
  };
}

async function analyzeQuery(message, useLocalModel) {
  // Implement real query analysis
  // This should use actual NLP processing
  
  return {
    text: 'Query analysis not implemented - real NLP processing needed',
    type: 'general',
    confidence: 0.0
  };
}

// Initialize ML components
async function initializeMLComponents() {
  try {
    const { MLIntegration } = await import('./ml-integration.js');
    const { AuthenticDataSources } = await import('./authentic-data-sources.js');
    
    mlEngine = new MLIntegration();
    dataEngine = new AuthenticDataSources();
    
    console.log('✅ ML components initialized');
  } catch (error) {
    console.error('❌ Failed to initialize ML components:', error.message);
    console.log('📋 ML endpoints will return errors until components are available');
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 ML Platform Production Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  
  await initializeMLComponents();
});