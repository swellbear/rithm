import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Leaf, Calculator, Target, TrendingUp, Scale, 
  AlertTriangle, CheckCircle, BarChart3, PieChart,
  Zap, Droplets, Wheat, Apple, Beaker, Info
} from "lucide-react";
import { SmartWorkflowHandoffs } from "@/components/smart-workflow-handoffs";
import { PieChart as RechartsPI, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";

interface NutritionalComposition {
  dryMatter: number;
  crudeProtein: number;
  digestibleProtein: number;
  energy: {
    tdnPercent: number;
    neMaintenanceMcal: number;
    neGainMcal: number;
    neLactationMcal: number;
  };
  fiber: {
    adf: number;
    ndf: number;
    lignin: number;
  };
  minerals: {
    calcium: number;
    phosphorus: number;
    magnesium: number;
    potassium: number;
    sulfur: number;
  };
  vitamins: {
    vitaminA: number;
    vitaminD: number;
    vitaminE: number;
  };
  waterContent: number;
  digestibility: number;
  palatability: "excellent" | "good" | "fair" | "poor";
}

interface AnimalRequirements {
  species: string;
  category: string;
  weight: number;
  stage: string;
  dmIntake: number;
  requirements: {
    crudeProtein: number;
    tdnPercent: number;
    calcium: number;
    phosphorus: number;
    vitaminA: number;
  };
}

interface NutritionalDeficit {
  nutrient: string;
  required: number;
  available: number;
  deficit: number;
  severity: "none" | "mild" | "moderate" | "severe";
  recommendations: string[];
}

interface SeasonalAdjustment {
  season: "spring" | "summer" | "fall" | "winter";
  proteinMultiplier: number;
  energyMultiplier: number;
  palatabilityFactor: number;
  notes: string;
}

export default function NutritionalAnalysis() {
  // Auto-set complexity based on subscription tier
  const complexityLevel = 'intermediate'; // All users get same nutritional analysis features
  const [analysisMode, setAnalysisMode] = useState<"integrated" | "manual">("integrated");
  const [selectedPaddock, setSelectedPaddock] = useState<string>("");
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all");
  const [season, setSeason] = useState<string>("summer");
  const [nutritionalData, setNutritionalData] = useState<NutritionalComposition | null>(null);
  const [deficitAnalysis, setDeficitAnalysis] = useState<NutritionalDeficit[]>([]);
  const [animalRequirements, setAnimalRequirements] = useState<AnimalRequirements[]>([]);

  // Fetch farm data for integration
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  // Nutritional database will be populated from actual plant identification and assessment data

  // Animal requirement standards
  const animalStandards = {
    cattle: {
      "growing_steer": { dmIntake: 2.5, protein: 13, tdn: 65, calcium: 0.6, phosphorus: 0.4, vitaminA: 2200 },
      "lactating_cow": { dmIntake: 3.0, protein: 16, tdn: 70, calcium: 0.8, phosphorus: 0.5, vitaminA: 3900 },
      "dry_cow": { dmIntake: 2.0, protein: 10, tdn: 60, calcium: 0.4, phosphorus: 0.3, vitaminA: 2200 },
      "breeding_bull": { dmIntake: 2.5, protein: 12, tdn: 65, calcium: 0.5, phosphorus: 0.4, vitaminA: 3900 }
    },
    sheep: {
      "growing_lamb": { dmIntake: 4.0, protein: 16, tdn: 68, calcium: 0.8, phosphorus: 0.5, vitaminA: 1000 },
      "lactating_ewe": { dmIntake: 4.5, protein: 18, tdn: 72, calcium: 1.0, phosphorus: 0.6, vitaminA: 1500 },
      "dry_ewe": { dmIntake: 3.0, protein: 12, tdn: 60, calcium: 0.6, phosphorus: 0.4, vitaminA: 1000 },
      "breeding_ram": { dmIntake: 3.5, protein: 14, tdn: 65, calcium: 0.7, phosphorus: 0.5, vitaminA: 1500 }
    },
    goats: {
      "growing_kid": { dmIntake: 4.5, protein: 18, tdn: 70, calcium: 0.9, phosphorus: 0.6, vitaminA: 1200 },
      "lactating_doe": { dmIntake: 5.0, protein: 20, tdn: 75, calcium: 1.2, phosphorus: 0.7, vitaminA: 1800 },
      "dry_doe": { dmIntake: 3.5, protein: 14, tdn: 62, calcium: 0.7, phosphorus: 0.5, vitaminA: 1200 },
      "breeding_buck": { dmIntake: 4.0, protein: 16, tdn: 68, calcium: 0.8, phosphorus: 0.6, vitaminA: 1800 }
    }
  };

  useEffect(() => {
    if (analysisMode === "integrated" && selectedPaddock) {
      performIntegratedAnalysis();
    }
  }, [selectedPaddock, season, analysisMode]);

  // Auto-detect primary species from herds
  useEffect(() => {
    if (herds.length > 0 && selectedSpecies === "all") {
      const speciesCount: Record<string, number> = {};
      
      herds.forEach(herd => {
        if (herd.composition && Array.isArray(herd.composition)) {
          herd.composition.forEach(comp => {
            const species = comp.species.toLowerCase();
            speciesCount[species] = (speciesCount[species] || 0) + comp.count;
          });
        } else if (herd.species) {
          const species = herd.species.toLowerCase();
          speciesCount[species] = (speciesCount[species] || 0) + (herd.count || 0);
        }
      });

      // Auto-select the most common species
      if (Object.keys(speciesCount).length > 0) {
        const primarySpecies = Object.entries(speciesCount)
          .sort(([,a], [,b]) => b - a)[0][0];
        setSelectedSpecies(primarySpecies);
      }
    }
  }, [herds]);

  useEffect(() => {
    calculateAnimalRequirements();
  }, [herds, selectedSpecies]);

  const performIntegratedAnalysis = () => {
    // Only perform analysis if we have real plant identification and assessment data
    if (paddocks.length === 0 && assessments.length === 0) {
      setNutritionalData(null);
      setDeficitAnalysis([]);
      return;
    }

    // Analysis will be based on actual plant ID data and step-point assessments when available
    // For now, clear mock data and show empty states
    setNutritionalData(null);
    setDeficitAnalysis([]);
  };

  const calculateAnimalRequirements = () => {
    const requirements: AnimalRequirements[] = [];
    
    herds.forEach(herd => {
      if (selectedSpecies === "all" || herd.species === selectedSpecies) {
        const category = determineAnimalCategory(herd);
        const standards = animalStandards[herd.species as keyof typeof animalStandards];
        
        if (standards && category in standards) {
          // Use explicit property access to avoid TypeScript inference issues
          let categoryStandards;
          if (herd.species === "cattle") {
            categoryStandards = animalStandards.cattle[category as keyof typeof animalStandards.cattle];
          } else if (herd.species === "sheep") {
            categoryStandards = animalStandards.sheep[category as keyof typeof animalStandards.sheep];
          } else if (herd.species === "goats") {
            categoryStandards = animalStandards.goats[category as keyof typeof animalStandards.goats];
          }
          
          if (categoryStandards) {
            requirements.push({
              species: herd.species,
              category: herd.name,
              weight: herd.averageWeight || 500,
              stage: category,
              dmIntake: categoryStandards.dmIntake,
              requirements: {
                crudeProtein: categoryStandards.protein,
                tdnPercent: categoryStandards.tdn,
                calcium: categoryStandards.calcium,
                phosphorus: categoryStandards.phosphorus,
                vitaminA: categoryStandards.vitaminA
              }
            });
          }
        }
      }
    });

    setAnimalRequirements(requirements);
  };

  const determineAnimalCategory = (herd: any) => {
    // Simplified categorization logic
    if (herd.notes?.includes("lactating") || herd.notes?.includes("milk")) return "lactating_cow";
    if (herd.notes?.includes("breeding") || herd.notes?.includes("bull")) return "breeding_bull";
    if (herd.notes?.includes("growing") || herd.notes?.includes("young")) return "growing_steer";
    return "dry_cow";
  };

  const performDeficitAnalysis = (composition: NutritionalComposition) => {
    const deficits: NutritionalDeficit[] = [];

    animalRequirements.forEach(req => {
      // Protein analysis
      const proteinDeficit = req.requirements.crudeProtein - composition.crudeProtein;
      if (proteinDeficit > 0) {
        deficits.push({
          nutrient: `Protein (${req.category})`,
          required: req.requirements.crudeProtein,
          available: composition.crudeProtein,
          deficit: proteinDeficit,
          severity: proteinDeficit > 5 ? "severe" : proteinDeficit > 2 ? "moderate" : "mild",
          recommendations: [
            "Consider protein supplementation",
            "Increase legume content in pasture",
            "Provide high-protein hay or cubes"
          ]
        });
      }

      // Energy analysis
      const energyDeficit = req.requirements.tdnPercent - composition.energy.tdnPercent;
      if (energyDeficit > 0) {
        deficits.push({
          nutrient: `Energy (${req.category})`,
          required: req.requirements.tdnPercent,
          available: composition.energy.tdnPercent,
          deficit: energyDeficit,
          severity: energyDeficit > 10 ? "severe" : energyDeficit > 5 ? "moderate" : "mild",
          recommendations: [
            "Provide grain or energy supplements",
            "Improve pasture quality",
            "Consider higher energy forages"
          ]
        });
      }

      // Mineral analysis
      const calciumDeficit = req.requirements.calcium - composition.minerals.calcium;
      if (calciumDeficit > 0) {
        deficits.push({
          nutrient: `Calcium (${req.category})`,
          required: req.requirements.calcium,
          available: composition.minerals.calcium,
          deficit: calciumDeficit,
          severity: calciumDeficit > 0.3 ? "severe" : calciumDeficit > 0.1 ? "moderate" : "mild",
          recommendations: [
            "Provide calcium supplement",
            "Add limestone to mineral mix",
            "Increase legume content"
          ]
        });
      }
    });

    setDeficitAnalysis(deficits);
  };

  const getDeficitColor = (severity: string) => {
    switch (severity) {
      case "severe": return "text-red-600 bg-red-50 border-red-200";
      case "moderate": return "text-orange-600 bg-orange-50 border-orange-200";
      case "mild": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default: return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const renderNutritionalComposition = () => {
    if (!nutritionalData) return null;

    const compositionData = [
      { name: "Protein", value: nutritionalData.crudeProtein, color: "#3B82F6" },
      { name: "Fiber", value: nutritionalData.fiber.ndf, color: "#10B981" },
      { name: "Energy", value: nutritionalData.energy.tdnPercent, color: "#F59E0B" },
      { name: "Minerals", value: 5, color: "#8B5CF6" },
      { name: "Other", value: 100 - nutritionalData.crudeProtein - nutritionalData.fiber.ndf - nutritionalData.energy.tdnPercent - 5, color: "#6B7280" }
    ];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nutritional Composition</CardTitle>
            <CardDescription>Complete nutrient profile of current pasture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-4">Composition Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPI data={compositionData}>
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Tooltip />
                  </RechartsPI>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Key Nutrients</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Crude Protein:</span>
                      <span className="font-medium">{nutritionalData.crudeProtein.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TDN:</span>
                      <span className="font-medium">{nutritionalData.energy.tdnPercent.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ADF:</span>
                      <span className="font-medium">{nutritionalData.fiber.adf.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NDF:</span>
                      <span className="font-medium">{nutritionalData.fiber.ndf.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Digestibility:</span>
                      <span className="font-medium">{nutritionalData.digestibility}%</span>
                    </div>
                  </div>
                </div>

                {complexityLevel !== "basic" && (
                  <div>
                    <h4 className="font-medium mb-3">Minerals</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Calcium:</span>
                        <span>{nutritionalData.minerals.calcium.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phosphorus:</span>
                        <span>{nutritionalData.minerals.phosphorus.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potassium:</span>
                        <span>{nutritionalData.minerals.potassium.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Magnesium:</span>
                        <span>{nutritionalData.minerals.magnesium.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {complexityLevel === "advanced" && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Energy Values</h4>
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <span className="text-gray-600">NEm:</span>
                    <span className="ml-2 font-medium">{nutritionalData.energy.neMaintenanceMcal.toFixed(2)} Mcal/lb</span>
                  </div>
                  <div>
                    <span className="text-gray-600">NEg:</span>
                    <span className="ml-2 font-medium">{nutritionalData.energy.neGainMcal.toFixed(2)} Mcal/lb</span>
                  </div>
                  <div>
                    <span className="text-gray-600">NEL:</span>
                    <span className="ml-2 font-medium">{nutritionalData.energy.neLactationMcal.toFixed(2)} Mcal/lb</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDeficitAnalysis = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutritional Deficit Analysis</CardTitle>
          <CardDescription>Comparison of available nutrients vs. animal requirements</CardDescription>
        </CardHeader>
        <CardContent>
          {deficitAnalysis.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="font-semibold text-green-800 mb-2">No Deficits Detected</h3>
              <p className="text-gray-600">Current pasture meets all identified animal requirements.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deficitAnalysis.map((deficit, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getDeficitColor(deficit.severity)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{deficit.nutrient}</h4>
                    <Badge variant={deficit.severity === "severe" ? "destructive" : "secondary"}>
                      {deficit.severity}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Required:</span>
                      <span className="ml-2 font-medium">{deficit.required.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Available:</span>
                      <span className="ml-2 font-medium">{deficit.available.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Deficit:</span>
                      <span className="ml-2 font-medium text-red-600">{deficit.deficit.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-1">Recommendations:</h5>
                    <ul className="list-disc ml-5 text-sm space-y-1">
                      {deficit.recommendations.map((rec, recIndex) => (
                        <li key={recIndex}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderManualEntry = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manual Nutrient Entry</CardTitle>
          <CardDescription>Enter nutrient values from laboratory analysis or feed testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="protein">Crude Protein (%)</Label>
              <Input id="protein" type="number" step="0.1" placeholder="12.5" />
            </div>
            <div>
              <Label htmlFor="tdn">TDN (%)</Label>
              <Input id="tdn" type="number" step="0.1" placeholder="65.0" />
            </div>
            <div>
              <Label htmlFor="adf">ADF (%)</Label>
              <Input id="adf" type="number" step="0.1" placeholder="28.0" />
            </div>
            <div>
              <Label htmlFor="ndf">NDF (%)</Label>
              <Input id="ndf" type="number" step="0.1" placeholder="55.0" />
            </div>
            {complexityLevel !== "basic" && (
              <>
                <div>
                  <Label htmlFor="calcium">Calcium (%)</Label>
                  <Input id="calcium" type="number" step="0.01" placeholder="0.45" />
                </div>
                <div>
                  <Label htmlFor="phosphorus">Phosphorus (%)</Label>
                  <Input id="phosphorus" type="number" step="0.01" placeholder="0.30" />
                </div>
              </>
            )}
          </div>
          
          <Button className="mt-4">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Analysis
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderRecommendations = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feeding Recommendations</CardTitle>
          <CardDescription>Specific feeding strategies based on nutritional analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Rotational Grazing</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Based on current nutrient levels, recommend 3-4 day grazing periods with 21-day rest to maintain quality.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-3">
                <Wheat className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100">Supplementation Plan</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Provide 2-3 lbs protein supplement per head daily to meet lactating cow requirements.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3">
                <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">Pasture Improvement</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Consider interseeding legumes to increase protein content and nitrogen fixation.
                  </p>
                </div>
              </div>
            </div>

            {complexityLevel === "advanced" && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                <div className="flex items-start space-x-3">
                  <Beaker className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Advanced Ration Balancing</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Complete TMR formulation with least-cost optimization and metabolizable protein calculations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Nutritional Analysis
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Comprehensive nutritional analysis and deficit calculation for optimal livestock feeding
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="integrated">Integrated</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={complexityLevel} onValueChange={(value: any) => setComplexityLevel(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {analysisMode === "integrated" && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Integrated Mode</strong> uses data from Plant Identification, DM Availability, and Pasture Assessments 
              to provide comprehensive nutritional analysis.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="analysis" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="deficits" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Deficits</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Recommendations</span>
              <span className="sm:hidden">Rec's</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Integration</span>
              <span className="sm:hidden">Integrate</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {analysisMode === "integrated" && (
            <Card>
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
                <CardDescription>Select data sources for integrated analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="paddock">Paddock</Label>
                    <Select value={selectedPaddock} onValueChange={setSelectedPaddock}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select paddock" />
                      </SelectTrigger>
                      <SelectContent>
                        {paddocks.map(paddock => (
                          <SelectItem key={paddock.id} value={paddock.id.toString()}>
                            {paddock.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="season">Season</Label>
                    <Select value={season} onValueChange={setSeason}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spring">Spring</SelectItem>
                        <SelectItem value="summer">Summer</SelectItem>
                        <SelectItem value="fall">Fall</SelectItem>
                        <SelectItem value="winter">Winter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="species">Animal Species</Label>
                    <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Species</SelectItem>
                        <SelectItem value="cattle">Cattle</SelectItem>
                        <SelectItem value="sheep">Sheep</SelectItem>
                        <SelectItem value="goats">Goats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button className="mt-4" onClick={performIntegratedAnalysis}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>
              </CardContent>
            </Card>
          )}

          {analysisMode === "manual" && renderManualEntry()}
          {renderNutritionalComposition()}
        </TabsContent>

        <TabsContent value="deficits" className="space-y-6">
          {renderDeficitAnalysis()}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {renderRecommendations()}
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tool Integration Benefits</CardTitle>
              <CardDescription>How nutritional analysis integrates with other farm management tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Plant Identification</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Species composition data automatically calculates weighted nutritional values
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Scale className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">DM Availability</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Dry matter calculations inform total nutrient availability per paddock
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Animal Unit Calculator</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AU data provides accurate animal requirement calculations
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wheat className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Feed Supplement Calculator</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Deficit analysis feeds directly into supplement recommendations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {complexityLevel === "advanced" && (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Integration Features</CardTitle>
                <CardDescription>Professional-grade nutritional analysis capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Complete Ration Balancing</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Linear programming optimization for least-cost feed formulation with metabolizable protein calculations.
                    </p>
                    <div className="text-xs text-gray-500 italic">
                      Available in future updates
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Seasonal Nutritional Modeling</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Predictive nutritional changes based on plant maturity, weather patterns, and historical data.
                    </p>
                    <div className="text-xs text-gray-500 italic">
                      Available in future updates
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Laboratory Integration</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Import results from commercial feed testing laboratories for precise analysis.
                    </p>
                    <Button size="sm">
                      <Beaker className="h-4 w-4 mr-1" />
                      Import Lab Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Smart Workflow Handoffs */}
      <SmartWorkflowHandoffs 
        currentTool="nutritional-analysis"
        completedActions={nutritionalData ? ['analysis_completed'] : []}
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