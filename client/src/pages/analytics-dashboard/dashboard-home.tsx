import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import GettingStartedAssistant from "@/components/getting-started-assistant";
import EnhancedDemoExperience from "@/components/enhanced-demo-experience";
import WorkflowOptimization from "@/components/workflow-optimization";
import LivestockWeatherWidget from "@/components/livestock-weather-widget";
import SmartGateway from "@/components/smart-gateway";
import MorningFarmCheckWidget from "@/components/morning-farm-check-widget";
import { useDemoData, demoAnalyticsData, demoAlerts, demoAnimals, demoPaddocks } from "@/lib/demo-data";
import { 
  Wrench, TrendingUp, Calendar, Users, MapPin, Zap, BarChart3,
  Sun, CloudSun, ArrowRight, CheckCircle, Clock, AlertTriangle,
  Calculator, Camera, Target, Droplets, Leaf, Heart, DollarSign, 
  HelpCircle, Settings, Sparkles, CircleAlert
} from "lucide-react";

interface UserTool {
  id: number;
  toolId: number;
  isActive: boolean;
  complexityLevel: string;
  usageCount: number;
  lastUsedAt: string | null;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
  category: 'daily' | 'assessment' | 'planning' | 'analysis';
}

// Tool metadata mapping
const TOOL_METADATA: Record<number, { name: string; description: string; icon: any; path: string; category: string }> = {
  1: { name: "Farm Profile", description: "Basic farm information", icon: Target, path: "/onboarding", category: "setup" },
  2: { name: "Livestock Management", description: "Manage animal groups", icon: Users, path: "/animals", category: "livestock" },
  3: { name: "Paddock Management", description: "Field management", icon: MapPin, path: "/paddocks", category: "land" },
  4: { name: "GPS Tools", description: "Location tracking", icon: MapPin, path: "/gps-location-tools", category: "tech" },
  5: { name: "AU Calculator", description: "Animal unit calculations", icon: Calculator, path: "/au-calculator", category: "calculation" },
  6: { name: "DM Availability", description: "Dry matter assessment", icon: Leaf, path: "/dm-availability", category: "assessment" },
  7: { name: "Water Requirements", description: "Daily water needs", icon: Droplets, path: "/water-requirements", category: "daily" },
  8: { name: "Feed Supplements", description: "Supplement planning", icon: Heart, path: "/feed-supplement-calculator", category: "nutrition" },
  9: { name: "Pasture Assessment", description: "Step-point methodology", icon: Camera, path: "/enhanced-pasture-assessment", category: "assessment" },
  10: { name: "Plant ID", description: "Species identification", icon: Camera, path: "/plant-identification", category: "tech" },
  11: { name: "Nutritional Analysis", description: "Feed analysis", icon: BarChart3, path: "/nutritional-analysis", category: "nutrition" },
  12: { name: "Performance Analytics", description: "Farm performance", icon: TrendingUp, path: "/performance-analytics", category: "analysis" },
  13: { name: "Daily Needs", description: "Daily calculator", icon: Zap, path: "/daily-needs", category: "daily" },
  15: { name: "Weather Integration", description: "Weather monitoring", icon: Sun, path: "/weather-integration", category: "monitoring" },
  16: { name: "Alert System", description: "Farm monitoring", icon: AlertTriangle, path: "/alert-system", category: "monitoring" },
  17: { name: "Grazing Calendar", description: "Rotation planning", icon: Calendar, path: "/enhanced-grazing-calendar", category: "planning" },
  18: { name: "Health & Breeding", description: "Livestock health", icon: Heart, path: "/livestock-health-breeding", category: "livestock" },
  19: { name: "Financial Management", description: "Farm economics", icon: DollarSign, path: "/financial-management", category: "business" },
  23: { name: "Educational Content", description: "Learning resources", icon: Target, path: "/educational-content", category: "learning" },
  24: { name: "Analytics Hub", description: "Data insights", icon: BarChart3, path: "/analytics", category: "analysis" }
};

export default function DashboardHome() {
  const { user } = useAuth();
  const currentUserId = user?.id || 1; // Use authenticated user ID, fallback to 1
  const [weatherData, setWeatherData] = useState<any>(null);
  const [localUserTools, setLocalUserTools] = useState<UserTool[]>([]);

  // Load user tools from localStorage as fallback
  useEffect(() => {
    const userToolsData = localStorage.getItem('cadence-userTools');
    if (userToolsData) {
      try {
        const toolActivations = JSON.parse(userToolsData);
        const converted = Object.entries(toolActivations).map(([toolId, data]: [string, any], index: number) => ({
          id: index + 1,
          toolId: parseInt(toolId),
          isActive: data.isActive,
          complexityLevel: data.complexityLevel || 'basic',
          usageCount: data.usageCount || 0,
          lastUsedAt: data.lastUsedAt || null
        }));
        setLocalUserTools(converted);
      } catch (error) {
        console.error('Error parsing user tools from localStorage:', error);
        setLocalUserTools([]);
      }
    }
  }, []);

  // Fetch user's active tools with localStorage fallback
  const { data: apiUserTools = [], isLoading: toolsLoading } = useQuery<UserTool[]>({
    queryKey: [`/api/tools/user/${currentUserId}`],
    retry: false,
  });

  // Use API data if available, otherwise fallback to localStorage
  const userTools = apiUserTools.length > 0 ? apiUserTools : localUserTools;

  // Fetch farm data
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: animals = [] } = useQuery<any[]>({ queryKey: ["/api/animals"] });
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  // Check onboarding completion
  const [onboardingData, setOnboardingData] = useState<any>(null);
  useEffect(() => {
    const storedData = localStorage.getItem('cadence-intentOnboarding');
    if (storedData) {
      setOnboardingData(JSON.parse(storedData));
    }
  }, []);

  // Getting Started Assistant state
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [hasSeenAssistant, setHasSeenAssistant] = useState(false);
  
  // Enhanced Demo Experience state
  const [showEnhancedDemo, setShowEnhancedDemo] = useState(false);
  
  // Workflow Optimization state
  const [showWorkflowOptimization, setShowWorkflowOptimization] = useState(false);
  
  // Current Paddock Details state
  const [showPaddockDetails, setShowPaddockDetails] = useState(false);

  useEffect(() => {
    const assistantSeen = localStorage.getItem('cadence-assistantSeen');
    setHasSeenAssistant(!!assistantSeen);
    
    // Auto-show for new users who just completed onboarding
    if (onboardingData?.completed && !assistantSeen && userTools.length > 0) {
      setShowGettingStarted(true);
    }
  }, [onboardingData, userTools]);

  const handleCloseAssistant = () => {
    setShowGettingStarted(false);
    localStorage.setItem('cadence-assistantSeen', 'true');
    setHasSeenAssistant(true);
  };

  // Generate smart quick actions based on user's tools and farm status
  const generateQuickActions = (): QuickAction[] => {
    const actions: QuickAction[] = [];
    const activeToolIds = userTools.filter(t => t.isActive).map(t => t.toolId);

    // High priority actions
    if (activeToolIds.includes(13)) {
      actions.push({
        id: 'daily-needs',
        title: 'Daily Farm Needs',
        description: 'Check water, feed, and supplement requirements',
        path: '/daily-needs',
        icon: Zap,
        priority: 'high',
        category: 'daily'
      });
    }

    if (activeToolIds.includes(9) && assessments.length === 0) {
      actions.push({
        id: 'first-assessment',
        title: 'Conduct Pasture Assessment',
        description: 'Create your first scientific pasture evaluation',
        path: '/enhanced-pasture-assessment',
        icon: Camera,
        priority: 'high',
        category: 'assessment'
      });
    }

    if (activeToolIds.includes(17)) {
      actions.push({
        id: 'grazing-calendar',
        title: 'Grazing Calendar',
        description: 'Plan your rotation schedule',
        path: '/enhanced-grazing-calendar',
        icon: Calendar,
        priority: 'high',
        category: 'planning'
      });
    }

    // Medium priority actions
    if (activeToolIds.includes(5)) {
      actions.push({
        id: 'au-calculator',
        title: 'Calculate Animal Units',
        description: 'Determine stocking rates and capacity',
        path: '/au-calculator',
        icon: Calculator,
        priority: 'medium',
        category: 'analysis'
      });
    }

    if (activeToolIds.includes(24)) {
      actions.push({
        id: 'analytics',
        title: 'View Analytics',
        description: 'Review farm performance and insights',
        path: '/analytics',
        icon: BarChart3,
        priority: 'medium',
        category: 'analysis'
      });
    }

    return actions.slice(0, 6); // Limit to 6 actions
  };

  const quickActions = generateQuickActions();
  const activeTools = userTools.filter(t => t.isActive);
  const recentlyUsedTools = activeTools
    .filter(t => t.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
    .slice(0, 4);

  // Find currently grazed paddock
  const currentlyGrazedPaddock = paddocks.find(p => p.currentlyGrazing);

  // Farm summary stats  
  const farmStats = {
    totalAnimals: animals.filter(animal => animal.isActive !== false).length,
    totalPaddocks: paddocks.length,
    totalAcreage: paddocks.length > 0 
      ? paddocks.reduce((sum, paddock) => sum + (parseFloat(paddock.acres) || 0), 0)
      : (onboardingData?.farmProfile?.totalAcreage || 
         onboardingData?.totalAcreage || 
         onboardingData?.farmProfile?.acreage ||
         onboardingData?.acreage ||
         onboardingData?.farmData?.totalAcreage ||
         onboardingData?.responses?.totalAcreage ||
         parseFloat(onboardingData?.farmProfile?.totalAcres || 0) ||
         50), // Fallback to your known 50 acres
    activeTools: activeTools.length,
    currentGrazing: currentlyGrazedPaddock,
    lastAssessment: assessments.length > 0 ? assessments[0]?.createdAt : null
  };

  if (toolsLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Welcome Header */}
        <div className="page-header">
          <h1 className="page-title text-xl sm:text-2xl font-bold mb-2">
            Welcome back to Cadence
          </h1>
          {onboardingData?.detectedPersona && (
            <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
              Your <span className="font-semibold text-green-700 dark:text-green-400">
                {onboardingData.detectedPersona.name}
              </span> profile is active with {activeTools.length} tools
            </p>
          )}
          
          {/* Getting Started Assistant Trigger - Enhanced for new users */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            {!hasSeenAssistant && (
              <Alert className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0">
                  <div className="text-sm sm:text-base">
                    <span className="font-medium">New to Cadence?</span> Get personalized help to set up your farm
                  </div>
                  <Button 
                    onClick={() => setShowGettingStarted(true)}
                    size="sm"
                    className="sm:ml-4 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Get Started Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {hasSeenAssistant && (
              <Button 
                onClick={() => setShowGettingStarted(true)}
                variant="outline"
                className="bg-white/50 hover:bg-white/70 border-green-200 w-full sm:w-auto"
                size="sm"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help Assistant
              </Button>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-3 sm:mt-4">
            <div className="stat-display-enhanced min-h-[64px] sm:min-h-[72px]">
              <div className="stat-number text-lg sm:text-xl">{farmStats.totalAnimals}</div>
              <div className="stat-label text-xs sm:text-sm">Animals</div>
            </div>
            <div className="stat-display-enhanced min-h-[64px] sm:min-h-[72px]">
              <div className="stat-number text-lg sm:text-xl">{farmStats.totalPaddocks}</div>
              <div className="stat-label text-xs sm:text-sm">Paddocks</div>
            </div>
            <div className="stat-display-enhanced min-h-[64px] sm:min-h-[72px]">
              <div className="stat-number text-lg sm:text-xl">{farmStats.totalAcreage.toFixed(1)}</div>
              <div className="stat-label text-xs sm:text-sm">
                {paddocks.length > 0 ? 'Paddock Acres' : 'Total Farm Acres'}
              </div>
            </div>
            <div 
              className={`stat-display-enhanced min-h-[64px] sm:min-h-[72px] ${farmStats.currentGrazing ? 'cursor-pointer hover:bg-green-50 active:bg-green-100 transition-colors' : ''}`}
              onClick={() => farmStats.currentGrazing && setShowPaddockDetails(true)}
            >
              <div className="stat-number text-lg sm:text-xl">
                {farmStats.currentGrazing ? parseFloat(farmStats.currentGrazing.acres).toFixed(1) : '—'}
              </div>
              <div className="stat-label text-xs sm:text-sm">Current Grazing</div>
              {farmStats.currentGrazing && (
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">
                  {farmStats.currentGrazing.name}
                </div>
              )}
            </div>
            <div className="stat-display-enhanced min-h-[64px] sm:min-h-[72px] col-span-2 sm:col-span-1">
              <div className="stat-number text-lg sm:text-xl">{activeTools.length}</div>
              <div className="stat-label text-xs sm:text-sm">Active Tools</div>
            </div>
          </div>
        </div>

        {/* Smart Gateway Entry System */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Your Farm Today</CardTitle>
          </CardHeader>
          <CardContent>
            <SmartGateway 
              onNavigate={(path) => window.location.href = path}
              farmStats={farmStats}
              userTools={userTools}
              onboardingData={onboardingData}
            />
          </CardContent>
        </Card>

        {/* Weather and Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weather Widget */}
          <div className="lg:col-span-1">
            <LivestockWeatherWidget 
              onCustomize={() => window.location.href = '/weather-integration'}
              compact={false}
              showAlerts={true}
            />
          </div>
          
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <Link key={action.id} href={action.path}>
                        <Card className="card-elevated cursor-pointer border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                                <IconComponent className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {action.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {action.description}
                                </p>
                                <Badge variant="outline" className="mt-2 capitalize">
                                  {action.category}
                                </Badge>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Tools Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-green-600" />
              Your Active Tools
            </CardTitle>
            <Link href="/tools">
              <Button variant="outline" size="sm" className="btn-secondary-enhanced">
                Manage Tools
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeTools.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-4">No active tools yet</p>
                <Link href="/tools">
                  <Button>Browse Available Tools</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTools.slice(0, 6).map((tool) => {
                  const metadata = TOOL_METADATA[tool.toolId];
                  if (!metadata) return null;
                  
                  const IconComponent = metadata.icon;
                  return (
                    <Link key={tool.id} href={metadata.path}>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                              <IconComponent className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 dark:text-white mb-1 text-sm">
                                {metadata.name}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                                {metadata.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {tool.complexityLevel}
                                </Badge>
                                {tool.usageCount > 0 && (
                                  <span className="text-xs text-gray-500">
                                    Used {tool.usageCount}x
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
            
            {activeTools.length > 6 && (
              <div className="text-center mt-4">
                <Link href="/tools">
                  <Button variant="outline">
                    View All {activeTools.length} Tools
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {recentlyUsedTools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Recently Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentlyUsedTools.map((tool) => {
                  const metadata = TOOL_METADATA[tool.toolId];
                  if (!metadata) return null;
                  
                  const IconComponent = metadata.icon;
                  return (
                    <Link key={tool.id} href={metadata.path}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <IconComponent className="h-4 w-4 text-purple-600" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{metadata.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            Last used {new Date(tool.lastUsedAt!).toLocaleDateString()}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started - for new users */}
        {activeTools.length < 3 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Getting Started:</strong> You have {activeTools.length} tools active. 
              Visit the <Link href="/tools" className="underline font-medium">Tools page</Link> to activate more tools based on your farming goals.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Paddock Details Modal */}
      <Dialog open={showPaddockDetails} onOpenChange={setShowPaddockDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Current Grazing: {farmStats.currentGrazing?.name}
            </DialogTitle>
          </DialogHeader>
          
          {farmStats.currentGrazing && (
            <div className="space-y-6">
              {/* Basic Paddock Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-display-enhanced">
                  <div className="stat-number">{parseFloat(farmStats.currentGrazing.acres).toFixed(1)}</div>
                  <div className="stat-label">Acres</div>
                </div>
                <div className="stat-display-enhanced">
                  <div className="stat-number">{farmStats.currentGrazing.pastureType}</div>
                  <div className="stat-label">Pasture Type</div>
                </div>
                <div className="stat-display-enhanced">
                  <div className="stat-number">{farmStats.currentGrazing.waterSources || 0}</div>
                  <div className="stat-label">Water Sources</div>
                </div>
                <div className="stat-display-enhanced">
                  <div className="stat-number">{farmStats.currentGrazing.restDays || 0}</div>
                  <div className="stat-label">Rest Days Target</div>
                </div>
              </div>

              {/* Tool-Integrated Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* DM Availability (Tool #6) - if active */}
                {activeTools.some(t => t.toolId === 6) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" />
                        Dry Matter Availability
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Estimated based on {farmStats.currentGrazing.pastureType} pasture type
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.href = '/dm-availability'}
                        className="w-full"
                      >
                        Calculate DM for this paddock
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Grazing Calendar (Tool #17) - if active */}
                {activeTools.some(t => t.toolId === 17) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Rotation Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-gray-600">
                        {farmStats.currentGrazing.lastGrazed 
                          ? `Last grazed: ${new Date(farmStats.currentGrazing.lastGrazed).toLocaleDateString()}`
                          : 'No previous grazing recorded'
                        }
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.href = '/enhanced-grazing-calendar'}
                        className="w-full"
                      >
                        View rotation plan
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Pasture Assessment (Tool #9) - if active */}
                {activeTools.some(t => t.toolId === 9) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Camera className="h-4 w-4 text-purple-600" />
                        Pasture Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Step-point analysis for scientific evaluation
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.href = '/enhanced-pasture-assessment'}
                        className="w-full"
                      >
                        Assess this paddock
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Water Requirements (Tool #7) - if active */}
                {activeTools.some(t => t.toolId === 7) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        Water Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-gray-600">
                        {farmStats.currentGrazing.waterSources} water source(s) available
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.href = '/water-requirements'}
                        className="w-full"
                      >
                        Calculate daily needs
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Performance Analytics (Tool #12) - if active */}
                {activeTools.some(t => t.toolId === 12) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                        Performance Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Track productivity on this paddock
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.href = '/performance-analytics'}
                        className="w-full"
                      >
                        View analytics
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Soil Health (Tool #20) - if active */}
                {activeTools.some(t => t.toolId === 20) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Heart className="h-4 w-4 text-brown-600" />
                        Soil Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Monitor soil condition and improvement
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.href = '/soil-health-pasture-improvement'}
                        className="w-full"
                      >
                        Check soil health
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => window.location.href = '/gps-location-tools'}
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Map Paddock
                  </Button>
                  {activeTools.some(t => t.toolId === 16) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/alert-system'}
                      className="flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Set Alerts
                    </Button>
                  )}
                  {activeTools.some(t => t.toolId === 14) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.location.href = '/brush-hog-recommendations'}
                      className="flex items-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      Brush Hog
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Getting Started Assistant */}
      {showGettingStarted && (
        <GettingStartedAssistant
          onClose={handleCloseAssistant}
          activatedTools={activeTools.map(t => t.toolId)}
        />
      )}


    </div>
  );
}