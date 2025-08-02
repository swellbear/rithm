import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDemoData, demoAnalyticsData } from "@/lib/demo-data";
import { 
  BarChart3, TrendingUp, Activity, Users, MapPin, Calendar, 
  Zap, CheckCircle, Clock, ArrowUp, ArrowDown, Eye, Settings, RefreshCw
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface ToolUsageData {
  id: number;
  toolId: number;
  toolName?: string;
  usageCount: number;
  lastUsedAt: string | null;
  isActive: boolean;
  complexityLevel: string;
}

interface FarmSummary {
  totalHerds: number;
  totalAnimals: number;
  totalPaddocks: number;
  totalAcreage: number;
  activeTools: number;
  lastAssessment: string;
  totalAssessments: number;
}

export default function AnalyticsHub() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");
  const [currentUserId] = useState(1); // Demo user
  
  // Check if demo mode is active
  const [isDemoMode, setIsDemoMode] = useState(() => 
    localStorage.getItem('cadence-demo-mode') === 'true'
  );

  // Listen for demo mode changes
  useEffect(() => {
    const checkDemoMode = () => {
      const demoStatus = localStorage.getItem('cadence-demo-mode') === 'true';
      setIsDemoMode(demoStatus);
    };
    
    // Listen for storage events (when localStorage changes)
    window.addEventListener('storage', checkDemoMode);
    
    // Custom event for same-tab changes
    window.addEventListener('demo-mode-changed', checkDemoMode);
    
    return () => {
      window.removeEventListener('storage', checkDemoMode);
      window.removeEventListener('demo-mode-changed', checkDemoMode);
    };
  }, []);

  // Fetch user's active tools with no caching
  const { data: fetchedUserTools = [], isLoading: toolsLoading, refetch: refetchTools } = useQuery<ToolUsageData[]>({
    queryKey: [`/api/tools/user/${currentUserId}`],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !isDemoMode, // Don't fetch if in demo mode
  });

  // Fetch farm data for dashboard with no caching
  const { data: fetchedHerds = [], refetch: refetchHerds } = useQuery<any[]>({ 
    queryKey: ["/api/herds"],
    staleTime: 0,
    refetchOnMount: true,
    enabled: !isDemoMode, // Don't fetch if in demo mode
  });
  const { data: fetchedPaddocks = [], refetch: refetchPaddocks } = useQuery<any[]>({ 
    queryKey: ["/api/paddocks"],
    staleTime: 0,
    refetchOnMount: true,
    enabled: !isDemoMode, // Don't fetch if in demo mode
  });
  const { data: fetchedAssessments = [], refetch: refetchAssessments } = useQuery<any[]>({ 
    queryKey: ["/api/assessments"],
    staleTime: 0,
    refetchOnMount: true,
    enabled: !isDemoMode, // Don't fetch if in demo mode
  });

  // Fetch real analytics data from API with no caching
  const { data: fetchedUsageData = [], isLoading: usageLoading, error: usageError, refetch: refetchUsage } = useQuery<Array<{
    date: string;
    tools: number;
    assessments: number;
    decisions: number;
  }>>({
    queryKey: ["/api/analytics/usage", currentUserId, selectedTimeframe],
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !isDemoMode, // Don't fetch if in demo mode
  });

  // Use demo data when in demo mode, otherwise use real data
  const userTools = isDemoMode ? demoAnalyticsData.demoToolUsageData : fetchedUserTools;
  const herds = isDemoMode ? [
    { id: 1, name: "Main Cattle Herd", species: "cattle", breed: "Angus Cross", count: 33, averageWeight: 1200 },
    { id: 2, name: "Sheep Flock", species: "sheep", breed: "Katahdin", count: 40, averageWeight: 150 }
  ] : fetchedHerds;
  const paddocks = isDemoMode ? [
    { id: 1, name: "North Pasture", acreage: "25.3", userId: 1 },
    { id: 2, name: "South Field", acreage: "18.7", userId: 1 },
    { id: 3, name: "East Bottom", acreage: "22.1", userId: 1 },
    { id: 4, name: "West Ridge", acreage: "15.8", userId: 1 },
    { id: 5, name: "Creek Bottom", acreage: "9.7", userId: 1 }
  ] : fetchedPaddocks;
  const assessments = isDemoMode ? [
    { id: 1, paddockId: 1, totalPoints: 50, averageHeight: 6.2, coveragePercent: 85, quality: 4, assessmentDate: "2025-01-15", notes: "Excellent recovery" },
    { id: 2, paddockId: 2, totalPoints: 35, averageHeight: 4.1, coveragePercent: 72, quality: 3, assessmentDate: "2025-01-12", notes: "Ready for grazing" },
    { id: 3, paddockId: 3, totalPoints: 42, averageHeight: 5.8, coveragePercent: 78, quality: 3, assessmentDate: "2025-01-10", notes: "Good condition" }
  ] : fetchedAssessments;
  const usageData = isDemoMode ? demoAnalyticsData.usageData : fetchedUsageData;

  // Manual refresh function
  const handleRefresh = async () => {
    await Promise.all([
      refetchTools(),
      refetchHerds(),
      refetchPaddocks(),
      refetchAssessments(),
      refetchUsage(),
    ]);
  };

  const toolCategoryData = [
    { category: "Foundation", count: (userTools as any[]).filter(t => [1,2,3,4].includes(t.toolId)).length, color: "#3B82F6" },
    { category: "Calculation", count: (userTools as any[]).filter(t => [5,6,7,8].includes(t.toolId)).length, color: "#10B981" },
    { category: "Assessment", count: (userTools as any[]).filter(t => [9,10,11].includes(t.toolId)).length, color: "#8B5CF6" },
    { category: "Management", count: (userTools as any[]).filter(t => [12,13,14,15,16].includes(t.toolId)).length, color: "#F59E0B" },
    { category: "Advanced", count: (userTools as any[]).filter(t => [17,18].includes(t.toolId)).length, color: "#EF4444" },
    { category: "Enterprise", count: (userTools as any[]).filter(t => [19,20,21,22,23,24].includes(t.toolId)).length, color: "#6B7280" },
  ];

  const getToolName = (toolId: number): string => {
    const toolNames: Record<number, string> = {
      1: "Farm Profile", 2: "Livestock Management", 3: "Paddock Management",
      4: "GPS Tools", 5: "AU Calculator", 6: "DM Availability", 7: "Water Requirements",
      8: "Feed Calculator", 9: "Pasture Assessment", 10: "Plant ID", 11: "Nutrition Analysis",
      12: "Performance Analytics", 13: "Daily Needs", 14: "Brush Hog", 15: "Weather",
      16: "Alert System", 17: "Grazing Calendar", 18: "Health & Breeding", 19: "Financial",
      20: "Soil Health", 21: "Infrastructure", 22: "Market Analysis", 23: "Education",
      24: "Data Analytics"
    };
    return toolNames[toolId] || `Tool ${toolId}`;
  };

  const farmSummary: FarmSummary = {
    totalHerds: herds.length,
    totalAnimals: herds.reduce((sum: number, herd: any) => sum + (herd.count || 0), 0),
    totalPaddocks: paddocks.length,
    totalAcreage: paddocks.reduce((sum: number, paddock: any) => sum + (parseFloat(paddock.acreage) || 0), 0),
    activeTools: userTools.filter(tool => tool.isActive).length,
    lastAssessment: assessments.length > 0 ? assessments[0]?.createdAt || "None" : "None",
    totalAssessments: assessments.length
  };

  const activeTools = userTools.filter(tool => tool.isActive);
  const recentActivity = userTools
    .filter(tool => tool.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
    .slice(0, 5);

  if (toolsLoading || usageLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (usageError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <h3 className="text-lg font-semibold mb-2">Analytics Unavailable</h3>
              <p>Unable to load analytics data. Please ensure you have activated tools and created farm data.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6">
      {/* Demo Mode Indicator */}
      {isDemoMode && (
        <Card className="mb-4 sm:mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Demo Mode Active</h3>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  You're viewing comprehensive demo analytics showing a 125-acre SE Oklahoma farm with 41 AU livestock and 12 active tools. 
                  Real usage patterns, performance metrics, and optimization insights demonstrate platform capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Farm Analytics Hub
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Comprehensive insights into your farm management and tool usage
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={toolsLoading || usageLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(toolsLoading || usageLoading) ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="overview" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Tool Usage</span>
              <span className="sm:hidden">Tools</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="farm" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Farm Metrics</span>
              <span className="sm:hidden">Farm</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">AI Insights</span>
              <span className="sm:hidden">Insights</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tools</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{farmSummary.activeTools}</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Livestock</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{farmSummary.totalAnimals}</div>
                <p className="text-xs text-muted-foreground">
                  Across {farmSummary.totalHerds} herds
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Acreage</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{farmSummary.totalAcreage.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  {farmSummary.totalPaddocks} paddocks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pasture Assessments</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {user?.subscriptionTier === "free" ? (
                  <>
                    <div className="text-2xl font-bold text-gray-400">🔒</div>
                    <p className="text-xs text-muted-foreground">
                      Assessment analytics require Small Farm+ subscription
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{farmSummary.totalAssessments}</div>
                    <p className="text-xs text-muted-foreground">
                      {farmSummary.totalAssessments === 0 
                        ? "Complete your first assessment" 
                        : farmSummary.totalAssessments === 1
                        ? "Great start! Keep assessing paddocks"
                        : "Excellent assessment progress"
                      }
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Usage Trends */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Farm Activity Trends</CardTitle>
                <CardDescription>Tool usage and decision-making over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="tools" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                    <Area type="monotone" dataKey="assessments" stackId="1" stroke="#10B981" fill="#10B981" />
                    <Area type="monotone" dataKey="decisions" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tool Categories</CardTitle>
                <CardDescription>Distribution of active tools by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={toolCategoryData.filter(d => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ category, count }) => `${category}: ${count}`}
                    >
                      {toolCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest tool usage and farm management actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((tool) => (
                    <div key={tool.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                        <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Used {getToolName(tool.toolId)}</p>
                        <p className="text-xs text-gray-500">
                          {tool.lastUsedAt && new Date(tool.lastUsedAt).toLocaleDateString()} • 
                          {tool.complexityLevel} level • {tool.usageCount} total uses
                        </p>
                      </div>
                      <Badge variant={tool.isActive ? "default" : "secondary"}>
                        {tool.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity. Start using tools to see activity here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTools.map((tool) => (
              <Card key={tool.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{getToolName(tool.toolId)}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {tool.complexityLevel}
                    </Badge>
                  </div>
                  <CardDescription>Tool #{tool.toolId}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Usage Count:</span>
                    <span className="font-medium">{tool.usageCount || 0}</span>
                  </div>
                  {tool.lastUsedAt && (
                    <div className="flex justify-between text-sm">
                      <span>Last Used:</span>
                      <span className="font-medium">
                        {new Date(tool.lastUsedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <Badge variant={tool.isActive ? "default" : "secondary"} className="text-xs">
                      {tool.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {activeTools.length === 0 && (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Tools</h3>
              <p className="text-gray-500 mb-4">Activate some tools to see detailed usage analytics</p>
              <Button onClick={() => window.location.href = '/tools'}>
                Browse Available Tools
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="farm" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Herd Overview</CardTitle>
                <CardDescription>Your livestock distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {herds.length > 0 ? (
                  <div className="space-y-4">
                    {herds.map((herd, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{herd.name}</p>
                          <p className="text-sm text-gray-500">{herd.species} • {herd.breed}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{herd.count}</p>
                          <p className="text-xs text-gray-500">animals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No herds configured yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paddock Summary</CardTitle>
                <CardDescription>Your grazing areas</CardDescription>
              </CardHeader>
              <CardContent>
                {paddocks.length > 0 ? (
                  <div className="space-y-4">
                    {paddocks.slice(0, 5).map((paddock, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{paddock.name}</p>
                          <p className="text-sm text-gray-500">{paddock.pastureType}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{paddock.acreage}</p>
                          <p className="text-xs text-gray-500">acres</p>
                        </div>
                      </div>
                    ))}
                    {paddocks.length > 5 && (
                      <p className="text-center text-sm text-gray-500">
                        +{paddocks.length - 5} more paddocks
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No paddocks configured yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
              <CardDescription>Intelligent insights based on your farm data and tool usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Tool Progression Opportunity</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      You've been using basic features consistently. Consider upgrading to intermediate level for 
                      Paddock Management and Daily Needs Calculator to access more detailed planning features.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Great Foundation</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your active tool selection shows a solid foundation. You have the core tools needed for 
                      effective rotational grazing management.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start space-x-3">
                  <Activity className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">Assessment Reminder</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      No pasture assessments recorded yet. Consider activating the Step-Point Assessment tool 
                      to gather baseline data for your paddocks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Recommended Next Tools</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Based on your current setup, consider adding Weather Integration and Alert System tools 
                      to automate monitoring and get timely notifications for optimal grazing decisions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}