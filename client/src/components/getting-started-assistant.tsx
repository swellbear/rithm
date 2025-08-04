import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Circle, ArrowRight, MapPin, Users, Camera, BarChart3, Bell, BookOpen, X, Clock, HelpCircle, Target, Lightbulb, Star, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

interface GuidedStep {
  id: string;
  title: string;
  description: string;
  purpose: string;
  estimatedTime: string;
  example?: string;
  successStory?: string;
  dependencies?: string[];
  helpContent?: string;
  validationTips?: string[];
  icon: any;
  completed: boolean;
  route?: string;
  action?: () => void;
  requirements?: string[];
  benefits: string[];
}

interface SetupMode {
  id: 'quick' | 'complete' | 'explore';
  title: string;
  description: string;
  estimatedTime: string;
  features: string[];
}

interface ProgressData {
  completedSteps: string[];
  currentStep?: string;
  setupMode?: string;
  lastActivity: number;
}

interface AssistantProps {
  onClose: () => void;
  activatedTools: number[];
}

export default function GettingStartedAssistant({ onClose, activatedTools }: AssistantProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupMode, setSetupMode] = useState<'quick' | 'complete' | 'explore' | null>(null);
  const [showEducationalContent, setShowEducationalContent] = useState(false);
  const [progressState, setProgressState] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  // Setup mode configurations
  const setupModes: SetupMode[] = [
    {
      id: 'quick',
      title: 'Quick Start',
      description: 'Essential setup for immediate use',
      estimatedTime: '5 minutes',
      features: ['Basic farm profile', 'Key tool activation', 'First action guidance']
    },
    {
      id: 'complete',
      title: 'Complete Setup',
      description: 'Comprehensive farm configuration',
      estimatedTime: '15 minutes',
      features: ['Detailed farm profile', 'All activated tools', 'Full workflow guidance']
    },
    {
      id: 'explore',
      title: 'Explore Mode',
      description: 'Learn features as you go',
      estimatedTime: '3 minutes',
      features: ['Tool overview', 'Demo capabilities', 'Flexible setup']
    }
  ];

  // Fetch current farm data to assess completion
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: animals = [] } = useQuery<any[]>({ queryKey: ["/api/animals"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });
  const { data: alertSettings } = useQuery<any>({ 
    queryKey: ["/api/health-alert-settings", { userId: 1 }] 
  });

  // Load and save progress
  useEffect(() => {
    const savedProgress = localStorage.getItem('cadence-assistantProgress');
    if (savedProgress) {
      const progress: ProgressData = JSON.parse(savedProgress);
      setProgressState(progress.completedSteps);
      setSetupMode(progress.setupMode as any);
    }
  }, []);

  const saveProgress = (steps: string[], currentStepId?: string, mode?: string) => {
    const progress: ProgressData = {
      completedSteps: steps,
      currentStep: currentStepId,
      setupMode: mode,
      lastActivity: Date.now()
    };
    localStorage.setItem('cadence-assistantProgress', JSON.stringify(progress));
  };

  // Build guided steps based on activated tools and current data
  const buildGuidedSteps = (): GuidedStep[] => {
    const steps: GuidedStep[] = [
      {
        id: "farm-profile",
        title: "Verify Farm Profile",
        description: "Ensure your farm location and basic information is accurate",
        purpose: "Location data helps us provide climate-specific recommendations and calculations throughout the app.",
        estimatedTime: "2 minutes",
        example: "Example: Sunny Acres Farm, 150 acres, Oklahoma, USA",
        successStory: "Farmers using precise GPS coordinates see 20% more accurate weather forecasts",
        helpContent: "Your location enables climate-specific calculations like parasite rest periods and seasonal growth rates",
        validationTips: ["Use GPS coordinates for best accuracy", "Verify your timezone is correct"],
        icon: MapPin,
        completed: true, // Completed during onboarding
        route: "/tools/farm-profile-setup",
        benefits: [
          "Weather-adjusted water requirements",
          "Regional growth rate calculations", 
          "Climate-specific grazing recommendations"
        ]
      }
    ];

    // Step 2: Paddock Setup (if they have paddock management tool)
    if (activatedTools.includes(3)) {
      steps.push({
        id: "first-paddock",
        title: paddocks.length === 0 ? "Create Your First Paddock" : "Review Paddock Setup",
        description: paddocks.length === 0 
          ? "Set up your first grazing area with GPS boundaries and basic information"
          : `You have ${paddocks.length} paddock${paddocks.length > 1 ? 's' : ''} configured`,
        purpose: "Paddocks are the foundation for rotation planning, assessment data, and capacity calculations.",
        estimatedTime: "5-8 minutes",
        example: "Example: North Pasture, 25 acres, good water access, some shade",
        successStory: "Farmers with GPS-mapped paddocks improve rotation efficiency by 30%",
        helpContent: "Walk or drive the perimeter with your phone for automatic acreage calculation",
        validationTips: ["Ensure GPS signal is strong", "Include water sources and gates", "Note any problem areas"],
        dependencies: paddocks.length === 0 ? ["farm-profile"] : undefined,
        icon: MapPin,
        completed: paddocks.length > 0,
        route: "/gps-location-tools",
        benefits: [
          "Accurate acreage calculations",
          "GPS-based assessment planning",
          "Rotation optimization"
        ]
      });
    }

    // Step 3: Livestock Details (if they have livestock management)
    if (activatedTools.includes(2)) {
      const hasDetailedLivestock = animals.length > 0;
      steps.push({
        id: "livestock-details", 
        title: hasDetailedLivestock ? "Review Livestock Details" : "Add Livestock Details",
        description: hasDetailedLivestock
          ? `You have ${animals.length} individual livestock tracked`
          : "Add specific animal information for accurate calculations",
        purpose: "Individual livestock data enables precise feed, water, and capacity calculations.",
        estimatedTime: "3-6 minutes",
        example: "Example: 15 breeding cows, 1450 lbs avg, 8 lactating",
        successStory: "Detailed livestock tracking helps farmers save 25% on feed costs",
        helpContent: "Start with average weights and breeding status - you can refine details later",
        dependencies: ["farm-profile"],
        icon: Users,
        completed: hasDetailedLivestock,
        route: "/livestock-health-breeding",
        benefits: [
          "Accurate daily water needs",
          "Precise supplement calculations",
          "Individual performance tracking"
        ]
      });
    }

    // Step 4: First Assessment (if they have assessment tools)
    if (activatedTools.includes(9)) {
      steps.push({
        id: "first-assessment",
        title: assessments.length === 0 ? "Conduct First Pasture Assessment" : "Review Assessment Data",
        description: assessments.length === 0
          ? "Learn the step-point methodology and assess your first paddock"
          : `You have completed ${assessments.length} assessment${assessments.length > 1 ? 's' : ''}`,
        purpose: "Scientific assessment provides the data foundation for all grazing recommendations.",
        estimatedTime: "15-20 minutes",
        example: "Example: 10 step-points, 60% grass cover, good species diversity",
        successStory: "Farms using step-point assessment see 15% better grazing efficiency",
        helpContent: "Start with beginner mode for full guidance - the app will walk you through each step",
        dependencies: ["first-paddock"],
        icon: Camera,
        completed: assessments.length > 0,
        route: "/enhanced-pasture-assessment",
        benefits: [
          "Data-driven grazing decisions",
          "Track pasture improvement over time", 
          "Optimize rotation timing"
        ]
      });
    }

    // Step 5: Set Up Monitoring (if they have alert system)
    if (activatedTools.includes(16)) {
      // Check if alert settings have been configured (check both database and localStorage)
      const alertsConfiguredInDb = alertSettings && (
        alertSettings.enableVaccinationAlerts !== undefined ||
        alertSettings.enablePregnancyAlerts !== undefined ||
        alertSettings.enableBirthAlerts !== undefined ||
        alertSettings.enableHealthCheckAlerts !== undefined ||
        (alertSettings.alertLeadTime && alertSettings.alertLeadTime !== 30)
      );
      
      const alertsConfiguredLocally = localStorage.getItem('cadence-alertsConfigured') === 'true';
      const alertsConfigured = alertsConfiguredInDb || alertsConfiguredLocally;
      
      steps.push({
        id: "setup-alerts",
        title: "Configure Alert System",
        description: "Set up proactive monitoring for your farm operations",
        purpose: "Alerts help prevent problems before they occur and optimize timing of farm tasks.",
        estimatedTime: "5 minutes",
        example: "Example: Overgrazing warnings, move reminders, weather alerts",
        successStory: "Alert systems reduce pasture damage by 40% through early warnings",
        helpContent: "Start with basic alerts - you can customize thresholds as you learn your farm patterns",
        dependencies: ["first-paddock", "livestock-details"],
        icon: Bell,
        completed: alertsConfigured,
        route: "/alert-system",
        benefits: [
          "Never miss critical timing",
          "Prevent overgrazing",
          "Optimize weather-dependent tasks"
        ]
      });
    }

    // Step 6: Understanding Tool Workflow
    // Consider workflow understood if user has completed key setup items or marked as complete
    const hasBasicSetup = paddocks.length > 0 && animals.length > 0;
    const workflowUnderstood = hasBasicSetup || localStorage.getItem('cadence-workflowCompleted') === 'true';
    
    steps.push({
      id: "tool-workflow",
      title: "Understanding Your Tool Workflow",
      description: "Learn how your activated tools work together",
      purpose: "Understanding tool integration helps you get maximum value from your selected features.",
      estimatedTime: "8-10 minutes",
      example: "Example: Assessment → DM calculation → Feed planning → Calendar scheduling",
      successStory: "Farmers with integrated workflows complete daily tasks 50% faster",
      helpContent: "Review how data flows between your tools to maximize efficiency and accuracy",
      icon: BookOpen,
      completed: workflowUnderstood,
      route: "/analytics", // Go to analytics hub to see tool workflow integration
      action: () => {
        // Mark workflow as completed when user clicks this step
        localStorage.setItem('cadence-workflowCompleted', 'true');
      },
      benefits: [
        "Efficient daily workflow",
        "Maximize tool integration",
        "Continuous improvement process"
      ]
    });

    return steps;
  };

  const steps = useMemo(() => buildGuidedSteps(), [paddocks, herds, animals, assessments, activatedTools]);

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  const handleStepAction = (step: GuidedStep) => {
    if (step.route) {
      setLocation(step.route);
      onClose();
    } else if (step.action) {
      step.action();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (steps.length === 0) return null;

  const current = steps[currentStep];

  // Safety check for document.body
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }
  
  return createPortal(
    <TooltipProvider>
      <div 
        className="fixed inset-0 bg-black/50 z-[9999] flex items-start sm:items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <Card 
          className="w-full max-w-4xl max-h-[80vh] sm:max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Getting Started Assistant
              </CardTitle>
              <CardDescription className="text-sm">
                Complete farm setup with personalized guidance
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            {/* Setup Mode Selection */}
            {!setupMode && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold">Choose Your Setup Path</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Select the approach that best fits your needs and available time
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {setupModes.map((mode) => (
                    <Card 
                      key={mode.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                      onClick={() => {
                        setSetupMode(mode.id);
                        saveProgress(progressState, undefined, mode.id);
                      }}
                    >
                      <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg">{mode.title}</CardTitle>
                        <CardDescription>{mode.description}</CardDescription>
                        <Badge variant="outline" className="mx-auto">
                          {mode.estimatedTime}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {mode.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>New to rotational grazing?</strong> Start with Quick Start to get immediate value, 
                    then return later for Complete Setup when you're ready for advanced features.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Enhanced Step-by-Step Guide */}
            {setupMode && (
              <Tabs defaultValue="guide" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
                  <TabsTrigger 
                    value="guide" 
                    className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <span className="leading-[1.1] max-w-full">
                      <span className="hidden sm:inline">Step-by-Step Guide</span>
                      <span className="sm:hidden">Setup<br/>Guide</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="overview" 
                    className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <span className="leading-[1.1] max-w-full">
                      <span className="hidden sm:inline">Progress Overview</span>
                      <span className="sm:hidden">Progress</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="help" 
                    className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <span className="leading-[1.1] max-w-full">
                      <span className="hidden sm:inline">Help & Tips</span>
                      <span className="sm:hidden">Help</span>
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="guide" className="space-y-6">
                  {/* Enhanced Progress Tracking */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Your Progress</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        Total time: {setupModes.find(m => m.id === setupMode)?.estimatedTime}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Setup Progress</span>
                        <span>{completedSteps} of {steps.length} completed</span>
                      </div>
                      <Progress value={progressPercentage} className="h-3" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {steps.map((step, index) => (
                        <Card 
                          key={step.id}
                          className={`cursor-pointer transition-all ${
                            step.completed 
                              ? "border-green-200 bg-green-50 dark:bg-green-900/10" 
                              : index === currentStep
                                ? "border-blue-200 bg-blue-50 dark:bg-blue-900/10"
                                : "hover:border-gray-300"
                          }`}
                          onClick={() => setCurrentStep(index)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {step.completed ? (
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : (
                                  <Circle className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm leading-tight">{step.title}</h4>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-3 w-3 text-gray-400" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-sm">{step.helpContent}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                                
                                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                                  {step.description}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <Badge variant="outline" className="text-xs px-1">
                                    {step.estimatedTime}
                                  </Badge>
                                  {index === currentStep && (
                                    <Badge className="text-xs">Current</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Current Step Detailed View */}
                  {current && (
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <current.icon className="h-5 w-5 text-blue-600" />
                                {current.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300">{current.purpose}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={current.completed ? "default" : "secondary"}>
                                {current.completed ? "Completed" : "Pending"}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                {current.estimatedTime}
                              </div>
                            </div>
                          </div>

                          {/* Example and Success Story */}
                          {current.example && (
                            <Alert>
                              <Star className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Example:</strong> {current.example}
                              </AlertDescription>
                            </Alert>
                          )}

                          {current.successStory && (
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
                              <Lightbulb className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-800 dark:text-green-200">
                                <strong>Success Story:</strong> {current.successStory}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Dependencies */}
                          {current.dependencies && current.dependencies.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Prerequisites:</h4>
                              <div className="flex flex-wrap gap-2">
                                {current.dependencies.map((dep) => {
                                  const depStep = steps.find(s => s.id === dep);
                                  return (
                                    <Badge 
                                      key={dep} 
                                      variant={depStep?.completed ? "default" : "destructive"}
                                      className="text-xs"
                                    >
                                      {depStep?.title || dep}
                                      {depStep?.completed ? " ✓" : " !"}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Benefits */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Benefits:</h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                              {current.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                                  {benefit}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Validation Tips */}
                          {current.validationTips && current.validationTips.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Tips for Success:</h4>
                              <ul className="space-y-1 text-sm">
                                {current.validationTips.map((tip, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <Target className="h-3 w-3 text-blue-600 flex-shrink-0 mt-0.5" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="flex gap-3 pt-4">
                            <Button 
                              onClick={() => handleStepAction(current)}
                              className="flex-1"
                              disabled={current.dependencies?.some(dep => 
                                !steps.find(s => s.id === dep)?.completed
                              )}
                            >
                              {current.completed ? "Review Step" : "Start This Step"}
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                            
                            {showEducationalContent && (
                              <Button 
                                variant="outline" 
                                onClick={() => setShowEducationalContent(false)}
                              >
                                Hide Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Progress Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Setup Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Mode:</span>
                          <Badge>{setupModes.find(m => m.id === setupMode)?.title}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed Steps:</span>
                          <span className="font-medium">{completedSteps} of {steps.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Time:</span>
                          <span className="text-sm text-gray-600">
                            {setupModes.find(m => m.id === setupMode)?.estimatedTime}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {steps.filter(s => !s.completed).slice(0, 3).map((step, idx) => (
                            <div key={step.id} className="flex items-center gap-3">
                              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                                {idx + 1}
                              </Badge>
                              <div>
                                <div className="font-medium text-sm">{step.title}</div>
                                <div className="text-xs text-gray-600">{step.estimatedTime}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Help & Tips Tab */}
                <TabsContent value="help" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Getting Started Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Alert>
                          <Lightbulb className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Take your time:</strong> Each step builds on the previous ones. 
                            It's better to complete one step thoroughly than rush through multiple steps.
                          </AlertDescription>
                        </Alert>
                        
                        <Alert>
                          <Target className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Start simple:</strong> You can always add more detail later. 
                            Basic information is better than no information.
                          </AlertDescription>
                        </Alert>
                        
                        <Alert>
                          <HelpCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Need help?</strong> Use the tooltips and help content throughout 
                            the app. Each tool has guidance built in.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Common Questions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm mb-1">What if I don't have exact measurements?</h4>
                          <p className="text-sm text-gray-600">Start with estimates. You can refine data as you learn more about your farm.</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">Can I skip steps?</h4>
                          <p className="text-sm text-gray-600">Some steps depend on others. Required prerequisites are marked clearly.</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">How do I change my setup mode?</h4>
                          <p className="text-sm text-gray-600">You can restart the assistant anytime to choose a different path.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSetupMode(null);
                        setCurrentStep(0);
                      }}
                    >
                      Change Setup Mode
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>,
    document.body
  );
}