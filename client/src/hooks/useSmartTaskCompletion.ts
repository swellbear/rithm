// Smart Task Completion Detection Hook
// Tracks actual user interactions and data changes to determine real task completion

import { useCallback, useEffect } from 'react';
import { useWorkflowProgress } from './useWorkflowProgress';
import { useToast } from './use-toast';
import { useOptimizedStorage } from './useOptimizedStorage';
import { performanceTracker } from '@/lib/performance-tracker';

interface TaskCompletionCriteria {
  weather: {
    dataViewed: boolean;
    forecastChecked: boolean;
    alertsReviewed: boolean;
  };
  animals: {
    healthRecordsViewed: boolean;
    waterCalculated: boolean;
    conditionsAssessed: boolean;
  };
  water: {
    requirementsCalculated: boolean;
    systemsChecked: boolean;
    adequacyAssessed: boolean;
  };
  rotation: {
    movesPlanned: boolean;
    datesScheduled: boolean;
    capacityCalculated: boolean;
  };
}

const COMPLETION_STORAGE_KEY = 'cadence-task-completion-tracking';

export function useSmartTaskCompletion() {
  const { updateWorkflowStep } = useWorkflowProgress();
  const { toast } = useToast();

  // Load completion criteria from localStorage
  const getCompletionCriteria = useCallback((): TaskCompletionCriteria => {
    const stored = localStorage.getItem(COMPLETION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Loaded existing criteria from localStorage:', parsed);
        return parsed;
      } catch (error) {
        console.warn('Failed to parse task completion criteria:', error);
      }
    }

    // Return default empty criteria and save it
    console.log('No existing criteria found, creating default');
    const defaultCriteria = {
      weather: { dataViewed: false, forecastChecked: false, alertsReviewed: false },
      animals: { healthRecordsViewed: false, waterCalculated: false, conditionsAssessed: false },
      water: { requirementsCalculated: false, systemsChecked: false, adequacyAssessed: false },
      rotation: { movesPlanned: false, datesScheduled: false, capacityCalculated: false }
    };
    
    // Save the default criteria so it persists
    localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(defaultCriteria));
    console.log('Saved default criteria to localStorage');
    
    return defaultCriteria;
  }, []);

  // Save completion criteria to localStorage
  const saveCompletionCriteria = useCallback((criteria: TaskCompletionCriteria) => {
    console.log('Saving completion criteria:', criteria);
    localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(criteria));
    
    // Verify save worked
    const saved = localStorage.getItem(COMPLETION_STORAGE_KEY);
    console.log('Verification - saved data:', saved ? JSON.parse(saved) : null);
  }, []);

  // Check if a task meets completion criteria
  const checkTaskCompletion = useCallback((taskType: keyof TaskCompletionCriteria, criteria: TaskCompletionCriteria) => {
    const taskCriteria = criteria[taskType];
    const completionValues = Object.values(taskCriteria);
    const completedCount = completionValues.filter(Boolean).length;
    const totalCriteria = completionValues.length;
    
    // Task is complete if at least 66% of criteria are met (2 out of 3)
    return completedCount >= Math.ceil(totalCriteria * 0.66);
  }, []);

  // Mark a specific action as completed
  const markActionCompleted = useCallback((taskType: keyof TaskCompletionCriteria, action: string) => {
    console.log(`markActionCompleted called: ${taskType}.${action}`);
    
    const criteria = getCompletionCriteria();
    console.log('Current criteria before update:', criteria);
    
    if (taskType in criteria && action in criteria[taskType]) {
      (criteria[taskType] as any)[action] = true;
      console.log('Updated criteria:', criteria);
      
      saveCompletionCriteria(criteria);

      // Check if task is now complete
      if (checkTaskCompletion(taskType, criteria)) {
        const taskNames = {
          weather: 'check-weather',
          animals: 'check-animals', 
          water: 'assess-water',
          rotation: 'plan-moves'
        };

        updateWorkflowStep('morning-check', taskNames[taskType]);
        
        // Task completion now works silently without popup notifications
      }
    } else {
      console.warn(`Invalid taskType "${taskType}" or action "${action}"`);
      console.warn('Available criteria:', criteria);
    }
  }, [getCompletionCriteria, saveCompletionCriteria, checkTaskCompletion, updateWorkflowStep, toast]);

  // Weather task completion tracking
  const trackWeatherDataViewed = useCallback(() => {
    markActionCompleted('weather', 'dataViewed');
  }, [markActionCompleted]);

  const trackForecastChecked = useCallback(() => {
    markActionCompleted('weather', 'forecastChecked');
  }, [markActionCompleted]);

  const trackAlertsReviewed = useCallback(() => {
    markActionCompleted('weather', 'alertsReviewed');
  }, [markActionCompleted]);

  // Animal task completion tracking
  const trackHealthRecordsViewed = useCallback(() => {
    markActionCompleted('animals', 'healthRecordsViewed');
  }, [markActionCompleted]);

  const trackWaterCalculated = useCallback(() => {
    markActionCompleted('animals', 'waterCalculated');
  }, [markActionCompleted]);

  const trackConditionsAssessed = useCallback(() => {
    markActionCompleted('animals', 'conditionsAssessed');
  }, [markActionCompleted]);

  // Water task completion tracking
  const trackRequirementsCalculated = useCallback(() => {
    markActionCompleted('water', 'requirementsCalculated');
  }, [markActionCompleted]);

  const trackSystemsChecked = useCallback(() => {
    markActionCompleted('water', 'systemsChecked');
  }, [markActionCompleted]);

  const trackAdequacyAssessed = useCallback(() => {
    markActionCompleted('water', 'adequacyAssessed');
  }, [markActionCompleted]);

  // Rotation task completion tracking
  const trackMovesPlanned = useCallback(() => {
    markActionCompleted('rotation', 'movesPlanned');
  }, [markActionCompleted]);

  const trackDatesScheduled = useCallback(() => {
    markActionCompleted('rotation', 'datesScheduled');
  }, [markActionCompleted]);

  const trackCapacityCalculated = useCallback(() => {
    markActionCompleted('rotation', 'capacityCalculated');
  }, [markActionCompleted]);

  // Reset completion tracking (for new day)
  const resetCompletionTracking = useCallback(() => {
    localStorage.removeItem(COMPLETION_STORAGE_KEY);
  }, []);

  // Get completion progress for a task
  const getTaskProgress = useCallback((taskType: keyof TaskCompletionCriteria) => {
    const criteria = getCompletionCriteria();
    const taskCriteria = criteria[taskType];
    const completionValues = Object.values(taskCriteria);
    const completedCount = completionValues.filter(Boolean).length;
    const totalCriteria = completionValues.length;
    
    return {
      completed: completedCount,
      total: totalCriteria,
      percentage: Math.round((completedCount / totalCriteria) * 100),
      completedCriteria: completedCount,
      totalCriteria: totalCriteria,
      completionPercentage: Math.round((completedCount / totalCriteria) * 100),
      isComplete: checkTaskCompletion(taskType, criteria)
    };
  }, [getCompletionCriteria, checkTaskCompletion]);

  // Reset tracking on new day (with debugging)
  useEffect(() => {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('cadence-task-completion-reset-date');
    
    console.log('useSmartTaskCompletion: Checking reset date');
    console.log('Today:', today);
    console.log('Last reset:', lastReset);
    
    if (lastReset !== today) {
      console.log('Resetting completion tracking - new day detected');
      resetCompletionTracking();
      localStorage.setItem('cadence-task-completion-reset-date', today);
    } else {
      console.log('Same day - keeping existing tracking data');
    }
  }, [resetCompletionTracking]);

  return {
    // Weather tracking
    trackWeatherDataViewed,
    trackForecastChecked, 
    trackAlertsReviewed,
    
    // Animal tracking
    trackHealthRecordsViewed,
    trackWaterCalculated,
    trackConditionsAssessed,
    
    // Water tracking
    trackWaterRequirementsCalculated: trackRequirementsCalculated,
    trackSystemsChecked,
    trackAdequacyAssessed,
    
    // Rotation tracking
    trackMovesPlanned,
    trackDatesScheduled,
    trackCapacityCalculated,
    
    // Utilities
    getTaskProgress,
    getCompletionCriteria, // Expose criteria access function
    resetCompletionTracking,
    markActionCompleted,
    clearAllProgress: resetCompletionTracking // Alias for test page compatibility
  };
}