// React Hook for Workflow Tracking and Smart Recommendations

import { useState, useEffect, useCallback } from 'react';
import { WorkflowEngine, TaskResult, WorkflowRecommendation, WorkflowState } from '@/lib/workflow-engine';

export function useWorkflowTracking() {
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [activeRecommendations, setActiveRecommendations] = useState<WorkflowRecommendation[]>([]);
  const [recentCompletion, setRecentCompletion] = useState<TaskResult | null>(null);

  // Load workflow state on mount
  useEffect(() => {
    const state = WorkflowEngine.loadWorkflowState();
    if (state) {
      setWorkflowState(state);
      // Generate recommendations based on recent activity
      if (state.currentSession.tasksCompleted.length > 0) {
        const lastTask = state.currentSession.tasksCompleted[state.currentSession.tasksCompleted.length - 1];
        // Note: We'd need farm data from context here
        // For now, we'll pass empty object
        const recommendations = WorkflowEngine.generateRecommendations(lastTask, {});
        setActiveRecommendations(recommendations);
      }
    } else {
      // Initialize new workflow state
      const newState: WorkflowState = {
        currentSession: {
          startedAt: new Date(),
          tasksCompleted: []
        },
        historical: {
          lastWeekTasks: [],
          commonPatterns: [],
          preferredSequences: []
        }
      };
      setWorkflowState(newState);
      WorkflowEngine.saveWorkflowState(newState);
    }
  }, []);

  // Track task start
  const startTask = useCallback((taskId: string) => {
    WorkflowEngine.trackTaskStart(taskId);
    
    if (workflowState) {
      const updatedState: WorkflowState = {
        ...workflowState,
        currentSession: {
          ...workflowState.currentSession,
          activeTask: taskId
        }
      };
      setWorkflowState(updatedState);
      WorkflowEngine.saveWorkflowState(updatedState);
    }
  }, [workflowState]);

  // Track task completion and generate recommendations
  const completeTask = useCallback((taskId: string, userActions: string[], dataChanges: any, farmData: any = {}) => {
    const completionResult = WorkflowEngine.detectTaskCompletion(taskId, userActions, dataChanges);
    
    if (completionResult && workflowState) {
      WorkflowEngine.clearTaskTiming(taskId);
      
      // Update workflow state
      const updatedState: WorkflowState = {
        ...workflowState,
        currentSession: {
          ...workflowState.currentSession,
          tasksCompleted: [...workflowState.currentSession.tasksCompleted, completionResult],
          activeTask: undefined
        }
      };
      
      setWorkflowState(updatedState);
      WorkflowEngine.saveWorkflowState(updatedState);
      
      // Generate smart recommendations
      const recommendations = WorkflowEngine.generateRecommendations(completionResult, farmData);
      setActiveRecommendations(recommendations);
      setRecentCompletion(completionResult);
      
      // Clear recent completion after 30 seconds
      setTimeout(() => setRecentCompletion(null), 30000);
    }
  }, [workflowState]);

  // Dismiss a recommendation
  const dismissRecommendation = useCallback((taskId: string) => {
    setActiveRecommendations(prev => prev.filter(rec => rec.nextTaskId !== taskId));
  }, []);

  // Accept a recommendation and start the suggested task
  const acceptRecommendation = useCallback((recommendation: WorkflowRecommendation) => {
    // Remove this recommendation
    dismissRecommendation(recommendation.nextTaskId);
    
    // Start the recommended task with context
    startTask(recommendation.nextTaskId);
    
    // Store context data for the next task
    if (recommendation.contextData) {
      localStorage.setItem(`task_context_${recommendation.nextTaskId}`, JSON.stringify(recommendation.contextData));
    }
    
    return recommendation;
  }, [dismissRecommendation, startTask]);

  // Get context data for current task
  const getTaskContext = useCallback((taskId: string) => {
    const stored = localStorage.getItem(`task_context_${taskId}`);
    if (stored) {
      // Clear after retrieval
      localStorage.removeItem(`task_context_${taskId}`);
      return JSON.parse(stored);
    }
    return null;
  }, []);

  // Check if a task was recently completed
  const wasRecentlyCompleted = useCallback((taskId: string, withinMinutes: number = 60) => {
    if (!workflowState) return false;
    
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    return workflowState.currentSession.tasksCompleted.some(
      task => task.taskId === taskId && task.completedAt > cutoff
    );
  }, [workflowState]);

  // Get completion status for a task
  const getTaskStatus = useCallback((taskId: string) => {
    if (!workflowState) return 'not_started';
    
    if (workflowState.currentSession.activeTask === taskId) {
      return 'in_progress';
    }
    
    if (wasRecentlyCompleted(taskId, 60)) {
      return 'recently_completed';
    }
    
    if (workflowState.currentSession.tasksCompleted.some(t => t.taskId === taskId)) {
      return 'completed';
    }
    
    return 'not_started';
  }, [workflowState, wasRecentlyCompleted]);

  // Get workflow analytics
  const getWorkflowAnalytics = useCallback(() => {
    if (!workflowState) return null;
    
    const totalTasks = workflowState.currentSession.tasksCompleted.length;
    const totalTime = workflowState.currentSession.tasksCompleted.reduce(
      (sum, task) => sum + task.timeSpent, 0
    );
    const averageTime = totalTasks > 0 ? totalTime / totalTasks : 0;
    
    const taskFrequency = workflowState.currentSession.tasksCompleted.reduce((freq, task) => {
      freq[task.taskId] = (freq[task.taskId] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);
    
    return {
      totalTasks,
      totalTime,
      averageTime,
      taskFrequency,
      sessionStart: workflowState.currentSession.startedAt,
      activeTask: workflowState.currentSession.activeTask
    };
  }, [workflowState]);

  return {
    workflowState,
    activeRecommendations,
    recentCompletion,
    startTask,
    completeTask,
    dismissRecommendation,
    acceptRecommendation,
    getTaskContext,
    getTaskStatus,
    wasRecentlyCompleted,
    getWorkflowAnalytics
  };
}