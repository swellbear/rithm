import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Calendar, Bell, Target, Zap, RefreshCw, CheckCircle, 
  Clock, MapPin, Droplets, Wheat, AlertTriangle, TrendingUp,
  ArrowRight, Settings, Heart, Leaf
} from "lucide-react";

interface WorkflowOptimizationProps {
  isOpen: boolean;
  onClose: () => void;
  currentPaddock?: any;
  currentHerd?: any;
}

interface DailyTask {
  id: string;
  type: 'move' | 'water' | 'feed' | 'health' | 'assessment';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueTime?: string;
  paddockId?: number;
  herdId?: number;
  isCompleted: boolean;
  estimatedMinutes: number;
  source: 'calendar' | 'alert' | 'calculation' | 'weather';
}

interface SmartDefault {
  field: string;
  value: any;
  source: string;
  confidence: number;
  reason: string;
}

export default function WorkflowOptimization({ isOpen, onClose, currentPaddock, currentHerd }: WorkflowOptimizationProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPaddock, setSelectedPaddock] = useState<number | null>(currentPaddock?.id || null);
  const [smartDefaults, setSmartDefaults] = useState<SmartDefault[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const { toast } = useToast();

  // Fetch farm data
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });
  const { data: alerts = [] } = useQuery<any[]>({ queryKey: ["/api/alerts/active"] });
  const { data: livestockAlerts = [] } = useQuery<any[]>({ queryKey: ["/api/livestock-alerts/active"] });

  // Generate smart defaults based on historical data
  const generateSmartDefaults = () => {
    const defaults: SmartDefault[] = [];

    // Auto-select currently grazed paddock
    const grazingPaddock = paddocks.find(p => p.currentlyGrazing);
    if (grazingPaddock && !selectedPaddock) {
      defaults.push({
        field: 'paddock',
        value: grazingPaddock.id,
        source: 'current_grazing',
        confidence: 95,
        reason: `${grazingPaddock.name} is currently being grazed`
      });
      setSelectedPaddock(grazingPaddock.id);
    }

    // Auto-select dominant herd if only one species
    const speciesGroups = herds.reduce((acc, herd) => {
      acc[herd.species] = (acc[herd.species] || 0) + herd.count;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(speciesGroups).length === 1) {
      const primarySpecies = Object.keys(speciesGroups)[0];
      defaults.push({
        field: 'species',
        value: primarySpecies,
        source: 'farm_composition',
        confidence: 90,
        reason: `Your farm has only ${primarySpecies}, auto-selected for calculations`
      });
    }

    // Weather-based water adjustments
    const today = new Date();
    const isHotSeason = today.getMonth() >= 5 && today.getMonth() <= 8; // June-September
    if (isHotSeason) {
      defaults.push({
        field: 'water_adjustment',
        value: 1.25,
        source: 'seasonal_weather',
        confidence: 85,
        reason: 'Hot season: 25% increase in water requirements recommended'
      });
    }

    // Recent assessment data
    const recentAssessment = assessments
      .filter(a => selectedPaddock ? a.paddockId === selectedPaddock : true)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (recentAssessment) {
      const daysOld = Math.floor((Date.now() - new Date(recentAssessment.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysOld <= 14) {
        defaults.push({
          field: 'pasture_quality',
          value: 'recent_assessment',
          source: 'assessment_history',
          confidence: 80,
          reason: `Assessment from ${daysOld} days ago available for quality estimates`
        });
      }
    }

    setSmartDefaults(defaults);
  };

  // Generate daily tasks from multiple sources
  const generateDailyTasks = () => {
    const tasks: DailyTask[] = [];
    const selectedDateObj = new Date(selectedDate);

    // Tasks from calendar/rotation schedule
    const needsMoveToday = paddocks.some(p => {
      if (!p.lastGrazed || !p.currentlyGrazing) return false;
      const lastGrazed = new Date(p.lastGrazed);
      const daysSinceMove = Math.floor((selectedDateObj.getTime() - lastGrazed.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceMove >= (p.restDays || 21);
    });

    if (needsMoveToday) {
      tasks.push({
        id: 'move-animals',
        type: 'move',
        title: 'Move Animals to Fresh Paddock',
        description: 'Current paddock has reached optimal grazing period',
        priority: 'high',
        dueTime: '08:00',
        paddockId: selectedPaddock || undefined,
        isCompleted: false,
        estimatedMinutes: 45,
        source: 'calendar'
      });
    }

    // Tasks from active alerts
    alerts.forEach(alert => {
      if (alert.severity === 'high' || alert.severity === 'critical') {
        tasks.push({
          id: `alert-${alert.id}`,
          type: 'assessment',
          title: alert.title,
          description: alert.message,
          priority: alert.severity === 'critical' ? 'high' : 'medium',
          paddockId: alert.paddockId,
          isCompleted: false,
          estimatedMinutes: 30,
          source: 'alert'
        });
      }
    });

    // Tasks from livestock health alerts
    livestockAlerts.forEach(alert => {
      if (alert.severity === 'high' || alert.severity === 'critical') {
        tasks.push({
          id: `livestock-${alert.id}`,
          type: 'health',
          title: alert.title,
          description: alert.message,
          priority: alert.severity === 'critical' ? 'high' : 'medium',
          herdId: alert.animalId,
          isCompleted: false,
          estimatedMinutes: 20,
          source: 'alert'
        });
      }
    });

    // Daily calculation tasks
    tasks.push({
      id: 'water-check',
      type: 'water',
      title: 'Check Water Systems',
      description: 'Verify adequate water supply and system function',
      priority: 'medium',
      dueTime: '07:00',
      isCompleted: false,
      estimatedMinutes: 15,
      source: 'calculation'
    });

    // Weather-based tasks
    const isWeekend = selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;
    if (isWeekend) {
      tasks.push({
        id: 'weekly-assessment',
        type: 'assessment',
        title: 'Weekly Pasture Check',
        description: 'Visual assessment of grazing impact and pasture recovery',
        priority: 'low',
        dueTime: '10:00',
        paddockId: selectedPaddock || undefined,
        isCompleted: false,
        estimatedMinutes: 30,
        source: 'calendar'
      });
    }

    // Sort by priority and time
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.dueTime && b.dueTime) {
        return a.dueTime.localeCompare(b.dueTime);
      }
      return 0;
    });

    setDailyTasks(tasks);
  };

  // Toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    setDailyTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: !task.isCompleted }
          : task
      )
    );
  };

  // Calculate daily totals
  const calculateDailyTotals = () => {
    const selectedHerds = herds.filter(h => selectedPaddock ? true : true); // Include all herds for now
    const totalAnimals = selectedHerds.reduce((sum, herd) => sum + herd.count, 0);
    
    // Basic water calculation (adjust based on smart defaults)
    const baseWaterPerAnimal = 30; // gallons per day
    const weatherAdjustment = smartDefaults.find(d => d.field === 'water_adjustment')?.value || 1;
    const totalWater = Math.round(totalAnimals * baseWaterPerAnimal * weatherAdjustment);

    // Estimated feed needs
    const avgWeight = selectedHerds.reduce((sum, herd) => sum + (parseInt(herd.averageWeight) * herd.count), 0) / totalAnimals || 1000;
    const dmPercentage = 2.5; // 2.5% of body weight
    const totalFeed = Math.round((totalAnimals * avgWeight * dmPercentage) / 100);

    return {
      animals: totalAnimals,
      water: totalWater,
      feed: totalFeed,
      tasks: dailyTasks.filter(t => !t.isCompleted).length,
      estimatedTime: dailyTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0)
    };
  };

  const dailyTotals = calculateDailyTotals();

  useEffect(() => {
    if (isOpen) {
      generateSmartDefaults();
      generateDailyTasks();
    }
  }, [isOpen, selectedDate, selectedPaddock, herds, paddocks, alerts, livestockAlerts]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      calendar: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
      alert: { label: 'Alert', color: 'bg-red-100 text-red-800' },
      calculation: { label: 'Calculated', color: 'bg-green-100 text-green-800' },
      weather: { label: 'Weather', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.calculation;
    return <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Smart Daily Workflow
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today's Tasks</TabsTrigger>
              <TabsTrigger value="defaults">Smart Defaults</TabsTrigger>
              <TabsTrigger value="totals">Daily Calculations</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4">
              {/* Date and Paddock Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paddock">Focus Paddock</Label>
                  <Select value={selectedPaddock?.toString() || "all"} onValueChange={(value) => setSelectedPaddock(value === "all" ? null : parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select paddock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Paddocks</SelectItem>
                      {paddocks.map((paddock) => (
                        <SelectItem key={paddock.id} value={paddock.id.toString()}>
                          {paddock.name} {paddock.currentlyGrazing && "(Currently Grazing)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Task Summary */}
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><strong>{dailyTasks.length}</strong> tasks identified</div>
                    <div><strong>{dailyTasks.filter(t => t.priority === 'high').length}</strong> high priority</div>
                    <div><strong>{Math.round(dailyTotals.estimatedTime / 60)}h {dailyTotals.estimatedTime % 60}m</strong> estimated time</div>
                    <div><strong>{dailyTasks.filter(t => t.isCompleted).length}/{dailyTasks.length}</strong> completed</div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Task List */}
              <div className="space-y-3">
                {dailyTasks.map((task) => (
                  <Card key={task.id} className={`border-l-4 ${task.isCompleted ? 'border-l-green-500 bg-green-50' : 
                    task.priority === 'high' ? 'border-l-red-500' : 
                    task.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="p-1"
                          >
                            {task.isCompleted ? 
                              <CheckCircle className="h-5 w-5 text-green-500" /> : 
                              <Clock className="h-5 w-5 text-gray-400" />
                            }
                          </Button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getPriorityIcon(task.priority)}
                              <h3 className={`font-semibold ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                {task.title}
                              </h3>
                              {getSourceBadge(task.source)}
                              {task.dueTime && (
                                <Badge variant="outline" className="text-xs">
                                  {task.dueTime}
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm text-muted-foreground ${task.isCompleted ? 'line-through' : ''}`}>
                              {task.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                              <span>{task.estimatedMinutes} minutes</span>
                              {task.paddockId && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {paddocks.find(p => p.id === task.paddockId)?.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {dailyTasks.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-semibold mb-2">No Tasks for Today</h3>
                      <p className="text-muted-foreground">
                        Your farm operations are on track! Check back tomorrow or select a different date.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="defaults" className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Smart defaults automatically fill in common values based on your farm data and history.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {smartDefaults.map((defaultValue, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {defaultValue.confidence}% confidence
                            </Badge>
                            <h3 className="font-semibold capitalize">
                              {defaultValue.field.replace('_', ' ')}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {defaultValue.reason}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Source: {defaultValue.source.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {typeof defaultValue.value === 'object' ? 
                              JSON.stringify(defaultValue.value) : 
                              defaultValue.value
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {smartDefaults.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-lg font-semibold mb-2">No Smart Defaults Available</h3>
                      <p className="text-muted-foreground">
                        Add more farm data to enable intelligent defaults and suggestions.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="totals" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <div className="text-2xl font-bold">{dailyTotals.animals}</div>
                    <div className="text-sm text-muted-foreground">Total Livestock</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{dailyTotals.water}</div>
                    <div className="text-sm text-muted-foreground">Gallons Water</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Wheat className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{dailyTotals.feed}</div>
                    <div className="text-sm text-muted-foreground">Pounds DM</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{Math.round(dailyTotals.estimatedTime / 60)}</div>
                    <div className="text-sm text-muted-foreground">Hours Work</div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Leaf className="h-4 w-4" />
                <AlertDescription>
                  <strong>Calculations include:</strong> Weather adjustments, seasonal factors, current paddock conditions, 
                  and livestock-specific requirements based on your farm data.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Workflow Optimized",
                description: "Smart defaults and daily tasks have been updated based on your farm data."
              });
              onClose();
            }}>
              Apply Optimizations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}