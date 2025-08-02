import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, Star, ArrowRight, MapPin, Calculator, Leaf, 
  Package, FileSearch, Camera, BarChart, Calendar, 
  Scissors, TrendingUp, Heart, DollarSign, BookOpen,
  Settings, Users, Droplets, Cloud, Bell, Target
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { allTools, getAvailableTools } from "@/data/tools-config";

export default function ProfessionalTierCommandCenter() {
  const { user } = useAuth();
  
  const getUserTier = () => {
    if (!user?.subscriptionTier) return "free";
    return user.subscriptionTier;
  };

  const userTier = getUserTier();
  const availableTools = useMemo(() => getAvailableTools(userTier), [userTier]);
  const isProfessional = userTier === 'professional' || userTier === 'enterprise';
  
  // Icon mapping for tools
  const iconMap: Record<string, any> = {
    Settings, Map: MapPin, Users, MapPin, Calculator, Leaf, Droplets,
    Package, FileSearch, Camera, BarChart, RefreshCw: Calendar,
    Scissors, Cloud, Bell, TrendingUp, Heart, DollarSign,
    BookOpen, Building: Target, Wrench: Settings, Target, Navigation: MapPin
  };

  // Get featured Professional tools for quick access
  const getFeaturedTools = () => {
    const featured = [
      'feed-supplement', 'plant-identification', 'nutritional-analysis', 
      'performance-analytics', 'brush-hog', 'health-breeding',
      'financial-management', 'educational-content'
    ];
    return allTools.filter(tool => featured.includes(tool.id) && availableTools.find(t => t.id === tool.id));
  };

  const featuredTools = getFeaturedTools();
  
  // Group tools by category for display
  const toolsByCategory = useMemo(() => {
    const categories = {
      'Core Management': availableTools.filter(t => t.category === 'core'),
      'Assessment Tools': availableTools.filter(t => t.category === 'assessment'),
      'Planning & Scheduling': availableTools.filter(t => t.category === 'planning'),
      'Monitoring & Analytics': availableTools.filter(t => t.category === 'monitoring'),
      'Advanced Features': availableTools.filter(t => t.category === 'advanced')
    };
    return categories;
  }, [availableTools]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Professional Tier Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-300" />
              <div>
                <h1 className="text-3xl font-bold">Professional Tier Command Center</h1>
                <p className="text-blue-100 mt-1">Full access to {availableTools.length} professional farm management tools</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 px-4 py-2 text-lg font-semibold">
              Professional
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Tools Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {availableTools.length}
              </div>
              <p className="text-green-600 dark:text-green-400 text-sm">out of {allTools.length} total tools</p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Professional Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                8
              </div>
              <p className="text-blue-600 dark:text-blue-400 text-sm">exclusive pro tools</p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center">
                <BarChart className="h-5 w-5 mr-2" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                100%
              </div>
              <p className="text-purple-600 dark:text-purple-400 text-sm">comprehensive insights</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="featured">Featured Tools</TabsTrigger>
            <TabsTrigger value="all-tools">All Tools</TabsTrigger>
            <TabsTrigger value="gps-mapping">GPS Mapping</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Featured Professional Tools */}
          <TabsContent value="featured" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Professional Tier Exclusive Tools
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced tools available only to Professional tier subscribers
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featuredTools.map((tool) => {
                const Icon = iconMap[tool.icon] || Target;
                return (
                  <Card key={tool.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">{tool.name}</CardTitle>
                      <CardDescription className="text-xs">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={tool.route}>
                        <Button className="w-full group-hover:bg-blue-600 transition-colors">
                          Launch Tool
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* All Tools by Category */}
          <TabsContent value="all-tools" className="space-y-6">
            {Object.entries(toolsByCategory).map(([category, tools]) => (
              <div key={category}>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
                  <div className="h-6 w-1 bg-blue-500 rounded mr-3" />
                  {category} ({tools.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tools.map((tool) => {
                    const Icon = iconMap[tool.icon] || Target;
                    return (
                      <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {tool.minTier === 'professional' ? 'Pro' : 'Standard'}
                            </Badge>
                          </div>
                          <CardTitle className="text-sm">{tool.name}</CardTitle>
                          <CardDescription className="text-xs">{tool.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Link href={tool.route}>
                            <Button variant="outline" className="w-full">
                              Open Tool
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* GPS Mapping Tab */}
          <TabsContent value="gps-mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Professional GPS Mapping Tools
                </CardTitle>
                <CardDescription>
                  Advanced GPS location tools with precision mapping and boundary tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild className="h-20 flex-col">
                    <Link href="/gps-location-tools">
                      <MapPin className="h-6 w-6 mb-2" />
                      <span>GPS Location Tools</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col">
                    <Link href="/paddock-management">
                      <Target className="h-6 w-6 mb-2" />
                      <span>Paddock Management</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  Professional Analytics Suite
                </CardTitle>
                <CardDescription>
                  Comprehensive analytics and performance tracking tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button asChild className="h-20 flex-col">
                    <Link href="/performance-analytics">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <span>Performance Analytics</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col">
                    <Link href="/financial-management">
                      <DollarSign className="h-6 w-6 mb-2" />
                      <span>Financial Management</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-20 flex-col">
                    <Link href="/analytics-hub">
                      <BarChart className="h-6 w-6 mb-2" />
                      <span>Analytics Hub</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Need Help Getting Started?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Access our comprehensive tool library and educational resources
                </p>
              </div>
              <div className="flex space-x-3">
                <Link href="/tools">
                  <Button variant="outline">
                    View All Tools
                  </Button>
                </Link>
                <Link href="/educational-content">
                  <Button>
                    Get Training
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}