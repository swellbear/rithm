/**
 * Production Optimization Hooks for ML Platform
 * 
 * Custom React hooks that provide production-ready optimizations
 * including performance monitoring, error tracking, and resource management.
 */

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { config } from '@/config/environment';
import { PerformanceMonitor, MemoryMonitor } from '@/utils/production-optimizer';
import { performanceLogger } from '@/lib/logger';

/**
 * Hook for performance monitoring in production
 */
export const usePerformanceMonitor = (componentName?: string) => {
  const performanceMonitor = useMemo(() => PerformanceMonitor.getInstance(), []);
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (config.isProduction && componentName) {
      const renderTime = Date.now() - renderStartTime.current;
      performanceMonitor.recordMetric(`component-${componentName}-render`, renderTime);
      
      // Log slow renders
      if (renderTime > 100) {
        performanceLogger.warn(`Slow render in ${componentName}: ${renderTime}ms`);
      }
    }
  }, [performanceMonitor, componentName]);

  const recordMetric = useCallback((name: string, value: number) => {
    if (config.isProduction) {
      performanceMonitor.recordMetric(name, value);
    }
  }, [performanceMonitor]);

  const measureAsync = useCallback(async <T>(
    name: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await asyncFn();
      recordMetric(name, performance.now() - start);
      return result;
    } catch (error) {
      recordMetric(`${name}-error`, performance.now() - start);
      throw error;
    }
  }, [recordMetric]);

  return { recordMetric, measureAsync };
};

/**
 * Hook for memory monitoring and cleanup
 */
export const useMemoryOptimization = () => {
  const memoryMonitor = useMemo(() => MemoryMonitor.getInstance(), []);
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const forceGarbageCollection = useCallback(() => {
    if (config.isDevelopment && typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
      performanceLogger.debug('Forced garbage collection');
    }
  }, []);

  useEffect(() => {
    if (config.isProduction) {
      memoryMonitor.startMonitoring();
    }

    return () => {
      // Run all cleanup functions
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          performanceLogger.warn('Cleanup function failed:', error);
        }
      });
      cleanupFunctions.current = [];

      if (config.isProduction) {
        memoryMonitor.stopMonitoring();
      }
    };
  }, [memoryMonitor]);

  return { addCleanup, forceGarbageCollection };
};

/**
 * Hook for optimized API calls with caching and retry logic
 */
export const useOptimizedApi = <T>(
  cacheKey?: string,
  cacheDuration: number = 5 * 60 * 1000 // 5 minutes
) => {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const getCachedData = useCallback((key: string): T | null => {
    if (!cacheKey || !config.isProduction) return null;
    
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      performanceLogger.debug(`Cache hit for ${key}`);
      return cached.data;
    }
    return null;
  }, [cacheKey, cacheDuration]);

  const setCachedData = useCallback((key: string, data: T) => {
    if (cacheKey && config.isProduction) {
      cache.current.set(key, { data, timestamp: Date.now() });
      
      // Limit cache size
      if (cache.current.size > 50) {
        const firstKey = cache.current.keys().next().value;
        cache.current.delete(firstKey);
      }
    }
  }, [cacheKey]);

  const createAbortableRequest = useCallback(<R>(
    requestKey: string,
    requestFn: (signal: AbortSignal) => Promise<R>
  ): Promise<R> => {
    // Cancel previous request with same key
    const existingController = abortControllers.current.get(requestKey);
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllers.current.set(requestKey, controller);

    return requestFn(controller.signal).finally(() => {
      abortControllers.current.delete(requestKey);
    });
  }, []);

  useEffect(() => {
    return () => {
      // Abort all pending requests
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();
      cache.current.clear();
    };
  }, []);

  return { getCachedData, setCachedData, createAbortableRequest };
};

/**
 * Hook for production-ready error handling
 */
export const useProductionErrorHandler = (componentName?: string) => {
  const handleError = useCallback((error: Error, errorInfo?: any) => {
    if (config.isProduction && config.logging.enableErrorReporting) {
      // Structure error data for reporting
      const errorData = {
        message: error.message,
        stack: error.stack,
        component: componentName,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ...errorInfo
      };

      console.error('[Production-Error]', JSON.stringify(errorData));
    } else {
      console.error(`Error in ${componentName}:`, error, errorInfo);
    }
  }, [componentName]);

  const handleAsyncError = useCallback((asyncFn: () => Promise<void>) => {
    return asyncFn().catch(handleError);
  }, [handleError]);

  return { handleError, handleAsyncError };
};

/**
 * Hook for optimized event handling with debouncing
 */
export const useOptimizedEvents = () => {
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const debounce = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    key: string = 'default'
  ): ((...args: Parameters<T>) => void) => {
    return (...args: Parameters<T>) => {
      const existingTimeout = timeouts.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        fn(...args);
        timeouts.current.delete(key);
      }, delay);

      timeouts.current.set(key, timeout);
    };
  }, []);

  const throttle = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    limit: number,
    key: string = 'default'
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeouts.current.forEach(timeout => clearTimeout(timeout));
      timeouts.current.clear();
    };
  }, []);

  return { debounce, throttle };
};

/**
 * Hook for production bundle analysis (development only)
 */
export const useBundleAnalysis = () => {
  const analyzeBundle = useCallback(() => {
    if (config.isDevelopment && typeof window !== 'undefined') {
      // Analyze loaded scripts
      const scripts = Array.from(document.scripts);
      const analysis = scripts.map(script => ({
        src: script.src || 'inline',
        size: script.textContent?.length || 0,
        async: script.async,
        defer: script.defer
      }));

      performanceLogger.info('Bundle analysis:', analysis);
      return analysis;
    }
    return [];
  }, []);

  useEffect(() => {
    if (config.isDevelopment) {
      // Run analysis after initial load
      setTimeout(analyzeBundle, 2000);
    }
  }, [analyzeBundle]);

  return { analyzeBundle };
};