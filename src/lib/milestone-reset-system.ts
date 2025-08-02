/**
 * Comprehensive Milestone Reset System
 * Automatically resets milestones when their dependency data is removed
 */

// Define what data each milestone depends on
export const MILESTONE_DEPENDENCIES = {
  // Farm Setup Dependencies
  'first_herd_added': {
    dataType: 'combined',
    condition: (farmData: any) => farmData.herds.length > 0 || farmData.animals.length > 0,
    description: 'Requires at least one herd OR individual animals to exist'
  },
  'first_paddock_created': {
    dataType: 'paddocks', 
    condition: (data: any[]) => data.length > 0,
    description: 'Requires at least one paddock to exist'
  },
  'animal_count_verified': {
    dataType: 'animals',
    condition: (data: any[]) => data.length > 0,
    description: 'Requires at least one animal to exist'
  },
  
  // Assessment Dependencies
  'first_assessment_completed': {
    dataType: 'assessments',
    condition: (data: any[]) => data.length > 0,
    description: 'Requires at least one completed assessment'
  },
  'pasture_assessment_completed': {
    dataType: 'assessments',
    condition: (data: any[]) => data.length > 0,
    description: 'Requires at least one pasture assessment'
  },

  // Performance Dependencies  
  'weight_tracking_started': {
    dataType: 'animals',
    condition: (data: any[]) => data.some((animal: any) => animal.weight && animal.weight > 0),
    description: 'Requires at least one animal with recorded weight'
  },
  'health_records_started': {
    dataType: 'animals',
    condition: (data: any[]) => data.some((animal: any) => 
      animal.lastVaccination || animal.lastHealthCheck || animal.healthStatus !== 'healthy'
    ),
    description: 'Requires at least one animal with health records'
  },

  // Planning Dependencies
  'first_rotation_planned': {
    dataType: 'combined',
    condition: (farmData: any) => farmData.paddocks.length >= 2 && (farmData.herds.length > 0 || farmData.animals.length > 0),
    description: 'Requires at least two paddocks AND livestock for rotation planning'
  },
  'grazing_calendar_created': {
    dataType: 'paddocks',
    condition: (data: any[]) => data.length >= 2,
    description: 'Requires multiple paddocks for calendar planning'
  },

  // Advanced Features
  'supplement_calculator_used': {
    dataType: 'combined',
    condition: (farmData: any) => farmData.hasAnimals && farmData.hasAssessments,
    description: 'Requires both animals and pasture assessments for nutrition calculations'
  },
  'performance_analytics_accessed': {
    dataType: 'animals',
    condition: (data: any[]) => data.length >= 5,
    description: 'Requires multiple animals for meaningful performance analytics'
  }
} as const;

export type FarmData = {
  herds: any[];
  paddocks: any[];
  animals: any[];
  assessments: any[];
  hasHerds: boolean;
  hasPaddocks: boolean;
  hasAnimals: boolean;
  hasAssessments: boolean;
};

/**
 * Check which milestones should be reset based on current farm data
 */
export function checkMilestonesToReset(
  farmData: FarmData, 
  completedMilestones: string[]
): string[] {
  const milestonesToReset: string[] = [];

  console.log('Checking milestones for reset:', {
    completedMilestones,
    farmDataSummary: {
      herdsCount: farmData.herds.length,
      paddocksCount: farmData.paddocks.length,
      animalsCount: farmData.animals.length,
      assessmentsCount: farmData.assessments.length
    }
  });

  for (const milestoneId of completedMilestones) {
    const dependency = MILESTONE_DEPENDENCIES[milestoneId as keyof typeof MILESTONE_DEPENDENCIES];
    
    if (dependency) {
      let shouldReset = false;

      switch (dependency.dataType) {
        case 'herds':
          shouldReset = !dependency.condition(farmData.herds);
          console.log(`Checking ${milestoneId} (herds): condition=${dependency.condition(farmData.herds)}, shouldReset=${shouldReset}`);
          break;
        case 'paddocks':
          shouldReset = !dependency.condition(farmData.paddocks);
          console.log(`Checking ${milestoneId} (paddocks): condition=${dependency.condition(farmData.paddocks)}, shouldReset=${shouldReset}`);
          break;
        case 'animals':
          shouldReset = !dependency.condition(farmData.animals);
          console.log(`Checking ${milestoneId} (animals): condition=${dependency.condition(farmData.animals)}, shouldReset=${shouldReset}`);
          break;
        case 'assessments':
          shouldReset = !dependency.condition(farmData.assessments);
          console.log(`Checking ${milestoneId} (assessments): condition=${dependency.condition(farmData.assessments)}, shouldReset=${shouldReset}`);
          break;
        case 'combined':
          shouldReset = !dependency.condition(farmData);
          console.log(`Checking ${milestoneId} (combined): condition=${dependency.condition(farmData)}, shouldReset=${shouldReset}`);
          break;
      }

      if (shouldReset) {
        milestonesToReset.push(milestoneId);
        console.log(`✓ Milestone "${milestoneId}" WILL BE RESET: ${dependency.description}`);
      } else {
        console.log(`✗ Milestone "${milestoneId}" will NOT be reset`);
      }
    } else {
      console.log(`No dependency rule found for milestone: ${milestoneId}`);
    }
  }

  return milestonesToReset;
}

/**
 * Reset milestones in localStorage and trigger storage events
 */
export function resetMilestonesInLocalStorage(milestonesToReset: string[]): void {
  if (milestonesToReset.length === 0) return;

  const milestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
  const updatedMilestones = milestones.filter((m: string) => !milestonesToReset.includes(m));
  
  localStorage.setItem('cadence-completed-milestones', JSON.stringify(updatedMilestones));

  // Trigger storage event for cross-component updates
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'cadence-completed-milestones',
    newValue: JSON.stringify(updatedMilestones),
    storageArea: localStorage
  }));

  // Also trigger a custom event for workflow widget updates
  window.dispatchEvent(new CustomEvent('milestone-reset', {
    detail: { 
      resetMilestones: milestonesToReset,
      updatedMilestones 
    }
  }));

  console.log(`✅ Reset milestones in localStorage:`, milestonesToReset);
  console.log(`✅ Updated milestones array:`, updatedMilestones);
}

/**
 * Comprehensive milestone reset - call this after any data deletion
 */
export async function performComprehensiveMilestoneReset(farmData: FarmData): Promise<void> {
  const completedMilestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
  
  console.log('Starting comprehensive milestone reset:', {
    farmData,
    completedMilestones
  });
  
  const milestonesToReset = checkMilestonesToReset(farmData, completedMilestones);
  
  console.log('Milestones to reset:', milestonesToReset);
  
  if (milestonesToReset.length > 0) {
    // Reset in localStorage immediately for UI responsiveness
    resetMilestonesInLocalStorage(milestonesToReset);
    
    // Also reset in database for persistence (if API is available)
    try {
      for (const milestoneId of milestonesToReset) {
        await fetch('/api/milestones/reset', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestoneId })
        });
      }
      console.log('Reset milestones in database:', milestonesToReset);
    } catch (error) {
      console.warn('Failed to reset milestones in database:', error);
    }
  } else {
    console.log('No milestones need to be reset');
  }
}

/**
 * Create farm data object from various data sources
 */
export function createFarmData(
  herds: any[] = [], 
  paddocks: any[] = [], 
  animals: any[] = [], 
  assessments: any[] = []
): FarmData {
  return {
    herds,
    paddocks,
    animals,
    assessments,
    hasHerds: herds.length > 0,
    hasPaddocks: paddocks.length > 0,
    hasAnimals: animals.length > 0,
    hasAssessments: assessments.length > 0
  };
}