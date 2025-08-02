import { pgTable, text, serial, timestamp, decimal, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Core Algorithm Sessions table
export const algorithmSessions = pgTable("algorithm_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  algorithmType: text("algorithm_type").notNull(),
  domain: text("domain").notNull(),
  status: text("status").notNull().default("active"),
  projectContext: text("project_context"),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Algorithm Predictions table
export const algorithmPredictions = pgTable("algorithm_predictions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  predictionType: text("prediction_type").notNull(),
  predictedValue: text("predicted_value").notNull(),
  predictedUnit: text("predicted_unit").notNull(),
  confidenceLevel: text("confidence_level").notNull(),
  algorithmParameters: jsonb("algorithm_parameters").notNull(),
  calculationMethod: text("calculation_method").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Actual Results table
export const actualResults = pgTable("actual_results", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  predictionId: integer("prediction_id"),
  actualValue: text("actual_value").notNull(),
  actualUnit: text("actual_unit").notNull(),
  completionTime: timestamp("completion_time").notNull().defaultNow(),
  successfulCompletion: boolean("successful_completion").notNull().default(true),
  qualityScore: text("quality_score"),
  notes: text("notes"),
  validationMethod: text("validation_method"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Performance Metrics table
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  accuracyPercentage: decimal("accuracy_percentage", { precision: 5, scale: 2 }).notNull(),
  efficiencyScore: decimal("efficiency_score", { precision: 5, scale: 2 }).notNull(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow()
});

// Learning Insights table
export const learningInsights = pgTable("learning_insights", {
  id: serial("id").primaryKey(),
  algorithmType: text("algorithm_type").notNull(),
  domain: text("domain").notNull(),
  insightTitle: text("insight_title").notNull(),
  insightDescription: text("insight_description").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  implementationStatus: text("implementation_status").notNull().default("pending"),
  performanceImprovement: decimal("performance_improvement", { precision: 5, scale: 2 }),
  evidenceData: jsonb("evidence_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  implementedAt: timestamp("implemented_at")
});

// Algorithm Versions table
export const algorithmVersions = pgTable("algorithm_versions", {
  id: serial("id").primaryKey(),
  algorithmType: text("algorithm_type").notNull(),
  domain: text("domain").notNull(),
  version: text("version").notNull(),
  parameters: jsonb("parameters").notNull(),
  multipliers: jsonb("multipliers").notNull(),
  adjustments: jsonb("adjustments").notNull(),
  performanceBaseline: jsonb("performance_baseline"),
  changeLog: text("change_log").notNull(),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  deprecatedAt: timestamp("deprecated_at"),
  isActive: boolean("is_active").default(true)
});

// Training Data Snapshots table
export const trainingDataSnapshots = pgTable("training_data_snapshots", {
  id: serial("id").primaryKey(),
  algorithmType: text("algorithm_type").notNull(),
  domain: text("domain").notNull(),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
  datasetSize: integer("dataset_size").notNull(),
  trainingAccuracy: decimal("training_accuracy", { precision: 5, scale: 2 }),
  validationAccuracy: decimal("validation_accuracy", { precision: 5, scale: 2 }),
  testAccuracy: decimal("test_accuracy", { precision: 5, scale: 2 }),
  featureImportance: jsonb("feature_importance"),
  modelParameters: jsonb("model_parameters"),
  crossValidationScores: jsonb("cross_validation_scores"),
  dataQualityMetrics: jsonb("data_quality_metrics"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const algorithmSessionsRelations = relations(algorithmSessions, ({ many }) => ({
  predictions: many(algorithmPredictions),
  results: many(actualResults),
  metrics: many(performanceMetrics)
}));

export const algorithmPredictionsRelations = relations(algorithmPredictions, ({ one, many }) => ({
  session: one(algorithmSessions, {
    fields: [algorithmPredictions.sessionId],
    references: [algorithmSessions.sessionId]
  }),
  results: many(actualResults)
}));

export const actualResultsRelations = relations(actualResults, ({ one }) => ({
  session: one(algorithmSessions, {
    fields: [actualResults.sessionId],
    references: [algorithmSessions.sessionId]
  }),
  prediction: one(algorithmPredictions, {
    fields: [actualResults.predictionId],
    references: [algorithmPredictions.id]
  })
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  session: one(algorithmSessions, {
    fields: [performanceMetrics.sessionId],
    references: [algorithmSessions.sessionId]
  })
}));

// Zod schemas for validation
export const insertAlgorithmSessionSchema = createInsertSchema(algorithmSessions);
export const selectAlgorithmSessionSchema = createSelectSchema(algorithmSessions);
export const insertAlgorithmPredictionSchema = createInsertSchema(algorithmPredictions);
export const selectAlgorithmPredictionSchema = createSelectSchema(algorithmPredictions);
export const insertActualResultSchema = createInsertSchema(actualResults);
export const selectActualResultSchema = createSelectSchema(actualResults);
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics);
export const selectPerformanceMetricSchema = createSelectSchema(performanceMetrics);
export const insertLearningInsightSchema = createInsertSchema(learningInsights);
export const selectLearningInsightSchema = createSelectSchema(learningInsights);
export const insertAlgorithmVersionSchema = createInsertSchema(algorithmVersions);
export const selectAlgorithmVersionSchema = createSelectSchema(algorithmVersions);
export const insertTrainingDataSnapshotSchema = createInsertSchema(trainingDataSnapshots);
export const selectTrainingDataSnapshotSchema = createSelectSchema(trainingDataSnapshots);

// Types
export type AlgorithmSession = z.infer<typeof selectAlgorithmSessionSchema>;
export type InsertAlgorithmSession = z.infer<typeof insertAlgorithmSessionSchema>;
export type AlgorithmPrediction = z.infer<typeof selectAlgorithmPredictionSchema>;
export type InsertAlgorithmPrediction = z.infer<typeof insertAlgorithmPredictionSchema>;
export type ActualResult = z.infer<typeof selectActualResultSchema>;
export type InsertActualResult = z.infer<typeof insertActualResultSchema>;
export type PerformanceMetric = z.infer<typeof selectPerformanceMetricSchema>;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type LearningInsight = z.infer<typeof selectLearningInsightSchema>;
export type InsertLearningInsight = z.infer<typeof insertLearningInsightSchema>;
export type AlgorithmVersion = z.infer<typeof selectAlgorithmVersionSchema>;
export type InsertAlgorithmVersion = z.infer<typeof insertAlgorithmVersionSchema>;
export type TrainingDataSnapshot = z.infer<typeof selectTrainingDataSnapshotSchema>;
export type InsertTrainingDataSnapshot = z.infer<typeof insertTrainingDataSnapshotSchema>;