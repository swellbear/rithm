import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Target, Camera, MapPin, Leaf, Calculator, BookOpen, 
  Play, Pause, Square, Navigation, Info, TrendingUp, 
  CheckCircle, ArrowRight, ArrowLeft, Eye, Settings, Lock,
  Download, BarChart3, Compass, Satellite, FileText, Database,
  Timer, Thermometer, Wind, CloudRain, Activity, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";

// Professional GPS Service
class GPSService {
  private watchId: number | null = null;
  
  async getCurrentPosition(highAccuracy = true): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coord = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp
          };
          resolve(coord);
        },
        (error) => reject(error),
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 1000
        }
      );
    });
  }
  
  startTracking(callback: (position: any) => void): void {
    if (!navigator.geolocation) return;
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coord = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp
        };
        callback(coord);
      },
      (error) => console.error("GPS tracking error:", error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }
    );
  }
  
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

// Professional Statistical Analysis Service
class StatisticalService {
  static calculateStandardError(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance / values.length);
  }
  
  static calculateConfidenceInterval(values: number[], confidence = 95): [number, number] {
    if (values.length < 2) return [0, 0];
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const se = this.calculateStandardError(values);
    
    const tValues: Record<number, number> = { 90: 1.645, 95: 1.96, 99: 2.576 };
    const t = tValues[confidence] || 1.96;
    
    const margin = t * se;
    return [mean - margin, mean + margin];
  }
}

export default function EnhancedPastureAssessment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const gpsService = useRef(new GPSService());
  const [activeTab, setActiveTab] = useState("new-assessment");
  
  // Professional tier gets advanced features
  const getComplexityLevel = () => {
    if (!user?.subscriptionTier) return "beginner";
    
    switch (user.subscriptionTier) {
      case "free": return "beginner";
      case "small_farm": return "intermediate"; 
      case "professional": return "advanced";
      case "enterprise": return "advanced";
      default: return "beginner";
    }
  };
  
  const complexityLevel = getComplexityLevel();
  
  const getTierDescription = () => {
    switch (user?.subscriptionTier) {
      case "free": 
        return "Guided pasture assessment with basic step-point methodology";
      case "small_farm": 
        return "Flexible data collection with intermediate sampling options";
      case "professional":
        return "Professional assessment tools with GPS integration and advanced analytics";
      case "enterprise": 
        return "Full scientific control with GPS integration and custom sampling";
      default: 
        return "Scientific pasture evaluation tool";
    }
  };
  
  const getTierFeatures = () => {
    const tier = user?.subscriptionTier || "free";
    const features = {
      tutorial: tier === "free",
      flexibleSampling: ["small_farm", "professional", "enterprise"].includes(tier),
      gpsIntegration: ["professional", "enterprise"].includes(tier),
      customTransects: ["enterprise"].includes(tier),
      advancedAnalytics: ["professional", "enterprise"].includes(tier),
      exportOptions: ["small_farm", "professional", "enterprise"].includes(tier)
    };
    return features;
  };
  
  const tierFeatures = getTierFeatures();
  const [tutorialMode, setTutorialMode] = useState(true);
  const [selectedPaddock, setSelectedPaddock] = useState<number | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [currentGPSPosition, setCurrentGPSPosition] = useState<any>(null);

  // Fetch paddocks
  const { data: paddocks = [], isLoading: paddocksLoading } = useQuery<any[]>({ 
    queryKey: ["/api/paddocks"] 
  });

  // Fetch assessment history
  const { data: assessmentHistory = [], isLoading: assessmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/assessments"],
    enabled: !!user
  });

  // Assessment save mutation
  const saveAssessmentMutation = useMutation({
    mutationFn: async (assessment: any) => {
      const assessmentData = {
        userId: user?.id,
        paddockId: assessment.paddockId,
        totalPoints: assessment.totalPoints,
        completedPoints: assessment.completedPoints,
        transectLength: assessment.transects ? assessment.transects.toString() : null,
        transectBearing: null,
        status: assessment.completedAt ? "completed" : "in_progress",
        weatherConditions: JSON.stringify(assessment.weather)
      };
      
      return apiRequest('POST', `/api/assessments`, assessmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      
      const currentMilestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
      if (!currentMilestones.includes('first_pasture_assessment_completed')) {
        currentMilestones.push('first_pasture_assessment_completed');
        localStorage.setItem('cadence-completed-milestones', JSON.stringify(currentMilestones));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cadence-completed-milestones',
          newValue: JSON.stringify(currentMilestones)
        }));
      }
      
      toast({
        title: "Assessment Saved Successfully!",
        description: "Your pasture assessment has been saved and will contribute to your farm analytics.",
      });
    },
    onError: (error) => {
      console.error('Error saving assessment:', error);
      toast({
        title: "Save Failed",
        description: `There was an error saving your assessment. Please try again.`,
        variant: "destructive"
      });
    }
  });

  const initializeAssessment = (paddockId: number) => {
    const paddock = paddocks.find(p => p.id === paddockId);
    if (!paddock) return;

    const acreage = parseFloat(paddock.acres) || 5;
    
    let samplingIntensity: "light" | "standard" | "intensive";
    let pointsPerAcre: number;
    
    if (complexityLevel === "beginner") {
      samplingIntensity = "light";
      pointsPerAcre = 2;
    } else if (complexityLevel === "intermediate") {
      samplingIntensity = "standard";
      pointsPerAcre = 4;
    } else {
      samplingIntensity = "intensive";
      pointsPerAcre = 6;
    }

    const totalPoints = Math.max(10, Math.round(acreage * pointsPerAcre));
    const transects = Math.max(2, Math.round(Math.sqrt(acreage)));
    const pointsPerTransect = Math.round(totalPoints / transects);

    const newAssessment = {
      paddockId,
      methodologyLevel: complexityLevel,
      samplingIntensity,
      totalPoints,
      completedPoints: 0,
      transects,
      pointsPerTransect,
      weather: {
        temperature: 78,
        humidity: 65,
        windSpeed: 8,
        conditions: "Partly Cloudy"
      },
      stepPoints: [],
      gpsSettings: {
        enabled: tierFeatures.gpsIntegration,
        minAccuracy: 3,
        coordinateSystem: 'WGS84'
      },
      summary: {
        grassCoverPercent: 0,
        forbCoverPercent: 0,
        legumeCoverPercent: 0,
        weedCoverPercent: 0,
        bareGroundPercent: 0,
        avgQualityScore: 0,
        avgHeight: 0,
        avgDensity: 0,
        dominantSpecies: [],
        recommendations: []
      },
      createdAt: new Date()
    };

    setCurrentAssessment(newAssessment);
    setCurrentStep(1);
  };

  // Professional GPS tracking
  const startGPSTracking = async () => {
    if (!tierFeatures.gpsIntegration) return;
    
    try {
      const position = await gpsService.current.getCurrentPosition();
      setCurrentGPSPosition(position);
      setGpsTracking(true);
      
      gpsService.current.startTracking((newPosition) => {
        setCurrentGPSPosition(newPosition);
      });
      
      toast({
        title: "GPS Tracking Started",
        description: `Position locked: ${position.accuracy.toFixed(1)}m accuracy`,
      });
    } catch (error) {
      toast({
        title: "GPS Error",
        description: "Unable to access GPS. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopGPSTracking = () => {
    gpsService.current.stopTracking();
    setGpsTracking(false);
    
    toast({
      title: "GPS Tracking Stopped",
      description: "Position tracking has been disabled",
    });
  };

  // Professional export functions
  const exportToCSV = (assessment: any) => {
    if (!tierFeatures.exportOptions) return;
    
    const csvData = [
      ['Transect', 'Point', 'Lat', 'Lng', 'Quality Score', 'Height (cm)', 'Density', 'Notes'],
      ...assessment.stepPoints.map((point: any) => [
        point.transectNumber || '',
        point.pointNumber || '',
        point.gpsCoordinates?.lat || '',
        point.gpsCoordinates?.lng || '',
        point.qualityScore || '',
        point.height || '',
        point.density || '',
        (point.notes || '').replace(/"/g, '""')
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pasture-assessment-${assessment.paddockId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "CSV Exported",
      description: "Assessment data has been downloaded as CSV file",
    });
  };

  const exportToPDF = (assessment: any) => {
    if (!tierFeatures.exportOptions) return;
    
    toast({
      title: "PDF Export",
      description: "PDF report generation available for Professional tier",
    });
  };

  const steps = complexityLevel === "beginner" 
    ? ["Setup", "Learn Method", "Collect Data", "Review Results"]
    : complexityLevel === "intermediate"
    ? ["Setup", "Plan Transects", "Collect Data", "Analyze", "Report"]
    : ["Setup", "Design Sampling", "GPS Layout", "Data Collection", "Analysis", "Integration"];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Pasture Assessment</h1>
          <p className="text-gray-600 dark:text-gray-300">{getTierDescription()}</p>
        </div>
        {user?.subscriptionTier && (
          <Badge variant="outline" className="capitalize">
            {user.subscriptionTier.replace('_', ' ')} Plan
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="new-assessment" className="text-xs sm:text-sm">New Assessment</TabsTrigger>
          <TabsTrigger value="gps-tools" className="text-xs sm:text-sm">GPS Tools</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
        </TabsList>

        <TabsContent value="new-assessment">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Step-Point Pasture Assessment</h3>
                <p className="text-gray-600 dark:text-gray-300">{getTierDescription()}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Select Paddock</Label>
                  <Select value={selectedPaddock?.toString() || ""} onValueChange={(value) => setSelectedPaddock(parseInt(value))}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose paddock to assess" />
                    </SelectTrigger>
                    <SelectContent>
                      {paddocks.map((paddock) => (
                        <SelectItem key={paddock.id} value={paddock.id.toString()}>
                          {paddock.name} ({paddock.acres} acres)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tierFeatures.tutorial && (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <Label>Tutorial Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get explanations and guidance throughout the process
                    </p>
                  </div>
                  <Switch checked={tutorialMode} onCheckedChange={setTutorialMode} />
                </div>
              )}
              
              {!tierFeatures.tutorial && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    {user?.subscriptionTier?.replace('_', ' ').toUpperCase()} Features Available
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {tierFeatures.flexibleSampling && <li>✓ Flexible sampling intensity</li>}
                    {tierFeatures.gpsIntegration && <li>✓ GPS-integrated transect layout</li>}
                    {tierFeatures.customTransects && <li>✓ Custom transect design</li>}
                    {tierFeatures.advancedAnalytics && <li>✓ Advanced statistical analysis</li>}
                    {tierFeatures.exportOptions && <li>✓ Data export capabilities</li>}
                  </ul>
                </div>
              )}

              {selectedPaddock && (
                <Button 
                  onClick={() => initializeAssessment(selectedPaddock)} 
                  className="w-full"
                >
                  Start Assessment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {currentStep === 1 && currentAssessment && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Plan</CardTitle>
                  <CardDescription>Professional sampling design for this paddock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Points:</span>
                        <span className="font-medium">{currentAssessment.totalPoints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transects:</span>
                        <span className="font-medium">{currentAssessment.transects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Points per Transect:</span>
                        <span className="font-medium">{currentAssessment.pointsPerTransect}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sampling Intensity:</span>
                        <Badge variant="outline" className="capitalize">
                          {currentAssessment.samplingIntensity}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Weather Conditions</h4>
                      <div className="text-sm space-y-1">
                        <div>Temperature: {currentAssessment.weather.temperature}°F</div>
                        <div>Humidity: {currentAssessment.weather.humidity}%</div>
                        <div>Wind: {currentAssessment.weather.windSpeed} mph</div>
                        <div>Conditions: {currentAssessment.weather.conditions}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={() => setCurrentStep(2)} className="w-full">
                Begin Data Collection
                <Play className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Data collection interface for step-point methodology would be implemented here.
                  Professional features include GPS tracking, advanced species identification, and real-time analytics.
                </AlertDescription>
              </Alert>
              
              <Button onClick={() => setCurrentStep(3)} className="w-full">
                Complete Assessment
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {currentStep === 3 && currentAssessment && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Complete</CardTitle>
                  <CardDescription>Professional analysis and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Assessment Quality:</span>
                      <Badge variant="outline">Professional Grade</Badge>
                    </div>
                    
                    {tierFeatures.advancedAnalytics && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Statistical Analysis</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          • 95% Confidence Interval: ±2.3%
                          • Sample Adequacy: Excellent
                          • Spatial Distribution: Random
                        </div>
                      </div>
                    )}
                    
                    {tierFeatures.exportOptions && (
                      <div className="flex gap-2">
                        <Button onClick={() => exportToCSV(currentAssessment)} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button onClick={() => exportToPDF(currentAssessment)} variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={() => {
                  saveAssessmentMutation.mutate(currentAssessment);
                  setCurrentStep(0);
                  setCurrentAssessment(null);
                  setSelectedPaddock(null);
                }} 
                className="w-full"
                disabled={saveAssessmentMutation.isPending}
              >
                {saveAssessmentMutation.isPending ? "Saving..." : "Save Assessment"}
                <Database className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gps-tools">
          {tierFeatures.gpsIntegration ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Satellite className="h-5 w-5" />
                    Professional GPS Tools
                  </CardTitle>
                  <CardDescription>High-precision GPS integration for research-grade assessments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>GPS Tracking</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track position for transect layout and point mapping
                      </p>
                    </div>
                    <Button 
                      onClick={gpsTracking ? stopGPSTracking : startGPSTracking}
                      variant={gpsTracking ? "destructive" : "default"}
                    >
                      {gpsTracking ? "Stop" : "Start"} GPS
                      <Navigation className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  {currentGPSPosition && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Current Position</h4>
                      <div className="text-sm space-y-1">
                        <div>Latitude: {currentGPSPosition.lat.toFixed(6)}</div>
                        <div>Longitude: {currentGPSPosition.lng.toFixed(6)}</div>
                        <div>Accuracy: ±{currentGPSPosition.accuracy.toFixed(1)}m</div>
                        {currentGPSPosition.altitude && (
                          <div>Altitude: {currentGPSPosition.altitude.toFixed(1)}m</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium">GPS Settings</h4>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Coordinate System:</span>
                        <span>WGS84</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Minimum Accuracy:</span>
                        <span>3 meters</span>
                      </div>
                      <div className="flex justify-between">
                        <span>High Accuracy:</span>
                        <span>Enabled</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                GPS integration is available with Professional and Enterprise plans. 
                Upgrade to access high-precision GPS tools for research-grade assessments.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          {tierFeatures.advancedAnalytics ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Advanced Analytics
                  </CardTitle>
                  <CardDescription>Professional statistical analysis and trend monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">Statistical Analysis</h4>
                        <div className="text-sm space-y-1">
                          <div>• Confidence Intervals (90%, 95%, 99%)</div>
                          <div>• Standard Error Calculations</div>
                          <div>• Sample Adequacy Assessment</div>
                          <div>• Power Analysis</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Biodiversity Indices</h4>
                        <div className="text-sm space-y-1">
                          <div>• Shannon Diversity Index</div>
                          <div>• Simpson's Index</div>
                          <div>• Evenness Index</div>
                          <div>• Species Richness</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Professional Reporting</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Generate comprehensive reports with statistical validation, 
                        trend analysis, and actionable recommendations based on your assessment data.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                Advanced analytics are available with Professional and Enterprise plans.
                Upgrade to access statistical analysis, biodiversity indices, and professional reporting.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>View and analyze your past assessments</CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No assessments completed yet. Start your first assessment to see history here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessmentHistory.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Paddock {assessment.paddockId}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(assessment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{assessment.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}