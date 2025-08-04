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
  // PRODUCTION FIX: Serve static files from dist directory (Vite build output)
  const distPath = path.join(process.cwd(), 'dist');
  const publicPath = path.join(process.cwd(), 'public');
  
  // Primary: Serve from dist directory (Vite build output)
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    log(`✅ Serving static files from ${distPath}`);
  } else if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    log(`⚠️  Fallback: Serving static files from ${publicPath}`);
  }

  // Catch-all handler for SPA routing - MUST be very specific to avoid capturing API routes
  app.get("*", (req, res, next) => {
    // Skip ALL API routes - more comprehensive check
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }

    // Try dist/index.html first, then public/index.html
    const distIndexPath = path.join(distPath, 'index.html');
    const publicIndexPath = path.join(publicPath, 'index.html');
    
    if (fs.existsSync(distIndexPath)) {
      res.sendFile(distIndexPath);
    } else if (fs.existsSync(publicIndexPath)) {
      res.sendFile(publicIndexPath);
    } else {
      // PRODUCTION FIX: Return structured JSON error instead of plain text
      res.status(404).json({
        error: 'Frontend application not built',
        message: 'The client build is missing. Run `npm run build` to generate the frontend.',
        timestamp: new Date().toISOString(),
        paths_checked: [distIndexPath, publicIndexPath]
      });
    }
  });
}
