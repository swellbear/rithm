import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, Navigation, Compass, Ruler, Target, 
  Satellite, Clock, Download, Upload, Settings,
  Battery, Wifi, Map, Crosshair, ZoomIn, ZoomOut, Route,
  RefreshCw, Building, Droplets, DoorOpen, Package,
  Calculator, Leaf, FileSearch, Camera, BarChart,
  Calendar, Scissors, Cloud, Bell, TrendingUp, Heart,
  DollarSign, BookOpen, Users, ArrowRight, Star, Crown,
  Wrench, Grid, Globe, Truck, Tractor, Sprout, Clipboard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDemoGPSData } from "@/lib/demo-data";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { allTools, getAvailableTools, groupToolsByCategory } from "@/data/tools-config";

interface GPSCoordinate {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy: number;
  timestamp: Date;
}

interface GPSTrack {
  id: string;
  name: string;
  description: string;
  coordinates: GPSCoordinate[];
  totalDistance: number;
  totalArea?: number;
  startTime: Date;
  endTime?: Date;
  type: "boundary" | "infrastructure" | "route" | "measurement";
}

interface SavedLocation {
  id: string;
  name: string;
  description: string;
  coordinate: GPSCoordinate;
  type: "farm_center" | "barn" | "well" | "gate" | "feed_area" | "custom";
  paddockId?: number;
}

interface GPSAccuracyInfo {
  current: number;
  optimal: number;
  factor: "excellent" | "good" | "fair" | "poor";
  recommendation: string;
}

export default function GPSLocationTools() {
  const { user } = useAuth();
  
  // Determine user's tier and available tools
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
    BookOpen, Building: Target, Wrench, Target, Navigation: MapPin,
    Compass, Ruler, Grid, Globe, Truck, Tractor, Sprout, Cow, Clipboard
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
    const categories: Record<string, any[]> = {
      'Core Management': availableTools.filter(t => ['au-calculator', 'water-requirements', 'enhanced-grazing-calendar'].includes(t.id)),
      'Assessment Tools': availableTools.filter(t => ['enhanced-pasture-assessment', 'plant-identification', 'dm-availability'].includes(t.id)),
      'Planning & Scheduling': availableTools.filter(t => ['enhanced-grazing-calendar', 'brush-hog', 'alert-system'].includes(t.id)),
      'Analytics & Monitoring': availableTools.filter(t => ['performance-analytics', 'weather-integration', 'alert-system'].includes(t.id)),
      'Business & Financial': availableTools.filter(t => ['financial-management', 'feed-supplement', 'market-analysis'].includes(t.id)),
      'Advanced Features': availableTools.filter(t => ['health-breeding', 'soil-health', 'infrastructure-equipment'].includes(t.id))
    };
    
    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });
    
    return categories;
  }, [availableTools]);

  const { toast } = useToast();
  const demoData = useDemoGPSData();

  // GPS-specific state
  const [trackingMode, setTrackingMode] = useState<"manual" | "walking" | "driving">("walking");
  const [currentLocation, setCurrentLocation] = useState<GPSCoordinate | null>(null);
  const [accuracyInfo, setAccuracyInfo] = useState<GPSAccuracyInfo | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [paddockCorners, setPaddockCorners] = useState<GPSCoordinate[]>([]);
  const watchIdRef = useRef<number | null>(null);

  // Fetch farm data for GPS operations
  const { data: paddocks = [] } = useQuery<any[]>({ 
    queryKey: ["/api/paddocks"],
    enabled: !demoData.isDemo
  });

  // Get current GPS location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "Your device doesn't support GPS location services.",
        variant: "destructive"
      });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        });
      });

      const coord: GPSCoordinate = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        altitude: position.coords.altitude || undefined,
        accuracy: position.coords.accuracy,
        timestamp: new Date()
      };

      setCurrentLocation(coord);
      updateAccuracyInfo(coord.accuracy);
      
      toast({
        title: "Location Updated",
        description: `GPS location acquired with ${coord.accuracy.toFixed(1)}m accuracy`
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: "Unable to get GPS location. Please check your permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateAccuracyInfo = (accuracy: number) => {
    let factor: "excellent" | "good" | "fair" | "poor";
    let recommendation: string;
    
    if (accuracy <= 3) {
      factor = "excellent";
      recommendation = "Perfect for precision mapping and boundary surveys";
    } else if (accuracy <= 10) {
      factor = "good";
      recommendation = "Good for general farm mapping and paddock marking";
    } else if (accuracy <= 30) {
      factor = "fair";
      recommendation = "Suitable for basic location marking";
    } else {
      factor = "poor";
      recommendation = "Consider moving to open area for better signal";
    }
    
    setAccuracyInfo({
      current: accuracy,
      optimal: 3,
      factor,
      recommendation
    });
  };

  // Paddock creation mutation
  const createPaddockMutation = useMutation({
    mutationFn: async (paddockData: any) => {
      return apiRequest('/api/paddocks', 'POST', paddockData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/paddocks'] });
      toast({
        title: "Paddock Created",
        description: "GPS paddock has been created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Paddock",
        description: "Failed to create paddock. Please try again.",
        variant: "destructive"
      });
    }
  });

  // If user is Professional tier, show the full command center
  if (isProfessional) {
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
                  {featuredTools.length}
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
              <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
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
                    <Card key={tool.id} className="hover:shadow-lg transition-shadow cursor-pointer group border-2 border-transparent hover:border-blue-200">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tools.map((tool) => {
                      const Icon = iconMap[tool.icon] || Target;
                      return (
                        <Card key={tool.id} className="hover:shadow-lg transition-shadow border hover:border-blue-200">
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
                              <Button variant="outline" className="w-full hover:bg-blue-50 hover:border-blue-300">
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
                    Professional GPS Mapping Suite
                  </CardTitle>
                  <CardDescription>
                    Advanced GPS location tools with precision mapping and boundary tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Current Location */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center">
                        <Navigation className="h-4 w-4 mr-2" />
                        Current Location
                      </h4>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {currentLocation ? (
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium">Latitude:</span> {currentLocation.lat.toFixed(6)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Longitude:</span> {currentLocation.lng.toFixed(6)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Accuracy:</span> {currentLocation.accuracy.toFixed(1)}m
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">No location data</div>
                        )}
                      </div>
                      <Button onClick={getCurrentLocation} className="w-full">
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Current Location
                      </Button>
                    </div>

                    {/* Accuracy Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        GPS Accuracy
                      </h4>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {accuracyInfo ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Current Accuracy:</span>
                              <Badge variant={accuracyInfo.factor === 'excellent' ? 'default' : 'secondary'}>
                                {accuracyInfo.factor}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {accuracyInfo.recommendation}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">Get location to see accuracy</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick GPS Actions */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button asChild variant="outline" className="h-20 flex-col">
                      <Link href="/farm-map">
                        <Map className="h-6 w-6 mb-2" />
                        <span>View Farm Map</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col">
                      <Link href="/paddock-management">
                        <Grid className="h-6 w-6 mb-2" />
                        <span>Paddock Management</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" disabled>
                      <Satellite className="h-6 w-6 mb-2" />
                      <span>Survey-Grade GPS</span>
                      <Badge variant="secondary" className="text-xs mt-1">Coming Soon</Badge>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="quick-actions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Daily Operations */}
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Daily Operations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/enhanced-grazing-calendar">
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Grazing Calendar
                      </Button>
                    </Link>
                    <Link href="/water-requirements">
                      <Button variant="outline" className="w-full justify-start">
                        <Droplets className="h-4 w-4 mr-2" />
                        Water Requirements
                      </Button>
                    </Link>
                    <Link href="/weather-integration">
                      <Button variant="outline" className="w-full justify-start">
                        <Cloud className="h-4 w-4 mr-2" />
                        Weather Integration
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Analysis & Planning */}
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center">
                      <BarChart className="h-5 w-5 mr-2" />
                      Analysis & Planning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/enhanced-pasture-assessment">
                      <Button variant="outline" className="w-full justify-start">
                        <Clipboard className="h-4 w-4 mr-2" />
                        Pasture Assessment
                      </Button>
                    </Link>
                    <Link href="/performance-analytics">
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performance Analytics
                      </Button>
                    </Link>
                    <Link href="/financial-management">
                      <Button variant="outline" className="w-full justify-start">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Financial Management
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Livestock Management */}
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="text-purple-800 dark:text-purple-200 flex items-center">
                      <Heart className="h-5 w-5 mr-2" />
                      Livestock Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/livestock-health-breeding">
                      <Button variant="outline" className="w-full justify-start">
                        <Heart className="h-4 w-4 mr-2" />
                        Health & Breeding
                      </Button>
                    </Link>
                    <Link href="/au-calculator">
                      <Button variant="outline" className="w-full justify-start">
                        <Calculator className="h-4 w-4 mr-2" />
                        AU Calculator
                      </Button>
                    </Link>
                    <Link href="/feed-supplement-calculator">
                      <Button variant="outline" className="w-full justify-start">
                        <Package className="h-4 w-4 mr-2" />
                        Feed Supplement
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Help & Support */}
          <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Professional Support Available</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Access comprehensive tool library, training, and priority support
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

  // For non-professional users, show a simplified GPS interface with upgrade prompt
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Upgrade to Professional Tier
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Access all {allTools.length} professional farm management tools
              </p>
            </div>
            <Button>
              Upgrade Now
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              GPS Location Tools
            </CardTitle>
            <CardDescription>
              Basic GPS functionality. Upgrade to Professional for the full suite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={getCurrentLocation} className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                Get Current Location
              </Button>
              {currentLocation && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Latitude:</span> {currentLocation.lat.toFixed(6)}</div>
                    <div><span className="font-medium">Longitude:</span> {currentLocation.lng.toFixed(6)}</div>
                    <div><span className="font-medium">Accuracy:</span> {currentLocation.accuracy.toFixed(1)}m</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}