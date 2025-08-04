/**
 * Optimized Storage Hook - High-performance localStorage management with intelligent caching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { storageOptimizer } from '@/lib/storage-optimizer';

interface UseOptimizedStorageOptions {
  defaultValue?: any;
  debounceMs?: number;
  syncAcrossTabs?: boolean;
  enableCompression?: boolean;
}

export function useOptimizedStorage<T>(
  key: string, 
  options: UseOptimizedStorageOptions = {}
) {
  const {
    defaultValue,
    debounceMs = 300,
    syncAcrossTabs = true,
    enableCompression = false
  } = options;

  const [value, setValue] = useState<T>(() => {
    return storageOptimizer.get(key, defaultValue);
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const isFirstMount = useRef(true);

  // Optimized setValue with debouncing
  const setOptimizedValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const finalValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue;

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce storage writes
      debounceTimeoutRef.current = setTimeout(() => {
        storageOptimizer.set(key, finalValue);
      }, debounceMs);

      return finalValue;
    });
  }, [key, debounceMs]);

  // Cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setValue(newValue);
        } catch (error) {
          // Ignore parsing errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, syncAcrossTabs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Remove value from storage
  const removeValue = useCallback(() => {
    setValue(defaultValue);
    storageOptimizer.remove(key);
  }, [key, defaultValue]);

  return [value, setOptimizedValue, removeValue] as const;
}

/**
 * Hook for batch storage operations
 */
export function useBatchStorage() {
  const batchUpdate = useCallback((updates: Record<string, any>) => {
    // Batch multiple storage operations
    Object.entries(updates).forEach(([key, value]) => {
      storageOptimizer.set(key, value);
    });
  }, []);

  const batchRemove = useCallback((keys: string[]) => {
    keys.forEach(key => storageOptimizer.remove(key));
  }, []);

  return { batchUpdate, batchRemove };
}

/**
 * Hook for storage statistics and cleanup
 */
export function useStorageMonitor() {
  const [stats, setStats] = useState(storageOptimizer.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(storageOptimizer.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const cleanup = useCallback(() => {
    storageOptimizer.cleanExpired();
    setStats(storageOptimizer.getStats());
  }, []);

  const clearPrefix = useCallback((prefix: string) => {
    storageOptimizer.clearPrefix(prefix);
    setStats(storageOptimizer.getStats());
  }, []);

  return { stats, cleanup, clearPrefix };
}