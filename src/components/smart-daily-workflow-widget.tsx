// Smart Daily Workflow Widget - Phase-Aware Task Management
// This implements the complete phase progression system with intelligent task generation

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, X, Minimize2, Maximize2, ArrowRight, Trophy, Target, RotateCcw } from 'lucide-react';
import { useSmartTaskCompletion } from '@/hooks/useSmartTaskCompletion';
import { useMilestoneSync } from '@/hooks/useMilestoneSync';
import { useAuth } from '@/contexts/auth-context';
import { 
  PhaseProgressionSystem, 
  UserPhase, 
  DailyTask 
} from '@/lib/phase-progression-system';
import { 
  DailyTaskGenerator, 
  TaskGenerationContext 
} from '@/lib/daily-task-generator';

export function SmartDailyWorkflowWidget() {
  const [location, navigate] = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const { getCompletionCriteria } = useSmartTaskCompletion();
  const { syncMilestonesFromDatabase } = useMilestoneSync();

  // Get farm data for context
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: animals = [] } = useQuery<any[]>({ queryKey: ["/api/animals"] });
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  // Get dismissal and minimized state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('cadence-dailyWorkflow-dismissed');
    const minimized = localStorage.getItem('cadence-dailyWorkflow-minimized');
    console.log('Widget state initialization:', { dismissed, minimized });
    setIsDismissed(dismissed === 'true');
    setIsMinimized(minimized === 'true');
  }, []);

  // Listen for milestone completion changes and settings toggle
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cadence-completed-milestones' || 
          e.key === 'cadence-completion-criteria' ||
          e.key?.startsWith('cadence-milestone-')) {
        console.log('Milestone completion detected, refreshing tasks...', e.key);
        setRefreshTrigger(prev => prev + 1);
      }
      // Listen for dismissal state changes from settings
      if (e.key === 'cadence-dailyWorkflow-dismissed') {
        const dismissed = localStorage.getItem('cadence-dailyWorkflow-dismissed');
        console.log('Widget dismissal state changed:', dismissed);
        setIsDismissed(dismissed === 'true');
      }
    };
    
    const handleMilestoneEvent = (e: CustomEvent) => {
      console.log('Custom milestone event detected:', e.detail);
      setRefreshTrigger(prev => prev + 1);
    };

    const handleSettingsToggle = () => {
      const dismissed = localStorage.getItem('cadence-dailyWorkflow-dismissed');
      console.log('Settings toggle detected, updating widget state:', dismissed);
      setIsDismissed(dismissed === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('milestone-completed', handleMilestoneEvent as EventListener);
    window.addEventListener('daily-workflow-widget-toggle', handleSettingsToggle);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('milestone-completed', handleMilestoneEvent as EventListener);
      window.removeEventListener('daily-workflow-widget-toggle', handleSettingsToggle);
    };
  }, []);

  // Extract user tier for separate reference
  const getUserTier = (): 'basic' | 'small_business' | 'enterprise' => {
    if (!user?.subscriptionTier) return 'basic';
    
    // Map subscription tiers to workflow tiers
    switch (user.subscriptionTier) {
      case 'free':
        return 'basic';
      case 'small_farm':
        return 'small_business';
      case 'professional':
        return 'small_business'; // Professional tier maps to small business workflow (more practical for individual farmers)
      case 'enterprise':
        return 'enterprise';
      default:
        return 'basic';
    }
  };
  
  const userTier = getUserTier();

  // Generate smart context and tasks
  const taskContext: TaskGenerationContext = useMemo(() => {
    const completionCriteria = getCompletionCriteria();
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();
    
    return {
      userTier,
      currentPhase: {} as UserPhase, // Will be set below
      farmData: {
        hasAnimals: animals.length > 0 || herds.length > 0,
        hasHerds: herds.length > 0,
        hasPaddocks: paddocks.length > 0,
        hasAssessments: assessments.length > 0,
        animalCount: animals.length,
        herdCount: herds.length,
        paddockCount: paddocks.length,
        assessmentCount: assessments.length
      },
      timeOfDay: currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening',
      season: currentMonth < 3 || currentMonth === 11 ? 'winter' : 
              currentMonth < 6 ? 'spring' : 
              currentMonth < 9 ? 'summer' : 'fall',
      completedMilestones: (() => {
        const systemMilestones = DailyTaskGenerator.getMilestoneCompletionStatus(
          { hasAnimals: animals.length > 0 || herds.length > 0, hasHerds: herds.length > 0, hasPaddocks: paddocks.length > 0, hasAssessments: assessments.length > 0 },
          completionCriteria,
          user
        );
        const localMilestonesRaw = localStorage.getItem('cadence-completed-milestones');
        console.log('Raw localStorage value:', localMilestonesRaw);
        const localMilestones = JSON.parse(localMilestonesRaw || '[]');
        const merged = [...systemMilestones, ...localMilestones].filter((milestone, index, array) => array.indexOf(milestone) === index);
        
        console.log('Milestone Debug - System:', systemMilestones);
        console.log('Milestone Debug - Local:', localMilestones);
        console.log('Milestone Debug - Merged:', merged);
        console.log('Looking for supplement_calculator_used in merged:', merged.includes('supplement_calculator_used'));
        
        return merged;
      })(),
      completionCriteria
    };
  }, [user, animals, herds, paddocks, assessments, getCompletionCriteria, refreshTrigger]);

  // Detect current user phase
  const currentPhase = useMemo(() => {
    const userTier = taskContext.userTier;
    const completedMilestones = taskContext.completedMilestones;
    
    return PhaseProgressionSystem.detectCurrentPhase(userTier, completedMilestones);
  }, [taskContext.userTier, taskContext.completedMilestones]);

  // Update context with detected phase
  taskContext.currentPhase = currentPhase;

  // Generate daily tasks
  const dailyTasks = useMemo(() => {
    const tasks = DailyTaskGenerator.generateDailyTasks(taskContext);
    console.log('Smart Daily Workflow Widget - Debug Info:', {
      currentPhase: currentPhase.phaseName,
      phaseNumber: currentPhase.phase,
      userTier: userTier,
      farmData: taskContext.farmData,
      completedMilestones: taskContext.completedMilestones,
      generatedTasks: tasks,
      taskCount: tasks.length
    });
    return tasks;
  }, [taskContext, currentPhase, userTier]);

  // Calculate phase completion
  const phaseCompletion = PhaseProgressionSystem.getPhaseCompletionPercentage(currentPhase);
  const isReadyForNextPhase = PhaseProgressionSystem.isReadyForNextPhase(currentPhase);
  const nextPhase = PhaseProgressionSystem.getNextPhase(currentPhase);

  // Task completion statistics
  const completedTasksCount = dailyTasks.filter(task => task.completed).length;
  const totalTasksCount = dailyTasks.length;
  const dailyProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Handle task navigation
  const handleTaskClick = (task: DailyTask) => {
    console.log(`Smart workflow navigation: ${task.title} at ${task.path}`);
    
    // Auto-minimize widget when navigating to tasks to get out of the way
    setIsMinimized(true);
    localStorage.setItem('cadence-dailyWorkflow-minimized', 'true');
    
    navigate(task.path);
  };

  // Handle dismissal
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('cadence-dailyWorkflow-dismissed', 'true');
    
    // Auto-restore after 24 hours
    setTimeout(() => {
      localStorage.removeItem('cadence-dailyWorkflow-dismissed');
    }, 24 * 60 * 60 * 1000);
  };

  // Handle restore
  const handleRestore = () => {
    setIsDismissed(false);
    localStorage.removeItem('cadence-dailyWorkflow-dismissed');
  };

  // Debug: Handle reset (for testing)
  const handleReset = () => {
    // Clear widget state
    localStorage.removeItem('cadence-dailyWorkflow-dismissed');
    localStorage.removeItem('cadence-dailyWorkflow-minimized');
    
    // Clear milestone tracking
    localStorage.removeItem('cadence-completedMilestones');
    localStorage.removeItem('cadence-userPhase');
    
    // Clear task completion tracking
    localStorage.removeItem('cadence-taskCompletions');
    
    setIsDismissed(false);
    setIsMinimized(false);
    
    console.log('Smart Daily Workflow Widget - Reset completed');
  };

  // Don't render if dismissed
  if (isDismissed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        className="fixed bottom-4 right-4 z-50 shadow-lg bg-white border-green-200 hover:bg-green-50"
      >
        Show Daily Tasks
      </Button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg border-green-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">{currentPhase.phaseName}</span>
              <Badge variant="secondary" className="text-xs">
                {completedTasksCount}/{totalTasksCount}
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsMinimized(false);
                  localStorage.removeItem('cadence-dailyWorkflow-minimized');
                }}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-lg border-green-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-base">Daily Workflow</h3>
              <p className="text-xs text-gray-600">{currentPhase.phaseName}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsMinimized(true);
                localStorage.setItem('cadence-dailyWorkflow-minimized', 'true');
              }}
              className="h-6 w-6 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="h-6 w-6 p-0"
              title="Reset Widget (Debug)"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Phase Progress</span>
            <span className="font-medium">{phaseCompletion}%</span>
          </div>
          <Progress value={phaseCompletion} className="h-2" />
          {isReadyForNextPhase && nextPhase && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Trophy className="h-3 w-3" />
              <span>Ready for {nextPhase.phaseName}!</span>
            </div>
          )}
        </div>

        {/* Daily Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Today's Tasks</span>
            <span className="font-medium">{completedTasksCount}/{totalTasksCount}</span>
          </div>
          <Progress value={dailyProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {dailyTasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>All tasks completed!</p>
              <p className="text-xs">Great work on your farm today.</p>
            </div>
          ) : (
            dailyTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all duration-200
                  ${task.completed 
                    ? 'bg-green-50 border-green-200 opacity-75' 
                    : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <task.icon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium truncate ${task.completed ? 'text-green-700' : 'text-gray-900'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge 
                          variant={task.type === 'prerequisite' ? 'destructive' : 
                                  task.type === 'time-sensitive' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.type === 'prerequisite' ? 'Required' :
                           task.type === 'time-sensitive' ? 'Daily' :
                           task.type === 'learning' ? 'Learn' : 'Optimize'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className={`text-xs mb-1 ${task.completed ? 'text-green-600' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {task.estimatedTime}
                      </span>
                      {!task.completed && (
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Phase description */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600">{currentPhase.description}</p>
          {currentPhase.estimatedDuration && (
            <p className="text-xs text-gray-500 mt-1">
              Estimated duration: {currentPhase.estimatedDuration}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SmartDailyWorkflowWidget;