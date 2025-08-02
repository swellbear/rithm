import { useCallback } from 'react';

export interface WorkflowStep {
  id: string;
  name: string;
  completed: boolean;
  timestamp?: Date;
}

export interface WorkflowData {
  workflowId: string;
  name: string;
  steps: WorkflowStep[];
  startTime: Date;
  estimatedTime: number;
  outcomes: string[];
}

export function useWorkflowProgress() {
  const startWorkflow = useCallback((workflow: WorkflowData) => {
    const event = new CustomEvent('workflow-progress', {
      detail: { type: 'start', data: workflow }
    });
    window.dispatchEvent(event);
  }, []);

  const updateWorkflowStep = useCallback((workflowId: string, stepId: string) => {
    const savedProgress = localStorage.getItem('cadence-workflow-progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      if (progress.active && progress.active.workflowId === workflowId) {
        const updatedSteps = progress.active.steps.map((step: WorkflowStep) =>
          step.id === stepId ? { ...step, completed: true, timestamp: new Date() } : step
        );
        
        const event = new CustomEvent('workflow-progress', {
          detail: { 
            type: 'update', 
            data: { ...progress.active, steps: updatedSteps }
          }
        });
        window.dispatchEvent(event);
      }
    }
  }, []);

  const completeWorkflow = useCallback((workflowId: string) => {
    const savedProgress = localStorage.getItem('cadence-workflow-progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      if (progress.active && progress.active.workflowId === workflowId) {
        const event = new CustomEvent('workflow-progress', {
          detail: { type: 'complete', data: progress.active }
        });
        window.dispatchEvent(event);
      }
    }
  }, []);

  return {
    startWorkflow,
    updateWorkflowStep,
    completeWorkflow
  };
}

// Predefined workflows
export const WORKFLOW_TEMPLATES = {
  morningCheck: {
    workflowId: 'morning-check',
    name: 'Morning Farm Check',
    estimatedTime: 30,
    outcomes: ['Identify health issues early', 'Plan daily rotations'],
    steps: [
      { id: 'check-weather', name: 'Check weather conditions', completed: false },
      { id: 'check-animals', name: 'Inspect livestock health', completed: false },
      { id: 'assess-water', name: 'Verify water systems', completed: false },
      { id: 'plan-moves', name: 'Plan today\'s rotations', completed: false }
    ]
  },
  pastureAssessment: {
    workflowId: 'pasture-assessment',
    name: 'Complete Pasture Assessment',
    estimatedTime: 45,
    outcomes: ['Accurate carrying capacity', 'Optimal rotation timing'],
    steps: [
      { id: 'select-paddock', name: 'Select paddock to assess', completed: false },
      { id: 'walk-transect', name: 'Walk transect lines', completed: false },
      { id: 'measure-height', name: 'Measure grass height', completed: false },
      { id: 'identify-species', name: 'Identify plant species', completed: false },
      { id: 'calculate-dm', name: 'Calculate dry matter', completed: false },
      { id: 'generate-report', name: 'Generate recommendations', completed: false }
    ]
  },
  rotationPlanning: {
    workflowId: 'enhanced-grazing-calendar',
    name: 'Weekly Rotation Planning',
    estimatedTime: 20,
    outcomes: ['Optimized grazing schedule', 'Prevent overgrazing'],
    steps: [
      { id: 'review-current', name: 'Review current paddock status', completed: false },
      { id: 'check-recovery', name: 'Check pasture recovery times', completed: false },
      { id: 'analyze-weather', name: 'Analyze weather forecast', completed: false },
      { id: 'plan-moves', name: 'Plan livestock moves', completed: false },
      { id: 'set-alerts', name: 'Set movement reminders', completed: false }
    ]
  }
};