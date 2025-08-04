/**
 * Performance Tracker - Application-wide performance monitoring and optimization
 */

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: 'render' | 'api' | 'storage' | 'navigation';
  metadata?: Record<string, any>;
}

interface PerformanceThresholds {
  render: number;
  api: number;
  storage: number;
  navigation: number;
}

class PerformanceTracker {
  private entries: PerformanceEntry[] = [];
  private maxEntries = 500;
  private thresholds: PerformanceThresholds = {
    render: 16, // 60fps
    api: 1000, // 1 second
    storage: 50, // 50ms
    navigation: 500 // 500ms
  };

  private observers: Set<(entries: PerformanceEntry[]) => void> = new Set();

  /**
   * Start tracking a performance metric
   */
  startTracking(name: string, type: PerformanceEntry['type'], metadata?: Record<string, any>) {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.addEntry({
          name,
          startTime,
          duration,
          type,
          metadata
        });
      }
    };
  }

  /**
   * Track a function execution
   */
  track<T>(
    name: string, 
    type: PerformanceEntry['type'], 
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const tracker = this.startTracking(name, type, metadata);
    try {
      const result = fn();
      tracker.end();
      return result;
    } catch (error) {
      tracker.end();
      throw error;
    }
  }

  /**
   * Track async function execution
   */
  async trackAsync<T>(
    name: string,
    type: PerformanceEntry['type'],
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const tracker = this.startTracking(name, type, metadata);
    try {
      const result = await fn();
      tracker.end();
      return result;
    } catch (error) {
      tracker.end();
      throw error;
    }
  }

  /**
   * Add performance entry
   */
  private addEntry(entry: PerformanceEntry) {
    this.entries.push(entry);
    
    // Keep only recent entries
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Check thresholds and warn
    const threshold = this.thresholds[entry.type];
    if (entry.duration > threshold) {
      console.warn(`Performance threshold exceeded: ${entry.name} (${entry.type}) took ${entry.duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    // Notify observers
    this.observers.forEach(observer => observer([entry]));
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const byType = this.groupByType();
    const recent = this.getRecentEntries(60 * 1000); // Last minute

    return {
      total: this.entries.length,
      byType: Object.fromEntries(
        Object.entries(byType).map(([type, entries]) => [
          type,
          {
            count: entries.length,
            averageDuration: entries.reduce((sum, e) => sum + e.duration, 0) / entries.length,
            maxDuration: Math.max(...entries.map(e => e.duration)),
            thresholdViolations: entries.filter(e => e.duration > this.thresholds[e.type as keyof PerformanceThresholds]).length
          }
        ])
      ),
      recent: {
        count: recent.length,
        averageDuration: recent.length > 0 
          ? recent.reduce((sum, e) => sum + e.duration, 0) / recent.length 
          : 0
      }
    };
  }

  /**
   * Get entries grouped by type
   */
  private groupByType() {
    return this.entries.reduce((acc, entry) => {
      if (!acc[entry.type]) {
        acc[entry.type] = [];
      }
      acc[entry.type].push(entry);
      return acc;
    }, {} as Record<string, PerformanceEntry[]>);
  }

  /**
   * Get recent entries within timeframe
   */
  private getRecentEntries(timeframe: number) {
    const cutoff = performance.now() - timeframe;
    return this.entries.filter(entry => entry.startTime > cutoff);
  }

  /**
   * Get slow operations
   */
  getSlowOperations(limit = 10) {
    return [...this.entries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(entry => ({
        ...entry,
        thresholdRatio: entry.duration / this.thresholds[entry.type]
      }));
  }

  /**
   * Subscribe to performance updates
   */
  subscribe(callback: (entries: PerformanceEntry[]) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Clear all entries
   */
  clear() {
    this.entries = [];
  }

  /**
   * Update performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Export performance data
   */
  export() {
    return {
      entries: this.entries,
      stats: this.getStats(),
      thresholds: this.thresholds,
      exportedAt: new Date().toISOString()
    };
  }
}

export const performanceTracker = new PerformanceTracker();

// Auto-track navigation performance
let navigationStart: number;

const originalPushState = history.pushState;
history.pushState = function(...args: any[]) {
  navigationStart = performance.now();
  originalPushState.apply(this, args);
  
  // Track navigation completion
  setTimeout(() => {
    if (navigationStart) {
      performanceTracker.startTracking('navigation', 'navigation').end();
    }
  }, 0);
};

// Track initial page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    performanceTracker.startTracking('initial-load', 'navigation', {
      loadTime,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart
    }).end();
  });
}