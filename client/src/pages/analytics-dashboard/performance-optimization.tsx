/**
 * Performance Optimization Page - Complete performance monitoring and optimization tools
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PerformanceDashboard from '@/components/performance-dashboard';
import PerformanceMonitor from '@/components/performance-monitor';
import { performanceTracker } from '@/lib/performance-tracker';
import { 
  Zap, 
  Settings, 
  Download, 
  BarChart3, 
  Target,
  Lightbulb,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function PerformanceOptimization() {
  const [activeOptimizations, setActiveOptimizations] = useState({
    memoryMonitoring: true,
    renderOptimization: true,
    storageOptimization: true,
    networkOptimization: false
  });

  const handleExportData = () => {
    const data = performanceTracker.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const optimizationGuides = [
    {
      title: "Render Performance",
      description: "Optimize component rendering with React.memo and proper dependency arrays",
      impact: "High",
      difficulty: "Medium",
      tips: [
        "Use React.memo for pure components",
        "Optimize useCallback and useMemo dependencies", 
        "Avoid inline object creation in props",
        "Implement virtualization for large lists"
      ]
    },
    {
      title: "Memory Management", 
      description: "Reduce memory leaks and optimize memory usage patterns",
      impact: "High",
      difficulty: "Hard",
      tips: [
        "Clean up event listeners in useEffect cleanup",
        "Avoid storing large objects in state",
        "Implement proper data pagination",
        "Monitor component lifecycle patterns"
      ]
    },
    {
      title: "Storage Optimization",
      description: "Efficiently manage localStorage and data caching",
      impact: "Medium", 
      difficulty: "Easy",
      tips: [
        "Implement data compression for large objects",
        "Use batched storage operations",
        "Set appropriate cache expiration times",
        "Monitor storage usage limits"
      ]
    },
    {
      title: "Network Efficiency",
      description: "Optimize API calls and data fetching patterns",
      impact: "Medium",
      difficulty: "Medium", 
      tips: [
        "Implement request debouncing",
        "Use React Query for smart caching",
        "Batch multiple API requests",
        "Implement proper error retry logic"
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            Performance Optimization
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and optimize your farm management application performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Optimization Guides
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Performance Dashboard */}
        <TabsContent value="dashboard">
          <PerformanceDashboard />
        </TabsContent>

        {/* Performance Monitor */}
        <TabsContent value="monitor">
          <div className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Real-time performance monitoring is active. Data updates every 2 seconds.
              </AlertDescription>
            </Alert>
            <PerformanceMonitor />
          </div>
        </TabsContent>

        {/* Optimization Guides */}
        <TabsContent value="guides" className="space-y-6">
          <div className="grid gap-6">
            {optimizationGuides.map((guide, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {guide.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={guide.impact === 'High' ? 'default' : guide.impact === 'Medium' ? 'secondary' : 'outline'}>
                        {guide.impact} Impact
                      </Badge>
                      <Badge variant="outline">
                        {guide.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{guide.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Optimization Tips:</h4>
                    <ul className="space-y-1">
                      {guide.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {Object.entries(activeOptimizations).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {key === 'memoryMonitoring' && 'Monitor memory usage and detect leaks'}
                        {key === 'renderOptimization' && 'Optimize component rendering performance'}
                        {key === 'storageOptimization' && 'Efficient storage and caching management'}
                        {key === 'networkOptimization' && 'Optimize API calls and network requests'}
                      </p>
                    </div>
                    <Button
                      variant={enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveOptimizations(prev => ({
                        ...prev,
                        [key]: !prev[key as keyof typeof prev]
                      }))}
                    >
                      {enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                ))}
              </div>
              
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Changes to optimization settings take effect immediately and may impact performance monitoring.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}