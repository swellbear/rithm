import { pgTable, text, serial, integer, decimal, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Algorithm Usage Sessions - Track each time Rithm algorithms are used
export const algorithmSessions = pgTable("algorithm_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(), // UUID for tracking
  algorithmType: text("algorithm_type").notNull(), // convergence_prediction, patent_optimization, etc.
  domain: text("domain").notNull(), // bioimpedance, patent_documentation, business_optimization, etc.
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  userId: text("user_id"), // optional user tracking
  projectContext: text("project_context"), // what project this relates to
  status: text("status").$type<"active" | "completed" | "failed" | "cancelled">().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Algorithm Predictions - Store what algorithms predicted
export const algorithmPredictions = pgTable("algorithm_predictions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => algorithmSessions.sessionId),
  predictionType: text("prediction_type").notNull(), // data_requirements, timeline, success_probability, etc.
  predictedValue: decimal("predicted_value", { precision: 12, scale: 4 }).notNull(),
  predictedUnit: text("predicted_unit").notNull(), // lines, hours, percentage, etc.
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }).notNull(), // 0-100%
  algorithmParameters: jsonb("algorithm_parameters").notNull(), // input parameters used
  calculationMethod: text("calculation_method").notNull(), // which specific algorithm/formula
  domainMultipliers: jsonb("domain_multipliers"), // any domain-specific adjustments
  qualityAdjustments: jsonb("quality_adjustments"), // quality-based adjustments
  contextFactors: jsonb("context_factors"), // environmental/situational factors
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Actual Results - Store what actually happened vs predictions
export const actualResults = pgTable("actual_results", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => algorithmSessions.sessionId),
  predictionId: integer("prediction_id").notNull().references(() => algorithmPredictions.id),
  actualValue: decimal("actual_value", { precision: 12, scale: 4 }).notNull(),
  actualUnit: text("actual_unit").notNull(),
  completionTime: timestamp("completion_time").notNull(),
  successfulCompletion: boolean("successful_completion").default(true),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }), // 0-100% quality of result
  notes: text("notes"), // any additional context about the result
  validationMethod: text("validation_method"), // how the result was measured/validated
  contextChanges: jsonb("context_changes"), // any changes from original context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Performance Analytics - Calculate accuracy metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => algorithmSessions.sessionId),
  predictionId: integer("prediction_id").notNull().references(() => algorithmPredictions.id),
  resultId: integer("result_id").notNull().references(() => actualResults.id),
  accuracyPercentage: decimal("accuracy_percentage", { precision: 5, scale: 2 }).notNull(),
  errorMargin: decimal("error_margin", { precision: 12, scale: 4 }).notNull(),
  overUnderDelivery: decimal("over_under_delivery", { precision: 8, scale: 2 }).notNull(), // percentage over/under
  predictionCategory: text("prediction_category").$type<"excellent" | "good" | "acceptable" | "poor" | "failed">().notNull(),
  confidenceAccuracy: decimal("confidence_accuracy", { precision: 5, scale: 2 }), // how accurate the confidence was
  domainPerformance: jsonb("domain_performance"), // domain-specific performance metrics
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
});

// Learning Insights - Store algorithm improvement insights
export const learningInsights = pgTable("learning_insights", {
  id: serial("id").primaryKey(),
  algorithmType: text("algorithm_type").notNull(),
  domain: text("domain").notNull(),
  insightType: text("insight_type").notNull(), // parameter_adjustment, multiplier_update, new_pattern, etc.
  insightDescription: text("insight_description").notNull(),
  recommendedAdjustment: jsonb("recommended_adjustment").notNull(),
  supportingData: jsonb("supporting_data").notNull(), // evidence for the insight
  confidenceInInsight: decimal("confidence_in_insight", { precision: 5, scale: 2 }).notNull(),
  implementationStatus: text("implementation_status").$type<"pending" | "implemented" | "testing" | "rejected">().default("pending"),
  performanceImprovement: decimal("performance_improvement", { precision: 5, scale: 2 }), // expected % improvement
  validationSessions: jsonb("validation_sessions"), // sessions used to validate this insight
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Algorithm Versions - Track algorithm evolution over time
export const algorithmVersions = pgTable("algorithm_versions", {
  id: serial("id").primaryKey(),
  algorithmType: text("algorithm_type").notNull(),
  domain: text("domain").notNull(),
  version: text("version").notNull(), // semantic versioning like 1.0.0
  parameters: jsonb("parameters").notNull(), // current algorithm parameters
  multipliers: jsonb("multipliers").notNull(), // domain multipliers
  adjustments: jsonb("adjustments").notNull(), // quality adjustments
  performanceBaseline: jsonb("performance_baseline"), // baseline performance metrics
  changeLog: text("change_log").notNull(), // what changed from previous version
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
  deprecatedAt: timestamp("deprecated_at"),
  isActive: boolean("is_active").default(true),
});

// Training Data Snapshots - Store data for algorithm retraining
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Indexes for performance - commented out to fix Docker deployment JSON parsing error
// These can be re-enabled after deployment is working
// export const algorithmSessionsIndex = index("algorithm_sessions_type_domain_idx").on(algorithmSessions.algorithmType, algorithmSessions.domain, algorithmSessions.startTime);
// export const predictionsSessionIndex = index("predictions_session_type_idx").on(algorithmPredictions.sessionId, algorithmPredictions.predictionType);
// export const resultsSessionIndex = index("results_session_completion_idx").on(actualResults.sessionId, actualResults.completionTime);
// export const performanceAlgorithmIndex = index("performance_algorithm_domain_idx").on(performanceMetrics.sessionId, performanceMetrics.accuracyPercentage);
// export const learningTypeIndex = index("learning_type_status_idx").on(learningInsights.algorithmType, learningInsights.domain, learningInsights.implementationStatus);

// Relations
export const algorithmSessionsRelations = relations(algorithmSessions, ({ many }) => ({
  predictions: many(algorithmPredictions),
  results: many(actualResults),
  metrics: many(performanceMetrics),
}));

export const algorithmPredictionsRelations = relations(algorithmPredictions, ({ one, many }) => ({
  session: one(algorithmSessions, {
    fields: [algorithmPredictions.sessionId],
    references: [algorithmSessions.sessionId],
  }),
  results: many(actualResults),
  metrics: many(performanceMetrics),
}));

export const actualResultsRelations = relations(actualResults, ({ one }) => ({
  session: one(algorithmSessions, {
    fields: [actualResults.sessionId],
    references: [algorithmSessions.sessionId],
  }),
  prediction: one(algorithmPredictions, {
    fields: [actualResults.predictionId],
    references: [algorithmPredictions.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  session: one(algorithmSessions, {
    fields: [performanceMetrics.sessionId],
    references: [algorithmSessions.sessionId],
  }),
  prediction: one(algorithmPredictions, {
    fields: [performanceMetrics.predictionId],
    references: [algorithmPredictions.id],
  }),
  result: one(actualResults, {
    fields: [performanceMetrics.resultId],
    references: [actualResults.id],
  }),
}));

// Type exports
export type AlgorithmSession = typeof algorithmSessions.$inferSelect;
export type InsertAlgorithmSession = typeof algorithmSessions.$inferInsert;
export type AlgorithmPrediction = typeof algorithmPredictions.$inferSelect;
export type InsertAlgorithmPrediction = typeof algorithmPredictions.$inferInsert;
export type ActualResult = typeof actualResults.$inferSelect;
export type InsertActualResult = typeof actualResults.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type LearningInsight = typeof learningInsights.$inferSelect;
export type InsertLearningInsight = typeof learningInsights.$inferInsert;
export type AlgorithmVersion = typeof algorithmVersions.$inferSelect;
export type InsertAlgorithmVersion = typeof algorithmVersions.$inferInsert;
export type TrainingDataSnapshot = typeof trainingDataSnapshots.$inferSelect;
export type InsertTrainingDataSnapshot = typeof trainingDataSnapshots.$inferInsert;

// Zod schemas
export const insertAlgorithmSessionSchema = createInsertSchema(algorithmSessions);
export const insertAlgorithmPredictionSchema = createInsertSchema(algorithmPredictions);
export const insertActualResultSchema = createInsertSchema(actualResults);
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics);
export const insertLearningInsightSchema = createInsertSchema(learningInsights);
export const insertAlgorithmVersionSchema = createInsertSchema(algorithmVersions);
export const insertTrainingDataSnapshotSchema = createInsertSchema(trainingDataSnapshots);
