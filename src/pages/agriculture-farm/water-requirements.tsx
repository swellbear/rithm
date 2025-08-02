import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Droplets, CheckCircle, AlertTriangle
} from "lucide-react";

export default function WaterRequirements() {
  // Get user subscription tier
  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const userTier = user?.subscription || 'free';
  
  // Basic tier water assessment form
  const [waterAssessment, setWaterAssessment] = useState({
    waterSources: '',
    adequacyRating: '',
    issues: '',
    notes: '',
    assessmentCompleted: false
  });
  
  const { toast } = useToast();

  // Complete water assessment function
  const completeWaterAssessment = () => {
    if (!waterAssessment.waterSources || !waterAssessment.adequacyRating) {
      toast({
        title: "Missing Information",
        description: "Please fill in water sources and adequacy rating.",
        variant: "destructive"
      });
      return;
    }

    // Save to localStorage for workflow tracking
    const completionCriteria = JSON.parse(localStorage.getItem('cadence-completion-criteria') || '{}');
    completionCriteria.water = {
      ...completionCriteria.water,
      adequacyAssessed: true
    };
    localStorage.setItem('cadence-completion-criteria', JSON.stringify(completionCriteria));
    
    // Also set the milestone directly
    localStorage.setItem('cadence-milestone-water_check_recorded', 'true');
    
    console.log('Water assessment completion saved:', {
      completionCriteria: completionCriteria,
      milestone: 'water_check_recorded'
    });
    
    setWaterAssessment(prev => ({ ...prev, assessmentCompleted: true }));
    
    toast({
      title: "Water Assessment Completed",
      description: "Your water adequacy has been recorded successfully.",
    });

    // Trigger storage event for workflow widget
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cadence-completion-criteria',
      newValue: JSON.stringify(completionCriteria)
    }));
    
    // Also trigger for the milestone
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cadence-milestone-water_check_recorded',
      newValue: 'true'
    }));
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-xl">
            <Droplets className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {userTier === 'free' ? 'Water Assessment' : 'Water Requirements Calculator'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {userTier === 'free' 
                ? 'Assess your water supply adequacy for livestock'
                : 'Calculate precise water needs based on livestock and conditions'
              }
            </p>
          </div>
        </div>
      </div>

      {userTier === 'free' ? (
        // Basic Tier Simple Assessment
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              <span>Water Supply Assessment</span>
              {waterAssessment.assessmentCompleted && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </CardTitle>
            <CardDescription>
              Complete a basic assessment of your water supply adequacy for livestock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="waterSources">Water Sources Available</Label>
              <Select 
                value={waterAssessment.waterSources} 
                onValueChange={(value) => setWaterAssessment(prev => ({ ...prev, waterSources: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your primary water sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pond">Farm Pond</SelectItem>
                  <SelectItem value="well">Well Water</SelectItem>
                  <SelectItem value="stream">Stream/Creek</SelectItem>
                  <SelectItem value="municipal">Municipal Water</SelectItem>
                  <SelectItem value="tank">Water Tank/Storage</SelectItem>
                  <SelectItem value="multiple">Multiple Sources</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adequacyRating">Water Supply Adequacy</Label>
              <Select 
                value={waterAssessment.adequacyRating} 
                onValueChange={(value) => setWaterAssessment(prev => ({ ...prev, adequacyRating: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rate your water supply adequacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - Always adequate, high quality</SelectItem>
                  <SelectItem value="good">Good - Adequate most times, decent quality</SelectItem>
                  <SelectItem value="fair">Fair - Sometimes limited, quality varies</SelectItem>
                  <SelectItem value="poor">Poor - Often inadequate or poor quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issues">Current Water Issues (Optional)</Label>
              <Select 
                value={waterAssessment.issues} 
                onValueChange={(value) => setWaterAssessment(prev => ({ ...prev, issues: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select any current issues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No current issues</SelectItem>
                  <SelectItem value="quantity">Insufficient quantity</SelectItem>
                  <SelectItem value="quality">Water quality concerns</SelectItem>
                  <SelectItem value="access">Access/distance issues</SelectItem>
                  <SelectItem value="seasonal">Seasonal availability problems</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure needs repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea 
                id="notes"
                placeholder="Any additional observations about your water supply..."
                value={waterAssessment.notes}
                onChange={(e) => setWaterAssessment(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <Button 
              onClick={completeWaterAssessment}
              className="w-full"
              disabled={waterAssessment.assessmentCompleted}
            >
              {waterAssessment.assessmentCompleted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Assessment Completed
                </>
              ) : (
                'Complete Water Assessment'
              )}
            </Button>

            {waterAssessment.assessmentCompleted && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Water assessment completed! This task will be marked as done in your workflow.
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Upgrade for Advanced Features</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Small Farm and Professional plans include detailed water calculations, heat stress monitoring, 
                and infrastructure planning tools.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Paid Tier Advanced Features
        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Advanced water calculation features for Small Farm and Professional subscribers are coming soon.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}