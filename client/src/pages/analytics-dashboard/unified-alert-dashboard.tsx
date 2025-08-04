import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  BellRing, 
  Check, 
  AlertTriangle, 
  Heart, 
  Leaf, 
  Calendar,
  Zap,
  X,
  RefreshCw,
  Clock,
  Stethoscope
} from "lucide-react";

interface LivestockAlert {
  id: number;
  userId: number;
  animalId?: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  scheduledFor: string;
  dueDate?: string;
  threshold?: any;
  metadata?: any;
  isActive: boolean;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface PastureAlert {
  id: number;
  userId: number;
  paddockId?: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  threshold?: any;
  currentValue?: number;
  isActive: boolean;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface AlertStats {
  totalActive: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  livestock: number;
  pasture: number;
}

export default function UnifiedAlertDashboard() {
  const [selectedTab, setSelectedTab] = useState("all");
  const { toast } = useToast();

  // Fetch livestock alerts
  const { data: livestockAlerts = [], isLoading: livestockLoading } = useQuery<LivestockAlert[]>({
    queryKey: ["/api/livestock-alerts/active"],
  });

  // Fetch pasture alerts
  const { data: pastureAlerts = [], isLoading: pastureLoading } = useQuery<PastureAlert[]>({
    queryKey: ["/api/alerts/active"], // Using existing pasture alert endpoint
  });

  // Generate health alerts mutation
  const generateAlertsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/livestock-alerts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1 })
      });
      if (!response.ok) throw new Error("Failed to generate alerts");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestock-alerts/active"] });
      toast({
        title: "Alerts Generated",
        description: `Generated ${data.generated} new health alerts based on your livestock data.`
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate health alerts. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: 'livestock' | 'pasture' }) => {
      const endpoint = type === 'livestock' 
        ? `/api/livestock-alerts/${id}/acknowledge`
        : `/api/alerts/${id}/acknowledge`;
      
      const response = await fetch(endpoint, { method: "PATCH" });
      if (!response.ok) throw new Error("Failed to acknowledge alert");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestock-alerts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/active"] });
      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged."
      });
    }
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: 'livestock' | 'pasture' }) => {
      const endpoint = type === 'livestock' 
        ? `/api/livestock-alerts/${id}/resolve`
        : `/api/alerts/${id}/resolve`;
      
      const response = await fetch(endpoint, { method: "PATCH" });
      if (!response.ok) throw new Error("Failed to resolve alert");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/livestock-alerts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/active"] });
      toast({
        title: "Alert Resolved",
        description: "Alert has been marked as resolved and will no longer appear."
      });
    }
  });

  // Calculate alert statistics
  const alertStats: AlertStats = {
    totalActive: livestockAlerts.length + pastureAlerts.length,
    critical: [...livestockAlerts, ...pastureAlerts].filter(a => a.severity === 'critical').length,
    high: [...livestockAlerts, ...pastureAlerts].filter(a => a.severity === 'high').length,
    medium: [...livestockAlerts, ...pastureAlerts].filter(a => a.severity === 'medium').length,
    low: [...livestockAlerts, ...pastureAlerts].filter(a => a.severity === 'low').length,
    livestock: livestockAlerts.length,
    pasture: pastureAlerts.length
  };

  // Combine and sort alerts by severity and date
  const allAlerts = [
    ...livestockAlerts.map(alert => ({ ...alert, source: 'livestock' as const })),
    ...pastureAlerts.map(alert => ({ ...alert, source: 'pasture' as const }))
  ].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                        (severityOrder[a.severity as keyof typeof severityOrder] || 0);
    if (severityDiff !== 0) return severityDiff;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <BellRing className="h-4 w-4" />;
      case 'medium': return <Bell className="h-4 w-4" />;
      case 'low': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    return source === 'livestock' ? <Stethoscope className="h-4 w-4" /> : <Leaf className="h-4 w-4" />;
  };

  const filterAlerts = (alerts: any[]) => {
    switch (selectedTab) {
      case 'livestock': return alerts.filter(a => a.source === 'livestock');
      case 'pasture': return alerts.filter(a => a.source === 'pasture');
      case 'critical': return alerts.filter(a => a.severity === 'critical');
      case 'high': return alerts.filter(a => a.severity === 'high');
      default: return alerts;
    }
  };

  const filteredAlerts = filterAlerts(allAlerts);
  const isLoading = livestockLoading || pastureLoading;

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Alert Center</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor all farm alerts and take immediate action on critical issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => generateAlertsMutation.mutate()}
            disabled={generateAlertsMutation.isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generateAlertsMutation.isPending ? 'animate-spin' : ''}`} />
            Generate Health Alerts
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold">{alertStats.totalActive}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{alertStats.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-orange-600">{alertStats.high}</p>
              </div>
              <BellRing className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medium</p>
                <p className="text-2xl font-bold text-yellow-600">{alertStats.medium}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low</p>
                <p className="text-2xl font-bold text-blue-600">{alertStats.low}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Livestock</p>
                <p className="text-2xl font-bold text-green-600">{alertStats.livestock}</p>
              </div>
              <Heart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pasture</p>
                <p className="text-2xl font-bold text-emerald-600">{alertStats.pasture}</p>
              </div>
              <Leaf className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Filters */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="livestock">Livestock</TabsTrigger>
          <TabsTrigger value="pasture">Pasture</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="high">High Priority</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedTab === 'all' 
                    ? "No active alerts at this time. Your farm operations are on track!"
                    : `No ${selectedTab} alerts currently active.`
                  }
                </p>
                <Button 
                  onClick={() => generateAlertsMutation.mutate()}
                  disabled={generateAlertsMutation.isPending}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generateAlertsMutation.isPending ? 'animate-spin' : ''}`} />
                  Check for New Health Alerts
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card key={`${alert.source}-${alert.id}`} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getSourceIcon(alert.source)}
                          <Badge className={`${getSeverityColor(alert.severity)} flex items-center gap-1`}>
                            {getSeverityIcon(alert.severity)}
                            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.source === 'livestock' ? 'Health' : 'Pasture'}
                          </Badge>
                          {alert.alertType && (
                            <Badge variant="secondary" className="text-xs">
                              {alert.alertType.replace('_', ' ').toLowerCase()}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-1">{alert.title}</h3>
                        <p className="text-muted-foreground mb-3">{alert.message}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created: {new Date(alert.createdAt).toLocaleDateString()}
                          </div>
                          {alert.dueDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Due: {new Date(alert.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          {alert.metadata?.cost && (
                            <div className="flex items-center gap-1">
                              <span className="text-green-600 font-medium">
                                ${Number(alert.metadata.cost).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!alert.acknowledgedAt && (
                          <Button
                            onClick={() => acknowledgeAlertMutation.mutate({ 
                              id: alert.id, 
                              type: alert.source 
                            })}
                            disabled={acknowledgeAlertMutation.isPending}
                            variant="outline"
                            size="sm"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          onClick={() => resolveAlertMutation.mutate({ 
                            id: alert.id, 
                            type: alert.source 
                          })}
                          disabled={resolveAlertMutation.isPending}
                          variant="default"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {alertStats.totalActive > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Take quick action on multiple alerts or generate new health alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              onClick={() => generateAlertsMutation.mutate()}
              disabled={generateAlertsMutation.isPending}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generateAlertsMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh Health Alerts
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Tasks
            </Button>
            <Button variant="outline">
              <Heart className="h-4 w-4 mr-2" />
              Health Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}