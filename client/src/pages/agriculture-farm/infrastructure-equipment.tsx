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
  Wrench, Calendar, AlertTriangle, CheckCircle, Clock, 
  DollarSign, TrendingUp, MapPin, Zap, Fuel, Settings,
  Truck, Home, Droplets, Shield, Battery, Wifi
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPI, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  type: "tractor" | "mower" | "spreader" | "trailer" | "implement" | "vehicle" | "generator";
  brand: string;
  model: string;
  year: number;
  serialNumber: string;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  location: string;
  status: "operational" | "maintenance" | "repair" | "retired";
  operatingHours: number;
  lastService: Date;
  nextService: Date;
  maintenanceSchedule: MaintenanceTask[];
  fuelConsumption: number; // per hour
  specifications: Record<string, any>;
  warranty: {
    expirationDate: Date;
    coverage: string;
  };
}

interface MaintenanceTask {
  id: string;
  equipmentId: string;
  type: "routine" | "preventive" | "corrective" | "emergency";
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  technician?: string;
  cost?: number;
  partsUsed: MaintenancePart[];
  laborHours: number;
  notes: string;
  priority: "critical" | "high" | "medium" | "low";
  recurringInterval?: number; // days
}

interface MaintenancePart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  supplier: string;
}

interface Infrastructure {
  id: string;
  name: string;
  type: "barn" | "shed" | "fence" | "water_system" | "electrical" | "road" | "gate" | "well";
  location: { lat: number; lng: number };
  installDate: Date;
  condition: "excellent" | "good" | "fair" | "poor" | "critical";
  lastInspection: Date;
  nextInspection: Date;
  maintenanceHistory: MaintenanceRecord[];
  estimatedLifespan: number; // years
  replacementCost: number;
  specifications: Record<string, any>;
  connectedSystems: string[];
}

interface MaintenanceRecord {
  id: string;
  date: Date;
  type: "inspection" | "repair" | "upgrade" | "replacement";
  description: string;
  cost: number;
  contractor?: string;
  warrantyPeriod?: number; // months
}

interface IoTSensor {
  id: string;
  name: string;
  type: "temperature" | "humidity" | "pressure" | "level" | "flow" | "vibration" | "location";
  equipmentId?: string;
  infrastructureId?: string;
  status: "online" | "offline" | "error";
  lastReading: {
    value: number;
    unit: string;
    timestamp: Date;
  };
  thresholds: {
    min: number;
    max: number;
    critical: number;
  };
  batteryLevel?: number;
  signalStrength: number;
}

interface EnergyUsage {
  month: string;
  electricity: number;
  fuel: number;
  cost: number;
  efficiency: number;
}

export default function InfrastructureEquipment() {
  // Auto-set complexity based on subscription tier
  const complexityLevel = 'intermediate'; // All users get same infrastructure features
  const [selectedAssetType, setSelectedAssetType] = useState<"all" | "equipment" | "infrastructure">("all");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [iotSensors, setIoTSensors] = useState<IoTSensor[]>([]);
  const [energyData, setEnergyData] = useState<EnergyUsage[]>([]);

  const { toast } = useToast();

  // Fetch farm data
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });

  useEffect(() => {
    // Only initialize if we have real farm data
    if (paddocks.length === 0) {
      // Clear all data when no farm infrastructure exists
      setEquipment([]);
      setInfrastructure([]);
      setMaintenanceTasks([]);
      setIoTSensors([]);
      setEnergyData([]);
    }
  }, [paddocks]);

  // Removed generateMockData - only show real infrastructure when it exists

  const calculateMaintenanceCosts = () => {
    const thisMonth = maintenanceTasks.filter(task => {
      const taskMonth = task.scheduledDate.getMonth();
      const currentMonth = new Date().getMonth();
      return taskMonth === currentMonth && task.completedDate;
    });

    const totalCost = thisMonth.reduce((sum, task) => sum + (task.cost || 0), 0);
    const avgCostPerTask = thisMonth.length > 0 ? totalCost / thisMonth.length : 0;

    return { totalCost, avgCostPerTask, taskCount: thisMonth.length };
  };

  const getAssetHealth = () => {
    const equipmentHealth = equipment.map(eq => {
      const daysSinceLastService = Math.floor((new Date().getTime() - eq.lastService.getTime()) / (1000 * 60 * 60 * 24));
      const daysUntilNextService = Math.floor((eq.nextService.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      let healthScore = 100;
      if (eq.status === "repair") healthScore = 20;
      else if (eq.status === "maintenance") healthScore = 60;
      else if (daysUntilNextService < 7) healthScore = 75;
      else if (daysUntilNextService < 30) healthScore = 85;

      return { name: eq.name, health: healthScore, type: "equipment" };
    });

    const infrastructureHealth = infrastructure.map(inf => {
      let healthScore = 100;
      switch (inf.condition) {
        case "critical": healthScore = 20; break;
        case "poor": healthScore = 40; break;
        case "fair": healthScore = 60; break;
        case "good": healthScore = 80; break;
        case "excellent": healthScore = 100; break;
      }

      return { name: inf.name, health: healthScore, type: "infrastructure" };
    });

    return [...equipmentHealth, ...infrastructureHealth];
  };

  const renderAssetDashboard = () => {
    const maintenanceCosts = calculateMaintenanceCosts();
    const assetHealth = getAssetHealth();
    const avgHealth = assetHealth.reduce((sum, asset) => sum + asset.health, 0) / assetHealth.length;
    const operationalEquipment = equipment.filter(eq => eq.status === "operational").length;
    const totalAssetValue = equipment.reduce((sum, eq) => sum + eq.currentValue, 0) + 
                           infrastructure.reduce((sum, inf) => sum + inf.replacementCost, 0);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{avgHealth.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Avg Asset Health</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{operationalEquipment}/{equipment.length}</div>
                  <div className="text-sm text-gray-600">Operational</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">${maintenanceCosts.totalCost.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Monthly Maint.</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">${(totalAssetValue / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Asset Health Overview</CardTitle>
              <CardDescription>Health scores for all equipment and infrastructure</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assetHealth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="health" fill="#10B981" name="Health Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Energy Usage Trends</CardTitle>
              <CardDescription>Monthly electricity and fuel consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={energyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="electricity" stroke="#3B82F6" name="Electricity (kWh)" />
                  <Line type="monotone" dataKey="fuel" stroke="#EF4444" name="Fuel (gallons)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderEquipmentManagement = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Equipment Inventory</CardTitle>
            <CardDescription>Complete equipment tracking and management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equipment.map(item => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={item.status === "operational" ? "default" : 
                                   item.status === "maintenance" ? "secondary" : "destructive"}>
                        {item.status}
                      </Badge>
                      <Badge variant="outline">{item.year}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Hours:</span>
                      <span className="ml-2 font-medium">{item.operatingHours.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Value:</span>
                      <span className="ml-2 font-medium">${item.currentValue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">{item.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Service:</span>
                      <span className="ml-2 font-medium">{item.lastService.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {complexityLevel !== "basic" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Model:</span>
                        <span className="ml-2 font-medium">{item.brand} {item.model}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Serial:</span>
                        <span className="ml-2 font-medium">{item.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fuel Use:</span>
                        <span className="ml-2 font-medium">{item.fuelConsumption} gal/hr</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Warranty:</span>
                        <span className="ml-2 font-medium">
                          {item.warranty.expirationDate > new Date() ? "Active" : "Expired"}
                        </span>
                      </div>
                    </div>
                  )}

                  {complexityLevel === "advanced" && Object.keys(item.specifications).length > 0 && (
                    <div className="mb-3">
                      <h5 className="font-medium text-sm mb-1">Specifications:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {Object.entries(item.specifications).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-600">{key}:</span>
                            <span className="ml-1">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 italic">
                    Equipment management features available in future updates
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMaintenanceScheduling = () => {
    const upcomingTasks = maintenanceTasks.filter(task => !task.completedDate && task.scheduledDate >= new Date());
    const overdueTasks = maintenanceTasks.filter(task => !task.completedDate && task.scheduledDate < new Date());

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Schedule</CardTitle>
            <CardDescription>Upcoming and overdue maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueTasks.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Overdue Tasks:</strong> {overdueTasks.length} maintenance tasks are overdue and require immediate attention.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {upcomingTasks.concat(overdueTasks).map(task => {
                const isOverdue = task.scheduledDate < new Date();
                const relatedEquipment = equipment.find(eq => eq.id === task.equipmentId);

                return (
                  <div key={task.id} className={`p-4 border rounded-lg ${
                    isOverdue ? 'border-red-300 bg-red-50' : 
                    task.priority === "critical" ? 'border-orange-300 bg-orange-50' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{task.description}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={isOverdue ? "destructive" : "outline"}>
                          {isOverdue ? "Overdue" : task.priority}
                        </Badge>
                        {task.cost && (
                          <Badge variant="outline">${task.cost}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Equipment:</span>
                        <span className="ml-2 font-medium">{relatedEquipment?.name || "Unknown"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium capitalize">{task.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Scheduled:</span>
                        <span className="ml-2 font-medium">{task.scheduledDate.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Labor:</span>
                        <span className="ml-2 font-medium">{task.laborHours} hours</span>
                      </div>
                    </div>

                    {task.partsUsed.length > 0 && complexityLevel !== "basic" && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-1">Parts Required:</h5>
                        <div className="space-y-1">
                          {task.partsUsed.map(part => (
                            <div key={part.id} className="text-xs text-gray-600">
                              {part.quantity}x {part.name} ({part.partNumber}) - ${(part.quantity * part.unitCost).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.notes && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Notes:</span> {task.notes}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button size="sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Reschedule
                      </Button>
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

  const renderIoTMonitoring = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>IoT Sensor Network</CardTitle>
            <CardDescription>Real-time monitoring of equipment and infrastructure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {iotSensors.map(sensor => (
                <div key={sensor.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">{sensor.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={sensor.status === "online" ? "default" : "destructive"}>
                        {sensor.status}
                      </Badge>
                      {sensor.batteryLevel && (
                        <div className="flex items-center space-x-1">
                          <Battery className="h-3 w-3" />
                          <span className="text-xs">{sensor.batteryLevel}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center mb-3">
                    <div className="text-2xl font-bold">
                      {sensor.lastReading.value}{sensor.lastReading.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      {sensor.lastReading.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Min:</span>
                      <span>{sensor.thresholds.min}{sensor.lastReading.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max:</span>
                      <span>{sensor.thresholds.max}{sensor.lastReading.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Critical:</span>
                      <span className="text-red-600">{sensor.thresholds.critical}{sensor.lastReading.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Signal:</span>
                      <span className="flex items-center">
                        <Wifi className="h-3 w-3 mr-1" />
                        {sensor.signalStrength}%
                      </span>
                    </div>
                  </div>

                  {(sensor.lastReading.value < sensor.thresholds.min || 
                    sensor.lastReading.value > sensor.thresholds.max) && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        Reading outside normal range
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>

            {iotSensors.length === 0 && (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No IoT sensors configured yet.</p>
                <Button className="mt-4">
                  <Zap className="h-4 w-4 mr-2" />
                  Add Sensor
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {complexityLevel === "advanced" && (
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription>AI-powered equipment failure prediction and optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Machine Learning Diagnostics</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Advanced algorithms analyze sensor data patterns to predict equipment failures before they occur.
                  </p>
                  <Button size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Configure AI Models
                  </Button>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Energy Optimization</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Automated systems optimize energy usage based on operational patterns and weather conditions.
                  </p>
                  <Button size="sm">
                    <Zap className="h-4 w-4 mr-1" />
                    Energy Dashboard
                  </Button>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Digital Twin Integration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Virtual models of your farm infrastructure enable simulation and optimization testing.
                  </p>
                  <Button size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    View Digital Twins
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderIntegration = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Farm Management Integration</CardTitle>
            <CardDescription>How infrastructure data enhances operational decision making</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Financial Management</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Equipment depreciation and maintenance costs integrate with financial planning and budgeting
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Alert System</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Equipment health and IoT sensor data trigger automated alerts for maintenance and repairs
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Operational Planning</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Equipment availability and maintenance schedules inform grazing calendar and farm activities
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Performance Analytics</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Equipment efficiency and infrastructure utilization correlate with overall farm productivity
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Lifecycle Management</CardTitle>
            <CardDescription>Comprehensive tracking from acquisition to disposal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Acquisition Planning</span>
                  <span className="text-sm text-gray-600">ROI-based decisions</span>
                </div>
                <p className="text-sm text-gray-600">Financial analysis guides equipment purchase decisions and timing</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Operational Optimization</span>
                  <span className="text-sm text-gray-600">Performance monitoring</span>
                </div>
                <p className="text-sm text-gray-600">Continuous monitoring and maintenance ensure optimal performance throughout lifecycle</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Replacement Planning</span>
                  <span className="text-sm text-gray-600">Predictive scheduling</span>
                </div>
                <p className="text-sm text-gray-600">Data-driven replacement timing based on condition, costs, and technological advancement</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Disposal & Recycling</span>
                  <span className="text-sm text-gray-600">Sustainable practices</span>
                </div>
                <p className="text-sm text-gray-600">Environmentally responsible disposal with salvage value recovery</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Infrastructure & Equipment Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Comprehensive asset management with IoT monitoring and predictive maintenance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedAssetType} onValueChange={(value: any) => setSelectedAssetType(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="dashboard" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Equipment</span>
              <span className="sm:hidden">Equip</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Maintenance</span>
              <span className="sm:hidden">Maint</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">IoT Monitoring</span>
              <span className="sm:hidden">IoT</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Integration</span>
              <span className="sm:hidden">Integrate</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {renderAssetDashboard()}
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          {renderEquipmentManagement()}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          {renderMaintenanceScheduling()}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {renderIoTMonitoring()}
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          {renderIntegration()}
        </TabsContent>
      </Tabs>
    </div>
  );
}