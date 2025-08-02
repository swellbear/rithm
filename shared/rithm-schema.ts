import { pgTable, serial, text, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Rithm Business Consultation Sessions
export const rithmSessions = pgTable("rithm_sessions", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  sessionType: text("session_type").notNull(), // 'business_optimization', 'strategic_planning', 'risk_assessment'
  industry: text("industry"),
  businessMetrics: jsonb("business_metrics"), // Store structured business data
  analysisFrameworks: jsonb("analysis_frameworks"), // VAR, SEM, convergence settings
  sessionStatus: text("session_status").default("active"), // 'active', 'processing', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Mathematical Analysis Results
export const rithmAnalysisResults = pgTable("rithm_analysis_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => rithmSessions.id),
  frameworkType: text("framework_type").notNull(), // 'VAR', 'SEM', 'convergence_prediction'
  analysisData: jsonb("analysis_data"), // Raw mathematical results
  confidenceScore: real("confidence_score"), // Mathematical confidence (0-100)
  validationMetrics: jsonb("validation_metrics"), // R² scores, error rates, etc.
  businessInsights: jsonb("business_insights"), // Translated business implications
  recommendationsGenerated: jsonb("recommendations_generated"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow()
});

// Economic Data Cache (FRED API results)
export const rithmEconomicData = pgTable("rithm_economic_data", {
  id: serial("id").primaryKey(),
  datasetId: text("dataset_id").notNull(), // FRED dataset identifier
  seriesName: text("series_name").notNull(),
  dataPoints: jsonb("data_points"), // Time series data
  lastUpdated: timestamp("last_updated").defaultNow(),
  dataSource: text("data_source").default("FRED"),
  validationStatus: text("validation_status").default("validated")
});

// Business Comparative Analysis
export const rithmComparativeAnalysis = pgTable("rithm_comparative_analysis", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => rithmSessions.id),
  traditionalMethodResult: jsonb("traditional_method_result"),
  rithmMethodResult: jsonb("rithm_method_result"),
  improvementMetrics: jsonb("improvement_metrics"), // % improvement, accuracy gains
  confidenceComparison: jsonb("confidence_comparison"),
  businessValueQuantification: jsonb("business_value_quantification"),
  createdAt: timestamp("created_at").defaultNow()
});

// Client Business Profiles
export const rithmClientProfiles = pgTable("rithm_client_profiles", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  industry: text("industry"),
  companySize: text("company_size"), // 'startup', 'mid_market', 'enterprise'
  businessChallenges: jsonb("business_challenges"),
  historicalPerformance: jsonb("historical_performance"),
  rithmEngagementHistory: jsonb("rithm_engagement_history"),
  preferredFrameworks: jsonb("preferred_frameworks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Export types
export type RithmSession = typeof rithmSessions.$inferSelect;
export type InsertRithmSession = z.infer<typeof insertRithmSessionSchema>;

export type RithmAnalysisResult = typeof rithmAnalysisResults.$inferSelect;
export type InsertRithmAnalysisResult = z.infer<typeof insertRithmAnalysisResultSchema>;

export type RithmEconomicData = typeof rithmEconomicData.$inferSelect;
export type InsertRithmEconomicData = z.infer<typeof insertRithmEconomicDataSchema>;

export type RithmComparativeAnalysis = typeof rithmComparativeAnalysis.$inferSelect;
export type InsertRithmComparativeAnalysis = z.infer<typeof insertRithmComparativeAnalysisSchema>;

export type RithmClientProfile = typeof rithmClientProfiles.$inferSelect;
export type InsertRithmClientProfile = z.infer<typeof insertRithmClientProfileSchema>;

// Zod schemas
export const insertRithmSessionSchema = createInsertSchema(rithmSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRithmAnalysisResultSchema = createInsertSchema(rithmAnalysisResults).omit({
  id: true,
  createdAt: true
});

export const insertRithmEconomicDataSchema = createInsertSchema(rithmEconomicData).omit({
  id: true,
  lastUpdated: true
});

export const insertRithmComparativeAnalysisSchema = createInsertSchema(rithmComparativeAnalysis).omit({
  id: true,
  createdAt: true
});

export const insertRithmClientProfileSchema = createInsertSchema(rithmClientProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});