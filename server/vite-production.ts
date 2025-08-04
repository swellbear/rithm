import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: any) {
  // In production, we don't need Vite middleware
  // Static files are served directly
}

export function serveStatic(app: Express) {
  // Serve static files from the public directory
  const publicPath = path.join(process.cwd(), 'public');
  
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    log(`Serving static files from ${publicPath}`);
  }

  // Catch-all handler for SPA routing - MUST be very specific to avoid capturing API routes
  app.get("*", (req, res, next) => {
    // Skip ALL API routes - more comprehensive check
    if (req.path.startsWith('/api')) {
      return next();
    }

    const indexPath = path.join(publicPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built');
    }
  });
}