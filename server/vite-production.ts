import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function log(...args: any[]) {
  console.log(`[production]`, ...args);
}

export function setupVite(app: express.Application) {
  // In production, serve static files from dist/public directory (where Vite builds to)
  const distPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(distPath));
  
  log("Production static files served from:", distPath);
}

export function serveStatic(app: express.Application) {
  // Serve the built React app for all non-API routes
  const distPath = path.resolve(__dirname, "../dist/public");
  
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }
    
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.join(distPath, "index.html"));
  });
  
  log("SPA routing configured for production");
}
