import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { 
  Sun, Cloud, Clock, Calendar, MapPin, Heart,
  TrendingUp, AlertCircle, Users, Droplets, 
  Calculator, ClipboardCheck, BarChart3,
  CheckCircle, ArrowRight, X, Target, HelpCircle
} from "lucide-react";
import { useWorkflowTracking } from "@/hooks/useWorkflowTracking";

import { SeasonalAdaptationEngine, type SeasonalContext } from "@/lib/seasonal-adaptation";
import { SeasonalBadge } from "@/components/seasonal-badge";
import { SmartGatewayIntelligence, type FarmContext } from "@/lib/smart-gateway-intelligence";


import { SmartGatewayTutorial } from "@/components/smart-gateway-tutorial";
import { SmartGatewayTooltips } from "@/components/smart-gateway-tooltips";

import { useWorkflowProgress, WORKFLOW_TEMPLATES } from "@/hooks/useWorkflowProgress";

// Helper function to get tier-appropriate descriptions
const getTierDescription = (entry: string, tier: string) => {
  const descriptions = {
    "check_animals": {
      "free": "Track herd groups and basic health",
      "basic": "Track herd groups and basic health",
      "small_farm": "Individual tracking, health records, breeding management",
      "small_business": "Individual tracking, health records, breeding management",
      "professional": "Advanced analytics, health monitoring, genetic optimization, AI-powered insights",
      "enterprise": "Advanced analytics, health monitoring, genetic optimization, AI-powered insights"
    },
    "walk_pastures": {
      "free": "Simple paddock mapping with GPS",
      "basic": "Simple paddock mapping with GPS",
      "small_farm": "Professional assessment tools, quality analysis",
      "small_business": "Professional assessment tools, quality analysis",
      "professional": "Scientific methodology, precision GPS, advanced statistical analysis, professional reporting",
      "enterprise": "Scientific methodology, precision GPS, advanced statistical analysis, professional reporting"
    },
    "plan_rotation": {
      "free": "Simple grazing schedule planning",
      "basic": "Simple grazing schedule planning",
      "small_farm": "Smart rotation optimization, weather integration",
      "small_business": "Smart rotation optimization, weather integration", 
      "professional": "AI-powered scheduling, predictive modeling, automation, multi-variable optimization",
      "enterprise": "AI-powered scheduling, predictive modeling, automation, multi-variable optimization"
    },
    "track_performance": {
      "free": "Basic growth tracking and notes",
      "basic": "Basic growth tracking and notes",
      "small_farm": "Performance analytics, ROI tracking, optimization",
      "small_business": "Performance analytics, ROI tracking, optimization",
      "professional": "Advanced benchmarking, predictive modeling, market intelligence, correlation analysis",
      "enterprise": "Advanced benchmarking, predictive modeling, market intelligence, correlation analysis"
    },
    "check_weather": {
      "free": "Current conditions and basic forecasts",
      "basic": "Current conditions and basic forecasts",
      "small_farm": "Agricultural impact analysis, alerts",
      "small_business": "Agricultural impact analysis, alerts",
      "professional": "Precision weather data, climate modeling, risk analysis, agricultural impact scoring",
      "enterprise": "Precision weather data, climate modeling, risk analysis, agricultural impact scoring"
    },
    "quick_calc": {
      "free": "Simple water and feed calculations",
      "basic": "Simple water and feed calculations",
      "small_farm": "Advanced supplement calculator, cost optimization",
      "small_business": "Advanced supplement calculator, cost optimization",
      "professional": "Precision nutrition, least-cost formulation, profit optimization, multi-variable analysis",
      "enterprise": "Precision nutrition, least-cost formulation, profit optimization, multi-variable analysis"
    },
    "water_management": {
      "free": "Basic water source tracking",
      "basic": "Basic water source tracking",
      "small_farm": "Comprehensive water management, consumption analytics, source optimization",
      "small_business": "Comprehensive water management, consumption analytics, source optimization",
      "professional": "Comprehensive water management, consumption analytics, source optimization, predictive planning",
      "enterprise": "Comprehensive water management, consumption analytics, source optimization, predictive planning"
    }
  };
  return descriptions[entry]?.[tier] || descriptions[entry]?.["professional"] || "Professional farm management tools";
};

// Smart gateway entries - 6 simple buttons that hide complex routing
const GATEWAY_ENTRIES = {
  "check_animals": {
    title: "Livestock Management",
    description: "Health, breeding, and records",
    icon: Heart,
    color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    free: "/livestock-health-breeding",
    basic: "/livestock-health-breeding",
    small_farm: "/livestock-health-breeding",
    small_business: "/livestock-health-breeding",
    professional: "/livestock-health-breeding",
    enterprise: "/livestock-health-breeding"
  },
  "walk_pastures": {
    title: "Paddock Management", 
    description: "Create, edit, and manage paddocks",
    icon: MapPin,
    color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    free: "/paddock-management",
    basic: "/paddock-management",
    small_farm: "/enhanced-pasture-assessment",
    small_business: "/enhanced-pasture-assessment",
    professional: "/enhanced-pasture-assessment",
    enterprise: "/enhanced-pasture-assessment"
  },
  "plan_rotation": {
    title: "Plan Rotation",
    description: "Schedule grazing moves",
    icon: Calendar,
    color: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    free: "/enhanced-grazing-calendar",
    basic: "/enhanced-grazing-calendar",
    small_farm: "/enhanced-grazing-calendar",
    small_business: "/enhanced-grazing-calendar",
    professional: "/enhanced-grazing-calendar",
    enterprise: "/enhanced-grazing-calendar"
  },
  "track_performance": {
    title: "Track Performance",
    description: "Monitor growth and health",
    icon: TrendingUp,
    color: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    free: "/livestock-health-breeding",
    basic: "/livestock-health-breeding",
    small_farm: "/performance-analytics",
    small_business: "/performance-analytics",
    professional: "/performance-analytics",
    enterprise: "/performance-analytics"
  },
  "check_weather": {
    title: "Check Weather",
    description: "Plan for conditions",
    icon: Cloud,
    color: "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300",
    free: "/weather-integration",
    basic: "/weather-integration",
    small_farm: "/weather-integration",
    small_business: "/weather-integration",
    professional: "/weather-integration",
    enterprise: "/weather-integration"
  },
  "water_management": {
    title: "Water Management",
    description: "Sources and consumption",
    icon: Droplets,
    color: "bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300",
    free: "/water-requirements",
    basic: "/water-requirements",
    small_farm: "/water-management",
    small_business: "/water-management",
    professional: "/water-management",
    enterprise: "/water-management"
  },
  "quick_calc": {
    title: "Quick Calc",
    description: "Water, feed, and stocking",
    icon: Calculator,
    color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    free: "/au-calculator",
    basic: "/au-calculator",
    small_farm: "/feed-supplement-calculator",
    small_business: "/feed-supplement-calculator",
    professional: "/financial-management",
    enterprise: "/financial-management"
  }
};

// Context-aware recommendations based on tier, time, season
function getSmartRecommendations(tier: string, hour: number, season: string) {
  const recommendations = [];
  
  // Time-based recommendations
  if (hour < 9) {
    recommendations.push({
      title: "Morning livestock check",
      reason: "Livestock need water and health monitoring",
      action: "check_animals",
      urgent: tier !== "basic"
    });
  } else if (hour >= 15 && hour < 17) {
    recommendations.push({
      title: "Afternoon pasture walk", 
      reason: "Best time to assess tomorrow's grazing",
      action: "walk_pastures",
      urgent: false
    });
  }
  
  // Season-based recommendations
  if (season === "summer") {
    recommendations.push({
      title: "Heat stress monitoring",
      reason: "High temperatures affect grazing patterns",
      action: "check_weather",
      urgent: true
    });
  } else if (season === "spring") {
    recommendations.push({
      title: "Rapid growth assessment",
      reason: "Spring growth requires frequent rotation",
      action: "plan_rotation", 
      urgent: tier !== "basic"
    });
  }
  
  return recommendations.slice(0, 2); // Show top 2 recommendations
}

// Get current season
function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

// Tier-specific quick stats
function QuickStats({ tier }: { tier: string }) {
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: animals = [] } = useQuery<any[]>({ queryKey: ["/api/animals"] });
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });
  
  // Calculate total livestock from herds + individual animals
  const calculateTotalLivestock = () => {
    // If user has individual animals (auto-populated), use that count
    // Otherwise use herd composition count to avoid double-counting
    if (animals.length > 0) {
      return animals.length;
    }
    
    let totalFromHerds = 0;
    herds.forEach((herd: any) => {
      if (typeof herd.composition === 'object' && Array.isArray(herd.composition)) {
        // New mixed herd format
        herd.composition.forEach((comp: any) => {
          const count = parseInt(comp.count) || 0;
          totalFromHerds += count;
        });
      } else {
        // Legacy single-species format
        const count = parseInt(herd.count) || 0;
        totalFromHerds += count;
      }
    });
    
    return totalFromHerds;
  };
  
  const totalLivestock = calculateTotalLivestock();
  
  const stats = [
    { label: "Paddocks", value: paddocks.length, show: true },
    { label: "Livestock", value: totalLivestock, show: true },
    { label: "Assessments", value: assessments.length, show: tier !== "basic" },
    { label: "Avg Score", value: "4.2/5", show: tier === "enterprise" }
  ].filter(stat => stat.show);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {stats.map(stat => (
        <Card key={stat.label} className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {stat.value}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {stat.label}
          </div>
        </Card>
      ))}
    </div>
  );
}

// Tier badge component
function TierBadge({ tier }: { tier: string }) {
  const tierInfo = {
    free: { label: "Free", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    small_farm: { label: "Small Farm", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    professional: { label: "Professional", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    enterprise: { label: "Enterprise", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
    // Legacy fallbacks
    basic: { label: "Free", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    small_business: { label: "Small Farm", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
  };
  
  const info = tierInfo[tier as keyof typeof tierInfo] || tierInfo.free;
  
  return (
    <Badge className={`${info.color} font-medium px-3 py-1`}>
      {info.label}
    </Badge>
  );
}

export default function TierDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showTutorial, setShowTutorial] = useState(false);
  const { startWorkflow, updateWorkflowStep, completeWorkflow } = useWorkflowProgress();
  const {
    activeRecommendations,
    recentCompletion,
    startTask,
    getTaskStatus,
    dismissRecommendation,
    acceptRecommendation,
    getWorkflowAnalytics
  } = useWorkflowTracking();
  
  const tier = user?.subscriptionTier || "free";
  const hour = new Date().getHours();
  const season = getCurrentSeason();
  const staticRecommendations = getSmartRecommendations(tier, hour, season);
  const workflowAnalytics = getWorkflowAnalytics();
  
  // Seasonal adaptation system
  const currentSeason = SeasonalAdaptationEngine.getCurrentSeason();
  const complexityLevel = user ? SeasonalAdaptationEngine.getUserComplexityLevel(user) : 'beginner';
  const seasonalContext: SeasonalContext = {
    season: currentSeason,
    month: new Date().getMonth() + 1,
    location: {
      zipCode: (user as any)?.zipCode || undefined,
      // GPS coords would come from user location data
    },
    farmData: {
      // This would come from actual farm data queries
      animalCount: 0,
      paddockCount: 0,
    }
  };
  const seasonalRecommendations = user ? 
    SeasonalAdaptationEngine.generateSeasonalRecommendations(seasonalContext, complexityLevel) : [];

  // Queries for intelligent context
  const { data: animals = [] } = useQuery({
    queryKey: ['/api/animals'],
    enabled: !!user,
  });
  
  const { data: paddocks = [] } = useQuery({
    queryKey: ['/api/paddocks'], 
    enabled: !!user,
  });
  
  const { data: assessments = [] } = useQuery({
    queryKey: ['/api/assessments'],
    enabled: !!user,
  });

  // Farm context for intelligent adaptations
  const farmContext: FarmContext = {
    user,
    animals: (animals as any[]) || [],
    paddocks: (paddocks as any[]) || [], 
    assessments: (assessments as any[]) || [],
    tier: tier as 'free' | 'small_farm' | 'professional' | 'enterprise',
    season: currentSeason,
    location: {
      zipCode: (user as any)?.zipCode,
      climate: (user as any)?.climate,
    }
  };

  // Generate intelligent recommendations
  const intelligentRecommendations = user && seasonalRecommendations.length > 0 ? 
    SmartGatewayIntelligence.generateIntelligentRecommendations(farmContext, seasonalRecommendations) : [];
  
  // Experience detection
  const userExperience = user ? SmartGatewayIntelligence.detectUserExperience(farmContext) : null;
  
  // Greeting based on time
  const getGreeting = () => {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  
  const handleGatewayClick = (entry: keyof typeof GATEWAY_ENTRIES) => {
    // Start workflow for morning check
    if (entry === 'check_animals') {
      // Start morning check workflow and go directly to livestock management
      startWorkflow({ ...WORKFLOW_TEMPLATES.morningCheck, startTime: new Date() });
      navigate('/livestock-health-breeding'); // Go to livestock health management
      return;
    }
    
    // Direct routing for water management to respect tier-based access
    if (entry === 'water_management') {
      const route = GATEWAY_ENTRIES[entry][tier as keyof typeof GATEWAY_ENTRIES[typeof entry]];
      startTask(entry);
      navigate(route);
      return;
    }
    
    // Intelligent routing based on farm context for other tasks
    const route = user ? 
      SmartGatewayIntelligence.getOptimalRoute(entry, farmContext) :
      GATEWAY_ENTRIES[entry][tier as keyof typeof GATEWAY_ENTRIES[typeof entry]];
    
    // Track task start for workflow continuity
    startTask(entry);
    
    // Start other workflow progress tracking
    if (entry === 'walk_pastures') {
      startWorkflow({ ...WORKFLOW_TEMPLATES.pastureAssessment, startTime: new Date() });
    } else if (entry === 'plan_rotation') {
      startWorkflow({ ...WORKFLOW_TEMPLATES.rotationPlanning, startTime: new Date() });
    }
    
    navigate(route);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header with tier and greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            {getGreeting()}, {user?.farmName || "Farmer"}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            <span className="truncate">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={tier} />
          <SeasonalBadge season={currentSeason} complexityLevel={complexityLevel} />
        </div>
      </div>
      
      {/* Quick Stats */}
      <QuickStats tier={tier} />


      


      {/* Recent Task Completion Celebration */}
      {recentCompletion && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-200">
                  Task Completed!
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {GATEWAY_ENTRIES[recentCompletion.taskId as keyof typeof GATEWAY_ENTRIES]?.title} completed in {recentCompletion.timeSpent} minutes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context Intelligence Display */}
      {/* Temporarily disabled due to .join() error
      {user && farmContext && (
        <ContextIntelligenceDisplay farmContext={farmContext} />
      )}
      */}





      {/* Intelligent Seasonal Recommendations */}
      {intelligentRecommendations.length > 0 && activeRecommendations.length === 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              Smart {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Priorities
            </CardTitle>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Intelligent recommendations adapted to your farm context and experience level
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {intelligentRecommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                    rec.priority === 'critical' 
                      ? 'bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 border-red-200 dark:border-red-800' 
                      : rec.priority === 'high'
                      ? 'bg-orange-50 dark:bg-orange-950 hover:bg-orange-100 dark:hover:bg-orange-900 border-orange-200 dark:border-orange-800'
                      : 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800'
                  }`}
                  onClick={() => handleGatewayClick(rec.taskId as keyof typeof GATEWAY_ENTRIES)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {rec.title}
                        <Badge variant="outline" className="text-xs">
                          {rec.complexity}
                        </Badge>
                        <Badge variant={rec.urgencyScore > 70 ? 'destructive' : rec.urgencyScore > 50 ? 'default' : 'secondary'} className="text-xs">
                          {rec.urgencyScore}/100
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {rec.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <div><strong>Context:</strong> {rec.contextualReasoning}</div>
                        {rec.adaptedForContext.length > 0 && (
                          <div><strong>Adapted:</strong> {rec.adaptedForContext.join(', ')}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'default' : 'secondary'}>
                          {rec.priority} priority
                        </Badge>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          {rec.estimatedTime} min
                        </div>
                        {rec.farmSpecificData && (
                          <div className="text-gray-500">
                            {rec.farmSpecificData.animalCount} livestock • {rec.farmSpecificData.paddockStatus}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback: Basic Seasonal Recommendations */}
      {seasonalRecommendations.length > 0 && intelligentRecommendations.length === 0 && activeRecommendations.length === 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sun className="h-5 w-5 text-blue-500" />
              {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Priorities ({complexityLevel})
            </CardTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Seasonal recommendations adapted to your experience level
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seasonalRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    rec.priority === 'critical' 
                      ? 'bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 border-red-200 dark:border-red-800' 
                      : rec.priority === 'high'
                      ? 'bg-orange-50 dark:bg-orange-950 hover:bg-orange-100 dark:hover:bg-orange-900 border-orange-200 dark:border-orange-800'
                      : 'bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800'
                  }`}
                  onClick={() => handleGatewayClick(rec.taskId as keyof typeof GATEWAY_ENTRIES)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {rec.title}
                        <Badge variant="outline" className="text-xs">
                          {rec.complexity}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {rec.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {rec.seasonalReasoning}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'default' : 'secondary'}>
                          {rec.priority} priority
                        </Badge>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3" />
                          {rec.estimatedTime} min
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      
      {/* Smart Gateway Grid - 6 Simple Entry Points */}
      <div id="smart-gateway-container" className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(GATEWAY_ENTRIES).map(([key, entry]) => {
          const Icon = entry.icon;
          const taskStatus = getTaskStatus(key);
          const buttonId = key === 'record_data' ? 'record-data-button' : 
                          key === 'review_performance' ? 'review-performance-button' :
                          `${key.replace('_', '-')}-button`;
          return (
            <Card
              key={key}
              id={buttonId}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 relative"
              onClick={() => handleGatewayClick(key as keyof typeof GATEWAY_ENTRIES)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className={`rounded-lg p-2 sm:p-3 w-fit mb-2 sm:mb-3 ${entry.color} relative`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  {taskStatus === 'recently_completed' && (
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                  )}
                  {taskStatus === 'in_progress' && (
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 bg-blue-500 rounded-full absolute -top-1 -right-1 animate-pulse" />
                  )}
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 flex items-center gap-1 sm:gap-2">
                  {entry.title}
                  {taskStatus === 'in_progress' && <Clock className="h-3 w-3 text-blue-500" />}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {getTierDescription(key, tier)}
                </p>
                {taskStatus === 'recently_completed' && (
                  <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Recently completed
                  </div>
                )}
                {taskStatus === 'in_progress' && (
                  <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    In progress...
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      

      
      {/* Tier-specific features hint */}
      {tier === "small_business" && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-sm">
              <span className="font-medium">Small Business Tip:</span> Your tools now include market tracking and performance analytics.
            </p>
          </CardContent>
        </Card>
      )}
      
      {tier === "enterprise" && (
        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <p className="text-sm">
              <span className="font-medium">Enterprise Features:</span> Advanced analytics, team collaboration, and automated reporting are available.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Workflow Demo Section */}


      {/* Tutorial Button - Always visible in header area */}
      <Button
        onClick={() => setShowTutorial(true)}
        variant="outline"
        size="sm"
        className="fixed top-16 sm:top-20 right-2 sm:right-4 z-40 flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Help</span>
      </Button>

      {/* Tutorial System */}
      <SmartGatewayTutorial 
        onComplete={() => setShowTutorial(false)}
        forceShow={showTutorial}
      />

      {/* Tooltips for each gateway button */}
      <SmartGatewayTooltips />


    </div>
  );
}