import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as feedbackSchema from "@shared/feedback-schema";

neonConfig.webSocketConstructor = ws;

let feedbackPool: Pool | null = null;
let feedbackDb: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not found - feedback features will be disabled");
} else {
  feedbackPool = new Pool({ connectionString: process.env.DATABASE_URL });
  feedbackDb = drizzle({ client: feedbackPool, schema: feedbackSchema });
}

export { feedbackPool, feedbackDb };
