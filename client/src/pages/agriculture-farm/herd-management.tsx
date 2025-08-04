import { useState } from "react";
import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { performComprehensiveMilestoneReset, createFarmData } from "@/lib/milestone-reset-system";
import { validateAndResetMilestones, forceResetHerdMilestone } from "@/lib/immediate-milestone-checker";
import { Users, Plus, Edit, Trash2, Heart, Scale, Calendar, AlertTriangle } from "lucide-react";

interface Animal {
  id: number;
  earTag: string;
  species: string;
  breed?: string;
  gender: string;
  age?: number;
  weight?: number;
  healthStatus: string;
  notes?: string;
  groupId?: number;
  createdAt: string;
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

const SPECIES_OPTIONS = [
  "Cattle",
  "Sheep", 
  "Goat",
  "Horse",
  "Pig"
];

const HEALTH_STATUS_OPTIONS = [
  "Healthy",
  "Under Treatment",
  "Quarantine",
  "Pregnant",
  "Lactating",
  "Sick"
];

const CATTLE_BREEDS = [
  "Angus", "Hereford", "Charolais", "Simmental", "Limousin", "Brahman", "Brangus", "Other"
];

const SHEEP_BREEDS = [
  "Dorper", "Katahdin", "Suffolk", "Texel", "Romney", "Merino", "Other"
];

const GOAT_BREEDS = [
  "Boer", "Kiko", "Spanish", "Nubian", "Alpine", "Saanen", "Other"
];

export default function HerdManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"herds" | "animals">("herds");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Herd | Animal | null>(null);
  const [herdComposition, setHerdComposition] = useState<Array<{species: string, count: number, breed?: string}>>([
    { species: "", count: 0, breed: "" }
  ]);

  // Get user's subscription tier limits
  const tier = user?.subscriptionTier || "free";
  const animalLimit = tier === "free" ? 50 : tier === "small_farm" ? 250 : tier === "professional" ? 1000 : 9999;

  // Fetch herds and animals
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

  // Check and reset milestones on component mount
  React.useEffect(() => {
    if (!herdsLoading && !animalsLoading) {
      validateAndResetMilestones();
    }
  }, [herdsLoading, animalsLoading]);

  const createHerdMutation = useMutation({
    mutationFn: async (herdData: Omit<Herd, "id" | "createdAt">) => {
      return await apiRequest("POST", "/api/herds", herdData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] }); // Invalidate animals cache for auto-populated animals
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

  const updateHerdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest("PUT", `/api/herds/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] }); // Invalidate animals cache for auto-populated animals
      setIsDialogOpen(false);
      setEditingItem(null);
      setHerdComposition([{ species: "", count: 0, breed: "" }]);
      toast({
        title: "Herd Updated",
        description: "The herd composition has been updated successfully."
      });
    }
  });

  const deleteHerdMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/herds/${id}`);
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      
      // Perform comprehensive milestone reset check
      const remainingHerds = herds.filter(h => h.id !== variables);
      const farmData = createFarmData(remainingHerds, paddocks, animals, assessments);
      
      console.log('Herd deletion - checking milestone reset:', {
        remainingHerds: remainingHerds.length,
        farmData,
        deletedHerdId: variables
      });
      
      await performComprehensiveMilestoneReset(farmData);
      
      toast({
        title: "Herd Deleted",
        description: "The herd has been removed."
      });
    }
  });

  const updateAnimalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest("PUT", `/api/animals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/livestock/bulk-delete");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/herds"] });
      
      // Reset the first_herd_added milestone since all herds are deleted
      if (data.deletedHerds > 0) {
        const milestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
        const updatedMilestones = milestones.filter((m: string) => m !== 'first_herd_added');
        localStorage.setItem('cadence-completed-milestones', JSON.stringify(updatedMilestones));
        
        // Trigger storage event for cross-component updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cadence-completed-milestones',
          newValue: JSON.stringify(updatedMilestones),
          storageArea: localStorage
        }));
        
        console.log('Reset first_herd_added milestone after bulk delete - workflow widget should show "Add Your First Herd" task');
      }
      
      toast({
        title: "All Livestock Deleted",
        description: `Successfully removed ${data.deletedHerds} herds and ${data.deletedAnimals} individual animals.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete livestock.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (activeTab === "herds") {
      // Validate composition
      const validComposition = herdComposition.filter(item => 
        item.species && item.count > 0
      );
      
      if (validComposition.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one species with a valid count.",
          variant: "destructive",
        });
        return;
      }
      
      const totalCount = validComposition.reduce((sum, item) => sum + item.count, 0);
      
      const herdData = {
        name: formData.get("name") as string,
        composition: validComposition,
        totalCount: totalCount,
        notes: formData.get("notes") as string || undefined,
      };
      
      if (editingItem) {
        // Add change reason to notes if provided
        const changeReason = formData.get("changeReason") as string;
        if (changeReason && herdData.notes) {
          herdData.notes = `${herdData.notes} [${changeReason}]`;
        } else if (changeReason) {
          herdData.notes = `Changes: ${changeReason}`;
        }
        updateHerdMutation.mutate({ id: editingItem.id, data: herdData });
      } else {
        createHerdMutation.mutate(herdData);
      }
      
      // Reset form
      setHerdComposition([{ species: "", count: 0, breed: "" }]);
    } else {
      const animalData = {
        earTag: formData.get("earTag") as string,
        species: formData.get("species") as string,
        breed: formData.get("breed") as string || undefined,
        gender: formData.get("gender") as string,
        age: formData.get("age") ? Number(formData.get("age")) : undefined,
        weight: formData.get("weight") ? Number(formData.get("weight")) : undefined,
        healthStatus: formData.get("healthStatus") as string,
        notes: formData.get("notes") as string || undefined,
      };
      
      if (editingItem) {
        updateAnimalMutation.mutate({ id: editingItem.id, data: animalData });
      } else {
        createAnimalMutation.mutate(animalData);
      }
    }
  };

  const openCreateDialog = () => {
    if (activeTab === "animals" && animals.length >= animalLimit) {
      toast({
        title: "Animal Limit Reached",
        description: `Your ${tier} plan allows up to ${animalLimit} livestock. Upgrade to add more.`,
        variant: "destructive"
      });
      return;
    }
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const getBreedOptions = (species: string) => {
    switch (species) {
      case "Cattle": return CATTLE_BREEDS;
      case "Sheep": return SHEEP_BREEDS;  
      case "Goat": return GOAT_BREEDS;
      default: return ["Other"];
    }
  };

  const totalAnimals = animals.length;
  const healthyAnimals = animals.filter(a => a.healthStatus === "Healthy").length;
  const averageAge = animals.length > 0 ? 
    animals.filter(a => a.age).reduce((sum, a) => sum + (a.age || 0), 0) / animals.filter(a => a.age).length : 0;

  if (herdsLoading || animalsLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Livestock Management</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {tier === "free" || tier === "basic" 
                ? "Manage livestock in groups (e.g., '25 cattle + 10 sheep')"
                : "Track and manage your herds and individual livestock"
              }
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Bulk Delete Button - Only show if user has livestock */}
          {(herds.length > 0 || animals.length > 0) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Delete All Livestock?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {herds.length} herds and {animals.length} individual animals from your farm. This action cannot be undone.
                    <br /><br />
                    Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => bulkDeleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={bulkDeleteMutation.isPending}
                  >
                    {bulkDeleteMutation.isPending ? "Deleting..." : "Delete All Livestock"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Button 
            onClick={() => {
              console.log('🔧 Before reset - checking current state...');
              console.log('Current herds:', herds.length);
              console.log('Current animals:', animals.length);
              console.log('Current milestones:', JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]'));
              
              forceResetHerdMilestone();
              
              setTimeout(() => {
                const currentMilestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
                console.log('✅ After reset - milestones now:', currentMilestones);
                console.log('first_herd_added removed?', !currentMilestones.includes('first_herd_added'));
                console.log('Current farm state - hasHerds:', herds.length > 0, 'hasAnimals:', animals.length > 0);
                console.log('Task should now appear in workflow widget!');
                
                // Force a page refresh to ensure widget updates
                window.location.reload();
              }, 1000);
              
              toast({
                title: "Milestone Reset Complete!",
                description: "Task will stay visible now - sync prevention is active."
              });
            }}
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            🔧 Reset & Show Task
          </Button>
          
          <Button 
            onClick={async () => {
              const milestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
              console.log('📊 Current milestones:', milestones);
              
              // Test comprehensive milestone reset
              console.log('🔍 Testing comprehensive milestone reset...');
              const farmData = createFarmData(herds, paddocks, animals, assessments);
              await performComprehensiveMilestoneReset(farmData);
              
              toast({
                title: "Comprehensive Test Complete",
                description: `Found ${milestones.length} milestones. Comprehensive reset test performed. Check console for details.`
              });
            }}
            variant="outline"
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            🧪 Full System Test
          </Button>
          
          <Button 
            onClick={() => {
              const milestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
              console.log('📊 Current milestones:', milestones);
              console.log('📊 Farm data summary:', {
                herds: herds.length,
                paddocks: paddocks.length, 
                animals: animals.length,
                assessments: assessments.length
              });
              toast({
                title: "Current Milestones",
                description: `Found ${milestones.length} completed milestones. Check console for full list.`
              });
            }}
            variant="outline"
            className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
          >
            📊 Show Milestones
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add {activeTab === "herds" ? "Herd" : "Animal"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-base sm:text-lg">
                {editingItem ? "Edit" : "Add New"} {activeTab === "herds" ? "Herd" : "Animal"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {activeTab === "herds" ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Herd Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Mixed Grazing Group"
                      defaultValue={editingItem?.name || ""}
                      required
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">Livestock Composition</Label>
                    {herdComposition.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 border rounded">
                        <div className="space-y-1">
                          <Label className="text-xs">Species</Label>
                          <Select 
                            value={item.species} 
                            onValueChange={(value) => {
                              const newComposition = [...herdComposition];
                              newComposition[index].species = value;
                              setHerdComposition(newComposition);
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select species" />
                            </SelectTrigger>
                            <SelectContent>
                              {SPECIES_OPTIONS.map(species => (
                                <SelectItem key={species} value={species.toLowerCase()}>{species}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs">Count</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.count || ""}
                            onChange={(e) => {
                              const newComposition = [...herdComposition];
                              newComposition[index].count = parseInt(e.target.value) || 0;
                              setHerdComposition(newComposition);
                            }}
                            placeholder="25"
                            className="h-8"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs">Breed (Optional)</Label>
                          <Input
                            value={item.breed || ""}
                            onChange={(e) => {
                              const newComposition = [...herdComposition];
                              newComposition[index].breed = e.target.value;
                              setHerdComposition(newComposition);
                            }}
                            placeholder="Angus, Dorper..."
                            className="h-8"
                          />
                        </div>
                        
                        <div className="flex items-end gap-1">
                          {herdComposition.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setHerdComposition(herdComposition.filter((_, i) => i !== index));
                              }}
                              className="h-8 px-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setHerdComposition([...herdComposition, { species: "", count: 0, breed: "" }]);
                      }}
                      className="w-full h-8"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Add Another Species
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder={editingItem ? "Update notes (e.g., '3 cattle acquired, 1 sheep sold')..." : "Additional information about this herd..."}
                      defaultValue={editingItem?.notes || ""}
                      rows={3}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                  
                  {editingItem && (
                    <div className="space-y-1.5">
                      <Label htmlFor="changeReason" className="text-sm">Reason for Changes (Optional)</Label>
                      <Select name="changeReason">
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select reason for herd changes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acquisition">Acquisition - Purchased livestock</SelectItem>
                          <SelectItem value="birth">Birth - New births</SelectItem>
                          <SelectItem value="death">Death - Natural/illness</SelectItem>
                          <SelectItem value="sale">Sale - Sold livestock</SelectItem>
                          <SelectItem value="transfer">Transfer - Moved between herds</SelectItem>
                          <SelectItem value="other">Other - See notes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="earTag" className="text-sm">Ear Tag/ID</Label>
                      <Input
                        id="earTag"
                        name="earTag"
                        placeholder="001"
                        required
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="species" className="text-sm">Species</Label>
                      <Select name="species" required>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select species" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIES_OPTIONS.map(species => (
                            <SelectItem key={species} value={species}>{species}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="gender" className="text-sm">Gender</Label>
                      <Select name="gender" required>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Castrated">Castrated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="healthStatus" className="text-sm">Health Status</Label>
                      <Select name="healthStatus" required>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {HEALTH_STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="age" className="text-sm">Age (months, optional)</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        min="0"
                        placeholder="24"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="weight" className="text-sm">Weight (lbs, optional)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        min="0"
                        placeholder="1200"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Health records, breeding notes, etc..."
                      rows={3}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-10 px-4 text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createHerdMutation.isPending || updateHerdMutation.isPending || createAnimalMutation.isPending}
                  className="h-10 px-4 text-sm"
                >
                  {editingItem ? "Update" : "Add"} {activeTab === "herds" ? "Herd" : "Livestock"}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tab Navigation - Tier Aware */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "herds"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
          onClick={() => setActiveTab("herds")}
        >
          Herd Groups ({herds.length})
        </button>
        
        {/* Show individual livestock tab based on tier */}
        {tier !== "free" && tier !== "basic" ? (
          <button
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "animals"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
            onClick={() => setActiveTab("animals")}
          >
            Individual Livestock ({totalAnimals}/{animalLimit})
          </button>
        ) : (
          <button
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-900"
            onClick={() => {
              toast({
                title: "Individual Tracking Available with Upgrade",
                description: "For Basic tier, focus on simple herd groups like '25 cattle + 10 sheep'. Individual livestock tracking comes with Small Business plans.",
                variant: "default"
              });
            }}
          >
            Individual Livestock <Badge variant="secondary" className="ml-1 text-xs">Pro</Badge>
          </button>
        )}
      </div>

      {/* Summary Stats - Only for Small Business+ tiers */}
      {tier !== "free" && tier !== "basic" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalAnimals}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Livestock</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{healthyAnimals}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Healthy</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{herds.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Herds</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{averageAge.toFixed(1)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Age (mo)</div>
          </Card>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === "herds" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {herds.map(herd => (
            <Card key={herd.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    {herd.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingItem(herd);
                        setHerdComposition(herd.composition || []);
                        setIsDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Herd "{herd.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the herd and all {herd.totalCount} individual animals that were created from it. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteHerdMutation.mutate(herd.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Herd
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Display mixed herd composition */}
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
                  // Fallback for old single-species herds
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
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Herd
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animals.map(animal => (
            <Card key={animal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {animal.earTagNumber || animal.name || `${animal.species} ${animal.id}`}
                    </Badge>
                    {animal.species}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingItem(animal);
                        setIsDialogOpen(true);
                        // Focus on the first input field in the dialog
                        setTimeout(() => {
                          const firstInput = document.querySelector('input[name="earTag"]') as HTMLElement;
                          if (firstInput) {
                            firstInput.focus();
                            firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 200);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteAnimalMutation.mutate(animal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <Badge 
                    variant={animal.healthStatus === "Healthy" ? "default" : "destructive"}
                  >
                    {animal.healthStatus}
                  </Badge>
                  <span className="text-sm">{animal.gender}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {animal.age && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {animal.age} mo
                    </div>
                  )}
                  {animal.weight && (
                    <div className="flex items-center gap-1">
                      <Scale className="h-4 w-4 text-gray-500" />
                      {animal.weight} lbs
                    </div>
                  )}
                </div>

                {animal.breed && (
                  <Badge variant="outline">{animal.breed}</Badge>
                )}
                
                {animal.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {animal.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {animals.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Individual Livestock</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add individual livestock for detailed tracking and health records.
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Livestock
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}