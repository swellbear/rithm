/**
 * Performance Monitor - Real-time performance monitoring component
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { performanceTracker } from '@/lib/performance-tracker';
import { Activity, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function PerformanceMonitor() {
  const [recentOperations, setRecentOperations] = useState<any[]>([]);
  const [stats, setStats] = useState(performanceTracker.getStats());

  useEffect(() => {
    const unsubscribe = performanceTracker.subscribe((entries) => {
      setRecentOperations(prev => [...entries, ...prev].slice(0, 10));
      setStats(performanceTracker.getStats());
    });

    return unsubscribe;
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1) return '< 1ms';
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (duration: number, type: string) => {
    const thresholds = {
      render: 16,
      api: 1000,
      storage: 50,
      navigation: 500
    };
    
    const threshold = thresholds[type as keyof typeof thresholds] || 100;
    if (duration < threshold * 0.5) return 'text-green-600';
    if (duration < threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentOperations.length > 0 ? (
              recentOperations.map((op, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{op.type}</Badge>
                    <span className="text-sm font-medium">{op.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getStatusColor(op.duration, op.type)}`}>
                      {formatDuration(op.duration)}
                    </span>
                    {op.duration > (op.type === 'render' ? 16 : 100) && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No operations tracked yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Operations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatDuration(stats.recent.averageDuration)}
              </div>
              <div className="text-sm text-gray-500">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.recent.count}</div>
              <div className="text-sm text-gray-500">Recent (1m)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Object.values(stats.byType).reduce((sum, type) => sum + type.thresholdViolations, 0)}
              </div>
              <div className="text-sm text-gray-500">Slow Operations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}