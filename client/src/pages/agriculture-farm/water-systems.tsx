import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useWorkflowProgress } from "@/hooks/useWorkflowProgress";

export default function WaterSystems() {
  const { updateWorkflowStep } = useWorkflowProgress();
  const [, navigate] = useLocation();
  const [isInWorkflow, setIsInWorkflow] = useState(false);

  // Mark workflow step as complete when page loads
  useEffect(() => {
    const activeWorkflow = localStorage.getItem('cadence-workflow-progress');
    if (activeWorkflow) {
      const progress = JSON.parse(activeWorkflow);
      if (progress.active && progress.active.workflowId === 'morning-check') {
        updateWorkflowStep('morning-check', 'assess-water');
        setIsInWorkflow(true);
      }
    }
  }, [updateWorkflowStep]);

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Water Systems Check
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Verify water availability and system functionality
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            Water Systems Status
          </CardTitle>
          <CardDescription>
            Check all water sources and systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">North Paddock Water Trough</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Functioning properly, water level good</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium">South Field Automatic Waterer</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Water level low, needs refill</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Main Well Pump</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Operating normally, pressure at 50 PSI</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Workflow Progress:</strong> Water systems checked. This completes the morning farm check routine.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow continuation button */}
      {isInWorkflow && (
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Morning Farm Check Progress</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Weather checked ✓ • Animals checked ✓ • Water assessed ✓ - Continue to rotation planning
                </p>
              </div>
              <Button 
                onClick={() => navigate('/enhanced-grazing-calendar')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue to Rotation Planning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}