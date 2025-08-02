import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Scissors, Clock, Calendar, TrendingUp, AlertTriangle, 
  Cloud, Sun, Droplets, Wind, CheckCircle, X,
  Target, Ruler, Settings, FileText, Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BrushHogTask {
  id: string;
  paddockId: number;
  paddockName: string;
  priority: "critical" | "high" | "medium" | "low";
  reason: string;
  recommendedHeight: number;
  currentHeight: number;
  area: number;
  estimatedTime: number;
  weatherWindow: {
    start: Date;
    end: Date;
    conditions: string;
  };
  lastCut?: Date;
  daysSinceLastCut?: number;
  growthRate: number;
  plantSpecies: string[];
  benefits: string[];
}

interface WeatherConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  forecast: {
    date: Date;
    temp: number;
    humidity: number;
    precipitation: number;
    suitable: boolean;
  }[];
}

interface CuttingRecord {
  id: string;
  paddockId: number;
  date: Date;
  heightBefore: number;
  heightAfter: number;
  area: number;
  timeSpent: number;
  operator: string;
  equipment: string;
  fuelUsed?: number;
  notes: string;
  weather: {
    temperature: number;
    humidity: number;
    conditions: string;
  };
  results: {
    quality: "excellent" | "good" | "fair" | "poor";
    regrowthObserved: boolean;
    issuesEncountered: string[];
  };
}

interface Equipment {
  id: string;
  name: string;
  type: "rotary_mower" | "flail_mower" | "bush_hog" | "sickle_bar";
  cuttingWidth: number;
  minHeight: number;
  maxHeight: number;
  speedMph: number;
  fuelConsumption: number;
  maintenance: {
    lastService: Date;
    hoursUntilNext: number;
    issues: string[];
  };
}

export default function BrushHogRecommendations() {
  // Auto-set complexity based on subscription tier
  const complexityLevel = 'intermediate'; // All users get same brush hog features
  const [selectedPaddock, setSelectedPaddock] = useState<string>("");
  const [brushHogTasks, setBrushHogTasks] = useState<BrushHogTask[]>([]);
  const [cuttingRecords, setCuttingRecords] = useState<CuttingRecord[]>([]);
  const [weatherConditions, setWeatherConditions] = useState<WeatherConditions | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");

  const { toast } = useToast();

  // Fetch farm data
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  useEffect(() => {
    generateBrushHogTasks();
    generateMockWeather();
    initializeEquipment();
  }, [paddocks, assessments]);

  const generateBrushHogTasks = () => {
    const tasks: BrushHogTask[] = [];
    const now = new Date();

    paddocks.forEach((paddock, index) => {
      // Simulate different grass heights and growth conditions
      const currentHeight = 8 + Math.random() * 20; // 8-28 inches
      const lastCutDays = Math.floor(Math.random() * 60); // 0-60 days since last cut
      const growthRate = 0.3 + Math.random() * 0.4; // 0.3-0.7 inches per day
      
      let priority: "critical" | "high" | "medium" | "low";
      let reason: string;
      let recommendedHeight: number;

      if (currentHeight > 20) {
        priority = "critical";
        reason = "Grass height exceeds optimal range, quality declining rapidly";
        recommendedHeight = 4;
      } else if (currentHeight > 15) {
        priority = "high";
        reason = "Approaching maximum height for quality maintenance";
        recommendedHeight = 4;
      } else if (currentHeight > 12) {
        priority = "medium";
        reason = "Good timing for maintenance cutting to prevent seedhead formation";
        recommendedHeight = 5;
      } else {
        priority = "low";
        reason = "Height acceptable, monitor for continued growth";
        recommendedHeight = 6;
      }

      // Add weather considerations
      const weatherStart = new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      const weatherEnd = new Date(weatherStart.getTime() + 3 * 24 * 60 * 60 * 1000);

      tasks.push({
        id: `task_${paddock.id}`,
        paddockId: paddock.id,
        paddockName: paddock.name,
        priority,
        reason,
        recommendedHeight,
        currentHeight,
        area: paddock.acres || 5 + Math.random() * 20,
        estimatedTime: Math.round((paddock.acres || 10) * 0.5 + Math.random() * 2), // Hours
        weatherWindow: {
          start: weatherStart,
          end: weatherEnd,
          conditions: "Partly cloudy, light winds"
        },
        lastCut: new Date(now.getTime() - lastCutDays * 24 * 60 * 60 * 1000),
        daysSinceLastCut: lastCutDays,
        growthRate,
        plantSpecies: ["Bermudagrass", "Tall Fescue", "White Clover"],
        benefits: [
          "Maintain forage quality",
          "Prevent weed establishment", 
          "Promote tillering",
          "Improve palatability"
        ]
      });
    });

    tasks.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setBrushHogTasks(tasks);
  };

  const generateMockWeather = () => {
    const now = new Date();
    const forecast = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const temp = 75 + Math.random() * 20; // 75-95°F
      const humidity = 40 + Math.random() * 40; // 40-80%
      const precipitation = Math.random() > 0.7 ? Math.random() * 0.5 : 0; // 30% chance of rain
      
      // Ideal conditions: 70-90°F, <70% humidity, no rain
      const suitable = temp >= 70 && temp <= 90 && humidity < 70 && precipitation === 0;

      forecast.push({
        date,
        temp,
        humidity,
        precipitation,
        suitable
      });
    }

    setWeatherConditions({
      temperature: forecast[0].temp,
      humidity: forecast[0].humidity,
      windSpeed: 5 + Math.random() * 10,
      precipitation: forecast[0].precipitation,
      forecast
    });
  };

  const initializeEquipment = () => {
    const mockEquipment: Equipment[] = [
      {
        id: "rotary_60",
        name: "60\" Rotary Mower",
        type: "rotary_mower",
        cuttingWidth: 60,
        minHeight: 2,
        maxHeight: 24,
        speedMph: 6,
        fuelConsumption: 2.5,
        maintenance: {
          lastService: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          hoursUntilNext: 25,
          issues: []
        }
      },
      {
        id: "bush_hog_72",
        name: "72\" Bush Hog",
        type: "bush_hog",
        cuttingWidth: 72,
        minHeight: 3,
        maxHeight: 36,
        speedMph: 4,
        fuelConsumption: 3.2,
        maintenance: {
          lastService: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          hoursUntilNext: 5,
          issues: ["Blade sharpening needed"]
        }
      }
    ];

    setEquipment(mockEquipment);
    setSelectedEquipment(mockEquipment[0].id);
  };

  const calculateOptimalTiming = (task: BrushHogTask) => {
    if (!weatherConditions) return null;

    const suitableDays = weatherConditions.forecast.filter(day => day.suitable);
    if (suitableDays.length === 0) return null;

    return {
      bestDay: suitableDays[0].date,
      reason: "Optimal weather conditions: low humidity, no precipitation, moderate temperature"
    };
  };

  const recordCutting = (taskId: string) => {
    const task = brushHogTasks.find(t => t.id === taskId);
    if (!task) return;

    const record: CuttingRecord = {
      id: Date.now().toString(),
      paddockId: task.paddockId,
      date: new Date(),
      heightBefore: task.currentHeight,
      heightAfter: task.recommendedHeight,
      area: task.area,
      timeSpent: task.estimatedTime,
      operator: "Current User",
      equipment: selectedEquipment,
      notes: `Cut from ${task.currentHeight}" to ${task.recommendedHeight}"`,
      weather: {
        temperature: weatherConditions?.temperature || 75,
        humidity: weatherConditions?.humidity || 60,
        conditions: "Good cutting conditions"
      },
      results: {
        quality: "good",
        regrowthObserved: false,
        issuesEncountered: []
      }
    };

    setCuttingRecords(prev => [...prev, record]);
    
    // Update task to mark as completed
    setBrushHogTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, lastCut: new Date(), daysSinceLastCut: 0, currentHeight: task.recommendedHeight } : t
    ));

    toast({
      title: "Cutting Recorded",
      description: `Successfully recorded brush hog operation for ${task.paddockName}.`
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderTaskOverview = () => {
    const criticalTasks = brushHogTasks.filter(t => t.priority === "critical").length;
    const highTasks = brushHogTasks.filter(t => t.priority === "high").length;
    const totalArea = brushHogTasks.reduce((sum, task) => sum + task.area, 0);
    const totalTime = brushHogTasks.reduce((sum, task) => sum + task.estimatedTime, 0);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{criticalTasks}</div>
                  <div className="text-sm text-gray-600">Critical</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{highTasks}</div>
                  <div className="text-sm text-gray-600">High Priority</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Ruler className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{totalArea.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Total Acres</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{totalTime.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Est. Hours</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Weather Conditions</CardTitle>
              <CardDescription>Today's conditions for cutting operations</CardDescription>
            </CardHeader>
            <CardContent>
              {weatherConditions ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-orange-500" />
                      <span>{weatherConditions.temperature.toFixed(0)}°F</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span>{weatherConditions.humidity.toFixed(0)}% humidity</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="h-4 w-4 text-gray-500" />
                      <span>{weatherConditions.windSpeed.toFixed(0)} mph</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Cloud className="h-4 w-4 text-gray-500" />
                      <span>{weatherConditions.precipitation > 0 ? `${weatherConditions.precipitation.toFixed(1)}" rain` : "No rain"}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    weatherConditions.temperature >= 70 && weatherConditions.temperature <= 90 && 
                    weatherConditions.humidity < 70 && weatherConditions.precipitation === 0
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {weatherConditions.temperature >= 70 && weatherConditions.temperature <= 90 && 
                       weatherConditions.humidity < 70 && weatherConditions.precipitation === 0 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {weatherConditions.temperature >= 70 && weatherConditions.temperature <= 90 && 
                         weatherConditions.humidity < 70 && weatherConditions.precipitation === 0
                          ? "Excellent cutting conditions"
                          : "Marginal cutting conditions"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading weather data...</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Status</CardTitle>
              <CardDescription>Available cutting equipment and maintenance status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {equipment.map(item => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant="outline">{item.cuttingWidth}"</Badge>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div>Range: {item.minHeight}" - {item.maxHeight}"</div>
                      <div>Speed: {item.speedMph} mph</div>
                      <div>Fuel: {item.fuelConsumption} gal/hr</div>
                    </div>

                    {item.maintenance.issues.length > 0 && (
                      <div className="mt-2 text-sm text-orange-600">
                        <span className="font-medium">Issues:</span> {item.maintenance.issues.join(", ")}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      Next service: {item.maintenance.hoursUntilNext} hours
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderTaskList = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Brush Hog Recommendations</CardTitle>
            <CardDescription>Prioritized cutting recommendations based on grass height, growth rate, and conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {brushHogTasks.map(task => {
                const timing = calculateOptimalTiming(task);
                
                return (
                  <div key={task.id} className={`p-4 rounded-lg border ${getPriorityColor(task.priority)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{task.paddockName}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.area.toFixed(1)} acres
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Current Height:</span>
                        <span className="ml-2 font-medium">{task.currentHeight.toFixed(1)}"</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Target Height:</span>
                        <span className="ml-2 font-medium">{task.recommendedHeight}"</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Cut:</span>
                        <span className="ml-2 font-medium">{task.daysSinceLastCut} days ago</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Est. Time:</span>
                        <span className="ml-2 font-medium">{task.estimatedTime.toFixed(1)} hrs</span>
                      </div>
                    </div>

                    <p className="text-sm mb-3">{task.reason}</p>

                    {complexityLevel !== "basic" && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-1">Benefits:</h5>
                        <div className="flex flex-wrap gap-1">
                          {task.benefits.map((benefit, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {timing && (
                      <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                        <div className="text-sm">
                          <span className="font-medium text-blue-800">Optimal timing:</span> {timing.bestDay.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-blue-600">{timing.reason}</div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => recordCutting(task.id)}>
                        <Scissors className="h-3 w-3 mr-1" />
                        Record Cutting
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                      {complexityLevel === "advanced" && (
                        <Button size="sm" variant="outline">
                          <Target className="h-3 w-3 mr-1" />
                          Optimize Route
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCuttingHistory = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cutting History</CardTitle>
          <CardDescription>Record of completed brush hog operations</CardDescription>
        </CardHeader>
        <CardContent>
          {cuttingRecords.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No cutting records yet. Complete your first operation to see history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cuttingRecords.map(record => (
                <div key={record.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Paddock {record.paddockId}</h4>
                    <Badge className="bg-green-100 text-green-800">
                      {record.results.quality}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-2">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-2">{record.date.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Height Cut:</span>
                      <span className="ml-2">{record.heightBefore.toFixed(1)}" → {record.heightAfter}"</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Area:</span>
                      <span className="ml-2">{record.area.toFixed(1)} acres</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <span className="ml-2">{record.timeSpent.toFixed(1)} hrs</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Equipment:</span> {record.equipment}
                    <span className="ml-4 font-medium">Operator:</span> {record.operator}
                  </div>

                  {record.notes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Notes:</span> {record.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderWeatherPlanning = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>7-Day Weather Forecast</CardTitle>
          <CardDescription>Optimal cutting windows based on weather conditions</CardDescription>
        </CardHeader>
        <CardContent>
          {weatherConditions ? (
            <div className="space-y-3">
              {weatherConditions.forecast.map((day, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    day.suitable ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{day.date.toLocaleDateString()}</div>
                      <div className="text-sm text-gray-600">
                        {day.temp.toFixed(0)}°F • {day.humidity.toFixed(0)}% humidity
                        {day.precipitation > 0 && ` • ${day.precipitation.toFixed(1)}" rain`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {day.suitable ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Ideal</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Poor</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Loading forecast...</p>
          )}

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium mb-2">Optimal Cutting Conditions</h4>
            <ul className="text-sm space-y-1 list-disc ml-4">
              <li>Temperature: 70-90°F for equipment efficiency</li>
              <li>Humidity: Below 70% for faster drying</li>
              <li>No precipitation for 24 hours before cutting</li>
              <li>Light winds (5-15 mph) for even cutting</li>
              <li>Soil firm enough to support equipment</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderIntegration = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Farm Management Integration</CardTitle>
            <CardDescription>How brush hog recommendations integrate with other farm tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Pasture Assessment</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Assessment data automatically triggers cutting recommendations based on grass height and quality
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Grazing Calendar</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cutting schedules coordinate with rotation timing for optimal pasture management
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Cloud className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Weather Integration</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time weather data optimizes cutting timing for best results and equipment protection
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Performance Analytics</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cutting records contribute to pasture health trends and management effectiveness analysis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {complexityLevel === "advanced" && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
              <CardDescription>Professional maintenance management capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Route Optimization</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    AI-powered route planning to minimize travel time and fuel consumption across multiple paddocks.
                  </p>
                  <div className="text-xs text-gray-500 italic">
                    Available in future updates
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Equipment Analytics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Track equipment performance, fuel efficiency, and maintenance scheduling for optimal operations.
                  </p>
                  <Button size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Equipment Dashboard
                  </Button>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Satellite Integration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Use satellite imagery to assess grass height and coverage for precision cutting recommendations.
                  </p>
                  <Button size="sm">
                    <Camera className="h-4 w-4 mr-1" />
                    Satellite Analysis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Brush Hog Recommendations
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Intelligent pasture maintenance scheduling with weather integration and optimization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipment.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={complexityLevel} onValueChange={(value: any) => setComplexityLevel(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="overview" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="weather" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Weather</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">History</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Integration</span>
              <span className="sm:hidden">Integrate</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderTaskOverview()}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {renderTaskList()}
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          {renderWeatherPlanning()}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {renderCuttingHistory()}
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          {renderIntegration()}
        </TabsContent>
      </Tabs>
    </div>
  );
}