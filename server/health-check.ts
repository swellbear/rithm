// Milestone 6: Health Check and System Monitoring
import { Request, Response } from 'express';
import { storage } from './storage';
import { performanceMonitor } from './performance-monitor';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  services: {
    database: ServiceStatus;
    storage: ServiceStatus;
    memory: ServiceStatus;
    performance: ServiceStatus;
  };
  metrics: {
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
  };
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

class HealthChecker {
  private startTime = Date.now();

  async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      // Test basic database connectivity with a simple query
      await storage.getUser(1);
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkStorage(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      // Test storage functionality with basic operations
      await storage.getHerdsByUserId(1);
      return {
        status: 'up',
        responseTime: Date.now() - start,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  checkMemory(): ServiceStatus {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    
    let status: 'up' | 'down' | 'degraded' = 'up';
    
    if (heapUsedMB > 800) {
      status = 'down';
    } else if (heapUsedMB > 500) {
      status = 'degraded';
    }

    return {
      status,
      lastCheck: new Date(),
      responseTime: heapUsedMB
    };
  }

  checkPerformance(): ServiceStatus {
    const stats = performanceMonitor.getStats();
    const alerts = performanceMonitor.getPerformanceAlerts();
    
    let status: 'up' | 'down' | 'degraded' = 'up';
    
    if (alerts.some(alert => alert.severity === 'critical')) {
      status = 'down';
    } else if (alerts.some(alert => alert.severity === 'warning')) {
      status = 'degraded';
    }

    return {
      status,
      responseTime: stats.avgResponseTime,
      lastCheck: new Date()
    };
  }

  async getFullHealthStatus(): Promise<HealthStatus> {
    const [database, storage, memory, performance] = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
      Promise.resolve(this.checkMemory()),
      Promise.resolve(this.checkPerformance())
    ]);

    const services = { database, storage, memory, performance };
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const serviceStatuses = Object.values(services).map(s => s.status);
    if (serviceStatuses.includes('down')) {
      overallStatus = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    const performanceStats = performanceMonitor.getStats();

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      services,
      metrics: {
        responseTime: performanceStats.avgResponseTime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        errorRate: 0 // Will be calculated from performance monitor
      }
    };
  }

  // Express middleware for health check endpoint
  healthCheckHandler = async (req: Request, res: Response) => {
    const health = await this.getFullHealthStatus();
    
    // Set appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  };

  // Simple ready check for Kubernetes/load balancer
  readinessHandler = async (req: Request, res: Response) => {
    try {
      const dbStatus = await this.checkDatabase();
      if (dbStatus.status === 'up') {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready', reason: 'database unavailable' });
      }
    } catch (error) {
      res.status(503).json({ status: 'not ready', reason: 'health check failed' });
    }
  };

  // Simple liveness check
  livenessHandler = (req: Request, res: Response) => {
    res.status(200).json({ status: 'alive', uptime: Date.now() - this.startTime });
  };
}

export const healthChecker = new HealthChecker();