// Cross-device milestone synchronization hook
// Syncs milestone completion data between devices using the database

import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';

export function useMilestoneSync() {
  const { user } = useAuth();

  // Sync milestones from database to local storage
  const syncMilestonesFromDatabase = useCallback(async () => {
    if (!user) return;

    // Check if milestone sync is prevented (for testing)
    if (localStorage.getItem('prevent-milestone-sync') === 'true') {
      console.log('Milestone sync prevented by flag - skipping database sync');
      return;
    }

    try {
      const response = await fetch('/api/milestones', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.warn('Failed to fetch milestones from server:', response.status);
        return;
      }
      
      const databaseMilestones = await response.json() || [];
      
      // Merge database milestones with local milestones (read from the key pages actually write to)
      const existingMilestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
      const mergedMilestones = [...new Set([...existingMilestones, ...databaseMilestones])];
      
      // Update localStorage with merged milestones (maintain both keys for compatibility)
      localStorage.setItem('cadence-milestones', JSON.stringify(mergedMilestones));
      localStorage.setItem('cadence-synced-milestones', JSON.stringify(databaseMilestones));
      localStorage.setItem('cadence-completed-milestones', JSON.stringify(mergedMilestones));
      
      console.log('Synced milestones from database:', databaseMilestones);
      console.log('Merged with local milestones:', mergedMilestones);
      
      // Trigger refresh of workflow components by updating local storage timestamp
      localStorage.setItem('cadence-milestone-sync-timestamp', Date.now().toString());
      
      // Trigger storage events for widget to update (multiple keys for compatibility)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'cadence-completed-milestones',
        newValue: JSON.stringify(mergedMilestones)
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'cadence-synced-milestones',
        newValue: JSON.stringify(databaseMilestones)
      }));
      
    } catch (error) {
      console.warn('Failed to sync milestones from database:', error);
    }
  }, [user]);

  // Add milestone completion to database
  const addMilestoneCompletion = useCallback(async (milestoneKey: string, deviceType?: string, metadata?: any) => {
    if (!user) return;

    try {
      // First add to localStorage for immediate feedback (use the same key pages write to)
      const existingMilestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
      if (!existingMilestones.includes(milestoneKey)) {
        existingMilestones.push(milestoneKey);
        localStorage.setItem('cadence-completed-milestones', JSON.stringify(existingMilestones));
        localStorage.setItem('cadence-milestones', JSON.stringify(existingMilestones)); // Compatibility
        
        // Trigger immediate storage event for widget to update
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cadence-completed-milestones',
          newValue: JSON.stringify(existingMilestones)
        }));
      }

      // Then sync to database for cross-device access
      await fetch('/api/milestones', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          milestoneKey,
          deviceType: deviceType || (window.innerWidth < 768 ? 'mobile' : 'desktop'),
          metadata
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Re-sync to update all devices
      await syncMilestonesFromDatabase();
      
      console.log('Added milestone completion:', milestoneKey);
      
    } catch (error) {
      console.warn('Failed to add milestone completion:', error);
    }
  }, [user, syncMilestonesFromDatabase]);

  // Check if milestone is completed (checks both localStorage and database)
  const isMilestoneCompleted = useCallback((milestoneKey: string): boolean => {
    // Check localStorage first (immediate)
    const localMilestones = JSON.parse(localStorage.getItem('cadence-milestones') || '[]');
    const syncedMilestones = JSON.parse(localStorage.getItem('cadence-synced-milestones') || '[]');
    
    return localMilestones.includes(milestoneKey) || syncedMilestones.includes(milestoneKey);
  }, []);

  // Auto-sync on mount and when user changes
  useEffect(() => {
    if (user) {
      syncMilestonesFromDatabase();
    }
  }, [user, syncMilestonesFromDatabase]);

  return {
    syncMilestonesFromDatabase,
    addMilestoneCompletion,
    isMilestoneCompleted
  };
}