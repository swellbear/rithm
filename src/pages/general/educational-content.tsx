import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, Video, FileText, Award, Target, Clock, 
  CheckCircle, Play, TrendingUp, Brain, Lightbulb, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useMilestoneSync } from "@/hooks/useMilestoneSync";

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  modules: LearningModule[];
  prerequisites: string[];
  completionReward: string;
  progress: number;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: "video" | "article" | "interactive" | "assessment" | "practical";
  duration: number;
  content: string;
  completed: boolean;
  progress: number;
  resources: LearningResource[];
}

interface LearningResource {
  id: string;
  title: string;
  type: "pdf" | "link" | "calculator" | "checklist" | "video";
  url: string;
  description: string;
}

export default function EducationalContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addMilestoneCompletion } = useMilestoneSync();

  // Mark educational tutorials as viewed for workflow completion
  useEffect(() => {
    if (user) {
      // Check if milestone already completed to avoid duplicates
      const completedMilestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
      if (!completedMilestones.includes('educational_tutorials_viewed')) {
        console.log('Educational tutorials milestone completed');
        
        // Use proper milestone system for database sync
        addMilestoneCompletion('educational_tutorials_viewed');
      }
    }
  }, [user, addMilestoneCompletion]);
  
  // Get tier-appropriate features
  const getTierFeatures = () => {
    const tier = user?.subscriptionTier || "free";
    return {
      basicTutorials: true,
      interactiveModules: ["small_farm", "professional", "enterprise"].includes(tier),
      personalizedPaths: ["professional", "enterprise"].includes(tier),
      expertMentorship: ["enterprise"].includes(tier),
      certificationPrograms: ["professional", "enterprise"].includes(tier),
      advancedAnalytics: ["enterprise"].includes(tier)
    };
  };

  const tierFeatures = getTierFeatures();
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Tier-appropriate learning paths
  const getTierLearningPaths = (): LearningPath[] => {
    const tier = user?.subscriptionTier || "free";
    
    const basicPaths: LearningPath[] = [
      {
        id: "rotational_grazing_basics",
        title: "Rotational Grazing Fundamentals",
        description: "Essential introduction to rotational grazing principles",
        category: "grazing_management",
        difficulty: "beginner",
        estimatedHours: 8,
        prerequisites: [],
        completionReward: "Rotational Grazing Certificate",
        progress: 45,
        modules: [
          {
            id: "module_1",
            title: "Introduction to Rotational Grazing",
            description: "Understanding the principles and benefits of rotational grazing systems",
            type: "video",
            duration: 45,
            content: "Video content about rotational grazing basics...",
            completed: true,
            progress: 100,
            resources: [
              { id: "r1", title: "Grazing Planning Worksheet", type: "pdf", url: "/resources/grazing-worksheet.pdf", description: "Planning template for rotational systems" }
            ]
          },
          {
            id: "module_2", 
            title: "Pasture Assessment Techniques",
            description: "Learn to evaluate pasture condition and quality",
            type: "interactive",
            duration: 60,
            content: "Interactive step-point assessment tutorial...",
            completed: true,
            progress: 100,
            resources: []
          },
          {
            id: "module_3",
            title: "Timing and Rest Periods",
            description: "Understanding optimal grazing timing and recovery periods",
            type: "article",
            duration: 30,
            content: "Article about timing and rest periods...",
            completed: false,
            progress: 60,
            resources: []
          }
        ]
      }
    ];

    const advancedPaths: LearningPath[] = [
      {
        id: "plant_identification_mastery",
        title: "Plant Identification Mastery",
        description: "Advanced plant identification for optimal pasture management",
        category: "plant_science",
        difficulty: "intermediate",
        estimatedHours: 12,
        prerequisites: ["rotational_grazing_basics"],
        completionReward: "Plant ID Expert Badge",
        progress: 25,
        modules: [
          {
            id: "plant_module_1",
            title: "Common Grass Species",
            description: "Identify common pasture grasses and their characteristics",
            type: "interactive",
            duration: 90,
            content: "Interactive plant identification guide...",
            completed: false,
            progress: 0,
            resources: []
          }
        ]
      }
    ];

    // Return tier-appropriate paths
    if (tier === "free") {
      return basicPaths.slice(0, 1);
    } else if (tier === "small_farm") {
      return basicPaths;
    } else {
      return [...basicPaths, ...advancedPaths];
    }
  };

  const learningPaths = getTierLearningPaths();

  const startLearningPath = (path: LearningPath) => {
    setSelectedPath(path);
    setActiveTab("current-learning"); // Switch to Current Learning tab
    
    // Mark educational tutorials as viewed when starting a learning path
    const milestones = JSON.parse(localStorage.getItem('cadence-milestones') || '[]');
    if (!milestones.includes('educational_tutorials_viewed')) {
      milestones.push('educational_tutorials_viewed');
      localStorage.setItem('cadence-milestones', JSON.stringify(milestones));
      console.log('Educational tutorials milestone completed via learning path start');
      
      // Trigger storage event for workflow widget (use the correct key the widget listens for)
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'cadence-completed-milestones',
        newValue: JSON.stringify(milestones)
      }));
    }
    
    toast({
      title: "Learning Started!",
      description: `Started "${path.title}" learning path`
    });
  };

  // Get tier-appropriate description
  const getTierDescription = () => {
    switch (user?.subscriptionTier) {
      case "free": 
        return "Basic tutorials and getting started guides";
      case "small_farm": 
        return "Interactive learning modules and assessment training";
      case "professional":
        return "Advanced coursework with personalized learning paths";
      case "enterprise": 
        return "Complete educational suite with expert mentorship and certification";
      default: 
        return "Personalized learning paths and AI-powered agricultural education";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderDashboard = () => {
    const tier = user?.subscriptionTier || "free";

    // Free tier users see upgrade prompt
    if (tier === "free") {
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Educational Content & Training</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Access personalized learning paths and agricultural education.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4 max-w-md mx-auto">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Free Tier: Basic Tutorials
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 mb-3">
                <li>✓ Rotational grazing fundamentals</li>
                <li>✓ Basic tutorial videos</li>
                <li>🔒 Interactive modules (Small Farm+)</li>
                <li>🔒 Personalized learning paths (Professional+)</li>
                <li>🔒 Expert mentorship (Enterprise)</li>
              </ul>
              <Button size="sm" className="w-full">
                Upgrade for Full Educational Suite
              </Button>
            </div>
            
            {/* Show limited free content */}
            {learningPaths.length > 0 && (
              <div className="grid gap-4 max-w-md mx-auto">
                {learningPaths.slice(0, 1).map((path) => (
                  <Card key={path.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">{path.title}</CardTitle>
                      <CardDescription className="text-sm">{path.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getDifficultyColor(path.difficulty)}>
                          {path.difficulty}
                        </Badge>
                        <span className="text-sm text-gray-500">{path.estimatedHours}h</span>
                      </div>
                      <Progress value={path.progress} className="h-2 mb-2" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">{path.progress}% complete</p>
                      <Button size="sm" onClick={() => startLearningPath(path)} className="w-full mt-2">
                        Start Learning
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Paid tier dashboard
    const totalProgress = learningPaths.reduce((sum, path) => sum + path.progress, 0) / learningPaths.length;
    const completedPaths = learningPaths.filter(path => path.progress === 100).length;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{totalProgress.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Overall Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">{completedPaths}</div>
                  <div className="text-sm text-gray-600">Completed Paths</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{learningPaths.length}</div>
                  <div className="text-sm text-gray-600">Available Paths</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{tierFeatures.personalizedPaths ? "Active" : "Basic"}</div>
                  <div className="text-sm text-gray-600">Learning Mode</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Learning Paths</CardTitle>
              <CardDescription>Continue your agricultural education</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {learningPaths.map(path => (
                  <div key={path.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{path.title}</h4>
                      <Badge className={getDifficultyColor(path.difficulty)}>
                        {path.difficulty}
                      </Badge>
                    </div>
                    <Progress value={path.progress} className="h-2 mb-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{path.progress}% complete</span>
                      <Button size="sm" onClick={() => startLearningPath(path)}>
                        Continue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features by Tier</CardTitle>
              <CardDescription>Your current educational access level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Basic Tutorials</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Interactive Modules</span>
                  {tierFeatures.interactiveModules ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <span className="text-xs text-gray-400">Small Farm+</span>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Personalized Learning</span>
                  {tierFeatures.personalizedPaths ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <span className="text-xs text-gray-400">Professional+</span>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Expert Mentorship</span>
                  {tierFeatures.expertMentorship ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <span className="text-xs text-gray-400">Enterprise</span>
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderLearningPaths = () => {
    const tier = user?.subscriptionTier || "free";
    
    if (tier === "free") {
      return (
        <div className="text-center py-8">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Limited Learning Paths</h3>
          <p className="text-gray-600 mb-4">Free tier includes basic rotational grazing fundamentals.</p>
          <Button>Upgrade for More Learning Paths</Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path) => (
            <Card key={path.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{path.title}</CardTitle>
                <CardDescription>{path.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getDifficultyColor(path.difficulty)}>
                      {path.difficulty}
                    </Badge>
                    <span className="text-sm text-gray-500">{path.estimatedHours} hours</span>
                  </div>
                  
                  <Progress value={path.progress} className="h-2" />
                  <div className="text-sm text-gray-600">
                    {path.progress}% complete • {path.modules.length} modules
                  </div>
                  
                  <Button 
                    onClick={() => startLearningPath(path)} 
                    className="w-full"
                    variant={path.progress > 0 ? "default" : "outline"}
                  >
                    {path.progress > 0 ? "Continue Learning" : "Start Learning"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderCurrentLearning = () => {
    if (!selectedPath) {
      return (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Active Learning Session</h3>
          <p className="text-gray-600 mb-4">Select a learning path to start your educational journey.</p>
          <Button onClick={() => setActiveTab("learning-paths")}>Browse Learning Paths</Button>
        </div>
      );
    }

    const currentModule = selectedPath.modules.find(m => !m.completed) || selectedPath.modules[0];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedPath.title}</CardTitle>
                <CardDescription>Continue your learning journey</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedPath(null)}>
                Back to Paths
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={selectedPath.progress} className="mb-4" />
            <div className="text-sm text-gray-600">
              {selectedPath.modules.filter(m => m.completed).length} of {selectedPath.modules.length} modules completed
            </div>
          </CardContent>
        </Card>

        {/* Current Module Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {currentModule.type === "video" && <Video className="h-5 w-5" />}
                    {currentModule.type === "article" && <FileText className="h-5 w-5" />}
                    {currentModule.type === "interactive" && <Brain className="h-5 w-5" />}
                    <span>{currentModule.title}</span>
                  </CardTitle>
                  <Badge variant="outline">
                    {currentModule.duration} min
                  </Badge>
                </div>
                <CardDescription>{currentModule.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentModule.type === "video" && (
                    <div className="bg-gray-900 rounded-lg p-8 text-center text-white">
                      <Video className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">{currentModule.title}</h3>
                      <p className="text-sm text-gray-300 mb-4">Video content about rotational grazing fundamentals</p>
                      <div className="flex justify-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Play Video
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentModule.type === "article" && (
                    <div className="prose max-w-none">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Key Learning Points:</h4>
                        <ul className="list-disc ml-5 space-y-1 text-sm">
                          <li>Understanding rest period calculations</li>
                          <li>Seasonal adjustments for grazing timing</li>
                          <li>Animal impact and recovery principles</li>
                          <li>Weather considerations for moves</li>
                        </ul>
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-600">{currentModule.content}</p>
                      </div>
                    </div>
                  )}

                  {currentModule.type === "interactive" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Interactive Tutorial: Pasture Assessment</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Learn to evaluate pasture condition using the step-point method.
                        </p>
                        <Button>Start Interactive Tutorial</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Module {selectedPath.modules.indexOf(currentModule) + 1} of {selectedPath.modules.length}
                    </div>
                    <div className="space-x-2">
                      {!currentModule.completed && (
                        <Button onClick={() => {
                          // Mark current module as completed
                          const updatedPath = {
                            ...selectedPath,
                            modules: selectedPath.modules.map(m => 
                              m.id === currentModule.id ? { ...m, completed: true, progress: 100 } : m
                            )
                          };
                          updatedPath.progress = (updatedPath.modules.filter(m => m.completed).length / updatedPath.modules.length) * 100;
                          setSelectedPath(updatedPath);
                          
                          // Also ensure educational tutorials milestone is marked complete
                          const milestones = JSON.parse(localStorage.getItem('cadence-milestones') || '[]');
                          if (!milestones.includes('educational_tutorials_viewed')) {
                            milestones.push('educational_tutorials_viewed');
                            localStorage.setItem('cadence-milestones', JSON.stringify(milestones));
                            
                            // Trigger storage event for workflow widget (use the correct key the widget listens for)
                            window.dispatchEvent(new StorageEvent('storage', {
                              key: 'cadence-completed-milestones',
                              newValue: JSON.stringify(milestones)
                            }));
                          }
                          
                          toast({
                            title: "Module Completed!",
                            description: `You've completed "${currentModule.title}"`
                          });
                        }}>
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module List Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedPath.modules.map((module, index) => (
                    <div 
                      key={module.id} 
                      className={`p-2 rounded cursor-pointer border ${
                        currentModule.id === module.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {module.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className="text-sm font-medium">{index + 1}. {module.title}</span>
                      </div>
                      {!module.completed && module.progress > 0 && (
                        <Progress value={module.progress} className="mt-2 h-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderIntegration = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Learning Integration with Farm Tools</CardTitle>
            <CardDescription>How educational content connects with your farm management tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Assessment Integration</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Learning modules link directly to practical assessment tools for hands-on practice
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Contextual Learning</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tutorials adapt based on your farm data and current challenges
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Smart Recommendations</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI suggests relevant learning content based on performance analytics
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Peer Learning</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect with other farmers working through similar learning paths
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Educational Content & Training
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
          {getTierDescription()}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm">
          <TabsTrigger value="dashboard" className="px-2 py-1 sm:px-3 sm:py-2">Dashboard</TabsTrigger>
          <TabsTrigger value="learning-paths" className="px-2 py-1 sm:px-3 sm:py-2">Learning Paths</TabsTrigger>
          <TabsTrigger value="current-learning" className="px-2 py-1 sm:px-3 sm:py-2">Current Learning</TabsTrigger>
          <TabsTrigger value="integration" className="px-2 py-1 sm:px-3 sm:py-2">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="learning-paths">
          {renderLearningPaths()}
        </TabsContent>

        <TabsContent value="current-learning">
          {renderCurrentLearning()}
        </TabsContent>

        <TabsContent value="integration">
          {renderIntegration()}
        </TabsContent>
      </Tabs>
    </div>
  );
}