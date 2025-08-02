import { 
  users, businessQueries, secCompanies, fredIndicators, businessAnalysis, domainDetection, apiCalls,
  type User, type InsertUser, type BusinessQuery, type InsertBusinessQuery,
  type SecCompany, type InsertSecCompany, type FredIndicator, type InsertFredIndicator,
  type BusinessAnalysis, type InsertBusinessAnalysis, type DomainDetection, type InsertDomainDetection,
  type ApiCall, type InsertApiCall
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

/**
 * RITHM ASSOCIATE - CLEAN STORAGE INTERFACE
 * 
 * ZERO FABRICATION - All methods designed for authentic data only.
 * System fails transparently when authentic data unavailable.
 */

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Business query management
  createBusinessQuery(query: InsertBusinessQuery): Promise<BusinessQuery>;
  getBusinessQueryById(id: number): Promise<BusinessQuery | undefined>;
  getBusinessQueriesByUser(userId: number): Promise<BusinessQuery[]>;
  updateBusinessQuery(id: number, query: Partial<InsertBusinessQuery>): Promise<BusinessQuery>;

  // SEC EDGAR data management
  createSecCompany(company: InsertSecCompany): Promise<SecCompany>;
  getSecCompanyByCik(cik: string): Promise<SecCompany | undefined>;
  getSecCompaniesByIndustry(industry: string): Promise<SecCompany[]>;
  searchSecCompanies(searchTerm: string): Promise<SecCompany[]>;

  // FRED economic data management
  createFredIndicator(indicator: InsertFredIndicator): Promise<FredIndicator>;
  getFredIndicatorBySeriesId(seriesId: string): Promise<FredIndicator | undefined>;
  getFredIndicatorsByCategory(category: string): Promise<FredIndicator[]>;
  getLatestFredIndicators(limit: number): Promise<FredIndicator[]>;

  // Business analysis results
  createBusinessAnalysis(analysis: InsertBusinessAnalysis): Promise<BusinessAnalysis>;
  getBusinessAnalysisByQuery(queryId: number): Promise<BusinessAnalysis[]>;
  getBusinessAnalysisByUser(userId: number): Promise<BusinessAnalysis[]>;

  // Domain detection training
  createDomainDetection(detection: InsertDomainDetection): Promise<DomainDetection>;
  getDomainDetectionAccuracy(): Promise<{ accuracy: number; totalPredictions: number }>;
  getIncorrectPredictions(): Promise<DomainDetection[]>;

  // API call tracking
  logApiCall(call: InsertApiCall): Promise<ApiCall>;
  getApiCallStats(userId: number): Promise<{ 
    totalCalls: number; 
    successfulCalls: number; 
    failedCalls: number; 
    averageResponseTime: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    if (!db) {
      console.error('Database not available for getUser');
      return undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) {
      console.error('Database not available for getUserByUsername');
      return undefined;
    }
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  // Business query management
  async createBusinessQuery(query: InsertBusinessQuery): Promise<BusinessQuery> {
    const [newQuery] = await db.insert(businessQueries).values(query).returning();
    return newQuery;
  }

  async getBusinessQueryById(id: number): Promise<BusinessQuery | undefined> {
    const [query] = await db.select().from(businessQueries).where(eq(businessQueries.id, id));
    return query;
  }

  async getBusinessQueriesByUser(userId: number): Promise<BusinessQuery[]> {
    return await db.select().from(businessQueries)
      .where(eq(businessQueries.userId, userId))
      .orderBy(desc(businessQueries.createdAt));
  }

  async updateBusinessQuery(id: number, query: Partial<InsertBusinessQuery>): Promise<BusinessQuery> {
    const [updatedQuery] = await db.update(businessQueries)
      .set(query)
      .where(eq(businessQueries.id, id))
      .returning();
    return updatedQuery;
  }

  // SEC EDGAR data management
  async createSecCompany(company: InsertSecCompany): Promise<SecCompany> {
    const [newCompany] = await db.insert(secCompanies).values(company).returning();
    return newCompany;
  }

  async getSecCompanyByCik(cik: string): Promise<SecCompany | undefined> {
    const [company] = await db.select().from(secCompanies).where(eq(secCompanies.cik, cik));
    return company;
  }

  async getSecCompaniesByIndustry(industry: string): Promise<SecCompany[]> {
    return await db.select().from(secCompanies)
      .where(eq(secCompanies.industry, industry))
      .orderBy(desc(secCompanies.lastUpdated));
  }

  async searchSecCompanies(searchTerm: string): Promise<SecCompany[]> {
    // Note: This would use full-text search in production
    return await db.select().from(secCompanies)
      .where(eq(secCompanies.companyName, searchTerm))
      .limit(10);
  }

  // FRED economic data management
  async createFredIndicator(indicator: InsertFredIndicator): Promise<FredIndicator> {
    const [newIndicator] = await db.insert(fredIndicators).values(indicator).returning();
    return newIndicator;
  }

  async getFredIndicatorBySeriesId(seriesId: string): Promise<FredIndicator | undefined> {
    const [indicator] = await db.select().from(fredIndicators)
      .where(eq(fredIndicators.seriesId, seriesId));
    return indicator;
  }

  async getFredIndicatorsByCategory(category: string): Promise<FredIndicator[]> {
    return await db.select().from(fredIndicators)
      .where(eq(fredIndicators.category, category))
      .orderBy(desc(fredIndicators.date));
  }

  async getLatestFredIndicators(limit: number): Promise<FredIndicator[]> {
    return await db.select().from(fredIndicators)
      .orderBy(desc(fredIndicators.date))
      .limit(limit);
  }

  // Business analysis results
  async createBusinessAnalysis(analysis: InsertBusinessAnalysis): Promise<BusinessAnalysis> {
    const [newAnalysis] = await db.insert(businessAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  async getBusinessAnalysisByQuery(queryId: number): Promise<BusinessAnalysis[]> {
    return await db.select().from(businessAnalysis)
      .where(eq(businessAnalysis.queryId, queryId))
      .orderBy(desc(businessAnalysis.createdAt));
  }

  async getBusinessAnalysisByUser(userId: number): Promise<BusinessAnalysis[]> {
    return await db.select().from(businessAnalysis)
      .where(eq(businessAnalysis.userId, userId))
      .orderBy(desc(businessAnalysis.createdAt));
  }

  // Domain detection training
  async createDomainDetection(detection: InsertDomainDetection): Promise<DomainDetection> {
    const [newDetection] = await db.insert(domainDetection).values(detection).returning();
    return newDetection;
  }

  async getDomainDetectionAccuracy(): Promise<{ accuracy: number; totalPredictions: number }> {
    const results = await db.select().from(domainDetection);
    const totalPredictions = results.length;
    const correctPredictions = results.filter(r => r.wasCorrect).length;
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
    return { accuracy, totalPredictions };
  }

  async getIncorrectPredictions(): Promise<DomainDetection[]> {
    return await db.select().from(domainDetection)
      .where(eq(domainDetection.wasCorrect, false))
      .orderBy(desc(domainDetection.createdAt));
  }

  // API call tracking
  async logApiCall(call: InsertApiCall): Promise<ApiCall> {
    const [newCall] = await db.insert(apiCalls).values(call).returning();
    return newCall;
  }

  async getApiCallStats(userId: number): Promise<{ 
    totalCalls: number; 
    successfulCalls: number; 
    failedCalls: number; 
    averageResponseTime: number;
  }> {
    const calls = await db.select().from(apiCalls)
      .where(eq(apiCalls.userId, userId));
    
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(c => c.statusCode === 200).length;
    const failedCalls = totalCalls - successfulCalls;
    const averageResponseTime = calls.reduce((sum, c) => sum + (c.responseTime || 0), 0) / totalCalls || 0;
    
    return { totalCalls, successfulCalls, failedCalls, averageResponseTime };
  }
}

export const storage = new DatabaseStorage();