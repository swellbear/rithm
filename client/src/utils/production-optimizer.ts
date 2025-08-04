/**
 * Production Optimization Utilities for ML Platform
 * 
 * This module provides runtime optimizations and performance enhancements
 * specifically designed for production deployment of the ML Platform.
 */

import { config } from '@/config/environment';
import { performanceLogger } from '@/lib/logger';

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    if (config.isProduction && typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    try {
      // Observe navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.recordMetric('page-load', entry.duration);
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric(`paint-${entry.name}`, entry.startTime);
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      }
    } catch (error) {
      performanceLogger.warn('Failed to initialize performance observers:', error);
    }
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Log significant performance issues
    if (value > 5000 && name.includes('load')) {
      performanceLogger.warn(`Slow ${name}: ${value.toFixed(2)}ms`);
    }
  }

  getMetrics(): Record<string, { avg: number; max: number; min: number; count: number }> {
    const result: Record<string, any> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values),
        count: values.length
      };
    });

    return result;
  }

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Bundle size analyzer (development only)
export const analyzeBundleSize = (): void => {
  if (config.isDevelopment && typeof window !== 'undefined') {
    const scripts = Array.from(document.scripts);
    const totalSize = scripts.reduce((sum, script) => {
      return sum + (script.src ? 0 : script.textContent?.length || 0);
    }, 0);

    performanceLogger.info(`Estimated bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
  }
};

// Memory usage monitoring
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private intervalId?: NodeJS.Timeout;

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(intervalMs: number = 30000): void {
    if (config.isProduction && typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      this.intervalId = setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const used = Math.round(memory.usedJSHeapSize / 1048576); // MB
          const total = Math.round(memory.totalJSHeapSize / 1048576); // MB
          
          // Alert on high memory usage
          if (used > 100) {
            performanceLogger.warn(`High memory usage: ${used}MB/${total}MB`);
          }
          
          PerformanceMonitor.getInstance().recordMetric('memory-usage', used);
        }
      }, intervalMs);
    }
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}

// React component optimization helpers
export const optimizeComponent = <T extends React.ComponentType<any>>(
  Component: T,
  displayName?: string
): T => {
  if (config.isProduction) {
    // Remove displayName in production
    delete (Component as any).displayName;
    
    // Remove propTypes in production (if they exist)
    delete (Component as any).propTypes;
    delete (Component as any).defaultProps;
  } else if (displayName) {
    (Component as any).displayName = displayName;
  }

  return Component;
};

// Lazy loading utilities
export const createLazyComponent = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(factory);
  
  return (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={fallback ? <fallback /> : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Error boundary for production
export class ProductionErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (config.isProduction && config.logging.enableErrorReporting) {
      // Report to error tracking service
      console.error('[React-Error-Boundary]', JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }));
    } else {
      console.error('React Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error!} />;
      }

      return (
        <div className="error-boundary p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 dark:text-red-300">
            {config.isDevelopment && this.state.error?.message}
            {config.isProduction && "We're sorry, but something unexpected happened. Please refresh the page."}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize production optimizations
export const initializeProductionOptimizations = (): void => {
  if (config.isProduction && typeof window !== 'undefined') {
    // Start performance monitoring
    const perfMonitor = PerformanceMonitor.getInstance();
    
    // Start memory monitoring
    const memoryMonitor = MemoryMonitor.getInstance();
    memoryMonitor.startMonitoring();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      perfMonitor.cleanup();
      memoryMonitor.stopMonitoring();
    });

    // Report performance metrics periodically
    setTimeout(() => {
      const metrics = perfMonitor.getMetrics();
      if (Object.keys(metrics).length > 0) {
        performanceLogger.info('Performance metrics:', metrics);
      }
    }, 10000); // After 10 seconds
  }
};

// Service worker registration for production
export const registerServiceWorker = async (): Promise<void> => {
  if (config.isProduction && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      performanceLogger.info('Service worker registered:', registration);
    } catch (error) {
      performanceLogger.warn('Service worker registration failed:', error);
    }
  }
};

export default {
  PerformanceMonitor,
  MemoryMonitor,
  optimizeComponent,
  createLazyComponent,
  ProductionErrorBoundary,
  initializeProductionOptimizations,
  registerServiceWorker,
  analyzeBundleSize
};