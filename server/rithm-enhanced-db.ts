import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig } from "@neondatabase/serverless";
import * as rithmEnhancedSchema from "../shared/rithm-enhanced-schema";

// Configure Neon for enhanced Rithm system
neonConfig.fetchConnectionCache = true;

// Enhanced Rithm system database URL (can be same as main or separate)
const RITHM_ENHANCED_DATABASE_URL = process.env.RITHM_ENHANCED_DATABASE_URL || process.env.DATABASE_URL;

if (!RITHM_ENHANCED_DATABASE_URL) {
  throw new Error("RITHM_ENHANCED_DATABASE_URL or DATABASE_URL environment variable is required");
}

// Create database instance for enhanced Rithm system
export const rithmEnhancedDb = drizzle(RITHM_ENHANCED_DATABASE_URL, {
  schema: rithmEnhancedSchema,
});

export type RithmEnhancedDatabase = typeof rithmEnhancedDb;