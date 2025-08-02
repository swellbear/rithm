import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime: number;
    };
    openai: {
      status: 'up' | 'down' | 'unavailable';
      apiKeyValid: boolean;
    };
    authentication: {
      status: 'up' | 'down';
      activeUsers: number;
    };
    chat: {
      status: 'up' | 'down';
      engineLoaded: boolean;
    };
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  performance: {
    avgResponseTime: number;
    requestsPerMinute: number;
  };
}

export default function HealthMonitor() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unhealthy':
      case 'down':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              <span>Error loading health data: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-2">
          {getStatusIcon(health.status)}
          <Badge className={getStatusColor(health.status)}>
            {health.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.version}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(health.uptime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.memory.percentage}%</div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(health.memory.used)} / {formatBytes(health.memory.total)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.performance.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {health.performance.requestsPerMinute} req/min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              {getStatusIcon(health.services.database.status)}
              <span>Database</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(health.services.database.status)}>
              {health.services.database.status.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Response: {health.services.database.responseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              {getStatusIcon(health.services.openai.status)}
              <span>OpenAI</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(health.services.openai.status)}>
              {health.services.openai.status.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              API Key: {health.services.openai.apiKeyValid ? 'Valid' : 'Invalid'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              {getStatusIcon(health.services.authentication.status)}
              <span>Authentication</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(health.services.authentication.status)}>
              {health.services.authentication.status.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Active Users: {health.services.authentication.activeUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              {getStatusIcon(health.services.chat.status)}
              <span>Chat Engine</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(health.services.chat.status)}>
              {health.services.chat.status.toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Engine: {health.services.chat.engineLoaded ? 'Loaded' : 'Not Loaded'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Raw Data (Optional Debug View) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Raw Health Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64">
            {JSON.stringify(health, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}