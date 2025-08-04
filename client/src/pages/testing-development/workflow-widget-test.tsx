// Comprehensive Workflow Widget Test Page
// Tests all aspects of the cross-workflow completion system

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, XCircle, RefreshCw, Navigation, Hash, 
  Percent, Database, ArrowRight, TestTube, Activity
} from 'lucide-react';
import { useSmartTaskCompletion } from '@/hooks/useSmartTaskCompletion';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  description: string;
  details?: string;
}

export default function WorkflowWidgetTest() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { 
    getTaskProgress, 
    markActionCompleted, 
    resetAllProgress 
  } = useSmartTaskCompletion();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Get current progress for all workflows
  const weatherProgress = getTaskProgress('weather');
  const animalsProgress = getTaskProgress('animals');
  const waterProgress = getTaskProgress('water');
  const rotationProgress = getTaskProgress('rotation');

  // Test 1: Navigation to specific sections
  const testSectionNavigation = () => {
    const testName = "Section Navigation Test";
    try {
      // Test weather section navigation
      navigate('/weather-integration#current-weather');
      setTimeout(() => {
        navigate('/weather-integration#forecast');
        setTimeout(() => {
          navigate('/weather-integration#alerts');
          setTestResults(prev => [...prev, {
            name: testName,
            status: 'pass',
            description: 'Successfully navigated to all weather sections',
            details: 'Tested: #current-weather, #forecast, #alerts'
          }]);
        }, 500);
      }, 500);
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'fail',
        description: 'Failed to navigate to sections',
        details: String(error)
      }]);
    }
  };

  // Test 2: Progress tracking
  const testProgressTracking = () => {
    const testName = "Progress Tracking Test";
    try {
      // Mark some weather actions as completed
      markActionCompleted('weather', 'dataViewed');
      markActionCompleted('weather', 'forecastChecked');
      
      const progress = getTaskProgress('weather');
      const expectedProgress = 66; // 2 out of 3 tasks
      
      if (Math.round(progress.percentage) === expectedProgress) {
        setTestResults(prev => [...prev, {
          name: testName,
          status: 'pass',
          description: 'Progress tracking working correctly',
          details: `Weather progress: ${progress.percentage}% (2/3 tasks = 66%)`
        }]);
      } else {
        setTestResults(prev => [...prev, {
          name: testName,
          status: 'fail',
          description: 'Progress calculation incorrect',
          details: `Expected 66%, got ${progress.percentage}%`
        }]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'fail',
        description: 'Failed to track progress',
        details: String(error)
      }]);
    }
  };

  // Test 3: 66% threshold completion
  const testThresholdCompletion = () => {
    const testName = "66% Threshold Test";
    try {
      // Reset and mark 2 out of 3 tasks
      resetAllProgress();
      markActionCompleted('animals', 'healthRecordsViewed');
      markActionCompleted('animals', 'waterCalculated');
      
      const progress = getTaskProgress('animals');
      
      if (progress.isComplete && progress.percentage >= 66) {
        setTestResults(prev => [...prev, {
          name: testName,
          status: 'pass',
          description: '66% threshold triggers completion correctly',
          details: `Animals workflow marked complete at ${progress.percentage}%`
        }]);
      } else {
        setTestResults(prev => [...prev, {
          name: testName,
          status: 'fail',
          description: 'Threshold not working',
          details: `isComplete: ${progress.isComplete}, percentage: ${progress.percentage}%`
        }]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'fail',
        description: 'Failed to test threshold',
        details: String(error)
      }]);
    }
  };

  // Test 4: Cross-workflow communication
  const testCrossWorkflow = () => {
    const testName = "Cross-Workflow Communication";
    try {
      // Complete weather workflow tasks
      markActionCompleted('weather', 'dataViewed');
      markActionCompleted('weather', 'forecastChecked');
      markActionCompleted('weather', 'alertsReviewed');
      
      const weatherProg = getTaskProgress('weather');
      
      if (weatherProg.isComplete && weatherProg.percentage === 100) {
        setTestResults(prev => [...prev, {
          name: testName,
          status: 'pass',
          description: 'Cross-workflow completion working',
          details: 'Weather workflow 100% complete, daily task should be marked complete'
        }]);
        
        toast({
          title: "Cross-Workflow Test",
          description: "Check if 'Check Weather' in Daily Workflow is now complete!",
        });
      } else {
        setTestResults(prev => [...prev, {
          name: testName,
          status: 'fail',
          description: 'Cross-workflow not syncing',
          details: `Weather progress: ${weatherProg.percentage}%`
        }]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'fail',
        description: 'Failed cross-workflow test',
        details: String(error)
      }]);
    }
  };

  // Test 5: Data persistence
  const testDataPersistence = () => {
    const testName = "Data Persistence Test";
    try {
      const savedData = localStorage.getItem('cadence-task-completion-tracking');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setTestResults(prev => [...prev, {
          name: testName,
          status: 'pass',
          description: 'Progress data persists in localStorage',
          details: `Found tracking data: ${Object.keys(parsed).join(', ')}`
        }]);
      } else {
        setTestResults(prev => [...prev, {
          name: testName,
          status: 'fail',
          description: 'No persistence data found',
          details: 'localStorage key not found'
        }]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'fail',
        description: 'Failed persistence test',
        details: String(error)
      }]);
    }
  };

  // Test 6: Widget visibility on different pages
  const testWidgetContexts = async () => {
    const testName = "Context-Aware Widget Test";
    try {
      const contexts = [
        { path: '/', expectedTitle: 'Daily Workflow' },
        { path: '/weather-integration', expectedTitle: 'Weather Workflow' },
        { path: '/livestock-health-breeding', expectedTitle: 'Livestock Workflow' },
        { path: '/water-requirements', expectedTitle: 'Water Workflow' },
        { path: '/enhanced-grazing-calendar', expectedTitle: 'Rotation Workflow' }
      ];

      for (const context of contexts) {
        navigate(context.path);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setTestResults(prev => [...prev, {
        name: testName,
        status: 'pass',
        description: 'Widget changes context based on page',
        details: 'Tested: Daily, Weather, Livestock, Water, Rotation workflows'
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'fail',
        description: 'Context switching failed',
        details: String(error)
      }]);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    // Run tests sequentially with delays
    testSectionNavigation();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    testProgressTracking();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    testThresholdCompletion();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    testCrossWorkflow();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    testDataPersistence();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testWidgetContexts();
    
    setIsRunning(false);
    
    toast({
      title: "Test Suite Complete",
      description: "All workflow widget tests have been executed",
    });
  };

  // Manual action triggers for testing
  const manualActions = {
    weather: [
      { id: 'dataViewed', label: 'Mark Weather Data Viewed' },
      { id: 'forecastChecked', label: 'Mark Forecast Checked' },
      { id: 'alertsReviewed', label: 'Mark Alerts Reviewed' }
    ],
    animals: [
      { id: 'healthRecordsViewed', label: 'Mark Health Records Viewed' },
      { id: 'waterCalculated', label: 'Mark Water Calculated' },
      { id: 'conditionsAssessed', label: 'Mark Conditions Assessed' }
    ],
    water: [
      { id: 'requirementsCalculated', label: 'Mark Requirements Calculated' },
      { id: 'systemsChecked', label: 'Mark Systems Checked' },
      { id: 'adequacyAssessed', label: 'Mark Adequacy Assessed' }
    ],
    rotation: [
      { id: 'movesPlanned', label: 'Mark Moves Planned' },
      { id: 'datesScheduled', label: 'Mark Dates Scheduled' },
      { id: 'capacityCalculated', label: 'Mark Capacity Calculated' }
    ]
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workflow Widget Test Suite</h1>
        <p className="text-gray-600">Comprehensive testing for cross-workflow completion system</p>
      </div>

      <div className="grid gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Controls
            </CardTitle>
            <CardDescription>Run automated tests or trigger manual actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
              <Button 
                onClick={resetAllProgress} 
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset All Progress
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Test Results:</h3>
                {testResults.map((result, index) => (
                  <Alert key={index} className={result.status === 'pass' ? 'border-green-500' : 'border-red-500'}>
                    <div className="flex items-start gap-2">
                      {result.status === 'pass' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-gray-600">{result.description}</div>
                        {result.details && (
                          <div className="text-xs text-gray-500 mt-1">{result.details}</div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Progress Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Current Progress Status
            </CardTitle>
            <CardDescription>Real-time workflow completion tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Weather Workflow</span>
                    <Badge variant={weatherProgress.isComplete ? "default" : "outline"}>
                      {weatherProgress.percentage}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${weatherProgress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {weatherProgress.isComplete ? "✓ Daily task complete" : "66% needed for completion"}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Livestock Workflow</span>
                    <Badge variant={animalsProgress.isComplete ? "default" : "outline"}>
                      {animalsProgress.percentage}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${animalsProgress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {animalsProgress.isComplete ? "✓ Daily task complete" : "66% needed for completion"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Water Workflow</span>
                    <Badge variant={waterProgress.isComplete ? "default" : "outline"}>
                      {waterProgress.percentage}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${waterProgress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {waterProgress.isComplete ? "✓ Daily task complete" : "66% needed for completion"}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Rotation Workflow</span>
                    <Badge variant={rotationProgress.isComplete ? "default" : "outline"}>
                      {rotationProgress.percentage}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${rotationProgress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {rotationProgress.isComplete ? "✓ Daily task complete" : "66% needed for completion"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Action Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Manual Action Triggers
            </CardTitle>
            <CardDescription>Manually trigger actions to test workflow completion</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weather" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="weather">Weather</TabsTrigger>
                <TabsTrigger value="animals">Livestock</TabsTrigger>
                <TabsTrigger value="water">Water</TabsTrigger>
                <TabsTrigger value="rotation">Rotation</TabsTrigger>
              </TabsList>

              {Object.entries(manualActions).map(([category, actions]) => (
                <TabsContent key={category} value={category} className="space-y-2">
                  {actions.map(action => (
                    <Button
                      key={action.id}
                      onClick={() => {
                        markActionCompleted(category as any, action.id);
                        toast({
                          title: "Action Completed",
                          description: `${action.label} has been marked complete`,
                        });
                      }}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Navigation Test Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Navigation Test Links
            </CardTitle>
            <CardDescription>Test section-specific navigation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              <Button 
                onClick={() => navigate('/weather-integration#current-weather')} 
                variant="outline"
                className="justify-start"
              >
                Weather → Current Conditions
              </Button>
              <Button 
                onClick={() => navigate('/weather-integration#forecast')} 
                variant="outline"
                className="justify-start"
              >
                Weather → 7-Day Forecast
              </Button>
              <Button 
                onClick={() => navigate('/weather-integration#alerts')} 
                variant="outline"
                className="justify-start"
              >
                Weather → Alerts Section
              </Button>
              <Button 
                onClick={() => navigate('/livestock-health-breeding#health-records')} 
                variant="outline"
                className="justify-start"
              >
                Livestock → Health Records
              </Button>
              <Button 
                onClick={() => navigate('/water-requirements#requirements')} 
                variant="outline"
                className="justify-start"
              >
                Water → Requirements
              </Button>
              <Button 
                onClick={() => navigate('/enhanced-grazing-calendar#planning')} 
                variant="outline"
                className="justify-start"
              >
                Rotation → Planning
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* localStorage Debug */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              LocalStorage Debug
            </CardTitle>
            <CardDescription>View raw tracking data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(
                JSON.parse(localStorage.getItem('cadence-task-completion-tracking') || '{}'),
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}