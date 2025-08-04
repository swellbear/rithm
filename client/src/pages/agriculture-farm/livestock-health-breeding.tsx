import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Heart, Calendar, Activity, TrendingUp, AlertTriangle, 
  Plus, Edit, Eye, Bell, Clipboard, Stethoscope,
  Baby, Users, Dna, BarChart3, FileText, Camera,
  ArrowRight, Scale, X
} from "lucide-react";
import { SmartWorkflowHandoffs } from "@/components/smart-workflow-handoffs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWorkflowProgress } from "@/hooks/useWorkflowProgress";
import { useSmartTaskCompletion } from "@/hooks/useSmartTaskCompletion";
import { useMilestoneSync } from "@/hooks/useMilestoneSync";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { getAnimalAgeInfo, AgeInfo } from "@/lib/age-calculations";

interface HealthRecord {
  id: string;
  animalId: string;
  recordType: "vaccination" | "treatment" | "examination" | "injury" | "illness" | "medication";
  date: Date;
  condition: string;
  treatment: string;
  veterinarian?: string;
  cost?: number;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  severity: "low" | "medium" | "high" | "critical";
}

interface BreedingRecord {
  id: string;
  femaleId: string;
  maleId?: string;
  breedingDate: Date;
  method: "natural" | "artificial" | "embryo_transfer";
  expectedDueDate: Date;
  actualBirthDate?: Date;
  pregnancyConfirmed: boolean;
  pregnancyCheckDate?: Date;
  complications?: string;
  offspring?: string[];
  success: boolean;
}

interface HealthMetrics {
  animalId: string;
  date: Date;
  weight: number;
  bodyConditionScore: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  notes: string;
}

interface VaccinationSchedule {
  id: string;
  vaccineName: string;
  species: string[];
  ageRequirement: string;
  frequency: string;
  season?: string;
  required: boolean;
  cost: number;
  notes: string;
}

interface GeneticAnalysis {
  animalId: string;
  traits: {
    growthRate: number;
    feedEfficiency: number;
    diseaseResistance: number;
    reproductivePerformance: number;
    meatQuality?: number;
    milkProduction?: number;
  };
  inbreedingCoefficient: number;
  breedingValue: number;
  geneticDefects: string[];
  recommendations: string[];
}

interface UpcomingTask {
  id: string;
  type: string;
  animalId: string;
  animalName: string;
  task: string;
  dueDate: Date;
  priority: string;
  cost: number;
}

export default function LivestockHealthBreeding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { addMilestoneCompletion } = useMilestoneSync();
  const { toast } = useToast();
  
  // Auto-set complexity based on subscription tier  
  const complexityLevel = user?.farmTier === 'enterprise' ? 'advanced' : 
                         user?.farmTier === 'small_business' ? 'intermediate' : 'basic';
  const [selectedAnimal, setSelectedAnimal] = useState<string>("");
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics[]>([]);
  const [newHealthRecord, setNewHealthRecord] = useState<Partial<HealthRecord>>({});
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<any>(null);
  const [newAnimal, setNewAnimal] = useState({
    name: "",
    species: "",
    breed: "",
    earTagNumber: "",
    weight: "",
    birthDate: "",
    sex: "",
    acquisitionDate: "",
    acquisitionCost: "",
    notes: "",
    photoUrl: ""
  });

  // Track if user has dismissed the auto-population info card
  const [showAutoPopulationInfo, setShowAutoPopulationInfo] = useState(() => {
    return localStorage.getItem('cadence-showAutoPopulationInfo') !== 'false';
  });

  // Weight tracking state
  const [newWeightRecord, setNewWeightRecord] = useState({
    animalId: "overall",
    weight: "",
    bodyConditionScore: "",
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });

  // Mixed herd weight tracking state
  const [mixedHerdWeights, setMixedHerdWeights] = useState<Record<string, {weight: string, bodyConditionScore: string, notes: string}>>({});


  const { updateWorkflowStep } = useWorkflowProgress();
  const [isInWorkflow, setIsInWorkflow] = useState(false);
  const {
    trackHealthRecordsViewed,
    trackWaterCalculated,
    trackConditionsAssessed,
    getTaskProgress
  } = useSmartTaskCompletion();

  // Fetch farm data
  const { data: animals = [] } = useQuery<any[]>({ queryKey: ["/api/animals"] });

  // Action-based completion tracking - only mark complete when user actually performs actions
  const hasTrackedHealthViewed = useRef(false);
  useEffect(() => {
    // Only mark health records as viewed when user actually views the health tab or health data (once)
    if ((animals.length > 0 || healthRecords.length > 0) && !hasTrackedHealthViewed.current) {
      console.log('User has viewed actual health data - marking health records as viewed');
      trackHealthRecordsViewed();
      hasTrackedHealthViewed.current = true;
    }
  }, [animals.length, healthRecords.length, trackHealthRecordsViewed]);
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: birthRecords = [] } = useQuery<any[]>({ queryKey: ["/api/birth-records"] });

  // Health alert settings API integration
  const { data: healthAlertSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/health-alert-settings"],
    queryFn: async () => {
      const response = await fetch("/api/health-alert-settings?userId=1");
      if (!response.ok) throw new Error("Failed to fetch health alert settings");
      return response.json();
    }
  });

  // Helper function to get selected herd details (defined after herds query)
  const getSelectedHerd = () => {
    if (newWeightRecord.animalId === "overall" || newWeightRecord.animalId === "custom") return null;
    return herds.find((herd: any) => herd.name === newWeightRecord.animalId);
  };

  // Check if selected herd has mixed composition (defined after herds query)
  const selectedHerd = getSelectedHerd();
  const isMixedHerd = selectedHerd && typeof selectedHerd.composition === 'object' && Array.isArray(selectedHerd.composition) && selectedHerd.composition.length > 1;

  // Function to handle adding weight records (defined after herds query)
  const addWeightRecord = () => {
    // For mixed herds, validate each species has required data
    if (isMixedHerd) {
      const selectedHerdComposition = selectedHerd.composition;
      const missingData = selectedHerdComposition.some((comp: any) => {
        const speciesData = mixedHerdWeights[comp.species];
        return !speciesData?.weight || !speciesData?.bodyConditionScore;
      });

      if (missingData) {
        toast({
          title: "Missing Information",
          description: "Please enter weight and body condition score for all livestock types in this herd.",
          variant: "destructive"
        });
        return;
      }

      // Create separate records for each species in mixed herd
      const newRecords: HealthMetrics[] = selectedHerdComposition.map((comp: any) => {
        const speciesData = mixedHerdWeights[comp.species];
        return {
          animalId: `${selectedHerd.name} - ${comp.species}`,
          date: new Date(newWeightRecord.date),
          weight: parseFloat(speciesData.weight),
          bodyConditionScore: parseFloat(speciesData.bodyConditionScore),
          notes: speciesData.notes || ""
        };
      });

      setHealthMetrics(prev => [...prev, ...newRecords]);
      
      toast({
        title: "Weight Records Added",
        description: `Added weight records for ${selectedHerdComposition.length} livestock types in ${selectedHerd.name}.`
      });

      // Reset mixed herd weights
      setMixedHerdWeights({});
    } else {
      // Single herd or overall tracking
      if (!newWeightRecord.weight || !newWeightRecord.bodyConditionScore) {
        toast({
          title: "Missing Information",
          description: "Please enter both weight and body condition score.",
          variant: "destructive"
        });
        return;
      }

      const record: HealthMetrics = {
        animalId: newWeightRecord.animalId === "overall" ? "herd-average" : newWeightRecord.animalId,
        date: new Date(newWeightRecord.date),
        weight: parseFloat(newWeightRecord.weight),
        bodyConditionScore: parseFloat(newWeightRecord.bodyConditionScore),
        notes: newWeightRecord.notes
      };

      setHealthMetrics(prev => [...prev, record]);
      
      toast({
        title: "Weight Record Added",
        description: "Weight and body condition data has been successfully recorded."
      });
    }
    
    // Mark weight tracking task as complete using milestone system
    localStorage.setItem('cadence-weight_tracking_started', 'true');
    addMilestoneCompletion('weight_tracking_started');

    // Reset form
    setNewWeightRecord({
      animalId: "overall",
      weight: "",
      bodyConditionScore: "",
      notes: "",
      date: new Date().toISOString().split('T')[0]
    });

    // Trigger storage event for workflow widget
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cadence-weight_tracking_started',
      newValue: 'true'
    }));
  };

  const updateHealthAlertSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch("/api/health-alert-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1, ...settings })
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-alert-settings"] });
      // Mark alert configuration as completed for Getting Started Assistant
      localStorage.setItem('cadence-alertsConfigured', 'true');
      toast({
        title: "Settings Updated",
        description: "Health alert settings have been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update health alert settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateHealthAlertSettings = (newSettings: any) => {
    updateHealthAlertSettingsMutation.mutate(newSettings);
  };

  // Mutation for creating animals
  const createAnimalMutation = useMutation({
    mutationFn: async (animalData: any) => {
      const response = await fetch("/api/animals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(animalData),
      });
      if (!response.ok) {
        throw new Error("Failed to create animal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      setShowAddAnimal(false);
      setNewAnimal({
        name: "",
        species: "",
        breed: "",
        earTagNumber: "",
        weight: "",
        birthDate: "",
        sex: "",
        acquisitionDate: "",
        acquisitionCost: "",
        notes: "",
        photoUrl: ""
      });
      
      // Track that user has successfully added their first animal
      console.log('Animal added successfully - this completes "Add Your First Herd" task');
      // This will trigger the milestone detection through the animals.length > 0 check
      
      toast({
        title: "Success",
        description: "Animal added successfully! First herd task completed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add livestock. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Animal update mutation
  const updateAnimalMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/animals/${data.id}`, data.updates);
      if (!response.ok) {
        throw new Error("Failed to update animal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      setEditingAnimal(null);
      toast({
        title: "Success",
        description: "Animal updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to update animal. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Photo upload handler
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setNewAnimal(prev => ({ ...prev, photoUrl: base64String }));
      toast({
        title: "Photo uploaded",
        description: "Animal photo has been added successfully.",
      });
    };

    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    };

    reader.readAsDataURL(file);
  };

  // Photo upload handler for editing animals
  const handleEditPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setEditingAnimal((prev: any) => ({ ...prev, photoUrl: base64String }));
      toast({
        title: "Photo updated",
        description: "Animal photo has been updated successfully.",
      });
    };

    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive"
      });
    };

    reader.readAsDataURL(file);
  };

  // Mock vaccination schedules
  const vaccinationSchedules: VaccinationSchedule[] = [
    {
      id: "bvd_vaccine",
      vaccineName: "BVD (Bovine Viral Diarrhea)",
      species: ["cattle"],
      ageRequirement: "4-6 months",
      frequency: "Annual",
      season: "Spring",
      required: true,
      cost: 8.50,
      notes: "Essential for reproductive health"
    },
    {
      id: "clostridial",
      vaccineName: "7-Way Clostridial",
      species: ["cattle", "sheep", "goats"],
      ageRequirement: "2-3 months",
      frequency: "Annual",
      required: true,
      cost: 12.00,
      notes: "Protects against tetanus, blackleg, and other clostridial diseases"
    },
    {
      id: "rabies",
      vaccineName: "Rabies",
      species: ["cattle", "sheep", "goats", "horses"],
      ageRequirement: "3 months",
      frequency: "Annual",
      season: "Spring",
      required: false,
      cost: 15.00,
      notes: "Recommended in areas with wildlife exposure"
    }
  ];

  useEffect(() => {
    // Only calculate tasks if we have real animals
    if (animals.length > 0) {
      calculateUpcomingTasks();
    } else {
      // Clear all data when no animals exist
      setHealthRecords([]);
      setBreedingRecords([]);
      setHealthMetrics([]);
      setUpcomingTasks([]);
    }
  }, [animals]);

  // Removed generateMockData - only show real data when it exists

  const handleAddAnimal = () => {
    // Only require species - all other fields are optional
    if (!newAnimal.species) {
      toast({
        title: "Missing Information",
        description: "Please select a species for the animal.",
        variant: "destructive"
      });
      return;
    }

    // Generate default ear tag if not provided
    const defaultEarTag = newAnimal.earTagNumber || `${newAnimal.species.toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const animalData = {
      name: newAnimal.name || null,
      species: newAnimal.species,
      breed: newAnimal.breed || null,
      earTagNumber: defaultEarTag,
      weight: newAnimal.weight ? parseFloat(newAnimal.weight) : null,
      birthDate: newAnimal.birthDate ? new Date(newAnimal.birthDate) : null,
      sex: newAnimal.sex || null,
      acquisitionDate: newAnimal.acquisitionDate ? new Date(newAnimal.acquisitionDate) : new Date(),
      acquisitionCost: newAnimal.acquisitionCost ? parseFloat(newAnimal.acquisitionCost) : null,
      notes: newAnimal.notes || null,
      userId: 1 // Default user ID
    };

    createAnimalMutation.mutate(animalData);
  };

  const calculateUpcomingTasks = () => {
    const tasks: UpcomingTask[] = [];
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check for upcoming vaccinations (only if vaccination alerts enabled)
    if (healthAlertSettings?.enableVaccinationAlerts) {
      animals.forEach(animal => {
        vaccinationSchedules.forEach(vaccine => {
          if (vaccine.species.includes(animal.species)) {
            tasks.push({
              id: `vac_${animal.id}_${vaccine.id}`,
              type: "vaccination",
              animalId: animal.id,
              animalName: animal.earTagNumber || `Animal ${animal.id}`,
              task: `${vaccine.vaccineName} Vaccination`,
              dueDate: new Date(now.getTime() + (healthAlertSettings?.alertLeadTime || 30) * 24 * 60 * 60 * 1000),
              priority: vaccine.required ? "high" : "medium",
              cost: vaccine.cost
            });
          }
        });
      });
    }

    // Check for breeding follow-ups (only if pregnancy alerts enabled)
    if (healthAlertSettings?.enablePregnancyAlerts) {
      breedingRecords.forEach(record => {
        if (!record.pregnancyConfirmed && !record.pregnancyCheckDate) {
          tasks.push({
            id: `preg_check_${record.id}`,
            type: "pregnancy_check",
            animalId: record.femaleId,
            animalName: `Animal ${record.femaleId}`,
            task: "Pregnancy Check",
            dueDate: new Date(record.breedingDate.getTime() + 45 * 24 * 60 * 60 * 1000),
            priority: "high",
            cost: 35.00
          });
        }
      });
    }

    // Check for upcoming births (only if birth alerts enabled)
    if (healthAlertSettings?.enableBirthAlerts) {
      breedingRecords.forEach(record => {
        if (record.pregnancyConfirmed && !record.actualBirthDate) {
          const daysUntilDue = Math.ceil((record.expectedDueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          if (daysUntilDue <= healthAlertSettings.alertLeadTime) {
            tasks.push({
              id: `birth_${record.id}`,
              type: "expected_birth",
              animalId: record.femaleId,
              animalName: `Animal ${record.femaleId}`,
              task: "Expected Birth",
              dueDate: record.expectedDueDate,
              priority: daysUntilDue <= 7 ? "critical" : "high",
              cost: 0
            });
          }
        }
      });
    }

    setUpcomingTasks(tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()));
  };

  const addHealthRecord = () => {
    if (!newHealthRecord.animalId || !newHealthRecord.condition) {
      toast({
        title: "Missing Information",
        description: "Please fill in required fields.",
        variant: "destructive"
      });
      return;
    }

    const record: HealthRecord = {
      id: Date.now().toString(),
      animalId: newHealthRecord.animalId!,
      recordType: newHealthRecord.recordType || "examination",
      date: newHealthRecord.date || new Date(),
      condition: newHealthRecord.condition!,
      treatment: newHealthRecord.treatment || "",
      veterinarian: newHealthRecord.veterinarian,
      cost: newHealthRecord.cost,
      notes: newHealthRecord.notes || "",
      followUpRequired: newHealthRecord.followUpRequired || false,
      followUpDate: newHealthRecord.followUpDate,
      severity: newHealthRecord.severity || "low"
    };

    setHealthRecords(prev => [...prev, record]);
    setNewHealthRecord({});
    
    toast({
      title: "Health Record Added",
      description: "Health record has been saved successfully."
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderAddAnimalInterface = () => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Animal
          </CardTitle>
          <CardDescription>
            Add individual animals to track their health, breeding, and performance. Only species is required - you can add other details later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Animal Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input
                value={newAnimal.name}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Bella, Max (optional custom name)"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Species *</Label>
              <Select value={newAnimal.species} onValueChange={(value) => setNewAnimal(prev => ({ ...prev, species: value }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cattle">Cattle</SelectItem>
                  <SelectItem value="sheep">Sheep</SelectItem>
                  <SelectItem value="goats">Goats</SelectItem>
                  <SelectItem value="horses">Horses</SelectItem>
                  <SelectItem value="pigs">Pigs</SelectItem>
                  <SelectItem value="chickens">Chickens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Ear Tag Number <span className="text-xs text-muted-foreground">(optional - auto-generated if blank)</span></Label>
              <Input
                value={newAnimal.earTagNumber}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, earTagNumber: e.target.value }))}
                placeholder="e.g., 001, A123 (leave blank for auto-tag)"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Weight (lbs) <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input
                type="number"
                value={newAnimal.weight}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="e.g., 1200 (can add later)"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Sex <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Select value={newAnimal.sex} onValueChange={(value) => setNewAnimal(prev => ({ ...prev, sex: value }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select sex (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Breed</Label>
              <Input
                value={newAnimal.breed}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, breed: e.target.value }))}
                placeholder="e.g., Angus, Holstein"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Birth Date</Label>
              <Input
                type="date"
                value={newAnimal.birthDate}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, birthDate: e.target.value }))}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Acquisition Date</Label>
              <Input
                type="date"
                value={newAnimal.acquisitionDate}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                className="h-10"
              />
            </div>

            {/* Photo Upload Section */}
            <div className="md:col-span-2 lg:col-span-3">
              <Label>Animal Photo <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <div className="mt-2 space-y-4">
                {/* Photo Preview */}
                {newAnimal.photoUrl && (
                  <div className="relative w-32 h-32 animal-photo-thumb overflow-hidden">
                    <img 
                      src={newAnimal.photoUrl} 
                      alt="Animal preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => setNewAnimal(prev => ({ ...prev, photoUrl: "" }))}
                    >
                      ×
                    </Button>
                  </div>
                )}

                {/* Photo Upload Buttons */}
                <div className={`photo-upload-zone p-4 ${newAnimal.photoUrl ? 'has-photo' : ''}`}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('animal-photo-input')?.click()}
                    className="flex items-center gap-2 touch-target"
                  >
                    <Camera className="h-4 w-4" />
                    {newAnimal.photoUrl ? "Change Photo" : "Add Photo"}
                  </Button>
                  
                  {/* Hidden file input */}
                  <input
                    id="animal-photo-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Upload a photo to help identify this animal. Photos are stored securely and help with record keeping.
                </p>
              </div>
            </div>

            <div>
              <Label>Acquisition Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={newAnimal.acquisitionCost}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, acquisitionCost: e.target.value }))}
                placeholder="e.g., 1500.00"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <Label>Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input
                value={newAnimal.notes}
                onChange={(e) => setNewAnimal(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this animal (optional)"
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mt-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Quick Add:</strong> Just select a species to get started! You can always edit and add more details later from the animal's profile.
            </p>
          </div>

          <div className="flex gap-2 mt-4 pt-2">
            <Button 
              onClick={handleAddAnimal}
              disabled={createAnimalMutation.isPending}
              className="btn-agricultural h-10 px-4 text-sm"
            >
              {createAnimalMutation.isPending ? "Adding..." : "Add Livestock"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowAddAnimal(false)}
              className="h-10 px-4 text-sm"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderHealthDashboard = () => {
    // Calculate livestock totals from herds + individual animals
    const calculateLivestockTotals = () => {
      const speciesCount: Record<string, number> = {};
      let totalFromHerds = 0;

      // If user has individual animals (auto-populated), use those for counting
      // Otherwise use herd composition count to avoid double-counting
      if (animals.length > 0) {
        // Count from individual animals
        animals.forEach((animal: any) => {
          const species = animal.species?.toLowerCase() || 'unknown';
          speciesCount[species] = (speciesCount[species] || 0) + 1;
        });
        // For auto-populated animals, they are still considered "in herds"
        totalFromHerds = animals.length;
      } else {
        // Count animals from herds (for users without auto-population)
        herds.forEach((herd: any) => {
          if (typeof herd.composition === 'object' && Array.isArray(herd.composition)) {
            // New mixed herd format
            herd.composition.forEach((comp: any) => {
              const species = comp.species?.toLowerCase() || 'unknown';
              const count = parseInt(comp.count) || 0;
              speciesCount[species] = (speciesCount[species] || 0) + count;
              totalFromHerds += count;
            });
          } else {
            // Legacy single-species format
            const species = herd.species?.toLowerCase() || 'unknown';
            const count = parseInt(herd.count) || 0;
            speciesCount[species] = (speciesCount[species] || 0) + count;
            totalFromHerds += count;
          }
        });
      }

      const totalAnimals = animals.length > 0 ? animals.length : totalFromHerds;

      return { speciesCount, totalFromHerds, totalAnimals };
    };

    const { speciesCount, totalFromHerds, totalAnimals } = calculateLivestockTotals();
    const healthyAnimals = animals.length - healthRecords.filter(r => r.severity === "high" || r.severity === "critical").length;
    const upcomingTasksCount = upcomingTasks.length;
    const overdueCount = upcomingTasks.filter(t => t.dueDate < new Date()).length;

    return (
      <div className="space-y-6">
        {/* Livestock Management Header */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Livestock Overview</h3>
            <p className="text-sm text-muted-foreground">
              {user?.subscriptionTier === 'free' 
                ? "Manage your herds and groups for rotational grazing"
                : "Manage your herds, individual animals, health records and breeding"
              }
            </p>
          </div>
          
          {/* Herd and Animal Management Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate('/herd-management')}
              variant="outline"
              className="flex items-center gap-2 touch-target border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950"
            >
              <Users className="h-4 w-4" />
              Manage Herds & Groups
            </Button>
            
            {/* Individual Animal Tracking - Small Business+ Only */}
            {user?.subscriptionTier !== 'free' ? (
              <Button 
                onClick={() => setShowAddAnimal(!showAddAnimal)}
                className="btn-agricultural flex items-center gap-2 touch-target"
              >
                <Plus className="h-4 w-4" />
                {showAddAnimal ? "Cancel" : "Add Individual Animal"}
              </Button>
            ) : (
              <div className="relative">
                <Button 
                  variant="outline"
                  className="flex items-center gap-2 touch-target border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300"
                  onClick={() => navigate('/settings#subscription')}
                >
                  <Plus className="h-4 w-4" />
                  Individual Livestock Tracking
                  <Badge variant="secondary" className="ml-2 text-xs">Small Business+</Badge>
                </Button>
              </div>
            )}
          </div>
          
          {/* Livestock Summary Statistics */}
          {totalAnimals > 0 && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">Livestock Summary</span>
              </div>
              
              {/* Total Livestock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">{totalAnimals}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Total Livestock</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{totalFromHerds}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">In Herds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{animals.length}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Individual</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">{herds.length}</div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Herds</div>
                </div>
              </div>

              {/* Species Breakdown */}
              {Object.keys(speciesCount).length > 0 && (
                <div>
                  <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">By Species:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {Object.entries(speciesCount).map(([species, count]) => (
                      <div key={species} className="bg-white dark:bg-gray-800 rounded px-2 py-1 border text-center">
                        <div className="font-medium capitalize">{species}</div>
                        <div className="text-sm text-muted-foreground">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Herd Details */}
              {herds.length > 0 && (
                <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Herd Details:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {herds.map((herd, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded p-2 border">
                        <div className="font-medium">{herd.name}</div>
                        <div className="text-muted-foreground">
                          {typeof herd.composition === 'object' 
                            ? herd.composition.map((comp: any) => `${comp.count} ${comp.species}`).join(', ')
                            : `${herd.count || 0} ${herd.species || 'animals'}`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showAddAnimal && user?.subscriptionTier !== 'free' && renderAddAnimalInterface()}

        {/* Edit Animal Interface */}
        {editingAnimal && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Animal: {editingAnimal.name || editingAnimal.earTagNumber || 'Unnamed'}
              </CardTitle>
              <CardDescription>
                Update animal information and photo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Animal Name</Label>
                  <Input
                    value={editingAnimal.name || ""}
                    onChange={(e) => setEditingAnimal((prev: any) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Bella, Max"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Species</Label>
                  <Select 
                    value={editingAnimal.species} 
                    onValueChange={(value) => setEditingAnimal((prev: any) => ({ ...prev, species: value }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cattle">Cattle</SelectItem>
                      <SelectItem value="sheep">Sheep</SelectItem>
                      <SelectItem value="goats">Goats</SelectItem>
                      <SelectItem value="horses">Horses</SelectItem>
                      <SelectItem value="pigs">Pigs</SelectItem>
                      <SelectItem value="chickens">Chickens</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Ear Tag Number</Label>
                  <Input
                    value={editingAnimal.earTagNumber || ""}
                    onChange={(e) => setEditingAnimal((prev: any) => ({ ...prev, earTagNumber: e.target.value }))}
                    placeholder="e.g., 001, A123"
                  />
                </div>

                <div>
                  <Label>Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={editingAnimal.weight || ""}
                    onChange={(e) => setEditingAnimal((prev: any) => ({ ...prev, weight: e.target.value }))}
                    placeholder="e.g., 1200"
                  />
                </div>

                <div>
                  <Label>Sex</Label>
                  <Select 
                    value={editingAnimal.sex || ""} 
                    onValueChange={(value) => setEditingAnimal((prev: any) => ({ ...prev, sex: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Breed</Label>
                  <Input
                    value={editingAnimal.breed || ""}
                    onChange={(e) => setEditingAnimal((prev: any) => ({ ...prev, breed: e.target.value }))}
                    placeholder="e.g., Angus, Holstein"
                  />
                </div>

                {/* Age Information Section */}
                <div>
                  <Label>Birthdate (if known)</Label>
                  <Input
                    type="date"
                    value={editingAnimal.birthDate ? new Date(editingAnimal.birthDate).toISOString().split('T')[0] : ""}
                    onChange={(e) => setEditingAnimal((prev: any) => ({ 
                      ...prev, 
                      birthDate: e.target.value ? e.target.value : null 
                    }))}
                  />
                </div>

                <div>
                  <Label>Age (if birthdate unknown)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={editingAnimal.age || ""}
                      onChange={(e) => setEditingAnimal((prev: any) => ({ ...prev, age: e.target.value }))}
                      placeholder="e.g., 2"
                      className="flex-1"
                    />
                    <Select 
                      value={editingAnimal.ageUnit || ""} 
                      onValueChange={(value) => setEditingAnimal((prev: any) => ({ ...prev, ageUnit: value }))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(() => {
                    const ageInfo = getAnimalAgeInfo(editingAnimal);
                    return ageInfo.isCalculated ? (
                      <p className="text-sm text-green-600 mt-1">
                        Current age: {ageInfo.displayText}
                      </p>
                    ) : null;
                  })()}
                </div>

                <div>
                  <Label>Health Status</Label>
                  <Select 
                    value={editingAnimal.healthStatus || "healthy"} 
                    onValueChange={(value) => setEditingAnimal((prev: any) => ({ ...prev, healthStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="injured">Injured</SelectItem>
                      <SelectItem value="under_treatment">Under Treatment</SelectItem>
                      <SelectItem value="quarantined">Quarantined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Acquisition Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingAnimal.acquisitionCost || ""}
                    onChange={(e) => setEditingAnimal((prev: any) => ({ ...prev, acquisitionCost: e.target.value }))}
                    placeholder="e.g., 1500.00"
                  />
                </div>

                {/* Photo Upload Section */}
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>Animal Photo</Label>
                  <div className="mt-2 space-y-4">
                    {/* Photo Preview */}
                    {editingAnimal.photoUrl && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <img 
                          src={editingAnimal.photoUrl} 
                          alt="Animal preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => setEditingAnimal((prev: any) => ({ ...prev, photoUrl: "" }))}
                        >
                          ×
                        </Button>
                      </div>
                    )}

                    {/* Photo Upload Buttons */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('edit-animal-photo-input')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        {editingAnimal.photoUrl ? "Change Photo" : "Add Photo"}
                      </Button>
                      
                      {/* Hidden file input */}
                      <input
                        id="edit-animal-photo-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleEditPhotoUpload}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <Label>Notes</Label>
                  <Input
                    value={editingAnimal.notes || ""}
                    onChange={(e) => setEditingAnimal((prev: any) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this animal"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={() => updateAnimalMutation.mutate({ id: editingAnimal.id, updates: editingAnimal })}
                  disabled={updateAnimalMutation.isPending}
                  className="btn-agricultural touch-target"
                >
                  {updateAnimalMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingAnimal(null)}
                  className="touch-target"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show message when no animals or herds */}
        {totalAnimals === 0 && !showAddAnimal && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Livestock Added Yet</h3>
              <p className="text-muted-foreground mb-4">
                {user?.subscriptionTier === 'free' 
                  ? "Create herds to start tracking your livestock for rotational grazing."
                  : "Create herds or add individual animals to start tracking health and breeding performance."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/herd-management')} variant="outline">
                  Create Your First Herd
                </Button>
                {user?.subscriptionTier !== 'free' && (
                  <Button onClick={() => setShowAddAnimal(true)}>
                    Add Individual Livestock
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Statistics Grid - show when there are individual animals being tracked (Small Business+ only) */}
        {animals.length > 0 && user?.subscriptionTier !== 'free' && (
          <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{animals.length}</div>
                  <div className="text-sm text-gray-600">Individual Livestock</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{healthyAnimals}</div>
                  <div className="text-sm text-gray-600">Healthy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{upcomingTasksCount}</div>
                  <div className="text-sm text-gray-600">Upcoming Tasks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">{overdueCount}</div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Auto-Population Information - Small Business+ only */}
        {animals.length > 0 && user?.subscriptionTier !== 'free' && showAutoPopulationInfo && (
          <Card className="mb-6 field-card bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Individual Animal Records Created
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                  Auto-Populated
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAutoPopulationInfo(false);
                    localStorage.setItem('cadence-showAutoPopulationInfo', 'false');
                  }}
                  className="ml-auto h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Dismiss this notification"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Individual animal records were automatically created from your herd composition data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Smart Population Complete
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {animals.length} individual animal records were created from your herd composition. 
                      Each animal has been assigned a unique ID and is ready for detailed tracking.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Show which animals came from which herds */}
              <div className="space-y-3">
                <h5 className="font-medium text-sm">Animals Created by Herd:</h5>
                {herds.map((herd: any) => {
                  const herdAnimals = animals.filter((animal: any) => animal.herdId === herd.id);
                  if (herdAnimals.length === 0) return null;
                  
                  return (
                    <div key={herd.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{herd.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Created {herdAnimals.length} individual records
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {herdAnimals.map((animal: any) => animal.earTagNumber).join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>What's Next:</strong> You can now customize each animal's details below - add weights, health records, 
                  breeding information, and photos. All animals are pre-labeled with species and breed from your herd data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Livestock List with Photos */}
        {animals.length > 0 && (
          <Card className="mb-6 field-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Individual Livestock ({animals.length})
                {user?.subscriptionTier !== 'free' && (
                  <Badge variant="outline" className="text-xs">
                    Customizable
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {user?.subscriptionTier === 'free' 
                  ? "Individual animal tracking available with Small Business+ subscription"
                  : "View and manage individual animal records with photos - auto-populated from your herds"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {animals.map((animal: any) => (
                  <div key={animal.id} className="field-card p-4">
                    <div className="flex items-start gap-3">
                      {/* Animal Photo */}
                      <div className="w-16 h-16 animal-photo-thumb overflow-hidden flex-shrink-0">
                        {animal.photoUrl ? (
                          <img 
                            src={animal.photoUrl} 
                            alt={`${animal.name || animal.earTagNumber || 'Animal'} photo`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Camera className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Animal Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">
                            {animal.name || `#${animal.earTagNumber}` || 'Unnamed'}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {animal.species}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          {animal.breed && (
                            <div>{animal.breed}</div>
                          )}
                          {animal.sex && (
                            <div className="capitalize">{animal.sex}</div>
                          )}
                          {(() => {
                            const ageInfo = getAnimalAgeInfo(animal);
                            return ageInfo.displayText !== 'Unknown' && (
                              <div className={ageInfo.isCalculated ? 'text-green-600' : ''}>
                                {ageInfo.displayText}
                              </div>
                            );
                          })()}
                          {animal.weight && (
                            <div>{animal.weight} lbs</div>
                          )}
                          {animal.lactating && (
                            <Badge variant="secondary" className="text-xs">
                              Lactating
                            </Badge>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-1 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingAnimal(animal)}
                            className="text-xs touch-target"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Grid - show tasks and records for existing animals or when adding first animal (Small Business+ only) */}
        {(animals.length > 0 || showAddAnimal) && user?.subscriptionTier !== 'free' && (
          <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Health Tasks</CardTitle>
              <CardDescription>Scheduled vaccinations, treatments, and check-ups</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No upcoming health tasks scheduled.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.slice(0, 5).map(task => (
                    <div key={task.id} className={`p-3 rounded-lg border ${getPriorityColor(task.priority)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{task.task}</h4>
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="text-sm mb-1">
                        <span className="text-gray-600">Animal:</span> {task.animalName}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Due:</span> {task.dueDate.toLocaleDateString()}
                        {task.cost > 0 && (
                          <span className="ml-4 text-gray-600">Cost: ${task.cost.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Health Records</CardTitle>
              <CardDescription>Latest health events and treatments</CardDescription>
            </CardHeader>
            <CardContent>
              {healthRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No health records yet. Add your first record below.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {healthRecords.slice(-5).reverse().map(record => (
                    <div key={record.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{record.condition}</h4>
                        <Badge variant="outline" className="capitalize">
                          {record.recordType}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        Animal: {record.animalId} • {record.date.toLocaleDateString()}
                      </div>
                      {record.treatment && (
                        <div className="text-sm">
                          <span className="text-gray-600">Treatment:</span> {record.treatment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Basic Tier Weight Tracking - Phase 3 Requirement */}
        {user?.subscriptionTier === 'free' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                Monthly Weight Tracking
                <Badge variant="secondary" className="text-xs">Phase 3</Badge>
              </CardTitle>
              <CardDescription>
                Track weight changes monthly to establish routine monitoring and complete Phase 3 requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <strong>Phase 3: Weight Tracking</strong> - Record weight and body condition to establish routine monitoring. 
                  This helps track livestock performance and identify when feed adjustments are needed.
                </AlertDescription>
              </Alert>

              {/* Simple Weight Recording Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newWeightRecord.date}
                    onChange={(e) => setNewWeightRecord(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Group/Herd</Label>
                  <Select 
                    value={newWeightRecord.animalId === 'custom' ? 'custom' : newWeightRecord.animalId} 
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setNewWeightRecord(prev => ({ ...prev, animalId: 'custom' }));
                      } else {
                        const selectedHerd = herds.find(h => h.name === value);
                        if (selectedHerd) {
                          // Auto-populate with herd data
                          setNewWeightRecord(prev => ({ 
                            ...prev, 
                            animalId: value,
                            weight: selectedHerd.averageWeight?.toString() || "",
                            bodyConditionScore: "5" // Default ideal score
                          }));
                        } else {
                          setNewWeightRecord(prev => ({ ...prev, animalId: value }));
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select herd or enter custom group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">No specific group (overall average)</SelectItem>
                      {herds.map((herd: any) => (
                        <SelectItem key={herd.id} value={herd.name}>
                          {herd.name} ({typeof herd.composition === 'object' 
                            ? herd.composition.map((comp: any) => `${comp.count} ${comp.species}`).join(', ')
                            : `${herd.count || 0} ${herd.species || 'animals'}`
                          })
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Enter Custom Group Name...</SelectItem>
                    </SelectContent>
                  </Select>
                  {newWeightRecord.animalId === 'custom' && (
                    <Input
                      className="mt-2"
                      value=""
                      onChange={(e) => setNewWeightRecord(prev => ({ ...prev, animalId: e.target.value }))}
                      placeholder="Enter custom group name"
                      autoFocus
                    />
                  )}
                </div>
                {/* Conditional rendering based on herd type */}
                {!isMixedHerd ? (
                  <>
                    <div>
                      <Label>Average Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={newWeightRecord.weight}
                        onChange={(e) => setNewWeightRecord(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="e.g., 1200"
                      />
                    </div>
                    <div>
                      <Label>Body Condition Score (1-9)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="9"
                        value={newWeightRecord.bodyConditionScore}
                        onChange={(e) => setNewWeightRecord(prev => ({ ...prev, bodyConditionScore: e.target.value }))}
                        placeholder="5 is ideal"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Notes (optional)</Label>
                      <Input
                        value={newWeightRecord.notes}
                        onChange={(e) => setNewWeightRecord(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="e.g., Good condition, need more feed, etc."
                      />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <Alert className="mb-4">
                      <Users className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Mixed Herd Selected:</strong> Enter separate weight and body condition data for each livestock type in {selectedHerd?.name}.
                      </AlertDescription>
                    </Alert>
                    
                    {/* Individual species weight inputs for mixed herds */}
                    {selectedHerd?.composition.map((comp: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-800">
                        <h4 className="font-medium mb-3 text-green-700 dark:text-green-300 capitalize">
                          {comp.species} ({comp.count} head)
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <Label>Average Weight (lbs)</Label>
                            <Input
                              type="number"
                              value={mixedHerdWeights[comp.species]?.weight || ""}
                              onChange={(e) => setMixedHerdWeights(prev => ({
                                ...prev,
                                [comp.species]: {
                                  ...prev[comp.species],
                                  weight: e.target.value,
                                  bodyConditionScore: prev[comp.species]?.bodyConditionScore || "",
                                  notes: prev[comp.species]?.notes || ""
                                }
                              }))}
                              placeholder={comp.species === 'cattle' ? 'e.g., 1200' : comp.species === 'sheep' ? 'e.g., 150' : 'e.g., 200'}
                            />
                          </div>
                          <div>
                            <Label>Body Condition Score (1-9)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="9"
                              value={mixedHerdWeights[comp.species]?.bodyConditionScore || ""}
                              onChange={(e) => setMixedHerdWeights(prev => ({
                                ...prev,
                                [comp.species]: {
                                  ...prev[comp.species],
                                  weight: prev[comp.species]?.weight || "",
                                  bodyConditionScore: e.target.value,
                                  notes: prev[comp.species]?.notes || ""
                                }
                              }))}
                              placeholder="5 is ideal"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Notes (optional)</Label>
                            <Input
                              value={mixedHerdWeights[comp.species]?.notes || ""}
                              onChange={(e) => setMixedHerdWeights(prev => ({
                                ...prev,
                                [comp.species]: {
                                  ...prev[comp.species],
                                  weight: prev[comp.species]?.weight || "",
                                  bodyConditionScore: prev[comp.species]?.bodyConditionScore || "",
                                  notes: e.target.value
                                }
                              }))}
                              placeholder={`Notes specific to ${comp.species}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={addWeightRecord} className="btn-agricultural">
                <Plus className="h-4 w-4 mr-2" />
                Record Weight & Condition
              </Button>

              {/* Weight History for Basic Tier */}
              {healthMetrics.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Recent Weight Records</h4>
                  <div className="space-y-3">
                    {healthMetrics.slice(-3).reverse().map((metric, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">
                            {metric.animalId === "herd-average" ? "Herd Average" : metric.animalId || "Weight Record"}
                          </h5>
                          <div className="text-sm text-gray-600">
                            {metric.date.toLocaleDateString()}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Weight:</span> {metric.weight} lbs
                          </div>
                          <div>
                            <span className="text-gray-600">Body Condition:</span> {metric.bodyConditionScore}/9
                          </div>
                        </div>
                        {metric.notes && (
                          <div className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Notes:</span> {metric.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Getting Started Guide for Basic Tier */}
              {healthMetrics.length === 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Complete Phase 3 Task</h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>• Record your first weight measurement to complete Phase 3</p>
                    <p>• Use herd averages for quick entry</p>
                    <p>• Body condition score: 5 is ideal, 1-3 thin, 7-9 overweight</p>
                    <p>• Track monthly to identify trends and feed needs</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderHealthRecords = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Health Record</CardTitle>
            <CardDescription>Record health events, treatments, and examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Animal</Label>
                <Select 
                  value={newHealthRecord.animalId || ""} 
                  onValueChange={(value) => setNewHealthRecord(prev => ({ ...prev, animalId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select animal" />
                  </SelectTrigger>
                  <SelectContent>
                    {animals.map(animal => (
                      <SelectItem key={animal.id} value={animal.id.toString()}>
                        {animal.earTagNumber || `Animal ${animal.id}`} - {animal.species}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Record Type</Label>
                <Select 
                  value={newHealthRecord.recordType || ""} 
                  onValueChange={(value: any) => setNewHealthRecord(prev => ({ ...prev, recordType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vaccination">Vaccination</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="examination">Examination</SelectItem>
                    <SelectItem value="injury">Injury</SelectItem>
                    <SelectItem value="illness">Illness</SelectItem>
                    <SelectItem value="medication">Medication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Condition/Issue</Label>
                <Input 
                  value={newHealthRecord.condition || ""} 
                  onChange={(e) => setNewHealthRecord(prev => ({ ...prev, condition: e.target.value }))}
                  placeholder="Enter condition or issue"
                />
              </div>

              <div>
                <Label>Treatment</Label>
                <Input 
                  value={newHealthRecord.treatment || ""} 
                  onChange={(e) => setNewHealthRecord(prev => ({ ...prev, treatment: e.target.value }))}
                  placeholder="Enter treatment given"
                />
              </div>

              <div>
                <Label>Veterinarian</Label>
                <Input 
                  value={newHealthRecord.veterinarian || ""} 
                  onChange={(e) => setNewHealthRecord(prev => ({ ...prev, veterinarian: e.target.value }))}
                  placeholder="Veterinarian name (optional)"
                />
              </div>

              <div>
                <Label>Cost ($)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={newHealthRecord.cost || ""} 
                  onChange={(e) => setNewHealthRecord(prev => ({ ...prev, cost: parseFloat(e.target.value) || undefined }))}
                  placeholder="Treatment cost"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Notes</Label>
              <Input 
                value={newHealthRecord.notes || ""} 
                onChange={(e) => setNewHealthRecord(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or observations"
              />
            </div>

            <Button onClick={addHealthRecord} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Health Record
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Record History</CardTitle>
            <CardDescription>Complete health history for all animals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthRecords.map(record => (
                <div key={record.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{record.condition}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {record.recordType}
                      </Badge>
                      <Badge className={getPriorityColor(record.severity)}>
                        {record.severity}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                    <div>
                      <span className="text-gray-600">Animal:</span> {record.animalId}
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span> {record.date.toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-gray-600">Vet:</span> {record.veterinarian || "N/A"}
                    </div>
                    <div>
                      <span className="text-gray-600">Cost:</span> ${record.cost?.toFixed(2) || "0.00"}
                    </div>
                  </div>

                  {record.treatment && (
                    <div className="text-sm mb-2">
                      <span className="text-gray-600">Treatment:</span> {record.treatment}
                    </div>
                  )}

                  {record.notes && (
                    <div className="text-sm mb-2">
                      <span className="text-gray-600">Notes:</span> {record.notes}
                    </div>
                  )}

                  {record.followUpRequired && (
                    <div className="text-sm text-orange-600">
                      Follow-up required: {record.followUpDate?.toLocaleDateString() || "Date TBD"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWeightTracking = () => {
    const hasData = healthMetrics.length > 0;
    
    return (
      <div className="space-y-6">
        {/* Phase 3 Task Explanation */}
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <strong>Phase 3: Weight Tracking</strong> - Record weight and body condition to establish routine monitoring. 
            This helps track livestock performance and identify when feed adjustments are needed.
          </AlertDescription>
        </Alert>

        {/* Quick Add Weight Record */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Record Weight & Body Condition
            </CardTitle>
            <CardDescription>Track livestock weight and body condition scores for performance monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Animal or Group</Label>
                <Select value={newWeightRecord.animalId} onValueChange={(value) => setNewWeightRecord(prev => ({ ...prev, animalId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select animal or use herd average" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="herd-average">Herd Average</SelectItem>
                    {animals.map((animal: any) => (
                      <SelectItem key={animal.id} value={animal.id.toString()}>
                        {animal.name || animal.earTagNumber || `#${animal.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={newWeightRecord.date}
                  onChange={(e) => setNewWeightRecord(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label>Weight (lbs)</Label>
                <Input 
                  type="number" 
                  step="0.1"
                  value={newWeightRecord.weight}
                  onChange={(e) => setNewWeightRecord(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="e.g., 1250"
                />
              </div>

              <div>
                <Label>Body Condition Score (1-9)</Label>
                <Select value={newWeightRecord.bodyConditionScore} onValueChange={(value) => setNewWeightRecord(prev => ({ ...prev, bodyConditionScore: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rate condition 1-9" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Thin</SelectItem>
                    <SelectItem value="2">2 - Thin</SelectItem>
                    <SelectItem value="3">3 - Moderately Thin</SelectItem>
                    <SelectItem value="4">4 - Slightly Thin</SelectItem>
                    <SelectItem value="5">5 - Ideal</SelectItem>
                    <SelectItem value="6">6 - Moderately Fleshy</SelectItem>
                    <SelectItem value="7">7 - Fleshy</SelectItem>
                    <SelectItem value="8">8 - Fat</SelectItem>
                    <SelectItem value="9">9 - Very Fat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Input 
                value={newWeightRecord.notes}
                onChange={(e) => setNewWeightRecord(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional observations (feed changes, health notes, etc.)"
              />
            </div>

            <Button onClick={addWeightRecord} className="btn-agricultural">
              <Plus className="h-4 w-4 mr-2" />
              Record Weight & Condition
            </Button>
          </CardContent>
        </Card>

        {/* Weight History */}
        {hasData && (
          <Card>
            <CardHeader>
              <CardTitle>Weight History</CardTitle>
              <CardDescription>Track weight and body condition changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthMetrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {metric.animalId === "herd-average" ? "Herd Average" : `Animal #${metric.animalId}`}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {metric.date.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Weight:</span> {metric.weight} lbs
                      </div>
                      <div>
                        <span className="text-gray-600">Body Condition:</span> {metric.bodyConditionScore}/9
                      </div>
                      {metric.notes && (
                        <div className="md:col-span-1">
                          <span className="text-gray-600">Notes:</span> {metric.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started Guide */}
        {!hasData && (
          <Card>
            <CardContent className="text-center py-8">
              <TrendingUp className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start Weight Tracking</h3>
              <p className="text-muted-foreground mb-4">
                Record your first weight and body condition measurement to complete your Phase 3 routine establishment task.
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Use herd averages for quick entry</p>
                <p>• Body condition score: 5 is ideal, 1-3 thin, 7-9 overweight</p>
                <p>• Add individual animal records for detailed tracking</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderBreedingManagement = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Breeding Overview</CardTitle>
            <CardDescription>Current breeding programs and reproductive performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <h4 className="font-medium mb-2">Active Pregnancies</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {breedingRecords.filter(r => r.pregnancyConfirmed && !r.actualBirthDate).length}
                </div>
                <p className="text-sm text-gray-600">Confirmed pregnant</p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                <h4 className="font-medium mb-2">Expected Births</h4>
                <div className="text-2xl font-bold text-green-600">
                  {breedingRecords.filter(r => {
                    const daysUntilDue = Math.ceil((r.expectedDueDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
                    return r.pregnancyConfirmed && !r.actualBirthDate && daysUntilDue <= 30;
                  }).length}
                </div>
                <p className="text-sm text-gray-600">Next 30 days</p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                <h4 className="font-medium mb-2">Conception Rate</h4>
                <div className="text-2xl font-bold text-purple-600">
                  {breedingRecords.length > 0 ? 
                    Math.round((breedingRecords.filter(r => r.pregnancyConfirmed).length / breedingRecords.length) * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">This season</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breeding Records</CardTitle>
            <CardDescription>Track breeding events and pregnancy status</CardDescription>
          </CardHeader>
          <CardContent>
            {breedingRecords.length === 0 ? (
              <div className="text-center py-8">
                <Baby className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No breeding records yet. Add breeding events to track reproductive performance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {breedingRecords.map(record => (
                  <div key={record.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Female: {record.femaleId}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="capitalize">
                          {record.method.replace('_', ' ')}
                        </Badge>
                        <Badge className={record.pregnancyConfirmed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {record.pregnancyConfirmed ? 'Pregnant' : 'Unknown'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                      <div>
                        <span className="text-gray-600">Male:</span> {record.maleId || "AI Sire"}
                      </div>
                      <div>
                        <span className="text-gray-600">Bred:</span> {record.breedingDate.toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-gray-600">Due:</span> {record.expectedDueDate.toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-gray-600">Days Left:</span> {
                          Math.ceil((record.expectedDueDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
                        }
                      </div>
                    </div>

                    {record.complications && (
                      <div className="text-sm text-red-600 mb-2">
                        <span className="font-medium">Complications:</span> {record.complications}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                      {!record.pregnancyConfirmed && (
                        <Button size="sm" variant="outline">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          Pregnancy Check
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGeneticAnalysis = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Genetic Analysis & Breeding Optimization</CardTitle>
          <CardDescription>Advanced genetic evaluation and breeding recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium mb-2">Genetic Performance Tracking</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Track genetic traits across generations to optimize breeding decisions.
              </p>
              <Button size="sm">
                <Dna className="h-4 w-4 mr-1" />
                Run Genetic Analysis
              </Button>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium mb-2">Breeding Value Estimation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Calculate estimated breeding values (EBVs) for growth, reproduction, and production traits.
              </p>
              <Button size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                Calculate EBVs
              </Button>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium mb-2">Inbreeding Management</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Monitor inbreeding coefficients and optimize mating plans to maintain genetic diversity.
              </p>
              <Button size="sm">
                <Activity className="h-4 w-4 mr-1" />
                Analyze Pedigree
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderHealthAlertSettings = () => {
    if (settingsLoading) {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading health alert settings...</div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!healthAlertSettings) {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Failed to load health alert settings. Please try refreshing the page.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Health Alert Settings
            </CardTitle>
            <CardDescription>
              Customize which health recommendations and alerts you want to receive. This helps you focus on what matters most for your farm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alert Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Alert Types</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Vaccination Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get reminders for upcoming vaccinations</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={healthAlertSettings?.enableVaccinationAlerts || false}
                    disabled={updateHealthAlertSettingsMutation.isPending}
                    onChange={(e) => updateHealthAlertSettings({ 
                      ...healthAlertSettings,
                      enableVaccinationAlerts: e.target.checked 
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Pregnancy Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get reminders for pregnancy checks</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={healthAlertSettings?.enablePregnancyAlerts || false}
                    disabled={updateHealthAlertSettingsMutation.isPending}
                    onChange={(e) => updateHealthAlertSettings({ 
                      ...healthAlertSettings,
                      enablePregnancyAlerts: e.target.checked 
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Birth Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get alerts for expected births</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={healthAlertSettings?.enableBirthAlerts || false}
                    disabled={updateHealthAlertSettingsMutation.isPending}
                    onChange={(e) => updateHealthAlertSettings({ 
                      ...healthAlertSettings,
                      enableBirthAlerts: e.target.checked 
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Health Check Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get reminders for routine health checks</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={healthAlertSettings?.enableHealthCheckAlerts || false}
                    disabled={updateHealthAlertSettingsMutation.isPending}
                    onChange={(e) => updateHealthAlertSettings({ 
                      ...healthAlertSettings,
                      enableHealthCheckAlerts: e.target.checked 
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Alert Timing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Alert Timing</h3>
              <div className="p-4 border rounded-lg space-y-3">
                <Label htmlFor="alertLeadTime">Alert Lead Time (Days)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="alertLeadTime"
                    type="number"
                    min="1"
                    max="90"
                    value={healthAlertSettings?.alertLeadTime || 30}
                    disabled={updateHealthAlertSettingsMutation.isPending}
                    onChange={(e) => updateHealthAlertSettings({ 
                      ...healthAlertSettings,
                      alertLeadTime: parseInt(e.target.value) || 30 
                    })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    days before due date to show alert
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  How many days in advance do you want to see upcoming health tasks?
                </p>
              </div>
            </div>

            {/* Vaccination Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vaccination Preferences</h3>
              <div className="space-y-3">
                {vaccinationSchedules.map(vaccine => (
                  <div key={vaccine.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{vaccine.vaccineName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {vaccine.species.join(", ")} • ${vaccine.cost} • {vaccine.frequency}
                      </p>
                      <p className="text-xs text-muted-foreground">{vaccine.notes}</p>
                    </div>
                    <Badge variant={vaccine.required ? "default" : "secondary"}>
                      {vaccine.required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Settings */}
            <div className="pt-6 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Settings are automatically saved when you make changes.
                  </p>
                </div>
                <Button 
                  disabled={updateHealthAlertSettingsMutation.isPending}
                  onClick={() => {
                    toast({
                      title: "Settings Saved",
                      description: "Your health alert preferences have been updated.",
                    });
                  }}
                >
                  {updateHealthAlertSettingsMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderIntegration = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Farm Management Integration</CardTitle>
            <CardDescription>How health and breeding data enhances other farm tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Performance Analytics</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Health and breeding data correlate with production metrics for comprehensive analysis
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Bell className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Alert System</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automated alerts for vaccination schedules, breeding cycles, and health issues
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Financial Management</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track health costs and breeding investments for complete financial analysis
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Animal Management</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Comprehensive animal profiles with health history and breeding records
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {complexityLevel === "advanced" && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Features</CardTitle>
              <CardDescription>Professional health and breeding management capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">AI Health Monitoring</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Machine learning algorithms analyze health patterns and predict potential issues.
                  </p>
                  <div className="text-xs text-gray-500 italic">
                    Available in future updates
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Genomic Selection</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Advanced genomic testing integration for precision breeding decisions.
                  </p>
                  <div className="text-xs text-gray-500 italic">
                    Available in future updates
                  </div>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Veterinary Network</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Connect with local veterinarians and share health records seamlessly.
                  </p>
                  <div className="text-xs text-gray-500 italic">
                    Available in future updates
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Livestock Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Comprehensive livestock management including health, breeding, and herd organization
            </p>
          </div>

        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        {/* Tier-Appropriate Tab Navigation */}
        {user?.subscriptionTier === 'free' ? (
          // Basic Tier - Limited Tabs
          <TabsList className="grid w-full grid-cols-2 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
            <TabsTrigger value="dashboard" className="text-sm text-center px-1 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">Herd Overview</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm text-center px-1 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">Basic Settings</span>
            </TabsTrigger>
          </TabsList>
        ) : (
          // Small Business+ Tiers - Full Tab Navigation (Added Weight tab)
          <TabsList className="grid w-full grid-cols-7 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
            <TabsTrigger value="dashboard" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="health" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">
                <span className="hidden sm:inline">Health Records</span>
                <span className="sm:hidden">Health</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="weight" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">
                <span className="hidden sm:inline">Weight & Condition</span>
                <span className="sm:hidden">Weight</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="breeding" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">Breeding</span>
            </TabsTrigger>
            <TabsTrigger value="genetics" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">Genetics</span>
            </TabsTrigger>
            <TabsTrigger value="integration" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">
                <span className="hidden sm:inline">Integration</span>
                <span className="sm:hidden">Integrate</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <span className="leading-[1.1] max-w-full">
                <span className="hidden sm:inline">Alert Settings</span>
                <span className="sm:hidden">Settings</span>
              </span>
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="dashboard" className="space-y-6">
          {renderHealthDashboard()}
          
          {/* Workflow continuation button */}
          {isInWorkflow && (
            <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Morning Farm Check Progress</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      Weather checked ✓ • Animals checked ✓ - Continue to water systems
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/water-systems')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Water Systems
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Advanced Tabs - Only for Small Business+ tiers */}
        {user?.subscriptionTier !== 'free' && (
          <>
            <TabsContent value="health" className="space-y-6">
              {renderHealthRecords()}
            </TabsContent>

            <TabsContent value="weight" className="space-y-6">
              {renderWeightTracking()}
            </TabsContent>

            <TabsContent value="breeding" className="space-y-6">
              {renderBreedingManagement()}
            </TabsContent>

            <TabsContent value="genetics" className="space-y-6">
              {complexityLevel === "advanced" ? renderGeneticAnalysis() : (
                <Alert>
                  <Dna className="h-4 w-4" />
                  <AlertDescription>
                    Genetic analysis features are available in Advanced mode. 
                    Switch to Advanced to access genomic evaluation and breeding optimization tools.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="integration" className="space-y-6">
              {renderIntegration()}
            </TabsContent>
          </>
        )}

        <TabsContent value="settings" className="space-y-6">
          {user?.subscriptionTier === 'free' ? (
            // Basic Tier Settings - Simple herd-level preferences
            <Card>
              <CardHeader>
                <CardTitle>Basic Herd Settings</CardTitle>
                <CardDescription>Basic notifications and preferences for herd management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    Advanced health alerts, breeding notifications, and individual livestock tracking are available with Small Business+ plans.
                    <br />
                    <Button variant="link" className="p-0 h-auto mt-2" onClick={() => window.location.href = '/settings#subscription'}>
                      Upgrade to unlock individual livestock health management
                    </Button>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Basic Herd Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    • General herd status updates
                    • Basic rotation reminders
                    • System notifications
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            renderHealthAlertSettings()
          )}
        </TabsContent>
      </Tabs>

      {/* Smart Workflow Handoffs */}
      <SmartWorkflowHandoffs 
        currentTool="livestock-health"
        completedActions={healthMetrics.length > 0 ? ['weight_recorded'] : []}
        farmData={{
          hasLivestock: herds.length > 0,
          hasPaddocks: true,
          hasAssessments: true,
          livestockCount: herds.reduce((total, herd) => {
            if (herd.composition) {
              return total + herd.composition.reduce((sum, comp) => sum + comp.count, 0);
            }
            return total + (herd.count || 0);
          }, 0),
          paddockCount: 3,
          primarySpecies: herds.length > 0 ? herds[0].species || herds[0].composition?.[0]?.species : undefined
        }}
      />
    </div>
  );
}