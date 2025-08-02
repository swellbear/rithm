// Post-Completion Engagement System
// Provides ongoing value and task rotation for users who've completed all workflow phases

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Activity, 
  TrendingUp, 
  CheckCircle,
  RotateCcw,
  Clock,
  Target,
  Lightbulb,
  Star,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";

interface EngagementTask {
  id: string;
  title: string;
  description: string;
  type: "routine" | "optimization" | "seasonal" | "learning";
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  path: string;
  icon: any;
  estimatedTime: string;
  priority: number;
  benefits: string[];
  lastCompleted?: Date;
  streak?: number;
}

interface PostCompletionEngagementProps {
  userTier: string;
  farmData: {
    hasLivestock: boolean;
    hasPaddocks: boolean;
    hasAssessments: boolean;
    livestockCount: number;
    paddockCount: number;
    assessmentCount: number;
  };
}

export function PostCompletionEngagement({ userTier, farmData }: PostCompletionEngagementProps) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("daily");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Generate rotating engagement tasks
  const generateEngagementTasks = (): Record<string, EngagementTask[]> => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();
    const month = today.getMonth();

    const tasks = {
      daily: [
        {
          id: 'weather-check',
          title: 'Weather & Alerts Review',
          description: 'Check today\'s conditions and plan farm activities accordingly',
          type: 'routine' as const,
          frequency: 'daily' as const,
          path: '/weather-integration',
          icon: Clock,
          estimatedTime: '3 min',
          priority: 1,
          benefits: ['Stay ahead of weather changes', 'Protect livestock', 'Optimize work timing']
        },
        {
          id: 'pasture-visual-check',
          title: 'Quick Pasture Observation',
          description: 'Visual assessment of current grazing areas',
          type: 'routine' as const,
          frequency: 'daily' as const,
          path: '/enhanced-pasture-assessment',
          icon: CheckCircle,
          estimatedTime: '5 min',
          priority: 2,
          benefits: ['Early problem detection', 'Better rotation timing', 'Improved grass health']
        }
      ],
      weekly: [
        {
          id: 'rotation-review',
          title: 'Rotation Plan Adjustment',
          description: 'Review and adjust grazing schedule based on current conditions',
          type: 'optimization' as const,
          frequency: 'weekly' as const,
          path: '/enhanced-grazing-calendar',
          icon: RotateCcw,
          estimatedTime: '10 min',
          priority: 3,
          benefits: ['Maximize pasture utilization', 'Improve grass recovery', 'Optimize livestock performance']
        },
        {
          id: 'livestock-performance',
          title: 'Livestock Performance Update',
          description: 'Record weights, body condition, and health observations',
          type: 'routine' as const,
          frequency: 'weekly' as const,
          path: '/livestock-health-breeding',
          icon: Activity,
          estimatedTime: '15 min',
          priority: 4,
          benefits: ['Track performance trends', 'Early health detection', 'Optimize nutrition']
        },
        {
          id: 'nutrition-assessment',
          title: 'Nutrition Needs Review',
          description: 'Reassess supplement requirements based on pasture conditions',
          type: 'optimization' as const,
          frequency: 'weekly' as const,
          path: '/feed-supplement-calculator',
          icon: Target,
          estimatedTime: '8 min',
          priority: 5,
          benefits: ['Reduce feed costs', 'Improve animal health', 'Optimize nutrition timing']
        }
      ],
      monthly: [
        {
          id: 'pasture-assessment',
          title: 'Comprehensive Pasture Assessment',
          description: 'Full step-point assessment to track pasture health trends',
          type: 'optimization' as const,
          frequency: 'monthly' as const,
          path: '/enhanced-pasture-assessment',
          icon: TrendingUp,
          estimatedTime: '25 min',
          priority: 6,
          benefits: ['Track long-term trends', 'Identify improvement areas', 'Plan future investments']
        },
        {
          id: 'financial-review',
          title: 'Monthly Financial Analysis',
          description: 'Review costs, revenues, and identify optimization opportunities',
          type: 'optimization' as const,
          frequency: 'monthly' as const,
          path: '/financial-management',
          icon: TrendingUp,
          estimatedTime: '20 min',
          priority: 7,
          benefits: ['Track profitability', 'Identify cost savings', 'Plan investments']
        }
      ],
      seasonal: [
        {
          id: 'season-planning',
          title: 'Seasonal Strategy Planning',
          description: 'Plan ahead for upcoming seasonal changes and challenges',
          type: 'seasonal' as const,
          frequency: 'quarterly' as const,
          path: '/enhanced-grazing-calendar',
          icon: Calendar,
          estimatedTime: '30 min',
          priority: 8,
          benefits: ['Seasonal optimization', 'Prevent common problems', 'Maximize profits']
        },
        {
          id: 'equipment-maintenance',
          title: 'Equipment & Infrastructure Check',
          description: 'Review and plan maintenance for farm equipment and infrastructure',
          type: 'seasonal' as const,
          frequency: 'quarterly' as const,
          path: '/infrastructure-equipment',
          icon: CheckCircle,
          estimatedTime: '25 min',
          priority: 9,
          benefits: ['Prevent breakdowns', 'Extend equipment life', 'Maintain efficiency']
        }
      ]
    };

    // Rotate daily tasks based on day of week
    if (tasks.daily.length > 1) {
      const rotatedDaily = [...tasks.daily];
      const primaryTask = rotatedDaily[dayOfWeek % rotatedDaily.length];
      tasks.daily = [primaryTask, ...rotatedDaily.filter(t => t.id !== primaryTask.id)];
    }

    return tasks;
  };

  const tasksByFrequency = generateEngagementTasks();

  const markTaskCompleted = (taskId: string) => {
    setCompletedTasks(prev => new Set([...prev, taskId]));
    
    // Store completion in localStorage for persistence
    const completions = JSON.parse(localStorage.getItem('post-completion-tasks') || '{}');
    completions[taskId] = new Date().toISOString();
    localStorage.setItem('post-completion-tasks', JSON.stringify(completions));
  };

  const getCompletionStats = () => {
    const allTasks = [
      ...tasksByFrequency.daily,
      ...tasksByFrequency.weekly,
      ...tasksByFrequency.monthly,
      ...tasksByFrequency.seasonal
    ];
    
    const completed = allTasks.filter(task => completedTasks.has(task.id)).length;
    const total = allTasks.length;
    
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getCompletionStats();

  const TaskCard = ({ task }: { task: EngagementTask }) => {
    const isCompleted = completedTasks.has(task.id);
    
    return (
      <Card className={`transition-colors ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <task.icon className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`} />
              <CardTitle className="text-sm">{task.title}</CardTitle>
              {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            <Badge variant={task.type === 'routine' ? 'default' : 'secondary'} className="text-xs">
              {task.type}
            </Badge>
          </div>
          <CardDescription className="text-xs">{task.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>⏱️ {task.estimatedTime}</span>
              <span>📅 {task.frequency}</span>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Benefits:</span>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {task.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => navigate(task.path)}
                disabled={isCompleted}
              >
                {isCompleted ? 'Completed' : 'Start Task'}
                {!isCompleted && <ArrowRight className="h-3 w-3 ml-1" />}
              </Button>
              {!isCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markTaskCompleted(task.id)}
                >
                  ✓
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>Ongoing Farm Excellence</span>
              </CardTitle>
              <CardDescription>
                Continue optimizing your operation with smart task rotation
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{stats.percentage}%</div>
              <div className="text-xs text-gray-500">Progress Today</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={stats.percentage} className="mb-4" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{stats.completed} of {stats.total} tasks completed</span>
            <Badge variant="outline">
              {farmData.livestockCount} livestock • {farmData.paddockCount} paddocks
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Task Rotation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Daily Focus:</strong> Quick, high-impact tasks that keep your operation running smoothly.
              These rotate automatically to provide variety.
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 md:grid-cols-2">
            {tasksByFrequency.daily.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Weekly Optimization:</strong> Deeper analysis and adjustments to improve performance
              and stay ahead of problems.
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 md:grid-cols-2">
            {tasksByFrequency.weekly.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <strong>Monthly Strategic Review:</strong> Comprehensive analysis and planning to drive
              long-term improvement and profitability.
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 md:grid-cols-2">
            {tasksByFrequency.monthly.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-4">
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Seasonal Planning:</strong> Prepare for upcoming changes and optimize your
              operation for seasonal challenges and opportunities.
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 md:grid-cols-2">
            {tasksByFrequency.seasonal.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Hook for managing post-completion engagement
export function usePostCompletionEngagement() {
  const [tasks, setTasks] = useState<EngagementTask[]>([]);
  const [completionStats, setCompletionStats] = useState({ completed: 0, total: 0, percentage: 0 });

  useEffect(() => {
    // Load completion data from localStorage
    const completions = JSON.parse(localStorage.getItem('post-completion-tasks') || '{}');
    
    // Calculate daily recommended tasks
    const today = new Date();
    const dayTasks = generateDailyTasks(today, completions);
    setTasks(dayTasks);
    
    // Calculate completion stats
    const completed = dayTasks.filter(task => completions[task.id]).length;
    const total = dayTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    setCompletionStats({ completed, total, percentage });
  }, []);

  const generateDailyTasks = (date: Date, completions: Record<string, string>): EngagementTask[] => {
    // Smart task generation based on date, farm data, and completion history
    const baseTasks: EngagementTask[] = [
      {
        id: 'daily-weather',
        title: 'Weather Check',
        description: 'Review conditions and alerts',
        type: 'routine',
        frequency: 'daily',
        path: '/weather-integration',
        icon: Clock,
        estimatedTime: '2 min',
        priority: 1,
        benefits: ['Stay informed', 'Plan activities']
      },
      {
        id: 'daily-observation',
        title: 'Farm Observation',
        description: 'Quick visual check of livestock and pastures',
        type: 'routine',
        frequency: 'daily',
        path: '/farm-map',
        icon: CheckCircle,
        estimatedTime: '5 min',
        priority: 2,
        benefits: ['Early problem detection', 'Continuous improvement']
      }
    ];

    return baseTasks;
  };

  return {
    tasks,
    completionStats,
    markTaskCompleted: (taskId: string) => {
      const completions = JSON.parse(localStorage.getItem('post-completion-tasks') || '{}');
      completions[taskId] = new Date().toISOString();
      localStorage.setItem('post-completion-tasks', JSON.stringify(completions));
      
      // Update stats
      setCompletionStats(prev => ({
        ...prev,
        completed: prev.completed + 1,
        percentage: Math.round(((prev.completed + 1) / prev.total) * 100)
      }));
    }
  };
}