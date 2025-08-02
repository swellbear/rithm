import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, Bell, Settings, Calendar, Thermometer, 
  Droplets, Activity, TrendingUp, CheckCircle, X, 
  Clock, MapPin, Eye, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface AlertRule {
  id: string;
  type: "weather" | "pasture" | "livestock" | "rotation" | "performance" | "maintenance";
  name: string;
  description: string;
  enabled: boolean;
  priority: "low" | "medium" | "high" | "critical";
  conditions: {
    parameter: string;
    operator: "greater_than" | "less_than" | "equals" | "between";
    value: number | string;
    secondValue?: number; // For 'between' operator
  }[];
  triggers: string[];
  actions: {
    notification: boolean;
    email?: boolean;
    sms?: boolean;
    autoAction?: string;
  };
  cooldownHours: number;
  lastTriggered?: Date;
}

interface ActiveAlert {
  id: string;
  ruleId: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
  resolved: boolean;
  source: string;
  location?: string;
  actionRequired: boolean;
  autoResolve: boolean;
}

export default function AlertSystem() {
  const [complexityLevel, setComplexityLevel] = useState<"basic" | "intermediate" | "advanced">("basic");
  const [selectedTab, setSelectedTab] = useState("active");
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [newRule, setNewRule] = useState<Partial<AlertRule>>({});
  const [showRuleCreator, setShowRuleCreator] = useState(false);
  const { toast } = useToast();

  // Mock data for demonstration - in production would come from database
  const mockWeatherData = {
    temperature: 93,
    humidity: 75,
    heatIndex: 108,
    windSpeed: 3,
    precipitation: 0,
    forecast: {
      maxTemp: 98,
      minTemp: 78,
      rainChance: 20
    }
  };

  const mockPastureData = {
    avgDMAvailable: 1200,
    utilizationRate: 65,
    grazingDays: 8,
    qualityScore: 4.2,
    bareGroundPercent: 35
  };

  const mockLivestockData = {
    waterConsumption: 45, // gallons per AU per day
    expectedConsumption: 30,
    heatStress: "moderate",
    performanceIndex: 85
  };

  useEffect(() => {
    // Initialize default alert rules
    if (alertRules.length === 0) {
      initializeDefaultRules();
    }
    
    // Check conditions and generate alerts
    checkAlertConditions();
  }, []);

  const initializeDefaultRules = () => {
    const defaultRules: AlertRule[] = [
      {
        id: "heat_stress",
        type: "weather",
        name: "Heat Stress Warning",
        description: "Alert when heat index exceeds safe levels for livestock",
        enabled: true,
        priority: "high",
        conditions: [
          { parameter: "heat_index", operator: "greater_than", value: 105 }
        ],
        triggers: ["Increase water access", "Provide shade", "Monitor livestock closely"],
        actions: { notification: true, email: false },
        cooldownHours: 6
      },
      {
        id: "water_shortage",
        type: "livestock",
        name: "High Water Consumption",
        description: "Alert when water usage exceeds normal levels",
        enabled: true,
        priority: "medium",
        conditions: [
          { parameter: "water_consumption", operator: "greater_than", value: 40 }
        ],
        triggers: ["Check water sources", "Monitor for leaks", "Assess heat stress"],
        actions: { notification: true },
        cooldownHours: 4
      },
      {
        id: "pasture_quality",
        type: "pasture",
        name: "Poor Pasture Quality",
        description: "Alert when pasture condition drops below acceptable levels",
        enabled: true,
        priority: "medium",
        conditions: [
          { parameter: "quality_score", operator: "less_than", value: 3 },
          { parameter: "bare_ground", operator: "greater_than", value: 30 }
        ],
        triggers: ["Extend rest period", "Consider supplemental feed", "Reduce stocking"],
        actions: { notification: true },
        cooldownHours: 24
      },
      {
        id: "rotation_reminder",
        type: "rotation",
        name: "Rotation Due",
        description: "Reminder when paddock rotation is scheduled",
        enabled: true,
        priority: "low",
        conditions: [
          { parameter: "grazing_days", operator: "greater_than", value: 7 }
        ],
        triggers: ["Move livestock to next paddock", "Check fence condition"],
        actions: { notification: true },
        cooldownHours: 12
      }
    ];

    if (complexityLevel === "intermediate" || complexityLevel === "advanced") {
      defaultRules.push(
        {
          id: "performance_decline",
          type: "performance",
          name: "Performance Decline",
          description: "Alert when livestock performance metrics drop",
          enabled: complexityLevel === "advanced",
          priority: "medium",
          conditions: [
            { parameter: "performance_index", operator: "less_than", value: 80 }
          ],
          triggers: ["Review nutrition", "Check health status", "Assess management"],
          actions: { notification: true },
          cooldownHours: 48
        }
      );
    }

    if (complexityLevel === "advanced") {
      defaultRules.push(
        {
          id: "dm_depletion",
          type: "pasture",
          name: "Dry Matter Depletion",
          description: "Advanced alert for rapid DM consumption",
          enabled: true,
          priority: "high",
          conditions: [
            { parameter: "dm_available", operator: "less_than", value: 1000 },
            { parameter: "utilization_rate", operator: "greater_than", value: 60 }
          ],
          triggers: ["Immediate rotation required", "Assess stocking rate", "Emergency feed plan"],
          actions: { notification: true, autoAction: "suggest_rotation" },
          cooldownHours: 6
        }
      );
    }

    setAlertRules(defaultRules);
  };

  const checkAlertConditions = () => {
    const currentAlerts: ActiveAlert[] = [];

    alertRules.forEach(rule => {
      if (!rule.enabled) return;

      let conditionsMet = true;
      
      // Check each condition
      rule.conditions.forEach(condition => {
        let currentValue: number = 0;
        
        // Get current value based on parameter
        switch (condition.parameter) {
          case "heat_index":
            currentValue = mockWeatherData.heatIndex;
            break;
          case "temperature":
            currentValue = mockWeatherData.temperature;
            break;
          case "water_consumption":
            currentValue = mockLivestockData.waterConsumption;
            break;
          case "quality_score":
            currentValue = mockPastureData.qualityScore;
            break;
          case "bare_ground":
            currentValue = mockPastureData.bareGroundPercent;
            break;
          case "grazing_days":
            currentValue = mockPastureData.grazingDays;
            break;
          case "dm_available":
            currentValue = mockPastureData.avgDMAvailable;
            break;
          case "utilization_rate":
            currentValue = mockPastureData.utilizationRate;
            break;
          case "performance_index":
            currentValue = mockLivestockData.performanceIndex;
            break;
          default:
            conditionsMet = false;
        }

        // Check condition
        switch (condition.operator) {
          case "greater_than":
            if (currentValue <= (condition.value as number)) conditionsMet = false;
            break;
          case "less_than":
            if (currentValue >= (condition.value as number)) conditionsMet = false;
            break;
          case "equals":
            if (currentValue !== condition.value) conditionsMet = false;
            break;
          case "between":
            if (condition.secondValue && (currentValue < (condition.value as number) || currentValue > condition.secondValue)) {
              conditionsMet = false;
            }
            break;
        }
      });

      // Create alert if conditions are met
      if (conditionsMet) {
        const alert: ActiveAlert = {
          id: `${rule.id}_${Date.now()}`,
          ruleId: rule.id,
          type: rule.type,
          priority: rule.priority,
          title: rule.name,
          message: rule.description,
          triggeredAt: new Date(),
          acknowledged: false,
          resolved: false,
          source: `${rule.type}_monitoring`,
          actionRequired: rule.priority === "high" || rule.priority === "critical",
          autoResolve: rule.type === "rotation"
        };
        
        currentAlerts.push(alert);
      }
    });

    setActiveAlerts(currentAlerts);
  };

  const acknowledgeAlert = (alertId: string) => {
    setActiveAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const resolveAlert = (alertId: string) => {
    setActiveAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const toggleRule = (ruleId: string) => {
    setAlertRules(rules => 
      rules.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "red";
      case "high": return "orange";
      case "medium": return "yellow";
      case "low": return "blue";
      default: return "gray";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "weather": return <Thermometer className="h-4 w-4" />;
      case "pasture": return <Activity className="h-4 w-4" />;
      case "livestock": return <Droplets className="h-4 w-4" />;
      case "rotation": return <Calendar className="h-4 w-4" />;
      case "performance": return <TrendingUp className="h-4 w-4" />;
      case "maintenance": return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const renderActiveAlerts = () => {
    const unacknowledgedAlerts = activeAlerts.filter(alert => !alert.acknowledged && !alert.resolved);
    const acknowledgedAlerts = activeAlerts.filter(alert => alert.acknowledged && !alert.resolved);

    return (
      <div className="space-y-6">
        {unacknowledgedAlerts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">Requiring Attention</h3>
            {unacknowledgedAlerts.map(alert => (
              <Card key={alert.id} className={`border-${getPriorityColor(alert.priority)}-200 bg-${getPriorityColor(alert.priority)}-50 dark:bg-${getPriorityColor(alert.priority)}-900/20`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(alert.type)}
                      <CardTitle className="text-base">{alert.title}</CardTitle>
                      <Badge variant="outline" className={`text-${getPriorityColor(alert.priority)}-600`}>
                        {alert.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {alert.triggeredAt.toLocaleTimeString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{alert.message}</p>
                  
                  {alert.actionRequired && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Recommended Actions:</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {alertRules.find(rule => rule.id === alert.ruleId)?.triggers.map((trigger, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                            <span>{trigger}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Acknowledge
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {acknowledgedAlerts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-600">Acknowledged</h3>
            {acknowledgedAlerts.map(alert => (
              <Card key={alert.id} className="border-gray-200 bg-gray-50 dark:bg-gray-800/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(alert.type)}
                      <CardTitle className="text-base text-gray-600">{alert.title}</CardTitle>
                      <Badge variant="outline" className="text-gray-500">
                        Acknowledged
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {activeAlerts.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-gray-500">All systems normal - no active alerts</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderAlertRules = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Alert Rules</h3>
          <Button onClick={() => setShowRuleCreator(true)} disabled={complexityLevel === "basic"}>
            <Bell className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>

        <div className="space-y-4">
          {alertRules.map(rule => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(rule.type)}
                    <div>
                      <CardTitle className="text-base">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={`text-${getPriorityColor(rule.priority)}-600`}>
                      {rule.priority}
                    </Badge>
                    <Switch 
                      checked={rule.enabled} 
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              {complexityLevel !== "basic" && (
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">Conditions: </span>
                      {rule.conditions.map((condition, index) => (
                        <span key={index}>
                          {condition.parameter} {condition.operator.replace('_', ' ')} {condition.value}
                          {index < rule.conditions.length - 1 && " AND "}
                        </span>
                      ))}
                    </div>
                    <div>
                      <span className="font-medium">Cooldown: </span>
                      {rule.cooldownHours} hours
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSystemStatus = () => {
    const systemHealth = {
      weatherMonitoring: true,
      pastureAssessments: true,
      livestockTracking: mockLivestockData.performanceIndex > 70,
      dataConnections: true,
      alertDelivery: true
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Status of alert monitoring systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(systemHealth).map(([system, status]) => (
                <div key={system} className="flex items-center justify-between">
                  <span className="capitalize">{system.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${status ? 'text-green-600' : 'text-red-600'}`}>
                      {status ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Conditions</CardTitle>
            <CardDescription>Real-time farm monitoring data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Weather</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span>{mockWeatherData.temperature}°F</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heat Index:</span>
                    <span className={mockWeatherData.heatIndex > 105 ? 'text-red-600 font-medium' : ''}>
                      {mockWeatherData.heatIndex}°F
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity:</span>
                    <span>{mockWeatherData.humidity}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Livestock</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Water Usage:</span>
                    <span className={mockLivestockData.waterConsumption > 40 ? 'text-orange-600 font-medium' : ''}>
                      {mockLivestockData.waterConsumption} gal/AU
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heat Stress:</span>
                    <span className="capitalize">{mockLivestockData.heatStress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance:</span>
                    <span>{mockLivestockData.performanceIndex}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Pasture</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>DM Available:</span>
                    <span>{mockPastureData.avgDMAvailable} lbs/acre</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality Score:</span>
                    <span className={mockPastureData.qualityScore < 3 ? 'text-orange-600 font-medium' : ''}>
                      {mockPastureData.qualityScore}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bare Ground:</span>
                    <span className={mockPastureData.bareGroundPercent > 30 ? 'text-orange-600 font-medium' : ''}>
                      {mockPastureData.bareGroundPercent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Management</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Grazing Days:</span>
                    <span className={mockPastureData.grazingDays > 7 ? 'text-blue-600 font-medium' : ''}>
                      {mockPastureData.grazingDays}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilization:</span>
                    <span>{mockPastureData.utilizationRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Check:</span>
                    <span>2 days</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {complexityLevel === "advanced" && (
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>Connections with other farm management tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { tool: "Weather Integration", status: true, lastUpdate: "5 minutes ago" },
                  { tool: "AU Calculator", status: true, lastUpdate: "1 hour ago" },
                  { tool: "Water Requirements", status: true, lastUpdate: "30 minutes ago" },
                  { tool: "DM Availability", status: true, lastUpdate: "2 hours ago" },
                  { tool: "Pasture Assessment", status: true, lastUpdate: "1 day ago" }
                ].map(integration => (
                  <div key={integration.tool} className="flex items-center justify-between">
                    <span>{integration.tool}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{integration.lastUpdate}</span>
                      <div className={`w-2 h-2 rounded-full ${integration.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                ))}
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
              Alert System
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Proactive monitoring and notifications for optimal farm management
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm">
                {activeAlerts.filter(a => !a.acknowledged && !a.resolved).length} active
              </span>
            </div>
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active Alerts
            {activeAlerts.filter(a => !a.acknowledged && !a.resolved).length > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 text-xs">
                {activeAlerts.filter(a => !a.acknowledged && !a.resolved).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {renderActiveAlerts()}
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {renderAlertRules()}
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {renderSystemStatus()}
        </TabsContent>
      </Tabs>
    </div>
  );
}