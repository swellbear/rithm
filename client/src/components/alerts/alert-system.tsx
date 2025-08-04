import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Bell, CheckCircle, Clock, Settings, Shield, TrendingDown, Thermometer, Droplets } from "lucide-react";
import { useDemoData } from "@/lib/demo-data";
import { useQuery } from "@tanstack/react-query";

interface AlertSystemProps {
  userId: number;
}

// Mock alert data
const mockAlerts = [
  {
    id: 1,
    alertType: "overgrazing",
    severity: "high",
    title: "Overgrazing Alert - North Paddock",
    message: "Pasture utilization has exceeded 90%. Consider moving livestock to prevent damage.",
    currentValue: 92.5,
    threshold: { maxUtilization: 85 },
    paddockName: "North Paddock",
    isActive: true,
    acknowledgedAt: null,
    createdAt: "2024-12-30T10:30:00Z"
  },
  {
    id: 2,
    alertType: "rest_needed",
    severity: "medium",
    title: "Rest Period Required - South Field",
    message: "Paddock needs 21+ day rest period for optimal regrowth.",
    currentValue: 18,
    threshold: { minRestDays: 21 },
    paddockName: "South Field",
    isActive: true,
    acknowledgedAt: null,
    createdAt: "2024-12-30T08:15:00Z"
  },
  {
    id: 3,
    alertType: "weather",
    severity: "low",
    title: "Weather Advisory",
    message: "Heavy rain forecast. Consider moving animals to higher ground.",
    currentValue: null,
    threshold: null,
    paddockName: null,
    isActive: true,
    acknowledgedAt: "2024-12-30T09:00:00Z",
    createdAt: "2024-12-30T06:00:00Z"
  }
];

const alertSettings = [
  {
    id: 1,
    alertType: "overgrazing",
    title: "Overgrazing Protection",
    description: "Alert when pasture utilization exceeds threshold",
    isEnabled: true,
    threshold: { maxUtilization: 85 },
    notificationMethod: "app",
    icon: TrendingDown
  },
  {
    id: 2,
    alertType: "underutilization",
    title: "Underutilization Warning",
    description: "Alert when pasture is underused",
    isEnabled: true,
    threshold: { minUtilization: 60 },
    notificationMethod: "app",
    icon: TrendingDown
  },
  {
    id: 3,
    alertType: "rest_needed",
    title: "Rest Period Monitoring",
    description: "Track minimum rest periods for pasture recovery",
    isEnabled: true,
    threshold: { minRestDays: 21 },
    notificationMethod: "app",
    icon: Clock
  },
  {
    id: 4,
    alertType: "parasites",
    title: "Parasite Risk Alert",
    description: "Monitor conditions favorable to parasite development",
    isEnabled: false,
    threshold: { moistureLevel: 75, temperature: 65 },
    notificationMethod: "app",
    icon: Shield
  },
  {
    id: 5,
    alertType: "weather",
    title: "Weather Alerts",
    description: "Severe weather warnings and advisories",
    isEnabled: true,
    threshold: {},
    notificationMethod: "app",
    icon: Thermometer
  }
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical": return "border-red-500 bg-red-50 text-red-900";
    case "high": return "border-orange-500 bg-orange-50 text-orange-900";
    case "medium": return "border-yellow-500 bg-yellow-50 text-yellow-900";
    case "low": return "border-blue-500 bg-blue-50 text-blue-900";
    default: return "border-gray-500 bg-gray-50 text-gray-900";
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "critical":
    case "high": return AlertTriangle;
    case "medium": return Bell;
    case "low": return Bell;
    default: return Bell;
  }
};

export default function AlertSystem({ userId }: AlertSystemProps) {
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertSettingsData, setAlertSettingsData] = useState(alertSettings);

  // Fetch real alerts from API
  const { data: realAlerts = [] } = useQuery({
    queryKey: ['/api/alerts/active'],
    enabled: true
  });

  // Use demo data filtering - only show mock alerts when demo mode is active
  const allAlerts = useDemoData(realAlerts, mockAlerts);
  const activeAlerts = allAlerts.filter((alert: any) => alert.isActive);
  const acknowledgedAlerts = allAlerts.filter((alert: any) => alert.acknowledgedAt);

  const handleAcknowledgeAlert = (alertId: number) => {

    // In production, this would call the API
  };

  const handleResolveAlert = (alertId: number) => {

    // In production, this would call the API
  };

  const toggleAlertSetting = (alertType: string) => {
    setAlertSettingsData(prev => 
      prev.map(setting => 
        setting.alertType === alertType 
          ? { ...setting, isEnabled: !setting.isEnabled }
          : setting
      )
    );
    // Mark alert configuration as completed for Getting Started Assistant
    localStorage.setItem('cadence-alertsConfigured', 'true');
  };

  const updateThreshold = (alertType: string, key: string, value: number) => {
    setAlertSettingsData(prev =>
      prev.map(setting =>
        setting.alertType === alertType
          ? { ...setting, threshold: { ...setting.threshold, [key]: value } }
          : setting
      )
    );
    // Mark alert configuration as completed for Getting Started Assistant
    localStorage.setItem('cadence-alertsConfigured', 'true');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Pasture Health Alerts</h2>
          <p className="text-gray-600">Monitor and configure alerts for optimal pasture management</p>
        </div>
        
        <Badge variant="outline" className="px-3 py-1">
          {activeAlerts.length} Active Alerts
        </Badge>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="settings">Alert Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">All Clear!</h3>
                <p className="text-gray-600">No active alerts. Your pastures are in good condition.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const SeverityIcon = getSeverityIcon(alert.severity);
                
                return (
                  <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <SeverityIcon className="h-5 w-5 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{alert.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <p className="text-sm mb-2">{alert.message}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              {alert.paddockName && (
                                <span>📍 {alert.paddockName}</span>
                              )}
                              <span>🕐 {formatTimeAgo(alert.createdAt)}</span>
                              {alert.currentValue && (
                                <span>📊 Current: {alert.currentValue}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          {!alert.acknowledgedAt && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4">
            {alertSettingsData.map((setting) => {
              const IconComponent = setting.icon;
              
              return (
                <Card key={setting.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{setting.title}</h3>
                          <p className="text-sm text-gray-600">{setting.description}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={setting.isEnabled} 
                        onCheckedChange={() => toggleAlertSetting(setting.alertType)}
                      />
                    </div>

                    {setting.isEnabled && (
                      <div className="space-y-3 pt-3 border-t">
                        {setting.alertType === "overgrazing" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Max Utilization (%)</Label>
                              <Input
                                type="number"
                                value={setting.threshold.maxUtilization || 85}
                                onChange={(e) => updateThreshold(setting.alertType, "maxUtilization", parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}

                        {setting.alertType === "underutilization" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Min Utilization (%)</Label>
                              <Input
                                type="number"
                                value={setting.threshold.minUtilization || 60}
                                onChange={(e) => updateThreshold(setting.alertType, "minUtilization", parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}

                        {setting.alertType === "rest_needed" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Min Rest Days</Label>
                              <Input
                                type="number"
                                value={setting.threshold.minRestDays || 21}
                                onChange={(e) => updateThreshold(setting.alertType, "minRestDays", parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}

                        {setting.alertType === "parasites" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Moisture Threshold (%)</Label>
                              <Input
                                type="number"
                                value={setting.threshold.moistureLevel || 75}
                                onChange={(e) => updateThreshold(setting.alertType, "moistureLevel", parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Temperature Threshold (°F)</Label>
                              <Input
                                type="number"
                                value={setting.threshold.temperature || 65}
                                onChange={(e) => updateThreshold(setting.alertType, "temperature", parseInt(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Notification Method:</Label>
                          <Select value={setting.notificationMethod} onValueChange={() => {}}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="app">App Only</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-3">
            {acknowledgedAlerts.map((alert) => (
              <Card key={alert.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{alert.title}</h3>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>Acknowledged {formatTimeAgo(alert.acknowledgedAt!)}</div>
                      <div>Created {formatTimeAgo(alert.createdAt)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {acknowledgedAlerts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Alert History</h3>
                <p className="text-gray-600">Previous alerts will appear here once resolved.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}