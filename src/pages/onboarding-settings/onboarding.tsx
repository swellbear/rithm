import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { insertHerdSchema, insertPaddockSchema } from "@shared/schema";
import { 
  Heart, 
  MapPin, 
  Target, 
  ArrowRight,
  ChevronLeft
} from "lucide-react";

const herdSchema = z.object({
  name: z.string().min(1, "Herd name is required"),
  species: z.enum(["cattle", "sheep", "goats", "horses"]),
  count: z.number().min(1, "Must have at least 1 animal"),
  averageWeight: z.number().min(1, "Average weight is required"),
  breed: z.string().optional(),
  lactating: z.boolean().default(false),
  lactatingCount: z.number().optional(),
}).refine((data) => {
  if (data.lactating && (!data.lactatingCount || data.lactatingCount <= 0)) {
    return false;
  }
  if (data.lactating && data.lactatingCount && data.lactatingCount > data.count) {
    return false;
  }
  return true;
}, {
  message: "Lactating count must be between 1 and total herd count",
  path: ["lactatingCount"]
});

const onboardingSchema = z.object({
  // Multiple herds
  herds: z.array(herdSchema).min(1, "Add at least one herd"),
  
  // Paddock information
  paddockName: z.string().min(1, "Paddock name is required"),
  acreage: z.number().min(0.1, "Acreage must be at least 0.1"),
  pastureType: z.enum(["native", "improved", "mixed"]),
  
  // Goals and preferences
  grazingGoals: z.array(z.string()).min(1, "Select at least one goal"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  region: z.string().min(1, "Region is required for climate data")
});

type OnboardingData = z.infer<typeof onboardingSchema>;

const steps = [
  { id: 'livestock', title: 'Your Livestock', icon: Heart },
  { id: 'paddock', title: 'Your Paddock', icon: MapPin },
  { id: 'goals', title: 'Your Goals', icon: Target }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      herds: [
        {
          name: "",
          species: "cattle" as const,
          count: 1,
          averageWeight: 500,
          breed: "",
          lactating: false,
          lactatingCount: 0
        }
      ],
      paddockName: "",
      acreage: 1,
      pastureType: "mixed" as const,
      grazingGoals: [],
      experienceLevel: "beginner" as const,
      region: ""
    }
  });

  const createHerdMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/herds", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
    },
    onError: (error) => {
      console.error("Herd creation failed:", error);
    }
  });

  const createPaddockMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/paddocks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paddocks"] });
    },
    onError: (error) => {
      console.error("Paddock creation failed:", error);
    }
  });

  const onSubmit = async (data: OnboardingData) => {
    try {
      console.log("Submitting onboarding data:", data);
      
      // Validate form data first
      const validationResult = onboardingSchema.safeParse(data);
      if (!validationResult.success) {
        console.error("Validation failed:", validationResult.error);
        return;
      }

      // Create all herds
      for (const herd of data.herds) {
        const herdData = {
          userId: 1, // Default user for demo
          name: herd.name,
          species: herd.species,
          breed: herd.breed || "Mixed",
          count: herd.count,
          averageWeight: herd.averageWeight.toString(),
          age: getDefaultAge(herd.species).toString(),
          ageUnit: "years",
          sex: "mixed",
          lactating: herd.lactating,
          lactatingCount: herd.lactating ? herd.lactatingCount || 0 : null,
          dmPercent: getDefaultDMPercent(herd.species).toString()
        };
        console.log("Creating herd with data:", herdData);
        await createHerdMutation.mutateAsync(herdData);
        console.log("Herd created successfully");
      }

      // Create paddock
      const paddockData = {
        userId: 1, // Default user for demo
        name: data.paddockName,
        acres: data.acreage.toString(),
        pastureType: data.pastureType,
        currentlyGrazing: true,
        gpsCoordinates: null,
        lastGrazed: null,
        restDays: null
      };
      console.log("Creating paddock with data:", paddockData);
      await createPaddockMutation.mutateAsync(paddockData);
      console.log("Paddock created successfully");

      // Store user preferences in localStorage for now
      localStorage.setItem('userPreferences', JSON.stringify({
        grazingGoals: data.grazingGoals,
        experienceLevel: data.experienceLevel,
        region: data.region,
        onboardingCompleted: true
      }));

      setLocation("/");
    } catch (error) {
      console.error("Onboarding failed:", error);
    }
  };

  const getDefaultDMPercent = (species: string) => {
    switch (species) {
      case "cattle": return 2.5;
      case "sheep": return 3.0;
      case "goats": return 3.5;
      case "horses": return 2.0;
      default: return 2.5;
    }
  };

  const getDefaultAge = (species: string) => {
    switch (species) {
      case "cattle": return 3.0;
      case "sheep": return 2.0;
      case "goats": return 2.5;
      case "horses": return 5.0;
      default: return 3.0;
    }
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof OnboardingData)[] = [];
    
    if (currentStep === 0) {
      fieldsToValidate = ['herds'];
    } else if (currentStep === 1) {
      fieldsToValidate = ['paddockName', 'acreage', 'pastureType'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['grazingGoals', 'experienceLevel', 'region'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    console.log("Step validation:", { currentStep, isValid, errors: form.formState.errors });
    
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const grazingGoalOptions = [
    "Improve pasture health",
    "Increase carrying capacity",
    "Reduce feed costs",
    "Better animal performance",
    "Soil health improvement",
    "Carbon sequestration",
    "Biodiversity enhancement"
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome to Cadence</h1>
          <p className="text-text-secondary">Let's set up your rotational grazing system</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep 
                    ? "bg-primary border-primary text-white" 
                    : "border-gray-300 text-gray-400"
                }`}>
                  <StepIcon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? "bg-primary" : "bg-gray-300"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="w-6 h-6 text-primary" />
                  <span>{currentStepData.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Step 1: Livestock */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    {form.watch('herds').map((_, herdIndex) => (
                      <Card key={herdIndex} className="p-4 border-l-4 border-l-primary">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">
                            {herdIndex === 0 ? "Primary Herd" : `Herd ${herdIndex + 1}`}
                          </h4>
                          {herdIndex > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentHerds = form.getValues('herds');
                                form.setValue('herds', currentHerds.filter((_, i) => i !== herdIndex));
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`herds.${herdIndex}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Herd Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Main Herd" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`herds.${herdIndex}.species`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Livestock Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select livestock type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="cattle">Cattle</SelectItem>
                                    <SelectItem value="sheep">Sheep</SelectItem>
                                    <SelectItem value="goats">Goats</SelectItem>
                                    <SelectItem value="horses">Horses</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`herds.${herdIndex}.count`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Animals</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="25"
                                      min="1"
                                      step="1"
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? '' : e.target.value;
                                        field.onChange(value === '' ? 0 : parseInt(value) || 0);
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value === '' || parseInt(e.target.value) === 0) {
                                          field.onChange(1);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`herds.${herdIndex}.averageWeight`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Average Weight (lbs)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="1200"
                                      min="1"
                                      step="50"
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? '' : e.target.value;
                                        field.onChange(value === '' ? 0 : parseInt(value) || 0);
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value === '' || parseInt(e.target.value) === 0) {
                                          field.onChange(500);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`herds.${herdIndex}.breed`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Breed (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Angus, Holstein, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`herds.${herdIndex}.lactating`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => {
                                      field.onChange(e.target.checked);
                                      // Clear lactating count if unchecked
                                      if (!e.target.checked) {
                                        form.setValue(`herds.${herdIndex}.lactatingCount`, 0);
                                      }
                                    }}
                                    className="h-4 w-4 rounded border border-input"
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Has Lactating Animals</FormLabel>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch(`herds.${herdIndex}.lactating`) && (
                            <FormField
                              control={form.control}
                              name={`herds.${herdIndex}.lactatingCount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Lactating Animals</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="10"
                                      min="1"
                                      step="1"
                                      max={form.watch(`herds.${herdIndex}.count`) || undefined}
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        const value = e.target.value === '' ? '' : e.target.value;
                                        field.onChange(value === '' ? 0 : parseInt(value) || 0);
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value === '' || parseInt(e.target.value) === 0) {
                                          field.onChange(1);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Must be less than or equal to total herd count
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </Card>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentHerds = form.getValues('herds');
                        form.setValue('herds', [
                          ...currentHerds,
                          {
                            name: "",
                            species: "cattle",
                            count: 0,
                            averageWeight: 0,
                            breed: "",
                            lactating: false,
                            lactatingCount: 0
                          }
                        ]);
                      }}
                      className="w-full"
                    >
                      + Add Another Herd
                    </Button>
                  </div>
                )}

                {/* Step 2: Paddock */}
                {currentStep === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="paddockName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paddock Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Front Pasture" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="acreage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size (Acres)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="5.0" 
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? '' : e.target.value;
                                field.onChange(value === '' ? 0 : parseFloat(value) || 0);
                              }}
                              onBlur={(e) => {
                                if (e.target.value === '' || parseFloat(e.target.value) === 0) {
                                  field.onChange(1);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pastureType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pasture Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select pasture type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="native">Native Grasses</SelectItem>
                              <SelectItem value="improved">Improved/Seeded</SelectItem>
                              <SelectItem value="mixed">Mixed Native & Improved</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            This affects yield calculations and species identification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Step 3: Goals */}
                {currentStep === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="grazingGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Grazing Goals</FormLabel>
                          <FormDescription className="mb-4">
                            Select all that apply. This helps tailor recommendations.
                          </FormDescription>
                          <div className="grid grid-cols-1 gap-2">
                            {grazingGoalOptions.map((goal) => (
                              <div
                                key={goal}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  field.value.includes(goal)
                                    ? "border-primary bg-primary/10"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => {
                                  const newValue = field.value.includes(goal)
                                    ? field.value.filter(g => g !== goal)
                                    : [...field.value, goal];
                                  field.onChange(newValue);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">{goal}</span>
                                  {field.value.includes(goal) && (
                                    <Badge variant="secondary" className="text-xs">
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experienceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner - New to rotational grazing</SelectItem>
                              <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                              <SelectItem value="advanced">Advanced - Experienced practitioner</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Affects tutorial complexity and recommendation detail
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Region</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Texas, Northeast, Pacific Northwest" {...field} />
                          </FormControl>
                          <FormDescription>
                            Used for climate-appropriate recommendations
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={nextStep}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={createHerdMutation.isPending || createPaddockMutation.isPending}
                    >
                      {createHerdMutation.isPending || createPaddockMutation.isPending 
                        ? "Setting up..." 
                        : "Complete Setup"
                      }
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}