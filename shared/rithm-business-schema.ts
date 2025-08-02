import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * RITHM ASSOCIATE - BUSINESS CONSULTING SCHEMA
 * 
 * ZERO FABRICATION - All data structures designed for authentic public data sources:
 * - SEC EDGAR Database
 * - FRED Economic Data API
 * - Bureau of Labor Statistics
 * - Bureau of Economic Analysis
 * - World Bank Business Data
 */

// Core users table - simplified for business consulting
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  companyName: text("company_name"),
  industry: text("industry"),
  companySize: text("company_size"), // small, medium, large, enterprise
  consultingFocus: text("consulting_focus").array(), // financial, operational, strategic, market
  subscriptionTier: text("subscription_tier").default("basic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Business data queries - track what users ask about
export const businessQueries = pgTable("business_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  queryText: text("query_text").notNull(),
  detectedDomain: text("detected_domain"), // business_consulting, manufacturing, agriculture
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  queryType: text("query_type"), // financial_analysis, market_research, competitive_analysis
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SEC EDGAR company data - authentic public company information
export const secCompanies = pgTable("sec_companies", {
  id: serial("id").primaryKey(),
  cik: text("cik").unique().notNull(), // SEC Central Index Key
  companyName: text("company_name").notNull(),
  ticker: text("ticker"),
  sic: text("sic"), // Standard Industrial Classification
  industry: text("industry"),
  sector: text("sector"),
  filingDate: timestamp("filing_date"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// FRED Economic indicators - authentic Federal Reserve data
export const fredIndicators = pgTable("fred_indicators", {
  id: serial("id").primaryKey(),
  seriesId: text("series_id").unique().notNull(), // FRED series ID
  title: text("title").notNull(),
  category: text("category"),
  value: decimal("value", { precision: 15, scale: 6 }),
  date: timestamp("date").notNull(),
  units: text("units"),
  frequency: text("frequency"), // daily, weekly, monthly, quarterly, annual
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Business analysis results - authentic calculations only
export const businessAnalysis = pgTable("business_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  queryId: integer("query_id").references(() => businessQueries.id),
  analysisType: text("analysis_type").notNull(), // financial_health, industry_benchmark, risk_assessment
  dataSource: text("data_source").notNull(), // sec_edgar, fred_api, bls_data
  results: jsonb("results").notNull(), // JSON with authentic calculation results
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  dataPoints: integer("data_points"), // number of authentic data points used
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Domain detection training - track accuracy improvements
export const domainDetection = pgTable("domain_detection", {
  id: serial("id").primaryKey(),
  queryText: text("query_text").notNull(),
  actualDomain: text("actual_domain"), // confirmed by user feedback
  predictedDomain: text("predicted_domain"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  wasCorrect: boolean("was_correct"),
  userFeedback: text("user_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API call tracking - monitor authentic data source usage
export const apiCalls = pgTable("api_calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  service: text("service").notNull(), // sec_edgar, fred_api, bls_api, world_bank
  endpoint: text("endpoint"),
  statusCode: integer("status_code"),
  responseTime: integer("response_time_ms"),
  dataRetrieved: boolean("data_retrieved").default(false),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUser = createInsertSchema(users);
export const insertBusinessQuery = createInsertSchema(businessQueries);
export const insertSecCompany = createInsertSchema(secCompanies);
export const insertFredIndicator = createInsertSchema(fredIndicators);
export const insertBusinessAnalysis = createInsertSchema(businessAnalysis);
export const insertDomainDetection = createInsertSchema(domainDetection);
export const insertApiCall = createInsertSchema(apiCalls);

// Types
export type User = typeof users.$inferSelect;
export type BusinessQuery = typeof businessQueries.$inferSelect;
export type SecCompany = typeof secCompanies.$inferSelect;
export type FredIndicator = typeof fredIndicators.$inferSelect;
export type BusinessAnalysis = typeof businessAnalysis.$inferSelect;
export type DomainDetection = typeof domainDetection.$inferSelect;
export type ApiCall = typeof apiCalls.$inferSelect;

export type InsertUser = z.infer<typeof insertUser>;
export type InsertBusinessQuery = z.infer<typeof insertBusinessQuery>;
export type InsertSecCompany = z.infer<typeof insertSecCompany>;
export type InsertFredIndicator = z.infer<typeof insertFredIndicator>;
export type InsertBusinessAnalysis = z.infer<typeof insertBusinessAnalysis>;
export type InsertDomainDetection = z.infer<typeof insertDomainDetection>;
export type InsertApiCall = z.infer<typeof insertApiCall>;