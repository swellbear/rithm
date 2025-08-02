// Smart Workflow Handoffs - Intelligent tool connectivity and recommendations
// Provides contextual next-step suggestions based on completed actions

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowRight, 
  Calculator, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Info,
  MapPin,
  Calendar,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";

interface WorkflowHandoff {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: any;
  priority: "high" | "medium" | "low";
  estimatedTime: string;
  reason: string;
  dataContext?: string[];
}

interface SmartWorkflowHandoffsProps {
  currentTool: string;
  completedActions?: string[];
  farmData?: {
    hasLivestock: boolean;
    hasPaddocks: boolean;
    hasAssessments: boolean;
    livestockCount: number;
    paddockCount: number;
    primarySpecies?: string;
  };
}

export function SmartWorkflowHandoffs({ 
  currentTool, 
  completedActions = [], 
  farmData 
}: SmartWorkflowHandoffsProps) {
  const [, navigate] = useLocation();

  // Generate contextual handoffs based on current tool and completed actions
  const generateHandoffs = (): WorkflowHandoff[] => {
    const handoffs: WorkflowHandoff[] = [];

    // AU Calculator handoffs
    if (currentTool === 'au-calculator' && completedActions.includes('calculated_au')) {
      if (farmData?.hasPaddocks) {
        handoffs.push({
          id: 'au-to-stocking',
          title: 'Plan Stocking Rates',
          description: 'Use your AU calculations to determine optimal stocking rates for each paddock',
          path: '/enhanced-grazing-calendar',
          icon: Target,
          priority: 'high',
          estimatedTime: '8 min',
          reason: 'Your AU calculations can now inform stocking decisions',
          dataContext: ['Animal Units calculated', 'Paddocks available']
        });
      }

      handoffs.push({
        id: 'au-to-nutrition',
        title: 'Calculate Feed Requirements',
        description: 'Determine supplemental feed needs based on your Animal Unit calculations',
        path: '/feed-supplement-calculator',
        icon: Calculator,
        priority: 'high',
        estimatedTime: '10 min',
        reason: 'AU calculations help determine accurate feed requirements',
        dataContext: ['Total AU calculated', 'Species breakdown available']
      });
    }

    // Pasture Assessment handoffs
    if (currentTool === 'pasture-assessment' && completedActions.includes('assessment_completed')) {
      handoffs.push({
        id: 'assessment-to-nutrition',
        title: 'Analyze Nutritional Quality',
        description: 'Use your pasture assessment data to analyze nutritional adequacy',
        path: '/nutritional-analysis',
        icon: Activity,
        priority: 'high',
        estimatedTime: '12 min',
        reason: 'Fresh assessment data provides accurate nutritional analysis',
        dataContext: ['Pasture condition assessed', 'Plant species identified']
      });

      handoffs.push({
        id: 'assessment-to-rotation',
        title: 'Update Rotation Plan',
        description: 'Adjust your grazing schedule based on current pasture conditions',
        path: '/enhanced-grazing-calendar',
        icon: Calendar,
        priority: 'medium',
        estimatedTime: '15 min',
        reason: 'Current pasture conditions should inform rotation timing',
        dataContext: ['Pasture quality data', 'Recovery recommendations']
      });
    }

    // Feed Calculator handoffs
    if (currentTool === 'feed-calculator' && completedActions.includes('deficit_calculated')) {
      handoffs.push({
        id: 'feed-to-financial',
        title: 'Calculate Feed Costs',
        description: 'Analyze the financial impact of your supplemental feed recommendations',
        path: '/financial-management',
        icon: TrendingUp,
        priority: 'medium',
        estimatedTime: '10 min',
        reason: 'Feed costs significantly impact farm profitability',
        dataContext: ['Supplement quantities', 'Feed types recommended']
      });

      handoffs.push({
        id: 'feed-to-rotation',
        title: 'Adjust Grazing Schedule',
        description: 'Modify rotation timing to reduce feed supplementation needs',
        path: '/enhanced-grazing-calendar',
        icon: Clock,
        priority: 'medium',
        estimatedTime: '12 min',
        reason: 'Strategic rotation can reduce supplemental feed requirements',
        dataContext: ['Feed deficit areas', 'Seasonal recommendations']
      });
    }

    // GPS/Paddock handoffs
    if (currentTool === 'gps-tools' && completedActions.includes('paddock_created')) {
      if (farmData?.hasLivestock) {
        handoffs.push({
          id: 'paddock-to-rotation',
          title: 'Plan First Rotation',
          description: 'Create a rotation schedule for your newly mapped paddocks',
          path: '/enhanced-grazing-calendar',
          icon: Calendar,
          priority: 'high',
          estimatedTime: '15 min',
          reason: 'New paddocks need to be integrated into rotation planning',
          dataContext: ['Paddock acreage calculated', 'Livestock data available']
        });
      }

      handoffs.push({
        id: 'paddock-to-assessment',
        title: 'Assess Pasture Quality',
        description: 'Conduct a baseline assessment of your newly mapped paddock',
        path: '/enhanced-pasture-assessment',
        icon: CheckCircle,
        priority: 'medium',
        estimatedTime: '20 min',
        reason: 'Baseline assessment helps establish management benchmarks',
        dataContext: ['Paddock boundaries defined', 'GPS coordinates available']
      });
    }

    // General fallbacks based on farm data
    if (handoffs.length === 0) {
      if (farmData?.hasLivestock && !farmData?.hasPaddocks) {
        handoffs.push({
          id: 'need-paddocks',
          title: 'Map Your Paddocks',
          description: 'Create paddock boundaries to enable rotation planning',
          path: '/gps-location-tools',
          icon: MapPin,
          priority: 'high',
          estimatedTime: '10 min',
          reason: 'Paddocks are required for effective grazing management',
          dataContext: ['Livestock data available']
        });
      }

      if (farmData?.hasLivestock && farmData?.hasPaddocks && !farmData?.hasAssessments) {
        handoffs.push({
          id: 'need-assessment',
          title: 'Complete Pasture Assessment',
          description: 'Establish baseline data for your grazing areas',
          path: '/enhanced-pasture-assessment',
          icon: CheckCircle,
          priority: 'high',
          estimatedTime: '20 min',
          reason: 'Assessment data drives all other management decisions',
          dataContext: ['Farm setup complete']
        });
      }
    }

    return handoffs.slice(0, 3); // Limit to top 3 recommendations
  };

  const handoffs = generateHandoffs();

  if (handoffs.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowRight className="h-5 w-5 text-green-600" />
          <span>Recommended Next Steps</span>
        </CardTitle>
        <CardDescription>
          Based on your current progress, here are intelligent suggestions for your next actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {handoffs.map((handoff) => (
          <div key={handoff.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <handoff.icon className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">{handoff.title}</h4>
                  <Badge variant={handoff.priority === 'high' ? 'destructive' : handoff.priority === 'medium' ? 'default' : 'secondary'}>
                    {handoff.priority}
                  </Badge>
                  <span className="text-xs text-gray-500">{handoff.estimatedTime}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {handoff.description}
                </p>
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">{handoff.reason}</span>
                </div>
                {handoff.dataContext && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {handoff.dataContext.map((context, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        ✓ {context}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate(handoff.path)}
                className="ml-4"
              >
                Continue
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Helper hook for tracking completed actions
export function useWorkflowTracking(toolName: string) {
  const addCompletedAction = (action: string) => {
    const key = `workflow-actions-${toolName}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if (!existing.includes(action)) {
      existing.push(action);
      localStorage.setItem(key, JSON.stringify(existing));
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('workflow-action-completed', {
        detail: { tool: toolName, action }
      }));
    }
  };

  const getCompletedActions = (): string[] => {
    const key = `workflow-actions-${toolName}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  };

  return {
    addCompletedAction,
    getCompletedActions
  };
}