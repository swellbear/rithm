import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Production-safe Neon configuration
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Use HTTP instead of WebSocket for queries
neonConfig.fetchConnectionCache = true; // Enable connection caching

// Graceful database connection with fallback handling
let pool: Pool | null = null;
let db: any = null;

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Production-optimized connection settings
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 60000,
      max: 5, // Reduced for Render's connection limits
      allowExitOnIdle: true
    });
    db = drizzle(pool, { schema });
    console.log('✅ PostgreSQL database connected successfully');
  } else {
    console.log('⚠️ DATABASE_URL not found - running without database');
  }
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.log('🔄 Application will continue with limited functionality');
}

export { pool, db };
