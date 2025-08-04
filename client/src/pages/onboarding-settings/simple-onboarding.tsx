import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { ArrowRight, MapPin, Users, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "farm",
    title: "Farm Basics",
    description: "Tell us about your farm",
    icon: Target
  },
  {
    id: "location", 
    title: "Location",
    description: "Where is your farm located?",
    icon: MapPin
  },
  {
    id: "livestock",
    title: "Livestock",
    description: "What animals do you raise?",
    icon: Users
  }
];

export default function SimpleOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Form data
  const [farmName, setFarmName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [animalCount, setAnimalCount] = useState("");
  const [notes, setNotes] = useState("");

  const completeMutation = useMutation({
    mutationFn: async () => {
      // Create basic farm profile
      await apiRequest("/api/users/profile", "POST", {
        farmName,
        farmSizeAcres: parseInt(farmSize) || 0,
        zipCode,
        notes
      });

      // Create basic herd if animals specified
      if (animalTypes.length > 0 && animalCount) {
        await apiRequest("/api/herds", "POST", {
          name: `${farmName} Herd`,
          species: animalTypes[0],
          animalCount: parseInt(animalCount) || 0,
          notes: `Animals: ${animalTypes.join(", ")}`
        });
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      navigate("/");
    }
  });

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return farmName.trim() && farmSize.trim();
      case 1: return zipCode.trim();
      case 2: return true; // Optional step
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeMutation.mutate();
    }
  };

  const handleAnimalTypeToggle = (type: string) => {
    setAnimalTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const animalOptions = ["Cattle", "Sheep", "Goats", "Horses", "Pigs"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Farm Setup</h1>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <currentStepData.icon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>{currentStepData.title}</CardTitle>
                <p className="text-gray-600 dark:text-gray-300">
                  {currentStepData.description}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 0: Farm Basics */}
            {currentStep === 0 && (
              <>
                <div>
                  <Label htmlFor="farmName">Farm Name</Label>
                  <Input
                    id="farmName"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g., Green Valley Farm"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="farmSize">Total Farm Size (acres)</Label>
                  <Input
                    id="farmSize"
                    type="number"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="e.g., 50"
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {/* Step 1: Location */}
            {currentStep === 1 && (
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="e.g., 74301"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Used for weather data and regional recommendations
                </p>
              </div>
            )}

            {/* Step 2: Livestock */}
            {currentStep === 2 && (
              <>
                <div>
                  <Label>What animals do you raise? (optional)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {animalOptions.map((animal) => (
                      <Button
                        key={animal}
                        variant={animalTypes.includes(animal) ? "default" : "outline"}
                        onClick={() => handleAnimalTypeToggle(animal)}
                        className="h-12"
                      >
                        {animal}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {animalTypes.length > 0 && (
                  <div>
                    <Label htmlFor="animalCount">Approximate total count</Label>
                    <Input
                      id="animalCount"
                      type="number"
                      value={animalCount}
                      onChange={(e) => setAnimalCount(e.target.value)}
                      placeholder="e.g., 25"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Additional notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any other details about your operation..."
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || completeMutation.isPending}
              >
                {currentStep === ONBOARDING_STEPS.length - 1 
                  ? (completeMutation.isPending ? "Setting up..." : "Complete Setup")
                  : "Next"
                }
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}