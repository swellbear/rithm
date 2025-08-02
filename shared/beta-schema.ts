import { pgTable, serial, integer, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { users } from "./schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const betaProgram = pgTable("beta_program", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Application info
  farmName: text("farm_name").notNull(),
  location: text("location").notNull(),
  farmSize: integer("farm_size"), // acres
  livestockTypes: text("livestock_types").array().notNull(),
  experience: text("experience").notNull(), // beginner, intermediate, advanced
  currentSystem: text("current_system"), // rotational, continuous, etc.
  
  // Contact and motivation
  email: text("email").notNull(),
  phone: text("phone"),
  motivation: text("motivation").notNull(),
  goals: text("goals").array().notNull(),
  
  // Beta program specific
  status: text("status").notNull().default("applied"), // applied, accepted, active, completed, withdrawn
  cohort: text("cohort"), // beta-1, beta-2, etc.
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Tracking
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  completedAt: timestamp("completed_at"),
  
  // Preferences
  communicationPrefs: jsonb("communication_prefs").$type<{
    email: boolean;
    phone: boolean;
    weeklyCheckin: boolean;
    surveyReminders: boolean;
  }>(),
  
  // Admin notes
  adminNotes: text("admin_notes"),
  referralSource: text("referral_source"),
});

export const betaFeedback = pgTable("beta_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  betaId: integer("beta_id").references(() => betaProgram.id).notNull(),
  
  // Feedback details
  type: text("type").notNull(), // weekly_checkin, tool_feedback, bug_report, feature_request, exit_interview
  category: text("category"), // usability, features, performance, workflow, education
  toolId: integer("tool_id"), // which tool this feedback relates to
  
  rating: integer("rating"), // 1-5 scale
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  // Context
  deviceType: text("device_type"), // mobile, tablet, desktop
  browserInfo: text("browser_info"),
  location: text("location"), // field, office, home
  
  // Status
  status: text("status").notNull().default("new"), // new, reviewed, in_progress, resolved, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  
  // Response
  adminResponse: text("admin_response"),
  respondedBy: integer("responded_by").references(() => users.id),
  respondedAt: timestamp("responded_at"),
  
  // Tracking
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const betaMetrics = pgTable("beta_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  betaId: integer("beta_id").references(() => betaProgram.id).notNull(),
  
  // Usage metrics
  date: timestamp("date").notNull(),
  sessionDuration: integer("session_duration"), // minutes
  toolsUsed: text("tools_used").array(),
  featuresUsed: text("features_used").array(),
  
  // Engagement metrics
  assessmentsCompleted: integer("assessments_completed").default(0),
  recommendationsFollowed: integer("recommendations_followed").default(0),
  dataPointsEntered: integer("data_points_entered").default(0),
  
  // Outcome metrics
  farmDataComplete: boolean("farm_data_complete").default(false),
  usingRegularly: boolean("using_regularly").default(false),
  wouldRecommend: integer("would_recommend"), // NPS score 0-10
  
  // Context
  deviceType: text("device_type"),
  location: text("location"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const betaProgramInsertSchema = createInsertSchema(betaProgram);
export const betaFeedbackInsertSchema = createInsertSchema(betaFeedback);
export const betaMetricsInsertSchema = createInsertSchema(betaMetrics);

export type BetaProgram = typeof betaProgram.$inferSelect;
export type BetaFeedback = typeof betaFeedback.$inferSelect;
export type BetaMetrics = typeof betaMetrics.$inferSelect;

export type InsertBetaProgram = z.infer<typeof betaProgramInsertSchema>;
export type InsertBetaFeedback = z.infer<typeof betaFeedbackInsertSchema>;
export type InsertBetaMetrics = z.infer<typeof betaMetricsInsertSchema>;