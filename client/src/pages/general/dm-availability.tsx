import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wheat, Calculator, Camera, Ruler, Scale, TrendingUp, 
  Leaf, Sun, Calendar, Info, Target, Eye, BookOpen
} from "lucide-react";

interface DMAssessment {
  id?: number;
  paddockId: number;
  method: "visual" | "height" | "clipping" | "steppoint";
  assessmentDate: Date;
  season: "spring" | "summer" | "fall" | "winter";
  weather: {
    temperature: number;
    humidity: number;
    lastRainfall: number; // days ago
    growingConditions: "poor" | "fair" | "good" | "excellent";
  };
  measurements: {
    averageHeight: number;
    density: number;
    qualityScore: number;
    species: string[];
    maturityStage: "vegetative" | "boot" | "heading" | "seed";
  };
  dryMatterResults: {
    totalDMAvailable: number; // lbs per acre
    utilizablePercent: number;
    utilizableDM: number; // lbs per acre
    quality: {
      protein: number;
      digestibility: number;
      energy: number;
    };
  };
  recommendations: {
    grazingDays: number;
    stockingRate: number;
    bestUtilization: string;
    nextAssessment: Date;
  };
}

interface RegionalData {
  growthRates: {
    spring: number;
    summer: number;
    fall: number;
    winter: number;
  };
  heightToDMRatio: number;
  qualityFactors: {
    protein: { min: number; max: number };
    digestibility: { min: number; max: number };
  };
}

export default function DMAvailability() {
  const [complexityLevel, setComplexityLevel] = useState<"basic" | "intermediate" | "advanced">("basic");
  const [assessmentMethod, setAssessmentMethod] = useState<"visual" | "height" | "clipping" | "steppoint">("visual");
  const [selectedPaddock, setSelectedPaddock] = useState<number | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<Partial<DMAssessment>>({});
  const [showEducation, setShowEducation] = useState(false);

  // Fetch paddocks and existing assessments
  const { data: paddocks = [], isLoading: paddocksLoading } = useQuery<any[]>({ 
    queryKey: ["/api/paddocks"] 
  });

  const { data: assessments = [] } = useQuery<any[]>({ 
    queryKey: ["/api/assessments"] 
  });

  // Regional data for SE Oklahoma conditions
  const regionalData: RegionalData = {
    growthRates: {
      spring: 80, // lbs DM per acre per day
      summer: 40,
      fall: 25,
      winter: 5
    },
    heightToDMRatio: 300, // lbs DM per acre per inch of height
    qualityFactors: {
      protein: { min: 8, max: 18 },
      digestibility: { min: 55, max: 75 }
    }
  };

  const getCurrentSeason = (): "spring" | "summer" | "fall" | "winter" => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const calculateDMFromHeight = (height: number, density: number, quality: number): number => {
    // Base calculation: height (inches) × regional factor × density adjustment × quality factor
    const baseDM = height * regionalData.heightToDMRatio;
    const densityFactor = density / 10; // Normalize density (1-10 scale)
    const qualityFactor = 0.7 + (quality / 10) * 0.6; // Quality affects yield (0.7-1.3 range)
    
    return Math.round(baseDM * densityFactor * qualityFactor);
  };

  const calculateDMFromVisual = (species: string[], quality: number, coverage: number): number => {
    // Visual estimation based on species composition and quality
    const speciesFactors = {
      'bermudagrass': 2500,
      'fescue': 3000,
      'bahiagrass': 2000,
      'native grasses': 1800,
      'clover': 2200,
      'other legumes': 2000
    };

    let weightedDM = 0;
    species.forEach(spec => {
      const factor = speciesFactors[spec.toLowerCase() as keyof typeof speciesFactors] || 2000;
      weightedDM += factor;
    });

    const avgDM = species.length > 0 ? weightedDM / species.length : 2000;
    const qualityFactor = 0.4 + (quality / 10) * 0.8; // More conservative for visual
    const coverageFactor = coverage / 100;

    return Math.round(avgDM * qualityFactor * coverageFactor);
  };

  const calculateQualityMetrics = (species: string[], maturity: string, season: string) => {
    // Protein content based on species and maturity
    let baseProtein = 12;
    if (species.includes('clover') || species.includes('other legumes')) {
      baseProtein = 16;
    }
    if (maturity === 'vegetative') baseProtein += 4;
    if (maturity === 'boot') baseProtein += 1;
    if (maturity === 'heading') baseProtein -= 2;
    if (maturity === 'seed') baseProtein -= 4;

    // Seasonal adjustments
    if (season === 'spring') baseProtein += 2;
    if (season === 'summer') baseProtein -= 1;
    if (season === 'fall') baseProtein += 1;
    if (season === 'winter') baseProtein -= 2;

    // Digestibility based on maturity and species
    let digestibility = 65;
    if (maturity === 'vegetative') digestibility = 75;
    if (maturity === 'boot') digestibility = 70;
    if (maturity === 'heading') digestibility = 60;
    if (maturity === 'seed') digestibility = 55;

    // Energy calculation (TDN approximation)
    const energy = (digestibility * 0.98) - 3;

    return {
      protein: Math.max(6, Math.min(20, baseProtein)),
      digestibility: Math.max(45, Math.min(80, digestibility)),
      energy: Math.max(45, Math.min(75, energy))
    };
  };

  const calculateGrazingRecommendations = (utilizableDM: number, paddockAcres: number) => {
    // Standard intake: 26 lbs DM per AU per day
    const dailyIntakePerAU = 26;
    const utilizationRate = 0.5; // Conservative 50% utilization
    
    const totalAvailableDM = utilizableDM * paddockAcres;
    const grazingDays = Math.floor((totalAvailableDM * utilizationRate) / dailyIntakePerAU);
    
    // Calculate appropriate stocking rate
    const stockingRate = totalAvailableDM * utilizationRate / (dailyIntakePerAU * 30); // AU per month
    
    return {
      grazingDays,
      stockingRate: Math.round(stockingRate * 10) / 10,
      utilizationRate: utilizationRate * 100
    };
  };

  const performAssessment = () => {
    if (!selectedPaddock || !currentAssessment.measurements) return;

    const paddock = paddocks.find(p => p.id === selectedPaddock);
    const paddockAcres = parseFloat(paddock?.acreage) || 5;
    const season = getCurrentSeason();
    
    let totalDM = 0;
    
    // Calculate DM based on method
    switch (assessmentMethod) {
      case "height":
        totalDM = calculateDMFromHeight(
          currentAssessment.measurements.averageHeight || 4,
          currentAssessment.measurements.density || 5,
          currentAssessment.measurements.qualityScore || 5
        );
        break;
        
      case "visual":
        totalDM = calculateDMFromVisual(
          currentAssessment.measurements.species || [],
          currentAssessment.measurements.qualityScore || 5,
          75 // Assumed coverage
        );
        break;
        
      case "steppoint":
        // Use data from step-point assessment if available
        const stepPointData = assessments.find(a => a.paddockId === selectedPaddock);
        if (stepPointData) {
          totalDM = calculateDMFromHeight(
            stepPointData.summary?.avgHeight || 4,
            stepPointData.summary?.avgDensity || 5,
            stepPointData.summary?.avgQualityScore || 5
          );
        } else {
          totalDM = 2000; // Default if no step-point data
        }
        break;
        
      default:
        totalDM = 2000;
    }

    // Calculate utilizable percentage based on quality and density
    const qualityScore = currentAssessment.measurements.qualityScore || 5;
    const utilizablePercent = Math.max(40, Math.min(70, 40 + (qualityScore * 3)));
    const utilizableDM = Math.round(totalDM * (utilizablePercent / 100));

    // Calculate quality metrics
    const quality = calculateQualityMetrics(
      currentAssessment.measurements.species || [],
      currentAssessment.measurements.maturityStage || "vegetative",
      season
    );

    // Calculate grazing recommendations
    const grazing = calculateGrazingRecommendations(utilizableDM, paddockAcres);

    const results: DMAssessment = {
      paddockId: selectedPaddock,
      method: assessmentMethod,
      assessmentDate: new Date(),
      season,
      weather: currentAssessment.weather || {
        temperature: 75,
        humidity: 65,
        lastRainfall: 3,
        growingConditions: "good"
      },
      measurements: currentAssessment.measurements,
      dryMatterResults: {
        totalDMAvailable: totalDM,
        utilizablePercent,
        utilizableDM,
        quality
      },
      recommendations: {
        grazingDays: grazing.grazingDays,
        stockingRate: grazing.stockingRate,
        bestUtilization: `Graze for ${grazing.grazingDays} days at ${grazing.utilizationRate}% utilization`,
        nextAssessment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
      }
    };

    setCurrentAssessment(results);
  };

  const renderMethodContent = () => {
    switch (assessmentMethod) {
      case "visual":
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Visual estimation is the quickest method but less precise. Best for routine monitoring.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Primary Species Present</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {["Bermudagrass", "Fescue", "Bahiagrass", "Native Grasses", "Clover", "Other Legumes"].map(species => (
                  <div key={species} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={species}
                      checked={currentAssessment.measurements?.species?.includes(species) || false}
                      onChange={(e) => {
                        const current = currentAssessment.measurements?.species || [];
                        const updated = e.target.checked 
                          ? [...current, species]
                          : current.filter(s => s !== species);
                        
                        setCurrentAssessment(prev => ({
                          ...prev,
                          measurements: {
                            ...prev.measurements,
                            species: updated,
                            averageHeight: prev.measurements?.averageHeight || 4,
                            density: prev.measurements?.density || 5,
                            qualityScore: prev.measurements?.qualityScore || 5,
                            maturityStage: prev.measurements?.maturityStage || "vegetative"
                          }
                        }));
                      }}
                    />
                    <Label htmlFor={species} className="text-sm">{species}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Overall Quality Assessment (1-10)</Label>
              <Slider
                value={[currentAssessment.measurements?.qualityScore || 5]}
                onValueChange={(value) => setCurrentAssessment(prev => ({
                  ...prev,
                  measurements: {
                    ...prev.measurements,
                    qualityScore: value[0],
                    species: prev.measurements?.species || [],
                    averageHeight: prev.measurements?.averageHeight || 4,
                    density: prev.measurements?.density || 5,
                    maturityStage: prev.measurements?.maturityStage || "vegetative"
                  }
                }))}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
              <div className="text-center text-sm text-gray-500 mt-1">
                {currentAssessment.measurements?.qualityScore || 5} - {
                  (currentAssessment.measurements?.qualityScore || 5) <= 3 ? "Poor" :
                  (currentAssessment.measurements?.qualityScore || 5) <= 6 ? "Fair" :
                  (currentAssessment.measurements?.qualityScore || 5) <= 8 ? "Good" : "Excellent"
                }
              </div>
            </div>
          </div>
        );

      case "height":
        return (
          <div className="space-y-4">
            <Alert>
              <Ruler className="h-4 w-4" />
              <AlertDescription>
                Height measurement provides good DM estimates when combined with density assessment.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Average Height (inches)</Label>
                <Input
                  type="number"
                  value={currentAssessment.measurements?.averageHeight || ""}
                  onChange={(e) => setCurrentAssessment(prev => ({
                    ...prev,
                    measurements: {
                      ...prev.measurements,
                      averageHeight: parseFloat(e.target.value) || 0,
                      species: prev.measurements?.species || [],
                      density: prev.measurements?.density || 5,
                      qualityScore: prev.measurements?.qualityScore || 5,
                      maturityStage: prev.measurements?.maturityStage || "vegetative"
                    }
                  }))}
                  placeholder="4.0"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Maturity Stage</Label>
                <Select 
                  value={currentAssessment.measurements?.maturityStage || "vegetative"}
                  onValueChange={(value: any) => setCurrentAssessment(prev => ({
                    ...prev,
                    measurements: {
                      ...prev.measurements,
                      maturityStage: value,
                      species: prev.measurements?.species || [],
                      averageHeight: prev.measurements?.averageHeight || 4,
                      density: prev.measurements?.density || 5,
                      qualityScore: prev.measurements?.qualityScore || 5
                    }
                  }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetative">Vegetative</SelectItem>
                    <SelectItem value="boot">Boot Stage</SelectItem>
                    <SelectItem value="heading">Heading</SelectItem>
                    <SelectItem value="seed">Seed Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Stand Density (1-10)</Label>
              <Slider
                value={[currentAssessment.measurements?.density || 5]}
                onValueChange={(value) => setCurrentAssessment(prev => ({
                  ...prev,
                  measurements: {
                    ...prev.measurements,
                    density: value[0],
                    species: prev.measurements?.species || [],
                    averageHeight: prev.measurements?.averageHeight || 4,
                    qualityScore: prev.measurements?.qualityScore || 5,
                    maturityStage: prev.measurements?.maturityStage || "vegetative"
                  }
                }))}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
              <div className="text-center text-sm text-gray-500 mt-1">
                {currentAssessment.measurements?.density || 5} - {
                  (currentAssessment.measurements?.density || 5) <= 3 ? "Thin" :
                  (currentAssessment.measurements?.density || 5) <= 6 ? "Moderate" :
                  (currentAssessment.measurements?.density || 5) <= 8 ? "Dense" : "Very Dense"
                }
              </div>
            </div>
          </div>
        );

      case "steppoint":
        return (
          <div className="space-y-4">
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                Uses existing step-point assessment data for the most accurate DM calculations.
              </AlertDescription>
            </Alert>

            {assessments.find(a => a.paddockId === selectedPaddock) ? (
              <Card>
                <CardHeader>
                  <CardTitle>Available Assessment Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div>Recent step-point assessment found for this paddock</div>
                    <div>Data will be automatically used for DM calculations</div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Assessment Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div>No step-point assessment found for this paddock</div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/enhanced-pasture-assessment'}
                      className="w-full"
                    >
                      Conduct Step-Point Assessment First
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!currentAssessment.dryMatterResults) return null;

    const { dryMatterResults, recommendations } = currentAssessment as DMAssessment;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dry Matter Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total DM Available:</span>
                  <span className="font-bold">{dryMatterResults.totalDMAvailable} lbs/acre</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilizable (%):</span>
                  <span className="font-bold">{dryMatterResults.utilizablePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Utilizable DM:</span>
                  <span className="font-bold text-green-600">{dryMatterResults.utilizableDM} lbs/acre</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Protein:</span>
                  <span className="font-bold">{dryMatterResults.quality.protein}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Digestibility:</span>
                  <span className="font-bold">{dryMatterResults.quality.digestibility}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Energy (TDN):</span>
                  <span className="font-bold">{dryMatterResults.quality.energy}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grazing Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Potential Grazing Days</div>
                  <div className="text-2xl font-bold text-green-600">{recommendations?.grazingDays}</div>
                  <div className="text-xs text-gray-500">For 1 AU at 50% utilization</div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Recommended Stocking Rate</div>
                  <div className="text-2xl font-bold text-blue-600">{recommendations?.stockingRate}</div>
                  <div className="text-xs text-gray-500">AU per month</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Management Strategy</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recommendations?.bestUtilization}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Next Assessment</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recommended: {recommendations?.nextAssessment.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <Button variant="outline" onClick={() => setCurrentAssessment({})}>
            New Assessment
          </Button>
          <Button onClick={() => window.location.href = '/water-requirements'}>
            Calculate Water Needs
          </Button>
          <Button onClick={() => window.location.href = '/analytics'}>
            View Trends
          </Button>
        </div>
      </div>
    );
  };

  if (paddocksLoading) {
    return (
      <div className="container mx-auto p-3 sm:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading DM calculator...</p>
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
              Dry Matter Availability
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Calculate available forage and plan grazing schedules based on pasture productivity
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowEducation(!showEducation)}
              className="text-xs sm:text-sm"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Learn DM
            </Button>
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

        {showEducation && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Dry Matter (DM)</strong> is the weight of forage after all moisture is removed. 
              It's the standard measure for comparing feed value and planning livestock nutrition. 
              Fresh pasture is typically 15-25% DM, with the rest being water.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="assess" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assess">Assessment</TabsTrigger>
          <TabsTrigger value="method">Method</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="assess" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Assessment Method</Label>
              <Select value={assessmentMethod} onValueChange={(value: any) => setAssessmentMethod(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual Estimation</SelectItem>
                  <SelectItem value="height">Height Measurement</SelectItem>
                  <SelectItem value="steppoint">Step-Point Integration</SelectItem>
                  {complexityLevel === "advanced" && (
                    <SelectItem value="clipping">Clipping & Weighing</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Paddock</Label>
              <Select value={selectedPaddock?.toString() || ""} onValueChange={(value) => setSelectedPaddock(parseInt(value))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose paddock" />
                </SelectTrigger>
                <SelectContent>
                  {paddocks.map((paddock) => (
                    <SelectItem key={paddock.id} value={paddock.id.toString()}>
                      {paddock.name} ({paddock.acreage} acres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {complexityLevel !== "basic" && (
            <Card>
              <CardHeader>
                <CardTitle>Growing Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Days Since Last Rain</Label>
                    <Input
                      type="number"
                      value={currentAssessment.weather?.lastRainfall || ""}
                      onChange={(e) => setCurrentAssessment(prev => ({
                        ...prev,
                        weather: {
                          ...prev.weather,
                          lastRainfall: parseInt(e.target.value) || 0,
                          temperature: prev.weather?.temperature || 75,
                          humidity: prev.weather?.humidity || 65,
                          growingConditions: prev.weather?.growingConditions || "good"
                        }
                      }))}
                      placeholder="3"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Growing Conditions</Label>
                    <Select 
                      value={currentAssessment.weather?.growingConditions || "good"}
                      onValueChange={(value: any) => setCurrentAssessment(prev => ({
                        ...prev,
                        weather: {
                          ...prev.weather,
                          growingConditions: value,
                          temperature: prev.weather?.temperature || 75,
                          humidity: prev.weather?.humidity || 65,
                          lastRainfall: prev.weather?.lastRainfall || 3
                        }
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="method" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {assessmentMethod === "visual" && <Eye className="h-5 w-5" />}
                {assessmentMethod === "height" && <Ruler className="h-5 w-5" />}
                {assessmentMethod === "steppoint" && <Target className="h-5 w-5" />}
                {assessmentMethod === "clipping" && <Scale className="h-5 w-5" />}
                <span className="capitalize">{assessmentMethod} Assessment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderMethodContent()}

              <div className="mt-6">
                <Button onClick={performAssessment} className="w-full" disabled={!selectedPaddock}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate DM Availability
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {currentAssessment.dryMatterResults ? (
            renderResults()
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Wheat className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Complete an assessment to see DM availability results</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration with Other Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="font-medium">AU Calculator</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Compare DM availability with animal unit requirements for optimal stocking
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Step-Point Assessment</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use detailed pasture data for the most accurate DM calculations
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Grazing Calendar</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plan rotation schedules based on DM availability and regrowth rates
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Performance Analytics</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track DM trends over time and correlate with livestock performance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Planning Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Spring Management</h4>
                  <ul className="text-sm space-y-1 list-disc ml-4">
                    <li>Peak growth period - highest DM production</li>
                    <li>Monitor for rapid changes in availability</li>
                    <li>Consider increasing stocking temporarily</li>
                    <li>Quality is typically excellent</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Summer Management</h4>
                  <ul className="text-sm space-y-1 list-disc ml-4">
                    <li>Growth rate slows with heat stress</li>
                    <li>Focus on maintaining quality through rotation</li>
                    <li>Monitor for drought stress indicators</li>
                    <li>Adjust stocking rates accordingly</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Fall Management</h4>
                  <ul className="text-sm space-y-1 list-disc ml-4">
                    <li>Moderate regrowth with cooler temperatures</li>
                    <li>Build reserves for winter feeding</li>
                    <li>Monitor protein levels as grasses mature</li>
                    <li>Plan for stockpiling strategies</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Winter Management</h4>
                  <ul className="text-sm space-y-1 list-disc ml-4">
                    <li>Minimal growth - rely on stockpiled forage</li>
                    <li>Supplement based on DM shortfalls</li>
                    <li>Protect growing points from overgrazing</li>
                    <li>Plan for spring recovery period</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}