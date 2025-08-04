/**
 * Milestone event listener for workflow widget
 * Ensures workflow widget updates when milestones are reset
 */

import { useEffect } from 'react';

export function useMilestoneResetListener(onMilestoneReset: () => void) {
  useEffect(() => {
    // Listen for storage events (localStorage changes)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cadence-completed-milestones') {
        console.log('🔄 Storage event detected - milestones changed');
        onMilestoneReset();
      }
    };

    // Listen for custom milestone reset events
    const handleMilestoneReset = (event: CustomEvent) => {
      console.log('🔄 Custom milestone reset event detected:', event.detail);
      onMilestoneReset();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('milestone-reset', handleMilestoneReset as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('milestone-reset', handleMilestoneReset as EventListener);
    };
  }, [onMilestoneReset]);
}

/**
 * Force refresh milestone state
 */
export function forceMilestoneRefresh() {
  // Trigger a storage event to force all components to refresh
  const milestones = localStorage.getItem('cadence-completed-milestones') || '[]';
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'cadence-completed-milestones',
    newValue: milestones,
    storageArea: localStorage
  }));
  
  // Also trigger custom event
  window.dispatchEvent(new CustomEvent('milestone-reset', {
    detail: { type: 'force-refresh' }
  }));
}