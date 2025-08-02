import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { rithmBusinessEngine } from "./rithm-business-engine";
import { insertBusinessQuery } from "@shared/schema";
import { z } from "zod";

/**
 * RITHM ASSOCIATE - BUSINESS CONSULTING API ROUTES
 * 
 * ZERO FABRICATION - All routes designed for authentic data only.
 * System fails transparently when authentic data unavailable.
 */

const router = Router();

// Business query processing endpoint
router.post("/api/rithm/query", async (req: Request, res: Response) => {
  try {
    const querySchema = z.object({
      query: z.string().min(1),
      userId: z.number().optional(),
      consultingType: z.string().optional() // No hardcoded consulting types - require authentic consulting type validation
    });

    const { query, userId = 1, consultingType } = querySchema.parse(req.body);
    // Convert consultingType to match expected type
    const validConsultingType = consultingType as 'financial' | 'operational' | 'strategic' | 'market' | undefined;

    const response = await rithmBusinessEngine.processBusinessQuery({
      userId,
      query,
      consultingType: validConsultingType
    });

    res.json(response);
  } catch (error) {
    console.error('Query processing error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process business query',
      domain: 'unknown',
      confidence: 0
    });
  }
});

// Get user's query history
router.get("/api/rithm/queries/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const queries = await storage.getBusinessQueriesByUser(userId);
    res.json(queries);
  } catch (error) {
    console.error('Query history error:', error);
    res.status(500).json({ error: 'Failed to retrieve query history' });
  }
});

// Get business analysis results for a specific query
router.get("/api/rithm/analysis/:queryId", async (req: Request, res: Response) => {
  try {
    const queryId = parseInt(req.params.queryId);
    const analysis = await storage.getBusinessAnalysisByQuery(queryId);
    res.json(analysis);
  } catch (error) {
    console.error('Analysis retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis results' });
  }
});

// Get domain detection accuracy stats
router.get("/api/rithm/domain-accuracy", async (req: Request, res: Response) => {
  try {
    const accuracy = await storage.getDomainDetectionAccuracy();
    res.json(accuracy);
  } catch (error) {
    console.error('Domain accuracy error:', error);
    res.status(500).json({ error: 'Failed to retrieve domain accuracy' });
  }
});

// Submit domain detection feedback
router.post("/api/rithm/domain-feedback", async (req: Request, res: Response) => {
  try {
    const feedbackSchema = z.object({
      queryText: z.string(),
      actualDomain: z.string(),
      predictedDomain: z.string(),
      confidence: z.number(),
      wasCorrect: z.boolean(),
      userFeedback: z.string().optional()
    });

    const feedbackData = feedbackSchema.parse(req.body);
    // Convert confidence number to string as expected by storage
    const feedback = {
      ...feedbackData,
      confidence: feedbackData.confidence.toString()
    };
    const result = await storage.createDomainDetection(feedback);
    res.json(result);
  } catch (error) {
    console.error('Domain feedback error:', error);
    res.status(500).json({ error: 'Failed to submit domain feedback' });
  }
});

// Get API call statistics for a user
router.get("/api/rithm/api-stats/:userId", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const stats = await storage.getApiCallStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('API stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve API statistics' });
  }
});

// Health check endpoint
router.get("/api/rithm/health", async (req: Request, res: Response) => {
  try {
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Rithm Associate Business Consulting Engine - Ready for authentic data',
      fabricationPolicy: 'ZERO_FABRICATION_ENFORCED'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Test domain detection endpoint
router.post("/api/rithm/test-domain", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query text required' });
    }

    // Simple domain detection test
    const lowerQuery = query.toLowerCase();
    
    let domain = 'unknown';
    let confidence = 0;
    let queryType = 'general';

    // Business consulting keywords
    const businessKeywords = [
      'financial', 'revenue', 'profit', 'market', 'competition', 'strategy',
      'business', 'company', 'corporation', 'enterprise', 'industry'
    ];

    // Manufacturing keywords
    const manufacturingKeywords = [
      'production', 'manufacturing', 'factory', 'supply chain', 'inventory',
      'quality', 'efficiency', 'process', 'assembly', 'automation'
    ];

    // Agriculture keywords
    const agricultureKeywords = [
      'farm', 'crop', 'livestock', 'agriculture', 'grazing', 'pasture',
      'cattle', 'farming', 'harvest', 'soil', 'weather', 'irrigation'
    ];

    const businessScore = businessKeywords.filter(k => lowerQuery.includes(k)).length;
    const manufacturingScore = manufacturingKeywords.filter(k => lowerQuery.includes(k)).length;
    const agricultureScore = agricultureKeywords.filter(k => lowerQuery.includes(k)).length;

    const maxScore = Math.max(businessScore, manufacturingScore, agricultureScore);
    
    if (maxScore > 0) {
      confidence = Math.min(maxScore * 20, 100);
      
      if (businessScore === maxScore) {
        domain = 'business_consulting';
        queryType = 'financial_analysis';
      } else if (manufacturingScore === maxScore) {
        domain = 'manufacturing';
        queryType = 'operational_analysis';
      } else if (agricultureScore === maxScore) {
        domain = 'agriculture';
        queryType = 'farm_management';
      }
    }

    res.json({
      query,
      domain,
      confidence,
      queryType,
      scores: {
        business: businessScore,
        manufacturing: manufacturingScore,
        agriculture: agricultureScore
      }
    });
  } catch (error) {
    console.error('Domain test error:', error);
    res.status(500).json({ error: 'Failed to test domain detection' });
  }
});

export default router;