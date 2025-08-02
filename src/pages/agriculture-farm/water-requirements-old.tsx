import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDemoData, demoAnimals, demoWeatherData } from "@/lib/demo-data";
import { 
  Droplets, Thermometer, Sun, Cloud, AlertTriangle, 
  Calculator, TrendingUp, Activity, Info, Settings, CheckCircle
} from "lucide-react";

interface WaterRequirement {
  animalGroup: string;
  species: string;
  count: number;
  baseRequirement: number; // gallons per animal per day
  temperatureAdjustment: number;
  lactationAdjustment: number;
  feedAdjustment: number;
  activityAdjustment: number;
  totalDaily: number;
  notes: string[];
}

interface WeatherData {
  temperature: number;
  humidity: number;
  heatIndex: number;
  condition: string;
}

export default function WaterRequirements() {
  // Get user subscription tier
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const userTier = user?.subscription || 'free';
  const complexityLevel = userTier === 'free' ? 'basic' : userTier === 'small_farm' ? 'intermediate' : 'advanced';
  
  const [temperature, setTemperature] = useState(75);
  const [humidity, setHumidity] = useState(60);
  const [feedType, setFeedType] = useState<"pasture" | "hay" | "grain" | "mixed">("pasture");
  const [waterQuality, setWaterQuality] = useState<"excellent" | "good" | "fair" | "poor">("good");
  const [calculations, setCalculations] = useState<WaterRequirement[]>([]);
  const [useWeatherData, setUseWeatherData] = useState(false);
  
  // Basic tier water assessment form
  const [waterAssessment, setWaterAssessment] = useState({
    waterSources: '',
    adequacyRating: '',
    issues: '',
    notes: '',
    assessmentCompleted: false
  });
  
  const { toast } = useToast();

  // Fetch existing herds for calculations
  const { data: fetchedHerds = [], isLoading } = useQuery<any[]>({ 
    queryKey: ["/api/herds"] 
  });

  // Use demo data when in demo mode
  const herds = useDemoData(fetchedHerds, demoAnimals);

  // Base water requirements (gallons per day)
  const baseRequirements = {
    cattle: {
      calf: 5,
      yearling: 20,
      adult: 30,
      lactating: 50,
      bull: 35
    },
    sheep: {
      lamb: 0.5,
      adult: 1.0,
      lactating: 2.5,
      ram: 1.5
    },
    goats: {
      kid: 0.3,
      adult: 0.8,
      lactating: 2.0,
      buck: 1.0
    },
    horses: {
      foal: 5,
      adult: 12,
      draft: 15
    },
    pigs: {
      piglet: 0.5,
      adult: 3,
      sow: 6,
      boar: 4
    }
  };

  useEffect(() => {
    if (herds.length > 0) {
      calculateWaterRequirements();
    }
  }, [herds, temperature, humidity, feedType, waterQuality, complexityLevel]);

  const calculateHeatIndex = (temp: number, humidity: number): number => {
    // Simplified heat index calculation
    if (temp < 80) return temp;
    
    const hi = -42.379 +
      2.04901523 * temp +
      10.14333127 * humidity -
      0.22475541 * temp * humidity -
      0.00683783 * temp * temp -
      0.05481717 * humidity * humidity +
      0.00122874 * temp * temp * humidity +
      0.00085282 * temp * humidity * humidity -
      0.00000199 * temp * temp * humidity * humidity;
    
    return Math.round(hi);
  };

  const getTemperatureAdjustment = (temp: number, species: string): number => {
    // Temperature adjustment factors
    if (temp < 32) return 0.8; // Reduced intake in freezing
    if (temp < 50) return 0.9; // Slightly reduced
    if (temp < 70) return 1.0; // Normal
    if (temp < 80) return 1.1; // Slightly increased
    if (temp < 90) return 1.3; // Increased
    if (temp < 100) return 1.5; // Significantly increased
    return 1.8; // Extreme heat
  };

  const getFeedAdjustment = (feedType: string): number => {
    switch (feedType) {
      case "pasture": return 1.0; // Base requirement
      case "hay": return 1.15; // Dry feed increases water needs
      case "grain": return 1.25; // High concentrate needs more water
      case "mixed": return 1.1; // Moderate increase
      default: return 1.0;
    }
  };

  const getWaterQualityAdjustment = (quality: string): number => {
    switch (quality) {
      case "excellent": return 1.0;
      case "good": return 1.05;
      case "fair": return 1.15;
      case "poor": return 1.3; // Animals may drink less of poor quality water
      default: return 1.0;
    }
  };

  const getAgeCategory = (age: string | number, species: string): string => {
    if (typeof age === "string") {
      const ageLower = age.toLowerCase();
      if (ageLower.includes("calf") || ageLower.includes("young")) return "calf";
      if (ageLower.includes("yearling")) return "yearling";
      if (ageLower.includes("bull") || ageLower.includes("male")) return "bull";
      if (ageLower.includes("lamb")) return "lamb";
      if (ageLower.includes("kid")) return "kid";
      if (ageLower.includes("foal")) return "foal";
      if (ageLower.includes("piglet")) return "piglet";
      return "adult";
    }
    
    // Numeric age logic (similar to AU calculator)
    const ageNum = typeof age === "number" ? age : parseFloat(age);
    if (species === "cattle") {
      if (ageNum < 1) return "calf";
      if (ageNum < 2) return "yearling";
      return "adult";
    }
    if (species === "sheep" || species === "goats") {
      if (ageNum < 1) return species === "sheep" ? "lamb" : "kid";
      return "adult";
    }
    return "adult";
  };

  const calculateWaterRequirements = () => {
    const newCalculations: WaterRequirement[] = herds.map((herd: any) => {
      const species = herd.species?.toLowerCase() || "cattle";
      const ageCategory = getAgeCategory(herd.age || "adult", species);
      
      // Get base requirement
      const speciesReqs = baseRequirements[species as keyof typeof baseRequirements];
      let baseReq = speciesReqs?.[ageCategory as keyof typeof speciesReqs] || speciesReqs?.adult || 30;
      
      // Calculate adjustments
      const tempAdjustment = getTemperatureAdjustment(temperature, species);
      const feedAdjustment = getFeedAdjustment(feedType);
      const qualityAdjustment = getWaterQualityAdjustment(waterQuality);
      
      let lactationAdjustment = 1.0;
      let activityAdjustment = 1.0;
      const notes: string[] = [];

      // Lactation adjustment
      if (herd.lactating && herd.lactatingCount > 0) {
        const lactatingRatio = herd.lactatingCount / herd.count;
        const lactatingReq = (speciesReqs as any)?.lactating || baseReq * 1.5;
        lactationAdjustment = ((1 - lactatingRatio) * 1.0) + (lactatingRatio * (lactatingReq / baseReq));
        notes.push(`${herd.lactatingCount} lactating animals (+${Math.round((lactationAdjustment - 1) * 100)}%)`);
      }

      // Advanced adjustments
      if (complexityLevel !== "basic") {
        // Activity level (pasture vs confined)
        activityAdjustment = 1.05; // Assume moderate activity on pasture
        
        if (complexityLevel === "advanced") {
          // Additional factors for advanced mode
          if (temperature > 85) {
            notes.push(`High temperature stress (+${Math.round((tempAdjustment - 1) * 100)}%)`);
          }
          if (feedType !== "pasture") {
            notes.push(`${feedType} diet (+${Math.round((feedAdjustment - 1) * 100)}%)`);
          }
          if (waterQuality !== "excellent") {
            notes.push(`${waterQuality} water quality (+${Math.round((qualityAdjustment - 1) * 100)}%)`);
          }
        }
      }

      // Calculate total requirement per animal
      const adjustedRequirement = baseReq * tempAdjustment * lactationAdjustment * 
                                feedAdjustment * activityAdjustment * qualityAdjustment;

      const totalDaily = adjustedRequirement * herd.count;

      return {
        animalGroup: herd.name,
        species: species,
        count: herd.count || 0,
        baseRequirement: baseReq,
        temperatureAdjustment: tempAdjustment,
        lactationAdjustment: lactationAdjustment,
        feedAdjustment: feedAdjustment,
        activityAdjustment: activityAdjustment,
        totalDaily: Math.round(totalDaily * 10) / 10,
        notes
      };
    });

    setCalculations(newCalculations);
  };

  const totalDailyWater = calculations.reduce((sum, calc) => sum + calc.totalDaily, 0);
  const totalAnimals = calculations.reduce((sum, calc) => sum + calc.count, 0);
  const averagePerAnimal = totalAnimals > 0 ? totalDailyWater / totalAnimals : 0;
  const heatIndex = calculateHeatIndex(temperature, humidity);

  const getHeatStressLevel = (heatIndex: number): { level: string; color: string; advice: string } => {
    if (heatIndex < 80) return { 
      level: "Normal", 
      color: "green", 
      advice: "Standard water requirements" 
    };
    if (heatIndex < 90) return { 
      level: "Caution", 
      color: "yellow", 
      advice: "Monitor water consumption closely" 
    };
    if (heatIndex < 105) return { 
      level: "Warning", 
      color: "orange", 
      advice: "Increase water access, provide shade" 
    };
    return { 
      level: "Danger", 
      color: "red", 
      advice: "Critical - ensure constant water access" 
    };
  };

  const heatStress = getHeatStressLevel(heatIndex);

  if (isLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading water requirements calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Daily Water Requirements
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Calculate precise water needs based on livestock, weather, and management factors
            </p>
          </div>

        </div>
      </div>

      <Tabs defaultValue="calculate" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculate">Calculate</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="factors">Factors</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="calculate" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Daily Water</CardTitle>
                <Droplets className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalDailyWater.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">gallons per day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg per Animal</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averagePerAnimal.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">gallons per animal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Heat Stress</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-${heatStress.color}-600`}>
                  {heatStress.level}
                </div>
                <p className="text-xs text-muted-foreground">Heat Index: {heatIndex}°F</p>
              </CardContent>
            </Card>
          </div>

          {/* Heat Stress Alert */}
          {heatIndex > 85 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Heat Stress Alert:</strong> {heatStress.advice}. 
                Water requirements increased by {Math.round((getTemperatureAdjustment(temperature, "cattle") - 1) * 100)}% due to high temperatures.
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Calculations */}
          <Card>
            <CardHeader>
              <CardTitle>Water Requirements by Group</CardTitle>
              <CardDescription>Detailed calculations for each animal group</CardDescription>
            </CardHeader>
            <CardContent>
              {calculations.length > 0 ? (
                <div className="space-y-4">
                  {calculations.map((calc, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{calc.animalGroup}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">{calc.species}</Badge>
                          <Badge variant="secondary">{calc.count} animals</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Base Need:</span>
                          <div className="font-medium">{calc.baseRequirement} gal/day</div>
                        </div>
                        {complexityLevel !== "basic" && (
                          <>
                            <div>
                              <span className="text-gray-500">Temp Adjust:</span>
                              <div className="font-medium">{((calc.temperatureAdjustment - 1) * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Feed Adjust:</span>
                              <div className="font-medium">{(calc.feedAdjustment * 100).toFixed(0)}%</div>
                            </div>
                          </>
                        )}
                        <div>
                          <span className="text-gray-500">Total Daily:</span>
                          <div className="font-bold text-blue-600">{calc.totalDaily} gal</div>
                        </div>
                      </div>

                      {calc.notes.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <strong>Notes:</strong> {calc.notes.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Droplets className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No animal groups found. Add livestock to calculate water requirements.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weather Conditions</CardTitle>
              <CardDescription>Adjust for current or forecasted weather conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label>Temperature (°F)</Label>
                    <div className="mt-2">
                      <Slider
                        value={[temperature]}
                        onValueChange={(value) => setTemperature(value[0])}
                        min={0}
                        max={120}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>0°F</span>
                        <span className="font-medium">{temperature}°F</span>
                        <span>120°F</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Humidity (%)</Label>
                    <div className="mt-2">
                      <Slider
                        value={[humidity]}
                        onValueChange={(value) => setHumidity(value[0])}
                        min={10}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>10%</span>
                        <span className="font-medium">{humidity}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Thermometer className="h-4 w-4 mr-2" />
                    Heat Index Analysis
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Heat Index:</span>
                      <span className="font-bold">{heatIndex}°F</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stress Level:</span>
                      <Badge variant="outline" className={`text-${heatStress.color}-600`}>
                        {heatStress.level}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 dark:text-gray-400">{heatStress.advice}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feed Type</CardTitle>
                <CardDescription>Different feeds affect water consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={feedType} onValueChange={(value: any) => setFeedType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pasture">Fresh Pasture</SelectItem>
                    <SelectItem value="hay">Dry Hay</SelectItem>
                    <SelectItem value="grain">Grain/Concentrate</SelectItem>
                    <SelectItem value="mixed">Mixed Diet</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="space-y-1">
                    <div>Fresh Pasture: Base requirement</div>
                    <div>Dry Hay: +15% water need</div>
                    <div>Grain/Concentrate: +25% water need</div>
                    <div>Mixed Diet: +10% water need</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Water Quality</CardTitle>
                <CardDescription>Quality affects consumption rates</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={waterQuality} onValueChange={(value: any) => setWaterQuality(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="space-y-1">
                    <div>Excellent: No adjustment</div>
                    <div>Good: +5% requirement</div>
                    <div>Fair: +15% requirement</div>
                    <div>Poor: +30% requirement</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {complexityLevel === "advanced" && (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Factors</CardTitle>
                <CardDescription>Additional considerations for precise calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium">Environmental Factors</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Wind speed:</span>
                        <span>Reduces effective temperature</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shade availability:</span>
                        <span>Reduces heat stress</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Water temperature:</span>
                        <span>Cool water preferred in heat</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Physiological Factors</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Pregnancy:</span>
                        <span>+10-15% in late term</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Body condition:</span>
                        <span>Thin animals need more</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Health status:</span>
                        <span>Illness affects consumption</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Planning</CardTitle>
                <CardDescription>System capacity recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Storage Capacity</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {(totalDailyWater * 3).toFixed(0)} gallons
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Recommended: 3-day supply minimum
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Flow Rate Needed</h4>
                  <div className="text-2xl font-bold text-green-600">
                    {(totalDailyWater / 8).toFixed(1)} GPH
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Peak consumption over 8 hours
                  </p>
                </div>

                <div className="text-sm space-y-2">
                  <h4 className="font-medium">Distribution Guidelines</h4>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    <div>• Water source within 800 ft of grazing area</div>
                    <div>• Multiple access points for large herds</div>
                    <div>• Backup water source for emergencies</div>
                    <div>• Monitor consumption daily in hot weather</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Opportunities</CardTitle>
                <CardDescription>Connect with other management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span className="font-medium">AU Calculator</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use AU data for standardized water planning across different species
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sun className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Weather Integration</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatic adjustments based on weather forecasts and alerts
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Alert System</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set up alerts for extreme weather or high consumption days
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Performance Analytics</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track water efficiency and animal health correlations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}