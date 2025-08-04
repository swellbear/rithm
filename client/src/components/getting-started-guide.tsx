import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, ArrowRight, MapPin, Calculator, BarChart3, Settings, Target, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface GettingStartedGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onboardingData?: any;
}

export default function GettingStartedGuide({ isOpen, onClose, onboardingData }: GettingStartedGuideProps) {
  const [, setLocation] = useLocation();
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Get persona data from onboarding
  const persona = onboardingData?.detectedPersona;
  const selectedTools = onboardingData?.selectedTools || [];

  // Activate selected tools when component opens
  useEffect(() => {
    if (isOpen && selectedTools.length > 0) {
      activateSelectedTools();
    }
  }, [isOpen, selectedTools]);

  const activateSelectedTools = async () => {
    try {
      // Check if this is real farm data or demo mode
      const herds = JSON.parse(localStorage.getItem('demoHerds') || '[]');
      const paddocks = JSON.parse(localStorage.getItem('demoPaddocks') || '[]');
      const hasRealData = herds.length === 0 && paddocks.length === 0; // No demo data = real data
      
      // Save onboarding completion - only permanently for real data
      const onboardingComplete = {
        completedAt: new Date().toISOString(),
        persona,
        selectedTools,
        profile: onboardingData?.profile
      };
      
      if (hasRealData) {
        localStorage.setItem('cadence-intentOnboarding', JSON.stringify(onboardingComplete));
      } else {
        sessionStorage.setItem('cadence-intentOnboarding', JSON.stringify(onboardingComplete));
      }

      // Save activated tools - only permanently for real data
      const toolActivations: Record<string, any> = {};
      selectedTools.forEach((toolId: number) => {
        toolActivations[toolId.toString()] = {
          isActive: true,
          complexityLevel: 'basic',
          activatedAt: new Date().toISOString()
        };
      });
      
      if (hasRealData) {
        localStorage.setItem('grazePro-userTools', JSON.stringify(toolActivations));
      } else {
        sessionStorage.setItem('grazePro-userTools', JSON.stringify(toolActivations));
      }

      // Try to activate tools via API as well (but don't block on this)
      try {
        for (const toolId of selectedTools) {
          const response = await fetch('/api/tools/activate', {
            method: 'POST',
            body: JSON.stringify({
              toolId,
              complexityLevel: 'basic'
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to activate tool ${toolId}`);
          }
        }
        console.log('Tools activated via API successfully');
      } catch (apiError) {
        console.log('Backend tool activation failed, but continuing with local setup:', apiError);
      }
    } catch (error) {
      // Tool activation completed with local fallback
    }
  };

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
  };

  const handleQuickAction = (route: string, stepId?: string) => {
    if (stepId) {
      markStepCompleted(stepId);
    }
    setLocation(route);
    onClose();
  };

  // Personalized recommendations based on detected persona
  const getPersonalizedSteps = () => {
    const baseSteps = [
      {
        id: "explore-tools",
        title: "Explore Your Recommended Tools",
        description: "View and activate the tools selected for your farm profile",
        icon: <Settings className="h-5 w-5" />,
        action: () => handleQuickAction("/tools", "explore-tools"),
        priority: "high" as const
      },
      {
        id: "analytics-dashboard", 
        title: "Check Your Farm Analytics",
        description: "See your current farm status and get AI-powered insights",
        icon: <BarChart3 className="h-5 w-5" />,
        action: () => handleQuickAction("/analytics", "analytics-dashboard"),
        priority: "high" as const
      }
    ];

    if (persona?.type === "beginner") {
      return [
        ...baseSteps,
        {
          id: "create-paddocks",
          title: "Map Your First Paddock",
          description: "Use GPS tracking to create your grazing areas",
          icon: <MapPin className="h-5 w-5" />,
          action: () => handleQuickAction("/paddocks", "create-paddocks"),
          priority: "medium" as const
        },
        {
          id: "daily-needs",
          title: "Calculate Daily Animal Needs",
          description: "Get immediate practical value with water and feed calculations",
          icon: <Calculator className="h-5 w-5" />,
          action: () => handleQuickAction("/au-calculator", "daily-needs"),
          priority: "medium" as const
        }
      ];
    }

    if (persona?.type === "tech_forward") {
      return [
        ...baseSteps,
        {
          id: "gps-setup",
          title: "Set Up GPS Location Tools",
          description: "Configure precision mapping and weather integration",
          icon: <Target className="h-5 w-5" />,
          action: () => handleQuickAction("/gps-location-tools", "gps-setup"),
          priority: "high" as const
        },
        {
          id: "alert-system",
          title: "Configure Smart Alerts",
          description: "Set up automated monitoring and notifications",
          icon: <Zap className="h-5 w-5" />,
          action: () => handleQuickAction("/alert-system", "alert-system"),
          priority: "medium" as const
        }
      ];
    }

    if (persona?.type === "commercial") {
      return [
        ...baseSteps,
        {
          id: "performance-analytics",
          title: "Set Up Performance Tracking",
          description: "Start monitoring ROI and operational efficiency",
          icon: <BarChart3 className="h-5 w-5" />,
          action: () => handleQuickAction("/performance-analytics", "performance-analytics"),
          priority: "high" as const
        },
        {
          id: "financial-management",
          title: "Configure Financial Analysis",
          description: "Track costs, revenue, and profitability metrics",
          icon: <Calculator className="h-5 w-5" />,
          action: () => handleQuickAction("/financial-management", "financial-management"),
          priority: "medium" as const
        }
      ];
    }

    // Default steps for other personas
    return [
      ...baseSteps,
      {
        id: "create-paddocks",
        title: "Create Your Paddocks",
        description: "Map your grazing areas using GPS or manual entry",
        icon: <MapPin className="h-5 w-5" />,
        action: () => handleQuickAction("/paddocks", "create-paddocks"),
        priority: "medium" as const
      },
      {
        id: "pasture-assessment",
        title: "Assess Your Pastures",
        description: "Use the step-point method for scientific evaluation",
        icon: <Target className="h-5 w-5" />,
        action: () => handleQuickAction("/enhanced-pasture-assessment", "pasture-assessment"),
        priority: "medium" as const
      }
    ];
  };

  const steps = getPersonalizedSteps();
  const highPrioritySteps = steps.filter(step => step.priority === "high");
  const mediumPrioritySteps = steps.filter(step => step.priority === "medium");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Welcome to Cadence!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Persona Summary */}
          {persona && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800 dark:text-green-200">
                  Your Farm Profile: {persona.name}
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  {persona.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedTools.length} tools activated</Badge>
                  <Badge variant="outline">Basic complexity level</Badge>
                  <Badge variant="outline">{persona.focus}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Your Recommended Next Steps</h3>
            
            {/* High Priority Steps */}
            <div className="space-y-4 mb-6">
              <h4 className="text-lg font-medium text-blue-700 dark:text-blue-300">🎯 Start Here (High Priority)</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {highPrioritySteps.map((step) => (
                  <Card key={step.id} className="border-blue-200 hover:border-blue-300 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {step.icon}
                        {step.title}
                        {completedSteps.includes(step.id) && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        onClick={step.action}
                        className="w-full"
                        disabled={completedSteps.includes(step.id)}
                      >
                        {completedSteps.includes(step.id) ? "Completed" : "Get Started"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Medium Priority Steps */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-orange-700 dark:text-orange-300">⚡ Build Your Foundation</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {mediumPrioritySteps.map((step) => (
                  <Card key={step.id} className="border-orange-200 hover:border-orange-300 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {step.icon}
                        {step.title}
                        {completedSteps.includes(step.id) && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        onClick={step.action}
                        variant="outline"
                        className="w-full"
                        disabled={completedSteps.includes(step.id)}
                      >
                        {completedSteps.includes(step.id) ? "Completed" : "Start"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">💡 Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• You can access all tools anytime from the <strong>Tools</strong> page in the navigation</p>
              <p>• Start with <strong>Basic</strong> complexity and upgrade to Intermediate/Advanced as you learn</p>
              <p>• Your farm data automatically syncs between tools for seamless workflows</p>
              <p>• Visit the <strong>Analytics</strong> page to track your progress and get AI insights</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={() => handleQuickAction("/tools")} className="flex-1">
              View All Tools
            </Button>
            <Button onClick={() => handleQuickAction("/analytics")} variant="outline" className="flex-1">
              Analytics Dashboard
            </Button>
            <Button onClick={onClose} variant="ghost">
              I'll Explore on My Own
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}