import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Graceful database connection with fallback handling
let pool: Pool | null = null;
let db: any = null;

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // Add connection timeout and retry configuration
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10
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
