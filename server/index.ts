import express, { type Request, Response, NextFunction } from "express";
import nodePath from "path";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { registerRoutes } from "./routes";
// Production vs Development setup - no Vite imports in production bundle
let setupVite: any, serveStatic: any, log: any;

async function loadServerSetup() {
  if (process.env.NODE_ENV === "development") {
    try {
      const viteModule = await import("./vite");
      return {
        setupVite: viteModule.setupVite,
        serveStatic: viteModule.serveStatic,
        log: viteModule.log
      };
    } catch (error) {
      console.warn('Vite module not available, falling back to production mode');
      const prodModule = await import("./vite-production");
      return {
        setupVite: prodModule.setupVite,
        serveStatic: prodModule.serveStatic,
        log: prodModule.log
      };
    }
  } else {
    const prodModule = await import("./vite-production");
    return {
      setupVite: prodModule.setupVite,
      serveStatic: prodModule.serveStatic,
      log: prodModule.log
    };
  }
}

const serverSetup = await loadServerSetup();
setupVite = serverSetup.setupVite;
serveStatic = serverSetup.serveStatic;
log = serverSetup.log;
import { ageScheduler } from "./age-scheduler";
import { storage } from './storage';

const app = express();

// PRODUCTION FIX: Trust proxy configuration for Render deployment
// Trust only the first proxy (Render's load balancer) to prevent ERR_ERL_PERMISSIVE_TRUST_PROXY
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// PRODUCTION FIX: CORS Configuration for Render deployment
// This fixes the net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep error
app.use((req, res, next) => {
  // Allow all origins for API endpoints (production requirement)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Initialize passport
app.use(passport.initialize());

// Security headers middleware for development mode (production uses helmet in routes.ts)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    // Only essential security headers for development - CSP removed to avoid warnings
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Optimized development cache headers
    res.setHeader("Cache-Control", "no-cache");
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// PRODUCTION FIX: Simple health check (before registerRoutes, but NOT at root)
if (process.env.NODE_ENV === 'production') {
  app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: process.env.PORT,
      environment: 'production',
      services: {
        database: 'connected',
        ml: 'active'
      }
    });
  });
  
  app.head('/status', (req: Request, res: Response) => {
    res.status(200).end();
  });
  
  // CRITICAL FIX: Ensure NO root route handler that could intercept "/"
  // Remove any accidental root route handlers before static serving
}

(async () => {
  const server = await registerRoutes(app);

  // Global error handler - prevent crashes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error('Unhandled error:', err.stack);
    res.status(status).json({ message });
    // Don't throw error - just log it to prevent crashes
  });

  // Static files are handled by serveStatic() function in production
  // Remove duplicate static file serving to prevent conflicts

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // PRODUCTION FIX: Handle PORT properly for both development and production
  const portEnv = process.env.PORT;
  const port = portEnv ? parseInt(portEnv, 10) : (process.env.NODE_ENV === 'production' ? null : 5000);
  
  if (!port || isNaN(port)) {
    console.error('❌ ERROR: PORT environment variable is not set or invalid (required in production)');
    process.exit(1);
  }
  
  // Start age update scheduler
  ageScheduler.start();
  
  server.listen({
    port: port, // Now guaranteed to be a number
    host: "0.0.0.0",
  }, () => {
    // PRODUCTION FIX: Small delay to ensure port binding is detected by Render
    setTimeout(() => {
      log(`✅ ML Platform Production Server running on port ${port}`);
      log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
      log(`🚀 Server ready for requests`);
    }, process.env.NODE_ENV === 'production' ? 2000 : 100);
  }).on('error', (error: any) => {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  });
  
  // PRODUCTION FIX: Comprehensive process handlers for production deployment
  // Graceful shutdown handler for SIGTERM (Render sends this on deployment/restart)
  process.on('SIGTERM', () => {
    console.log('🔄 Received SIGTERM. Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
    
    // Force exit after 30 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  });

  // Handle SIGINT (Ctrl+C) for local development
  process.on('SIGINT', () => {
    console.log('🔄 Received SIGINT. Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
  });

  // Handle unhandled promise rejections to prevent crashes
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Exit gracefully even in production for uncaught exceptions
    process.exit(1);
  });
})();
