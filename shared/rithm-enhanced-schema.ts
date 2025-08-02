import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enhanced Rithm System Enhancements Schema
// Based on Patent Search-Informed Strategic Optimization

// Acute Precision Monitoring Projects
export const acutePrecisionProjects = pgTable("acute_precision_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systemType: text("system_type").notNull(), // bioimpedance, computer_vision, sensor_array, ml_pipeline
  projectStatus: text("project_status").$type<"planning" | "active" | "monitoring" | "completed">().default("planning"),
  componentCount: integer("component_count").notNull(),
  targetAccuracy: decimal("target_accuracy", { precision: 5, scale: 2 }).notNull(),
  currentAccuracy: decimal("current_accuracy", { precision: 5, scale: 2 }),
  resolutionLevels: jsonb("resolution_levels").$type<string[]>().default(["high", "medium", "low"]),
  performanceThresholds: jsonb("performance_thresholds").$type<Record<string, number>>(),
  acuteTargetingEnabled: boolean("acute_targeting_enabled").default(true),
  cascadePreventionEnabled: boolean("cascade_prevention_enabled").default(true),
  clientId: text("client_id"), // For client project tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System Components for Acute Monitoring
export const systemComponents = pgTable("system_components", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => acutePrecisionProjects.id),
  componentName: text("component_name").notNull(),
  componentType: text("component_type").notNull(), // sensor, algorithm, data_processor, output_stage
  performanceMetric: decimal("performance_metric", { precision: 8, scale: 4 }).notNull(),
  targetPerformance: decimal("target_performance", { precision: 8, scale: 4 }).notNull(),
  healthStatus: text("health_status").$type<"healthy" | "degraded" | "critical" | "failing">().default("healthy"),
  interconnections: jsonb("interconnections").$type<string[]>().default([]),
  lastAssessment: timestamp("last_assessment").defaultNow(),
  interventionHistory: jsonb("intervention_history").$type<Array<{
    timestamp: string;
    intervention: string;
    result: string;
    performanceChange: number;
  }>>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Acute Monitoring Sessions
export const acuteMonitoringSessions = pgTable("acute_monitoring_sessions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => acutePrecisionProjects.id),
  sessionName: text("session_name").notNull(),
  monitoringType: text("monitoring_type").$type<"realtime" | "scheduled" | "triggered" | "diagnostic">().default("realtime"),
  sessionStatus: text("session_status").$type<"active" | "paused" | "completed" | "error">().default("active"),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // minutes
  componentsMonitored: integer("components_monitored").notNull(),
  interventionsTriggered: integer("interventions_triggered").default(0),
  cascadePreventions: integer("cascade_preventions").default(0),
  overallEfficiency: decimal("overall_efficiency", { precision: 5, scale: 2 }),
  sessionSummary: jsonb("session_summary").$type<{
    criticalFindings: string[];
    performanceImprovements: number[];
    riskMitigations: string[];
    recommendedActions: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Acute Interventions Log
export const acuteInterventions = pgTable("acute_interventions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => acuteMonitoringSessions.id),
  componentId: integer("component_id").notNull().references(() => systemComponents.id),
  interventionType: text("intervention_type").$type<"precision_targeting" | "performance_boost" | "cascade_prevention" | "risk_mitigation">().notNull(),
  interventionStrategy: text("intervention_strategy").notNull(),
  triggerCondition: text("trigger_condition").notNull(),
  preInterventionPerformance: decimal("pre_intervention_performance", { precision: 8, scale: 4 }).notNull(),
  postInterventionPerformance: decimal("post_intervention_performance", { precision: 8, scale: 4 }),
  performanceImprovement: decimal("performance_improvement", { precision: 8, scale: 4 }),
  improvementPercentage: decimal("improvement_percentage", { precision: 5, scale: 2 }),
  interventionDuration: integer("intervention_duration"), // minutes
  resourcesUsed: jsonb("resources_used").$type<Record<string, number>>(),
  sideEffects: text("side_effects"),
  cascadeRisksPrevented: jsonb("cascade_risks_prevented").$type<string[]>().default([]),
  success: boolean("success").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enhanced Convergence Analysis Projects
export const enhancedConvergenceProjects = pgTable("enhanced_convergence_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  domain: text("domain").notNull(), // bioimpedance, computer_vision, sensor_fusion, ml_optimization
  analysisType: text("analysis_type").$type<"multi_model" | "ensemble" | "adaptive" | "patent_informed">().default("multi_model"),
  projectStatus: text("project_status").$type<"planning" | "data_collection" | "analysis" | "optimization" | "completed">().default("planning"),
  dataPoints: integer("data_points").notNull().default(0),
  targetAccuracy: decimal("target_accuracy", { precision: 5, scale: 2 }).notNull(),
  currentAccuracy: decimal("current_accuracy", { precision: 5, scale: 2 }),
  convergenceModels: jsonb("convergence_models").$type<Array<{
    model: string;
    weight: number;
    accuracy: number;
    confidence: number;
  }>>().default([]),
  ensembleAccuracy: decimal("ensemble_accuracy", { precision: 5, scale: 2 }),
  convergenceType: text("convergence_type").$type<"exponential" | "power_law" | "logarithmic" | "sigmoid">(),
  accelerationFactor: decimal("acceleration_factor", { precision: 4, scale: 2 }),
  patentRiskAssessment: jsonb("patent_risk_assessment").$type<{
    riskLevel: string;
    competitivePatents: number;
    differentiationScore: number;
    protectionStrategy: string;
  }>(),
  clientId: text("client_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Convergence Model Predictions
export const convergencePredictions = pgTable("convergence_predictions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => enhancedConvergenceProjects.id),
  modelType: text("model_type").notNull(), // exponential, power_law, logarithmic, sigmoid
  modelWeight: decimal("model_weight", { precision: 4, scale: 3 }).notNull(),
  predictionTimestamp: timestamp("prediction_timestamp").defaultNow().notNull(),
  currentDataPoints: integer("current_data_points").notNull(),
  predictedAccuracy: decimal("predicted_accuracy", { precision: 5, scale: 2 }).notNull(),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }).notNull(),
  timeToTarget: integer("time_to_target"), // days
  additionalDataNeeded: integer("additional_data_needed"),
  convergenceVelocity: decimal("convergence_velocity", { precision: 8, scale: 4 }),
  modelParameters: jsonb("model_parameters").$type<Record<string, number>>(),
  validationScore: decimal("validation_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Real-Time Patent Intelligence Monitoring
export const patentIntelligenceProjects = pgTable("patent_intelligence_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  monitoringKeywords: jsonb("monitoring_keywords").$type<string[]>().notNull(),
  competitiveCompanies: jsonb("competitive_companies").$type<string[]>().default([]),
  technologyDomains: jsonb("technology_domains").$type<string[]>().notNull(),
  monitoringStatus: text("monitoring_status").$type<"active" | "paused" | "completed">().default("active"),
  alertThreshold: integer("alert_threshold").default(5), // minimum patents to trigger alert
  lastScanTime: timestamp("last_scan_time"),
  totalPatentsMonitored: integer("total_patents_monitored").default(0),
  newPatentsFound: integer("new_patents_found").default(0),
  riskAlerts: integer("risk_alerts").default(0),
  clientId: text("client_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Patent Intelligence Alerts
export const patentIntelligenceAlerts = pgTable("patent_intelligence_alerts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => patentIntelligenceProjects.id),
  alertType: text("alert_type").$type<"new_competitive_patent" | "risk_threshold_exceeded" | "technology_overlap" | "strategic_opportunity">().notNull(),
  alertSeverity: text("alert_severity").$type<"low" | "medium" | "high" | "critical">().notNull(),
  patentTitle: text("patent_title").notNull(),
  patentNumber: text("patent_number").notNull(),
  applicant: text("applicant").notNull(),
  publicationDate: timestamp("publication_date"),
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }),
  overlapAnalysis: jsonb("overlap_analysis").$type<{
    conflictingClaims: string[];
    differentiationOpportunities: string[];
    mitigationStrategies: string[];
  }>(),
  recommendedActions: jsonb("recommended_actions").$type<string[]>().default([]),
  status: text("status").$type<"new" | "reviewed" | "mitigated" | "dismissed">().default("new"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  mitigationPlan: text("mitigation_plan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patent-Informed Confidence Scoring
export const patentInformedConfidence = pgTable("patent_informed_confidence", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"), // Can link to convergence or monitoring projects
  projectType: text("project_type").$type<"convergence" | "acute_monitoring" | "patent_intelligence">().notNull(),
  baseConfidence: decimal("base_confidence", { precision: 5, scale: 2 }).notNull(),
  patentRiskFactor: decimal("patent_risk_factor", { precision: 4, scale: 3 }).notNull(),
  competitiveAdvantage: decimal("competitive_advantage", { precision: 5, scale: 2 }).notNull(),
  enhancedConfidence: decimal("enhanced_confidence", { precision: 5, scale: 2 }).notNull(),
  confidenceComponents: jsonb("confidence_components").$type<{
    dataQuality: number;
    analysisDepth: number;
    convergenceStability: number;
    domainExpertise: number;
    patentRisk: number;
    competitivePosition: number;
  }>(),
  riskAssessment: jsonb("risk_assessment").$type<{
    ipRisk: string;
    technicalRisk: string;
    marketRisk: string;
    competitiveRisk: string;
  }>(),
  mitigationStrategies: jsonb("mitigation_strategies").$type<string[]>().default([]),
  calculationTimestamp: timestamp("calculation_timestamp").defaultNow().notNull(),
  validityPeriod: integer("validity_period").default(30), // days
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Universal Application Framework Projects
export const universalFrameworkProjects = pgTable("universal_framework_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systemDomain: text("system_domain").notNull(), // technology, business, human_development, creative
  systemType: text("system_type").notNull(),
  qualificationStatus: text("qualification_status").$type<"qualified" | "pending" | "unqualified">().default("pending"),
  performanceMetrics: jsonb("performance_metrics").$type<Record<string, number>>(),
  improvementCapability: decimal("improvement_capability", { precision: 5, scale: 2 }),
  theoreticalLimits: jsonb("theoretical_limits").$type<Record<string, number>>(),
  convergentBehavior: boolean("convergent_behavior").default(false),
  universalOptimization: jsonb("universal_optimization").$type<{
    optimizationStrategy: string;
    expectedImprovement: number;
    timeframe: number;
    resourceRequirements: Record<string, number>;
  }>(),
  patentLandscape: jsonb("patent_landscape").$type<{
    relevantPatents: number;
    riskLevel: string;
    opportunityScore: number;
  }>(),
  marketOpportunity: jsonb("market_opportunity").$type<{
    addressableMarket: number;
    competitiveAdvantage: string;
    revenueProjection: number;
  }>(),
  clientId: text("client_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Implementation Roadmaps for Enhanced Systems
export const implementationRoadmaps = pgTable("implementation_roadmaps", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  projectType: text("project_type").$type<"acute_monitoring" | "convergence" | "patent_intelligence" | "universal_framework">().notNull(),
  roadmapName: text("roadmap_name").notNull(),
  totalPhases: integer("total_phases").notNull(),
  currentPhase: integer("current_phase").default(1),
  estimatedTimeline: integer("estimated_timeline"), // months
  totalInvestment: decimal("total_investment", { precision: 12, scale: 2 }),
  expectedROI: decimal("expected_roi", { precision: 8, scale: 2 }),
  phases: jsonb("phases").$type<Array<{
    phase: number;
    name: string;
    duration: number;
    budget: number;
    deliverables: string[];
    dependencies: string[];
    riskFactors: string[];
  }>>(),
  currentMilestones: jsonb("current_milestones").$type<Array<{
    milestone: string;
    status: string;
    dueDate: string;
    completionDate?: string;
  }>>(),
  riskAssessment: jsonb("risk_assessment").$type<{
    technicalRisks: string[];
    marketRisks: string[];
    resourceRisks: string[];
    mitigationPlans: Record<string, string>;
  }>(),
  successMetrics: jsonb("success_metrics").$type<Array<{
    metric: string;
    target: number;
    current: number;
    unit: string;
  }>>(),
  status: text("status").$type<"planning" | "in_progress" | "delayed" | "completed" | "cancelled">().default("planning"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const acutePrecisionProjectsRelations = relations(acutePrecisionProjects, ({ many }) => ({
  components: many(systemComponents),
  sessions: many(acuteMonitoringSessions),
}));

export const systemComponentsRelations = relations(systemComponents, ({ one, many }) => ({
  project: one(acutePrecisionProjects, {
    fields: [systemComponents.projectId],
    references: [acutePrecisionProjects.id],
  }),
  interventions: many(acuteInterventions),
}));

export const acuteMonitoringSessionsRelations = relations(acuteMonitoringSessions, ({ one, many }) => ({
  project: one(acutePrecisionProjects, {
    fields: [acuteMonitoringSessions.projectId],
    references: [acutePrecisionProjects.id],
  }),
  interventions: many(acuteInterventions),
}));

export const acuteInterventionsRelations = relations(acuteInterventions, ({ one }) => ({
  session: one(acuteMonitoringSessions, {
    fields: [acuteInterventions.sessionId],
    references: [acuteMonitoringSessions.id],
  }),
  component: one(systemComponents, {
    fields: [acuteInterventions.componentId],
    references: [systemComponents.id],
  }),
}));

export const enhancedConvergenceProjectsRelations = relations(enhancedConvergenceProjects, ({ many }) => ({
  predictions: many(convergencePredictions),
}));

export const convergencePredictionsRelations = relations(convergencePredictions, ({ one }) => ({
  project: one(enhancedConvergenceProjects, {
    fields: [convergencePredictions.projectId],
    references: [enhancedConvergenceProjects.id],
  }),
}));

export const patentIntelligenceProjectsRelations = relations(patentIntelligenceProjects, ({ many }) => ({
  alerts: many(patentIntelligenceAlerts),
}));

export const patentIntelligenceAlertsRelations = relations(patentIntelligenceAlerts, ({ one }) => ({
  project: one(patentIntelligenceProjects, {
    fields: [patentIntelligenceAlerts.projectId],
    references: [patentIntelligenceProjects.id],
  }),
}));

// Insert Schemas
export const insertAcutePrecisionProjectSchema = createInsertSchema(acutePrecisionProjects);
export const insertSystemComponentSchema = createInsertSchema(systemComponents);
export const insertAcuteMonitoringSessionSchema = createInsertSchema(acuteMonitoringSessions);
export const insertAcuteInterventionSchema = createInsertSchema(acuteInterventions);
export const insertEnhancedConvergenceProjectSchema = createInsertSchema(enhancedConvergenceProjects);
export const insertConvergencePredictionSchema = createInsertSchema(convergencePredictions);
export const insertPatentIntelligenceProjectSchema = createInsertSchema(patentIntelligenceProjects);
export const insertPatentIntelligenceAlertSchema = createInsertSchema(patentIntelligenceAlerts);
export const insertPatentInformedConfidenceSchema = createInsertSchema(patentInformedConfidence);
export const insertUniversalFrameworkProjectSchema = createInsertSchema(universalFrameworkProjects);
export const insertImplementationRoadmapSchema = createInsertSchema(implementationRoadmaps);

// Types
export type AcutePrecisionProject = typeof acutePrecisionProjects.$inferSelect;
export type InsertAcutePrecisionProject = z.infer<typeof insertAcutePrecisionProjectSchema>;
export type SystemComponent = typeof systemComponents.$inferSelect;
export type InsertSystemComponent = z.infer<typeof insertSystemComponentSchema>;
export type AcuteMonitoringSession = typeof acuteMonitoringSessions.$inferSelect;
export type InsertAcuteMonitoringSession = z.infer<typeof insertAcuteMonitoringSessionSchema>;
export type AcuteIntervention = typeof acuteInterventions.$inferSelect;
export type InsertAcuteIntervention = z.infer<typeof insertAcuteInterventionSchema>;
export type EnhancedConvergenceProject = typeof enhancedConvergenceProjects.$inferSelect;
export type InsertEnhancedConvergenceProject = z.infer<typeof insertEnhancedConvergenceProjectSchema>;
export type ConvergencePrediction = typeof convergencePredictions.$inferSelect;
export type InsertConvergencePrediction = z.infer<typeof insertConvergencePredictionSchema>;
export type PatentIntelligenceProject = typeof patentIntelligenceProjects.$inferSelect;
export type InsertPatentIntelligenceProject = z.infer<typeof insertPatentIntelligenceProjectSchema>;
export type PatentIntelligenceAlert = typeof patentIntelligenceAlerts.$inferSelect;
export type InsertPatentIntelligenceAlert = z.infer<typeof insertPatentIntelligenceAlertSchema>;
export type PatentInformedConfidence = typeof patentInformedConfidence.$inferSelect;
export type InsertPatentInformedConfidence = z.infer<typeof insertPatentInformedConfidenceSchema>;
export type UniversalFrameworkProject = typeof universalFrameworkProjects.$inferSelect;
export type InsertUniversalFrameworkProject = z.infer<typeof insertUniversalFrameworkProjectSchema>;
export type ImplementationRoadmap = typeof implementationRoadmaps.$inferSelect;
export type InsertImplementationRoadmap = z.infer<typeof insertImplementationRoadmapSchema>;