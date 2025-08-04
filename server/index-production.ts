import express, { type Request, Response, NextFunction } from "express";
import nodePath from "path";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { registerRoutes } from "./routes";
// Production-only imports - NO VITE REFERENCES
import { setupVite, serveStatic, log } from "./vite-production";
import { ageScheduler } from "./age-scheduler";
import { storage } from './storage';

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

// Security headers middleware for production
app.use((req, res, next) => {
  // Production security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(this, bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(
        `${req.method} ${path} ${res.statusCode} in ${duration}ms :: ${JSON.stringify(capturedJsonResponse || {}).substring(0, 100)}...`
      );
    }
  });

  next();
});

// Register API routes BEFORE static middleware
registerRoutes(app);

// Initialize server
const server = app.listen(Number(process.env.PORT) || 5000, "0.0.0.0", async () => {
  log(`serving on port ${process.env.PORT || 5000}`);
  
  // Start age scheduler
  ageScheduler.start();
  log("Age scheduler started");
  
  // Setup production static serving
  await setupVite(app, server);
  serveStatic(app);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  ageScheduler.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  ageScheduler.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});