import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, Calculator, Wheat, Info, Camera, 
  CheckCircle, AlertTriangle, TrendingUp, Clock,
  MapPin, Sun, Cloud, CloudRain, Wind, Eye,
  Thermometer, Droplets, Compass
} from 'lucide-react';
import { calculateLocationSpecificData, getSeasonalRecommendations } from '@/lib/location-calculations';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Paddock, Herd } from '@shared/schema';

interface PaddockAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paddock: Paddock | null;
  herds: Herd[];
  selectedHerd: Herd | null;
}

interface StepPointData {
  id: number;
  grassHeight: number; // inches
  grassDensity: 'sparse' | 'moderate' | 'dense';
  grassQuality: 'poor' | 'fair' | 'good' | 'excellent';
  soilCompaction: 'soft' | 'moderate' | 'hard';
  weedPresence: number; // percentage
  notes: string;
}

interface AssessmentResults {
  averageGrassHeight: number;
  grassDensityScore: number;
  qualityScore: number;
  weedCoverageAvg: number;
  estimatedDMPerAcre: number;
  totalAvailableDM: number;
  requiredDM: number;
  dmBalance: number;
  grazingDays: number;
  feedRecommendations: any[];
}

export default function PaddockAssessmentModal({ 
  isOpen, 
  onClose, 
  paddock, 
  herds, 
  selectedHerd 
}: PaddockAssessmentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPoints, setStepPoints] = useState<StepPointData[]>([]);
  const [currentStepPoint, setCurrentStepPoint] = useState<StepPointData>({
    id: 1,
    grassHeight: 0,
    grassDensity: 'moderate',
    grassQuality: 'fair',
    soilCompaction: 'moderate',
    weedPresence: 0,
    notes: ''
  });
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lon: number} | null>(null);
  const [useGPS, setUseGPS] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const { toast } = useToast();

  // Get GPS location
  const getGPSLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS not supported",
        description: "Your device doesn't support GPS location services.",
        variant: "destructive"
      });
      return;
    }

    setLoadingWeather(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const location = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      
      setGpsLocation(location);
      setUseGPS(true);
      
      // Get weather data for this location
      await getWeatherData(location.lat, location.lon);
      
      toast({
        title: "GPS location acquired",
        description: `Location: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`,
      });
    } catch (error) {
      toast({
        title: "GPS location failed",
        description: "Unable to get your current location. Using default weather data.",
        variant: "destructive"
      });
      setLoadingWeather(false);
    }
  };

  // Get weather data (mock implementation - would use real weather API)
  const getWeatherData = async (lat: number, lon: number) => {
    try {
      // Mock weather data for demonstration
      // In production, would use OpenWeatherMap, Weather.gov, or similar API
      const mockWeatherData = {
        current: {
          temp: 78,
          humidity: 65,
          windSpeed: 8.5,
          windDirection: 'SW',
          windDegrees: 225,
          pressure: 29.92,
          visibility: 10,
          uvIndex: 6,
          conditions: 'Partly Cloudy',
          icon: 'partly-cloudy'
        },
        forecast: [
          { day: 'Today', high: 82, low: 61, conditions: 'Partly Cloudy', precipitation: 10, wind: '8-12 mph SW' },
          { day: 'Tomorrow', high: 79, low: 58, conditions: 'Mostly Sunny', precipitation: 0, wind: '5-10 mph W' },
          { day: 'Thursday', high: 84, low: 63, conditions: 'Thunderstorms', precipitation: 70, wind: '12-18 mph S' },
          { day: 'Friday', high: 76, low: 55, conditions: 'Partly Cloudy', precipitation: 20, wind: '6-10 mph N' },
          { day: 'Saturday', high: 81, low: 59, conditions: 'Sunny', precipitation: 0, wind: '4-8 mph NE' }
        ],
        location: `${lat.toFixed(2)}°N, ${Math.abs(lon).toFixed(2)}°W`,
        lastUpdated: new Date().toLocaleTimeString()
      };

      setWeatherData(mockWeatherData);
      setLoadingWeather(false);
    } catch (error) {
      toast({
        title: "Weather data unavailable",
        description: "Unable to fetch current weather conditions.",
        variant: "destructive"
      });
      setLoadingWeather(false);
    }
  };

  // Calculate recommended number of step points based on paddock size
  const getRecommendedStepPoints = (acres: number): number => {
    if (acres <= 1) return 5;
    if (acres <= 5) return 8;
    if (acres <= 10) return 12;
    if (acres <= 20) return 15;
    return 20;
  };

  const recommendedPoints = paddock ? getRecommendedStepPoints(Number(paddock.acres)) : 5;

  // Helper function for seasonal calculations
  const getSeason = (): string => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

  const addStepPoint = () => {
    if (currentStepPoint.grassHeight === 0) {
      toast({ title: 'Missing Data', description: 'Please measure grass height', variant: 'destructive' });
      return;
    }

    setStepPoints(prev => [...prev, { ...currentStepPoint, id: prev.length + 1 }]);
    
    if (stepPoints.length + 1 >= recommendedPoints) {
      calculateResults([...stepPoints, currentStepPoint]);
      setCurrentStep(2);
    } else {
      setCurrentStepPoint({
        id: stepPoints.length + 2,
        grassHeight: 0,
        grassDensity: 'moderate',
        grassQuality: 'fair',
        soilCompaction: 'moderate',
        weedPresence: 0,
        notes: ''
      });
    }
  };

  const calculateResults = (points: StepPointData[]) => {
    if (!paddock || !selectedHerd) return;

    // Calculate averages from step points
    const avgHeight = points.reduce((sum, p) => sum + p.grassHeight, 0) / points.length;
    const avgWeeds = points.reduce((sum, p) => sum + p.weedPresence, 0) / points.length;
    
    // Convert density to numeric score
    const densityScore = points.reduce((sum, p) => {
      const score = p.grassDensity === 'sparse' ? 1 : p.grassDensity === 'moderate' ? 2 : 3;
      return sum + score;
    }, 0) / points.length;

    // Convert quality to numeric score
    const qualityScore = points.reduce((sum, p) => {
      const score = p.grassQuality === 'poor' ? 1 : p.grassQuality === 'fair' ? 2 : 
                   p.grassQuality === 'good' ? 3 : 4;
      return sum + score;
    }, 0) / points.length;

    // Calculate DM per acre based on measurements
    const heightMultiplier = Math.min(avgHeight / 4, 1.5); // Optimal around 4 inches
    const densityMultiplier = densityScore / 3;
    const qualityMultiplier = qualityScore / 4;
    const seasonMultiplier = getSeason() === 'Spring' || getSeason() === 'Summer' ? 1.0 : 0.6;
    
    const baseDMPerAcre = 1800; // lbs dry matter per acre at full productivity
    const estimatedDMPerAcre = baseDMPerAcre * heightMultiplier * densityMultiplier * qualityMultiplier * seasonMultiplier;
    
    const totalAvailableDM = estimatedDMPerAcre * Number(paddock.acres) * 0.5; // 50% utilization rate
    
    // Calculate animal requirements
    const animalUnits = calculateAnimalUnits(selectedHerd);
    const requiredDMPerDay = animalUnits * 26; // 26 lbs DM per AU per day
    const dmBalance = totalAvailableDM - requiredDMPerDay;
    const grazingDays = Math.floor(totalAvailableDM / requiredDMPerDay);

    // Generate feed recommendations if needed
    const feedRecommendations = dmBalance < 0 ? generateFeedRecommendations(
      Math.abs(dmBalance), 
      selectedHerd, 
      animalUnits
    ) : [];

    setResults({
      averageGrassHeight: avgHeight,
      grassDensityScore: densityScore,
      qualityScore: qualityScore,
      weedCoverageAvg: avgWeeds,
      estimatedDMPerAcre,
      totalAvailableDM,
      requiredDM: requiredDMPerDay,
      dmBalance,
      grazingDays,
      feedRecommendations
    });
  };

  const calculateAnimalUnits = (herd: Herd): number => {
    const baseAU = (herd.count * Number(herd.averageWeight)) / 1000;
    
    // Apply species multipliers
    let speciesMultiplier = 1.0;
    if (herd.species === 'sheep' || herd.species === 'goat') speciesMultiplier = 0.2;
    if (herd.species === 'horse') speciesMultiplier = 1.25;
    
    // Apply physiological adjustments
    let physiologicalMultiplier = 1.0;
    if (herd.lactating && herd.lactatingCount) {
      const lactatingRatio = herd.lactatingCount / herd.count;
      physiologicalMultiplier += lactatingRatio * 0.2; // +20% for lactating
    }
    
    return baseAU * speciesMultiplier * physiologicalMultiplier;
  };

  const generateFeedRecommendations = (deficitLbs: number, herd: Herd, animalUnits: number) => {
    const recommendations = [];
    
    // Base feed options with species-specific adjustments
    const feedOptions = {
      alfalfaCubes: {
        name: 'Alfalfa Cubes',
        protein: '17-20%',
        cost: herd.species === 'cattle' ? '$0.25/lb' : '$0.28/lb',
        efficiency: 0.8,
        suitability: herd.lactating ? 'excellent' : 'good'
      },
      pellets: {
        name: `${herd.species} Pellets`,
        protein: herd.species === 'cattle' ? '14-16%' : '16-18%',
        cost: '$0.20/lb',
        efficiency: 0.9,
        suitability: 'excellent'
      },
      hay: {
        name: herd.species === 'cattle' ? 'Bermuda Hay' : 'Alfalfa Hay',
        protein: herd.species === 'cattle' ? '8-12%' : '15-18%',
        cost: '$150/ton',
        efficiency: 1.2,
        suitability: 'good'
      },
      grain: {
        name: 'Corn/Oats Mix',
        protein: '10-12%',
        cost: '$0.15/lb',
        efficiency: 0.7,
        suitability: herd.species === 'cattle' ? 'good' : 'fair'
      }
    };

    // Generate recommendations based on herd characteristics
    Object.values(feedOptions).forEach(feed => {
      if (feed.suitability === 'fair' && herd.lactating) return; // Skip poor options for lactating animals
      
      const dailyAmount = Math.ceil(deficitLbs * feed.efficiency);
      const feedingFrequency = dailyAmount > 10 ? 'twice daily' : 'once daily';
      
      recommendations.push({
        ...feed,
        dailyAmount,
        feedingFrequency,
        monthlyCost: calculateMonthlyCost(dailyAmount, feed.cost),
        instructions: generateFeedingInstructions(feed, herd, dailyAmount)
      });
    });

    return recommendations.slice(0, 3); // Return top 3 recommendations
  };

  const calculateMonthlyCost = (dailyAmount: number, costStr: string): string => {
    const cost = parseFloat(costStr.replace(/[$\/\w]/g, ''));
    if (costStr.includes('/ton')) {
      return `$${Math.round((dailyAmount * 30 * cost) / 2000)}`;
    }
    return `$${Math.round(dailyAmount * 30 * cost)}`;
  };

  const generateFeedingInstructions = (feed: any, herd: Herd, amount: number): string => {
    if (feed.name.includes('Cubes')) {
      return `Soak cubes for 15 minutes before feeding. Divide into ${amount > 10 ? '2' : '1'} feeding(s) per day.`;
    }
    if (feed.name.includes('Pellets')) {
      return `Feed in troughs or feeders. Provide fresh water nearby. ${herd.lactating ? 'Increase by 25% for lactating animals.' : ''}`;
    }
    if (feed.name.includes('Hay')) {
      return `Provide in hay racks or feeders. Check quality - no mold or dust. Store in dry location.`;
    }
    return `Mix with small amount of existing feed. Gradually increase over 5-7 days to avoid digestive upset.`;
  };

  const resetAssessment = () => {
    setCurrentStep(0);
    setStepPoints([]);
    setCurrentStepPoint({
      id: 1,
      grassHeight: 0,
      grassDensity: 'moderate',
      grassQuality: 'fair',
      soilCompaction: 'moderate',
      weedPresence: 0,
      notes: ''
    });
    setResults(null);
  };

  if (!paddock || !selectedHerd) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Paddock Assessment: {paddock.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assessment Info */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Paddock Size</Label>
                  <p className="font-medium">{paddock.acres} acres</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Animals Moving</Label>
                  <p className="font-medium">{selectedHerd.count} {selectedHerd.species}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Recommended Points</Label>
                  <p className="font-medium">{recommendedPoints} step points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessment Tabs */}
          <Tabs defaultValue="conditions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conditions">Current Conditions</TabsTrigger>
              <TabsTrigger value="assessment">Step Assessment</TabsTrigger>
              <TabsTrigger value="forecast">Weather Forecast</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conditions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Location & Environment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* GPS Location Section */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">GPS Location</Label>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={getGPSLocation}
                        disabled={loadingWeather}
                      >
                        {loadingWeather ? 'Getting Location...' : useGPS ? 'Update Location' : 'Use GPS'}
                      </Button>
                    </div>
                    
                    {gpsLocation ? (
                      <div className="space-y-2">
                        <div className="text-sm text-green-700">
                          ✓ GPS Location: {gpsLocation.lat.toFixed(4)}°N, {Math.abs(gpsLocation.lon).toFixed(4)}°W
                        </div>
                        <div className="text-xs text-gray-600">
                          Location-specific weather data and recommendations active
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        Using general Southeast Oklahoma weather patterns and recommendations
                      </div>
                    )}
                  </div>

                  {/* Current Weather */}
                  {weatherData && (
                    <div className="border rounded-lg p-4">
                      <Label className="text-sm font-medium mb-3 block">Current Weather</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="text-lg font-medium">{weatherData.current.temp}°F</div>
                            <div className="text-xs text-gray-500">Temperature</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Wind className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="text-lg font-medium">{weatherData.current.windSpeed} mph</div>
                            <div className="text-xs text-gray-500">{weatherData.current.windDirection}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="text-lg font-medium">{weatherData.current.humidity}%</div>
                            <div className="text-xs text-gray-500">Humidity</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Sun className="h-4 w-4 text-yellow-500" />
                          <div>
                            <div className="text-lg font-medium">UV {weatherData.current.uvIndex}</div>
                            <div className="text-xs text-gray-500">Index</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-sm">{weatherData.current.conditions}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Visibility: {weatherData.current.visibility} miles | Pressure: {weatherData.current.pressure} inHg
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Livestock Impact Assessment */}
                  <div className="border rounded-lg p-4">
                    <Label className="text-sm font-medium mb-3 block">Livestock Considerations</Label>
                    <div className="space-y-3">
                      {weatherData && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Heat Stress Risk</span>
                            <Badge variant={weatherData.current.temp > 85 ? "destructive" : weatherData.current.temp > 75 ? "default" : "secondary"}>
                              {weatherData.current.temp > 85 ? 'High' : weatherData.current.temp > 75 ? 'Moderate' : 'Low'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Wind Shelter Needed</span>
                            <Badge variant={weatherData.current.windSpeed > 20 ? "destructive" : weatherData.current.windSpeed > 12 ? "default" : "secondary"}>
                              {weatherData.current.windSpeed > 20 ? 'Yes' : weatherData.current.windSpeed > 12 ? 'Consider' : 'No'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">UV Protection</span>
                            <Badge variant={weatherData.current.uvIndex > 7 ? "destructive" : weatherData.current.uvIndex > 4 ? "default" : "secondary"}>
                              {weatherData.current.uvIndex > 7 ? 'Required' : weatherData.current.uvIndex > 4 ? 'Recommended' : 'Optional'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Water Consumption</span>
                            <Badge variant="outline">
                              {weatherData.current.temp > 80 ? '+50%' : weatherData.current.temp > 70 ? '+25%' : 'Normal'}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="forecast" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="h-5 w-5" />
                    <span>5-Day Weather Forecast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weatherData ? (
                    <div className="space-y-3">
                      {weatherData.forecast.map((day: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium w-20">{day.day}</div>
                            <div className="text-sm text-gray-600">{day.conditions}</div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div>{day.high}°/{day.low}°</div>
                            <div className="text-blue-600">{day.precipitation}%</div>
                            <div className="text-gray-500">{day.wind}</div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm font-medium text-yellow-800 mb-2">Grazing Recommendations:</div>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          <li>• Thursday: Move animals before thunderstorms arrive</li>
                          <li>• Provide extra water during hot periods (Today, Thursday)</li>
                          <li>• Friday-Saturday: Ideal conditions for paddock moves</li>
                          <li>• Monitor mud conditions after Thursday's rain</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Cloud className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">Weather forecast unavailable</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={getGPSLocation}
                      >
                        Enable GPS for Local Weather
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assessment" className="space-y-4">
              {currentStep === 0 && (
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Step-Point Method Explained</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">What is the Step-Point Method?</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    The step-point method is a scientific way to measure pasture quality by taking measurements at specific points as you walk through the paddock. This gives you accurate data about grass height, density, and quality to determine how much dry matter (food) is available for your animals.
                  </p>
                  
                  <h4 className="font-medium mb-2">How It Works:</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Walk in a zigzag pattern across the paddock</li>
                    <li>• Stop at predetermined points (we'll guide you)</li>
                    <li>• Measure grass height with a ruler or measuring stick</li>
                    <li>• Assess grass density and quality at each point</li>
                    <li>• Note any weeds or bare spots</li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Why This Matters for Your Animals:</h4>
                  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Determines how many days animals can graze this paddock</li>
                    <li>• Identifies if supplemental feeding is needed</li>
                    <li>• Prevents overgrazing and protects pasture health</li>
                    <li>• Helps plan rotation timing and feed purchases</li>
                  </ul>
                </div>

                <Button onClick={() => setCurrentStep(1)} className="w-full">
                  Start Assessment ({recommendedPoints} points needed)
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Step Point {stepPoints.length + 1} of {recommendedPoints}</span>
                  <Badge variant="outline">
                    {Math.round((stepPoints.length / recommendedPoints) * 100)}% Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={(stepPoints.length / recommendedPoints) * 100} className="mb-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grass Height (inches)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={currentStepPoint.grassHeight || ''}
                      onChange={(e) => setCurrentStepPoint(prev => ({ 
                        ...prev, 
                        grassHeight: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="Measure with ruler"
                    />
                    <p className="text-xs text-gray-500">
                      Measure from ground to top of grass blades
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Grass Density</Label>
                    <div className="flex space-x-2">
                      {['sparse', 'moderate', 'dense'].map(density => (
                        <Button
                          key={density}
                          variant={currentStepPoint.grassDensity === density ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentStepPoint(prev => ({ 
                            ...prev, 
                            grassDensity: density as any 
                          }))}
                        >
                          {density}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Grass Quality</Label>
                    <div className="flex space-x-2">
                      {['poor', 'fair', 'good', 'excellent'].map(quality => (
                        <Button
                          key={quality}
                          variant={currentStepPoint.grassQuality === quality ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentStepPoint(prev => ({ 
                            ...prev, 
                            grassQuality: quality as any 
                          }))}
                        >
                          {quality}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Weed Presence (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={currentStepPoint.weedPresence || ''}
                      onChange={(e) => setCurrentStepPoint(prev => ({ 
                        ...prev, 
                        weedPresence: parseInt(e.target.value) || 0 
                      }))}
                      placeholder="0-100%"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    value={currentStepPoint.notes}
                    onChange={(e) => setCurrentStepPoint(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="Any observations about this spot"
                  />
                </div>

                <Button onClick={addStepPoint} className="w-full">
                  {stepPoints.length + 1 >= recommendedPoints ? 'Complete Assessment' : 'Next Point'}
                </Button>

                {stepPoints.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <h4 className="font-medium mb-2">Points Recorded:</h4>
                    <div className="text-sm space-y-1">
                      {stepPoints.map(point => (
                        <div key={point.id} className="flex justify-between">
                          <span>Point {point.id}:</span>
                          <span>{point.grassHeight}" - {point.grassDensity} - {point.grassQuality}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && results && (
            <div className="space-y-4">
              {/* Assessment Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>Paddock Assessment Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <div className="text-lg font-bold text-green-600">
                        {Math.round(results.averageGrassHeight * 10) / 10}"
                      </div>
                      <div className="text-sm text-gray-600">Avg Grass Height</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(results.estimatedDMPerAcre)}
                      </div>
                      <div className="text-sm text-gray-600">DM lbs/acre</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                      <div className="text-lg font-bold text-purple-600">
                        {results.grazingDays}
                      </div>
                      <div className="text-sm text-gray-600">Grazing Days</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-3 rounded ${results.dmBalance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <div className="font-medium">Dry Matter Status</div>
                      <div className={`text-lg font-bold ${results.dmBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {results.dmBalance >= 0 ? 'Sufficient' : 'Deficit'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {results.dmBalance >= 0 
                          ? `+${Math.round(results.dmBalance)} lbs surplus`
                          : `${Math.round(Math.abs(results.dmBalance))} lbs/day needed`
                        }
                      </div>
                    </div>

                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                      <div className="font-medium">Available vs Required</div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Available:</span>
                          <span>{Math.round(results.totalAvailableDM)} lbs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Need:</span>
                          <span>{Math.round(results.requiredDM)} lbs/day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Recommendations */}
              {results.feedRecommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wheat className="h-5 w-5" />
                      <span>Supplemental Feed Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-orange-800 dark:text-orange-200 mb-4">
                      This paddock needs supplemental feeding. Here are the best options for your {selectedHerd.species}:
                    </div>
                    
                    <div className="space-y-3">
                      {results.feedRecommendations.map((feed, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">{feed.name}</div>
                            <Badge variant={feed.suitability === 'excellent' ? 'default' : 'secondary'}>
                              {feed.suitability}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium text-orange-600 mb-1">
                                {feed.dailyAmount} lbs/day
                              </div>
                              <div>Protein: {feed.protein}</div>
                              <div>Cost: {feed.cost}</div>
                              <div>Monthly: {feed.monthlyCost}</div>
                            </div>
                            <div>
                              <div className="font-medium mb-1">Feeding Instructions:</div>
                              <div className="text-gray-600">{feed.instructions}</div>
                              <div className="mt-1 text-orange-600">Feed {feed.feedingFrequency}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                      <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Feeding Schedule Recommendation:
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        Start supplemental feeding immediately when moving animals to this paddock. 
                        Monitor body condition and adjust amounts as needed. Re-assess paddock in 7-10 days.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-2">
                <Button onClick={resetAssessment} variant="outline">
                  Assess Another Paddock
                </Button>
                <Button onClick={onClose}>
                  Save & Close
                </Button>
              </div>
            </div>
          )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}