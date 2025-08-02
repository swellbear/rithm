import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAnimalAgeInfo } from "@/lib/age-calculations";

export default function AgeManagementTest() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch animals to see age display
  const { data: animals = [], isLoading } = useQuery({
    queryKey: ["/api/animals"],
    queryFn: async () => {
      const response = await fetch("/api/animals");
      if (!response.ok) throw new Error("Failed to fetch animals");
      return response.json();
    }
  });

  // Fetch pending age updates
  const { data: pendingUpdates } = useQuery({
    queryKey: ["/api/animals/pending-age-updates"],
    queryFn: async () => {
      const response = await fetch("/api/animals/pending-age-updates");
      if (!response.ok) throw new Error("Failed to fetch pending updates");
      return response.json();
    }
  });

  // Run manual age update
  const updateAgesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/animals/update-ages", {});
      if (!response.ok) throw new Error("Failed to update ages");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals/pending-age-updates"] });
      toast({
        title: "Ages Updated Successfully",
        description: `Updated ${data.updated} animals. ${data.errors.length} errors.`,
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update animal ages. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update single animal age
  const updateSingleAgeMutation = useMutation({
    mutationFn: async (animalId: number) => {
      const response = await apiRequest("POST", `/api/animals/${animalId}/update-age`, {});
      if (!response.ok) throw new Error("Failed to update single animal age");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/animals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/animals/pending-age-updates"] });
      toast({
        title: "Age Updated",
        description: "Animal age updated successfully!",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading animals...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="header-section">
        <h1 className="text-2xl font-bold mb-2">Age Management System Test</h1>
        <p className="text-gray-600">
          Test automatic age calculation from birthdates and monthly age updates
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Age Update Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="text-2xl font-bold">{animals.length}</div>
              <div className="text-sm text-gray-600">Total Animals</div>
            </div>
            <div className="stat-card">
              <div className="text-2xl font-bold">{pendingUpdates?.count || 0}</div>
              <div className="text-sm text-gray-600">Pending Age Updates</div>
            </div>
            <div className="stat-card">
              <Button 
                onClick={() => updateAgesMutation.mutate()}
                disabled={updateAgesMutation.isPending}
                className="w-full"
              >
                {updateAgesMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Age Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animals List with Age Display */}
      <Card>
        <CardHeader>
          <CardTitle>Animals with Age Calculation</CardTitle>
          <CardDescription>
            Green text indicates ages calculated from birthdates, normal text indicates manual ages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {animals.map((animal: any) => {
              const ageInfo = getAnimalAgeInfo(animal);
              
              return (
                <div key={animal.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      {animal.earTagNumber || animal.name || `${animal.species} ${animal.id}` || 'Unnamed'}
                    </h4>
                    <Badge variant="outline">{animal.species}</Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Age:</strong>{' '}
                      <span className={ageInfo.isCalculated ? 'text-green-600 font-medium' : ''}>
                        {ageInfo.displayText}
                      </span>
                    </div>
                    
                    {animal.birthDate && (
                      <div>
                        <strong>Birth Date:</strong>{' '}
                        {new Date(animal.birthDate).toLocaleDateString()}
                      </div>
                    )}
                    
                    {animal.lastAgeUpdate && (
                      <div>
                        <strong>Last Update:</strong>{' '}
                        {new Date(animal.lastAgeUpdate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => updateSingleAgeMutation.mutate(animal.id)}
                    disabled={updateSingleAgeMutation.isPending}
                  >
                    Update Age
                  </Button>
                </div>
              );
            })}
          </div>
          
          {animals.length === 0 && (
            <Alert>
              <AlertDescription>
                No animals found. Add some animals first to test age calculation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Age Calculation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatic Calculation:</strong> Animals with birthdates show ages calculated in real-time (green text)
            </AlertDescription>
          </Alert>
          
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <strong>Manual Ages:</strong> Animals without birthdates use manual age entry and get updated monthly
            </AlertDescription>
          </Alert>
          
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              <strong>Scheduled Updates:</strong> The system automatically runs monthly updates on the 1st of each month
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}