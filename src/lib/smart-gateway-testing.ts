// Smart Gateway Testing & Validation Framework

import { SmartGatewayIntelligence, type FarmContext } from "./smart-gateway-intelligence";
import { SeasonalAdaptationEngine } from "./seasonal-adaptation";

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  farmContext: FarmContext;
  expectedBehavior: {
    experienceLevel: 'beginner' | 'developing' | 'experienced' | 'expert';
    topPriorityTask: string;
    urgencyRange: [number, number]; // min/max expected urgency scores
    routingDecisions: {
      taskId: string;
      expectedRoute: string;
      reasoning: string;
    }[];
    seasonalAdaptations: string[];
  };
}

export interface TestResult {
  scenarioId: string;
  passed: boolean;
  issues: string[];
  actualBehavior: {
    experienceLevel: string;
    topPriorityTask?: string;
    urgencyScores: number[];
    routingDecisions: {
      taskId: string;
      actualRoute: string;
    }[];
  };
}

export class SmartGatewayTestFramework {
  
  static generateTestScenarios(): TestScenario[] {
    return [
      // SCENARIO 1: Complete Beginner
      {
        id: 'complete-beginner',
        name: 'Complete Beginner - No Farm Data',
        description: 'New user with no animals, paddocks, or assessments',
        farmContext: {
          user: { id: 1, username: 'newbie' },
          animals: [],
          paddocks: [],
          assessments: [],
          tier: 'basic' as const,
          season: 'spring',
          location: { zipCode: '74001' }
        },
        expectedBehavior: {
          experienceLevel: 'beginner',
          topPriorityTask: 'setup',
          urgencyRange: [20, 40],
          routingDecisions: [
            {
              taskId: 'check_animals',
              expectedRoute: '/herd-management',
              reasoning: 'Should route to setup since no animals exist'
            },
            {
              taskId: 'walk_pastures', 
              expectedRoute: '/paddock-management',
              reasoning: 'Should route to paddock setup since no paddocks exist'
            }
          ],
          seasonalAdaptations: ['Focus on foundational setup and education']
        }
      },

      // SCENARIO 2: Small Family Farm
      {
        id: 'small-family-farm',
        name: 'Small Family Farm - Developing',
        description: 'Family farm with moderate livestock and basic setup',
        farmContext: {
          user: { id: 2, username: 'family_farmer' },
          animals: Array(15).fill({}).map((_, i) => ({ id: i + 1, species: 'cattle', earTag: `C${i + 1}` })),
          paddocks: Array(4).fill({}).map((_, i) => ({ id: i + 1, name: `Paddock ${i + 1}`, acreage: 5 })),
          assessments: Array(2).fill({}).map((_, i) => ({ id: i + 1, createdAt: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000) })),
          tier: 'small_business' as const,
          season: 'summer',
          location: { zipCode: '74001', climate: 'temperate' }
        },
        expectedBehavior: {
          experienceLevel: 'developing',
          topPriorityTask: 'check_animals',
          urgencyRange: [60, 80],
          routingDecisions: [
            {
              taskId: 'check_animals',
              expectedRoute: '/livestock-health-breeding',
              reasoning: 'Summer heat management critical for 15 animals'
            },
            {
              taskId: 'plan_rotation',
              expectedRoute: '/enhanced-grazing-calendar', 
              reasoning: 'Systematic rotation needed for 4 paddocks'
            }
          ],
          seasonalAdaptations: ['Balance efficiency with detailed monitoring', 'Summer heat management']
        }
      },

      // SCENARIO 3: Large Commercial Operation
      {
        id: 'large-commercial',
        name: 'Large Commercial Operation - Expert',
        description: 'Large enterprise operation with extensive data',
        farmContext: {
          user: { id: 3, username: 'commercial_ranch' },
          animals: Array(150).fill({}).map((_, i) => ({ id: i + 1, species: 'cattle', earTag: `C${i + 1}` })),
          paddocks: Array(25).fill({}).map((_, i) => ({ id: i + 1, name: `Field ${i + 1}`, acreage: 20 })),
          assessments: Array(12).fill({}).map((_, i) => ({ id: i + 1, createdAt: new Date(Date.now() - i * 14 * 24 * 60 * 60 * 1000) })),
          tier: 'enterprise' as const,
          season: 'fall',
          location: { zipCode: '74001', climate: 'temperate' }
        },
        expectedBehavior: {
          experienceLevel: 'expert',
          topPriorityTask: 'check_animals',
          urgencyRange: [80, 95],
          routingDecisions: [
            {
              taskId: 'check_animals',
              expectedRoute: '/livestock-health-breeding',
              reasoning: 'Large herd requires systematic monitoring and fall prep'
            },
            {
              taskId: 'review_performance',
              expectedRoute: '/financial-management',
              reasoning: 'Enterprise tier gets advanced financial tools'
            }
          ],
          seasonalAdaptations: ['Provide advanced analytics and optimization tools', 'Fall winter preparation']
        }
      },

      // SCENARIO 4: Mixed Farm - Intermediate
      {
        id: 'mixed-farm-intermediate',
        name: 'Mixed Farm - Intermediate Experience',
        description: 'Diversified farm with multiple species and good data',
        farmContext: {
          user: { id: 4, username: 'mixed_farmer' },
          animals: [
            ...Array(30).fill({}).map((_, i) => ({ id: i + 1, species: 'cattle', earTag: `C${i + 1}` })),
            ...Array(40).fill({}).map((_, i) => ({ id: i + 31, species: 'sheep', earTag: `S${i + 1}` }))
          ],
          paddocks: Array(8).fill({}).map((_, i) => ({ id: i + 1, name: `Paddock ${i + 1}`, acreage: 10 })),
          assessments: Array(6).fill({}).map((_, i) => ({ id: i + 1, createdAt: new Date(Date.now() - i * 21 * 24 * 60 * 60 * 1000) })),
          tier: 'small_business' as const,
          season: 'winter',
          location: { zipCode: '74001', climate: 'temperate' }
        },
        expectedBehavior: {
          experienceLevel: 'experienced',
          topPriorityTask: 'check_animals',
          urgencyRange: [75, 90],
          routingDecisions: [
            {
              taskId: 'check_animals',
              expectedRoute: '/livestock-health-breeding',
              reasoning: 'Mixed species (70 animals) need winter monitoring'
            },
            {
              taskId: 'walk_pastures',
              expectedRoute: '/enhanced-pasture-assessment',
              reasoning: 'Regular assessment pattern established'
            }
          ],
          seasonalAdaptations: ['Offer intermediate complexity with growth options', 'Winter welfare monitoring']
        }
      },

      // SCENARIO 5: Data-Rich Hobby Farm
      {
        id: 'hobby-farm-data-rich',
        name: 'Hobby Farm - Data Rich',
        description: 'Small but well-documented hobby operation',
        farmContext: {
          user: { id: 5, username: 'hobby_farmer' },
          animals: Array(8).fill({}).map((_, i) => ({ id: i + 1, species: 'goat', earTag: `G${i + 1}` })),
          paddocks: Array(3).fill({}).map((_, i) => ({ id: i + 1, name: `Paddock ${i + 1}`, acreage: 2 })),
          assessments: Array(8).fill({}).map((_, i) => ({ id: i + 1, createdAt: new Date(Date.now() - i * 14 * 24 * 60 * 60 * 1000) })),
          tier: 'basic' as const,
          season: 'spring',
          location: { zipCode: '74001' }
        },
        expectedBehavior: {
          experienceLevel: 'experienced',
          topPriorityTask: 'walk_pastures',
          urgencyRange: [65, 80],
          routingDecisions: [
            {
              taskId: 'check_animals',
              expectedRoute: '/livestock-health-breeding',
              reasoning: 'Small herd allows individual focus'
            },
            {
              taskId: 'walk_pastures',
              expectedRoute: '/enhanced-pasture-assessment',
              reasoning: 'Regular assessment pattern with good documentation'
            }
          ],
          seasonalAdaptations: ['Focus on building foundational practices', 'Spring growth assessment']
        }
      }
    ];
  }

  static runTestScenario(scenario: TestScenario): TestResult {
    const { farmContext, expectedBehavior } = scenario;
    const issues: string[] = [];

    console.log(`🧪 Running test: ${scenario.name}`);
    console.log('Farm Context:', {
      animals: farmContext.animals.length,
      paddocks: farmContext.paddocks.length,
      assessments: farmContext.assessments.length,
      tier: farmContext.tier,
      season: farmContext.season
    });

    // Test experience detection
    let userExperience: any = null;
    try {
      userExperience = SmartGatewayIntelligence.detectUserExperience(farmContext);
      console.log(`Experience Detection: expected ${expectedBehavior.experienceLevel}, got ${userExperience.level}`);
      console.log('Experience reasoning:', userExperience.reasoning);
      
      if (userExperience.level !== expectedBehavior.experienceLevel) {
        issues.push(`Experience level mismatch: expected ${expectedBehavior.experienceLevel}, got ${userExperience.level}`);
      }
    } catch (error) {
      console.error('Experience detection failed:', error);
      issues.push(`Experience detection failed: ${error.message}`);
    }

    // Test seasonal recommendations
    let intelligentRecs: any[] = [];
    try {
      const seasonalContext = {
        season: farmContext.season as any,
        month: new Date().getMonth() + 1,
        location: farmContext.location,
        farmData: {
          animalCount: farmContext.animals.length,
          paddockCount: farmContext.paddocks.length
        }
      };

      const complexityLevel = SeasonalAdaptationEngine.getUserComplexityLevel(farmContext.user);
      const seasonalRecs = SeasonalAdaptationEngine.generateSeasonalRecommendations(seasonalContext, complexityLevel);
      intelligentRecs = SmartGatewayIntelligence.generateIntelligentRecommendations(farmContext, seasonalRecs);
      
      console.log(`Generated ${intelligentRecs.length} intelligent recommendations`);
    } catch (error) {
      console.error('Seasonal recommendations failed:', error);
      issues.push(`Seasonal recommendations failed: ${error.message}`);
    }

    // Test urgency scoring
    let urgencyScores: number[] = [];
    if (intelligentRecs.length > 0) {
      urgencyScores = intelligentRecs.map(rec => rec.urgencyScore || 0);
      const maxUrgency = Math.max(...urgencyScores);
      const [minExpected, maxExpected] = expectedBehavior.urgencyRange;
      
      console.log(`Urgency scores: [${urgencyScores.join(', ')}], max: ${maxUrgency}, expected range: ${minExpected}-${maxExpected}`);
      
      if (maxUrgency < minExpected || maxUrgency > maxExpected) {
        issues.push(`Urgency score out of range: expected ${minExpected}-${maxExpected}, got max ${maxUrgency}`);
      }
    } else {
      console.log('No intelligent recommendations generated, skipping urgency test');
    }

    // Test routing decisions
    let actualRoutingDecisions: any[] = [];
    try {
      actualRoutingDecisions = expectedBehavior.routingDecisions.map(expected => {
        const actualRoute = SmartGatewayIntelligence.getOptimalRoute(expected.taskId, farmContext);
        
        console.log(`Routing test for ${expected.taskId}: expected ${expected.expectedRoute}, got ${actualRoute}`);
        
        if (actualRoute !== expected.expectedRoute) {
          issues.push(`Routing mismatch for ${expected.taskId}: expected ${expected.expectedRoute}, got ${actualRoute}`);
        }
        
        return {
          taskId: expected.taskId,
          actualRoute
        };
      });
    } catch (error) {
      console.error('Routing test failed:', error);
      issues.push(`Routing test failed: ${error.message}`);
    }

    const result = {
      scenarioId: scenario.id,
      passed: issues.length === 0,
      issues,
      actualBehavior: {
        experienceLevel: userExperience?.level || 'unknown',
        topPriorityTask: intelligentRecs[0]?.taskId || 'none',
        urgencyScores: urgencyScores || [],
        routingDecisions: actualRoutingDecisions
      }
    };

    console.log(`✅ Test ${scenario.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    if (!result.passed) {
      console.log('Issues:', result.issues);
    }
    console.log('---');

    return result;
  }

  static runAllTests(): TestResult[] {
    const scenarios = this.generateTestScenarios();
    return scenarios.map(scenario => this.runTestScenario(scenario));
  }

  static generateTestReport(results: TestResult[]): {
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      passRate: number;
    };
    failures: TestResult[];
    recommendations: string[];
  } {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const failures = results.filter(r => !r.passed);
    
    const recommendations: string[] = [];
    
    // Analyze failure patterns
    const experienceIssues = failures.filter(f => f.issues.some(i => i.includes('Experience level')));
    const urgencyIssues = failures.filter(f => f.issues.some(i => i.includes('Urgency score')));
    const routingIssues = failures.filter(f => f.issues.some(i => i.includes('Routing mismatch')));
    
    if (experienceIssues.length > 0) {
      recommendations.push('Review experience detection algorithm - multiple scenarios failing experience classification');
    }
    
    if (urgencyIssues.length > 0) {
      recommendations.push('Adjust urgency scoring logic - scores not matching expected ranges for farm contexts');
    }
    
    if (routingIssues.length > 0) {
      recommendations.push('Fix smart routing logic - incorrect route assignments for specific farm contexts');
    }
    
    if (passed === results.length) {
      recommendations.push('All tests passing! Consider adding more edge case scenarios');
    }

    return {
      summary: {
        totalTests: results.length,
        passed,
        failed,
        passRate: Math.round((passed / results.length) * 100)
      },
      failures,
      recommendations
    };
  }
}