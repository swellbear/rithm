/**
 * Storage Optimizer - Intelligent localStorage management with caching and performance optimization
 */

interface CacheEntry {
  value: any;
  timestamp: number;
  ttl?: number;
  compressed?: boolean;
}

interface StorageStats {
  cacheSize: number;
  queueSize: number;
  localStorageUsage: number;
  cacheHits: number;
  cacheMisses: number;
}

class StorageOptimizer {
  private cache = new Map<string, CacheEntry>();
  private writeQueue = new Map<string, any>();
  private stats: StorageStats = {
    cacheSize: 0,
    queueSize: 0,
    localStorageUsage: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 500; // 500ms batch delay
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadFromLocalStorage();
    this.startBatchProcessor();
  }

  /**
   * Get value from cache or localStorage
   */
  get<T>(key: string, defaultValue?: T): T {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      this.stats.cacheHits++;
      return cached.value;
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        
        // Update cache
        this.cache.set(key, {
          value: parsed,
          timestamp: Date.now(),
          ttl: this.DEFAULT_TTL
        });
        
        this.stats.cacheMisses++;
        return parsed;
      }
    } catch (error) {
      console.warn(`Failed to parse stored value for key ${key}:`, error);
    }

    return defaultValue as T;
  }

  /**
   * Set value with batching and caching
   */
  set(key: string, value: any, ttl?: number): void {
    // Update cache immediately
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });

    // Queue for batch write
    this.writeQueue.set(key, value);
    this.updateStats();
    
    // Schedule batch write
    this.scheduleBatchWrite();
  }

  /**
   * Remove value from cache and localStorage
   */
  remove(key: string): void {
    this.cache.delete(key);
    this.writeQueue.delete(key);
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove key ${key} from localStorage:`, error);
    }
    
    this.updateStats();
  }

  /**
   * Clear all data with optional prefix filter
   */
  clearPrefix(prefix: string): void {
    // Clear from cache
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }

    // Clear from writeQueue
    for (const key of this.writeQueue.keys()) {
      if (key.startsWith(prefix)) {
        this.writeQueue.delete(key);
      }
    }

    // Clear from localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage prefix:', error);
    }

    this.updateStats();
  }

  /**
   * Clean expired cache entries
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
    this.updateStats();
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Compress large values using simple string compression
   */
  private compress(value: string): string {
    // Simple compression for demonstration
    // In production, consider using libraries like pako for better compression
    return value.replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Load initial data from localStorage into cache
   */
  private loadFromLocalStorage(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              this.cache.set(key, {
                value: parsed,
                timestamp: Date.now(),
                ttl: this.DEFAULT_TTL
              });
            } catch (error) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    this.updateStats();
  }

  /**
   * Schedule batch write to localStorage
   */
  private scheduleBatchWrite(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Process queued writes in batch
   */
  private processBatch(): void {
    if (this.writeQueue.size === 0) return;

    try {
      for (const [key, value] of this.writeQueue.entries()) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      this.writeQueue.clear();
      this.updateStats();
    } catch (error) {
      console.warn('Batch write failed:', error);
      
      // Handle quota exceeded by cleaning up old data
      if (error instanceof DOMException && error.code === 22) {
        this.handleQuotaExceeded();
      }
    }
  }

  /**
   * Handle localStorage quota exceeded
   */
  private handleQuotaExceeded(): void {
    console.warn('localStorage quota exceeded, cleaning up...');
    
    // Remove oldest cache entries
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toRemove = entries.slice(0, Math.floor(entries.length * 0.3));
    for (const [key] of toRemove) {
      this.remove(key);
    }

    // Retry batch write
    setTimeout(() => this.processBatch(), 100);
  }

  /**
   * Start periodic batch processor
   */
  private startBatchProcessor(): void {
    setInterval(() => {
      this.processBatch();
      this.cleanExpired();
    }, 10000); // Every 10 seconds
  }

  /**
   * Update storage statistics
   */
  private updateStats(): void {
    this.stats.cacheSize = this.cache.size;
    this.stats.queueSize = this.writeQueue.size;
    
    // Calculate localStorage usage
    let totalSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    this.stats.localStorageUsage = totalSize;
  }
}

export const storageOptimizer = new StorageOptimizer();