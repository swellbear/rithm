/**
 * Performance Optimization Hook - React performance monitoring and optimization
 */

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  memoryUsage: number;
  componentName: string;
}

const performanceCache = new Map<string, PerformanceMetrics>();

/**
 * Monitor component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef<number>();

  useEffect(() => {
    startTime.current = performance.now();
    renderCount.current++;

    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        renderTimes.current.push(renderTime);
        
        // Keep only last 10 render times
        if (renderTimes.current.length > 10) {
          renderTimes.current.shift();
        }

        const averageRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
        
        const metrics: PerformanceMetrics = {
          renderCount: renderCount.current,
          lastRenderTime: renderTime,
          averageRenderTime,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          componentName
        };

        performanceCache.set(componentName, metrics);

        // Warn about slow renders
        if (renderTime > 16) { // 60fps threshold
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  });

  return useMemo(() => performanceCache.get(componentName), [componentName]);
}

/**
 * Optimized memo hook with shallow comparison
 */
export function useShallowMemo<T>(
  factory: () => T,
  deps?: React.DependencyList
): T {
  const depsRef = useRef<React.DependencyList>();
  const valueRef = useRef<T>();

  return useMemo(() => {
    const hasChanged = !depsRef.current || 
      !deps || 
      deps.length !== depsRef.current.length ||
      deps.some((dep, index) => dep !== depsRef.current![index]);

    if (hasChanged) {
      depsRef.current = deps;
      valueRef.current = factory();
    }

    return valueRef.current!;
  }, deps);
}

/**
 * Debounced callback with automatic cleanup
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay, ...deps]
  );
}

/**
 * Memory usage monitoring
 */
export function useMemoryMonitor() {
  const [memoryStats, setMemoryStats] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryStats = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const used = memory.usedJSHeapSize / 1024 / 1024; // MB
        const total = memory.totalJSHeapSize / 1024 / 1024; // MB
        const percentage = (used / total) * 100;

        setMemoryStats({ used, total, percentage });

        // Warn about high memory usage
        if (percentage > 80) {
          console.warn(`High memory usage detected: ${percentage.toFixed(1)}%`);
        }
      }
    };

    updateMemoryStats();
    const interval = setInterval(updateMemoryStats, 10000); // Every 10s

    return () => clearInterval(interval);
  }, []);

  return memoryStats;
}

/**
 * Get all performance metrics
 */
export function getPerformanceMetrics() {
  return {
    components: Array.from(performanceCache.entries()),
    totalComponents: performanceCache.size,
    slowComponents: Array.from(performanceCache.entries())
      .filter(([, metrics]) => metrics.averageRenderTime > 16)
      .map(([name, metrics]) => ({ name, ...metrics }))
  };
}

/**
 * Clear performance cache
 */
export function clearPerformanceCache() {
  performanceCache.clear();
}