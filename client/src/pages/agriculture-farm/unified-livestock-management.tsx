import { useState, useEffect, useRef } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { performComprehensiveMilestoneReset, createFarmData } from "@/lib/milestone-reset-system";
import { validateAndResetMilestones, forceResetHerdMilestone } from "@/lib/immediate-milestone-checker";
import { useWorkflowProgress } from "@/hooks/useWorkflowProgress";
import { useSmartTaskCompletion } from "@/hooks/useSmartTaskCompletion";
import { useMilestoneSync } from "@/hooks/useMilestoneSync";
import { getAnimalAgeInfo, AgeInfo } from "@/lib/age-calculations";
import { 
  Users, Plus, Edit, Trash2, Heart, Scale, Calendar, AlertTriangle,
  Activity, TrendingUp, Bell, Clipboard, Stethoscope, Baby, Dna, 
  BarChart3, FileText, Camera, ArrowRight, Eye, X
} from "lucide-react";

// Interfaces from both original files
interface Animal {
  id: number;
  earTagNumber: string;
  name?: string;
  species: string;
  breed?: string;
  sex: string;
  age?: number;
  ageUnit?: string;
  weight?: number;
  healthStatus: string;
  notes?: string;
  herdId?: number;
  createdAt: string;
  birthDate?: string;
  lastAgeUpdate?: string;
  bodyConditionScore?: number;
  reproductiveStatus?: string;
  lastVaccination?: string;
  lastHealthCheck?: string;
}

interface Herd {
  id: number;
  name: string;
  composition: Array<{
    species: string;
    count: number;
    breed?: string;
  }>;
  totalCount: number;
  notes?: string;
  createdAt: string;
}

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

const SPECIES_OPTIONS = ["Cattle", "Sheep", "Goat", "Horse", "Pig"];
const HEALTH_STATUS_OPTIONS = ["Healthy", "Under Treatment", "Quarantine", "Pregnant", "Lactating", "Sick"];
const CATTLE_BREEDS = ["Angus", "Hereford", "Charolais", "Simmental", "Limousin", "Brahman", "Brangus", "Other"];
const SHEEP_BREEDS = ["Dorper", "Katahdin", "Suffolk", "Texel", "Romney", "Merino", "Other"];
const GOAT_BREEDS = ["Boer", "Kiko", "Spanish", "Nubian", "Alpine", "Saanen", "Other"];

export default function UnifiedLivestockManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "health-breeding" | "genetics" | "individual-records" | "settings">("overview");
  const [overviewSubTab, setOverviewSubTab] = useState<"herds" | "animals">("herds");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Herd | Animal | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [showHealthRecordDialog, setShowHealthRecordDialog] = useState(false);
  const [showBreedingRecordDialog, setShowBreedingRecordDialog] = useState(false);
  const [showVaccinationSchedule, setShowVaccinationSchedule] = useState(false);
  const [showGeneticAnalysisDialog, setShowGeneticAnalysisDialog] = useState(false);
  const [showBreedingOptimizationDialog, setShowBreedingOptimizationDialog] = useState(false);
  const [showPedigreeDialog, setShowPedigreeDialog] = useState(false);
  const [herdComposition, setHerdComposition] = useState<Array<{species: string, count: number, breed?: string}>>([
    { species: "", count: 0, breed: "" }
  ]);

  // Get user's subscription tier limits - handle both farmTier and subscriptionTier
  const tier = user?.subscriptionTier || user?.farmTier || "free";
  const animalLimit = tier === "free" ? 50 : (tier === "small_farm" || tier === "basic" || tier === "small_business") ? 250 : (tier === "professional") ? 1000 : 9999;
  const hasIndividualTracking = ["small_farm", "professional", "enterprise", "basic", "small_business"].includes(tier);



  // Fetch data
  const { data: herds = [], isLoading: herdsLoading } = useQuery<Herd[]>({
    queryKey: ["/api/herds"],
  });

  const { data: animals = [], isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  const { data: paddocks = [] } = useQuery<any[]>({
    queryKey: ["/api/paddocks"],
  });

  const { data: assessments = [] } = useQuery<any[]>({
    queryKey: ["/api/assessments"],
  });

  const { data: healthRecords = [] } = useQuery<HealthRecord[]>({
    queryKey: ["/api/health-records"],
    enabled: hasIndividualTracking,
  });

  const { data: breedingRecords = [] } = useQuery<BreedingRecord[]>({
    queryKey: ["/api/breeding-records"],
    enabled: hasIndividualTracking,
  });

  // Check and reset milestones on component mount
  React.useEffect(() => {
    if (!herdsLoading && !animalsLoading) {
      validateAndResetMilestones();
    }
  }, [herdsLoading, animalsLoading]);

  // Auto-population notification handling
  const [hasShownAutoPopulation, setHasShownAutoPopulation] = useState(() => {
    return localStorage.getItem('auto-population-notification-dismissed') === 'true';
  });

  const dismissAutoPopulationNotification = () => {
    setHasShownAutoPopulation(true);
    localStorage.setItem('auto-population-notification-dismissed', 'true');
  };

  // Calculate livestock totals
  const calculateLivestockTotals = () => {
    const animalsBySpecies: { [key: string]: number } = {};
    animals.forEach(animal => {
      animalsBySpecies[animal.species] = (animalsBySpecies[animal.species] || 0) + 1;
    });

    const totalAnimals = animals.length;
    const totalInHerds = animals.filter(animal => animal.herdId).length;
    const totalUnassigned = totalAnimals - totalInHerds;

    return {
      totalAnimals,
      totalInHerds,
      totalUnassigned,
      animalsBySpecies
    };
  };

  const livestockTotals = calculateLivestockTotals();

  // Mutations
  const createHerdMutation = useMutation({
    mutationFn: async (herdData: Omit<Herd, "id" | "createdAt">) => {
      return await apiRequest("POST", "/api/herds", herdData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Herd Created",
        description: "Your herd has been added successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create herd.",
        variant: "destructive"
      });
    }
  });

  const createAnimalMutation = useMutation({
    mutationFn: async (animalData: Omit<Animal, "id" | "createdAt">) => {
      return await apiRequest("POST", "/api/animals", animalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Livestock Added",
        description: "The livestock has been added successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Addition Failed",
        description: error.message || "Failed to add livestock.",
        variant: "destructive"
      });
    }
  });

  const updateAnimalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest("PUT", `/api/animals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Livestock Updated",
        description: "The livestock has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update livestock.",
        variant: "destructive"
      });
    }
  });

  const deleteAnimalMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/animals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      toast({
        title: "Livestock Removed",
        description: "The livestock has been removed."
      });
    }
  });

  const deleteAllAnimalsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/animals/bulk");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      toast({
        title: "All Animals Removed",
        description: "All individual animals have been removed."
      });
    }
  });

  const deleteAllHerdsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/herds/bulk");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      toast({
        title: "All Herds Removed",
        description: "All herds have been removed."
      });
    }
  });

  // Dialog handlers
  const openCreateDialog = (type: "herd" | "animal" = "herd") => {
    setEditingItem(null);
    if (type === "herd") {
      setHerdComposition([{ species: "", count: 0, breed: "" }]);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingItem && 'composition' in editingItem) {
      // Editing a herd - not implemented in this simplified version
      return;
    } else {
      // Creating/editing an animal
      const animalData = {
        earTagNumber: formData.get('earTagNumber') as string,
        name: formData.get('name') as string,
        species: formData.get('species') as string,
        breed: formData.get('breed') as string,
        sex: formData.get('sex') as string,
        age: formData.get('age') ? Number(formData.get('age')) : undefined,
        ageUnit: formData.get('ageUnit') as string || 'months',
        weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
        healthStatus: formData.get('healthStatus') as string,
        notes: formData.get('notes') as string,
      };

      if (editingItem && 'earTagNumber' in editingItem) {
        updateAnimalMutation.mutate({
          id: editingItem.id,
          data: animalData
        });
      } else {
        createAnimalMutation.mutate(animalData);
      }
    }
  };

  // Age calculation helper
  const getDisplayAge = (animal: Animal): { age: string; color: string } => {
    if (animal.birthDate) {
      const ageInfo = getAnimalAgeInfo(animal.birthDate);
      return {
        age: `${ageInfo.years}y ${ageInfo.months}m`,
        color: "text-green-600" // Real-time calculated age
      };
    } else if (animal.age) {
      return {
        age: `${animal.age} ${animal.ageUnit || 'mo'}`,
        color: "text-gray-700" // Manual age
      };
    }
    return { age: "Unknown", color: "text-gray-500" };
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Livestock Management</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Comprehensive herd and individual animal tracking
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => openCreateDialog("herd")}
            className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Herd
          </Button>
          <Button 
            variant="outline" 
            onClick={() => openCreateDialog("animal")}
            className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Animal
          </Button>
        </div>
      </div>

      {/* Summary Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Animals</p>
                <p className="text-lg sm:text-2xl font-bold">{livestockTotals.totalAnimals}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">In Herds</p>
                <p className="text-lg sm:text-2xl font-bold">{livestockTotals.totalInHerds}</p>
              </div>
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Herds</p>
                <p className="text-lg sm:text-2xl font-bold">{herds.length}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Capacity</p>
                <p className="text-lg sm:text-2xl font-bold">{animalLimit}</p>
              </div>
              <Scale className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-population notification - Mobile Optimized */}
      {hasIndividualTracking && !hasShownAutoPopulation && herds.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <AlertDescription className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 text-sm sm:text-base">
              <strong>Auto-Population Active:</strong> Your subscription includes individual animal tracking. 
              Animals are automatically created from herd composition data.
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={dismissAutoPopulationNotification}
              className="text-blue-600 self-end sm:self-center flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs - Mobile Optimized */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger 
            value="overview" 
            className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-3 flex flex-col items-center gap-1"
          >
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="health-breeding" 
            disabled={!hasIndividualTracking}
            className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-3 flex flex-col items-center gap-1"
          >
            <span className="text-center leading-tight">Health</span>
            {!hasIndividualTracking && (
              <Badge variant="outline" className="text-[8px] sm:text-xs px-1 py-0">Pro</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="genetics" 
            disabled={!["professional", "enterprise"].includes(tier)}
            className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-3 flex flex-col items-center gap-1"
          >
            <span className="text-center leading-tight">Genetics</span>
            {!["professional", "enterprise"].includes(tier) && (
              <Badge variant="outline" className="text-[8px] sm:text-xs px-1 py-0">Pro+</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="individual-records" 
            disabled={!hasIndividualTracking}
            className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-3 flex flex-col items-center gap-1"
          >
            <span className="text-center leading-tight">Records</span>
            {!hasIndividualTracking && (
              <Badge variant="outline" className="text-[8px] sm:text-xs px-1 py-0">Pro</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="text-xs sm:text-sm px-1 sm:px-3 py-2 sm:py-3 flex flex-col items-center gap-1"
          >
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <Tabs value={overviewSubTab} onValueChange={(value: any) => setOverviewSubTab(value)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger 
                value="herds" 
                className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
              >
                Herds ({herds.length})
              </TabsTrigger>
              <TabsTrigger 
                value="animals" 
                className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
              >
                Animals ({animals.length})
              </TabsTrigger>
            </TabsList>

            {/* Herds Sub-tab */}
            <TabsContent value="herds">
              {herds.length > 0 && (
                <div className="flex justify-end mb-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Herds
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Herds?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {herds.length} herds. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAllHerdsMutation.mutate()}>
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {herds.map(herd => (
                  <Card key={herd.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-lg sm:text-xl font-semibold truncate">{herd.name}</span>
                        <Badge variant="outline" className="text-xs sm:text-sm self-start sm:self-center">
                          {herd.totalCount} animals
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {herd.composition && Array.isArray(herd.composition) ? (
                        <div className="space-y-2">
                          {herd.composition.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">{item.species}</Badge>
                                {item.breed && <span className="text-xs text-gray-500">({item.breed})</span>}
                              </div>
                              <span className="text-sm font-medium">{item.count}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-dashed">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Total</span>
                              <span className="font-bold">{herd.totalCount || herd.composition.reduce((sum: number, item: any) => sum + item.count, 0)} livestock</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">{(herd as any).species}</Badge>
                          <span className="font-medium">{(herd as any).count} livestock</span>
                        </div>
                      )}
                      {herd.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {herd.notes}
                        </p>
                      )}
                      <div className="text-xs text-gray-500">
                        Created {new Date(herd.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {herds.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Herds Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Create your first herd to start tracking your livestock.
                      </p>
                      <Button onClick={() => openCreateDialog("herd")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Herd
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Animals Sub-tab */}
            <TabsContent value="animals">
              {animals.length > 0 && (
                <div className="flex justify-end mb-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Animals
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete All Animals?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {animals.length} individual animals. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAllAnimalsMutation.mutate()}>
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {animals.map(animal => {
                  const ageDisplay = getDisplayAge(animal);
                  
                  return (
                    <Card key={animal.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2 sm:pb-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center gap-2">
                            <Badge variant="outline" className="text-xs self-start sm:self-center">
                              {animal.earTagNumber || animal.name || `${animal.species} ${animal.id}`}
                            </Badge>
                            <span className="capitalize">{animal.species}</span>
                          </CardTitle>
                          <div className="flex gap-1 sm:gap-2 self-end sm:self-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingItem(animal);
                                setIsDialogOpen(true);
                              }}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteAnimalMutation.mutate(animal.id)}
                              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <Badge 
                            variant={animal.healthStatus === "healthy" ? "default" : "destructive"}
                            className="text-xs self-start"
                          >
                            {animal.healthStatus}
                          </Badge>
                          <span className="text-sm text-gray-600 capitalize self-start sm:self-center">{animal.sex}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                            <span className={`${ageDisplay.color} truncate`}>{ageDisplay.age}</span>
                          </div>
                          {animal.weight && (
                            <div className="flex items-center gap-1">
                              <Scale className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{animal.weight} lbs</span>
                            </div>
                          )}
                        </div>

                        {animal.breed && (
                          <Badge variant="outline" className="text-xs">{animal.breed}</Badge>
                        )}
                        
                        {animal.notes && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {animal.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {animals.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="text-center py-12">
                      <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Animals Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Add your first animal to start individual tracking.
                      </p>
                      <Button onClick={() => openCreateDialog("animal")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Animal
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Health & Breeding Tab */}
        <TabsContent value="health-breeding" className="space-y-6">
          {hasIndividualTracking ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      Health Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Track vaccinations, treatments, and health checkups
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowHealthRecordDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Health Record
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Baby className="h-5 w-5" />
                      Breeding Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Track breeding cycles, pregnancies, and births
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowBreedingRecordDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Breeding Record
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Vaccination Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Automated vaccination reminders and schedules
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowVaccinationSchedule(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Schedule
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {/* Health Records List */}
              {healthRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Health Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {healthRecords.slice(0, 5).map(record => (
                        <div key={record.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">{record.condition}</p>
                            <p className="text-sm text-gray-600">
                              Animal: {animals.find(a => a.id.toString() === record.animalId)?.earTagNumber || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={record.severity === 'critical' ? 'destructive' : 'outline'}>
                            {record.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Breeding Records List */}
              {breedingRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Breeding Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {breedingRecords.slice(0, 5).map(record => (
                        <div key={record.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">{record.method} breeding</p>
                            <p className="text-sm text-gray-600">
                              Female: {animals.find(a => a.id.toString() === record.femaleId)?.earTagNumber || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(record.breedingDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={record.success ? 'default' : 'secondary'}>
                            {record.pregnancyConfirmed ? 'Confirmed' : 'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upgrade Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Health and breeding management requires Small Business tier or higher.
              </p>
              <Button>Upgrade Subscription</Button>
            </div>
          )}
        </TabsContent>

        {/* Genetics Tab */}
        <TabsContent value="genetics" className="space-y-6">
          {["professional", "enterprise"].includes(tier) ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dna className="h-5 w-5" />
                      Genetic Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Track genetic traits, breeding values, and inbreeding coefficients
                    </p>
                    <Button size="sm" className="w-full" onClick={() => setShowGeneticAnalysisDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Analysis
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Breeding Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      AI-powered breeding recommendations for genetic improvement
                    </p>
                    <Button size="sm" className="w-full" onClick={() => setShowBreedingOptimizationDialog(true)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Recommendations
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Pedigree Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Track lineages and family trees for breeding decisions
                    </p>
                    <Button size="sm" className="w-full" onClick={() => setShowPedigreeDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pedigree
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center py-8 text-gray-500">
                <p>Advanced genetics features available in Professional+ tiers...</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Professional+ Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Genetic analysis and breeding optimization requires Professional tier or higher.
              </p>
              <Button>Upgrade to Professional</Button>
            </div>
          )}
        </TabsContent>

        {/* Individual Records Tab */}
        <TabsContent value="individual-records" className="space-y-6">
          {hasIndividualTracking ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Individual Animal Records</h3>
                <Button size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Records
                </Button>
              </div>
              
              {animals.length > 0 ? (
                <div className="space-y-4">
                  {animals.slice(0, 5).map(animal => (
                    <Card key={animal.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{animal.earTagNumber}</Badge>
                              <span className="font-medium">{animal.name || animal.species}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Health: {animal.healthStatus} • Weight: {animal.weight || "N/A"} lbs
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {animals.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline">
                        View All {animals.length} Records
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Individual Records</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add animals to start tracking individual records.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upgrade Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Individual animal records require Small Business tier or higher.
              </p>
              <Button>Upgrade Subscription</Button>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Livestock Management Settings</CardTitle>
                <CardDescription>Configure your livestock tracking preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Default Species</Label>
                    <p className="text-sm text-gray-600 mb-2">Set the default species when adding new animals</p>
                    <Select defaultValue="cattle">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIES_OPTIONS.map(species => (
                          <SelectItem key={species} value={species.toLowerCase()}>
                            {species}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Weight Units</Label>
                    <p className="text-sm text-gray-600 mb-2">Choose your preferred weight measurement</p>
                    <Select defaultValue="lbs">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Age Display</Label>
                    <p className="text-sm text-gray-600 mb-2">How to display animal ages</p>
                    <Select defaultValue="mixed">
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">Mixed (birthdate when available, manual otherwise)</SelectItem>
                        <SelectItem value="calculated">Calculated only (from birthdates)</SelectItem>
                        <SelectItem value="manual">Manual entry only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Auto-generate Ear Tags</Label>
                      <p className="text-sm text-gray-600">Automatically create ear tag numbers for new animals</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Health Alerts</Label>
                      <p className="text-sm text-gray-600">Send notifications for vaccination reminders</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions that affect all your livestock data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-600">Reset All Data</h4>
                    <p className="text-sm text-gray-600">Delete all herds and animals permanently</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Reset All</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset All Livestock Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete ALL herds ({herds.length}) and animals ({animals.length}). 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => {
                            deleteAllHerdsMutation.mutate();
                            deleteAllAnimalsMutation.mutate();
                          }}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Reset All Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Animal Dialog - Mobile Optimized */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingItem && 'earTagNumber' in editingItem ? 'Edit Animal' : 'Add New Animal'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="earTagNumber" className="text-sm sm:text-base">Ear Tag Number</Label>
                <Input
                  id="earTagNumber"
                  name="earTagNumber"
                  defaultValue={editingItem && 'earTagNumber' in editingItem ? editingItem.earTagNumber : ''}
                  placeholder="e.g., CATTLE-001"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-sm sm:text-base">Name (Optional)</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingItem && 'name' in editingItem ? editingItem.name || '' : ''}
                  placeholder="e.g., Bessie"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="species" className="text-sm sm:text-base">Species *</Label>
                <Select name="species" defaultValue={editingItem && 'species' in editingItem ? editingItem.species : ''}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map(species => (
                      <SelectItem key={species} value={species.toLowerCase()}>
                        {species}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sex" className="text-sm sm:text-base">Sex</Label>
                <Select name="sex" defaultValue={editingItem && 'sex' in editingItem ? editingItem.sex : ''}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="breed" className="text-sm sm:text-base">Breed</Label>
              <Input
                id="breed"
                name="breed"
                defaultValue={editingItem && 'breed' in editingItem ? editingItem.breed || '' : ''}
                placeholder="e.g., Angus"
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age" className="text-sm sm:text-base">Age</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  defaultValue={editingItem && 'age' in editingItem ? editingItem.age || '' : ''}
                  placeholder="Age"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="text-sm sm:text-base">Weight (lbs)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  defaultValue={editingItem && 'weight' in editingItem ? editingItem.weight || '' : ''}
                  placeholder="Weight"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="healthStatus" className="text-sm sm:text-base">Health Status</Label>
              <Select name="healthStatus" defaultValue={editingItem && 'healthStatus' in editingItem ? editingItem.healthStatus : 'healthy'}>
                <SelectTrigger className="h-10 sm:h-11">
                  <SelectValue placeholder="Select health status" />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status.toLowerCase().replace(' ', '_')}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm sm:text-base">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingItem && 'notes' in editingItem ? editingItem.notes || '' : ''}
                placeholder="Additional notes..."
                rows={3}
                className="text-sm sm:text-base resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <Button type="submit" className="w-full sm:flex-1 h-11 text-sm sm:text-base">
                {editingItem ? 'Update' : 'Add'} Animal
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto h-11 text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Health Record Dialog */}
      <Dialog open={showHealthRecordDialog} onOpenChange={setShowHealthRecordDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Health Record</DialogTitle>
            <DialogDescription>
              Record health events, treatments, and medical observations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="animal-select">Select Animal</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an animal" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map(animal => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.earTagNumber || animal.name || `${animal.species} ${animal.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="record-type">Record Type</Label>
              <Select>
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
              <Label htmlFor="condition">Condition/Treatment</Label>
              <Input placeholder="e.g., Annual vaccination, Hoof trimming" />
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea placeholder="Additional details..." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowHealthRecordDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Health record functionality coming soon!" });
                setShowHealthRecordDialog(false);
              }} className="flex-1">
                Add Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Breeding Record Dialog */}
      <Dialog open={showBreedingRecordDialog} onOpenChange={setShowBreedingRecordDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Breeding Record</DialogTitle>
            <DialogDescription>
              Track breeding activities, pregnancies, and reproductive management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="female-select">Female Animal</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose female" />
                </SelectTrigger>
                <SelectContent>
                  {animals.filter(a => a.sex?.toLowerCase() === 'female').map(animal => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.earTagNumber || animal.name || `${animal.species} ${animal.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="male-select">Male Animal (Optional)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose male" />
                </SelectTrigger>
                <SelectContent>
                  {animals.filter(a => a.sex?.toLowerCase() === 'male').map(animal => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.earTagNumber || animal.name || `${animal.species} ${animal.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="breeding-method">Breeding Method</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="artificial">Artificial Insemination</SelectItem>
                  <SelectItem value="embryo_transfer">Embryo Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="breeding-date">Breeding Date</Label>
              <Input type="date" />
            </div>
            <div>
              <Label htmlFor="expected-due">Expected Due Date</Label>
              <Input type="date" />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowBreedingRecordDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Breeding record functionality coming soon!" });
                setShowBreedingRecordDialog(false);
              }} className="flex-1">
                Add Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vaccination Schedule Dialog */}
      <Dialog open={showVaccinationSchedule} onOpenChange={setShowVaccinationSchedule}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vaccination Information</DialogTitle>
            <DialogDescription>
              Common vaccination options - completely optional and customizable to your farming approach
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cattle Vaccinations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>IBR/BVD/PI3/BRSV</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Clostridial (7-way)</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Leptospirosis</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Rabies</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Anthrax</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Brucellosis (Calfhood)</span>
                    <Badge variant="outline">One-time</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sheep Vaccinations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>CDT (Clostridium)</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Ovine EAE</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Vibrio</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Foot Rot</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Caseous Lymphadenitis</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Goat Vaccinations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>CDT (Clostridium)</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Caprine Arthritis</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Rabies</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Caseous Lymphadenitis</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Swine Vaccinations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>PRRS</span>
                    <Badge variant="outline">Semi-Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Swine Flu (H1N1/H3N2)</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Erysipelas</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Parvovirus</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Horse Vaccinations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Eastern/Western Encephalitis</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>West Nile Virus</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tetanus</span>
                    <Badge variant="outline">Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Rhinopneumonitis</span>
                    <Badge variant="outline">Semi-Annual</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Influenza</span>
                    <Badge variant="outline">Semi-Annual</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Important Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p className="mb-2"><strong>⚠️ Vaccination Choice:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mb-3">
                      <li><strong>Optional Program:</strong> All vaccinations are farmer's choice - you can opt out individually or completely</li>
                      <li><strong>Customizable Protocol:</strong> Create your own vaccination schedule based on your farming philosophy</li>
                      <li><strong>Organic/Natural Options:</strong> Many farmers choose minimal or no vaccination approaches</li>
                      <li><strong>Regional Variations:</strong> Local disease pressure may influence decisions</li>
                    </ul>
                    
                    <p className="mb-2"><strong>Timing Guidelines (if participating):</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Most vaccinations given 4-6 weeks before breeding</li>
                      <li>Pregnant animals: 2-4 weeks before birthing</li>
                      <li>Young animals may need booster shots</li>
                      <li>Consult your veterinarian for personalized advice</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Your Vaccination Approach</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Current Status:</strong> No vaccination protocol configured
                </p>
                <div className="flex gap-2 text-sm">
                  <Button variant="outline" size="sm" onClick={() => {
                    toast({ title: "Vaccination customization coming soon!" });
                  }}>
                    Set Up Custom Protocol
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    toast({ title: "Alternative health approaches coming soon!" });
                  }}>
                    Natural/Organic Options
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowVaccinationSchedule(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Genetic Analysis Dialog */}
      <Dialog open={showGeneticAnalysisDialog} onOpenChange={setShowGeneticAnalysisDialog}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Genetic Analysis</DialogTitle>
            <DialogDescription>
              Record genetic traits, breeding values, and analysis results
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="analysis-animal">Select Animal</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an animal" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map(animal => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.earTagNumber || animal.name || `${animal.species} ${animal.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="analysis-type">Analysis Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parentage">Parentage Verification</SelectItem>
                  <SelectItem value="genetic_defects">Genetic Defect Testing</SelectItem>
                  <SelectItem value="breeding_values">Breeding Value Assessment</SelectItem>
                  <SelectItem value="inbreeding">Inbreeding Coefficient</SelectItem>
                  <SelectItem value="genomic">Genomic Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="test-date">Test Date</Label>
              <Input type="date" />
            </div>
            <div>
              <Label htmlFor="laboratory">Laboratory/Provider</Label>
              <Input placeholder="e.g., Neogen, Zoetis, University Lab" />
            </div>
            <div>
              <Label htmlFor="results">Results/Scores</Label>
              <Textarea placeholder="Enter test results, genetic scores, or breeding values..." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowGeneticAnalysisDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Genetic analysis functionality coming soon!" });
                setShowGeneticAnalysisDialog(false);
              }} className="flex-1">
                Save Analysis
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Breeding Optimization Dialog */}
      <Dialog open={showBreedingOptimizationDialog} onOpenChange={setShowBreedingOptimizationDialog}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Breeding Optimization Recommendations</DialogTitle>
            <DialogDescription>
              AI-powered breeding suggestions based on your herd genetics and goals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Breeding Pairs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="border-l-4 border-green-500 pl-3">
                    <p className="font-medium">CATTLE-001 × CATTLE-003</p>
                    <p className="text-sm text-gray-600">Expected gain: +15% milk yield</p>
                    <Badge variant="outline" className="text-xs">95% confidence</Badge>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium">SHEEP-005 × SHEEP-012</p>
                    <p className="text-sm text-gray-600">Improved wool quality traits</p>
                    <Badge variant="outline" className="text-xs">88% confidence</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Genetic Goals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Milk Production</span>
                    <Progress value={75} className="w-20 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Disease Resistance</span>
                    <Progress value={60} className="w-20 h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Feed Efficiency</span>
                    <Progress value={80} className="w-20 h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Breeding Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Recommended Focus:</strong> Increase milk production while maintaining disease resistance</p>
                  <p className="text-sm"><strong>Genetic Diversity:</strong> Good - maintain current breeding approach</p>
                  <p className="text-sm"><strong>Inbreeding Risk:</strong> Low - continue with selected pairs</p>
                  <p className="text-sm"><strong>Next Review:</strong> 6 months or after next calving season</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={() => {
                toast({ title: "Breeding plan export coming soon!" });
              }} variant="outline" className="flex-1">
                Export Plan
              </Button>
              <Button onClick={() => setShowBreedingOptimizationDialog(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pedigree Dialog */}
      <Dialog open={showPedigreeDialog} onOpenChange={setShowPedigreeDialog}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Pedigree Information</DialogTitle>
            <DialogDescription>
              Record lineage and family tree information for breeding decisions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pedigree-animal">Select Animal</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an animal" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map(animal => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.earTagNumber || animal.name || `${animal.species} ${animal.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sire">Sire (Father)</Label>
                <Input placeholder="Sire ID or name" />
              </div>
              <div>
                <Label htmlFor="dam">Dam (Mother)</Label>
                <Input placeholder="Dam ID or name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paternal-grandsire">Paternal Grandsire</Label>
                <Input placeholder="Optional" />
              </div>
              <div>
                <Label htmlFor="paternal-granddam">Paternal Granddam</Label>
                <Input placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maternal-grandsire">Maternal Grandsire</Label>
                <Input placeholder="Optional" />
              </div>
              <div>
                <Label htmlFor="maternal-granddam">Maternal Granddam</Label>
                <Input placeholder="Optional" />
              </div>
            </div>
            <div>
              <Label htmlFor="registration">Registration Info</Label>
              <Input placeholder="Registration number, breed association, etc." />
            </div>
            <div>
              <Label htmlFor="pedigree-notes">Notes</Label>
              <Textarea placeholder="Additional pedigree information, awards, traits..." />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowPedigreeDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => {
                toast({ title: "Pedigree tracking functionality coming soon!" });
                setShowPedigreeDialog(false);
              }} className="flex-1">
                Save Pedigree
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}