import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { 
  ArrowRight, CheckCircle2, Clock, MapPin, Users, Leaf, Calculator,
  TrendingUp, Target, AlertTriangle, Settings, Calendar
} from "lucide-react";

// Simplified farm state detection
function useFarmState() {
  const { data: herds = [] } = useQuery({ queryKey: ["/api/herds"] });
  const { data: paddocks = [] } = useQuery({ queryKey: ["/api/paddocks"] });
  const { data: animals = [] } = useQuery({ queryKey: ["/api/animals"] });
  const { data: assessments = [] } = useQuery({ queryKey: ["/api/assessments"] });

  // Determine farm completion stage
  const hasLivestock = Array.isArray(herds) && herds.length > 0 || Array.isArray(animals) && animals.length > 0;
  const hasPaddocks = Array.isArray(paddocks) && paddocks.length > 0;
  const hasAssessments = Array.isArray(assessments) && assessments.length > 0;

  let stage: "setup" | "assess" | "manage" | "optimize" = "setup";
  let progress = 0;

  if (!hasLivestock || !hasPaddocks) {
    stage = "setup";
    progress = hasLivestock ? 50 : 25;
  } else if (!hasAssessments) {
    stage = "assess";
    progress = 70;
  } else if (Array.isArray(assessments) && assessments.length < 3) {
    stage = "manage";
    progress = 85;
  } else {
    stage = "optimize";
    progress = 100;
  }

  return { stage, progress, hasLivestock, hasPaddocks, hasAssessments };
}

// Smart next action based on farm state
function getNextAction(farmState: ReturnType<typeof useFarmState>) {
  const { stage, hasLivestock, hasPaddocks, hasAssessments } = farmState;

  switch (stage) {
    case "setup":
      if (!hasLivestock) {
        return {
          title: "Add Your Livestock",
          description: "Tell us about your animals to get personalized recommendations",
          path: "/livestock-health-breeding",
          icon: Users,
          urgent: true
        };
      }
      return {
        title: "Map Your Paddocks",
        description: "Set up your grazing areas for rotation planning",
        path: "/gps-location-tools",
        icon: MapPin,
        urgent: true
      };

    case "assess":
      return {
        title: "Assess Your Pastures",
        description: "Quick pasture evaluation to start making data-driven decisions",
        path: "/enhanced-pasture-assessment",
        icon: Leaf,
        urgent: true
      };

    case "manage":
      return {
        title: "Plan Your Rotation",
        description: "Create an optimized grazing schedule",
        path: "/enhanced-grazing-calendar",
        icon: Calendar,
        urgent: false
      };

    case "optimize":
      return {
        title: "Analyze Performance",
        description: "Review trends and optimize your system",
        path: "/performance-analytics",
        icon: TrendingUp,
        urgent: false
      };
  }
}

// Simplified workflow cards
const WORKFLOWS = [
  {
    id: "daily-check",
    title: "Daily Farm Check",
    description: "Quick status of animals, water, and alerts",
    path: "/water-requirements",
    icon: Clock,
    category: "daily"
  },
  {
    id: "assessment",
    title: "Pasture Assessment",
    description: "Evaluate grass condition and livestock needs",
    path: "/enhanced-pasture-assessment",
    icon: Leaf,
    category: "assess"
  },
  {
    id: "planning",
    title: "Rotation Planning", 
    description: "Schedule moves and optimize grazing",
    path: "/enhanced-grazing-calendar",
    icon: Target,
    category: "manage"
  },
  {
    id: "analysis",
    title: "Performance Review",
    description: "Track progress and identify improvements",
    path: "/performance-analytics",
    icon: TrendingUp,
    category: "optimize"
  }
];

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const farmState = useFarmState();
  const nextAction = getNextAction(farmState);

  // Filter workflows based on farm readiness
  const availableWorkflows = WORKFLOWS.filter(workflow => {
    if (workflow.category === "daily") return true;
    if (workflow.category === "assess") return farmState.hasLivestock && farmState.hasPaddocks;
    if (workflow.category === "manage") return farmState.hasAssessments;
    if (workflow.category === "optimize") return farmState.hasAssessments;
    return true;
  });

  const getStageTitle = () => {
    switch (farmState.stage) {
      case "setup": return "Getting Started";
      case "assess": return "Understanding Your Land";
      case "manage": return "Active Management";
      case "optimize": return "Continuous Improvement";
    }
  };

  const getStageDescription = () => {
    switch (farmState.stage) {
      case "setup": return "Set up your farm basics to unlock intelligent recommendations";
      case "assess": return "Gather data about your pastures to make informed decisions";
      case "manage": return "Implement rotational grazing with data-driven planning";
      case "optimize": return "Fine-tune your system based on performance insights";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Farm Progress Overview */}
      <Card className="border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{getStageTitle()}</CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {getStageDescription()}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {farmState.progress}% Complete
            </Badge>
          </div>
          <Progress value={farmState.progress} className="mt-3" />
        </CardHeader>
      </Card>

      {/* Next Action */}
      <Card className={`cursor-pointer transition-shadow hover:shadow-lg ${
        nextAction.urgent ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' : ''
      }`} onClick={() => navigate(nextAction.path)}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${
              nextAction.urgent ? 'bg-orange-100 dark:bg-orange-900' : 'bg-green-100 dark:bg-green-900'
            }`}>
              <nextAction.icon className={`h-6 w-6 ${
                nextAction.urgent ? 'text-orange-600' : 'text-green-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{nextAction.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                {nextAction.description}
              </p>
              <Button className="w-auto">
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Workflows */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Farm Management Workflows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableWorkflows.map((workflow) => (
            <Card 
              key={workflow.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(workflow.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <workflow.icon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">{workflow.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {workflow.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{farmState.hasLivestock ? "✓" : "0"}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Livestock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{farmState.hasPaddocks ? "✓" : "0"}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Paddocks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Leaf className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{farmState.hasAssessments ? "✓" : "0"}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Assessments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{farmState.stage}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Stage</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}