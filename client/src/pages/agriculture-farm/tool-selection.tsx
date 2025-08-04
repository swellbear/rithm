import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { allTools, getAvailableTools, groupToolsByCategory } from "@/data/tools-config";
import { 
  Search, Lock, Star, TrendingUp, Package, Map, 
  FileSearch, RefreshCw, Bell, Wrench, Database,
  Settings, Users, MapPin, Calculator, Leaf, Droplet,
  Camera, BarChart, Calendar, Scissors, Cloud, Heart,
  DollarSign, BookOpen, Sprout, LineChart
} from "lucide-react";

// Icon mapping
const iconMap: Record<string, any> = {
  Settings, Map, Users, MapPin, Calculator, Leaf, Droplet,
  Package, FileSearch, Camera, BarChart, RefreshCw, Calendar,
  Scissors, Cloud, Bell, TrendingUp, Heart, DollarSign,
  BookOpen, Sprout, Wrench, LineChart, Database
};

const categoryNames: Record<string, string> = {
  core: "Core Management",
  assessment: "Assessment Tools",
  planning: "Planning & Scheduling",
  monitoring: "Monitoring & Analytics",
  advanced: "Advanced Features",
  enterprise: "Enterprise Tools"
};

const tierColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-800",
  small_farm: "bg-green-100 text-green-800",
  professional: "bg-blue-100 text-blue-800",
  enterprise: "bg-purple-100 text-purple-800"
};

const tierNames: Record<string, string> = {
  free: "Free",
  small_farm: "Small Farm",
  professional: "Professional",
  enterprise: "Enterprise"
};

export default function ToolSelection() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const userTier = user?.subscriptionTier || 'free';
  const availableTools = useMemo(() => getAvailableTools(userTier), [userTier]);
  const availableToolIds = new Set(availableTools.map(t => t.id));
  
  // Filter tools based on search
  const filteredTools = useMemo(() => {
    let tools = allTools;
    
    if (searchQuery) {
      tools = tools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== "all") {
      tools = tools.filter(tool => tool.category === selectedCategory);
    }
    
    return tools;
  }, [searchQuery, selectedCategory]);
  
  const groupedTools = useMemo(() => groupToolsByCategory(filteredTools), [filteredTools]);
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Farm Tools</h1>
        <p className="text-gray-600 dark:text-gray-300">
          You have access to {availableTools.length} of {allTools.length} tools with your {tierNames[userTier]} plan
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Tools Grid */}
      <div className="space-y-8">
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {categoryNames[category]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => {
                const Icon = iconMap[tool.icon];
                const isAvailable = availableToolIds.has(tool.id);
                const isUpgradeRequired = !isAvailable && userTier !== 'enterprise';
                
                return (
                  <Card 
                    key={tool.id} 
                    className={`relative transition-all ${
                      isAvailable 
                        ? 'hover:shadow-lg cursor-pointer' 
                        : 'opacity-60'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mb-2">
                          {Icon && <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`${tierColors[tool.minTier]} text-xs`}
                        >
                          {tierNames[tool.minTier]}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isAvailable ? (
                        <Link href={tool.route}>
                          <Button className="w-full">
                            Open Tool
                          </Button>
                        </Link>
                      ) : (
                        <div className="space-y-2">
                          <Button 
                            className="w-full" 
                            variant="secondary" 
                            disabled
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Requires {tierNames[tool.minTier]}
                          </Button>
                          {isUpgradeRequired && (
                            <Link href="/settings">
                              <Button 
                                className="w-full" 
                                variant="outline"
                                size="sm"
                              >
                                Upgrade Plan
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </CardContent>
                    {tool.complexity === 'advanced' && isAvailable && (
                      <div className="absolute top-2 right-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Upgrade CTA */}
      {userTier !== 'enterprise' && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Unlock More Tools</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Upgrade your plan to access advanced features and improve your farm management
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Development: Use the subscription testing section in Settings to try different tiers
                </p>
              </div>
              <Link href="/settings">
                <Button size="lg" className="whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Upgrade Options
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}