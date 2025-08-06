import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let db: any = null;

try {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 10,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
