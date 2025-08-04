import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkflowStep {
  id: string;
  name: string;
  completed: boolean;
  timestamp?: Date;
}

interface WorkflowProgress {
  workflowId: string;
  name: string;
  steps: WorkflowStep[];
  startTime: Date;
  estimatedTime: number; // minutes
  outcomes: string[];
}

export function WorkflowProgressIndicator() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowProgress | null>(null);
  const [recentWorkflows, setRecentWorkflows] = useState<WorkflowProgress[]>([]);

  useEffect(() => {
    // Load workflow progress from localStorage
    const savedProgress = localStorage.getItem('cadence-workflow-progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      if (progress.active) {
        setActiveWorkflow(progress.active);
      }
      if (progress.recent) {
        setRecentWorkflows(progress.recent);
      }
    }
  }, []);

  useEffect(() => {
    // Save current state to localStorage whenever it changes
    const progress = {
      active: activeWorkflow,
      recent: recentWorkflows
    };
    localStorage.setItem('cadence-workflow-progress', JSON.stringify(progress));
  }, [activeWorkflow, recentWorkflows]);

  useEffect(() => {

    // Subscribe to workflow events
    const handleWorkflowEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      if (type === 'start') {
        setActiveWorkflow(data);
        setRecentWorkflows(prev => prev);
      } else if (type === 'update') {
        setActiveWorkflow(prev => prev ? { ...prev, steps: data.steps } : null);
      } else if (type === 'complete') {
        setRecentWorkflows(prev => [data, ...prev].slice(0, 3));
        setActiveWorkflow(null);
      }
    };

    window.addEventListener('workflow-progress' as any, handleWorkflowEvent);
    return () => window.removeEventListener('workflow-progress' as any, handleWorkflowEvent);
  }, []);

  if (!activeWorkflow && recentWorkflows.length === 0) {
    return null;
  }

  const calculateProgress = (workflow: WorkflowProgress) => {
    const completed = workflow.steps.filter(s => s.completed).length;
    return (completed / workflow.steps.length) * 100;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-2 sm:right-4 z-40 max-w-[calc(100vw-1rem)] sm:max-w-sm">
      {activeWorkflow && (
        <Card className="p-3 sm:p-4 shadow-lg mb-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-xs sm:text-sm truncate mr-2">{activeWorkflow.name}</h4>
            <div className="flex items-center text-xs text-gray-500 flex-shrink-0">
              <Clock className="w-3 h-3 mr-1" />
              <span className="hidden xs:inline">{formatTime(activeWorkflow.estimatedTime)}</span>
              <span className="xs:hidden">{formatTime(activeWorkflow.estimatedTime).replace(' min', 'm')}</span>
            </div>
          </div>
          
          <Progress value={calculateProgress(activeWorkflow)} className="mb-3" />
          
          <div className="space-y-1">
            {activeWorkflow.steps.map((step) => (
              <div key={step.id} className="flex items-center space-x-2 text-xs">
                {step.completed ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <Circle className="w-3 h-3 text-gray-300" />
                )}
                <span className={step.completed ? 'text-gray-600 line-through' : ''}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Expected: {activeWorkflow.outcomes[0]}
            </div>
          </div>
        </Card>
      )}

      {recentWorkflows.length > 0 && !activeWorkflow && (
        <Card className="p-3 shadow-lg">
          <h4 className="font-semibold text-sm mb-2">Recent Workflows</h4>
          <div className="space-y-2">
            {recentWorkflows.map((workflow, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{workflow.name}</span>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              </div>
            ))}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2 text-xs"
            onClick={() => setRecentWorkflows([])}
          >
            Clear History
          </Button>
        </Card>
      )}
    </div>
  );
}