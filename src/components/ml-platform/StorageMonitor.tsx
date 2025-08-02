/**
 * Storage Monitor Component
 * Shows storage usage and provides management tools
 */

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Database, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { EnhancedStorage } from '@/lib/enhanced-storage';
import toast from 'react-hot-toast';
import { storageLogger } from '@/lib/logger';

interface StorageStats {
  localStorage: { used: number; available: number; total: number };
  indexedDB: { used: number; available: number };
  totalItems: { localStorage: number; indexedDB: number };
}

interface StorageMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatPercentage = (used: number, total: number): number => {
  return total > 0 ? Math.round((used / total) * 100) : 0;
};

export default function StorageMonitor({ isOpen, onClose }: StorageMonitorProps) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStorageStats = async () => {
    setRefreshing(true);
    try {
      const storageStats = await EnhancedStorage.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      storageLogger.error('Failed to load storage stats:', error);
      toast.error('Failed to load storage statistics');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStorageStats();
    }
  }, [isOpen]);

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      'This will permanently delete all ML Platform data including projects, datasets, and settings. This action cannot be undone. Continue?'
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const success = await EnhancedStorage.clearAll();
      if (success) {
        await loadStorageStats();
        toast.success('All data cleared successfully');
        // Give user time to see the message before closing
        setTimeout(() => {
          onClose();
          // Reload page to reset application state
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      storageLogger.error('Failed to clear data:', error);
      toast.error('Failed to clear all data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HardDrive className="h-6 w-6 text-blue-500" />
                Storage Monitor
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Monitor and manage your ML Platform data storage
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadStorageStats}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          {stats ? (
            <div className="space-y-6">
              {/* LocalStorage Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-green-500" />
                      <CardTitle className="text-lg">LocalStorage</CardTitle>
                    </div>
                    <Badge variant={stats.localStorage.used / stats.localStorage.total > 0.8 ? "destructive" : "secondary"}>
                      {formatPercentage(stats.localStorage.used, stats.localStorage.total)}% Full
                    </Badge>
                  </div>
                  <CardDescription>
                    Browser's local storage - ideal for smaller datasets and quick access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Used: {formatBytes(stats.localStorage.used)}</span>
                        <span>Available: {formatBytes(stats.localStorage.available)}</span>
                      </div>
                      <Progress 
                        value={formatPercentage(stats.localStorage.used, stats.localStorage.total)} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Total: {formatBytes(stats.localStorage.total)} | Items: {stats.totalItems.localStorage}
                      </div>
                    </div>
                    
                    {stats.localStorage.used / stats.localStorage.total > 0.8 && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                          LocalStorage is nearly full. Large datasets will automatically use IndexedDB.
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* IndexedDB Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-lg">IndexedDB</CardTitle>
                    </div>
                    <Badge variant="secondary">
                      {stats.indexedDB.used > 0 ? formatBytes(stats.indexedDB.used) : 'Empty'}
                    </Badge>
                  </div>
                  <CardDescription>
                    Browser's database storage - handles large datasets with compression
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Used: {formatBytes(stats.indexedDB.used)}</span>
                        <span>Available: {stats.indexedDB.available === Number.MAX_SAFE_INTEGER ? 'Unlimited' : formatBytes(stats.indexedDB.available)}</span>
                      </div>
                      {stats.indexedDB.available !== Number.MAX_SAFE_INTEGER ? (
                        <Progress 
                          value={formatPercentage(stats.indexedDB.used, stats.indexedDB.used + stats.indexedDB.available)} 
                          className="h-2"
                        />
                      ) : (
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div className="h-2 bg-blue-500 rounded-full" style={{width: '5%'}} />
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Items: {stats.totalItems.indexedDB}
                        {stats.indexedDB.used > 0 && (
                          <span className="ml-2">• Compression active for large datasets</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Storage Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Storage Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Automatic Compression:</span> Data larger than 1MB is automatically compressed using LZ-String
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Smart Storage:</span> Small data uses LocalStorage, large datasets use IndexedDB
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Data Persistence:</span> Your projects and data are saved across browser sessions
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clear Data Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Trash2 className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Permanently remove all ML Platform data from this browser
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={handleClearAll}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Clear All Data
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    This will delete all projects, datasets, and settings. This action cannot be undone.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Loading storage statistics...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}