/**
 * Immediate milestone validation and reset system
 * Runs on every page load to ensure milestones are consistent with current farm data
 */

import { performComprehensiveMilestoneReset, createFarmData } from './milestone-reset-system';

/**
 * Validate and reset milestones based on current farm state
 * Call this on app startup and after major data changes
 */
export async function validateAndResetMilestones(): Promise<void> {
  try {
    console.log('🔍 Starting immediate milestone validation...');

    // Fetch current farm data
    const [herdsResponse, paddocksResponse, animalsResponse, assessmentsResponse] = await Promise.allSettled([
      fetch('/api/herds').then(r => r.ok ? r.json() : []),
      fetch('/api/paddocks').then(r => r.ok ? r.json() : []),
      fetch('/api/animals').then(r => r.ok ? r.json() : []),
      fetch('/api/assessments').then(r => r.ok ? r.json() : [])
    ]);

    const herds = herdsResponse.status === 'fulfilled' ? herdsResponse.value : [];
    const paddocks = paddocksResponse.status === 'fulfilled' ? paddocksResponse.value : [];
    const animals = animalsResponse.status === 'fulfilled' ? animalsResponse.value : [];
    const assessments = assessmentsResponse.status === 'fulfilled' ? assessmentsResponse.value : [];

    const farmData = createFarmData(herds, paddocks, animals, assessments);

    console.log('🔍 Current farm state for milestone validation:', {
      herds: herds.length,
      paddocks: paddocks.length, 
      animals: animals.length,
      assessments: assessments.length
    });

    // Perform comprehensive milestone reset
    await performComprehensiveMilestoneReset(farmData);

    console.log('✅ Milestone validation complete');

  } catch (error) {
    console.warn('⚠️ Failed to validate milestones:', error);
  }
}

/**
 * Quick milestone reset for specific scenario
 */
export function forceResetHerdMilestone(): void {
  console.log('🔧 Force resetting herd milestone...');
  
  // Clear ALL milestone-related localStorage keys
  const keys = [
    'cadence-completed-milestones',
    'cadence-synced-milestones', 
    'cadence-milestones',
    'cadence-system-milestones'
  ];
  
  keys.forEach(key => {
    const existing = localStorage.getItem(key);
    if (existing) {
      console.log(`Clearing ${key}:`, JSON.parse(existing));
      const filtered = JSON.parse(existing).filter((m: string) => m !== 'first_herd_added');
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  });

  // Set a flag to prevent automatic milestone re-sync
  localStorage.setItem('prevent-milestone-sync', 'true');
  
  // Trigger storage events for all keys
  keys.forEach(key => {
    const newValue = localStorage.getItem(key);
    window.dispatchEvent(new StorageEvent('storage', {
      key,
      newValue,
      storageArea: localStorage
    }));
  });

  // Trigger custom event
  window.dispatchEvent(new CustomEvent('milestone-reset', {
    detail: { 
      resetMilestones: ['first_herd_added'],
      clearedKeys: keys
    }
  }));

  console.log('✅ All milestone keys cleared of first_herd_added');
  console.log('Sync prevention flag set - milestone will stay removed');
}