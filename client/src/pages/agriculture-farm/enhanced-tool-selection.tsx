import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { 
  CheckCircle, Circle, Settings, Wrench, BarChart3, BrainCircuit, Search,
  Calculator, Camera, Target, Droplets, Leaf, Heart, DollarSign,
  Users, MapPin, Calendar, Sun, AlertTriangle, TrendingUp, Zap,
  ArrowRight, Filter, Star, Clock
} from "lucide-react";

interface Tool {
  id: number;
  name: string;
  description: string;
  category: string;
  complexity: string[];
  icon: any;
  path: string;
  dependencies?: number[];
  isRecommended?: boolean;
}

interface UserToolPreference {
  toolId: number;
  isActive: boolean;
  complexityLevel: string;
  usageCount?: number;
  lastUsedAt?: string | null;
}

// Enhanced tool metadata with complete tool definitions
const AVAILABLE_TOOLS: Tool[] = [
  // Foundation Tools
  { 
    id: 1, 
    name: "Farm Profile Setup", 
    description: "Basic farm information and settings", 
    category: "Foundation", 
    complexity: ["basic"], 
    icon: Target, 
    path: "/onboarding",
    isRecommended: true
  },
  { 
    id: 2, 
    name: "Livestock Management", 
    description: "Manage animal groups and herds", 
    category: "Foundation", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Users, 
    path: "/animals",
    isRecommended: true
  },
  { 
    id: 3, 
    name: "Paddock Management", 
    description: "Field and grazing area management", 
    category: "Foundation", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: MapPin, 
    path: "/paddocks",
    isRecommended: true
  },
  
  // Daily Operations
  { 
    id: 7, 
    name: "Water Requirements", 
    description: "Calculate daily water needs", 
    category: "Daily Operations", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Droplets, 
    path: "/water-requirements" 
  },
  { 
    id: 8, 
    name: "Feed Supplement Calculator", 
    description: "Nutritional supplement planning", 
    category: "Daily Operations", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Heart, 
    path: "/feed-supplement-calculator" 
  },
  { 
    id: 13, 
    name: "Daily Needs Calculator", 
    description: "Comprehensive daily planning", 
    category: "Daily Operations", 
    complexity: ["basic", "intermediate"], 
    icon: Zap, 
    path: "/daily-needs",
    isRecommended: true
  },
  
  // Assessment & Analysis
  { 
    id: 5, 
    name: "Animal Unit Calculator", 
    description: "Calculate stocking rates", 
    category: "Assessment", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Calculator, 
    path: "/au-calculator" 
  },
  { 
    id: 6, 
    name: "Dry Matter Availability", 
    description: "Pasture productivity assessment", 
    category: "Assessment", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Leaf, 
    path: "/dm-availability" 
  },
  { 
    id: 9, 
    name: "Pasture Assessment", 
    description: "Scientific step-point methodology", 
    category: "Assessment", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Camera, 
    path: "/enhanced-pasture-assessment" 
  },
  { 
    id: 10, 
    name: "Plant Identification", 
    description: "Species recognition and data", 
    category: "Assessment", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Camera, 
    path: "/plant-identification" 
  },
  { 
    id: 11, 
    name: "Nutritional Analysis", 
    description: "Feed quality and composition", 
    category: "Assessment", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: BarChart3, 
    path: "/nutritional-analysis" 
  },
  
  // Planning & Management
  { 
    id: 17, 
    name: "Grazing Calendar", 
    description: "Rotation planning and scheduling", 
    category: "Planning", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Calendar, 
    path: "/enhanced-grazing-calendar" 
  },
  { 
    id: 14, 
    name: "Brush Hog Recommendations", 
    description: "Maintenance scheduling", 
    category: "Planning", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Settings, 
    path: "/brush-hog-recommendations" 
  },
  
  // Technology & Monitoring
  { 
    id: 4, 
    name: "GPS Location Tools", 
    description: "Precision mapping and tracking", 
    category: "Technology", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: MapPin, 
    path: "/gps-location-tools" 
  },
  { 
    id: 15, 
    name: "Weather Integration", 
    description: "Climate monitoring and forecasts", 
    category: "Technology", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: Sun, 
    path: "/weather-integration" 
  },
  { 
    id: 16, 
    name: "Alert System", 
    description: "Automated monitoring and notifications", 
    category: "Technology", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: AlertTriangle, 
    path: "/alert-system" 
  },
  
  // Analytics & Business
  { 
    id: 12, 
    name: "Performance Analytics", 
    description: "Farm performance tracking", 
    category: "Analytics", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: TrendingUp, 
    path: "/performance-analytics" 
  },
  { 
    id: 19, 
    name: "Financial Management", 
    description: "Economic analysis and planning", 
    category: "Business", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: DollarSign, 
    path: "/financial-management" 
  },
  { 
    id: 24, 
    name: "Data Analytics Hub", 
    description: "Comprehensive reporting and insights", 
    category: "Analytics", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: BarChart3, 
    path: "/analytics",
    isRecommended: true
  },
  
  // Advanced Management
  { 
    id: 18, 
    name: "Livestock Health & Breeding", 
    description: "Health monitoring and genetics", 
    category: "Advanced", 
    complexity: ["intermediate", "advanced"], 
    icon: Heart, 
    path: "/livestock-health-breeding" 
  },
  { 
    id: 20, 
    name: "Soil Health & Pasture Improvement", 
    description: "Land regeneration", 
    category: "Advanced", 
    complexity: ["intermediate", "advanced"], 
    icon: Leaf, 
    path: "/soil-health-pasture-improvement" 
  },
  { 
    id: 21, 
    name: "Infrastructure & Equipment", 
    description: "Asset management", 
    category: "Advanced", 
    complexity: ["intermediate", "advanced"], 
    icon: Settings, 
    path: "/infrastructure-equipment" 
  },
  { 
    id: 22, 
    name: "Market Analysis", 
    description: "Supply chain and market intelligence", 
    category: "Advanced", 
    complexity: ["intermediate", "advanced"], 
    icon: TrendingUp, 
    path: "/market-analysis" 
  },
  { 
    id: 23, 
    name: "Educational Content", 
    description: "Learning and training resources", 
    category: "Learning", 
    complexity: ["basic", "intermediate", "advanced"], 
    icon: BrainCircuit, 
    path: "/educational-content" 
  },
];

const CATEGORIES = [
  "all",
  "Foundation", 
  "Daily Operations", 
  "Assessment", 
  "Planning", 
  "Technology", 
  "Analytics", 
  "Business", 
  "Advanced", 
  "Learning"
];

export default function EnhancedToolSelection() {
  const { user } = useAuth();
  const currentUserId = user?.id || 1; // Use authenticated user ID, fallback to 1
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get activated tools from localStorage as fallback
  const [localActivatedTools, setLocalActivatedTools] = useState<UserToolPreference[]>([]);
  
  useEffect(() => {
    const activatedTools = JSON.parse(localStorage.getItem('grazePro-activatedTools') || '[]');
    setLocalActivatedTools(activatedTools);
  }, []);

  // Fetch user's tool preferences with fallback
  const { data: userTools = [] } = useQuery<UserToolPreference[]>({
    queryKey: [`/api/tools/user/${currentUserId}`],
    retry: false,
    initialData: localActivatedTools,
  });

  // Tool activation mutation with localStorage fallback
  const activateToolMutation = useMutation({
    mutationFn: async ({ toolId, complexityLevel }: { toolId: number; complexityLevel: string }) => {
      try {
        const response = await fetch("/api/tools/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, toolId, complexityLevel }),
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error("Backend activation failed");
      } catch (error) {
        // Fallback to localStorage
        const activatedTools = JSON.parse(localStorage.getItem('grazePro-activatedTools') || '[]');
        const newTool = { toolId, complexityLevel, isActive: true, activatedAt: new Date().toISOString() };
        const updatedTools = [...activatedTools.filter((t: UserToolPreference) => t.toolId !== toolId), newTool];
        localStorage.setItem('grazePro-activatedTools', JSON.stringify(updatedTools));
        setLocalActivatedTools(updatedTools);
        return newTool;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tools/user/${currentUserId}`] });
      toast({
        title: "Tool Activated",
        description: `${AVAILABLE_TOOLS.find(t => t.id === variables.toolId)?.name} is now active.`,
      });
    },
    onError: () => {
      toast({
        title: "Activation Failed",
        description: "Could not activate the tool. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Tool deactivation mutation
  const deactivateToolMutation = useMutation({
    mutationFn: async (toolId: number) => {
      try {
        const response = await fetch("/api/tools/deactivate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId, toolId }),
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error("Backend deactivation failed");
      } catch (error) {
        // Fallback to localStorage
        const activatedTools = JSON.parse(localStorage.getItem('grazePro-activatedTools') || '[]');
        const updatedTools = activatedTools.filter((t: UserToolPreference) => t.toolId !== toolId);
        localStorage.setItem('grazePro-activatedTools', JSON.stringify(updatedTools));
        setLocalActivatedTools(updatedTools);
        return { toolId };
      }
    },
    onSuccess: (data, toolId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/tools/user/${currentUserId}`] });
      toast({
        title: "Tool Deactivated",
        description: `${AVAILABLE_TOOLS.find(t => t.id === toolId)?.name} has been deactivated.`,
      });
    },
  });

  // Filter tools based on search and category
  const filteredTools = AVAILABLE_TOOLS.filter((tool: Tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const isActive = userTools.some((ut: UserToolPreference) => ut.toolId === tool.id && ut.isActive);
    const matchesActiveFilter = !showOnlyActive || isActive;
    
    return matchesSearch && matchesCategory && matchesActiveFilter;
  });

  // Get active tools count by category
  const getActiveCategoryCount = (category: string) => {
    if (category === "all") return userTools.filter((ut: UserToolPreference) => ut.isActive).length;
    return userTools.filter((ut: UserToolPreference) => 
      ut.isActive && AVAILABLE_TOOLS.find(t => t.id === ut.toolId)?.category === category
    ).length;
  };

  // Check if tool is active
  const isToolActive = (toolId: number): UserToolPreference | undefined => {
    return userTools.find((ut: UserToolPreference) => ut.toolId === toolId && ut.isActive);
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Farm Tools</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Activate and manage your farming tools
              </p>
            </div>
            <Badge variant="secondary" className="text-sm w-fit">
              {userTools.filter((ut: UserToolPreference) => ut.isActive).length} Active
            </Badge>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                      {category !== "all" && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({getActiveCategoryCount(category)})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2 justify-center sm:justify-start">
                <Switch
                  id="active-only"
                  checked={showOnlyActive}
                  onCheckedChange={setShowOnlyActive}
                />
                <label htmlFor="active-only" className="text-sm text-gray-600 dark:text-gray-300">
                  Active only
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Tools */}
        {!showOnlyActive && searchQuery === "" && selectedCategory === "all" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Recommended for You
              </CardTitle>
              <CardDescription>
                Essential tools to get started with modern grazing management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_TOOLS.filter(tool => tool.isRecommended).map((tool: Tool) => {
                  const activeInfo = isToolActive(tool.id);
                  const IconComponent = tool.icon;
                  
                  return (
                    <Card key={tool.id} className="border-yellow-200 dark:border-yellow-800">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
                              <IconComponent className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                                {tool.name}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          {activeInfo ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {tool.category}
                          </Badge>
                          {activeInfo ? (
                            <div className="flex items-center gap-2">
                              <Link href={tool.path}>
                                <Button size="sm" variant="outline">
                                  Open
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deactivateToolMutation.mutate(tool.id)}
                                disabled={deactivateToolMutation.isPending}
                              >
                                Deactivate
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => activateToolMutation.mutate({ 
                                toolId: tool.id, 
                                complexityLevel: "basic" 
                              })}
                              disabled={activateToolMutation.isPending}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tools Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              {selectedCategory === "all" ? "All Tools" : `${selectedCategory} Tools`}
            </CardTitle>
            <CardDescription>
              {filteredTools.length} tools available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTools.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No tools found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setShowOnlyActive(false);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map((tool: Tool) => {
                  const activeInfo = isToolActive(tool.id);
                  const IconComponent = tool.icon;
                  
                  return (
                    <Card key={tool.id} className={`cursor-pointer transition-all hover:shadow-md ${
                      activeInfo ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              activeInfo 
                                ? 'bg-green-50 dark:bg-green-900/20' 
                                : 'bg-gray-50 dark:bg-gray-800'
                            }`}>
                              <IconComponent className={`h-4 w-4 ${
                                activeInfo ? 'text-green-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                                  {tool.name}
                                </h3>
                                {tool.isRecommended && (
                                  <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          {activeInfo ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {tool.category}
                          </Badge>
                          {activeInfo && (
                            <Badge variant="secondary" className="text-xs">
                              {activeInfo.complexityLevel}
                            </Badge>
                          )}
                          {activeInfo?.usageCount && activeInfo.usageCount > 0 && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {activeInfo.usageCount}x
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {activeInfo ? (
                            <div className="flex items-center gap-2 w-full">
                              <Link href={tool.path} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full">
                                  <ArrowRight className="h-3 w-3 mr-1" />
                                  Open Tool
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deactivateToolMutation.mutate(tool.id)}
                                disabled={deactivateToolMutation.isPending}
                              >
                                Deactivate
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 w-full">
                              <Select 
                                defaultValue="basic"
                                onValueChange={(level) => {
                                  activateToolMutation.mutate({ 
                                    toolId: tool.id, 
                                    complexityLevel: level 
                                  });
                                }}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Complexity" />
                                </SelectTrigger>
                                <SelectContent>
                                  {tool.complexity.map((level) => (
                                    <SelectItem key={level} value={level}>
                                      {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                size="sm"
                                onClick={() => activateToolMutation.mutate({ 
                                  toolId: tool.id, 
                                  complexityLevel: "basic" 
                                })}
                                disabled={activateToolMutation.isPending}
                              >
                                Activate
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}