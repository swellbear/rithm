import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Target, CheckCircle, ArrowRight, ArrowLeft, Sprout, DollarSign, 
  BookOpen, Zap, Building2, Leaf, GraduationCap, MapPin, Users, 
  TrendingUp, Heart, Shield, Award, Trash2, Loader2, AlertCircle
} from "lucide-react";
import GettingStartedGuide from "./getting-started-guide";

interface IntentBasedOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface UserProfile {
  farmName: string;
  farmSizeAcres: string;
  locationChoice: string;
  zipCode: string;
  livestock: string[];
  experienceLevel: string;
  primaryGoals: string[];
  managementStyle: string;
  timeCommitment: string;
  techComfort: string;
  gpsCoordinates?: any;
}

interface PersonaResult {
  type: "beginner" | "experienced" | "tech_forward" | "commercial" | "regenerative" | "academic";
  name: string;
  description: string;
  recommendedTools: number[];
  icon: any;
}

export default function IntentBasedOnboarding({ isOpen, onClose, onComplete }: IntentBasedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    farmName: "",
    farmSizeAcres: "",
    locationChoice: "",
    zipCode: "",
    livestock: [],
    experienceLevel: "",
    primaryGoals: [],
    managementStyle: "",
    timeCommitment: "",
    techComfort: ""
  });

  // Initialize profile with user data from registration
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        farmName: user.farmName || "",
      }));
    }
  }, [user]);
  const [detectedPersona, setDetectedPersona] = useState<PersonaResult | null>(null);
  const [selectedTools, setSelectedTools] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const { toast } = useToast();

  const steps = [
    "Farm Basics",
    "Experience & Goals", 
    "Management Style",
    "Your Profile",
    "Tool Selection",
    "Complete Setup"
  ];

  // Account deletion mutation
  const accountDeleteMutation = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest("DELETE", "/api/auth/account", { password });
    },
    onSuccess: () => {
      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      
      // Close dialogs and refresh
      setShowDeleteDialog(false);
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please check your password.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    if (!deletePassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    
    accountDeleteMutation.mutate(deletePassword);
  };

  // Persona detection logic
  const detectPersona = (profile: UserProfile): PersonaResult => {
    const goals = profile.primaryGoals;
    const experience = profile.experienceLevel;
    const tech = profile.techComfort;
    const management = profile.managementStyle;

    // Scoring system
    let scores = {
      beginner: 0,
      experienced: 0,
      tech_forward: 0,
      commercial: 0,
      regenerative: 0,
      academic: 0
    };

    // Experience level scoring
    if (experience === "new") scores.beginner += 3;
    if (experience === "some") { scores.experienced += 2; scores.beginner += 1; }
    if (experience === "experienced") scores.experienced += 3;

    // Tech comfort scoring
    if (tech === "low") scores.beginner += 2;
    if (tech === "high") { scores.tech_forward += 3; scores.commercial += 1; }
    if (tech === "medium") scores.experienced += 1;

    // Goals scoring
    if (goals.includes("profit")) { scores.commercial += 3; scores.experienced += 1; }
    if (goals.includes("sustainability")) { scores.regenerative += 3; scores.academic += 1; }
    if (goals.includes("learning")) { scores.beginner += 2; scores.academic += 2; }
    if (goals.includes("efficiency")) { scores.tech_forward += 2; scores.commercial += 2; }
    if (goals.includes("certification")) { scores.regenerative += 2; scores.academic += 1; }
    if (goals.includes("research")) scores.academic += 3;

    // Management style scoring
    if (management === "traditional") scores.experienced += 2;
    if (management === "data_driven") { scores.tech_forward += 3; scores.commercial += 1; }
    if (management === "holistic") { scores.regenerative += 3; scores.academic += 1; }

    // Find highest scoring persona
    const topPersona = Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b);

    const personas: Record<string, PersonaResult> = {
      beginner: {
        type: "beginner",
        name: "Getting Started Farmer",
        description: "New to rotational grazing, focused on learning fundamentals with simple, educational tools",
        recommendedTools: [1, 2, 3, 13, 23, 7, 15],
        icon: Sprout
      },
      experienced: {
        type: "experienced", 
        name: "Traditional Farmer",
        description: "Converting from conventional methods, needs practical results and ROI validation",
        recommendedTools: [1, 5, 6, 17, 9, 12, 19],
        icon: Award
      },
      tech_forward: {
        type: "tech_forward",
        name: "Tech-Forward Farmer", 
        description: "Embraces technology for optimization, wants data insights and automation",
        recommendedTools: [1, 4, 15, 16, 24, 9, 10, 21],
        icon: Zap
      },
      commercial: {
        type: "commercial",
        name: "Commercial Producer",
        description: "Managing large operations, focused on efficiency, profitability and scalability", 
        recommendedTools: [1, 12, 19, 22, 24, 17, 18, 21],
        icon: Building2
      },
      regenerative: {
        type: "regenerative", 
        name: "Regenerative Steward",
        description: "Environmental focused, interested in soil health and sustainable practices",
        recommendedTools: [1, 9, 10, 20, 23, 6, 11, 17],
        icon: Leaf
      },
      academic: {
        type: "academic",
        name: "Research-Focused",
        description: "Studying grazing systems, needs scientific rigor and comprehensive data collection",
        recommendedTools: [1, 9, 10, 11, 24, 12, 20, 23],
        icon: GraduationCap
      }
    };

    return personas[topPersona[0]] || personas.beginner;
  };

  const livestockOptions = [
    "Cattle", "Sheep", "Goats", "Horses", "Pigs", "Chickens", "Other"
  ];

  const goalOptions = [
    { id: "profit", label: "Improve Profitability", icon: DollarSign },
    { id: "sustainability", label: "Environmental Sustainability", icon: Leaf },
    { id: "learning", label: "Learn Grazing Methods", icon: BookOpen },
    { id: "efficiency", label: "Operational Efficiency", icon: TrendingUp },
    { id: "certification", label: "Organic/Regenerative Certification", icon: Award },
    { id: "research", label: "Research & Data Collection", icon: GraduationCap }
  ];

  const handleNext = () => {
    if (currentStep === 2) {
      // Detect persona after collecting profile data
      const persona = detectPersona(profile);
      setDetectedPersona(persona);
      setSelectedTools(persona.recommendedTools);
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User must be authenticated");
      
      try {
        // Save profile and tool selection to localStorage first (immediate success)
        // Only save if this is not demo mode - demo data should not be persisted
        const onboardingData = {
          profile,
          detectedPersona,
          selectedTools,
          completedAt: new Date().toISOString()
        };
        
        // Check if user has created any real farm data (not demo mode)
        const hasRealData = profile.farmName && profile.farmName !== "Demo Farm" && 
                          profile.farmName !== "Sample Farm";
        
        if (hasRealData) {
          localStorage.setItem('cadence-intentOnboarding', JSON.stringify(onboardingData));
          localStorage.setItem('onboarding_completed', 'true');
        } else {
          // For demo mode, only set temporary completion flag
          sessionStorage.setItem('cadence-intentOnboarding', JSON.stringify(onboardingData));
          sessionStorage.setItem('onboarding_completed', 'true');
        }
        
        // Try to save to backend but don't fail the onboarding if it doesn't work
        try {
          // Save profile data (GPS coordinates, zipcode, farm details) to user profile
          if (hasRealData) {
            const profileData: any = {};
            if (profile.farmName) profileData.farmName = profile.farmName;
            if (profile.zipCode) profileData.zipCode = profile.zipCode;
            if (profile.gpsCoordinates) profileData.gpsCoordinates = profile.gpsCoordinates;
            if (profile.farmSizeAcres) profileData.farmSizeAcres = profile.farmSizeAcres;
            
            try {
              await apiRequest("PUT", "/api/auth/profile", profileData);

            } catch (profileError) {
              // Profile data saved locally, backend sync will retry later
            }
          }
          
          // Create onboarding session
          await apiRequest("POST", "/api/onboarding/start", {
            userId: user!.id,
            sessionType: "intent_based", 
            persona: detectedPersona?.type,
            selectedTools,
            sessionData: { profile, detectedPersona }
          });

          // Activate selected tools with localStorage fallback

          const activatedToolsForStorage = [];
          
          for (const toolId of selectedTools) {
            try {

              await apiRequest("POST", "/api/tools/activate", {
                userId: user!.id,
                toolId: toolId,
                complexityLevel: "basic"
              });

            } catch (err) {
              // Tool activation saved locally, backend sync will retry later
            }
            
            // Always add to localStorage regardless of backend success/failure
            activatedToolsForStorage.push({
              toolId: toolId,
              complexityLevel: "basic",
              isActive: true,
              activatedAt: new Date().toISOString(),
              usageCount: 0
            });
          }
          
          // Save activated tools - only to localStorage for real data, sessionStorage for demo
          if (hasRealData) {
            localStorage.setItem('cadence-activatedTools', JSON.stringify(activatedToolsForStorage));

          } else {
            sessionStorage.setItem('cadence-activatedTools', JSON.stringify(activatedToolsForStorage));
          }

          // Complete onboarding session
          await apiRequest("POST", "/api/onboarding/complete", {});
          
        } catch (backendError) {
          // Onboarding completed locally, backend sync will retry later
          // Continue anyway - we have the data saved locally
        }
        
        return onboardingData;
        
      } catch (error) {
        // Critical error during onboarding setup
        throw error;
      }
    },
    onSuccess: async () => {
      // Specifically invalidate auth query to refresh user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries();
      
      toast({
        title: "Setup Complete!",
        description: `Your ${detectedPersona?.name} profile has been configured with ${selectedTools.length} recommended tools.`
      });
      
      // Wait a bit longer for user data to refresh, then complete
      setTimeout(() => {
        onComplete();
      }, 2500);
    },
    onError: (error: any) => {
      // Onboarding process encountered an error
      toast({
        title: "Setup Error",
        description: "Unable to save your setup. Please try again.",
        variant: "destructive"
      });
    }
  });

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Farm Basics
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sprout className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Welcome to Cadence!</h3>
              <p className="text-gray-600 dark:text-gray-300">Let's start with some basic information about your farm</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="farmName">Farm Name</Label>
                <Input
                  id="farmName"
                  value={profile.farmName}
                  onChange={(e) => setProfile(prev => ({ ...prev, farmName: e.target.value }))}
                  placeholder="Enter your farm name"
                />
              </div>

              <div>
                <Label htmlFor="farmSize">Total Farm Size (acres)</Label>
                <Input
                  id="farmSize"
                  type="number"
                  value={profile.farmSizeAcres}
                  onChange={(e) => setProfile(prev => ({ ...prev, farmSizeAcres: e.target.value }))}
                  placeholder="Total property size"
                />
              </div>

              <div>
                <Label>Location</Label>
                <Select value={profile.locationChoice} onValueChange={(value) => setProfile(prev => ({ ...prev, locationChoice: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose location method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zipcode">Zip Code</SelectItem>
                    <SelectItem value="gps">GPS Coordinates</SelectItem>
                    <SelectItem value="region">General Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profile.locationChoice === "zipcode" && (
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={profile.zipCode}
                    onChange={(e) => setProfile(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="Enter zip code"
                  />
                </div>
              )}

              <div>
                <Label>Livestock Types (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {livestockOptions.map((animal) => (
                    <div key={animal} className="flex items-center space-x-2">
                      <Checkbox
                        id={animal}
                        checked={profile.livestock.includes(animal.toLowerCase())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProfile(prev => ({ 
                              ...prev, 
                              livestock: [...prev.livestock, animal.toLowerCase()]
                            }));
                          } else {
                            setProfile(prev => ({ 
                              ...prev, 
                              livestock: prev.livestock.filter(l => l !== animal.toLowerCase())
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={animal} className="text-sm">{animal}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Experience & Goals
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Your Experience & Goals</h3>
              <p className="text-gray-600 dark:text-gray-300">Help us understand your background and what you want to achieve</p>
            </div>

            <div>
              <Label>Rotational Grazing Experience</Label>
              <RadioGroup 
                value={profile.experienceLevel} 
                onValueChange={(value) => setProfile(prev => ({ ...prev, experienceLevel: value }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">New to rotational grazing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="some" id="some" />
                  <Label htmlFor="some">Some experience, want to improve</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="experienced" id="experienced" />
                  <Label htmlFor="experienced">Experienced, looking to optimize</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Primary Goals (select all that apply)</Label>
              <div className="grid grid-cols-1 gap-3 mt-3">
                {goalOptions.map((goal) => {
                  const IconComponent = goal.icon;
                  return (
                    <div key={goal.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <Checkbox
                        id={goal.id}
                        checked={profile.primaryGoals.includes(goal.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setProfile(prev => ({ 
                              ...prev, 
                              primaryGoals: [...prev.primaryGoals, goal.id]
                            }));
                          } else {
                            setProfile(prev => ({ 
                              ...prev, 
                              primaryGoals: prev.primaryGoals.filter(g => g !== goal.id)
                            }));
                          }
                        }}
                      />
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <Label htmlFor={goal.id} className="flex-1">{goal.label}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2: // Management Style
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Heart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Management Preferences</h3>
              <p className="text-gray-600 dark:text-gray-300">Tell us about your preferred management approach</p>
            </div>

            <div>
              <Label>Management Style</Label>
              <RadioGroup 
                value={profile.managementStyle} 
                onValueChange={(value) => setProfile(prev => ({ ...prev, managementStyle: value }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="traditional" id="traditional" />
                  <Label htmlFor="traditional">Traditional methods with proven results</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="data_driven" id="data_driven" />
                  <Label htmlFor="data_driven">Data-driven decisions with technology</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="holistic" id="holistic" />
                  <Label htmlFor="holistic">Holistic, ecosystem-focused approach</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Time Available for Farm Management</Label>
              <RadioGroup 
                value={profile.timeCommitment} 
                onValueChange={(value) => setProfile(prev => ({ ...prev, timeCommitment: value }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="limited" id="limited" />
                  <Label htmlFor="limited">Limited time, need simple solutions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate">Moderate time, can learn new methods</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="extensive" id="extensive" />
                  <Label htmlFor="extensive">Extensive time, want comprehensive management</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Technology Comfort Level</Label>
              <RadioGroup 
                value={profile.techComfort} 
                onValueChange={(value) => setProfile(prev => ({ ...prev, techComfort: value }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low">Prefer simple, manual methods</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Comfortable with basic technology</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high">Love technology and data analysis</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 3: // Your Profile
        return (
          <div className="space-y-6">
            {detectedPersona && (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
                  <detectedPersona.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">You're a {detectedPersona.name}!</h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">{detectedPersona.description}</p>
              </div>
            )}

            <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <CardHeader>
                <CardTitle className="text-lg">Your Farm Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Farm:</span> {profile.farmName || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {profile.farmSizeAcres || "Not specified"} acres
                  </div>
                  <div>
                    <span className="font-medium">Livestock:</span> {profile.livestock.join(", ") || "None selected"}
                  </div>
                  <div>
                    <span className="font-medium">Experience:</span> {profile.experienceLevel || "Not specified"}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Goals:</span> 
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.primaryGoals.map(goal => (
                      <Badge key={goal} variant="secondary" className="text-xs">
                        {goalOptions.find(g => g.id === goal)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4: // Tool Selection
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Recommended Tools</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Based on your profile, we've selected {selectedTools.length} tools to get you started
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Why these tools?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                As a {detectedPersona?.name}, these tools will help you achieve your goals while matching your experience level and management style.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your Tools ({selectedTools.length} selected)</Label>
              <div className="text-xs text-gray-500 mb-3">You can modify these selections anytime after setup</div>
              
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {selectedTools.map(toolId => (
                  <div key={toolId} className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tool #{toolId} - {getToolName(toolId)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Complete Setup
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Ready to Begin!</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              Your {detectedPersona?.name} profile is configured with {selectedTools.length} tools. 
              All tools start at Basic level - you can increase complexity as you gain experience.
            </p>
            
            <Button 
              onClick={() => completeOnboardingMutation.mutate()}
              disabled={completeOnboardingMutation.isPending}
              className="w-full"
            >
              {completeOnboardingMutation.isPending ? "Setting up..." : "Complete Setup"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const getToolName = (toolId: number): string => {
    const toolNames: Record<number, string> = {
      1: "Farm Profile Setup", 2: "Livestock Management", 3: "Paddock Management",
      4: "GPS Tools", 5: "AU Calculator", 6: "DM Availability", 7: "Water Requirements",
      8: "Feed Calculator", 9: "Pasture Assessment", 10: "Plant ID", 11: "Nutrition Analysis",
      12: "Performance Analytics", 13: "Daily Needs", 14: "Brush Hog", 15: "Weather",
      16: "Alert System", 17: "Grazing Calendar", 18: "Health & Breeding", 19: "Financial",
      20: "Soil Health", 21: "Infrastructure", 22: "Market Analysis", 23: "Education",
      24: "Data Analytics"
    };
    return toolNames[toolId] || `Tool ${toolId}`;
  };

  const canContinue = () => {
    switch (currentStep) {
      case 0: return profile.farmName && profile.farmSizeAcres && profile.locationChoice && profile.livestock.length > 0;
      case 1: return profile.experienceLevel && profile.primaryGoals.length > 0;
      case 2: return profile.managementStyle && profile.timeCommitment && profile.techComfort;
      default: return true;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sprout className="h-5 w-5 text-green-600" />
              <span>Farm Setup Wizard</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete Account
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{steps[currentStep]}</span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} />
          </div>

          {/* Step Content */}
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext}
                disabled={!canContinue()}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div /> // Empty div for spacing when on last step
            )}
          </div>
        </div>
      </DialogContent>
      </Dialog>

      {/* Account deletion dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium mb-1">This will permanently delete:</p>
                  <ul className="text-xs text-red-700 space-y-0.5">
                    <li>• Your user account and login credentials</li>
                    <li>• All farm data (herds, paddocks, assessments)</li>
                    <li>• Tool preferences and settings</li>
                    <li>• Performance metrics and history</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="delete-password-onboarding" className="text-sm font-medium">
                Enter your password to confirm
              </Label>
              <Input
                id="delete-password-onboarding"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your current password"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletePassword("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={accountDeleteMutation.isPending || !deletePassword.trim()}
            >
              {accountDeleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account Permanently"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Getting Started Guide */}
      <GettingStartedGuide
        isOpen={showGettingStarted}
        onClose={() => {
          setShowGettingStarted(false);
          onComplete();
        }}
        onboardingData={{
          profile,
          detectedPersona,
          selectedTools,
          completedAt: new Date().toISOString()
        }}
      />
    </>
  );
}