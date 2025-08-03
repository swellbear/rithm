import express, { type Request, Response, NextFunction } from "express";
import nodePath from "path";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { registerRoutes } from "./routes";
import { ageScheduler } from "./age-scheduler";
import { storage } from './storage';

// Dynamic import function to handle Vite modules
async function loadViteModule() {
  if (process.env.NODE_ENV === "development") {
    const viteModule = await import("./vite");
    return {
      setupVite: viteModule.setupVite,
      serveStatic: viteModule.serveStatic,
      log: viteModule.log
    };
  } else {
    const prodModule = await import("./vite-production");
    return {
      setupVite: prodModule.setupVite,
      serveStatic: prodModule.serveStatic,
      log: prodModule.log
    };
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

// Main startup function
async function startServer() {
  try {
    // Load appropriate Vite module
    const { setupVite, serveStatic, log } = await loadViteModule();
    
    // Setup Vite/static serving
    setupVite(app);
    
    // Register all routes
    registerRoutes(app);
    
    // Setup static file serving (must be after routes)
    serveStatic(app);
    
    // Start age scheduler
    ageScheduler.start();
    
    const port = process.env.PORT || 5000;
    app.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
    
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Add Cache-Control headers for static assets in production
  if (app.get("env") !== "development") {
    // Serve static files with cache headers for better performance
    const distPath = nodePath.resolve(import.meta.dirname, "public");
    
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        // Optimized production cache strategy
        if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.png') || 
            filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.gif') || 
            filePath.endsWith('.svg') || filePath.endsWith('.ico') || filePath.endsWith('.woff') || 
            filePath.endsWith('.woff2') || filePath.endsWith('.ttf')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year with immutable
        } else {
          // HTML and other files with shorter cache
          res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
        }
      }
    }));
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  // Health check endpoint for container monitoring  
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV 
    });
  });

  // Start age update scheduler
  ageScheduler.start();
  
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  }).on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Trying to find an available port...`);
      // Try alternative ports
      const altPort = port + 1;
      server.listen({
        port: altPort,
        host: "0.0.0.0",
      }, () => {
        log(`serving on port ${altPort} (port ${port} was busy)`);
      }).on('error', (altError: any) => {
        console.error(`Failed to start server on ports ${port} and ${altPort}:`, altError);
        process.exit(1);
      });
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
})();
