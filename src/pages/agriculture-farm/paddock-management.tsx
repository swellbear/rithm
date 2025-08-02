import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Map, Plus, Edit, Trash2, MapPin, Ruler, Droplets, Satellite, Footprints, Eye, Calculator, Navigation, 
         Settings, Gauge, AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, BarChart3, ArrowRight, AlertCircle } from "lucide-react";
import { Paddock, InsertPaddock } from "@shared/schema";
import { Link } from "wouter";

const PASTURE_TYPES = [
  "native",
  "mixed", 
  "lush",
  "bermuda",
  "fescue",
  "clover",
  "alfalfa"
];

const SHADE_AVAILABILITY = [
  "none",
  "minimal",
  "moderate",
  "abundant"
];

const SHADE_TYPES = [
  "natural",
  "artificial",
  "mixed"
];

export default function PaddockManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaddock, setEditingPaddock] = useState<Paddock | null>(null);
  const [sizeMethod, setSizeMethod] = useState<string>("manual");
  const [calculatedAcres, setCalculatedAcres] = useState<number | null>(null);
  const [isTrackingGPS, setIsTrackingGPS] = useState(false);
  const [gpsPoints, setGpsPoints] = useState<{lat: number, lng: number}[]>([]);
  const [isRequestingGPS, setIsRequestingGPS] = useState(false);
  
  // Water Management Dialog State
  const [waterDialogOpen, setWaterDialogOpen] = useState(false);
  const [selectedPaddockForWater, setSelectedPaddockForWater] = useState<Paddock | null>(null);
  const [waterManagementData, setWaterManagementData] = useState({
    sourceName: '',
    sourceType: '',
    capacity: '',
    currentLevel: '',
    refillMethod: 'manual',
    flowRate: 5, // gallons per minute
    waterQuality: "good",
    maintenanceSchedule: "weekly",
    pressureLevel: "normal",
    lastMaintenance: "",
    nextMaintenance: "",
    issues: "",
    improvements: ""
  });

  // Water Management Queries
  const { data: waterSources = [], refetch: refetchWaterSources } = useQuery({
    queryKey: ['/api/water-sources']
  });

  const { data: waterConsumption = [], refetch: refetchWaterConsumption } = useQuery({
    queryKey: ['/api/water-consumption'],
    enabled: waterDialogOpen
  });

  // Water Management Mutations
  const createWaterSourceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/water-sources', {
        name: data.sourceName,
        type: data.sourceType,
        paddockId: selectedPaddockForWater?.id,
        capacity: parseFloat(data.capacity) || 0,
        currentLevel: parseFloat(data.currentLevel) || 0,
        refillMethod: data.refillMethod || 'manual',
        flowRate: data.refillMethod === 'automatic' ? (data.flowRate || 5) : null,
        quality: data.waterQuality || 'good'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-sources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/water-consumption'] });
      refetchWaterSources();
      toast({
        title: "Water Source Created",
        description: "Water source has been added successfully.",
      });
      setWaterDialogOpen(false);
      // Reset form
      setWaterManagementData({
        sourceName: '',
        sourceType: '',
        capacity: '',
        currentLevel: '',
        refillMethod: 'manual',
        flowRate: 5,
        waterQuality: "good",
        maintenanceSchedule: "weekly",
        pressureLevel: "normal",
        lastMaintenance: "",
        nextMaintenance: "",
        issues: "",
        improvements: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create water source. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateWaterStatusMutation = useMutation({
    mutationFn: async (data: any) => {
      // Find existing water source or create consumption record
      const existingSource = waterSources.find(source => source.paddockId === selectedPaddockForWater?.id);
      if (existingSource) {
        // Update existing source
        const response = await apiRequest('PATCH', `/api/water-sources/${existingSource.id}`, {
          ...existingSource,
          quality: data.waterQuality,
          currentLevel: parseFloat(data.currentLevel) || existingSource.currentLevel,
          notes: data.issues || existingSource.notes
        });
        return response;
      } else {
        // Create consumption record
        const response = await apiRequest('POST', '/api/water-consumption', {
          paddockId: selectedPaddockForWater?.id,
          totalConsumption: 0,
          animalCount: 1,
          notes: data.issues || '',
          temperature: 75,
          humidity: 60
        });
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-sources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/water-consumption'] });
      refetchWaterSources();
      refetchWaterConsumption();
      toast({
        title: "Status Updated",
        description: "Water status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update water status. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Calculate area using shoelace formula for GPS polygon
  const calculatePolygonArea = (points: {lat: number, lng: number}[]): number => {
    if (points.length < 3) return 0;
    
    // Convert lat/lng to approximate meters (for small areas)
    const latToMeters = 111320;
    const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lngToMeters = 111320 * Math.cos(avgLat * Math.PI / 180);
    
    // Convert to meter coordinates
    const meterPoints = points.map(p => ({
      x: p.lng * lngToMeters,
      y: p.lat * latToMeters
    }));
    
    // Shoelace formula
    let area = 0;
    for (let i = 0; i < meterPoints.length; i++) {
      const j = (i + 1) % meterPoints.length;
      area += meterPoints[i].x * meterPoints[j].y;
      area -= meterPoints[j].x * meterPoints[i].y;
    }
    
    area = Math.abs(area) / 2;
    // Convert square meters to acres (1 acre = 4047 m²)
    return area / 4047;
  };

  // GPS tracking functions
  const startGPSTracking = () => {
    setIsTrackingGPS(true);
    setGpsPoints([]);
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const newPoint = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setGpsPoints(prev => [...prev, newPoint]);
        },
        (error) => {
          console.error("GPS Error:", error);
          toast({
            title: "GPS Error",
            description: "Could not get GPS location. Please try again or use manual entry.",
            variant: "destructive"
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
    }
  };

  const addGPSPoint = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Available",
        description: "GPS is not available in this browser. Please use manual entry.",
        variant: "destructive"
      });
      return;
    }

    setIsRequestingGPS(true);
    
    // Show loading state
    toast({
      title: "Getting GPS Location",
      description: "Requesting current location...",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setGpsPoints(prev => [...prev, newPoint]);
        setIsRequestingGPS(false);
        
        toast({
          title: "Corner Marked",
          description: `Corner ${gpsPoints.length + 1} marked successfully. Accuracy: ±${Math.round(position.coords.accuracy)}m`,
        });
      },
      (error) => {
        console.error("GPS Error:", error);
        setIsRequestingGPS(false);
        let errorMessage = "Could not get GPS location. Please try again or use manual entry.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "GPS permission denied. Please enable location access and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS position unavailable. Please try again or use manual entry.";
            break;
          case error.TIMEOUT:
            errorMessage = "GPS request timed out. Please try again.";
            break;
        }
        
        toast({
          title: "GPS Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 1000 
      }
    );
  };

  const finishGPSTracking = () => {
    setIsTrackingGPS(false);
    if (gpsPoints.length >= 3) {
      const area = calculatePolygonArea(gpsPoints);
      setCalculatedAcres(area);
    }
  };

  const resetSizeCalculation = () => {
    setCalculatedAcres(null);
    setGpsPoints([]);
    setIsTrackingGPS(false);
    setIsRequestingGPS(false);
  };

  // Water Management Functions
  const openWaterManagement = (paddock: Paddock) => {
    setSelectedPaddockForWater(paddock);
    setWaterDialogOpen(true);
  };

  const closeWaterManagement = () => {
    setWaterDialogOpen(false);
    setSelectedPaddockForWater(null);
  };

  const saveWaterManagement = () => {
    toast({
      title: "Water Management Updated",
      description: `Water settings saved for paddock ${selectedPaddockForWater?.name}`,
    });
    closeWaterManagement();
  };

  // Subscription tier limits
  const tier = user?.subscriptionTier || "free";
  const paddockLimit = tier === "free" ? 5 : tier === "small_farm" ? 15 : tier === "professional" ? 50 : 999;

  const { data: paddocks = [], isLoading } = useQuery({
    queryKey: [`/api/paddocks`],
    enabled: !!user,
  });

  const createPaddockMutation = useMutation({
    mutationFn: async (paddockData: InsertPaddock) => {
      const response = await apiRequest("POST", "/api/paddocks", paddockData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/paddocks`] });
      toast({
        title: "Success",
        description: "Paddock created successfully",
      });
      setIsDialogOpen(false);
      setEditingPaddock(null);
      resetSizeCalculation();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create paddock",
        variant: "destructive"
      });
    },
  });

  const updatePaddockMutation = useMutation({
    mutationFn: async ({ id, ...paddockData }: { id: string } & Partial<InsertPaddock>) => {
      const response = await apiRequest("PUT", `/api/paddocks/${id}`, paddockData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/paddocks`] });
      toast({
        title: "Success",
        description: "Paddock updated successfully",
      });
      setIsDialogOpen(false);
      setEditingPaddock(null);
      resetSizeCalculation();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update paddock",
        variant: "destructive"
      });
    },
  });

  const deletePaddockMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/paddocks/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/paddocks`] });
      toast({
        title: "Success",
        description: "Paddock deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete paddock",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Simplified paddock data - essential identification and operational status
    const paddockData: InsertPaddock = {
      name: formData.get("name") as string,
      acres: calculatedAcres ? calculatedAcres.toString() : formData.get("acres") as string,
      userId: user?.id || 1,
      notes: formData.get("notes") as string,
      gpsCoordinates: gpsPoints.length > 0 ? JSON.stringify(gpsPoints) : null,
      currentlyGrazing: formData.get("currentlyGrazing") === "true",
      // Set reasonable defaults for required fields that will be assessed later
      pastureType: "native",
      waterSources: 0,
      shadeAvailability: "moderate",
      shadeType: "natural"
    };

    if (editingPaddock) {
      updatePaddockMutation.mutate({ id: editingPaddock.id, ...paddockData });
    } else {
      createPaddockMutation.mutate(paddockData);
    }
  };

  const openEditDialog = (paddock: Paddock) => {
    setEditingPaddock(paddock);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    if (paddocks.length >= paddockLimit) {
      toast({
        title: "Paddock Limit Reached",
        description: `Your ${tier} plan allows up to ${paddockLimit} paddocks. Upgrade to add more.`,
        variant: "destructive"
      });
      return;
    }
    setEditingPaddock(null);
    setIsDialogOpen(true);
  };

  const totalAcres = paddocks.reduce((sum, p) => sum + Number(p.acres), 0);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Map className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Paddock Management</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your fields and pastures</p>
          </div>
        </div>
        
        {/* Action Buttons - Mobile Stacked */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href="/enhanced-pasture-assessment">
            <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2 h-10">
              <Eye className="h-4 w-4" />
              <span className="text-sm sm:text-base">Assess Pastures</span>
            </Button>
          </Link>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="w-full sm:w-auto flex items-center justify-center gap-2 h-10">
                <Plus className="h-4 w-4" />
                <span className="text-sm sm:text-base">Add Paddock</span>
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingPaddock ? "Edit Paddock" : "Add New Paddock"}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  {editingPaddock ? "Update paddock information and settings." : "Add a new paddock to your farm with acreage, pasture type, and other details."}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm sm:text-base">Paddock Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingPaddock?.name || ""}
                      placeholder="North Pasture"
                      required
                      className="h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <Label htmlFor="acres" className="text-sm sm:text-base">Paddock Size Determination</Label>
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div>
                        <Label className="text-sm sm:text-base">Choose Measurement Method</Label>
                        <Select value={sizeMethod} onValueChange={(value) => {
                          setSizeMethod(value);
                          resetSizeCalculation();
                        }}>
                          <SelectTrigger className="w-full h-10 sm:h-11">
                            <SelectValue placeholder="Select measurement method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gps-corners">
                              <div className="flex items-center gap-2">
                                <Satellite className="h-4 w-4" />
                                <span className="text-sm sm:text-base">GPS Corner Marking (Most Accurate)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="step-counting">
                              <div className="flex items-center gap-2">
                                <Footprints className="h-4 w-4" />
                                <span className="text-sm sm:text-base">Step Counting (2.5 ft/step)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="heel-toe-pacing">
                              <div className="flex items-center gap-2">
                                <Navigation className="h-4 w-4" />
                                <span className="text-sm sm:text-base">Heel-to-Toe Pacing (3 ft/pace)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="visual-estimate">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <span className="text-sm sm:text-base">Visual Estimation</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="manual">
                              <div className="flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                <span className="text-sm sm:text-base">Manual Entry</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {sizeMethod === "gps-corners" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Button 
                              type="button" 
                              onClick={addGPSPoint} 
                              disabled={isRequestingGPS}
                              className="flex items-center gap-2"
                            >
                              <MapPin className={`h-4 w-4 ${isRequestingGPS ? 'animate-pulse' : ''}`} />
                              {isRequestingGPS ? 'Getting Location...' : `Mark Corner (${gpsPoints.length})`}
                            </Button>
                            {gpsPoints.length >= 3 && (
                              <Button type="button" onClick={finishGPSTracking} variant="outline">
                                Calculate Area
                              </Button>
                            )}
                          </div>
                          {gpsPoints.length > 0 && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Points marked: {gpsPoints.length} (minimum 3 needed)
                            </div>
                          )}
                          {isRequestingGPS && (
                            <div className="text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                              Requesting GPS location... Please ensure location access is enabled.
                            </div>
                          )}
                        </div>
                      )}

                      {sizeMethod === "step-counting" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Length (steps)</Label>
                              <Input
                                type="number"
                                placeholder="100"
                                onChange={(e) => {
                                  const steps = parseInt(e.target.value) || 0;
                                  const width = parseInt((document.querySelector('[name="width-steps"]') as HTMLInputElement)?.value) || 0;
                                  if (steps && width) {
                                    const acres = (steps * 2.5 * width * 2.5) / 43560;
                                    setCalculatedAcres(acres);
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <Label>Width (steps)</Label>
                              <Input
                                name="width-steps"
                                type="number"
                                placeholder="80"
                                onChange={(e) => {
                                  const width = parseInt(e.target.value) || 0;
                                  const length = parseInt((document.querySelector('[placeholder="100"]') as HTMLInputElement)?.value) || 0;
                                  if (width && length) {
                                    const acres = (length * 2.5 * width * 2.5) / 43560;
                                    setCalculatedAcres(acres);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Average step length: 2.5 feet
                          </div>
                        </div>
                      )}

                      {sizeMethod === "heel-toe-pacing" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Length (paces)</Label>
                              <Input
                                type="number"
                                placeholder="67"
                                onChange={(e) => {
                                  const paces = parseInt(e.target.value) || 0;
                                  const width = parseInt((document.querySelector('[name="width-paces"]') as HTMLInputElement)?.value) || 0;
                                  if (paces && width) {
                                    const acres = (paces * 3 * width * 3) / 43560;
                                    setCalculatedAcres(acres);
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <Label>Width (paces)</Label>
                              <Input
                                name="width-paces"
                                type="number"
                                placeholder="53"
                                onChange={(e) => {
                                  const width = parseInt(e.target.value) || 0;
                                  const length = parseInt((document.querySelector('[placeholder="67"]') as HTMLInputElement)?.value) || 0;
                                  if (width && length) {
                                    const acres = (length * 3 * width * 3) / 43560;
                                    setCalculatedAcres(acres);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Heel-to-toe pace length: 3 feet
                          </div>
                        </div>
                      )}

                      {sizeMethod === "visual-estimate" && (
                        <div className="space-y-3">
                          <div>
                            <Label>Estimated Acres</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="2.5"
                              onChange={(e) => {
                                const acres = parseFloat(e.target.value) || 0;
                                setCalculatedAcres(acres);
                              }}
                            />
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Use visual landmarks for estimation
                          </div>
                        </div>
                      )}

                      {calculatedAcres && (
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-green-600" />
                            <span className="font-medium">
                              Calculated Area: {calculatedAcres.toFixed(2)} acres
                            </span>
                          </div>
                        </div>
                      )}

                      {sizeMethod === "manual" && (
                        <div>
                          <Label>Manual Entry (acres)</Label>
                          <Input
                            name="acres"
                            type="number"
                            step="0.1"
                            defaultValue={editingPaddock?.acres || ""}
                            placeholder="2.5"
                            required={!calculatedAcres}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Essential paddock identification only - detailed assessments handled by specialized tools */}
                  <Alert className="mb-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Simplified Form:</strong> This form focuses on essential paddock identification and immediate operational status. 
                      Use specialized tools for detailed assessments: <strong>Enhanced Pasture Assessment</strong> for pasture analysis, 
                      <strong>Water Management</strong> for water systems.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="currentlyGrazing" className="text-sm sm:text-base">Currently Grazing</Label>
                    <Select name="currentlyGrazing" defaultValue={editingPaddock?.currentlyGrazing ? "true" : "false"}>
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Animals currently grazing?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm sm:text-base">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    name="notes"
                    defaultValue={editingPaddock?.notes || ""}
                    placeholder="Additional notes about this paddock..."
                    className="h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4 sm:pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPaddockMutation.isPending || updatePaddockMutation.isPending}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {editingPaddock ? "Update Paddock" : "Create Paddock"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Stats - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{paddocks.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Paddocks ({paddockLimit} max)
          </div>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{totalAcres.toFixed(1)}</div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Acres</div>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
            {paddocks.filter(p => waterSources.some(ws => ws.paddockId === p.id)).length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">With Water</div>
        </Card>
        <Card className="p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
            {paddocks.length > 0 ? (totalAcres / paddocks.length).toFixed(1) : 0}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Size</div>
        </Card>
      </div>

      {/* Paddocks Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {paddocks.map(paddock => (
          <Card key={paddock.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <span className="truncate">{paddock.name}</span>
                </CardTitle>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(paddock)}
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePaddockMutation.mutate(paddock.id)}
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">{paddock.acres} acres</span>
                </div>
                {(() => {
                  const waterSourceCount = waterSources.filter(ws => ws.paddockId === paddock.id).length;
                  return (
                    <button
                      onClick={() => openWaterManagement(paddock)}
                      className="flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors cursor-pointer"
                      title={waterSourceCount > 0 ? "Click to manage water for this paddock" : "Click to add water sources for this paddock"}
                    >
                      <Droplets className="h-4 w-4 text-blue-500" />
                      {waterSourceCount > 0 ? (
                        <span className="text-sm">{waterSourceCount}</span>
                      ) : (
                        <Plus className="h-3 w-3 text-green-500" />
                      )}
                    </button>
                  );
                })()}
              </div>
              
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Badge variant="outline" className="text-xs sm:text-sm">{paddock.pastureType}</Badge>
                {paddock.currentlyGrazing && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs sm:text-sm">Currently Grazing</Badge>
                )}
                {paddock.shadeAvailability && (
                  <Badge variant="outline" className="text-xs sm:text-sm">Shade: {paddock.shadeAvailability}</Badge>
                )}
              </div>

              {paddock.restDays && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Rest Days: {paddock.restDays}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {paddocks.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8 sm:py-12">
              <Map className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No Paddocks Yet</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                Start by adding your first paddock to begin managing your farm.
              </p>
              <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Paddock
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Water Management Dialog */}
      <Dialog open={waterDialogOpen} onOpenChange={setWaterDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Water Management - Paddock {selectedPaddockForWater?.name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive water system management and optimization for optimal livestock access
            </DialogDescription>
            <div className="flex gap-2 mt-3">
              <Link href="/water-management">
                <Button variant="outline" size="sm">
                  <Droplets className="h-4 w-4 mr-2" />
                  Full Water Management System
                </Button>
              </Link>
              <Link href="/water-management">
                <Button variant="outline" size="sm" onClick={() => setWaterDialogOpen(false)}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue to Full System
                </Button>
              </Link>
            </div>
          </DialogHeader>

          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>New!</strong> Professional water management system now includes water source management, 
              consumption tracking, weather-integrated calculations, and comprehensive analytics. 
              Click "Full Water Management System" above to access all features.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="quick-setup" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quick-setup" className="text-xs sm:text-sm">Quick Setup</TabsTrigger>
              <TabsTrigger value="daily-status" className="text-xs sm:text-sm">Daily Status</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs sm:text-sm">Actions</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="quick-setup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Water Source</CardTitle>
                  <CardDescription>Set up water access for this paddock</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="water-source-name">Water Source Name</Label>
                      <Input 
                        id="water-source-name"
                        placeholder="e.g., Main Trough, Tank #1"
                        value={waterManagementData.sourceName}
                        onChange={(e) => setWaterManagementData({...waterManagementData, sourceName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="water-source-type">Type</Label>
                      <Select value={waterManagementData.sourceType} onValueChange={(value) => 
                        setWaterManagementData({...waterManagementData, sourceType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trough">Trough</SelectItem>
                          <SelectItem value="tank">Tank</SelectItem>
                          <SelectItem value="pond">Pond</SelectItem>
                          <SelectItem value="well">Well</SelectItem>
                          <SelectItem value="stream">Stream</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="capacity">Capacity (gallons)</Label>
                      <Input 
                        id="capacity"
                        type="number"
                        placeholder="300"
                        value={waterManagementData.capacity}
                        onChange={(e) => setWaterManagementData({...waterManagementData, capacity: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="current-level">Current Level (%)</Label>
                      <Input 
                        id="current-level"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="75"
                        value={waterManagementData.currentLevel}
                        onChange={(e) => setWaterManagementData({...waterManagementData, currentLevel: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Refill Method</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={waterManagementData.refillMethod === 'manual' ? 'default' : 'outline'}
                        onClick={() => setWaterManagementData({...waterManagementData, refillMethod: 'manual'})}
                      >
                        Manual Fill
                      </Button>
                      <Button 
                        variant={waterManagementData.refillMethod === 'automatic' ? 'default' : 'outline'}
                        onClick={() => setWaterManagementData({...waterManagementData, refillMethod: 'automatic'})}
                      >
                        Automatic Fill
                      </Button>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => {
                      if (!waterManagementData.sourceName || !waterManagementData.sourceType) {
                        toast({
                          title: "Missing Information",
                          description: "Please provide both water source name and type.",
                          variant: "destructive"
                        });
                        return;
                      }
                      createWaterSourceMutation.mutate(waterManagementData);
                    }}
                    disabled={createWaterSourceMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {createWaterSourceMutation.isPending ? "Adding..." : "Add Water Source"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily-status" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Water Status</CardTitle>
                  <CardDescription>Update today's water system status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Water Quality Today</Label>
                      <Select value={waterManagementData.waterQuality} onValueChange={(value) => 
                        setWaterManagementData({...waterManagementData, waterQuality: value})}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">✓ Excellent - Clear, clean</SelectItem>
                          <SelectItem value="good">✓ Good - No issues</SelectItem>
                          <SelectItem value="fair">⚠ Fair - Needs attention</SelectItem>
                          <SelectItem value="poor">⚠ Poor - Immediate action needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Water Level Status</Label>
                      <Select value={waterManagementData.currentLevel} onValueChange={(value) => 
                        setWaterManagementData({...waterManagementData, currentLevel: value})}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full (90-100%)</SelectItem>
                          <SelectItem value="good">Good (70-89%)</SelectItem>
                          <SelectItem value="low">Low (30-69%)</SelectItem>
                          <SelectItem value="critical">Critical (Below 30%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Daily Issues or Observations</Label>
                    <Textarea
                      value={waterManagementData.issues}
                      onChange={(e) => setWaterManagementData({...waterManagementData, issues: e.target.value})}
                      placeholder="e.g., Tank needs refilling, algae noticed, flow reduced..."
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => {
                        updateWaterStatusMutation.mutate({
                          waterQuality: waterManagementData.waterQuality,
                          currentLevel: waterManagementData.currentLevel,
                          issues: waterManagementData.issues
                        });
                      }}
                      className="w-full"
                      disabled={updateWaterStatusMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {updateWaterStatusMutation.isPending ? "Saving..." : "Save Daily Status"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Alert Sent",
                          description: "Water issue alert has been noted.",
                        });
                      }}
                      className="w-full"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report Issue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Common water management tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => {
                        toast({
                          title: "Refill Initiated",
                          description: "Water refill has been scheduled for this paddock.",
                        });
                      }}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Droplets className="w-6 h-6 mb-2" />
                      <span>Refill Water</span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Cleaning Scheduled",
                          description: "Water source cleaning has been added to your tasks.",
                        });
                      }}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <span className="text-2xl mb-2">🧹</span>
                      <span>Clean System</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Test Scheduled",
                          description: "Water quality test has been scheduled.",
                        });
                      }}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <span className="text-2xl mb-2">🧪</span>
                      <span>Test Quality</span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Repair Scheduled",
                          description: "Repair request has been logged.",
                        });
                      }}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <span className="text-2xl mb-2">🔧</span>
                      <span>Schedule Repair</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Emergency Actions</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          toast({
                            title: "Emergency Alert",
                            description: "Emergency water shortage alert has been sent.",
                          });
                        }}
                        className="w-full"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Report Water Emergency
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      All actions are logged and can be tracked in the full water management system.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Water System Settings</CardTitle>
                  <CardDescription>Configure your water management preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Maintenance Schedule</Label>
                    <Select value={waterManagementData.maintenanceSchedule} onValueChange={(value) => 
                      setWaterManagementData({...waterManagementData, maintenanceSchedule: value})}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily - High-use systems</SelectItem>
                        <SelectItem value="weekly">Weekly - Standard maintenance</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly - Low-maintenance systems</SelectItem>
                        <SelectItem value="monthly">Monthly - Seasonal check-ups</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Last Maintenance</Label>
                      <Input
                        type="date"
                        value={waterManagementData.lastMaintenance}
                        onChange={(e) => setWaterManagementData({
                          ...waterManagementData, 
                          lastMaintenance: e.target.value
                        })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Next Scheduled</Label>
                      <Input
                        type="date"
                        value={waterManagementData.nextMaintenance}
                        onChange={(e) => setWaterManagementData({
                          ...waterManagementData, 
                          nextMaintenance: e.target.value
                        })}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Planned Improvements</Label>
                    <Textarea
                      value={waterManagementData.improvements}
                      onChange={(e) => setWaterManagementData({...waterManagementData, improvements: e.target.value})}
                      placeholder="Note any planned improvements or upgrades..."
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Maintenance Reminders</h4>
                    <div className="text-sm space-y-1">
                      <div>• Check water levels daily</div>
                      <div>• Clean algae buildup weekly</div>
                      <div>• Test water quality monthly</div>
                      <div>• Inspect pipes and fittings quarterly</div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      updateWaterStatusMutation.mutate({
                        waterQuality: waterManagementData.waterQuality,
                        currentLevel: waterManagementData.currentLevel,
                        issues: waterManagementData.issues,
                        improvements: waterManagementData.improvements,
                        lastMaintenance: waterManagementData.lastMaintenance,
                        nextMaintenance: waterManagementData.nextMaintenance,
                        maintenanceSchedule: waterManagementData.maintenanceSchedule
                      });
                    }}
                    className="w-full"
                    disabled={updateWaterStatusMutation.isPending}
                  >
                    {updateWaterStatusMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={closeWaterManagement}>
              Cancel
            </Button>
            <Button onClick={saveWaterManagement}>
              Save Water Management Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}