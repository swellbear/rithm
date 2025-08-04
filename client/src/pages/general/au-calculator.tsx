import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Calculator, Users, Info, TrendingUp, BookOpen, CheckCircle } from "lucide-react";
import { SmartWorkflowHandoffs } from "@/components/smart-workflow-handoffs";
import { UpgradeValueProposition } from "@/components/upgrade-value-proposition";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDemoData, demoAnimals, demoAUData } from "@/lib/demo-data";

interface AnimalGroup {
  id: number;
  name: string;
  species: string;
  breed: string;
  count: number;
  averageWeight: number;
  ageCategory: string;
  sex: string;
  lactating?: boolean;
  lactatingCount?: number;
}

interface AUCalculation {
  groupId: number;
  groupName: string;
  species: string;
  count: number;
  averageWeight: number;
  auPerAnimal: number;
  totalAU: number;
  method: string;
  notes: string;
}

interface AUStandards {
  [key: string]: {
    baseWeight: number;
    baseAU: number;
    adjustments: {
      [key: string]: number;
    };
  };
}

export default function AUCalculator() {
  const [calculationMethod, setCalculationMethod] = useState<"weight" | "standard" | "mixed">("standard");
  const [customGroups, setCustomGroups] = useState<AnimalGroup[]>([]);
  const [calculations, setCalculations] = useState<AUCalculation[]>([]);
  const [showEducational, setShowEducational] = useState(false);
  const [useHerdData, setUseHerdData] = useState<boolean>(true);

  // Fetch existing herds
  const { data: fetchedHerds = [], isLoading } = useQuery<any[]>({ 
    queryKey: ["/api/herds"] 
  });

  // Use demo data when in demo mode and no real data exists
  const herds = useDemoData(fetchedHerds, demoAnimals);

  // Auto-populate animal groups from herd data
  useEffect(() => {
    if (herds.length > 0 && useHerdData && customGroups.length === 0) {
      const autoGroups: AnimalGroup[] = [];
      let groupId = 1;

      herds.forEach(herd => {
        if (herd.composition && Array.isArray(herd.composition)) {
          // Mixed herd format
          herd.composition.forEach(comp => {
            autoGroups.push({
              id: groupId++,
              name: `${herd.name} - ${comp.species}`,
              species: comp.species.toLowerCase(),
              breed: comp.breed || "Mixed",
              count: comp.count || 0,
              averageWeight: getSpeciesDefaultWeight(comp.species),
              ageCategory: "adult",
              sex: "mixed",
              lactating: false,
              lactatingCount: 0
            });
          });
        } else if (herd.species) {
          // Single species format
          autoGroups.push({
            id: groupId++,
            name: herd.name,
            species: herd.species.toLowerCase(),
            breed: herd.breed || "Mixed",
            count: herd.count || 0,
            averageWeight: herd.averageWeight || getSpeciesDefaultWeight(herd.species),
            ageCategory: herd.age || "adult",
            sex: herd.sex || "mixed",
            lactating: herd.lactating || false,
            lactatingCount: herd.lactatingCount || 0
          });
        }
      });

      setCustomGroups(autoGroups);
    }
  }, [herds, useHerdData]);

  // Helper function for default weights
  const getSpeciesDefaultWeight = (species: string): number => {
    const weights: Record<string, number> = {
      'cattle': 1200,
      'sheep': 140,
      'goats': 120,
      'horses': 1100,
      'pigs': 250
    };
    return weights[species.toLowerCase()] || 500;
  };

  // Import useEffect
  useEffect(() => {
    if (herds.length > 0 && useHerdData && customGroups.length === 0) {
      // Auto-populate happens in the useEffect above
    }
  }, [herds, useHerdData]);

  // AU Standards based on common regional practices
  const auStandards: AUStandards = {
    cattle: {
      baseWeight: 1000,
      baseAU: 1.0,
      adjustments: {
        "calf": 0.4,
        "yearling": 0.7,
        "adult": 1.0,
        "lactating": 1.3,
        "bull": 1.2
      }
    },
    sheep: {
      baseWeight: 140,
      baseAU: 0.2,
      adjustments: {
        "lamb": 0.1,
        "adult": 0.2,
        "lactating": 0.25,
        "ram": 0.25
      }
    },
    goats: {
      baseWeight: 120,
      baseAU: 0.15,
      adjustments: {
        "kid": 0.08,
        "adult": 0.15,
        "lactating": 0.18,
        "buck": 0.18
      }
    },
    horses: {
      baseWeight: 1100,
      baseAU: 1.25,
      adjustments: {
        "foal": 0.5,
        "adult": 1.25,
        "draft": 1.5
      }
    },
    pigs: {
      baseWeight: 250,
      baseAU: 0.4,
      adjustments: {
        "piglet": 0.1,
        "adult": 0.4,
        "sow": 0.5,
        "boar": 0.5
      }
    }
  };

  useEffect(() => {
    if (herds.length > 0) {
      calculateFromHerds();
    }
  }, [herds, calculationMethod]);

  const calculateFromHerds = () => {
    const newCalculations: AUCalculation[] = herds.map((herd: any) => {
      const species = herd.species?.toLowerCase() || "cattle";
      const weight = parseFloat(herd.averageWeight) || auStandards[species]?.baseWeight || 1000;
      
      let auPerAnimal: number;
      let method: string;
      let notes: string;

      if (calculationMethod === "weight") {
        // Weight-based calculation: AU = animal weight / 1000 lbs
        auPerAnimal = weight / 1000;
        method = "Weight-based";
        notes = `Based on ${weight} lbs average weight`;
      } else {
        // Standard-based calculation
        const standard = auStandards[species];
        if (standard) {
          let baseAU = standard.baseAU;
          
          // Apply adjustments based on age and status
          const age = herd.age || "adult";
          const ageCategory = getAgeCategory(age, species);
          
          if (standard.adjustments[ageCategory]) {
            baseAU = standard.adjustments[ageCategory];
          }
          
          // Lactation adjustment
          if (herd.lactating && herd.lactatingCount > 0 && standard.adjustments.lactating) {
            const lactatingRatio = herd.lactatingCount / herd.count;
            const nonLactatingAU = baseAU * (1 - lactatingRatio);
            const lactatingAU = standard.adjustments.lactating * lactatingRatio;
            auPerAnimal = nonLactatingAU + lactatingAU;
          } else {
            auPerAnimal = baseAU;
          }
          
          method = "Standards-based";
          notes = `${species} ${ageCategory}${herd.lactating && herd.lactatingCount > 0 ? `, ${herd.lactatingCount} lactating` : ""}`;
        } else {
          // Fallback to weight
          auPerAnimal = weight / 1000;
          method = "Weight-based (fallback)";
          notes = `No standard for ${species}, using weight`;
        }
      }

      return {
        groupId: herd.id,
        groupName: herd.name,
        species: species,
        count: herd.count || 0,
        averageWeight: weight,
        auPerAnimal: Math.round(auPerAnimal * 100) / 100,
        totalAU: Math.round(auPerAnimal * (herd.count || 0) * 100) / 100,
        method,
        notes
      };
    });

    setCalculations(newCalculations);
  };

  const getAgeCategory = (age: string | number, species: string): string => {
    if (typeof age === "string") {
      const ageLower = age.toLowerCase();
      if (ageLower.includes("calf") || ageLower.includes("young")) return "calf";
      if (ageLower.includes("yearling")) return "yearling";
      if (ageLower.includes("bull") || ageLower.includes("male")) return "bull";
      if (ageLower.includes("lamb")) return "lamb";
      if (ageLower.includes("kid")) return "kid";
      if (ageLower.includes("foal")) return "foal";
      if (ageLower.includes("piglet")) return "piglet";
      return "adult";
    }
    
    // Numeric age
    const ageNum = typeof age === "number" ? age : parseFloat(age);
    if (species === "cattle") {
      if (ageNum < 1) return "calf";
      if (ageNum < 2) return "yearling";
      return "adult";
    }
    if (species === "sheep" || species === "goats") {
      if (ageNum < 1) return species === "sheep" ? "lamb" : "kid";
      return "adult";
    }
    return "adult";
  };

  const addCustomGroup = () => {
    const newGroup: AnimalGroup = {
      id: Date.now(),
      name: "Custom Group",
      species: "cattle",
      breed: "",
      count: 10,
      averageWeight: 1000,
      ageCategory: "adult",
      sex: "mixed"
    };
    setCustomGroups([...customGroups, newGroup]);
  };

  const updateCustomGroup = (id: number, updates: Partial<AnimalGroup>) => {
    setCustomGroups(groups => 
      groups.map(g => g.id === id ? { ...g, ...updates } : g)
    );
  };

  const removeCustomGroup = (id: number) => {
    setCustomGroups(groups => groups.filter(g => g.id !== id));
  };

  const calculateCustom = () => {
    const customCalculations: AUCalculation[] = customGroups.map(group => {
      const species = group.species.toLowerCase();
      let auPerAnimal: number;
      let method: string;
      let notes: string;

      if (calculationMethod === "weight") {
        auPerAnimal = group.averageWeight / 1000;
        method = "Weight-based";
        notes = `${group.averageWeight} lbs average weight`;
      } else {
        const standard = auStandards[species];
        if (standard && standard.adjustments[group.ageCategory]) {
          auPerAnimal = standard.adjustments[group.ageCategory];
          
          if (group.lactating && group.lactatingCount) {
            const lactatingRatio = group.lactatingCount / group.count;
            const nonLactatingAU = auPerAnimal * (1 - lactatingRatio);
            const lactatingAU = standard.adjustments.lactating * lactatingRatio;
            auPerAnimal = nonLactatingAU + lactatingAU;
          }
          
          method = "Standards-based";
          notes = `${species} ${group.ageCategory}`;
        } else {
          auPerAnimal = group.averageWeight / 1000;
          method = "Weight-based (fallback)";
          notes = `No standard available`;
        }
      }

      return {
        groupId: group.id,
        groupName: group.name,
        species: group.species,
        count: group.count,
        averageWeight: group.averageWeight,
        auPerAnimal: Math.round(auPerAnimal * 100) / 100,
        totalAU: Math.round(auPerAnimal * group.count * 100) / 100,
        method,
        notes
      };
    });

    setCalculations([...calculations, ...customCalculations]);
  };

  const totalAU = calculations.reduce((sum, calc) => sum + calc.totalAU, 0);
  const totalAnimals = calculations.reduce((sum, calc) => sum + calc.count, 0);
  const averageAUPerAnimal = totalAnimals > 0 ? totalAU / totalAnimals : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Loading calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Animal Unit Calculator
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Calculate standardized Animal Units (AU) for grazing management and stocking rate planning
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowEducational(!showEducational)}
              size="sm"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Learn About AU</span>
              <span className="sm:hidden">Learn</span>
            </Button>
          </div>
        </div>

        {showEducational && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Animal Units (AU)</strong> standardize different livestock types for grazing management. 
              One AU equals a 1,000-pound cow with or without calf up to 6 months of age. This helps compare 
              grazing impact across different species and plan stocking rates effectively.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="calculate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculate">Calculate AU</TabsTrigger>
          <TabsTrigger value="standards">AU Standards</TabsTrigger>
          <TabsTrigger value="planning">Stocking Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="calculate" className="space-y-6">
          {/* Data Integration Status */}
          {herds.length > 0 && useHerdData && (
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>✓ Data Integration Active:</strong> {calculations.length} animal groups auto-populated from your herds. 
                    Calculations update automatically when you modify livestock data.
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {herds.reduce((total, herd) => {
                      if (herd.composition) {
                        return total + herd.composition.reduce((sum, comp) => sum + comp.count, 0);
                      }
                      return total + (herd.count || 0);
                    }, 0)} livestock
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Calculation Method */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Calculation Method</CardTitle>
                  <CardDescription>Choose how to calculate Animal Units</CardDescription>
                </div>
                {herds.length > 0 && (
                  <Button
                    variant={useHerdData ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseHerdData(!useHerdData)}
                  >
                    {useHerdData ? "Using Herds" : "Manual Entry"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Select value={calculationMethod} onValueChange={(value: any) => setCalculationMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standards-based (Recommended)</SelectItem>
                  <SelectItem value="weight">Weight-based</SelectItem>
                  <SelectItem value="mixed">Mixed approach</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-2">
                {calculationMethod === "standard" && "Uses established AU standards for each species and age category"}
                {calculationMethod === "weight" && "Calculates AU as animal weight ÷ 1,000 lbs"}
                {calculationMethod === "mixed" && "Uses standards when available, weight-based as fallback"}
              </p>
              {herds.length > 0 && useHerdData && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300">
                  Your livestock data has been automatically loaded from herds. Adjust weights and categories as needed.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total AU</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAU.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Across all animal groups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Livestock</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAnimals}</div>
                <p className="text-xs text-muted-foreground">
                  Individual animals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg AU/Animal</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageAUPerAnimal.toFixed(3)}</div>
                <p className="text-xs text-muted-foreground">
                  Average across all groups
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>AU Breakdown by Group</CardTitle>
              <CardDescription>Detailed calculations for each animal group</CardDescription>
            </CardHeader>
            <CardContent>
              {calculations.length > 0 ? (
                <div className="space-y-4">
                  {calculations.map((calc, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{calc.groupName}</h4>
                        <Badge variant="outline">{calc.species}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Count:</span>
                          <div className="font-medium">{calc.count} animals</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg Weight:</span>
                          <div className="font-medium">{calc.averageWeight} lbs</div>
                        </div>
                        <div>
                          <span className="text-gray-500">AU per Animal:</span>
                          <div className="font-medium">{calc.auPerAnimal}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total AU:</span>
                          <div className="font-bold text-green-600">{calc.totalAU}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Method:</span>
                          <div className="font-medium">{calc.method}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{calc.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No animal groups found. Add livestock to see AU calculations.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Custom Group */}
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Group</CardTitle>
              <CardDescription>Calculate AU for additional animals not in your herds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {herds.length > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Auto-populated from your herds</span>
                  <Button
                    variant={useHerdData ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseHerdData(!useHerdData)}
                  >
                    {useHerdData ? "Using Herds" : "Manual Entry"}
                  </Button>
                </div>
              )}
              <Button onClick={addCustomGroup} className="w-full">
                Add Custom Animal Group
              </Button>
              
              {customGroups.map((group) => (
                <div key={group.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Custom Group #{group.id}</h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeCustomGroup(group.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={group.name}
                        onChange={(e) => updateCustomGroup(group.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Species</Label>
                      <Select
                        value={group.species}
                        onValueChange={(value) => updateCustomGroup(group.id, { species: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cattle">Cattle</SelectItem>
                          <SelectItem value="sheep">Sheep</SelectItem>
                          <SelectItem value="goats">Goats</SelectItem>
                          <SelectItem value="horses">Horses</SelectItem>
                          <SelectItem value="pigs">Pigs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Count</Label>
                      <Input
                        type="number"
                        value={group.count}
                        onChange={(e) => updateCustomGroup(group.id, { count: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Avg Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={group.averageWeight}
                        onChange={(e) => updateCustomGroup(group.id, { averageWeight: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {customGroups.length > 0 && (
                <Button onClick={calculateCustom} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Custom Groups
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AU Standards Reference</CardTitle>
              <CardDescription>Standard Animal Unit values for different livestock species and categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(auStandards).map(([species, standard]) => (
                  <div key={species} className="border rounded-lg p-4">
                    <h3 className="font-semibold capitalize mb-3">{species}</h3>
                    <div className="text-sm text-gray-600 mb-3">
                      Base: {standard.baseWeight} lbs = {standard.baseAU} AU
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(standard.adjustments).map(([category, value]) => (
                        <div key={category} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="font-medium capitalize">{category}</div>
                          <div className="text-lg font-bold text-green-600">{value} AU</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stocking Rate Planning</CardTitle>
              <CardDescription>Use AU calculations for pasture management planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your total of <strong>{totalAU.toFixed(2)} AU</strong> can help determine appropriate 
                    stocking rates when combined with pasture carrying capacity data. Rule of thumb: 
                    1 AU typically requires 1.5-3 acres depending on pasture quality and rainfall.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Minimum Acreage Needed</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {(totalAU * 1.5).toFixed(1)} - {(totalAU * 3).toFixed(1)} acres
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Based on typical pasture productivity
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Rotational Planning</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.ceil(totalAU / 25)} paddocks
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Suggested for efficient rotation (25 AU per paddock)
                    </p>
                  </div>
                </div>

                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Integration with Other Tools</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Use AU for Daily Water Requirements calculation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Integrate with Dry Matter Availability for feed planning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Apply to Grazing Calendar for rotation timing</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Value Proposition - Tier-Appropriate */}
      {user?.subscriptionTier === 'basic' && calculations.length > 0 && (
        <UpgradeValueProposition 
          currentTier="basic"
          lockedFeature="advanced AU analysis with stocking rate optimization"
          context="calculation"
        />
      )}

      {/* Smart Workflow Handoffs */}
      <SmartWorkflowHandoffs 
        currentTool="au-calculator"
        completedActions={useHerdData && calculations.length > 0 ? ['calculated_au'] : []}
        farmData={{
          hasLivestock: herds.length > 0,
          hasPaddocks: true, // Assume paddocks exist for stocking calculations
          hasAssessments: true,
          livestockCount: herds.reduce((total, herd) => {
            if (herd.composition) {
              return total + herd.composition.reduce((sum, comp) => sum + comp.count, 0);
            }
            return total + (herd.count || 0);
          }, 0),
          paddockCount: 3, // Approximate
          primarySpecies: herds.length > 0 ? herds[0].species || herds[0].composition?.[0]?.species : undefined
        }}
      />
    </div>
  );
}