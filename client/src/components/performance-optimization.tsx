import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, Monitor, Database, Wifi, Clock, 
  TrendingUp, AlertTriangle, CheckCircle, 
  RefreshCw, Settings, Download 
} from "lucide-react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  cacheHitRate: number;
  reRenderCount: number;
  totalComponents: number;
}

interface PerformanceOptimizationProps {
  metrics?: PerformanceMetrics;
  onOptimize?: () => void;
}

export function PerformanceOptimization({ 
  metrics,
  onOptimize 
}: PerformanceOptimizationProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<string[]>([]);

  // Default metrics if none provided
  const defaultMetrics: PerformanceMetrics = {
    renderTime: 45,
    memoryUsage: 78,
    apiResponseTime: 120,
    cacheHitRate: 85,
    reRenderCount: 12,
    totalComponents: 156
  };

  const currentMetrics = metrics || defaultMetrics;

  const performanceScore = useMemo(() => {
    const renderScore = Math.max(0, 100 - (currentMetrics.renderTime / 100) * 100);
    const memoryScore = Math.max(0, 100 - currentMetrics.memoryUsage);
    const apiScore = Math.max(0, 100 - (currentMetrics.apiResponseTime / 200) * 100);
    const cacheScore = currentMetrics.cacheHitRate;
    const reRenderScore = Math.max(0, 100 - (currentMetrics.reRenderCount / 20) * 100);
    
    return Math.round((renderScore + memoryScore + apiScore + cacheScore + reRenderScore) / 5);
  }, [currentMetrics]);

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "Excellent", color: "green", icon: CheckCircle };
    if (score >= 75) return { level: "Good", color: "blue", icon: TrendingUp };
    if (score >= 60) return { level: "Fair", color: "yellow", icon: AlertTriangle };
    return { level: "Needs Improvement", color: "red", icon: AlertTriangle };
  };

  const performanceLevel = getPerformanceLevel(performanceScore);
  const LevelIcon = performanceLevel.icon;

  const optimizePerformance = useCallback(async () => {
    setIsOptimizing(true);
    setOptimizationResults([]);

    const optimizations = [
      "Optimizing component re-renders with React.memo",
      "Implementing useCallback for event handlers",
      "Cleaning up localStorage with expired data",
      "Optimizing API query dependencies",
      "Implementing smart data batching",
      "Reducing bundle size with code splitting"
    ];

    // Simulate optimization process
    for (let i = 0; i < optimizations.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setOptimizationResults(prev => [...prev, optimizations[i]]);
    }

    setIsOptimizing(false);
    onOptimize?.();
  }, [onOptimize]);

  return (
    <div className="space-y-6">
      {/* Performance Score Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>Real-time application performance metrics</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{performanceScore}</div>
              <Badge 
                variant={performanceLevel.color === 'green' ? 'default' : 'secondary'}
                className={`
                  ${performanceLevel.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                  ${performanceLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                  ${performanceLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${performanceLevel.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                `}
              >
                <LevelIcon className="h-3 w-3 mr-1" />
                {performanceLevel.level}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Progress value={performanceScore} className="w-full" />
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Render Time</div>
              <div className="text-2xl font-bold">{currentMetrics.renderTime}ms</div>
              <div className="text-xs text-muted-foreground">Component loading</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Memory Usage</div>
              <div className="text-2xl font-bold">{currentMetrics.memoryUsage}%</div>
              <div className="text-xs text-muted-foreground">Browser memory</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">API Response</div>
              <div className="text-2xl font-bold">{currentMetrics.apiResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">Average request time</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Cache Hit Rate</div>
              <div className="text-2xl font-bold">{currentMetrics.cacheHitRate}%</div>
              <div className="text-xs text-muted-foreground">Data caching</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Re-renders</div>
              <div className="text-2xl font-bold">{currentMetrics.reRenderCount}</div>
              <div className="text-xs text-muted-foreground">Last minute</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium">Components</div>
              <div className="text-2xl font-bold">{currentMetrics.totalComponents}</div>
              <div className="text-xs text-muted-foreground">Active components</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Optimization
          </CardTitle>
          <CardDescription>
            Automatically optimize app performance and reduce loading times
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {performanceScore < 80 && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Performance could be improved. Run optimization to enhance speed and responsiveness.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={optimizePerformance}
            disabled={isOptimizing}
            className="w-full"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Optimize Performance
              </>
            )}
          </Button>

          {optimizationResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Optimization Progress:</div>
              <div className="space-y-1">
                {optimizationResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}