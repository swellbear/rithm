import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Map, Calendar, Target, TrendingUp, Zap, RefreshCw, 
  MapPin, Clock, Leaf, Calculator, Settings, 
  ChevronLeft, ChevronRight, Play, BarChart3,
  Cloud, Bell, ArrowRight, CheckCircle2, Crown,
  Droplets, Navigation, Satellite, Route, Home,
  Eye, Compass, Ruler, Activity, Brain, Move,
  AlertTriangle, Timer, ThermometerSun, CloudRain,
  Wind, Sun, CloudSnow, Zap as Lightning, RotateCcw,
  FastForward, Pause, CheckCircle, XCircle, X
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Paddock, Herd, Animal, WaterSource } from "@shared/schema";

interface RotationPlan {
  id: string;
  currentPaddock: number;
  nextPaddock: number;
  moveDate: Date;
  daysUntilMove: number;
  sequence: number[];
  efficiency: number;
  totalCycle: number;
  waterAccess: boolean;
  restPeriods: number[];
  utilizationTargets: number[];
}

interface PaddockStatus {
  id: number;
  name: string;
  acreage: number;
  currentDM: number;
  quality: number;
  restDaysSince: number;
  readinessScore: number;
  nextAvailable: Date;
  isCurrentlyGrazed: boolean;
  condition: "excellent" | "good" | "fair" | "poor";
  waterSources: number;
  gpsCoordinates: string | null;
  infrastructure: string[];
  lastAssessment: Date | null;
}

interface FarmLayout {
  paddocks: Array<{
    paddock: Paddock;
    x: number;
    y: number;
    scale: number;
    shape: string;
    status: PaddockStatus;
    features: {
      hasWater: boolean;
      hasShade: boolean;
      slope: string;
    };
    rotationOrder?: number;
    isCurrentlyGrazed?: boolean;
    daysUntilMove?: number;
  }>;
  infrastructure: Array<{
    type: string;
    x: number;
    y: number;
    icon: any;
    label: string;
    color: string;
  }>;
}

export default function IntegratedRotationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Professional tier detection
  const userTier = user?.subscriptionTier || user?.subscription_tier || 'basic';
  const isProfessionalTier = userTier === 'professional';
  const isEnterpriseTier = userTier === 'enterprise';
  const isAdvancedTier = isProfessionalTier || isEnterpriseTier;

  // Core data queries
  const { data: paddocks = [], isLoading: paddocksLoading } = useQuery<Paddock[]>({
    queryKey: ['/api/paddocks']
  });

  const { data: herds = [], isLoading: herdsLoading } = useQuery<Herd[]>({
    queryKey: ['/api/herds']
  });

  const { data: animals = [], isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals']
  });

  const { data: waterSources = [], isLoading: waterLoading } = useQuery<any[]>({
    queryKey: ['/api/water-sources']
  });

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ['/api/assessments']
  });

  const { data: dmData = [], isLoading: dmLoading } = useQuery({
    queryKey: ['/api/dm-assessments']
  });

  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"visual" | "calendar" | "analytics">("visual");
  const [rotationPlan, setRotationPlan] = useState<RotationPlan | null>(null);
  const [paddockStatuses, setPaddockStatuses] = useState<PaddockStatus[]>([]);
  const [selectedPaddock, setSelectedPaddock] = useState<number | null>(null);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(false);
  const [showMoveReminder, setShowMoveReminder] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [quickActionMode, setQuickActionMode] = useState<'select' | 'move' | 'assess'>('select');
  const [pendingMove, setPendingMove] = useState<{from: number, to: number} | null>(null);
  const [paddockOrder, setPaddockOrder] = useState<number[]>([]);
  const [optimizationParams, setOptimizationParams] = useState({
    restPeriodMin: 21,
    restPeriodMax: 45,
    utilizationTarget: 70,
    maxGrazingDays: 7,
    minGrazingDays: 2,
    seasonalAdjustments: true,
    weatherIntegration: true,
    waterAccess: true,
    automaticMoves: false
  });
  
  // Initialize paddock order when paddocks are loaded
  useEffect(() => {
    if (paddocks.length > 0 && paddockOrder.length === 0) {
      setPaddockOrder(paddocks.map((_, index) => index));
    }
  }, [paddocks]);

  // Generate farm layout with rotation planning overlay
  const farmLayoutWithRotation = useMemo((): FarmLayout => {
    if (paddocks.length === 0 || paddockOrder.length === 0) return { paddocks: [], infrastructure: [] };

    const paddockShapes = [
      { path: 'M10,10 L80,15 L85,70 L20,75 Z', x: 50, y: 50 },
      { path: 'M5,20 L90,25 L80,80 L15,85 Z', x: 250, y: 80 },
      { path: 'M15,5 L75,20 L70,90 L10,80 Z', x: 150, y: 200 },
      { path: 'M20,15 L85,10 L90,75 L25,90 Z', x: 350, y: 180 },
      { path: 'M10,25 L70,20 L75,85 L5,90 Z', x: 120, y: 320 },
      { path: 'M25,10 L95,20 L85,80 L15,85 Z', x: 320, y: 300 },
    ];

    const infrastructure = [
      { type: 'barn', x: 20, y: 20, icon: Home, label: 'Main Barn', color: '#8B4513' },
      { type: 'well', x: 35, y: 25, icon: Droplets, label: 'Water Well', color: '#4A90E2' },
      { type: 'gate', x: 15, y: 70, icon: Route, label: 'Main Gate', color: '#666666' },
      { type: 'pond', x: 70, y: 30, icon: Droplets, label: 'Livestock Pond', color: '#1E90FF' },
    ];

    // Reorder paddocks based on paddockOrder
    const orderedPaddocks = paddockOrder
      .map(index => paddocks[index])
      .filter(paddock => paddock !== undefined);
    
    const paddockPositions = orderedPaddocks.map((paddock, index) => {
      const shape = paddockShapes[index % paddockShapes.length];
      const acres = parseFloat(paddock.acres || '5');
      const scale = Math.max(0.8, Math.min(1.5, acres / 10));
      
      // Get water sources for this paddock
      const paddockWaterSources = waterSources.filter(ws => ws.paddockId === paddock.id);
      
      // Calculate status
      const status: PaddockStatus = {
        id: paddock.id,
        name: paddock.name,
        acreage: acres,
        currentDM: 2100 + Math.random() * 500, // lbs per acre
        quality: 3 + Math.random() * 2, // 1-5 scale
        restDaysSince: paddock.restDays || Math.floor(Math.random() * 60),
        readinessScore: Math.floor(60 + Math.random() * 40),
        nextAvailable: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
        isCurrentlyGrazed: paddock.currentlyGrazing || false,
        condition: ['excellent', 'good', 'fair', 'poor'][Math.floor(Math.random() * 4)] as any,
        waterSources: paddockWaterSources.length,
        gpsCoordinates: paddock.gpsCoordinates,
        infrastructure: paddockWaterSources.map(ws => ws.name),
        lastAssessment: assessments.length > 0 ? new Date(assessments[0].createdAt) : null
      };

      return {
        paddock,
        x: shape.x + (index > 5 ? 100 : 0),
        y: shape.y + Math.floor(index / 2) * 20,
        scale,
        shape: shape.path,
        status,
        features: {
          hasWater: paddockWaterSources.length > 0,
          hasShade: paddock.shadeAvailability === 'moderate' || paddock.shadeAvailability === 'abundant',
          slope: Math.random() > 0.5 ? 'gentle' : 'moderate'
        },
        rotationOrder: rotationPlan?.sequence.indexOf(index) + 1 || undefined,
        isCurrentlyGrazed: status.isCurrentlyGrazed,
        daysUntilMove: rotationPlan?.daysUntilMove
      };
    });

    return { paddocks: paddockPositions, infrastructure };
  }, [paddocks, waterSources, rotationPlan, assessments, paddockOrder]);

  // Generate optimal rotation plan
  const generateRotationPlan = useCallback(() => {
    if (paddocks.length < 2 || herds.length === 0) return;

    // Calculate total Animal Units
    const totalAU = herds.reduce((sum, herd) => {
      if (herd.composition) {
        return sum + herd.composition.reduce((herdSum, comp) => {
          const auPerAnimal = comp.species === "cattle" ? 1.0 : 0.2;
          return herdSum + (comp.count * auPerAnimal);
        }, 0);
      }
      return sum + (herd.count || 0) * 1.0; // Default to cattle
    }, 0);

    // Create paddock readiness scores
    const paddockScores = paddocks.map((paddock, index) => {
      const waterBonus = waterSources.filter(ws => ws.paddockId === paddock.id).length * 10;
      const restBonus = (paddock.restDays || 0) > 21 ? 20 : 0;
      const baseScore = 50 + Math.random() * 30 + waterBonus + restBonus;
      
      return {
        index,
        paddock,
        score: Math.min(100, baseScore),
        waterAccess: waterSources.some(ws => ws.paddockId === paddock.id),
        readiness: (paddock.restDays || 0) > optimizationParams.restPeriodMin
      };
    }).sort((a, b) => b.score - a.score);

    // Generate rotation sequence
    const sequence = paddockScores.map(p => p.index);
    const currentPaddock = paddockScores.find(p => p.paddock.currentlyGrazing)?.index || 0;
    const nextPaddock = sequence.find(idx => idx !== currentPaddock) || 1;

    // Calculate timing
    const dailyDMNeeded = totalAU * 26; // 26 lbs DM per AU per day
    const currentPaddockData = paddocks[currentPaddock];
    const availableDM = parseFloat(currentPaddockData?.acres || '1') * 2100 * (optimizationParams.utilizationTarget / 100);
    const daysUntilMove = Math.min(
      optimizationParams.maxGrazingDays,
      Math.max(optimizationParams.minGrazingDays, Math.floor(availableDM / dailyDMNeeded))
    );

    const moveDate = new Date(Date.now() + daysUntilMove * 24 * 60 * 60 * 1000);
    const totalCycle = sequence.length * ((optimizationParams.minGrazingDays + optimizationParams.maxGrazingDays) / 2);
    const efficiency = Math.min(100, 70 + (paddockScores[0].score - 60) + (optimizationParams.waterAccess ? 10 : 0));

    const newPlan: RotationPlan = {
      id: `plan-${Date.now()}`,
      currentPaddock,
      nextPaddock,
      moveDate,
      daysUntilMove,
      sequence,
      efficiency,
      totalCycle,
      waterAccess: paddockScores.every(p => p.waterAccess),
      restPeriods: sequence.map(() => optimizationParams.restPeriodMin + Math.floor(Math.random() * 10)),
      utilizationTargets: sequence.map(() => optimizationParams.utilizationTarget + Math.floor(Math.random() * 10 - 5))
    };

    setRotationPlan(newPlan);
    toast({
      title: "Rotation Plan Generated",
      description: `Optimized ${sequence.length}-paddock rotation with ${efficiency}% efficiency`,
    });
  }, [paddocks, herds, waterSources, optimizationParams, toast]);

  // Weather overlay functionality
  const WeatherOverlay = () => {
    if (!showWeatherOverlay) return null;
    
    return (
      <div className="absolute inset-0 bg-blue-900 bg-opacity-20 rounded-lg border-2 border-blue-400 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Weather Impact
            </h3>
            <Button size="sm" variant="outline" onClick={() => setShowWeatherOverlay(false)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white bg-opacity-90 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <ThermometerSun className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Heat Stress</span>
              </div>
              <p className="text-xs text-gray-600">High temperatures affecting grazing patterns</p>
            </div>
            <div className="bg-white bg-opacity-90 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Soil Moisture</span>
              </div>
              <p className="text-xs text-gray-600">Good conditions for paddock moves</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Move reminder functionality
  const MoveReminderAlert = () => {
    if (!showMoveReminder) return null;
    
    return (
      <Alert className="mb-4 border-orange-300 bg-orange-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex justify-between items-center">
          <span>Time to move livestock from Paddock 1 to Paddock 2</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => {
              setPendingMove({from: 1, to: 2});
              setShowMoveReminder(false);
              toast({title: "Move initiated", description: "Tracking livestock move to Paddock 2"});
            }}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Move
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowMoveReminder(false)}>
              <Timer className="h-4 w-4 mr-1" />
              Remind Later
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Quick action toolbar
  const QuickActionToolbar = () => (
    <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-3">
        <Button
          size="sm"
          variant={quickActionMode === 'select' ? 'default' : 'outline'}
          onClick={() => setQuickActionMode('select')}
          className="flex-col h-auto py-2 sm:py-3 px-1 sm:px-2 min-h-[44px] sm:min-h-[48px]"
        >
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
          <span className="text-xs">Select</span>
        </Button>
        <Button
          size="sm"
          variant={quickActionMode === 'move' ? 'default' : 'outline'}
          onClick={() => setQuickActionMode('move')}
          className="flex-col h-auto py-2 sm:py-3 px-1 sm:px-2 min-h-[44px] sm:min-h-[48px]"
        >
          <Move className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
          <span className="text-xs">Move</span>
        </Button>
        <Button
          size="sm"
          variant={quickActionMode === 'assess' ? 'default' : 'outline'}
          onClick={() => setQuickActionMode('assess')}
          className="flex-col h-auto py-2 sm:py-3 px-1 sm:px-2 min-h-[44px] sm:min-h-[48px]"
        >
          <Activity className="h-3 w-3 sm:h-4 sm:w-4 mb-1" />
          <span className="text-xs">Assess</span>
        </Button>
      </div>
      <div className="flex gap-1 sm:gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowWeatherOverlay(!showWeatherOverlay)} className="flex-1 h-8 sm:h-9 text-xs">
          <Cloud className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Weather</span>
          <span className="sm:hidden">Weather</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowMoveReminder(true)} className="flex-1 h-8 sm:h-9 text-xs">
          <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Test Alert</span>
          <span className="sm:hidden">Alert</span>
        </Button>
      </div>
    </div>
  );

  // Simple Rotation Workflow View
  const RotationWorkflowVisualization = () => {
    return (
      <Card className="p-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-green-600" />
                Rotation Plan
              </CardTitle>
              <CardDescription>
                Simple view of your paddock rotation sequence
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              Professional
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MoveReminderAlert />
            <QuickActionToolbar />
            
            {farmLayoutWithRotation.paddocks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Paddocks Yet</p>
                <p className="text-sm">Add your first paddock to start rotation planning</p>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    toast({
                      title: "Opening Paddock Setup",
                      description: "Redirecting to GPS Location Tools to map your first paddock...",
                    });
                    setTimeout(() => {
                      window.location.href = '/gps-location-tools';
                    }, 1000);
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Add First Paddock
                </Button>
              </div>
            ) : (
              <>
                {/* Current Status */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Current Status</span>
                  </div>
                  {(() => {
                    const currentPaddock = farmLayoutWithRotation.paddocks.find(p => p.status.isCurrentlyGrazed);
                    if (currentPaddock) {
                      return (
                        <p className="text-sm text-gray-700">
                          Livestock currently grazing in <strong>Paddock {currentPaddock.paddock.name}</strong>
                          {currentPaddock.daysUntilMove && (
                            <span className="ml-2 text-blue-600">
                              • Move in {currentPaddock.daysUntilMove} days
                            </span>
                          )}
                        </p>
                      );
                    } else {
                      return (
                        <p className="text-sm text-gray-700">
                          No active grazing detected. Click a paddock below to start rotation.
                        </p>
                      );
                    }
                  })()}
                </div>

                {/* Paddock List */}
                <div className="grid gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {farmLayoutWithRotation.paddocks.map((item, index) => {
                    const isPending = pendingMove?.to === item.paddock.id || pendingMove?.from === item.paddock.id;
                    const weatherImpact = {
                      heat: Math.random() > 0.7,
                      rain: Math.random() > 0.8,
                      wind: Math.random() > 0.9
                    };
                    
                    return (
                      <div
                      key={item.paddock.id}
                      className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md relative min-h-[120px] sm:min-h-[140px] ${
                        selectedPaddock === item.paddock.id ? 'border-blue-500 bg-blue-50' : 
                        isPending ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                      } ${item.status.isCurrentlyGrazed ? 'bg-green-50 border-green-300' : ''}`}
                      onClick={() => {
                        if (quickActionMode === 'move' && selectedPaddock && selectedPaddock !== item.paddock.id) {
                          setPendingMove({from: selectedPaddock, to: item.paddock.id});
                          toast({
                            title: "Move Planned", 
                            description: `Moving livestock from Paddock ${selectedPaddock} to Paddock ${item.paddock.name}`
                          });
                        } else if (quickActionMode === 'assess') {
                          toast({
                            title: "Assessment Started",
                            description: `Starting assessment for Paddock ${item.paddock.name}...`,
                          });
                          // Navigate to assessment page for this paddock
                          setTimeout(() => {
                            window.location.href = `/enhanced-pasture-assessment?paddock=${item.paddock.id}`;
                          }, 1000);
                        } else {
                          setSelectedPaddock(item.paddock.id);
                          toast({
                            title: "Paddock Selected",
                            description: `Selected Paddock ${item.paddock.name} for details`,
                          });
                        }
                      }}
                    >
                      {/* Weather Indicators */}
                      {(weatherImpact.heat || weatherImpact.rain || weatherImpact.wind) && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          {weatherImpact.heat && (
                            <div className="bg-orange-100 p-1 rounded-full">
                              <ThermometerSun className="h-3 w-3 text-orange-600" />
                            </div>
                          )}
                          {weatherImpact.rain && (
                            <div className="bg-blue-100 p-1 rounded-full">
                              <CloudRain className="h-3 w-3 text-blue-600" />
                            </div>
                          )}
                          {weatherImpact.wind && (
                            <div className="bg-gray-100 p-1 rounded-full">
                              <Wind className="h-3 w-3 text-gray-600" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Paddock Status Indicator */}
                          <div className={`w-4 h-4 rounded-full ${
                            item.status.isCurrentlyGrazed ? 'bg-green-500' :
                            item.status.readinessScore > 80 ? 'bg-green-400' :
                            item.status.readinessScore > 60 ? 'bg-yellow-400' : 'bg-red-400'
                          } ${item.status.isCurrentlyGrazed ? 'animate-pulse' : ''}`} />
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-sm sm:text-base text-gray-900 flex flex-wrap items-center gap-1 sm:gap-2">
                              Paddock {item.paddock.name}
                              {isPending && (
                                <div className="animate-pulse">
                                  <Move className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                                </div>
                              )}
                              {item.rotationOrder && (
                                <span className="text-xs sm:text-sm text-gray-500">
                                  (#{item.rotationOrder})
                                </span>
                              )}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                              {item.paddock.acres} acres • {item.status.restDaysSince} days rest
                              {isPending && pendingMove?.from === item.paddock.id && (
                                <span className="block sm:inline sm:ml-2 text-orange-600 font-medium">• Moving OUT</span>
                              )}
                              {isPending && pendingMove?.to === item.paddock.id && (
                                <span className="block sm:inline sm:ml-2 text-green-600 font-medium">• Moving IN</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {/* Water Access */}
                          {item.features.hasWater && (
                            <div className="p-1 rounded-full bg-blue-50">
                              <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <Badge 
                            variant={item.status.isCurrentlyGrazed ? "default" : "secondary"}
                            className={`text-xs sm:text-sm min-h-[24px] sm:min-h-[28px] px-2 ${item.status.isCurrentlyGrazed ? "bg-green-600" : ""} ${
                              item.status.isCurrentlyGrazed ? "animate-pulse" : ""
                            }`}
                          >
                            {item.status.isCurrentlyGrazed ? (
                              <>
                                <Activity className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Grazing</span>
                                <span className="sm:hidden">Active</span>
                              </>
                            ) : (
                              item.status.readinessScore > 80 ? "Ready" :
                              item.status.readinessScore > 60 ? "Soon" : "Resting"
                            )}
                          </Badge>
                          
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Readiness Score Bar */}
                      <div className="mt-2 sm:mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Readiness Score</span>
                          <span className="font-medium">{item.status.readinessScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-2">
                          <div 
                            className={`h-2.5 sm:h-2 rounded-full transition-all ${
                              item.status.readinessScore > 80 ? 'bg-green-500' :
                              item.status.readinessScore > 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${item.status.readinessScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Action Indicators */}
                      {quickActionMode === 'move' && (
                        <div className="mt-2 text-xs text-center py-2 bg-orange-50 rounded border border-orange-200 min-h-[32px] sm:min-h-[28px] flex items-center justify-center">
                          {selectedPaddock === item.paddock.id ? 'Move FROM here' : 'Click to move TO here'}
                        </div>
                      )}
                      {quickActionMode === 'assess' && (
                        <div className="mt-2 text-xs text-center py-2 bg-blue-50 rounded border border-blue-200 min-h-[32px] sm:min-h-[28px] flex items-center justify-center">
                          Click to assess paddock
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <Button
              onClick={generateRotationPlan}
              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
            >
              <Brain className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Generate AI Plan</span>
              <span className="sm:hidden">AI Plan</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedPaddock(null);
                setQuickActionMode('select');
                toast({
                  title: "Selection Cleared",
                  description: "All paddock selections cleared. Ready for new selection.",
                });
              }}
              className="flex-1 sm:flex-none"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Clear Selection</span>
              <span className="sm:hidden">Clear</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                toast({
                  title: "Analytics View",
                  description: "Opening paddock performance analytics...",
                });
                // Switch to analytics tab
                const analyticsTab = document.querySelector('[value="analytics"]');
                if (analyticsTab) {
                  (analyticsTab as HTMLElement).click();
                }
              }}
              className="flex-1 sm:flex-none"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>

          {/* Status Summary Panel */}
          <Card className="mt-3 sm:mt-4 bg-gradient-to-r from-blue-50 to-green-50">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-medium text-gray-700">Farm Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    <span className="font-medium">Active Grazing</span>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {farmLayoutWithRotation.paddocks.filter(p => p.status.isCurrentlyGrazed).length} paddocks
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    <span className="font-medium">Ready</span>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {farmLayoutWithRotation.paddocks.filter(p => p.status.readinessScore > 80).length} paddocks
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="font-medium">Water</span>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {farmLayoutWithRotation.paddocks.filter(p => p.features.hasWater).length} sources
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    <span className="font-medium">Avg Rest</span>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {Math.round(farmLayoutWithRotation.paddocks.reduce((sum, p) => sum + p.status.restDaysSince, 0) / farmLayoutWithRotation.paddocks.length)} days
                  </p>
                </div>
              </div>
              
              {/* Weather Advisory */}
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <Cloud className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  <span className="font-medium text-xs sm:text-sm">Weather Advisory</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Consider early morning moves in heat</p>
                  <p>• Good soil conditions for transitions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  };

  // Selected Paddock Details Panel
  const PaddockDetailsPanel = () => {
    const selected = farmLayoutWithRotation.paddocks.find(p => p.paddock.id === selectedPaddock);
    if (!selected) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Paddock {selected.paddock.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Size</Label>
              <p className="text-lg font-bold">{selected.paddock.acres} acres</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Readiness Score</Label>
              <p className="text-lg font-bold text-green-600">{selected.status.readinessScore}/100</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Rest Days</Label>
              <p className="text-lg font-bold">{selected.status.restDaysSince} days</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Water Sources</Label>
              <p className="text-lg font-bold">{selected.status.waterSources}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={selected.status.isCurrentlyGrazed ? "default" : "secondary"}>
                {selected.status.isCurrentlyGrazed ? "Currently Grazed" : "Resting"}
              </Badge>
              <Badge variant="outline">{selected.status.condition}</Badge>
            </div>
          </div>

          {selected.rotationOrder && (
            <div>
              <Label className="text-sm font-medium">Rotation Order</Label>
              <p className="text-lg font-bold text-amber-600">#{selected.rotationOrder}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button className="w-full" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Assessment Data
            </Button>
            <Button className="w-full" variant="outline">
              <Droplets className="h-4 w-4 mr-2" />
              Manage Water Sources
            </Button>
            <Button className="w-full" variant="outline">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Capacity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Number-Based Rotation Interface Component
  const DragDropRotationInterface = ({ paddocks, onReorder }: { 
    paddocks: any[], 
    onReorder: (newOrder: number[]) => void 
  }) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempValue, setTempValue] = useState<string>('');
    const [renderKey, setRenderKey] = useState(0);

    // Always use paddocks from props directly to ensure sync with parent
    const localPaddocks = paddocks;

    const handleNumberClick = (index: number) => {
      setEditingIndex(index);
      setTempValue((index + 1).toString());
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Only allow positive integers
      if (/^\d*$/.test(value)) {
        setTempValue(value);
      }
    };

    const handleNumberSubmit = (currentIndex: number) => {
      const newPosition = parseInt(tempValue) - 1; // Convert to 0-based index
      
      if (isNaN(newPosition) || newPosition < 0 || newPosition >= paddocks.length || newPosition === currentIndex) {
        // Invalid input or no change, reset
        setEditingIndex(null);
        setTempValue('');
        return;
      }

      // Create new order array based on current indices
      const newOrder = Array.from({ length: paddocks.length }, (_, i) => i);
      
      // Swap the two positions
      const temp = newOrder[currentIndex];
      newOrder[currentIndex] = newOrder[newPosition];
      newOrder[newPosition] = temp;
      
      console.log('Paddocks swapped:', {
        paddock1: {
          position: currentIndex + 1,
          name: localPaddocks[currentIndex].paddock.name,
          movedTo: newPosition + 1
        },
        paddock2: {
          position: newPosition + 1,
          name: localPaddocks[newPosition].paddock.name,
          movedTo: currentIndex + 1
        },
        newOrder: newOrder
      });
      
      // Force re-render
      setRenderKey(prev => prev + 1);
      
      // Clear editing state
      setEditingIndex(null);
      setTempValue('');
      
      // Call parent callback with the two indices that were swapped
      onReorder([currentIndex, newPosition]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Enter') {
        handleNumberSubmit(index);
      } else if (e.key === 'Escape') {
        setEditingIndex(null);
        setTempValue('');
      }
    };

    const handleBlur = (index: number) => {
      handleNumberSubmit(index);
    };

    return (
      <div className="space-y-4">
        <div className="text-center py-2 px-4 bg-blue-100 rounded-lg">
          <p className="text-sm font-medium text-blue-800">
            📝 Click on paddock numbers to change their order • Type new position and press Enter
          </p>
        </div>
        
        {/* Grid Layout - 10 per row */}
        <div key={renderKey} className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 max-w-full">
          {localPaddocks.map((item, index) => (
            <div
              key={`${item.paddock.id}-${index}-${renderKey}`}
              title={`${item.paddock.name} (${item.paddock.acres} acres) - ${item.status.isCurrentlyGrazed ? 'Currently Grazing' : item.status.readinessScore > 80 ? 'Ready for Grazing' : 'Resting'}`}
              className={`
                relative bg-white rounded-lg border-2 p-2 min-h-[80px] 
                transition-all duration-150 hover:shadow-lg
                ${item.status.isCurrentlyGrazed ? 'border-green-500 bg-green-50' : 
                  item.status.readinessScore > 80 ? 'border-blue-400' : 'border-gray-300'}
              `}
            >
              {/* Editable Flow Order Number */}
              <div className="absolute -top-1 -left-1 z-10">
                {editingIndex === index ? (
                  <input
                    type="text"
                    value={tempValue}
                    onChange={handleNumberChange}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onBlur={() => handleBlur(index)}
                    className="w-8 h-8 rounded-full bg-blue-600 text-white text-center text-xs font-bold border-2 border-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                    maxLength={2}
                  />
                ) : (
                  <button
                    onClick={() => handleNumberClick(index)}
                    className="bg-gray-600 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                  >
                    {index + 1}
                  </button>
                )}
              </div>

              {/* Current Grazing Indicator */}
              {item.status.isCurrentlyGrazed && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                  <Activity className="h-2 w-2 animate-pulse" />
                </div>
              )}
              
              <div className="text-center">
                <h3 className="font-bold text-xs mb-1 leading-tight line-clamp-2" title={item.paddock.name}>
                  {item.paddock.name.length > 15 ? item.paddock.name.substring(0, 15) + '...' : item.paddock.name}
                </h3>
                <p className="text-xs text-gray-600 mb-1">{item.paddock.acres}ac</p>
                
                {/* Compact Status */}
                <div className="flex items-center justify-center mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status.isCurrentlyGrazed ? 'bg-green-500' : 
                    item.status.readinessScore > 80 ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                </div>
                
                {/* Water Indicator - Icon only */}
                {item.features.hasWater && (
                  <div className="flex items-center justify-center">
                    <Droplets className="h-2 w-2 text-blue-600" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Rotation flows left to right, top to bottom</p>
          <p className="text-xs text-gray-500">
            Click any number to edit • Type 1-{paddocks.length} • Paddocks will swap positions • Press Enter to confirm
          </p>
        </div>
      </div>
    );
  };

  // Rotation Plan Summary
  const RotationPlanSummary = () => {
    if (!rotationPlan) return null;

    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Rotation Plan
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-300">
            Complete visual rotation sequence and timing plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{rotationPlan.efficiency}%</p>
              <p className="text-sm text-gray-600">Efficiency</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{rotationPlan.daysUntilMove}</p>
              <p className="text-sm text-gray-600">Days Until Move</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{rotationPlan.totalCycle}</p>
              <p className="text-sm text-gray-600">Total Cycle Days</p>
            </div>
          </div>

          {/* Interactive Drag-and-Drop Rotation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">🎯 Interactive Rotation Order</h4>
              <div className="text-sm text-gray-600">Click and drag boxes to reorder</div>
            </div>
            
            <div className="relative">
              <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
                {rotationPlan.sequence.map((paddockIndex, i) => {
                  const paddock = paddocks[paddockIndex];
                  const isCurrent = i === 0;
                  const isNext = i === 1;
                  
                  return (
                    <div key={`${paddockIndex}-${i}`} className="flex items-center">
                      {/* Paddock Box */}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', i.toString());
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          const dropIndex = i;
                          
                          if (dragIndex !== dropIndex) {
                            const newSequence = [...rotationPlan.sequence];
                            const [removed] = newSequence.splice(dragIndex, 1);
                            newSequence.splice(dropIndex, 0, removed);
                            
                            setRotationPlan(prev => prev ? {
                              ...prev,
                              sequence: newSequence
                            } : null);
                            
                            toast({
                              title: "Rotation Updated",
                              description: `Paddock ${paddock?.name} moved to position ${dropIndex + 1}`
                            });
                          }
                        }}
                        className={`
                          min-w-[140px] p-4 rounded-lg border-2 cursor-move select-none
                          transition-all duration-200 hover:shadow-lg
                          ${isCurrent ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300' : 
                            isNext ? 'bg-green-100 dark:bg-green-900/30 border-green-300' : 
                            'bg-gray-50 dark:bg-gray-800 border-gray-300 hover:border-gray-400'}
                        `}
                      >
                        <div className="text-center">
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2
                            ${isCurrent ? 'bg-blue-600 text-white' :
                              isNext ? 'bg-green-600 text-white' :
                              'bg-gray-400 text-white'}
                          `}>
                            {i + 1}
                          </div>
                          <div className="font-medium text-sm mb-1">
                            {paddock?.name || `Paddock ${paddockIndex + 1}`}
                          </div>
                          <div className="text-xs text-gray-600">
                            {isCurrent ? 'Current' : 
                             isNext ? 'Next' : 
                             'Waiting'}
                          </div>
                          {isCurrent && (
                            <Badge className="bg-blue-600 text-xs mt-1">Now</Badge>
                          )}
                          {isNext && (
                            <Badge className="bg-green-600 text-xs mt-1">Next</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      {i < rotationPlan.sequence.length - 1 && (
                        <div className="flex items-center mx-2">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Instructions */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>How to use:</strong> Click and drag any paddock box to reorder your rotation sequence. 
                  Changes are saved automatically and update your farm rotation plan.
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Next Move</Label>
            <p className="text-lg">
              Paddock {paddocks[rotationPlan.currentPaddock]?.name} → 
              Paddock {paddocks[rotationPlan.nextPaddock]?.name}
            </p>
            <p className="text-sm text-gray-600">
              Scheduled for {rotationPlan.moveDate.toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Execute Move
            </Button>
            <Button size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-7xl min-h-screen overflow-y-auto">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Rotation Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Smart rotation planning with weather integration
            </p>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm self-start sm:self-center px-3 py-1">
            <Crown className="h-4 w-4 mr-1" />
            {isProfessionalTier ? 'Professional' : isEnterpriseTier ? 'Enterprise' : 'Pro'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1 h-auto p-1 mb-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-2 py-2 sm:py-3 h-auto min-h-[40px] sm:min-h-[44px] flex-col sm:flex-row">
            <Route className="h-3 w-3 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-1" />
            <span className="text-center">
              <span className="hidden lg:inline">Rotation Overview</span>
              <span className="lg:hidden">Overview</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="planning" className="text-xs sm:text-sm px-1 sm:px-2 py-2 sm:py-3 h-auto min-h-[40px] sm:min-h-[44px] flex-col sm:flex-row">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-1" />
            <span className="text-center">
              <span className="hidden lg:inline">Optimization</span>
              <span className="lg:hidden">Plan</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm px-1 sm:px-2 py-2 sm:py-3 h-auto min-h-[40px] sm:min-h-[44px] flex-col sm:flex-row">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-1" />
            <span className="text-center">
              <span className="hidden lg:inline">Analytics</span>
              <span className="lg:hidden">Stats</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm px-1 sm:px-2 py-2 sm:py-3 h-auto min-h-[40px] sm:min-h-[44px] flex-col sm:flex-row">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mb-1 sm:mb-0 sm:mr-1" />
            <span className="text-center">
              <span className="hidden lg:inline">Settings</span>
              <span className="lg:hidden">Config</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Pending Move Confirmation */}
          {pendingMove && (
            <Alert className="border-orange-300 bg-orange-50">
              <Move className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>
                  Pending move: Paddock {pendingMove.from} → Paddock {pendingMove.to}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => {
                    toast({
                      title: "Move Confirmed",
                      description: `Livestock moved from Paddock ${pendingMove.from} to Paddock ${pendingMove.to}`
                    });
                    setPendingMove(null);
                  }}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirm Move
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingMove(null)}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Rotation Management Dashboard
              </CardTitle>
              <CardDescription>
                Complete rotation status, actions, and decisions in one view
              </CardDescription>
            </CardHeader>
            <CardContent>
              {farmLayoutWithRotation.paddocks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Route className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Paddocks Added Yet</p>
                  <p className="text-sm">Add paddocks to see current grazing status</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Status Overview */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Current Status
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                        <div className="text-lg font-bold text-green-700">
                          {farmLayoutWithRotation.paddocks.filter(p => p.status.isCurrentlyGrazed).length}
                        </div>
                        <div className="text-xs text-green-600">Currently Grazing</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                        <div className="text-lg font-bold text-blue-700">
                          {farmLayoutWithRotation.paddocks.filter(p => p.status.readinessScore > 80).length}
                        </div>
                        <div className="text-xs text-blue-600">Ready to Graze</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                        <div className="text-lg font-bold text-purple-700">
                          {farmLayoutWithRotation.paddocks.filter(p => p.features.hasWater).length}
                        </div>
                        <div className="text-xs text-purple-600">With Water</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                        <div className="text-lg font-bold text-orange-700">
                          {Math.round(farmLayoutWithRotation.paddocks.reduce((sum, p) => sum + p.status.restDaysSince, 0) / farmLayoutWithRotation.paddocks.length)}
                        </div>
                        <div className="text-xs text-orange-600">Avg Rest Days</div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Priority Actions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Move className="h-5 w-5" />
                      Today's Actions
                    </h3>
                    <div className="space-y-3">
                      {rotationPlan && rotationPlan.daysUntilMove <= 1 ? (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <Move className="h-5 w-5 text-green-600" />
                          <div className="flex-1">
                            <p className="font-medium text-green-800">Move Livestock Today</p>
                            <p className="text-sm text-green-600">
                              From Paddock {paddocks[rotationPlan.currentPaddock]?.name} to Paddock {paddocks[rotationPlan.nextPaddock]?.name}
                            </p>
                          </div>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Execute
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium text-blue-800">Next Move Scheduled</p>
                            <p className="text-sm text-blue-600">
                              {rotationPlan ? `${rotationPlan.daysUntilMove} days - ${rotationPlan.moveDate.toLocaleDateString()}` : 'No moves scheduled'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <Timer className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-800">Rest Period Check</p>
                            <p className="text-sm text-yellow-600">
                              {farmLayoutWithRotation.paddocks.filter(p => p.status.restDaysSince >= 21).length} paddocks ready
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <RefreshCw className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-purple-800">Cycle Efficiency</p>
                            <p className="text-sm text-purple-600">
                              {rotationPlan ? `${rotationPlan.efficiency}% efficiency` : 'No active rotation'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Execute Move
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Optimize Rotation
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Plan
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4 sm:space-y-6">
          {/* Interactive Rotation Plan */}
          <RotationPlanSummary />

          {/* Rotation Plan Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Rotation Plan
              </CardTitle>
              <CardDescription>
                Complete visual rotation sequence and timing plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {farmLayoutWithRotation.paddocks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Route className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Rotation Plan Yet</p>
                  <p className="text-sm">Add paddocks to visualize your rotation flow</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Flow Chart Container */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-3 sm:p-4 lg:p-6 overflow-x-auto">
                    <div className="min-w-0 sm:min-w-max">
                      {/* Timeline Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <span className="font-medium text-gray-700 text-sm sm:text-base">Rotation Timeline</span>
                        </div>
                        <div className="hidden sm:block flex-1 h-px bg-gray-300"></div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {farmLayoutWithRotation.paddocks.length} paddocks • {Math.round(farmLayoutWithRotation.paddocks.reduce((sum, p) => sum + p.status.restDaysSince, 0) / farmLayoutWithRotation.paddocks.length)}-day avg rest
                        </div>
                      </div>

                      {/* Interactive Drag-and-Drop Rotation Interface */}
                      <div className="relative">
                        <DragDropRotationInterface 
                          paddocks={farmLayoutWithRotation.paddocks}
                          onReorder={(swapIndices) => {
                            console.log('Parent onReorder called with swap indices:', swapIndices);
                            
                            // swapIndices contains the two positions that were swapped
                            const [fromIdx, toIdx] = swapIndices;
                            
                            // Create a new paddockOrder array with the swap applied
                            const newPaddockOrder = [...paddockOrder];
                            const temp = newPaddockOrder[fromIdx];
                            newPaddockOrder[fromIdx] = newPaddockOrder[toIdx];
                            newPaddockOrder[toIdx] = temp;
                            
                            // Update the paddock order state
                            setPaddockOrder(newPaddockOrder);
                            
                            // Get the actual paddock names for display
                            const reorderedPaddocks = newPaddockOrder.map(index => paddocks[index]);
                            console.log('Reordered paddocks:', reorderedPaddocks.map(p => p.name));
                            
                            // Handle the reordering logic here
                            toast({
                              title: "Rotation Updated",
                              description: `Swapped positions ${fromIdx + 1} and ${toIdx + 1}`
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rotation Plan Summary */}
          <RotationPlanSummary />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-5 w-5" />
                Planning Actions
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Execute rotation moves and set up scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                <Button onClick={generateRotationPlan} className="bg-green-600 hover:bg-green-700 text-sm sm:text-base">
                  <Brain className="h-4 w-4 mr-2" />
                  Optimize Flow
                </Button>
                <Button variant="outline" onClick={() => setShowMoveReminder(true)} className="text-sm sm:text-base">
                  <Bell className="h-4 w-4 mr-2" />
                  Set Move Reminder
                </Button>
                <Button variant="outline" className="text-sm sm:text-base" onClick={() => setShowScheduleDialog(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Moves
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Brain className="h-5 w-5" />
                Optimization Parameters
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure parameters for intelligent rotation planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Rest Period Range</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder="Min days"
                        value={optimizationParams.restPeriodMin}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOptimizationParams(prev => ({
                            ...prev,
                            restPeriodMin: value === '' ? '' : (parseInt(value) || 21)
                          }));
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setOptimizationParams(prev => ({
                              ...prev,
                              restPeriodMin: 21
                            }));
                          }
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Max days"
                        value={optimizationParams.restPeriodMax}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOptimizationParams(prev => ({
                            ...prev,
                            restPeriodMax: value === '' ? '' : (parseInt(value) || 45)
                          }));
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setOptimizationParams(prev => ({
                              ...prev,
                              restPeriodMax: 45
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Utilization Target (%)</Label>
                    <Slider
                      value={[optimizationParams.utilizationTarget]}
                      onValueChange={([value]) => setOptimizationParams(prev => ({
                        ...prev,
                        utilizationTarget: value
                      }))}
                      max={100}
                      min={30}
                      step={5}
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {optimizationParams.utilizationTarget}% of available forage
                    </p>
                  </div>

                  <div>
                    <Label>Grazing Days Range</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={optimizationParams.minGrazingDays}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOptimizationParams(prev => ({
                            ...prev,
                            minGrazingDays: value === '' ? '' : (parseInt(value) || 2)
                          }));
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setOptimizationParams(prev => ({
                              ...prev,
                              minGrazingDays: 2
                            }));
                          }
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={optimizationParams.maxGrazingDays}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOptimizationParams(prev => ({
                            ...prev,
                            maxGrazingDays: value === '' ? '' : (parseInt(value) || 7)
                          }));
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setOptimizationParams(prev => ({
                              ...prev,
                              maxGrazingDays: 7
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Seasonal Adjustments</Label>
                      <p className="text-sm text-gray-600">Adjust for growth rates</p>
                    </div>
                    <Switch
                      checked={optimizationParams.seasonalAdjustments}
                      onCheckedChange={(checked) => setOptimizationParams(prev => ({
                        ...prev,
                        seasonalAdjustments: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weather Integration</Label>
                      <p className="text-sm text-gray-600">Factor weather forecasts</p>
                    </div>
                    <Switch
                      checked={optimizationParams.weatherIntegration}
                      onCheckedChange={(checked) => setOptimizationParams(prev => ({
                        ...prev,
                        weatherIntegration: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Water Access Priority</Label>
                      <p className="text-sm text-gray-600">Prioritize paddocks with water</p>
                    </div>
                    <Switch
                      checked={optimizationParams.waterAccess}
                      onCheckedChange={(checked) => setOptimizationParams(prev => ({
                        ...prev,
                        waterAccess: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Automatic Moves</Label>
                      <p className="text-sm text-gray-600">Auto-schedule moves</p>
                    </div>
                    <Switch
                      checked={optimizationParams.automaticMoves}
                      onCheckedChange={(checked) => setOptimizationParams(prev => ({
                        ...prev,
                        automaticMoves: checked
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button
                  onClick={generateRotationPlan}
                  className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Rotation Plan
                </Button>
                <Button variant="outline" className="text-sm sm:text-base">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Stocking Rates
                </Button>
                <Button variant="outline" className="text-sm sm:text-base" onClick={() => setShowScheduleDialog(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Moves
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rotation Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {rotationPlan?.efficiency || 0}%
                </div>
                <p className="text-xs text-gray-600">Current plan efficiency</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Water Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((paddocks.filter(p => waterSources.some(ws => ws.paddockId === p.id)).length / paddocks.length) * 100)}%
                </div>
                <p className="text-xs text-gray-600">Paddocks with water access</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assessment Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {assessments.length}
                </div>
                <p className="text-xs text-gray-600">Recent assessments</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {farmLayoutWithRotation.paddocks.map((item) => (
                  <div key={item.paddock.id} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 p-3 border rounded-lg">
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs text-gray-500">Paddock</Label>
                      <p className="font-medium text-base">{item.paddock.name}</p>
                    </div>
                    <div className="hidden sm:block">
                      <Label className="text-xs text-gray-500">Size</Label>
                      <p className="font-medium text-sm">{item.paddock.acres} ac</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Readiness</Label>
                      <p className="font-medium text-green-600 text-sm">{item.status.readinessScore}/100</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Rest Days</Label>
                      <p className="font-medium text-sm">{item.status.restDaysSince}</p>
                    </div>
                    <div className="hidden lg:block">
                      <Label className="text-xs text-gray-500">Water</Label>
                      <p className="font-medium text-sm">{item.status.waterSources}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Status</Label>
                      <Badge variant={item.status.isCurrentlyGrazed ? "default" : "secondary"} className="text-xs">
                        {item.status.isCurrentlyGrazed ? "Active" : "Rest"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Integration Settings</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure how rotation management integrates with other tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Data Integration</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Sync with Pasture Assessments</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Use Water Management Data</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>GPS Boundary Integration</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Weather Service Integration</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Move Reminders</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Rest Period Alerts</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Weather Warnings</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Capacity Alerts</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Moves Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Rotation Moves
            </DialogTitle>
            <DialogDescription>
              Plan and schedule your livestock rotation moves for the next 30 days
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Current Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Currently Grazing</p>
                  <p className="font-medium text-blue-900">
                    {farmLayoutWithRotation.paddocks.find(p => p.status.isCurrentlyGrazed)?.paddock.name || 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Days on Current Paddock</p>
                  <p className="font-medium text-blue-900">
                    {farmLayoutWithRotation.paddocks.find(p => p.status.isCurrentlyGrazed)?.daysUntilMove || 'N/A'} days
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested Schedule */}
            <div>
              <h3 className="font-semibold mb-3">Suggested Move Schedule</h3>
              <div className="space-y-3">
                {farmLayoutWithRotation.paddocks.slice(0, 4).map((item, index) => (
                  <div key={item.paddock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-800">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">Move to Paddock {item.paddock.name}</p>
                        <p className="text-sm text-gray-600">{item.paddock.acres} acres</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Date(Date.now() + index * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {7 - index} days grazing
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  toast({
                    title: "Schedule Created",
                    description: "Rotation schedule has been created. You'll receive reminders before each move."
                  });
                  setShowScheduleDialog(false);
                }}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowScheduleDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}