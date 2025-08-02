// Workflow Demo Component - Shows Smart Handoff System

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { 
  Heart, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Target,
  Clock
} from "lucide-react";

export function WorkflowDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const demoScenarios = [
    {
      task: 'check_animals',
      title: 'Demo: Animal Health Check',
      description: 'Simulate finding health issues in cattle',
      result: 'Found health issues with Cow #47 and Cow #52',
      recommendation: {
        nextTaskId: 'walk_pastures',
        priority: 'high' as const,
        reasoning: 'Health issues detected. Check pasture conditions that may be causing stress or illness.',
        estimatedTime: 15
      }
    },
    {
      task: 'walk_pastures', 
      title: 'Demo: Pasture Assessment',
      description: 'Simulate finding overgrazing conditions',
      result: 'Detected overgrazing in North Field and East Pasture',
      recommendation: {
        nextTaskId: 'plan_rotation',
        priority: 'critical' as const,
        reasoning: 'Overgrazing detected. Immediate rotation planning needed to prevent further pasture damage.',
        estimatedTime: 20
      }
    },
    {
      task: 'plan_rotation',
      title: 'Demo: Rotation Planning', 
      description: 'Simulate scheduling urgent moves',
      result: 'Scheduled moves for tomorrow and day after',
      recommendation: {
        nextTaskId: 'check_weather',
        priority: 'medium' as const,
        reasoning: 'Moves scheduled. Check weather forecast to confirm optimal timing for livestock movement.',
        estimatedTime: 5
      }
    }
  ];

  const runDemo = () => {
    const scenario = demoScenarios[demoStep];
    if (scenario) {
      setShowRecommendation(true);
    }
  };

  const acceptRecommendation = () => {
    setDemoStep(prev => (prev + 1) % demoScenarios.length);
    setShowRecommendation(false);
  };

  const resetDemo = () => {
    setDemoStep(0);
    setShowRecommendation(false);
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          <span className="truncate">Workflow Continuity Demo</span>
        </CardTitle>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          See how smart task handoffs work in action
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Demo Step */}
        {demoStep < demoScenarios.length && !showRecommendation && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">{demoStep + 1}</span>
              </div>
              <div>
                <div className="font-medium">{demoScenarios[demoStep].title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {demoScenarios[demoStep].description}
                </div>
              </div>
            </div>
            
            <Button onClick={runDemo} className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Task & See Smart Recommendation
            </Button>
          </div>
        )}

        {/* Task Result & Smart Recommendation */}
        {showRecommendation && demoStep < demoScenarios.length && (
          <div className="space-y-3">
            {/* Task Result */}
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-200">
                    Task Completed
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {demoScenarios[demoStep].result}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Recommendation */}
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900 transition-colors" onClick={acceptRecommendation}>
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                    <ArrowRight className="h-4 w-4" />
                    Smart Recommendation Generated:
                  </div>
                  <div className="font-medium text-green-800 dark:text-green-200">
                    Next: {demoScenarios[demoStep].recommendation.nextTaskId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {demoScenarios[demoStep].recommendation.reasoning}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
                      <Badge variant="outline" className={`text-green-700 border-green-300 ${
                        demoScenarios[demoStep].recommendation.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-300' :
                        demoScenarios[demoStep].recommendation.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                        'bg-green-100'
                      }`}>
                        {demoScenarios[demoStep].recommendation.priority} priority
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {demoScenarios[demoStep].recommendation.estimatedTime} min
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-200">
                      Accept & Continue →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Progress */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Demo Progress: {demoStep}/{demoScenarios.length} scenarios
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetDemo}>
              Reset Demo
            </Button>
            {demoStep >= demoScenarios.length && (
              <Button size="sm" onClick={() => {setDemoStep(0); setShowRecommendation(false);}}>
                Restart Demo
              </Button>
            )}
          </div>
        </div>

        {/* Demo Complete Message */}
        {demoStep >= demoScenarios.length && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-blue-800 dark:text-blue-200">
                Demo Complete!
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                You've seen how tasks intelligently connect to create seamless workflows.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}