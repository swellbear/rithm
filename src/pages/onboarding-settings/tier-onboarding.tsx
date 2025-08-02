import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, Building2, Factory, Users, TreePine, Tractor,
  DollarSign, Leaf, GraduationCap, TrendingUp, Heart, MapPin
} from "lucide-react";

type FarmTier = "basic" | "small_business" | "enterprise";

// Tier detection questions
const TIER_QUESTIONS = {
  size: {
    title: "How many acres do you manage?",
    options: [
      { value: "small", label: "Under 50 acres", tier: "basic" as FarmTier },
      { value: "medium", label: "50-500 acres", tier: "small_business" as FarmTier },
      { value: "large", label: "Over 500 acres", tier: "enterprise" as FarmTier }
    ]
  },
  animals: {
    title: "How many animals do you have?",
    options: [
      { value: "few", label: "Under 50 animals", tier: "basic" as FarmTier },
      { value: "moderate", label: "50-500 animals", tier: "small_business" as FarmTier },
      { value: "many", label: "Over 500 animals", tier: "enterprise" as FarmTier }
    ]
  },
  business: {
    title: "What best describes your operation?",
    options: [
      { value: "homestead", label: "Family homestead", tier: "basic" as FarmTier, icon: Home },
      { value: "business", label: "Small farm business", tier: "small_business" as FarmTier, icon: Building2 },
      { value: "commercial", label: "Commercial operation", tier: "enterprise" as FarmTier, icon: Factory }
    ]
  },
  team: {
    title: "Who manages the farm?",
    options: [
      { value: "individual", label: "Just me/my family", tier: "basic" as FarmTier },
      { value: "small_team", label: "2-5 people", tier: "small_business" as FarmTier },
      { value: "large_team", label: "6+ people or hired help", tier: "enterprise" as FarmTier }
    ]
  },
  goals: {
    title: "What's your primary goal?",
    options: [
      { value: "self_sufficiency", label: "Self-sufficiency", tier: "basic" as FarmTier, icon: Heart },
      { value: "local_sales", label: "Local sales & farmers markets", tier: "small_business" as FarmTier, icon: DollarSign },
      { value: "scale", label: "Scale & optimize operations", tier: "enterprise" as FarmTier, icon: TrendingUp }
    ]
  }
};

// Tier descriptions
const TIER_INFO = {
  basic: {
    title: "Basic / Homesteader",
    description: "Perfect for family farms and homesteads",
    features: [
      "Simple daily workflows",
      "Essential tools only",
      "Easy to learn interface",
      "Focus on basics"
    ],
    icon: Home,
    color: "text-green-600"
  },
  small_business: {
    title: "Small Business",
    description: "Ideal for growing farm businesses",
    features: [
      "Business management tools",
      "Market integration",
      "Performance tracking",
      "Some automation"
    ],
    icon: Building2,
    color: "text-blue-600"
  },
  enterprise: {
    title: "Enterprise",
    description: "Complete suite for commercial operations",
    features: [
      "Advanced analytics",
      "Team collaboration",
      "Full automation",
      "Enterprise reporting"
    ],
    icon: Factory,
    color: "text-purple-600"
  }
};

export default function TierOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(0);
  const [farmName, setFarmName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [detectedTier, setDetectedTier] = useState<FarmTier | null>(null);

  const updateUser = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save farm information",
        variant: "destructive"
      });
    }
  });

  const calculateTier = () => {
    // Count tier votes from answers
    const tierVotes: Record<FarmTier, number> = {
      basic: 0,
      small_business: 0,
      enterprise: 0
    };

    Object.entries(TIER_QUESTIONS).forEach(([key, question]) => {
      const answer = answers[key];
      const option = question.options.find(opt => opt.value === answer);
      if (option?.tier) {
        tierVotes[option.tier]++;
      }
    });

    // Determine tier based on majority
    let selectedTier: FarmTier = "basic";
    let maxVotes = 0;
    
    Object.entries(tierVotes).forEach(([tier, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        selectedTier = tier as FarmTier;
      }
    });

    // Special rules for tier bumping
    if (answers.size === "large" || answers.animals === "many") {
      selectedTier = "enterprise";
    } else if (answers.business === "commercial" || answers.team === "large_team") {
      selectedTier = "enterprise";
    } else if (answers.size === "medium" && answers.business === "business") {
      selectedTier = "small_business";
    }

    return selectedTier;
  };

  const handleAnswer = (questionKey: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionKey]: value }));
  };

  const handleNext = () => {
    const questions = Object.keys(TIER_QUESTIONS);
    
    if (step === 0 && farmName) {
      setStep(1);
    } else if (step <= questions.length) {
      if (step === questions.length) {
        // Calculate tier after all questions answered
        const tier = calculateTier();
        setDetectedTier(tier);
      }
      setStep(step + 1);
    }
  };

  const handleComplete = () => {
    updateUser.mutate({
      farmName,
      farmTier: detectedTier,
      onboardingCompleted: true,
      ...answers
    });
  };

  // Welcome screen
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Cadence</CardTitle>
            <CardDescription>
              Let's set up your farm in just a few questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="farmName">What's your farm called?</Label>
              <Input
                id="farmName"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g., Green Acres Farm"
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleNext} 
              disabled={!farmName}
              className="w-full"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Questions
  const questions = Object.entries(TIER_QUESTIONS);
  if (step > 0 && step <= questions.length) {
    const [questionKey, question] = questions[step - 1];
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="text-sm text-gray-500 mb-2">
              Question {step} of {questions.length}
            </div>
            <CardTitle>{question.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[questionKey] || ""}
              onValueChange={(value) => handleAnswer(questionKey, value)}
              className="space-y-3"
            >
              {question.options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => handleAnswer(questionKey, option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label 
                    htmlFor={option.value} 
                    className="flex-1 cursor-pointer flex items-center gap-2"
                  >
                    {'icon' in option && option.icon && <option.icon className="h-4 w-4" />}
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button
              onClick={handleNext}
              disabled={!answers[questionKey]}
              className="w-full mt-6"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tier result
  if (detectedTier) {
    const tierInfo = TIER_INFO[detectedTier];
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className={`p-4 rounded-full bg-gray-100 dark:bg-gray-800 ${tierInfo.color}`}>
                <tierInfo.icon className="h-12 w-12" />
              </div>
            </div>
            <CardTitle className="text-2xl">Perfect Match!</CardTitle>
            <CardDescription>
              Based on your answers, we recommend:
            </CardDescription>
            <Badge className="mx-auto mt-2" variant="secondary">
              {tierInfo.title}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                {tierInfo.description}
              </p>
              <div className="space-y-2">
                {tierInfo.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleComplete}
              disabled={updateUser.isPending}
              className="w-full"
            >
              {updateUser.isPending ? "Setting up..." : "Start Using Cadence"}
            </Button>
            
            <div className="text-center">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Change my answers
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}