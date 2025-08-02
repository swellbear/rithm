/**
 * Performance Monitoring Utilities for ML Platform
 * Chrome DevTools integration for component performance tracking
 */

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentName: string;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * Start performance measurement for a component
   */
  startMeasurement(componentName: string): void {
    if (!this.isDevelopment) return;
    
    performance.mark(`${componentName}-start`);
  }

  /**
   * End performance measurement and record metrics
   */
  endMeasurement(componentName: string): number {
    if (!this.isDevelopment) return 0;

    const endMark = `${componentName}-end`;
    const startMark = `${componentName}-start`;
    
    performance.mark(endMark);
    performance.measure(`${componentName}-render`, startMark, endMark);
    
    const measures = performance.getEntriesByName(`${componentName}-render`);
    const latestMeasure = measures[measures.length - 1];
    const renderTime = latestMeasure?.duration || 0;
    
    // Record memory usage
    const memoryInfo = this.getMemoryUsage();
    
    const metrics: PerformanceMetrics = {
      renderTime,
      memoryUsage: memoryInfo.usedJSHeapSize,
      componentName,
      timestamp: Date.now()
    };
    
    this.metrics.push(metrics);
    
    // Log performance if > threshold
    if (renderTime > 20) {
      console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    } else if (renderTime > 0) {
      console.log(`⚡ ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
    
    // Clean up performance entries
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(`${componentName}-render`);
    
    return renderTime;
  }

  /**
   * Get current memory usage information
   */
  getMemoryUsage() {
    if (!this.isDevelopment || !('memory' in performance)) {
      return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
    }
    
    return (performance as any).memory;
  }

  /**
   * Log detailed memory information
   */
  logMemoryStats(): void {
    if (!this.isDevelopment) return;
    
    const memory = this.getMemoryUsage();
    if (memory.usedJSHeapSize === 0) {
      console.log('Memory API not available');
      return;
    }
    
    console.table({
      'Used Heap': `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      'Total Heap': `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      'Heap Limit': `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      'Usage %': `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%`
    });
  }

  /**
   * Get performance summary for a component
   */
  getComponentStats(componentName: string) {
    const componentMetrics = this.metrics.filter(m => m.componentName === componentName);
    
    if (componentMetrics.length === 0) {
      return null;
    }
    
    const renderTimes = componentMetrics.map(m => m.renderTime);
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);
    
    return {
      componentName,
      renders: componentMetrics.length,
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      minRenderTime: Number(minRenderTime.toFixed(2)),
      lastRender: componentMetrics[componentMetrics.length - 1].timestamp
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats() {
    const components = [...new Set(this.metrics.map(m => m.componentName))];
    return components.map(name => this.getComponentStats(name));
  }

  /**
   * Clear all collected metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('Performance metrics cleared');
  }

  /**
   * Export metrics as CSV for analysis
   */
  exportMetrics(): string {
    const headers = 'Component,Render Time (ms),Memory Usage (MB),Timestamp\n';
    const rows = this.metrics.map(m => 
      `${m.componentName},${m.renderTime.toFixed(2)},${(m.memoryUsage / 1024 / 1024).toFixed(2)},${new Date(m.timestamp).toISOString()}`
    );
    
    return headers + rows.join('\n');
  }
}

/**
 * React Hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  const startTimer = () => monitor.startMeasurement(componentName);
  const endTimer = () => monitor.endMeasurement(componentName);
  
  return { startTimer, endTimer, monitor };
}

/**
 * Higher-Order Component for automatic performance monitoring
 */
export function withPerformanceMonitoring<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  const MonitoredComponent = (props: T) => {
    const { startTimer, endTimer } = usePerformanceMonitor(componentName);
    
    React.useEffect(() => {
      startTimer();
      return () => {
        endTimer();
      };
    });
    
    return React.createElement(WrappedComponent, props);
  };
  
  MonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return MonitoredComponent;
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Development-only performance commands for browser console
if (process.env.NODE_ENV === 'development') {
  (window as any).MLPlatformPerf = {
    getStats: () => performanceMonitor.getAllStats(),
    logMemory: () => performanceMonitor.logMemoryStats(),
    clearMetrics: () => performanceMonitor.clearMetrics(),
    exportMetrics: () => {
      const csv = performanceMonitor.exportMetrics();
      console.log('Performance metrics CSV:');
      console.log(csv);
      return csv;
    }
  };
  
  console.log('🔧 Performance monitoring available at: window.MLPlatformPerf');
}