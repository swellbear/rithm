import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Cloud, Sun, CloudRain, Snowflake, Wind, Thermometer, 
  Droplets, Eye, MapPin, AlertTriangle, TrendingUp, Calendar, ArrowRight
} from "lucide-react";
import { useWorkflowProgress } from "@/hooks/useWorkflowProgress";
import { useSmartTaskCompletion } from "@/hooks/useSmartTaskCompletion";
import { useLocation } from "wouter";

interface WeatherData {
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    icon: string;
  };
  forecast: WeatherForecast[];
}

interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface WeatherAlert {
  id: string;
  type: "heat" | "cold" | "storm" | "drought" | "flood";
  severity: "watch" | "warning" | "advisory";
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

interface AgricultureImpact {
  grazingConditions: "excellent" | "good" | "fair" | "poor";
  waterStress: "low" | "moderate" | "high" | "extreme";
  heatStress: "none" | "mild" | "moderate" | "severe";
  pastureGrowth: "optimal" | "good" | "slow" | "dormant";
  recommendations: string[];
}

export default function WeatherIntegration() {
  // Auto-set complexity based on subscription tier
  const complexityLevel = 'basic'; // All users get same weather features
  const [locationMethod, setLocationMethod] = useState<"gps" | "zipcode" | "manual">("zipcode");
  const [zipCode, setZipCode] = useState("74701"); // Default SE Oklahoma
  const [manualLat, setManualLat] = useState("34.5");
  const [manualLon, setManualLon] = useState("-95.5");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { updateWorkflowStep } = useWorkflowProgress();
  const [, navigate] = useLocation();
  const [isInWorkflow, setIsInWorkflow] = useState(false);
  const { 
    trackWeatherDataViewed,
    trackForecastChecked,
    trackAlertsReviewed,
    getTaskProgress
  } = useSmartTaskCompletion();

  // Automatic task completion for weather workflow
  useEffect(() => {
    // Mark weather data as viewed immediately when page loads
    console.log('Weather page loaded - marking weather data as viewed');
    trackWeatherDataViewed();
    
    // Mark forecast as checked after 2 seconds (user has time to see forecast section)
    const forecastTimer = setTimeout(() => {
      console.log('Auto-completing forecast check task');
      trackForecastChecked();
    }, 2000);
    
    // Mark alerts as reviewed after 4 seconds (user has time to see alerts)
    const alertsTimer = setTimeout(() => {
      console.log('Auto-completing alerts review task');
      trackAlertsReviewed();
    }, 4000);
    
    return () => {
      clearTimeout(forecastTimer);
      clearTimeout(alertsTimer);
    };
  }, [trackWeatherDataViewed, trackForecastChecked, trackAlertsReviewed]);

  // Mock weather data - in production this would connect to a weather API
  const mockWeatherData: WeatherData = {
    location: {
      name: "Durant, OK",
      lat: 34.0015,
      lon: -96.3711
    },
    current: {
      temperature: 78,
      humidity: 65,
      windSpeed: 8,
      windDirection: 180,
      precipitation: 0,
      pressure: 30.12,
      visibility: 10,
      uvIndex: 6,
      condition: "Partly Cloudy",
      icon: "partly-cloudy"
    },
    forecast: [
      { date: "2025-07-05", high: 85, low: 68, condition: "Sunny", precipitation: 0, humidity: 60, windSpeed: 10, icon: "sunny" },
      { date: "2025-07-06", high: 88, low: 72, condition: "Partly Cloudy", precipitation: 0, humidity: 65, windSpeed: 12, icon: "partly-cloudy" },
      { date: "2025-07-07", high: 91, low: 75, condition: "Mostly Sunny", precipitation: 0, humidity: 70, windSpeed: 8, icon: "sunny" },
      { date: "2025-07-08", high: 93, low: 78, condition: "Hot", precipitation: 0, humidity: 75, windSpeed: 6, icon: "sunny" },
      { date: "2025-07-09", high: 89, low: 74, condition: "Thunderstorms", precipitation: 0.8, humidity: 80, windSpeed: 15, icon: "rain" },
      { date: "2025-07-10", high: 82, low: 69, condition: "Showers", precipitation: 0.3, humidity: 75, windSpeed: 12, icon: "rain" },
      { date: "2025-07-11", high: 84, low: 67, condition: "Partly Cloudy", precipitation: 0.1, humidity: 65, windSpeed: 9, icon: "partly-cloudy" }
    ]
  };

  const mockAlerts: WeatherAlert[] = [
    {
      id: "heat1",
      type: "heat",
      severity: "advisory",
      title: "Heat Advisory",
      description: "Heat index values up to 105°F expected through Thursday. Increase water access for livestock.",
      startTime: "2025-07-08T12:00:00Z",
      endTime: "2025-07-08T20:00:00Z"
    }
  ];

  const calculateHeatIndex = (temp: number, humidity: number): number => {
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

  const calculateAgricultureImpact = (weather: WeatherData): AgricultureImpact => {
    const { current, forecast } = weather;
    const heatIndex = calculateHeatIndex(current.temperature, current.humidity);
    
    // Analyze heat stress
    let heatStress: AgricultureImpact["heatStress"] = "none";
    if (heatIndex > 105) heatStress = "severe";
    else if (heatIndex > 95) heatStress = "moderate";
    else if (heatIndex > 85) heatStress = "mild";

    // Analyze water stress
    let waterStress: AgricultureImpact["waterStress"] = "low";
    const avgTemp = forecast.slice(0, 3).reduce((sum, day) => sum + day.high, 0) / 3;
    const totalPrecip = forecast.slice(0, 7).reduce((sum, day) => sum + day.precipitation, 0);
    
    if (avgTemp > 90 && totalPrecip < 0.5) waterStress = "extreme";
    else if (avgTemp > 85 && totalPrecip < 1.0) waterStress = "high";
    else if (avgTemp > 80 && totalPrecip < 2.0) waterStress = "moderate";

    // Analyze grazing conditions
    let grazingConditions: AgricultureImpact["grazingConditions"] = "good";
    if (heatStress === "severe" || waterStress === "extreme") grazingConditions = "poor";
    else if (heatStress === "moderate" || waterStress === "high") grazingConditions = "fair";
    else if (current.temperature > 75 && current.temperature < 85 && totalPrecip > 1.0) grazingConditions = "excellent";

    // Analyze pasture growth
    let pastureGrowth: AgricultureImpact["pastureGrowth"] = "good";
    if (current.temperature < 40 || current.temperature > 95) pastureGrowth = "dormant";
    else if (current.temperature < 50 || current.temperature > 90) pastureGrowth = "slow";
    else if (current.temperature > 65 && current.temperature < 85 && totalPrecip > 1.5) pastureGrowth = "optimal";

    // Generate recommendations
    const recommendations: string[] = [];
    if (heatStress !== "none") {
      recommendations.push("Increase water access and provide shade for livestock");
    }
    if (waterStress === "high" || waterStress === "extreme") {
      recommendations.push("Monitor water sources closely and consider supplemental watering");
    }
    if (totalPrecip > 2.0) {
      recommendations.push("Good growing conditions - consider extending grazing periods");
    }
    if (forecast.some(day => day.windSpeed > 15)) {
      recommendations.push("High winds expected - secure loose equipment and check fencing");
    }
    if (forecast.some(day => day.precipitation > 0.5)) {
      recommendations.push("Plan indoor activities during heavy rain periods");
    }

    return {
      grazingConditions,
      waterStress,
      heatStress,
      pastureGrowth,
      recommendations
    };
  };

  const agricultureImpact = calculateAgricultureImpact(mockWeatherData);
  const currentHeatIndex = calculateHeatIndex(mockWeatherData.current.temperature, mockWeatherData.current.humidity);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "sunny":
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case "partly cloudy":
      case "mostly sunny":
        return <Cloud className="h-8 w-8 text-gray-400" />;
      case "cloudy":
      case "overcast":
        return <Cloud className="h-8 w-8 text-gray-600" />;
      case "rain":
      case "showers":
      case "thunderstorms":
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case "snow":
        return <Snowflake className="h-8 w-8 text-blue-200" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "watch": return "blue";
      case "advisory": return "yellow";
      case "warning": return "orange";
      default: return "gray";
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Weather Integration
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Real-time weather data and agricultural insights for optimal farm management
            </p>
          </div>

        </div>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger 
            value="current" 
            className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            onClick={() => trackWeatherDataViewed()}
          >
            <span className="leading-[1.1] max-w-full">Current</span>
          </TabsTrigger>
          <TabsTrigger 
            value="forecast" 
            className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            onClick={() => trackForecastChecked()}
          >
            <span className="leading-[1.1] max-w-full">Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="agriculture" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Farm Impact</span>
              <span className="sm:hidden">Impact</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6" id="current-weather">
          {/* Current Weather */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Current Conditions - {mockWeatherData.location.name}</span>
              </CardTitle>
              <CardDescription>Real-time weather data for your farm location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center space-x-4">
                  {getWeatherIcon(mockWeatherData.current.condition)}
                  <div>
                    <div className="text-3xl font-bold">{mockWeatherData.current.temperature}°F</div>
                    <div className="text-lg text-gray-600 dark:text-gray-400">{mockWeatherData.current.condition}</div>
                    <div className="text-sm text-gray-500">
                      Feels like {currentHeatIndex}°F
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span>Humidity: {mockWeatherData.current.humidity}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Wind className="h-4 w-4 text-gray-500" />
                    <span>Wind: {mockWeatherData.current.windSpeed} mph</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span>Visibility: {mockWeatherData.current.visibility} mi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <span>UV Index: {mockWeatherData.current.uvIndex}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Alerts */}
          {mockAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle 
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => trackAlertsReviewed()}
                >
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Active Weather Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <Alert key={alert.id} className={`border-${getSeverityColor(alert.severity)}-200 bg-${getSeverityColor(alert.severity)}-50 dark:bg-${getSeverityColor(alert.severity)}-900/20`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between mb-2">
                          <strong>{alert.title}</strong>
                          <Badge variant="outline" className={`text-${getSeverityColor(alert.severity)}-600`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{alert.description}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Agriculture Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Grazing Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={agricultureImpact.grazingConditions === "excellent" ? "default" : 
                          agricultureImpact.grazingConditions === "good" ? "secondary" : "destructive"}
                  className="capitalize"
                >
                  {agricultureImpact.grazingConditions}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Water Stress</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={agricultureImpact.waterStress === "low" ? "default" : 
                          agricultureImpact.waterStress === "moderate" ? "secondary" : "destructive"}
                  className="capitalize"
                >
                  {agricultureImpact.waterStress}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Heat Stress</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={agricultureImpact.heatStress === "none" ? "default" : 
                          agricultureImpact.heatStress === "mild" ? "secondary" : "destructive"}
                  className="capitalize"
                >
                  {agricultureImpact.heatStress}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pasture Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={agricultureImpact.pastureGrowth === "optimal" ? "default" : 
                          agricultureImpact.pastureGrowth === "good" ? "secondary" : "destructive"}
                  className="capitalize"
                >
                  {agricultureImpact.pastureGrowth}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Workflow continuation button */}
          {isInWorkflow && (
            <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Morning Farm Check Progress</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      Weather checked ✓ - Continue to check animals
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/livestock-health-breeding')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Check Animals
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6" id="forecast">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Forecast</CardTitle>
              <CardDescription>Extended weather outlook for farm planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {mockWeatherData.forecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium w-16">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      {getWeatherIcon(day.condition)}
                      <div>
                        <div className="font-medium">{day.condition}</div>
                        <div className="text-sm text-gray-500">
                          {day.precipitation > 0 && `${day.precipitation}" rain • `}
                          {day.windSpeed} mph wind
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{day.high}°</div>
                      <div className="text-sm text-gray-500">{day.low}°</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agriculture" className="space-y-6" id="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Agricultural Impact Analysis</CardTitle>
              <CardDescription>Weather-based insights for farm management decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium">Current Conditions Impact</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Grazing Conditions:</span>
                        <Badge variant="outline" className="capitalize">
                          {agricultureImpact.grazingConditions}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Water Stress Level:</span>
                        <Badge variant="outline" className="capitalize">
                          {agricultureImpact.waterStress}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Heat Stress Risk:</span>
                        <Badge variant="outline" className="capitalize">
                          {agricultureImpact.heatStress}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pasture Growth Rate:</span>
                        <Badge variant="outline" className="capitalize">
                          {agricultureImpact.pastureGrowth}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Recommendations</h4>
                    <div className="space-y-2">
                      {agricultureImpact.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {complexityLevel !== "basic" && (
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Tool Integration Opportunities</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Droplets className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Water Requirements</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Current heat index of {currentHeatIndex}°F increases water needs by {Math.round((1.3 - 1) * 100)}%
                        </p>
                      </div>
                      
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Grazing Calendar</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Adjust rotation timing based on growth rate and stress conditions
                        </p>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">Alert System</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Trigger alerts for extreme weather and livestock stress conditions
                        </p>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">Performance Analytics</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Correlate weather patterns with livestock performance metrics
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weather Data Configuration</CardTitle>
              <CardDescription>Configure location and data preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Location Method</Label>
                <Select value={locationMethod} onValueChange={(value: any) => setLocationMethod(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gps">GPS Coordinates</SelectItem>
                    <SelectItem value="zipcode">ZIP Code</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {locationMethod === "zipcode" && (
                <div>
                  <Label>ZIP Code</Label>
                  <Input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter ZIP code"
                    className="mt-2"
                  />
                </div>
              )}

              {locationMethod === "manual" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Latitude</Label>
                    <Input
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="34.0015"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                      placeholder="-96.3711"
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Weather Alerts</Label>
                  <p className="text-sm text-gray-500">Receive notifications for severe weather</p>
                </div>
                <Switch
                  checked={alertsEnabled}
                  onCheckedChange={setAlertsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-refresh Data</Label>
                  <p className="text-sm text-gray-500">Update weather data automatically every hour</p>
                </div>
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>

              {complexityLevel === "advanced" && (
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Advanced Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Historical Weather Integration</Label>
                        <p className="text-sm text-gray-500">Include past weather patterns in analysis</p>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Microclimate Adjustments</Label>
                        <p className="text-sm text-gray-500">Account for local terrain effects</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Predictive Modeling</Label>
                        <p className="text-sm text-gray-500">Use AI for extended forecasting</p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}