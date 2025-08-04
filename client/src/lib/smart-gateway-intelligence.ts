// Smart Gateway Intelligence Engine - Context-Aware Routing and Recommendations

import type { SeasonalContext, SeasonalRecommendation, ComplexityLevel } from "./seasonal-adaptation";

export interface FarmContext {
  user: any;
  animals: any[];
  paddocks: any[];
  assessments: any[];
  tier: 'free' | 'basic' | 'small_farm' | 'small_business' | 'professional' | 'enterprise';
  season: string;
  location?: {
    zipCode?: string;
    gpsCoords?: { lat: number; lng: number };
    climate?: string;
  };
}

export interface IntelligentRecommendation extends SeasonalRecommendation {
  contextualReasoning: string;
  urgencyScore: number; // 0-100
  farmSpecificData?: {
    animalCount?: number;
    paddockStatus?: string;
    lastAssessment?: string;
    weatherRisk?: string;
  };
  adaptedForContext: string[];
}

export class SmartGatewayIntelligence {
  
  static generateIntelligentRecommendations(
    farmContext: FarmContext,
    seasonalRecommendations: SeasonalRecommendation[]
  ): IntelligentRecommendation[] {
    return seasonalRecommendations.map(rec => 
      this.enhanceWithContext(rec, farmContext)
    ).sort((a, b) => b.urgencyScore - a.urgencyScore);
  }

  private static enhanceWithContext(
    rec: SeasonalRecommendation, 
    context: FarmContext
  ): IntelligentRecommendation {
    const enhanced: IntelligentRecommendation = {
      ...rec,
      contextualReasoning: this.generateContextualReasoning(rec, context),
      urgencyScore: this.calculateUrgencyScore(rec, context),
      farmSpecificData: this.extractFarmSpecificData(context),
      adaptedForContext: this.getContextualAdaptations(rec, context)
    };

    // Dynamic priority adjustment based on context
    enhanced.priority = this.adjustPriorityForContext(rec.priority, context);
    
    return enhanced;
  }

  private static generateContextualReasoning(
    rec: SeasonalRecommendation,
    context: FarmContext
  ): string {
    const { animals, paddocks, assessments, tier, season } = context;
    const reasons: string[] = [];

    // Animal-based reasoning
    if (rec.taskId === 'check_animals') {
      if (animals.length === 0) {
        reasons.push("No animals recorded - set up livestock tracking first");
      } else if (animals.length > 50) {
        reasons.push(`Managing ${animals.length} animals requires systematic monitoring`);
      } else {
        reasons.push(`${animals.length} animals need ${season} health assessment`);
      }
    }

    // Paddock-based reasoning
    if (rec.taskId === 'walk_pastures') {
      if (paddocks.length === 0) {
        reasons.push("No paddocks mapped - field boundaries needed for planning");
      } else if (paddocks.length > 10) {
        reasons.push(`${paddocks.length} paddocks require systematic rotation management`);
      } else {
        reasons.push(`${paddocks.length} fields ready for ${season} assessment`);
      }
    }

    // Assessment history reasoning
    if (assessments.length === 0) {
      reasons.push("No baseline data - initial assessment critical for planning");
    } else {
      const lastAssessment = new Date(assessments[0]?.createdAt || 0);
      const daysSince = Math.floor((Date.now() - lastAssessment.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 30) {
        reasons.push(`Last assessment ${daysSince} days ago - update needed`);
      }
    }

    // Tier-specific reasoning
    if (tier === 'enterprise') {
      reasons.push("Enterprise operations require precise data for optimization");
    } else if (tier === 'professional') {
      reasons.push("Professional operations require advanced analytics and precision monitoring");
    } else if (tier === 'small_business' || tier === 'small_farm') {
      reasons.push("Growing operation needs systematic management approach");
    } else {
      reasons.push("Foundation building phase - establish good practices");
    }

    return reasons.join('. ') || rec.seasonalReasoning;
  }

  private static calculateUrgencyScore(
    rec: SeasonalRecommendation,
    context: FarmContext
  ): number {
    // Base score varies by tier
    let score = context.tier === 'free' || context.tier === 'basic' ? 30 : 
                context.tier === 'small_farm' || context.tier === 'small_business' ? 70 : 
                context.tier === 'professional' ? 85 :
                90; // enterprise

    // Priority weight (reduced to prevent overflow)
    const priorityWeights = {
      'critical': 10,
      'high': 5,
      'medium': 0,
      'low': -5
    };
    score += priorityWeights[rec.priority];

    // Context-based adjustments
    const { animals, paddocks, assessments } = context;
    
    // For beginners with no data, keep scores in 20-40 range
    if (animals.length === 0 && paddocks.length === 0) {
      // Complete beginners get low-medium urgency
      score = 30;
      if (rec.taskId.includes('setup')) {
        score += 5;
      }
      return Math.max(20, Math.min(40, score));
    }
    
    // Scale-based adjustments (smaller increments)
    if (animals.length >= 100) {
      score += 5; // Large farms already have high base
    } else if (animals.length >= 50) {
      score += 3;
    }
    
    // Task-specific adjustments
    if (rec.taskId === 'check_animals' && context.season === 'summer') {
      score += 5; // Heat stress concern
    }
    if (rec.taskId === 'review_performance' && animals.length >= 100) {
      score += 5; // Performance critical for large farms
    }

    // Missing data reduces urgency
    if (animals.length === 0 && rec.taskId === 'check_animals') {
      score -= 20;
    }
    if (paddocks.length === 0 && rec.taskId === 'walk_pastures') {
      score -= 15;
    }

    // Assessment history - boost for data-rich farms
    if (assessments.length >= 8) {
      score += 20; // Significant boost for data-rich farms
    } else if (assessments.length >= 5) {
      score += 10;
    } else if (assessments.length === 0 && animals.length > 0) {
      score += 5;
    }

    // Special case for data-rich basic tier farms
    if (context.tier === 'basic' && assessments.length >= 8) {
      // Data-rich hobby farms get higher base urgency
      score = Math.max(score, 65);
    }

    // Apply tier-specific caps
    if (context.tier === 'basic') {
      return Math.max(20, Math.min(80, score));
    } else if (context.tier === 'small_business') {
      return Math.max(60, Math.min(80, score));
    } else { // enterprise
      return Math.max(80, Math.min(95, score));
    }
  }

  private static extractFarmSpecificData(context: FarmContext) {
    const { animals, paddocks, assessments } = context;
    
    return {
      animalCount: animals.length,
      paddockStatus: paddocks.length > 0 ? `${paddocks.length} mapped` : 'None mapped',
      lastAssessment: assessments.length > 0 
        ? `${Math.floor((Date.now() - new Date(assessments[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`
        : 'Never',
      weatherRisk: this.getWeatherRisk(context)
    };
  }

  private static getWeatherRisk(context: FarmContext): string {
    const month = new Date().getMonth() + 1;
    const season = context.season;
    
    // Summer heat risk
    if (season === 'summer') return 'Heat stress monitoring critical';
    // Winter cold risk  
    if (season === 'winter') return 'Cold protection needed';
    // Spring flooding risk
    if (season === 'spring') return 'Monitor soil conditions';
    // Fall prep risk
    if (season === 'fall') return 'Winter preparation time';
    
    return 'Normal conditions';
  }

  private static getContextualAdaptations(
    rec: SeasonalRecommendation,
    context: FarmContext
  ): string[] {
    const adaptations: string[] = [];
    const { animals, paddocks, tier } = context;

    // Scale adaptations
    if (animals.length > 100) {
      adaptations.push("Use systematic sampling methods for large herd");
    } else if (animals.length < 10) {
      adaptations.push("Individual animal focus practical for small herd");
    }

    // Technology adaptations
    if (tier === 'enterprise') {
      adaptations.push("Leverage precision technology and data analytics");
    } else if (tier === 'professional') {
      adaptations.push("Utilize advanced analytics and precision monitoring tools");
    } else if (tier === 'small_business' || tier === 'small_farm') {
      adaptations.push("Balance efficiency with detailed monitoring");
    } else {
      adaptations.push("Focus on building foundational practices");
    }

    // Infrastructure adaptations
    if (paddocks.length > 20) {
      adaptations.push("Implement zone-based management approach");
    } else if (paddocks.length === 0) {
      adaptations.push("Start with boundary mapping before detailed assessment");
    }

    return adaptations;
  }

  private static adjustPriorityForContext(
    originalPriority: 'critical' | 'high' | 'medium' | 'low',
    context: FarmContext
  ): 'critical' | 'high' | 'medium' | 'low' {
    const { animals, paddocks, season } = context;

    // Upgrade priority if no farm data exists
    if (animals.length === 0 && paddocks.length === 0) {
      if (originalPriority === 'medium') return 'high';
      if (originalPriority === 'low') return 'medium';
    }

    // Summer heat management always critical
    if (season === 'summer' && originalPriority === 'high') {
      return 'critical';
    }

    return originalPriority;
  }

  // Gateway routing intelligence




  // Experience Detection System
  static detectUserExperience(farmContext: FarmContext): {
    level: 'beginner' | 'developing' | 'experienced' | 'expert';
    confidence: number;
    reasoning: string[];
  } {
    const reasoning: string[] = [];
    let score = 0;

    // No data = beginner
    if (farmContext.animals.length === 0 && farmContext.paddocks.length === 0) {
      reasoning.push('No farm data recorded yet');
      return {
        level: 'beginner',
        confidence: 1.0,
        reasoning
      };
    }

    // Basic data indicators
    const hasAnimals = farmContext.animals.length > 0;
    const hasPaddocks = farmContext.paddocks.length > 0;
    const hasAssessments = farmContext.assessments.length > 0;

    if (hasAnimals) {
      score += 10;
      reasoning.push(`Has ${farmContext.animals.length} animals recorded`);
    }

    if (hasPaddocks) {
      score += 10;
      reasoning.push(`Has ${farmContext.paddocks.length} paddocks mapped`);
    }

    if (hasAssessments) {
      score += 20;
      reasoning.push(`Has ${farmContext.assessments.length} assessments completed`);
    }

    // Scale and complexity scoring
    const totalAnimals = farmContext.animals.length;
    const totalPaddocks = farmContext.paddocks.length;
    const totalAssessments = farmContext.assessments.length;

    // Animal scale scoring
    if (totalAnimals >= 100) {
      score += 30;
      reasoning.push('Large-scale operation (100+ animals)');
    } else if (totalAnimals >= 50) {
      score += 20;
      reasoning.push('Medium-large operation (50+ animals)');
    } else if (totalAnimals >= 15) {
      score += 10;
      reasoning.push('Small-medium operation (15+ animals)');
    }

    // Paddock complexity scoring
    if (totalPaddocks >= 15) {
      score += 20;
      reasoning.push('Complex paddock system (15+ paddocks)');
    } else if (totalPaddocks >= 8) {
      score += 10;
      reasoning.push('Moderate paddock system (8+ paddocks)');
    }

    // Assessment history scoring - weighted more heavily for experience
    if (totalAssessments >= 10) {
      score += 30;
      reasoning.push('Extensive assessment history (10+ assessments)');
    } else if (totalAssessments >= 8) {
      score += 25;
      reasoning.push('Strong assessment history (8+ assessments)');
    } else if (totalAssessments >= 5) {
      score += 15;
      reasoning.push('Regular assessment history (5+ assessments)');
    }

    // Determine experience level based on score - more conservative thresholds
    let level: 'beginner' | 'developing' | 'experienced' | 'expert';
    if (score >= 90) {
      level = 'expert';
    } else if (score >= 60) {
      level = 'experienced';
    } else if (score >= 30) {
      level = 'developing';
    } else {
      level = 'beginner';
    }

    return {
      level,
      confidence: Math.min(score / 100, 1.0),
      reasoning
    };
  }

  // Smart Routing System
  static getOptimalRoute(taskId: string, farmContext: FarmContext): string {
    const experience = this.detectUserExperience(farmContext);
    const hasData = farmContext.animals.length > 0 || farmContext.paddocks.length > 0;

    // Route mapping based on task and context
    const routeMap: { [key: string]: { [key: string]: string } } = {
      'check_animals': {
        'no_data': '/herd-management',
        'beginner': '/herd-management', 
        'developing': '/livestock-health-breeding',
        'experienced': '/livestock-health-breeding',
        'expert': '/livestock-health-breeding'
      },
      'walk_pastures': {
        'no_data': '/paddock-management',
        'beginner': '/paddock-management',
        'developing': '/paddock-management',
        'experienced': '/paddock-management',
        'expert': '/paddock-management'
      },
      'plan_rotation': {
        'no_data': '/paddock-management',
        'beginner': '/enhanced-grazing-calendar',
        'developing': '/enhanced-grazing-calendar',
        'experienced': '/enhanced-grazing-calendar',
        'expert': '/enhanced-grazing-calendar'
      },
      'check_weather': {
        'no_data': '/weather-integration',
        'beginner': '/weather-integration',
        'developing': '/weather-integration', 
        'experienced': '/weather-integration',
        'expert': '/weather-integration'
      },
      'record_data': {
        'no_data': '/herd-management',
        'beginner': '/analytics-hub',
        'developing': '/analytics-hub',
        'experienced': '/performance-analytics',
        'expert': '/performance-analytics'
      },
      'review_performance': {
        'no_data': '/analytics-hub',
        'beginner': '/analytics-hub',
        'developing': '/performance-analytics',
        'experienced': '/performance-analytics',
        'expert': '/financial-management'
      },
      'quick_calc': {
        'no_data': '/au-calculator',
        'beginner': '/au-calculator',
        'developing': farmContext.tier === 'professional' || farmContext.tier === 'enterprise' ? '/financial-management' : '/au-calculator',
        'experienced': farmContext.tier === 'professional' || farmContext.tier === 'enterprise' ? '/financial-management' : '/feed-supplement-calculator',
        'expert': farmContext.tier === 'professional' || farmContext.tier === 'enterprise' ? '/financial-management' : '/feed-supplement-calculator'
      },
      'track_performance': {
        'no_data': '/livestock-health-breeding',
        'beginner': '/livestock-health-breeding',
        'developing': farmContext.tier === 'professional' || farmContext.tier === 'enterprise' ? '/performance-analytics' : '/livestock-health-breeding',
        'experienced': farmContext.tier === 'professional' || farmContext.tier === 'enterprise' ? '/performance-analytics' : '/livestock-health-breeding',
        'expert': farmContext.tier === 'professional' || farmContext.tier === 'enterprise' ? '/performance-analytics' : '/livestock-health-breeding'
      }
    };

    // Determine context key
    const contextKey = !hasData ? 'no_data' : experience.level;
    
    // Get route or fallback to basic tool
    return routeMap[taskId]?.[contextKey] || '/tools';
  }
}