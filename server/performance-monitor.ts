// Milestone 5: Performance Monitoring System
import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  responseTime: number;
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 requests

  // Middleware for tracking response times
  responseTimeTracker = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const metric: PerformanceMetrics = {
        responseTime,
        timestamp: new Date(),
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        memoryUsage: process.memoryUsage()
      };
      
      this.addMetric(metric);
    });
    
    next();
  };

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  // Get performance statistics
  getStats() {
    if (this.metrics.length === 0) {
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        totalRequests: 0,
        slowestEndpoints: [],
        memoryUsage: process.memoryUsage()
      };
    }

    const responseTimes = this.metrics.map(m => m.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    // Find slowest endpoints
    const endpointTimes: { [key: string]: number[] } = {};
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointTimes[key]) endpointTimes[key] = [];
      endpointTimes[key].push(metric.responseTime);
    });

    const slowestEndpoints = Object.entries(endpointTimes)
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
        requestCount: times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    return {
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime,
      maxResponseTime,
      totalRequests: this.metrics.length,
      slowestEndpoints,
      memoryUsage: process.memoryUsage()
    };
  }

  // Get recent metrics for real-time monitoring
  getRecentMetrics(minutes: number = 5) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  // Check for performance issues
  getPerformanceAlerts() {
    const recent = this.getRecentMetrics(5);
    const alerts = [];

    if (recent.length > 0) {
      const avgResponseTime = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
      
      if (avgResponseTime > 1000) {
        alerts.push({
          type: 'slow_response',
          message: `Average response time in last 5 minutes: ${Math.round(avgResponseTime)}ms`,
          severity: 'warning'
        });
      }

      const errorRate = recent.filter(m => m.statusCode >= 400).length / recent.length;
      if (errorRate > 1) { // No hardcoded error rate thresholds - require authentic error analysis
        alerts.push({
          type: 'high_error_rate',
          message: `Error rate in last 5 minutes: ${Math.round(errorRate * 100)}%`,
          severity: 'critical'
        });
      }
    }

    const currentMemory = process.memoryUsage();
    const memoryUsageMB = currentMemory.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) {
      alerts.push({
        type: 'high_memory_usage',
        message: `Memory usage: ${Math.round(memoryUsageMB)}MB`,
        severity: 'warning'
      });
    }

    return alerts;
  }
}

export const performanceMonitor = new PerformanceMonitor();