import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, DollarSign, Calendar, Target, CheckCircle, ArrowRight,
  Zap, Heart, Leaf, Timer, Award, BarChart3, BookOpen, PlayCircle,
  Users, Building2, GraduationCap, Sprout
} from "lucide-react";

interface DemoScenario {
  id: string;
  title: string;
  persona: string;
  farmType: string;
  baseline: {
    profitPerAcre: number;
    grazingDays: number;
    supplementCost: number;
    laborHours: number;
  };
  improved: {
    profitPerAcre: number;
    grazingDays: number;
    supplementCost: number;
    laborHours: number;
  };
  improvements: string[];
  tools: number[];
  timeline: string;
  icon: any;
}

interface SuccessStory {
  persona: string;
  name: string;
  farmSize: string;
  challenge: string;
  solution: string[];
  results: {
    metric: string;
    improvement: string;
    timeframe: string;
  }[];
  quote: string;
  icon: any;
}

interface InteractiveTutorial {
  id: string;
  title: string;
  description: string;
  steps: {
    tool: number;
    action: string;
    description: string;
    expectedOutcome: string;
  }[];
  estimatedTime: string;
  complexity: "beginner" | "intermediate" | "advanced";
}

const demoScenarios: DemoScenario[] = [
  {
    id: "beginner-efficiency",
    title: "First-Time Rotational Grazing Success",
    persona: "Beginner Farmer",
    farmType: "100-acre mixed cattle/sheep operation",
    baseline: {
      profitPerAcre: 85,
      grazingDays: 150,
      supplementCost: 4200,
      laborHours: 25
    },
    improved: {
      profitPerAcre: 112,
      grazingDays: 195,
      supplementCost: 2800,
      laborHours: 18
    },
    improvements: [
      "32% increase in profit per acre",
      "30% more grazing days per year", 
      "33% reduction in supplement costs",
      "28% less daily management time"
    ],
    tools: [1, 2, 3, 13, 7, 16],
    timeline: "6 months",
    icon: Sprout
  },
  {
    id: "commercial-optimization",
    title: "Commercial Operation Efficiency Gains",
    persona: "Commercial Manager",
    farmType: "500-acre commercial cattle ranch",
    baseline: {
      profitPerAcre: 180,
      grazingDays: 200,
      supplementCost: 15000,
      laborHours: 40
    },
    improved: {
      profitPerAcre: 234,
      grazingDays: 260,
      supplementCost: 9500,
      laborHours: 28
    },
    improvements: [
      "30% increase in profit per acre",
      "30% more grazing days achieved",
      "37% reduction in feed costs",
      "30% improvement in labor efficiency"
    ],
    tools: [12, 19, 17, 22, 18, 21],
    timeline: "12 months",
    icon: Building2
  },
  {
    id: "regenerative-impact",
    title: "Regenerative Agriculture Success",
    persona: "Regenerative Advocate",
    farmType: "300-acre regenerative ranch",
    baseline: {
      profitPerAcre: 95,
      grazingDays: 160,
      supplementCost: 6800,
      laborHours: 35
    },
    improved: {
      profitPerAcre: 145,
      grazingDays: 220,
      supplementCost: 3400,
      laborHours: 22
    },
    improvements: [
      "53% increase in profit per acre",
      "38% more grazing days",
      "50% reduction in supplement needs",
      "Carbon credit revenue: $2,400/year"
    ],
    tools: [9, 10, 20, 11, 6, 23],
    timeline: "18 months",
    icon: Leaf
  }
];

const successStories: SuccessStory[] = [
  {
    persona: "Traditional Farmer",
    name: "Sarah Thompson",
    farmSize: "150 acres, mixed cattle operation",
    challenge: "High feed costs and poor pasture utilization",
    solution: [
      "Implemented rotational grazing with Cadence calendar",
      "Used DM availability calculations for optimal stocking",
      "Set up automated health alerts for cattle"
    ],
    results: [
      { metric: "Feed costs", improvement: "Reduced by 40%", timeframe: "First year" },
      { metric: "Carrying capacity", improvement: "Increased 35%", timeframe: "18 months" },
      { metric: "Labor time", improvement: "Saved 12 hours/week", timeframe: "6 months" }
    ],
    quote: "Cadence helped me transition to rotational grazing without the guesswork. The automatic calculations gave me confidence in my decisions.",
    icon: Heart
  },
  {
    persona: "Tech-Forward Farmer",
    name: "Mike Rodriguez", 
    farmSize: "400 acres, precision agriculture",
    challenge: "Wanted data-driven optimization of grazing systems",
    solution: [
      "Used GPS tools for precise paddock mapping",
      "Implemented comprehensive performance analytics",
      "Set up automated alert systems"
    ],
    results: [
      { metric: "Pasture productivity", improvement: "Up 45%", timeframe: "2 years" },
      { metric: "Decision accuracy", improvement: "95% confidence", timeframe: "1 year" },
      { metric: "ROI on technology", improvement: "280% return", timeframe: "First year" }
    ],
    quote: "The integration of GPS, weather data, and performance analytics transformed our operation into a precision grazing system.",
    icon: Zap
  },
  {
    persona: "Academic Researcher",
    name: "Dr. Lisa Chen",
    farmSize: "Research plots and 50-acre demonstration farm",
    challenge: "Needed scientific rigor for grazing research",
    solution: [
      "Used step-point methodology for precise assessments",
      "Implemented comprehensive data collection protocols",
      "Built research-grade documentation systems"
    ],
    results: [
      { metric: "Data quality", improvement: "Research-grade accuracy", timeframe: "Ongoing" },
      { metric: "Student engagement", improvement: "85% increase", timeframe: "2 semesters" },
      { metric: "Grant funding", improvement: "$150K secured", timeframe: "Year 2" }
    ],
    quote: "Cadence's scientific methodology tools provided the data quality needed for peer-reviewed research while remaining accessible to students.",
    icon: GraduationCap
  }
];

const interactiveTutorials: InteractiveTutorial[] = [
  {
    id: "first-assessment",
    title: "Your First Pasture Assessment",
    description: "Learn how to assess pasture condition and plan your first rotation",
    steps: [
      {
        tool: 9,
        action: "Take step-point photos",
        description: "Use the camera tool to document pasture condition",
        expectedOutcome: "Quality assessment with confidence scores"
      },
      {
        tool: 6,
        action: "Calculate DM availability",
        description: "Estimate dry matter available for livestock",
        expectedOutcome: "Pounds of feed available per acre"
      },
      {
        tool: 5,
        action: "Calculate animal units",
        description: "Determine total grazing pressure",
        expectedOutcome: "AU count for your herd"
      },
      {
        tool: 17,
        action: "Plan rotation schedule",
        description: "Set up your first rotational plan",
        expectedOutcome: "Optimized grazing calendar"
      }
    ],
    estimatedTime: "25 minutes",
    complexity: "beginner"
  },
  {
    id: "optimization-workflow",
    title: "Complete Optimization Workflow",
    description: "Advanced workflow connecting assessment, nutrition, and performance",
    steps: [
      {
        tool: 9,
        action: "Comprehensive assessment",
        description: "Full step-point methodology with GPS integration",
        expectedOutcome: "Scientific-grade pasture evaluation"
      },
      {
        tool: 11,
        action: "Nutritional analysis",
        description: "Analyze feed quality and livestock requirements",
        expectedOutcome: "Detailed nutritional profile"
      },
      {
        tool: 8,
        action: "Supplement planning",
        description: "Calculate any nutritional deficits",
        expectedOutcome: "Cost-optimized supplement plan"
      },
      {
        tool: 12,
        action: "Performance tracking",
        description: "Monitor results and trends",
        expectedOutcome: "ROI validation and optimization insights"
      }
    ],
    estimatedTime: "45 minutes",
    complexity: "advanced"
  }
];

interface EnhancedDemoExperienceProps {
  isOpen: boolean;
  onClose: () => void;
  userPersona?: string;
}

export default function EnhancedDemoExperience({ isOpen, onClose, userPersona }: EnhancedDemoExperienceProps) {
  const [selectedTab, setSelectedTab] = useState("scenarios");
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [tutorialProgress, setTutorialProgress] = useState<{ [key: string]: number }>({});

  // Filter content based on user persona
  const relevantScenarios = userPersona 
    ? demoScenarios.filter(s => s.persona.toLowerCase().includes(userPersona.toLowerCase()) || s.id.includes(userPersona))
    : demoScenarios;

  const relevantStories = userPersona
    ? successStories.filter(s => s.persona.toLowerCase().includes(userPersona.toLowerCase()))
    : successStories;

  const calculateROI = (scenario: DemoScenario) => {
    const baselineRevenue = scenario.baseline.profitPerAcre * 100; // Assuming 100 acres
    const improvedRevenue = scenario.improved.profitPerAcre * 100;
    const roi = ((improvedRevenue - baselineRevenue) / baselineRevenue * 100).toFixed(0);
    return roi;
  };

  const startTutorial = (tutorialId: string) => {
    setTutorialProgress({ ...tutorialProgress, [tutorialId]: 0 });
    // Could integrate with actual tool navigation here
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            Enhanced Demo Experience
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scenarios">ROI Scenarios</TabsTrigger>
            <TabsTrigger value="tutorials">Interactive Tutorials</TabsTrigger>
            <TabsTrigger value="success">Success Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relevantScenarios.map((scenario) => (
                <Card 
                  key={scenario.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-300"
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <scenario.icon className="h-8 w-8 text-orange-600" />
                      <Badge variant="outline" className="text-xs">
                        +{calculateROI(scenario)}% ROI
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{scenario.farmType}</p>
                    <div className="space-y-2">
                      {scenario.improvements.slice(0, 2).map((improvement, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{improvement}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Timeline: {scenario.timeline}</span>
                        <span>{scenario.tools.length} tools</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedScenario && (
              <Dialog open={!!selectedScenario} onOpenChange={(open) => !open && setSelectedScenario(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <selectedScenario.icon className="h-6 w-6 text-orange-600" />
                      {selectedScenario.title}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* ROI Summary */}
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              +{calculateROI(selectedScenario)}%
                            </div>
                            <div className="text-xs text-green-700">ROI Increase</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              +{selectedScenario.improved.grazingDays - selectedScenario.baseline.grazingDays}
                            </div>
                            <div className="text-xs text-blue-700">Extra Grazing Days</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">
                              ${(selectedScenario.baseline.supplementCost - selectedScenario.improved.supplementCost).toLocaleString()}
                            </div>
                            <div className="text-xs text-purple-700">Feed Cost Savings</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">
                              -{selectedScenario.baseline.laborHours - selectedScenario.improved.laborHours}hrs
                            </div>
                            <div className="text-xs text-orange-700">Weekly Labor Saved</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Improvements */}
                    <div>
                      <h4 className="font-semibold mb-3">Key Improvements</h4>
                      <div className="space-y-2">
                        {selectedScenario.improvements.map((improvement, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tools Used */}
                    <div>
                      <h4 className="font-semibold mb-3">Tools Used ({selectedScenario.tools.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedScenario.tools.map((toolId) => (
                          <Badge key={toolId} variant="outline">
                            Tool #{toolId}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        setSelectedScenario(null);
                        setSelectedTab("tutorials");
                      }}
                      className="w-full"
                    >
                      Start Interactive Tutorial <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="tutorials" className="space-y-4">
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                Interactive tutorials guide you through real workflows using demo data. Follow step-by-step to learn tool integration.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {interactiveTutorials.map((tutorial) => (
                <Card key={tutorial.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <PlayCircle className="h-5 w-5 text-blue-600" />
                        {tutorial.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={tutorial.complexity === 'beginner' ? 'default' : tutorial.complexity === 'intermediate' ? 'secondary' : 'outline'}>
                          {tutorial.complexity}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Timer className="h-4 w-4" />
                          {tutorial.estimatedTime}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{tutorial.description}</p>
                    
                    <div className="space-y-3">
                      {tutorial.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">Tool #{step.tool}: {step.action}</div>
                            <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
                            <div className="text-xs text-green-700 mt-1">→ {step.expectedOutcome}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {tutorialProgress[tutorial.id] !== undefined ? (
                        <div className="flex-1 mr-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{tutorialProgress[tutorial.id]}/{tutorial.steps.length}</span>
                          </div>
                          <Progress 
                            value={(tutorialProgress[tutorial.id] / tutorial.steps.length) * 100} 
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <Button 
                        onClick={() => startTutorial(tutorial.id)}
                        variant={tutorialProgress[tutorial.id] !== undefined ? "outline" : "default"}
                      >
                        {tutorialProgress[tutorial.id] !== undefined ? "Continue" : "Start Tutorial"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="success" className="space-y-4">
            <div className="space-y-6">
              {relevantStories.map((story, idx) => (
                <Card key={idx} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <story.icon className="h-8 w-8 text-green-600" />
                        <div>
                          <CardTitle>{story.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{story.farmSize}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{story.persona}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Challenge</h4>
                      <p className="text-sm text-muted-foreground">{story.challenge}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Solution</h4>
                      <ul className="space-y-1">
                        {story.solution.map((item, sidx) => (
                          <li key={sidx} className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {story.results.map((result, ridx) => (
                          <div key={ridx} className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="font-bold text-green-700">{result.improvement}</div>
                            <div className="text-xs text-green-600">{result.metric}</div>
                            <div className="text-xs text-gray-500">{result.timeframe}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-500">
                      <p className="text-sm italic text-blue-900">"{story.quote}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => {
            // Could navigate to actual tools here
            onClose();
          }}>
            Start Using Tools
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}