import express, { type Request, Response, NextFunction } from "express";
import nodePath from "path";
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { registerRoutes } from "./routes";
import { serveStatic, setupVite, log } from "./vite-production";
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
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "public, max-age=3600");
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
        `${req.method} ${path} ${res.statusCode} in ${duration}ms :: ${capturedJsonResponse ? JSON.stringify(capturedJsonResponse).substring(0, 80) + "…" : res.get("content-length") || 0}b`,
      );
    }
  });

  next();
});

(async () => {
  const server = app.listen();
  registerRoutes(app);
  await setupVite(app, server);
  serveStatic(app);

  // Start age scheduler
  ageScheduler.start();

  const PORT = parseInt(process.env.PORT || "5000", 10);
  let currentPort = PORT;

  const tryListen = (port: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const testServer = app.listen(port, "0.0.0.0")
        .on("listening", () => {
          testServer.close();
          resolve();
        })
        .on("error", (err: any) => {
          if (err.code === "EADDRINUSE") {
            reject(err);
          } else {
            reject(err);
          }
        });
    });
  };

  // Find available port
  while (currentPort < PORT + 10) {
    try {
      await tryListen(currentPort);
      break;
    } catch (err) {
      if ((err as any).code === "EADDRINUSE") {
        log(`Port ${currentPort} is already in use. Trying to find an available port...`);
        currentPort++;
      } else {
        throw err;
      }
    }
  }

  server.close();
  
  app.listen(currentPort, "0.0.0.0", () => {
    log(`serving on port ${currentPort}`);
    if (currentPort !== PORT) {
      log(`serving on port ${currentPort} (port ${PORT} was busy)`);
    }
  });

  process.on("SIGTERM", () => {
    log("SIGTERM received, shutting down gracefully");
    server.close(() => {
      log("Process terminated");
      process.exit(0);
    });
  });
})();