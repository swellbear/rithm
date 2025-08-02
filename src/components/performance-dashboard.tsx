/**
 * Performance Dashboard - Real-time performance monitoring and optimization insights
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { performanceTracker } from '@/lib/performance-tracker';
import { useStorageMonitor } from '@/hooks/useOptimizedStorage';
import { useMemoryMonitor, getPerformanceMetrics } from '@/hooks/usePerformanceOptimization';
import { 
  Activity, 
  Clock, 
  Database, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Zap,
  HardDrive
} from 'lucide-react';

export default function PerformanceDashboard() {
  const [performanceStats, setPerformanceStats] = useState(performanceTracker.getStats());
  const [componentMetrics, setComponentMetrics] = useState(getPerformanceMetrics());
  const { stats: storageStats, cleanup: cleanupStorage } = useStorageMonitor();
  const memoryStats = useMemoryMonitor();

  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceStats(performanceTracker.getStats());
      setComponentMetrics(getPerformanceMetrics());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getPerformanceScore = () => {
    let score = 100;
    
    // Memory usage penalty
    if (memoryStats && memoryStats.percentage > 80) score -= 30;
    else if (memoryStats && memoryStats.percentage > 60) score -= 15;
    
    // Storage usage penalty
    if (storageStats.localStorageUsage > 1024 * 500) score -= 20; // 500KB
    else if (storageStats.localStorageUsage > 1024 * 200) score -= 10; // 200KB
    
    // Slow operations penalty
    const slowOps = performanceTracker.getSlowOperations(5);
    score -= slowOps.length * 5;
    
    return Math.max(0, score);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return '< 1ms';
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const performanceScore = getPerformanceScore();
  const slowOperations = performanceTracker.getSlowOperations(5);

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">
              {performanceScore}
              <span className="text-lg text-gray-500">/100</span>
            </div>
            <Progress value={performanceScore} className="flex-1" />
            <Badge variant={performanceScore > 80 ? "default" : performanceScore > 60 ? "secondary" : "destructive"}>
              {performanceScore > 80 ? "Excellent" : performanceScore > 60 ? "Good" : "Needs Attention"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Total Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceStats.total}</div>
                <p className="text-xs text-gray-500">
                  {performanceStats.recent.count} in last minute
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(performanceStats.recent.averageDuration)}
                </div>
                <p className="text-xs text-gray-500">Recent operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {memoryStats ? `${memoryStats.used.toFixed(1)}MB` : 'N/A'}
                </div>
                <p className="text-xs text-gray-500">
                  {memoryStats ? `${memoryStats.percentage.toFixed(1)}% used` : 'Unavailable'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Storage Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storageStats.cacheSize}</div>
                <p className="text-xs text-gray-500">
                  {formatBytes(storageStats.localStorageUsage)} stored
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(performanceStats.byType).map(([type, stats]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{type}</Badge>
                        <span className="text-sm text-gray-600">{stats.count} ops</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{formatDuration(stats.averageDuration)}</span>
                        {stats.thresholdViolations > 0 && (
                          <span className="text-red-500 ml-2">
                            ({stats.thresholdViolations} slow)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Slow Operations</CardTitle>
              </CardHeader>
              <CardContent>
                {slowOperations.length > 0 ? (
                  <div className="space-y-2">
                    {slowOperations.map((op, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{op.name}</div>
                          <div className="text-xs text-gray-600">{op.type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{formatDuration(op.duration)}</div>
                          <div className="text-xs text-red-600">
                            {op.thresholdRatio.toFixed(1)}x slower
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    No slow operations detected
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-600 pb-2 border-b">
                  <div>Component</div>
                  <div>Renders</div>
                  <div>Avg Time</div>
                  <div>Status</div>
                </div>
                
                {componentMetrics.components.map(([name, metrics]) => (
                  <div key={name} className="grid grid-cols-4 gap-4 text-sm items-center">
                    <div className="font-medium">{name}</div>
                    <div>{metrics.renderCount}</div>
                    <div>{formatDuration(metrics.averageRenderTime)}</div>
                    <div>
                      <Badge 
                        variant={metrics.averageRenderTime > 16 ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {metrics.averageRenderTime > 16 ? "Slow" : "Good"}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {componentMetrics.components.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No component metrics available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Storage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Cache Size:</span>
                    <span className="font-medium">{storageStats.cacheSize} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Queue Size:</span>
                    <span className="font-medium">{storageStats.queueSize} pending</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Usage:</span>
                    <span className="font-medium">{formatBytes(storageStats.localStorageUsage)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={cleanupStorage} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Clean Expired Cache
                </Button>
                <Button 
                  onClick={() => performanceTracker.clear()} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Clear Performance Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-4">
          <div className="space-y-4">
            {performanceScore < 80 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Performance can be improved. Consider the optimizations below.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recommended Optimizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {memoryStats && memoryStats.percentage > 60 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-sm">High Memory Usage</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Consider reducing component complexity or implementing virtualization
                      </div>
                    </div>
                  )}
                  
                  {storageStats.localStorageUsage > 1024 * 200 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-sm">Large Storage Usage</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Clean up old data or implement data compression
                      </div>
                    </div>
                  )}
                  
                  {componentMetrics.slowComponents.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-sm">Slow Components</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {componentMetrics.slowComponents.length} components are rendering slowly
                      </div>
                    </div>
                  )}
                  
                  {performanceScore > 80 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-sm text-green-800">Performance is Excellent</div>
                      <div className="text-xs text-green-600 mt-1">
                        No optimizations needed at this time
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}