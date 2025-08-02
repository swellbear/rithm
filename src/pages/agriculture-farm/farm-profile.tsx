import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapPin, Settings, Save, User } from "lucide-react";

interface FarmProfile {
  farmName: string;
  ownerName: string;
  zipCode: string;
  totalAcres: number;
  farmType: string;
  primaryGoals: string[];
  experienceLevel: string;
  description: string;
}

const FARM_TYPES = [
  "Cattle Ranch",
  "Sheep Farm", 
  "Goat Farm",
  "Mixed Livestock",
  "Dairy Operation",
  "Horse Ranch",
  "Regenerative Farm"
];

const EXPERIENCE_LEVELS = [
  "Beginner (0-2 years)",
  "Intermediate (3-5 years)", 
  "Experienced (6-10 years)",
  "Expert (10+ years)"
];

const GOAL_OPTIONS = [
  "Increase Profitability",
  "Improve Pasture Health",
  "Reduce Feed Costs",
  "Optimize Rotation",
  "Track Performance",
  "Regenerative Practices",
  "Carbon Sequestration",
  "Animal Welfare"
];

export default function FarmProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Fetch current farm profile
  const { data: profile, isLoading } = useQuery<FarmProfile>({
    queryKey: ["/api/farm-profile"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<FarmProfile>) => {
      return await apiRequest("POST", "/api/farm-profile", profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farm-profile"] });
      toast({
        title: "Profile Updated",
        description: "Your farm profile has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update farm profile.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const profileData: Partial<FarmProfile> = {
      farmName: formData.get("farmName") as string,
      ownerName: formData.get("ownerName") as string,
      zipCode: formData.get("zipCode") as string,
      totalAcres: Number(formData.get("totalAcres")),
      farmType: formData.get("farmType") as string,
      experienceLevel: formData.get("experienceLevel") as string,
      description: formData.get("description") as string,
      primaryGoals: selectedGoals
    };

    updateProfileMutation.mutate(profileData);
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">Farm Profile Setup</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure your farm details and management goals</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential details about your farm operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="farmName">Farm Name</Label>
                <Input
                  id="farmName"
                  name="farmName"
                  defaultValue={profile?.farmName || ""}
                  placeholder="Green Acres Ranch"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="ownerName">Owner/Manager Name</Label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  defaultValue={profile?.ownerName || user?.username || ""}
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  defaultValue={profile?.zipCode || ""}
                  placeholder="74701"
                  pattern="[0-9]{5}"
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalAcres">Total Acres</Label>
                <Input
                  id="totalAcres"
                  name="totalAcres"
                  type="number"
                  min="1"
                  defaultValue={profile?.totalAcres || ""}
                  placeholder="100"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Farm Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Farm Details
              </CardTitle>
              <CardDescription>
                Specify your operation type and experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="farmType">Farm Type</Label>
                <Select name="farmType" defaultValue={profile?.farmType || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FARM_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select name="experienceLevel" defaultValue={profile?.experienceLevel || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Farm Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={profile?.description || ""}
                  placeholder="Brief description of your operation, goals, and current practices..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Goals</CardTitle>
            <CardDescription>
              Select your main objectives for farm management (choose any that apply)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GOAL_OPTIONS.map(goal => (
                <Badge
                  key={goal}
                  variant={selectedGoals.includes(goal) ? "default" : "outline"}
                  className="cursor-pointer justify-center p-3 text-center hover:bg-green-100 dark:hover:bg-green-900"
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </Badge>
              ))}
            </div>
            {selectedGoals.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Selected: {selectedGoals.join(", ")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateProfileMutation.isPending ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}