import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDemoData, demoAnimals, demoDMData } from "@/lib/demo-data";
import { 
  Droplets, 
  Wheat, 
  Calculator, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Sun,
  CloudRain,
  Thermometer,
  Scale
} from "lucide-react";

interface AnimalData {
  id: number;
  species: string;
  count: number;
  averageWeight: number;
  lactating?: boolean;
}

interface WaterCalculation {
  species: string;
  count: number;
  baseDaily: number;
  temperatureAdjustment: number;
  totalDaily: number;
}

interface DMRequirement {
  species: string;
  count: number;
  dailyDM: number;
  weeklyDM: number;
}

interface SupplementNeed {
  type: string;
  amount: number;
  cost: number;
  reason: string;
}

export default function DailyNeeds() {
  const [selectedComplexity, setSelectedComplexity] = useState<"basic" | "intermediate" | "advanced">("basic");
  const [currentWeather, setCurrentWeather] = useState({
    temperature: 75,
    humidity: 60,
    conditions: "Clear"
  });

  // Fetch livestock data
  const { data: fetchedAnimals = [] } = useQuery<AnimalData[]>({
    queryKey: ["/api/animals"],
    retry: false,
  });

  // Use demo data when in demo mode
  const animals = useDemoData(fetchedAnimals, demoAnimals);

  // Fetch paddock data
  const { data: paddocks = [] } = useQuery<any[]>({
    queryKey: ["/api/paddocks"],
    retry: false,
  });

  // Fetch AU calculations if available
  const { data: auData } = useQuery<any>({
    queryKey: ["/api/au-calculations"],
    retry: false,
  });

  // Fetch DM assessments if available
  const { data: fetchedDMData = [] } = useQuery<any[]>({
    queryKey: ["/api/dm-assessments"],
    retry: false,
  });

  // Use demo data helper for consistent demo experience
  const dmData = useDemoData(fetchedDMData, demoDMData);

  // Calculate water requirements
  const calculateWaterNeeds = (): WaterCalculation[] => {
    if (!animals || animals.length === 0) return [];
    
    const speciesGroups = animals.reduce((acc, animal) => {
      if (!animal.species || !animal.count || !animal.averageWeight) return acc;
      
      const key = animal.species;
      if (!acc[key]) {
        acc[key] = { count: 0, totalWeight: 0, lactatingCount: 0 };
      }
      acc[key].count += animal.count || 0;
      acc[key].totalWeight += (animal.averageWeight || 0) * (animal.count || 0);
      if (animal.lactating) {
        acc[key].lactatingCount += animal.count || 0;
      }
      return acc;
    }, {} as any);

    return Object.entries(speciesGroups).map(([species, data]: [string, any]) => {
      const avgWeight = data.count > 0 ? data.totalWeight / data.count : 1000;
      
      // Base water requirements (gallons per day per animal)
      let baseDaily = 0;
      switch (species.toLowerCase()) {
        case 'cattle':
        case 'dairy':
          baseDaily = avgWeight * 0.035; // 3.5% of body weight
          if (data.lactatingCount > 0) baseDaily *= 1.5; // Lactating adjustment
          break;
        case 'sheep':
          baseDaily = avgWeight * 0.02; // 2% of body weight
          break;
        case 'goats':
          baseDaily = avgWeight * 0.025; // 2.5% of body weight
          break;
        case 'horses':
          baseDaily = avgWeight * 0.06; // 6% of body weight
          break;
        default:
          baseDaily = avgWeight * 0.03; // Default 3%
      }

      // Temperature adjustment (using comprehensive temperature bands)
      const getTemperatureAdjustment = (temp: number): number => {
        if (temp < 32) return 0.8; // Reduced intake in freezing
        if (temp < 50) return 0.9; // Slightly reduced
        if (temp < 70) return 1.0; // Normal
        if (temp < 80) return 1.1; // Slightly increased
        if (temp < 90) return 1.3; // Increased
        if (temp < 100) return 1.5; // Significantly increased
        return 1.8; // Extreme heat
      };
      
      const tempAdjustment = getTemperatureAdjustment(currentWeather.temperature);

      return {
        species,
        count: data.count,
        baseDaily: Math.round(baseDaily),
        temperatureAdjustment: tempAdjustment,
        totalDaily: Math.round(baseDaily * tempAdjustment * data.count)
      };
    });
  };

  // Calculate dry matter requirements
  const calculateDMNeeds = (): DMRequirement[] => {
    if (!animals || animals.length === 0) return [];
    
    const speciesGroups = animals.reduce((acc, animal) => {
      if (!animal.species || !animal.count || !animal.averageWeight) return acc;
      
      const key = animal.species;
      if (!acc[key]) {
        acc[key] = { count: 0, totalWeight: 0 };
      }
      acc[key].count += animal.count || 0;
      acc[key].totalWeight += (animal.averageWeight || 0) * (animal.count || 0);
      return acc;
    }, {} as any);

    return Object.entries(speciesGroups).map(([species, data]: [string, any]) => {
      const avgWeight = data.count > 0 ? data.totalWeight / data.count : 1000;
      
      // DM requirements (% of body weight per day)
      let dmPercent = 0.025; // 2.5% default
      switch (species.toLowerCase()) {
        case 'cattle':
        case 'dairy':
          dmPercent = 0.025; // 2.5%
          break;
        case 'sheep':
        case 'goats':
          dmPercent = 0.03; // 3%
          break;
        case 'horses':
          dmPercent = 0.02; // 2%
          break;
      }

      const dailyDM = avgWeight * dmPercent * data.count;
      
      return {
        species,
        count: data.count,
        dailyDM: Math.round(dailyDM),
        weeklyDM: Math.round(dailyDM * 7)
      };
    });
  };

  // Calculate supplement needs
  const calculateSupplementNeeds = (): SupplementNeed[] => {
    if (!animals || animals.length === 0) return [];
    
    const supplements: SupplementNeed[] = [];
    
    // Check if pasture quality is poor
    const avgPastureQuality = dmData.length > 0 
      ? dmData.reduce((sum, assessment) => sum + (assessment.quality || 2), 0) / dmData.length
      : 2; // Default to fair

    const totalAnimalCount = animals.reduce((sum, a) => sum + (a.count || 0), 0);

    if (avgPastureQuality < 2 && totalAnimalCount > 0) {
      supplements.push({
        type: "Protein Supplement",
        amount: Math.round(totalAnimalCount * 2), // 2 lbs per animal
        cost: 45,
        reason: "Poor pasture quality requires protein supplementation"
      });
    }

    if (currentWeather.temperature > 85 && totalAnimalCount > 0) {
      supplements.push({
        type: "Electrolyte Supplement",
        amount: Math.round(totalAnimalCount * 0.25), // 0.25 lbs per animal
        cost: 12,
        reason: "High temperature stress requires electrolyte support"
      });
    }

    return supplements;
  };

  const waterNeeds = calculateWaterNeeds();
  const dmNeeds = calculateDMNeeds();
  const supplementNeeds = calculateSupplementNeeds();

  const totalAnimals = animals.reduce((sum, animal) => sum + (animal.count || 0), 0);
  const totalWater = waterNeeds.reduce((sum, calc) => sum + (calc.totalDaily || 0), 0);
  const totalDM = dmNeeds.reduce((sum, req) => sum + (req.dailyDM || 0), 0);
  const totalSupplementCost = supplementNeeds.reduce((sum, sup) => sum + (sup.cost || 0), 0);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Needs Calculator</h1>
        <p className="text-gray-600">
          Comprehensive daily requirements for your livestock operation
        </p>
      </div>

      {/* Complexity Level Selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {(["basic", "intermediate", "advanced"] as const).map((level) => (
            <Button
              key={level}
              variant={selectedComplexity === level ? "default" : "outline"}
              onClick={() => setSelectedComplexity(level)}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Scale className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Livestock</p>
                <p className="text-xl font-bold">{totalAnimals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Daily Water</p>
                <p className="text-xl font-bold">{totalWater} gal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wheat className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Daily DM</p>
                <p className="text-xl font-bold">{totalDM} lbs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Temperature</p>
                <p className="text-xl font-bold">{currentWeather.temperature}°F</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="water" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="water" className="flex items-center space-x-2">
            <Droplets className="h-4 w-4" />
            <span>Water</span>
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex items-center space-x-2">
            <Wheat className="h-4 w-4" />
            <span>Feed</span>
          </TabsTrigger>
          <TabsTrigger value="supplements" className="flex items-center space-x-2">
            <Calculator className="h-4 w-4" />
            <span>Supplements</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Summary</span>
          </TabsTrigger>
        </TabsList>

        {/* Water Requirements */}
        <TabsContent value="water">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <span>Daily Water Requirements</span>
              </CardTitle>
              <CardDescription>
                Water needs adjusted for current weather conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {waterNeeds.map((calc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold capitalize">{calc.species}</h3>
                        <p className="text-sm text-gray-500">{calc.count} animals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{calc.totalDaily || 0} gallons/day</p>
                        <p className="text-sm text-gray-500">{calc.count > 0 ? Math.round((calc.totalDaily || 0) / calc.count) : 0} gal/animal</p>
                      </div>
                    </div>
                    
                    {selectedComplexity !== "basic" && (
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Base requirement:</span>
                          <div className="font-medium">{calc.baseDaily} gal/animal</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Temperature adjustment:</span>
                          <div className="font-medium">{(calc.temperatureAdjustment * 100 - 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {currentWeather.temperature > 80 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <p className="text-orange-800">
                      High temperature alert: Ensure constant water access and provide shade
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feed Requirements */}
        <TabsContent value="feed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wheat className="h-5 w-5 text-green-600" />
                <span>Daily Feed Requirements</span>
              </CardTitle>
              <CardDescription>
                Dry matter needs for optimal nutrition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dmNeeds.map((req, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold capitalize">{req.species}</h3>
                        <p className="text-sm text-gray-500">{req.count} animals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{req.dailyDM} lbs DM/day</p>
                        <p className="text-sm text-gray-500">{Math.round(req.dailyDM / req.count)} lbs/animal</p>
                      </div>
                    </div>
                    
                    {selectedComplexity !== "basic" && (
                      <div className="mt-2">
                        <div className="text-sm">
                          <span className="text-gray-500">Weekly requirement:</span>
                          <span className="ml-2 font-medium">{req.weeklyDM} lbs DM</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplements */}
        <TabsContent value="supplements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-purple-600" />
                <span>Supplement Recommendations</span>
              </CardTitle>
              <CardDescription>
                Additional nutrients based on current conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplementNeeds.length > 0 ? (
                <div className="space-y-4">
                  {supplementNeeds.map((supplement, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{supplement.type}</h3>
                          <p className="text-sm text-gray-600">{supplement.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{supplement.amount} lbs</p>
                          <p className="text-sm text-gray-500">${supplement.cost}/week</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Weekly Supplement Cost:</span>
                      <span className="font-bold text-lg">${totalSupplementCost}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Supplements Needed</h3>
                  <p className="text-gray-600">
                    Current pasture conditions and weather are adequate for your livestock needs
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Daily Operations Summary</span>
              </CardTitle>
              <CardDescription>
                Complete overview of today's livestock requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Resource Requirements</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Water Needed:</span>
                      <span className="font-medium">{totalWater} gallons</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Dry Matter:</span>
                      <span className="font-medium">{totalDM} lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supplement Cost:</span>
                      <span className="font-medium">${totalSupplementCost}/week</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Action Items</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Check water tank levels</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Monitor pasture conditions</span>
                    </div>
                    {currentWeather.temperature > 80 && (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Provide extra shade due to heat</span>
                      </div>
                    )}
                    {supplementNeeds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">Administer recommended supplements</span>
                      </div>
                    )}
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