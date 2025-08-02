import { db } from "./db";
import { 
  rithmSessions, 
  rithmAnalysisResults, 
  rithmComparativeAnalysis,
  rithmClientProfiles,
  rithmEconomicData,
  type RithmSession,
  type InsertRithmSession,
  type RithmAnalysisResult,
  type InsertRithmAnalysisResult,
  type RithmComparativeAnalysis,
  type InsertRithmComparativeAnalysis,
  type RithmClientProfile,
  type InsertRithmClientProfile
} from "@shared/rithm-schema";
import { eq, desc } from "drizzle-orm";

export interface IRithmStorage {
  // Session management
  createSession(session: InsertRithmSession): Promise<RithmSession>;
  getSession(id: number): Promise<RithmSession | undefined>;
  getAllSessions(): Promise<RithmSession[]>;
  updateSession(id: number, updates: Partial<InsertRithmSession>): Promise<RithmSession>;
  
  // Analysis results
  createAnalysisResult(result: InsertRithmAnalysisResult): Promise<RithmAnalysisResult>;
  getAnalysisResults(sessionId: number): Promise<RithmAnalysisResult[]>;
  
  // Comparative analysis
  createComparativeAnalysis(analysis: InsertRithmComparativeAnalysis): Promise<RithmComparativeAnalysis>;
  getComparativeAnalysis(sessionId: number): Promise<RithmComparativeAnalysis | undefined>;
  
  // Client profiles
  createClientProfile(profile: InsertRithmClientProfile): Promise<RithmClientProfile>;
  getClientProfile(clientName: string): Promise<RithmClientProfile | undefined>;
  getAllClientProfiles(): Promise<RithmClientProfile[]>;
  
  // Economic data storage
  storeEconomicData(data: {
    datasetId: string;
    seriesName: string;
    dataPoints: any;
    dataSource: string;
    validationStatus: string;
  }): Promise<any>;
  getEconomicData(datasetId: string): Promise<any>;
  getAllEconomicData(): Promise<any[]>;
}

export class RithmDatabaseStorage implements IRithmStorage {
  async createSession(session: InsertRithmSession): Promise<RithmSession> {
    const [result] = await db
      .insert(rithmSessions)
      .values(session)
      .returning();
    return result;
  }

  async getSession(id: number): Promise<RithmSession | undefined> {
    const [session] = await db
      .select()
      .from(rithmSessions)
      .where(eq(rithmSessions.id, id));
    return session || undefined;
  }

  async getAllSessions(): Promise<RithmSession[]> {
    return await db
      .select()
      .from(rithmSessions)
      .orderBy(desc(rithmSessions.createdAt));
  }

  async updateSession(id: number, updates: Partial<InsertRithmSession>): Promise<RithmSession> {
    const [result] = await db
      .update(rithmSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rithmSessions.id, id))
      .returning();
    return result;
  }

  async createAnalysisResult(result: InsertRithmAnalysisResult): Promise<RithmAnalysisResult> {
    const [analysisResult] = await db
      .insert(rithmAnalysisResults)
      .values(result)
      .returning();
    return analysisResult;
  }

  async getAnalysisResults(sessionId: number): Promise<RithmAnalysisResult[]> {
    return await db
      .select()
      .from(rithmAnalysisResults)
      .where(eq(rithmAnalysisResults.sessionId, sessionId))
      .orderBy(desc(rithmAnalysisResults.createdAt));
  }

  async createComparativeAnalysis(analysis: InsertRithmComparativeAnalysis): Promise<RithmComparativeAnalysis> {
    const [result] = await db
      .insert(rithmComparativeAnalysis)
      .values(analysis)
      .returning();
    return result;
  }

  async getComparativeAnalysis(sessionId: number): Promise<RithmComparativeAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(rithmComparativeAnalysis)
      .where(eq(rithmComparativeAnalysis.sessionId, sessionId));
    return analysis || undefined;
  }

  async createClientProfile(profile: InsertRithmClientProfile): Promise<RithmClientProfile> {
    const [result] = await db
      .insert(rithmClientProfiles)
      .values(profile)
      .returning();
    return result;
  }

  async getClientProfile(clientName: string): Promise<RithmClientProfile | undefined> {
    const [profile] = await db
      .select()
      .from(rithmClientProfiles)
      .where(eq(rithmClientProfiles.clientName, clientName));
    return profile || undefined;
  }

  async getAllClientProfiles(): Promise<RithmClientProfile[]> {
    return await db
      .select()
      .from(rithmClientProfiles)
      .orderBy(desc(rithmClientProfiles.createdAt));
  }

  async storeEconomicData(data: {
    datasetId: string;
    seriesName: string;
    dataPoints: any;
    dataSource: string;
    validationStatus: string;
  }) {
    const [result] = await db
      .insert(rithmEconomicData)
      .values({
        datasetId: data.datasetId,
        seriesName: data.seriesName,
        dataPoints: data.dataPoints,
        dataSource: data.dataSource,
        validationStatus: data.validationStatus
      })
      .returning();
    return result;
  }

  async getEconomicData(datasetId: string) {
    const [data] = await db
      .select()
      .from(rithmEconomicData)
      .where(eq(rithmEconomicData.datasetId, datasetId));
    return data || undefined;
  }

  async getAllEconomicData() {
    return await db
      .select()
      .from(rithmEconomicData)
      .orderBy(desc(rithmEconomicData.lastUpdated));
  }
}

export const rithmStorage = new RithmDatabaseStorage();