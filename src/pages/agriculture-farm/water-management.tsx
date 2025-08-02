import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Droplets, Plus, Edit, Trash2, Calculator, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WaterConsumptionCalculator } from '@/lib/water-consumption-calculator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { WaterSource, WaterConsumption, InsertWaterSource, InsertWaterConsumption, Paddock, Animal } from '@shared/schema';

const waterSourceSchema = z.object({
  name: z.string().min(1, "Water source name is required"),
  type: z.string().min(1, "Water source type is required"),
  paddockId: z.coerce.number().min(1, "Paddock is required"),
  capacity: z.coerce.number().min(0, "Capacity must be positive"),
  currentLevel: z.coerce.number().min(0).max(100, "Current level must be between 0-100"),
  refillMethod: z.string().min(1, "Refill method is required"),
  flowRate: z.coerce.number().optional(),
  waterPressure: z.coerce.number().optional(),
  quality: z.string().optional(),
  temperature: z.coerce.number().optional(),
  maintenanceSchedule: z.string().optional(),
  notes: z.string().optional(),
});

const waterConsumptionSchema = z.object({
  paddockId: z.coerce.number().min(1, "Paddock is required"),
  waterSourceId: z.coerce.number().optional(),
  totalConsumption: z.coerce.number().min(0, "Total consumption must be positive"),
  animalCount: z.coerce.number().min(1, "Animal count is required"),
  averageWeight: z.coerce.number().min(0).optional(),
  temperature: z.coerce.number().optional(),
  humidity: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export default function WaterManagement() {
  const [selectedPaddock, setSelectedPaddock] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isConsumptionDialogOpen, setIsConsumptionDialogOpen] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: paddocks = [], isLoading: paddocksLoading } = useQuery({
    queryKey: ['/api/paddocks'],
  });

  const { data: animals = [], isLoading: animalsLoading } = useQuery({
    queryKey: ['/api/animals'],
  });

  const { data: waterSources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ['/api/water-sources'],
  });

  const { data: consumptionData = [], isLoading: consumptionLoading } = useQuery({
    queryKey: ['/api/water-consumption'],
  });

  // Forms
  const sourceForm = useForm<z.infer<typeof waterSourceSchema>>({
    resolver: zodResolver(waterSourceSchema),
    defaultValues: {
      name: '',
      type: '',
      paddockId: 0,
      capacity: 100,
      currentLevel: 100,
      refillMethod: 'manual',
      quality: 'good',
      temperature: 68,
      maintenanceSchedule: 'weekly',
      notes: '',
    },
  });

  const consumptionForm = useForm<z.infer<typeof waterConsumptionSchema>>({
    resolver: zodResolver(waterConsumptionSchema),
    defaultValues: {
      paddockId: 0,
      totalConsumption: 0,
      animalCount: 1,
      averageWeight: 1000,
      temperature: 75,
      humidity: 60,
      notes: '',
    },
  });

  // Mutations
  const createWaterSource = useMutation({
    mutationFn: (data: InsertWaterSource) => apiRequest('POST', '/api/water-sources', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-sources'] });
      setIsCreateDialogOpen(false);
      sourceForm.reset();
      toast({ title: "Water source created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating water source", description: error.message, variant: "destructive" });
    },
  });

  const recordConsumption = useMutation({
    mutationFn: (data: InsertWaterConsumption) => apiRequest('POST', '/api/water-consumption', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-consumption'] });
      setIsConsumptionDialogOpen(false);
      consumptionForm.reset();
      toast({ title: "Water consumption recorded successfully" });
    },
    onError: (error) => {
      toast({ title: "Error recording consumption", description: error.message, variant: "destructive" });
    },
  });

  const deleteWaterSource = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/water-sources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-sources'] });
      toast({ title: "Water source deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting water source", description: error.message, variant: "destructive" });
    },
  });

  // Calculate water consumption
  const calculateConsumption = async () => {
    if (!animals.length || !paddocks.length) {
      toast({ title: "Missing data", description: "Need animals and paddocks to calculate consumption", variant: "destructive" });
      return;
    }

    const animalData = animals.map((animal: Animal) => ({
      species: animal.species,
      weight: animal.weight || 1000,
      lactating: animal.reproductiveStatus === 'lactating',
      age: animal.age || 24,
      ageUnit: animal.ageUnit || 'months',
      count: 1,
    }));

    const weatherData = {
      temperature: 75,
      humidity: 60,
    };

    try {
      const calculation = WaterConsumptionCalculator.calculateDailyConsumption(
        animalData,
        weatherData,
        { feedType: 'dry', waterQuality: 'good', stressLevel: 'low' }
      );
      setCalculationResult(calculation);
    } catch (error) {
      toast({ title: "Calculation error", description: "Failed to calculate water consumption", variant: "destructive" });
    }
  };

  // Form submission handlers
  const onSourceSubmit = (data: z.infer<typeof waterSourceSchema>) => {
    const processedData = {
      ...data,
      userId: 1, // Will be set by API
      // Only include flow rate and pressure for piped systems
      flowRate: data.refillMethod === 'automatic' || data.refillMethod === 'pump' ? data.flowRate : null,
      waterPressure: data.refillMethod === 'automatic' || data.refillMethod === 'pump' ? data.waterPressure : null,
    };
    createWaterSource.mutate(processedData);
  };

  const onConsumptionSubmit = (data: z.infer<typeof waterConsumptionSchema>) => {
    const processedData = {
      ...data,
      userId: 1, // Will be set by API
      date: new Date(),
      calculatedConsumption: calculationResult?.totalDailyNeed || 0,
      variance: calculationResult ? data.totalConsumption - calculationResult.totalDailyNeed : 0,
    };
    recordConsumption.mutate(processedData);
  };

  // Get water sources for selected paddock
  const paddockWaterSources = selectedPaddock 
    ? waterSources.filter((source: WaterSource) => source.paddockId === selectedPaddock)
    : waterSources;

  // Get water quality indicator
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (paddocksLoading || animalsLoading || sourcesLoading || consumptionLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Water Management</h1>
        <p className="text-gray-600">Comprehensive water source management and consumption tracking</p>
      </div>

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sources">Water Sources</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="paddock-filter">Filter by Paddock:</Label>
              <Select value={selectedPaddock?.toString() || 'all'} onValueChange={(value) => setSelectedPaddock(value === 'all' ? null : parseInt(value))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Paddocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Paddocks</SelectItem>
                  {paddocks.map((paddock: Paddock) => (
                    <SelectItem key={paddock.id} value={paddock.id.toString()}>
                      {paddock.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Water Source
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Water Source</DialogTitle>
                </DialogHeader>
                <Form {...sourceForm}>
                  <form onSubmit={sourceForm.handleSubmit(onSourceSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sourceForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Water Source Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Main Trough" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sourceForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="trough">Trough</SelectItem>
                                <SelectItem value="tank">Tank</SelectItem>
                                <SelectItem value="well">Well</SelectItem>
                                <SelectItem value="pond">Pond</SelectItem>
                                <SelectItem value="stream">Stream</SelectItem>
                                <SelectItem value="piped">Piped System</SelectItem>
                                <SelectItem value="spring">Spring</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sourceForm.control}
                        name="paddockId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paddock</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select paddock" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paddocks.map((paddock: Paddock) => (
                                  <SelectItem key={paddock.id} value={paddock.id.toString()}>
                                    {paddock.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sourceForm.control}
                        name="refillMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Refill Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="manual">Manual</SelectItem>
                                <SelectItem value="automatic">Automatic</SelectItem>
                                <SelectItem value="gravity">Gravity</SelectItem>
                                <SelectItem value="pump">Pump</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sourceForm.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity (gallons)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>Total water capacity</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sourceForm.control}
                        name="currentLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Level (%)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>Current water level percentage</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Only show flow rate and pressure for piped systems */}
                    {(sourceForm.watch('refillMethod') === 'automatic' || sourceForm.watch('refillMethod') === 'pump') && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={sourceForm.control}
                          name="flowRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Flow Rate (GPM)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormDescription>Gallons per minute</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={sourceForm.control}
                          name="waterPressure"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Water Pressure (PSI)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormDescription>Pressure in PSI</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={sourceForm.control}
                        name="quality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Water Quality</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select quality" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair</SelectItem>
                                <SelectItem value="poor">Poor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={sourceForm.control}
                        name="temperature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Temperature (°F)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={sourceForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Additional notes..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createWaterSource.isPending}>
                      {createWaterSource.isPending ? 'Creating...' : 'Create Water Source'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paddockWaterSources.map((source: WaterSource) => (
              <Card key={source.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{source.type}</Badge>
                        <Badge className={getQualityColor(source.quality || 'good')}>
                          {source.quality || 'good'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteWaterSource.mutate(source.id)}
                        disabled={deleteWaterSource.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capacity:</span>
                      <span className="text-sm font-medium">{source.capacity} gallons</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Level:</span>
                      <span className="text-sm font-medium">{source.currentLevel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Refill Method:</span>
                      <span className="text-sm font-medium">{source.refillMethod}</span>
                    </div>
                    {source.flowRate && source.refillMethod !== 'manual' && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Flow Rate:</span>
                        <span className="text-sm font-medium">{source.flowRate} GPM</span>
                      </div>
                    )}
                    {source.waterPressure && source.refillMethod !== 'manual' && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pressure:</span>
                        <span className="text-sm font-medium">{source.waterPressure} PSI</span>
                      </div>
                    )}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${source.currentLevel}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consumption" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Water Consumption Records</h2>
            <Dialog open={isConsumptionDialogOpen} onOpenChange={setIsConsumptionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Consumption
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Water Consumption</DialogTitle>
                </DialogHeader>
                <Form {...consumptionForm}>
                  <form onSubmit={consumptionForm.handleSubmit(onConsumptionSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={consumptionForm.control}
                        name="paddockId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Paddock</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select paddock" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paddocks.map((paddock: Paddock) => (
                                  <SelectItem key={paddock.id} value={paddock.id.toString()}>
                                    {paddock.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={consumptionForm.control}
                        name="totalConsumption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Consumption (gallons)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={consumptionForm.control}
                        name="animalCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Animal Count</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={consumptionForm.control}
                        name="averageWeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Average Weight (lbs)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={consumptionForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Additional notes..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={recordConsumption.isPending}>
                      {recordConsumption.isPending ? 'Recording...' : 'Record Consumption'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {consumptionData.map((record: WaterConsumption) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{record.totalConsumption} gallons</span>
                        <Badge variant="secondary">{record.animalCount} animals</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {record.calculatedConsumption && (
                        <div className="text-sm">
                          <span className="text-gray-600">Expected: </span>
                          <span className="font-medium">{record.calculatedConsumption} gallons</span>
                        </div>
                      )}
                      {record.variance && (
                        <div className="text-sm">
                          <span className="text-gray-600">Variance: </span>
                          <span className={`font-medium ${record.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {record.variance > 0 ? '+' : ''}{record.variance} gallons
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calculator" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Water Consumption Calculator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={calculateConsumption} className="w-full">
                  Calculate Daily Water Needs
                </Button>
                
                {calculationResult && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Calculation Results</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Base Consumption:</span>
                        <div className="text-lg font-medium">{calculationResult.baseConsumption.toFixed(1)} gallons/day</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Weather Adjustment:</span>
                        <div className="text-lg font-medium">{calculationResult.temperatureAdjustment.toFixed(1)} gallons/day</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Lactation Adjustment:</span>
                        <div className="text-lg font-medium">{calculationResult.lactationAdjustment.toFixed(1)} gallons/day</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Daily Need:</span>
                        <div className="text-xl font-bold text-blue-600">{calculationResult.totalDailyNeed.toFixed(1)} gallons/day</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Breakdown by Species:</h4>
                      <div className="space-y-2">
                        {calculationResult.animalBreakdown.map((breakdown: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                            <span>{breakdown.species} ({breakdown.count} animals)</span>
                            <span className="font-medium">{breakdown.totalNeed.toFixed(1)} gallons/day</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Consumption Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Analytics coming soon...</p>
                  <p className="text-sm mt-2">Track consumption patterns, efficiency metrics, and water source performance</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Water Source Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {waterSources.map((source: WaterSource) => (
                    <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-gray-600">
                          {source.currentLevel}% full • {source.quality} quality
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {source.currentLevel && source.currentLevel > 50 ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}