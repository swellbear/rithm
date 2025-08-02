/**
 * Enhanced Storage System for MLPlatform
 * Handles large datasets with compression and IndexedDB fallback
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import LZString from 'lz-string';
import toast from 'react-hot-toast';

// Storage configuration
const STORAGE_CONFIG = {
  localStorage: {
    maxSize: 5 * 1024 * 1024, // 5MB limit for localStorage
    compressionThreshold: 1024 * 1024 // 1MB threshold for compression
  },
  indexedDB: {
    name: 'MLPlatformDB',
    version: 1,
    stores: {
      projects: 'ml-projects',
      datasets: 'ml-datasets',
      config: 'ml-config'
    }
  }
};

// Common storage value interface
interface StorageValue {
  id: string;
  data: any;
  compressed: boolean;
  timestamp: number;
  size: number;
}

// IndexedDB Schema
interface MLPlatformDB extends DBSchema {
  'ml-projects': {
    key: string;
    value: StorageValue;
  };
  'ml-datasets': {
    key: string;
    value: StorageValue;
  };
  'ml-config': {
    key: string;
    value: StorageValue;
  };
}

// Storage utility class
export class EnhancedStorage {
  private static dbPromise: Promise<IDBPDatabase<MLPlatformDB>> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private static async getDB(): Promise<IDBPDatabase<MLPlatformDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<MLPlatformDB>(STORAGE_CONFIG.indexedDB.name, STORAGE_CONFIG.indexedDB.version, {
        upgrade(db) {
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('ml-projects')) {
            db.createObjectStore('ml-projects', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('ml-datasets')) {
            db.createObjectStore('ml-datasets', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('ml-config')) {
            db.createObjectStore('ml-config', { keyPath: 'id' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  /**
   * Calculate the size of data in bytes
   */
  private static calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Check localStorage quota availability
   */
  private static checkLocalStorageQuota(): number {
    try {
      const testKey = '__storage_test__';
      const testData = 'x'.repeat(1024); // 1KB test
      
      let used = 0;
      // Estimate current usage
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // Try to store test data to check availability
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      
      return Math.max(0, STORAGE_CONFIG.localStorage.maxSize - used);
    } catch (error) {
      return 0; // Storage is full or unavailable
    }
  }

  /**
   * Compress data using LZ-String
   */
  private static compress(data: any): { data: string; compressed: boolean; originalSize: number; compressedSize: number } {
    const jsonString = JSON.stringify(data);
    const originalSize = new Blob([jsonString]).size;
    
    if (originalSize < STORAGE_CONFIG.localStorage.compressionThreshold) {
      return { 
        data: jsonString, 
        compressed: false, 
        originalSize, 
        compressedSize: originalSize 
      };
    }
    
    try {
      const compressed = LZString.compress(jsonString);
      const compressedSize = new Blob([compressed]).size;
      
      console.log(`💾 Compression: ${originalSize} bytes → ${compressedSize} bytes (${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reduction)`);
      
      return {
        data: compressed,
        compressed: true,
        originalSize,
        compressedSize
      };
    } catch (error) {
      console.error('Compression failed:', error);
      return { 
        data: jsonString, 
        compressed: false, 
        originalSize, 
        compressedSize: originalSize 
      };
    }
  }

  /**
   * Decompress data using LZ-String
   */
  private static decompress(data: string, compressed: boolean): any {
    try {
      const jsonString = compressed ? LZString.decompress(data) : data;
      if (!jsonString) {
        throw new Error('Decompression failed - invalid compressed data');
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error('Failed to decompress stored data');
    }
  }

  /**
   * Save data with automatic storage selection
   */
  static async saveData(key: string, data: any, options: { 
    category?: 'projects' | 'datasets' | 'config';
    showWarnings?: boolean;
  } = {}): Promise<{ success: boolean; method: 'localStorage' | 'indexedDB'; size: number }> {
    const { category = 'projects', showWarnings = true } = options;
    const dataSize = this.calculateSize(data);
    const availableQuota = this.checkLocalStorageQuota();
    
    console.log(`💾 Saving data: ${dataSize} bytes, available localStorage: ${availableQuota} bytes`);
    
    // Show warning for large datasets
    if (showWarnings && dataSize > STORAGE_CONFIG.localStorage.maxSize / 2) {
      toast(`📊 Large dataset detected (${(dataSize / 1024 / 1024).toFixed(1)}MB). Using enhanced storage.`, {
        duration: 4000,
        icon: '⚡'
      });
    }
    
    // Try localStorage first for smaller data
    if (dataSize <= STORAGE_CONFIG.localStorage.maxSize && availableQuota > dataSize * 1.2) {
      try {
        const compressed = this.compress(data);
        const finalSize = compressed.compressedSize;
        
        // Double-check quota after compression
        if (finalSize <= availableQuota) {
          const storageData = {
            data: compressed.data,
            compressed: compressed.compressed,
            timestamp: Date.now(),
            originalSize: compressed.originalSize,
            compressedSize: compressed.compressedSize
          };
          
          localStorage.setItem(key, JSON.stringify(storageData));
          
          if (showWarnings && compressed.compressed) {
            toast.success(`Data compressed and saved (${((1 - compressed.compressedSize / compressed.originalSize) * 100).toFixed(1)}% smaller)`);
          }
          
          return { success: true, method: 'localStorage', size: finalSize };
        }
      } catch (error) {
        console.warn('localStorage failed, falling back to IndexedDB:', error);
      }
    }
    
    // Fall back to IndexedDB for large data
    try {
      const db = await this.getDB();
      const compressed = this.compress(data);
      
      const storageData: StorageValue = {
        id: key,
        data: compressed.data,
        compressed: compressed.compressed,
        timestamp: Date.now(),
        size: compressed.compressedSize
      };
      
      const storeName = category === 'projects' ? 'ml-projects' : 
                       category === 'datasets' ? 'ml-datasets' : 'ml-config';
      
      await db.put(storeName, storageData);
      
      if (showWarnings) {
        toast.success(`Large dataset saved to IndexedDB (${(compressed.compressedSize / 1024 / 1024).toFixed(1)}MB)`, {
          icon: '🗄️'
        });
      }
      
      return { success: true, method: 'indexedDB', size: compressed.compressedSize };
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
      if (showWarnings) {
        toast.error('Failed to save data - storage unavailable');
      }
      return { success: false, method: 'indexedDB', size: dataSize };
    }
  }

  /**
   * Load data with automatic storage detection
   */
  static async loadData(key: string, options: {
    category?: 'projects' | 'datasets' | 'config';
    showWarnings?: boolean;
  } = {}): Promise<{ success: boolean; data: any; method: 'localStorage' | 'indexedDB' | null; size?: number }> {
    const { category = 'projects', showWarnings = true } = options;
    
    // Try localStorage first
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const storageData = JSON.parse(stored);
        
        // Handle both old format (direct data) and new format (with metadata)
        if (typeof storageData === 'object' && storageData.hasOwnProperty('data')) {
          const data = this.decompress(storageData.data, storageData.compressed || false);
          console.log(`💾 Loaded from localStorage: ${key} (${storageData.compressedSize || stored.length} bytes)`);
          return { 
            success: true, 
            data, 
            method: 'localStorage', 
            size: storageData.compressedSize || stored.length 
          };
        } else {
          // Old format - direct data
          console.log(`💾 Loaded from localStorage (legacy): ${key}`);
          return { success: true, data: storageData, method: 'localStorage' };
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    
    // Try IndexedDB
    try {
      const db = await this.getDB();
      const storeName = category === 'projects' ? 'ml-projects' : 
                       category === 'datasets' ? 'ml-datasets' : 'ml-config';
      
      const stored = await db.get(storeName, key);
      
      if (stored) {
        const data = this.decompress(stored.data, stored.compressed);
        console.log(`💾 Loaded from IndexedDB: ${key} (${stored.size} bytes)`);
        
        if (showWarnings && stored.size > STORAGE_CONFIG.localStorage.maxSize / 2) {
          toast(`📊 Large dataset loaded from IndexedDB (${(stored.size / 1024 / 1024).toFixed(1)}MB)`, {
            duration: 3000,
            icon: '🗄️'
          });
        }
        
        return { success: true, data, method: 'indexedDB', size: stored.size };
      }
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
    }
    
    return { success: false, data: null, method: null };
  }

  /**
   * Delete data from both storage methods
   */
  static async deleteData(key: string, options: {
    category?: 'projects' | 'datasets' | 'config';
  } = {}): Promise<boolean> {
    const { category = 'projects' } = options;
    let success = false;
    
    // Remove from localStorage
    try {
      localStorage.removeItem(key);
      success = true;
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
    
    // Remove from IndexedDB
    try {
      const db = await this.getDB();
      const storeName = category === 'projects' ? 'ml-projects' : 
                       category === 'datasets' ? 'ml-datasets' : 'ml-config';
      
      await db.delete(storeName, key);
      success = true;
    } catch (error) {
      console.warn('Failed to remove from IndexedDB:', error);
    }
    
    return success;
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    localStorage: { used: number; available: number; total: number };
    indexedDB: { used: number; available: number };
    totalItems: { localStorage: number; indexedDB: number };
  }> {
    // localStorage stats
    let localStorageUsed = 0;
    let localStorageItems = 0;
    
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageUsed += localStorage[key].length + key.length;
          localStorageItems++;
        }
      }
    } catch (error) {
      console.warn('Failed to calculate localStorage usage:', error);
    }
    
    const localStorageAvailable = this.checkLocalStorageQuota();
    const localStorageTotal = STORAGE_CONFIG.localStorage.maxSize;
    
    // IndexedDB stats (estimate)
    let indexedDBUsed = 0;
    let indexedDBItems = 0;
    
    try {
      const db = await this.getDB();
      const stores = ['ml-projects', 'ml-datasets', 'ml-config'] as const;
      
      for (const storeName of stores) {
        const count = await db.count(storeName);
        indexedDBItems += count;
        
        // Estimate size by getting all records (expensive but accurate)
        const tx = db.transaction(storeName, 'readonly');
        const cursor = await tx.store.openCursor();
        if (cursor) {
          do {
            indexedDBUsed += cursor.value.size || 0;
          } while (await cursor.continue());
        }
      }
    } catch (error) {
      console.warn('Failed to calculate IndexedDB usage:', error);
    }
    
    // IndexedDB typically has much more space available
    const indexedDBAvailable = navigator.storage && 'estimate' in navigator.storage 
      ? (await navigator.storage.estimate()).quota || Number.MAX_SAFE_INTEGER 
      : Number.MAX_SAFE_INTEGER;
    
    return {
      localStorage: {
        used: localStorageUsed,
        available: localStorageAvailable,
        total: localStorageTotal
      },
      indexedDB: {
        used: indexedDBUsed,
        available: indexedDBAvailable - indexedDBUsed
      },
      totalItems: {
        localStorage: localStorageItems,
        indexedDB: indexedDBItems
      }
    };
  }

  /**
   * Clear all ML Platform data
   */
  static async clearAll(): Promise<boolean> {
    try {
      // Clear localStorage items with ML prefix
      const keysToRemove: string[] = [];
      for (const key in localStorage) {
        if (key.startsWith('ml') || key.includes('ML') || key.includes('project')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove localStorage key ${key}:`, error);
        }
      });
      
      // Clear IndexedDB
      const db = await this.getDB();
      await db.clear('ml-projects');
      await db.clear('ml-datasets');
      await db.clear('ml-config');
      
      toast.success('All ML Platform data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast.error('Failed to clear all data');
      return false;
    }
  }
}

// Convenience functions for backward compatibility
export const enhancedStorage = {
  save: EnhancedStorage.saveData,
  load: EnhancedStorage.loadData,
  delete: EnhancedStorage.deleteData,
  stats: EnhancedStorage.getStorageStats,
  clearAll: EnhancedStorage.clearAll
};

// Export individual functions for specific use cases
export const saveMLData = (key: string, data: any, showWarnings = true) => 
  EnhancedStorage.saveData(key, data, { category: 'datasets', showWarnings });

export const loadMLData = (key: string, showWarnings = true) => 
  EnhancedStorage.loadData(key, { category: 'datasets', showWarnings });

export const saveProject = (key: string, data: any, showWarnings = true) => 
  EnhancedStorage.saveData(key, data, { category: 'projects', showWarnings });

export const loadProject = (key: string, showWarnings = true) => 
  EnhancedStorage.loadData(key, { category: 'projects', showWarnings });