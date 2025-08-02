import { useState, useEffect, memo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkflowProgress } from "@/hooks/useWorkflowProgress";
import { useSmartTaskCompletion } from "@/hooks/useSmartTaskCompletion";
import { useMilestoneResetListener } from "@/lib/workflow-widget-milestone-listener";
import { 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronDown, 
  ChevronUp,
  Sun,
  Heart,
  Droplets,
  Calendar,
  Cat,
  Cloud,
  MapPin,
  Route,
  Ruler,
  Leaf,
  Calculator,
  FileText,
  Home,
  Target
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: any;
  completed: boolean;
}

interface WorkflowContext {
  title: string;
  tasks: Task[];
  route: string;
}

// Helper functions to map step IDs to paths and icons
const getPathForStep = (stepId: string) => {
  const pathMap: Record<string, string> = {
    // Standard morning check tasks
    'check-weather': '/weather-integration',
    'check-animals': '/livestock-health-breeding',
    'assess-water': '/water-requirements',
    'plan-moves': '/enhanced-grazing-calendar',
    // Paddock assessment workflow tasks
    'select-paddock': '/enhanced-pasture-assessment',
    'walk-transect': '/enhanced-pasture-assessment',
    'measure-height': '/enhanced-pasture-assessment',
    'identify-species': '/plant-identification',
    'calculate-dm': '/dm-availability',
    'generate-report': '/enhanced-pasture-assessment'
  };
  return pathMap[stepId] || '/';
};

const getIconForStep = (stepId: string) => {
  const iconMap: Record<string, any> = {
    // Standard morning check tasks
    'check-weather': Cloud,
    'check-animals': Cat,
    'assess-water': Droplets,
    'plan-moves': Calendar,
    // Paddock assessment workflow tasks
    'select-paddock': MapPin,
    'walk-transect': Route,
    'measure-height': Ruler,
    'identify-species': Leaf,
    'calculate-dm': Calculator,
    'generate-report': FileText
  };
  return iconMap[stepId] || Clock;
};

const WorkflowProgressWidget = memo(function WorkflowProgressWidget() {
  const [location, navigate] = useLocation();
  const { startWorkflow } = useWorkflowProgress();
  const { getTaskProgress } = useSmartTaskCompletion();
  const [isMinimized, setIsMinimized] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentContext, setCurrentContext] = useState<WorkflowContext | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch real farm data to determine actual progress
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: animals = [] } = useQuery<any[]>({ queryKey: ["/api/animals"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  // Listen for milestone reset events and refresh component
  useMilestoneResetListener(() => {
    console.log('🔄 Milestone reset detected - refreshing workflow widget');
    setRefreshTrigger(prev => prev + 1);
    
    // Force re-evaluate the context
    setTimeout(() => {
      const context = getWorkflowContext();
      setCurrentContext(context);
      console.log('✅ Workflow widget refreshed after milestone reset');
    }, 100);
  });

  // Context-aware workflow detection based on current page and farm data
  const getWorkflowContext = (): WorkflowContext => {
    // Check if user has actual progress on real farm tasks
    const hasWeatherData = getTaskProgress('weather').isComplete;
    const hasAnimalData = animals.length > 0;
    const hasPaddockData = paddocks.length > 0;
    const hasAssessmentData = assessments.length > 0;

    // Context-specific workflow detection based on current page
    const getContextTitle = (): string => {
      if (location === '/' || location === '/dashboard') return 'Daily Workflow';
      if (location.includes('weather')) return 'Weather Workflow';
      if (location.includes('livestock') || location.includes('animals')) return 'Livestock Workflow';
      if (location.includes('water')) return 'Water Workflow';
      if (location.includes('calendar') || location.includes('grazing')) return 'Rotation Workflow';
      if (location.includes('enhanced-pasture-assessment') || location.includes('dm-availability') || location.includes('plant-identification')) return 'Assessment Workflow';
      if (location.includes('gps') || location.includes('location')) return 'Mapping Workflow';
      if (location.includes('financial') || location.includes('market')) return 'Business Workflow';
      if (location.includes('tools')) return 'Tools Overview';
      if (location.includes('analytics')) return 'Analytics Workflow';
      return 'Farm Workflow';
    };

    // Dashboard context - show daily workflow
    if (location === '/' || location === '/dashboard') {
      const dailyTasks: Task[] = [
        {
          id: 'check-weather',
          title: 'Check Weather',
          description: 'Review conditions and alerts',
          path: '/weather-integration',
          icon: Cloud,
          completed: getTaskProgress('weather').isComplete
        },
        {
          id: 'check-animals',
          title: 'Livestock Management',
          description: 'Review health and records',
          path: '/livestock-health-breeding',
          icon: Cat,
          completed: hasAnimalData && animals.some(a => a.healthStatus === 'good')
        },
        {
          id: 'assess-water',
          title: 'Assess Water',
          description: 'Verify water systems',
          path: '/water-requirements',
          icon: Droplets,
          completed: hasAnimalData && hasPaddockData
        },
        {
          id: 'plan-moves',
          title: 'Plan Rotation',
          description: 'Schedule paddock moves',
          path: '/enhanced-grazing-calendar',
          icon: Calendar,
          completed: hasPaddockData && hasAnimalData && hasAssessmentData
        }
      ];
      
      return {
        title: getContextTitle(),
        tasks: dailyTasks,
        route: location
      };
    }

    // Pasture assessment context
    if (location.includes('enhanced-pasture-assessment') || location.includes('dm-availability') || location.includes('plant-identification')) {
      const assessmentTasks: Task[] = [
        {
          id: 'select-paddock',
          title: 'Select Paddock',
          description: 'Choose paddock to assess',
          path: '/enhanced-pasture-assessment',
          icon: MapPin,
          completed: hasPaddockData
        },
        {
          id: 'walk-transect',
          title: 'Walk Transect',
          description: 'Collect step-point data',
          path: '/enhanced-pasture-assessment',
          icon: Route,
          completed: hasAssessmentData
        },
        {
          id: 'measure-height',
          title: 'Measure Grass',
          description: 'Record grass height',
          path: '/enhanced-pasture-assessment',
          icon: Ruler,
          completed: hasAssessmentData
        },
        {
          id: 'identify-species',
          title: 'Plant Species',
          description: 'Identify plant types',
          path: '/plant-identification',
          icon: Leaf,
          completed: hasAssessmentData && assessments.some(a => a.summary?.dominantSpecies?.length > 0)
        },
        {
          id: 'calculate-dm',
          title: 'Calculate DM',
          description: 'Estimate dry matter',
          path: '/dm-availability',
          icon: Calculator,
          completed: hasAssessmentData
        },
        {
          id: 'generate-report',
          title: 'Generate Report',
          description: 'Create recommendations',
          path: '/enhanced-pasture-assessment',
          icon: FileText,
          completed: hasAssessmentData && assessments.some(a => a.summary?.recommendations?.length > 0)
        }
      ];

      return {
        title: getContextTitle(),
        tasks: assessmentTasks,
        route: location
      };
    }

    // Context-specific tasks for other pages
    const getContextTasks = (): Task[] => {
      // Weather page - focus on weather tasks
      if (location.includes('weather')) {
        return [
          {
            id: 'check-weather',
            title: 'Review Current Weather',
            description: 'Check temperature and conditions',
            path: '/weather-integration',
            icon: Cloud,
            completed: hasWeatherData
          },
          {
            id: 'check-forecast',
            title: 'Review 7-day Forecast',
            description: 'Plan ahead for weather changes',
            path: '/weather-integration',
            icon: Sun,
            completed: getTaskProgress('weather').criteria?.forecastChecked || false
          },
          {
            id: 'check-alerts',
            title: 'Check Weather Alerts',
            description: 'Review warnings and advisories',
            path: '/weather-integration',
            icon: Cloud,
            completed: getTaskProgress('weather').criteria?.alertsReviewed || false
          }
        ];
      }

      // Livestock page - focus on animal tasks
      if (location.includes('livestock') || location.includes('animals')) {
        return [
          {
            id: 'health-records',
            title: 'Review Health Records',
            description: 'Check vaccination schedules',
            path: '/livestock-health-breeding',
            icon: Heart,
            completed: getTaskProgress('animals').criteria?.healthRecordsViewed || false
          },
          {
            id: 'calculate-water',
            title: 'Calculate Water Needs',
            description: 'Assess daily water requirements',
            path: '/water-requirements',
            icon: Droplets,
            completed: getTaskProgress('animals').criteria?.waterCalculated || false
          },
          {
            id: 'assess-conditions',
            title: 'Assess Body Condition',
            description: 'Evaluate animal health status',
            path: '/livestock-health-breeding',
            icon: Cat,
            completed: getTaskProgress('animals').criteria?.conditionsAssessed || false
          }
        ];
      }

      // Default to daily workflow tasks
      return [
        {
          id: 'check-weather',
          title: 'Check Weather',
          description: 'Review conditions and alerts',
          path: '/weather-integration',
          icon: Cloud,
          completed: hasWeatherData
        },
        {
          id: 'check-animals',
          title: 'Livestock Management',
          description: 'Review health and records',
          path: '/livestock-health-breeding',
          icon: Cat,
          completed: hasAnimalData && animals.some(a => a.healthStatus === 'good')
        },
        {
          id: 'assess-water',
          title: 'Assess Water',
          description: 'Verify water systems',
          path: '/water-requirements',
          icon: Droplets,
          completed: hasAnimalData && hasPaddockData
        },
        {
          id: 'plan-moves',
          title: 'Plan Rotation',
          description: 'Schedule paddock moves',
          path: '/enhanced-grazing-calendar',
          icon: Calendar,
          completed: hasPaddockData && hasAnimalData && hasAssessmentData
        }
      ];
    };
    
    return {
      title: getContextTitle(),
      tasks: getContextTasks(),
      route: location
    };
  };

  // Update context when location or data changes
  useEffect(() => {
    const context = getWorkflowContext();
    setCurrentContext(context);
    console.log('Workflow context updated:', context.title, context.tasks.length, 'tasks');
  }, [location, paddocks, animals, assessments, getTaskProgress, refreshTrigger]);

  // Check if widget was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('cadence-workflow-dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  // Reset widget state when new day starts
  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('cadence-workflow-date');
    
    if (lastCheck !== today) {
      localStorage.setItem('cadence-workflow-date', today);
      localStorage.removeItem('cadence-workflow-dismissed');
      setIsDismissed(false);
    }
  }, []);

  const handleTaskToggle = (taskId: string) => {
    // This will be handled by actual user actions rather than manual toggles
    console.log('Task toggle requested for:', taskId);
  };

  const handleTaskNavigate = (task: Task) => {
    console.log('Navigating to task:', task.title, 'at', task.path);
    navigate(task.path);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('cadence-workflow-dismissed', 'true');
  };

  const handleRestore = () => {
    setIsDismissed(false);
    localStorage.removeItem('cadence-workflow-dismissed');
  };

  const tasks = currentContext?.tasks || [];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const allCompleted = completedTasks === totalTasks && totalTasks > 0;

  // Auto-hide when all tasks are completed
  useEffect(() => {
    if (allCompleted) {
      // Auto-hide after a brief delay to show completion
      const timer = setTimeout(() => {
        setIsDismissed(true);
        // Don't save to localStorage so it reappears when new tasks are needed
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted]);

  // Don't show if dismissed, no context, or no tasks
  if (isDismissed || !currentContext || tasks.length === 0) {
    return null;
  }

  console.log('Rendering widget. Context:', currentContext.title, 'tasks:', tasks.length);
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 sm:w-80">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-green-200 border-2 overflow-hidden">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <div className="bg-green-100 p-1.5 rounded-full flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <div className="text-sm font-medium text-gray-900 truncate leading-tight">
                  {currentContext.title}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {completedTasks}/{totalTasks} done
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                onClick={() => setIsMinimized(!isMinimized)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-100 flex-shrink-0"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
                title="Dismiss"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 mx-0">
            <div 
              className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="pt-0 px-3 pb-3">
            {allCompleted ? (
              <div className="text-center py-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">All done!</p>
                <p className="text-xs text-gray-600">{currentContext.title} complete</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const IconComponent = task.icon;
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleTaskNavigate(task)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left min-w-0"
                    >
                      <div className={`p-1.5 rounded-full ${task.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {task.completed ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <IconComponent className="h-3 w-3 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className={`text-sm font-medium truncate leading-tight ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </div>
                      {!task.completed && (
                        <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
});

export default WorkflowProgressWidget;