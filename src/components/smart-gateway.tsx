import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { getToolRoute, getToolName } from "@/lib/tool-mapping";
import { 
  Home, AlertCircle, BarChart3, Clock, BookOpen, Target, 
  ArrowRight, Calendar, Thermometer, Droplets, Camera, 
  Calculator, Users, MapPin, Heart, TrendingUp, Zap,
  CheckCircle, Wrench, DollarSign, Sun, AlertTriangle,
  Sparkles, ChevronRight
} from "lucide-react";

interface UserTool {
  id: number;
  toolId: number;
  isActive: boolean;
  complexityLevel: string;
  usageCount: number;
  lastUsedAt: string | null;
}

interface SmartGatewayProps {
  onNavigate: (path: string) => void;
  farmStats: any;
  userTools: UserTool[];
  onboardingData: any;
}

interface EntryOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  priority: number;
  routes: Array<{
    condition: (context: any) => boolean;
    path: string;
    reason: string;
  }>;
}

interface QuestionFlow {
  id: string;
  question: string;
  options: Array<{
    label: string;
    value: string;
    routes: Array<{
      condition: (context: any) => boolean;
      path: string;
      reason: string;
    }>;
  }>;
}

export default function SmartGateway({ onNavigate, farmStats, userTools, onboardingData }: SmartGatewayProps) {
  const { user } = useAuth();
  const [showQuestionFlow, setShowQuestionFlow] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [currentSeason, setCurrentSeason] = useState<string>("");
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<string>("");

  // Detect current context
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth();
    const hour = now.getHours();

    // Seasonal detection
    if (month >= 2 && month <= 4) setCurrentSeason("spring");
    else if (month >= 5 && month <= 7) setCurrentSeason("summer");
    else if (month >= 8 && month <= 10) setCurrentSeason("fall");
    else setCurrentSeason("winter");

    // Time of day detection
    if (hour >= 5 && hour < 12) setCurrentTimeOfDay("morning");
    else if (hour >= 12 && hour < 17) setCurrentTimeOfDay("afternoon");
    else if (hour >= 17 && hour < 21) setCurrentTimeOfDay("evening");
    else setCurrentTimeOfDay("night");
  }, []);

  // User experience level and tier detection
  const getUserExperienceLevel = () => {
    const toolUsage = userTools.filter(t => t.isActive).length;
    const hasCompletedAssessments = farmStats.lastAssessment !== null;
    const hasCompleteSetup = farmStats.totalAnimals > 0 && farmStats.totalPaddocks > 0;

    if (toolUsage >= 10 && hasCompletedAssessments && hasCompleteSetup) return "advanced";
    if (toolUsage >= 5 && (hasCompletedAssessments || hasCompleteSetup)) return "intermediate";
    return "beginner";
  };

  // Farm tier detection (Basic/Homesteader → Small Business → Enterprise → Government)
  const getFarmTier = () => {
    const totalAnimals = farmStats.totalAnimals;
    const totalAcreage = farmStats.totalAcreage;
    const advancedToolsCount = userTools.filter(t => 
      t.isActive && [19, 20, 21, 22].includes(t.toolId)
    ).length;

    if (totalAnimals > 500 || totalAcreage > 1000 || advancedToolsCount >= 3) return "enterprise";
    if (totalAnimals > 100 || totalAcreage > 200 || advancedToolsCount >= 1) return "small-business";
    return "homesteader";
  };

  // Workflow Templates based on persona and season
  const getWorkflowTemplates = () => {
    const season = currentSeason;
    const tier = getFarmTier();
    const persona = onboardingData?.detectedPersona?.name?.toLowerCase() || "unknown";
    
    const templates = [];

    // Seasonal workflow templates
    if (season === "spring") {
      templates.push({
        id: "spring-startup",
        title: "Spring Rotation Startup",
        description: "Begin grazing season with pasture assessment and planning",
        tools: [9, 17, 6], // Pasture Assessment → Grazing Calendar → DM Availability
        estimatedTime: "45-60 minutes"
      });
    }

    if (season === "summer") {
      templates.push({
        id: "summer-optimization",
        title: "Summer Heat Management",
        description: "Optimize water, nutrition, and heat stress monitoring",
        tools: [7, 15, 16], // Water Requirements → Weather → Alerts
        estimatedTime: "30-45 minutes"
      });
    }

    // Persona-specific templates
    if (persona.includes("commercial") || tier === "enterprise") {
      templates.push({
        id: "profit-optimization",
        title: "Profit Optimization Review",
        description: "Financial analysis and performance optimization",
        tools: [19, 12, 24], // Financial → Performance → Analytics
        estimatedTime: "60-90 minutes"
      });
    }

    if (persona.includes("regenerative") || persona.includes("academic")) {
      templates.push({
        id: "soil-carbon-analysis",
        title: "Regenerative Impact Assessment",
        description: "Soil health and carbon sequestration tracking",
        tools: [20, 9, 11], // Soil Health → Pasture Assessment → Nutritional Analysis
        estimatedTime: "75-120 minutes"
      });
    }

    return templates.slice(0, 3); // Limit to 3 most relevant templates
  };

  // Adaptive Clustering - learns from user patterns
  const getAdaptiveClusters = () => {
    const recentlyUsedTools = userTools
      .filter(t => t.lastUsedAt && t.isActive)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
      .slice(0, 6);

    const frequentlyUsedTools = userTools
      .filter(t => t.isActive && t.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 6);

    return {
      recent: recentlyUsedTools,
      frequent: frequentlyUsedTools,
      suggested: getSmartSuggestions()
    };
  };

  // Cross-Category Bridge Tools - tools that connect multiple categories
  const getCrossCategoryBridges = () => {
    const bridgeTools = [
      { toolId: 24, categories: ["analysis", "planning", "monitoring"], priority: "high" },
      { toolId: 16, categories: ["monitoring", "livestock", "pasture"], priority: "high" },
      { toolId: 11, categories: ["nutrition", "assessment", "planning"], priority: "medium" },
      { toolId: 12, categories: ["performance", "financial", "monitoring"], priority: "medium" },
      { toolId: 15, categories: ["monitoring", "planning", "alerts"], priority: "medium" }
    ];

    return bridgeTools.filter(bridge => 
      userTools.some(t => t.toolId === bridge.toolId && t.isActive)
    );
  };

  // Smart suggestions based on context and patterns
  const getSmartSuggestions = () => {
    const context = getContext();
    const suggestions = [];

    // Time-based suggestions
    if (context.timeOfDay === "morning") {
      suggestions.push({
        toolId: 7,
        reason: "Morning water check recommended",
        confidence: 0.8
      });
    }

    // Season-based suggestions
    if (context.season === "summer" && !context.activeTools.find(t => t.toolId === 15)) {
      suggestions.push({
        toolId: 15,
        reason: "Summer heat monitoring critical",
        confidence: 0.9
      });
    }

    // Farm status suggestions
    if (!context.hasAssessments && context.hasPaddocks) {
      suggestions.push({
        toolId: 9,
        reason: "Initial pasture assessment needed",
        confidence: 0.95
      });
    }

    return suggestions.slice(0, 3);
  };

  // Smart context for routing decisions
  const getContext = () => ({
    user,
    userLevel: getUserExperienceLevel(),
    season: currentSeason,
    timeOfDay: currentTimeOfDay,
    farmStats,
    activeTools: userTools.filter(t => t.isActive),
    hasAnimals: farmStats.totalAnimals > 0,
    hasPaddocks: farmStats.totalPaddocks > 0,
    hasAssessments: farmStats.lastAssessment !== null,
    isNewUser: !onboardingData?.completed,
    persona: onboardingData?.detectedPersona?.name || "unknown"
  });

  // Entry options with intelligent routing
  const entryOptions: EntryOption[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Set up your farm profile and essential tools",
      icon: Home,
      priority: 1,
      routes: [
        {
          condition: (ctx) => ctx.isNewUser || ctx.activeTools.length === 0,
          path: "/onboarding",
          reason: "Complete farm setup first"
        },
        {
          condition: (ctx) => !ctx.hasAnimals && !ctx.hasPaddocks,
          path: "/getting-started-assistant",
          reason: "Set up basic farm data"
        },
        {
          condition: (ctx) => ctx.userLevel === "beginner",
          path: "/getting-started-assistant",
          reason: "Guided farm setup assistance"
        },
        {
          condition: () => true,
          path: "/tools",
          reason: "Explore additional tools"
        }
      ]
    },
    {
      id: "help-now",
      title: "I Need Help Now",
      description: "Urgent situations and immediate assistance",
      icon: AlertCircle,
      priority: 1,
      routes: [
        {
          condition: () => true,
          path: "question-flow:urgent",
          reason: "Determine urgent issue type"
        }
      ]
    },
    {
      id: "check-farm",
      title: "Check My Farm",
      description: "Review current status and performance",
      icon: BarChart3,
      priority: 2,
      routes: [
        {
          condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 24),
          path: "/analytics",
          reason: "View comprehensive analytics"
        },
        {
          condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 16),
          path: "/unified-alert-dashboard",
          reason: "Check alerts and notifications"
        },
        {
          condition: (ctx) => ctx.hasPaddocks && ctx.hasAnimals,
          path: "/performance-analytics",
          reason: "Review farm performance"
        },
        {
          condition: () => true,
          path: "/dashboard",
          reason: "View dashboard overview"
        }
      ]
    },
    {
      id: "daily-tasks",
      title: "Quick Daily Tasks",
      description: "Essential daily farm management",
      icon: Clock,
      priority: 1,
      routes: [
        {
          condition: (ctx) => ctx.timeOfDay === "morning" && ctx.activeTools.some((t: UserTool) => t.toolId === 7),
          path: "/water-requirements",
          reason: "Morning water check"
        },
        {
          condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 13),
          path: "/daily-needs",
          reason: "Daily nutrition calculator"
        },
        {
          condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 17),
          path: "/enhanced-grazing-calendar",
          reason: "Check rotation schedule"
        },
        {
          condition: () => true,
          path: "question-flow:daily",
          reason: "Find appropriate daily task"
        }
      ]
    },
    {
      id: "learn",
      title: "I Want to Learn",
      description: "Educational content and skill building",
      icon: BookOpen,
      priority: 3,
      routes: [
        {
          condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 23),
          path: "/educational-content",
          reason: "Access learning resources"
        },
        {
          condition: (ctx) => ctx.userLevel === "beginner",
          path: "/getting-started-assistant",
          reason: "Start with guided tutorials"
        },
        {
          condition: () => true,
          path: "question-flow:learning",
          reason: "Find learning path"
        }
      ]
    },
    {
      id: "goal",
      title: "I Have a Goal",
      description: "Achieve specific farm objectives",
      icon: Target,
      priority: 2,
      routes: [
        {
          condition: () => true,
          path: "question-flow:goal",
          reason: "Identify specific goal"
        }
      ]
    }
  ];

  // Question flows for complex routing
  const questionFlows: Record<string, QuestionFlow> = {
    urgent: {
      id: "urgent",
      question: "What type of urgent situation are you dealing with?",
      options: [
        {
          label: "Animal health emergency",
          value: "animal-health",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 18),
              path: "/livestock-health-breeding",
              reason: "Access health management tools"
            },
            {
              condition: () => true,
              path: "/unified-alert-dashboard",
              reason: "Check health alerts"
            }
          ]
        },
        {
          label: "Severe weather warning",
          value: "weather",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 15),
              path: "/weather-integration",
              reason: "Weather monitoring and alerts"
            },
            {
              condition: () => true,
              path: "/water-requirements",
              reason: "Check water needs for weather"
            }
          ]
        },
        {
          label: "Financial crisis/cash flow",
          value: "financial",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 19),
              path: "/financial-management",
              reason: "Financial analysis tools"
            },
            {
              condition: () => true,
              path: "/feed-supplement-calculator",
              reason: "Reduce feed costs"
            }
          ]
        },
        {
          label: "Equipment/infrastructure failure",
          value: "equipment",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 21),
              path: "/infrastructure-equipment",
              reason: "Equipment management"
            },
            {
              condition: () => true,
              path: "/unified-alert-dashboard",
              reason: "Set up monitoring alerts"
            }
          ]
        },
        {
          label: "Pasture degradation",
          value: "pasture",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 9),
              path: "/enhanced-pasture-assessment",
              reason: "Assess pasture condition"
            },
            {
              condition: () => true,
              path: "/dm-availability",
              reason: "Check dry matter availability"
            }
          ]
        }
      ]
    },
    daily: {
      id: "daily",
      question: "What daily task do you need help with?",
      options: [
        {
          label: "Water and nutrition needs",
          value: "water-nutrition",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 7),
              path: "/water-requirements",
              reason: "Calculate water needs"
            },
            {
              condition: () => true,
              path: "/feed-supplement-calculator",
              reason: "Nutrition planning"
            }
          ]
        },
        {
          label: "Herd movement planning",
          value: "movement",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 17),
              path: "/enhanced-grazing-calendar",
              reason: "Rotation scheduling"
            },
            {
              condition: () => true,
              path: "/dm-availability",
              reason: "Assess paddock readiness"
            }
          ]
        },
        {
          label: "Health monitoring",
          value: "health",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 18),
              path: "/livestock-health-breeding",
              reason: "Health tracking"
            },
            {
              condition: () => true,
              path: "/unified-alert-dashboard",
              reason: "Check health alerts"
            }
          ]
        },
        {
          label: "Performance tracking",
          value: "performance",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 12),
              path: "/performance-analytics",
              reason: "Performance monitoring"
            },
            {
              condition: () => true,
              path: "/analytics",
              reason: "Farm analytics"
            }
          ]
        }
      ]
    },
    learning: {
      id: "learning",
      question: "What would you like to learn about?",
      options: [
        {
          label: "Rotational grazing basics",
          value: "grazing-basics",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 23),
              path: "/educational-content",
              reason: "Structured learning content"
            },
            {
              condition: () => true,
              path: "/enhanced-pasture-assessment",
              reason: "Hands-on pasture assessment"
            }
          ]
        },
        {
          label: "Livestock nutrition",
          value: "nutrition",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 11),
              path: "/nutritional-analysis",
              reason: "Nutrition analysis tools"
            },
            {
              condition: () => true,
              path: "/feed-supplement-calculator",
              reason: "Practical nutrition planning"
            }
          ]
        },
        {
          label: "Farm financial management",
          value: "financial",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 19),
              path: "/financial-management",
              reason: "Financial planning tools"
            },
            {
              condition: () => true,
              path: "/performance-analytics",
              reason: "Financial performance tracking"
            }
          ]
        },
        {
          label: "Technology and tools",
          value: "technology",
          routes: [
            {
              condition: () => true,
              path: "/tools",
              reason: "Explore available tools"
            }
          ]
        }
      ]
    },
    goal: {
      id: "goal",
      question: "What is your primary goal?",
      options: [
        {
          label: "Increase profitability",
          value: "profit",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 19),
              path: "/financial-management",
              reason: "Financial optimization"
            },
            {
              condition: () => true,
              path: "/performance-analytics",
              reason: "Profit analysis"
            }
          ]
        },
        {
          label: "Improve animal health",
          value: "health",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 18),
              path: "/livestock-health-breeding",
              reason: "Health management"
            },
            {
              condition: () => true,
              path: "/nutritional-analysis",
              reason: "Nutrition optimization"
            }
          ]
        },
        {
          label: "Optimize grazing efficiency",
          value: "efficiency",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 17),
              path: "/enhanced-grazing-calendar",
              reason: "Rotation optimization"
            },
            {
              condition: () => true,
              path: "/enhanced-pasture-assessment",
              reason: "Pasture efficiency assessment"
            }
          ]
        },
        {
          label: "Reduce workload and stress",
          value: "automation",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 16),
              path: "/alert-system",
              reason: "Automated monitoring"
            },
            {
              condition: () => true,
              path: "/tools",
              reason: "Automation tools"
            }
          ]
        },
        {
          label: "Learn and improve skills",
          value: "learning",
          routes: [
            {
              condition: (ctx) => ctx.activeTools.some((t: UserTool) => t.toolId === 23),
              path: "/educational-content",
              reason: "Educational resources"
            },
            {
              condition: () => true,
              path: "/getting-started-assistant",
              reason: "Guided learning"
            }
          ]
        }
      ]
    }
  };

  const handleEntrySelection = (option: EntryOption) => {
    const context = getContext();
    
    // Find the best route based on current context
    const bestRoute = option.routes.find(route => route.condition(context));
    
    if (!bestRoute) return;

    if (bestRoute.path.startsWith("question-flow:")) {
      const flowId = bestRoute.path.split(":")[1];
      setShowQuestionFlow(flowId);
    } else {
      onNavigate(bestRoute.path);
    }
  };

  const handleQuestionAnswer = (flowId: string, optionValue: string) => {
    const flow = questionFlows[flowId];
    const option = flow.options.find(opt => opt.value === optionValue);
    const context = getContext();

    if (option) {
      const bestRoute = option.routes.find(route => route.condition(context));
      if (bestRoute) {
        setShowQuestionFlow(null);
        onNavigate(bestRoute.path);
      }
    }
  };

  // Sort options by priority and context relevance
  const sortedOptions = entryOptions.sort((a, b) => {
    const context = getContext();
    
    // Priority first
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // Context relevance (if first route condition matches, higher relevance)
    const aRelevant = a.routes[0]?.condition(context) || false;
    const bRelevant = b.routes[0]?.condition(context) || false;
    
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;
    
    return 0;
  });

  const currentFlow = showQuestionFlow ? questionFlows[showQuestionFlow] : null;
  const workflowTemplates = getWorkflowTemplates();
  const adaptiveClusters = getAdaptiveClusters();
  const bridgeTools = getCrossCategoryBridges();
  const context = getContext();

  return (
    <div className="smart-gateway space-y-6">
      {/* Farm Context Bar */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="capitalize">
              {context.userLevel} • {getFarmTier()}
            </Badge>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {currentSeason} • {currentTimeOfDay}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {context.activeTools.length} tools active
          </div>
        </div>
      </div>

      {/* Workflow Templates */}
      {workflowTemplates.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-green-600" />
            Recommended Workflows
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {workflowTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow border border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {template.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {template.estimatedTime}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    {template.tools.length} tools in sequence
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Smart Recommendations */}
      {adaptiveClusters.suggested.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
            Smart Recommendations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {adaptiveClusters.suggested.map((suggestion, index) => (
              <Alert key={index} className="border border-blue-200 dark:border-blue-800">
                <AlertDescription className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{suggestion.reason}</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Main Entry Options */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          How can we help you today?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedOptions.map((option) => {
            const bestRoute = option.routes.find(route => route.condition(context));
            
            return (
              <Card 
                key={option.id}
                className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
                onClick={() => handleEntrySelection(option)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <option.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {option.description}
                      </p>
                      {bestRoute && (
                        <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {bestRoute.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cross-Category Bridge Tools */}
      {bridgeTools.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-purple-600" />
            Quick Cross-Tool Access
          </h3>
          <div className="flex flex-wrap gap-2">
            {bridgeTools.map((bridge) => (
              <Badge 
                key={bridge.toolId}
                variant="outline" 
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  bridge.priority === 'high' ? 'border-purple-300 text-purple-700' : 'border-gray-300'
                }`}
                onClick={() => onNavigate(getToolRoute(bridge.toolId))}
              >
                {getToolName(bridge.toolId)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Access */}
      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => onNavigate("/tools")}
        >
          <Wrench className="h-4 w-4 mr-2" />
          Advanced Tool Access
        </Button>
      </div>

      {/* Question Flow Dialog */}
      <Dialog open={!!showQuestionFlow} onOpenChange={() => setShowQuestionFlow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <span>Find the Right Tool</span>
            </DialogTitle>
          </DialogHeader>
          
          {currentFlow && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {currentFlow.question}
              </p>
              
              <div className="space-y-2">
                {currentFlow.options.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => handleQuestionAnswer(currentFlow.id, option.value)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}