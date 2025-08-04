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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calculator, DollarSign, Package, TrendingUp, Scale,
  Wheat, Leaf, Info, ShoppingCart, Calendar, Target, Users, CheckCircle
} from "lucide-react";
import { SmartWorkflowHandoffs } from "@/components/smart-workflow-handoffs";
import { UpgradeValueProposition } from "@/components/upgrade-value-proposition";
import { useAuth } from "@/contexts/auth-context";

interface HerdComposition {
  species: string;
  count: number;
  breed?: string;
}

interface Herd {
  id: number;
  name: string;
  composition: HerdComposition[];
  totalCount: number;
  notes?: string;
}

interface LivestockCategory {
  species: string;
  category: string; // adult, lactating, growing, etc.
  count: number;
  totalAvailable: number; // total of this species in herds
}

interface NutritionalRequirement {
  species: string;
  category: string;
  dmIntake: number; // lbs per day
  protein: number; // % DM
  energy: number; // TDN %
  calcium: number; // % DM
  phosphorus: number; // % DM
}

interface PastureAnalysis {
  dmAvailable: number; // lbs per acre
  utilizableDM: number; // lbs per acre  
  quality: {
    protein: number;
    energy: number;
    calcium: number;
    phosphorus: number;
  };
  grazingDays: number;
  season: string;
}

interface SupplementOption {
  id: string;
  name: string;
  type: "hay" | "pellets" | "cubes" | "grain" | "protein" | "mineral";
  nutrients: {
    protein: number;
    energy: number;
    calcium: number;
    phosphorus: number;
  };
  costPerTon: number;
  availability: "excellent" | "good" | "limited";
  feedingNotes: string[];
}

interface SupplementRecommendation {
  supplement: SupplementOption;
  dailyAmount: number; // lbs per AU
  costPerDay: number;
  costPerMonth: number;
  purpose: string;
  feedingSchedule: string;
  mixingInstructions?: string;
  transitionDays: number;
}

interface DeficitAnalysis {
  pastureProvides: {
    protein: number;
    energy: number;
    calcium: number;
    phosphorus: number;
  };
  animalRequires: {
    protein: number;
    energy: number;
    calcium: number;
    phosphorus: number;
  };
  deficits: {
    protein: number;
    energy: number;
    calcium: number;
    phosphorus: number;
  };
  recommendations: SupplementRecommendation[];
  totalMonthlyCost: number;
  costPerAU: number;
}

export default function FeedSupplementCalculator() {
  const { user } = useAuth();
  
  // Auto-set complexity based on subscription tier
  const getComplexityLevel = () => {
    if (!user?.subscriptionTier) return "basic";
    
    switch (user.subscriptionTier) {
      case "professional": return "intermediate";
      case "enterprise": return "advanced";
      default: return "basic"; // Should redirect to upgrade
    }
  };
  
  const complexityLevel = getComplexityLevel();
  
  // Check tier level - Basic gets simplified version, Professional+ gets full features
  const getTierLevel = () => {
    const tier = user?.subscriptionTier || "free";
    if (["professional", "enterprise"].includes(tier)) return "full";
    return "basic"; // Basic tier gets simplified version
  };
  
  const tierLevel = getTierLevel();
  
  const [selectedLivestock, setSelectedLivestock] = useState<string>("cattle_adult");
  const [animalCount, setAnimalCount] = useState<number>(25);
  const [pastureCondition, setPastureCondition] = useState<"poor" | "fair" | "good" | "excellent">("fair");
  const [season, setSeason] = useState<"spring" | "summer" | "fall" | "winter">("summer");
  const [deficitAnalysis, setDeficitAnalysis] = useState<DeficitAnalysis | null>(null);
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [livestockCategories, setLivestockCategories] = useState<LivestockCategory[]>([]);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [autoDetectedData, setAutoDetectedData] = useState({
    pastureCondition: null as string | null,
    season: null as string | null,
    dataSource: null as string | null
  });
  const [useHerdData, setUseHerdData] = useState<boolean>(true);
  
  // Fetch herds data
  const { data: herds = [], isLoading: herdsLoading } = useQuery<Herd[]>({
    queryKey: ["/api/herds"],
  });

  // Fetch AU data if available
  const { data: auData } = useQuery<any>({ 
    queryKey: ["/api/au-calculations"]
  });

  // Fetch DM availability data if available
  const { data: dmData } = useQuery<any>({ 
    queryKey: ["/api/dm-assessments"]
  });

  const { data: assessments } = useQuery<any>({
    queryKey: ["/api/assessments"]
  });

  // Auto-detect pasture condition and season
  useEffect(() => {
    // Auto-detect season from user zipcode and current date
    if (user?.zipCode) {
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const zipCode = user.zipCode;
      
      // Determine season based on month and rough geographic location
      let detectedSeason: "spring" | "summer" | "fall" | "winter";
      
      // Basic US seasonal logic (could be enhanced with more geographic precision)
      if (currentMonth >= 3 && currentMonth <= 5) {
        detectedSeason = "spring";
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        detectedSeason = "summer";
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        detectedSeason = "fall";
      } else {
        detectedSeason = "winter";
      }
      
      // Auto-detect pasture condition from recent assessments
      let detectedCondition: "poor" | "fair" | "good" | "excellent" = "fair";
      let dataSource = `Auto-detected ${detectedSeason} for zip ${zipCode}`;
      
      if (assessments && assessments.length > 0) {
        // Use most recent assessment
        const recentAssessment = assessments[0];
        
        // Calculate quality based on step points if available
        if (recentAssessment.summary) {
          const qualityScore = recentAssessment.summary.avgQualityScore || 5;
          const grassCover = recentAssessment.summary.grassCoverPercent || 50;
          const bareGround = recentAssessment.summary.bareGroundPercent || 30;
          
          // Convert assessment data to condition rating
          if (qualityScore >= 8 && grassCover >= 80 && bareGround <= 15) {
            detectedCondition = "excellent";
          } else if (qualityScore >= 6 && grassCover >= 60 && bareGround <= 25) {
            detectedCondition = "good";
          } else if (qualityScore >= 4 && grassCover >= 40 && bareGround <= 40) {
            detectedCondition = "fair";
          } else {
            detectedCondition = "poor";
          }
          
          dataSource = `From recent pasture assessment (${new Date(recentAssessment.startedAt).toLocaleDateString()}) and current season`;
        }
      }
      
      setAutoDetectedData({
        pastureCondition: detectedCondition,
        season: detectedSeason,
        dataSource
      });
      
      setPastureCondition(detectedCondition);
      setSeason(detectedSeason);
    }
  }, [user?.zipCode, assessments]);

  // Initialize livestock categories from herds data
  useEffect(() => {
    if (herds.length > 0 && useHerdData) {
      const categories: LivestockCategory[] = [];
      
      herds.forEach(herd => {
        herd.composition.forEach(comp => {
          const speciesLower = comp.species.toLowerCase();
          const totalAvailable = herds.reduce((sum, h) => 
            sum + h.composition.filter(c => c.species.toLowerCase() === speciesLower)
                               .reduce((s, c) => s + c.count, 0), 0
          );

          // Add default non-lactating adult category
          categories.push({
            species: speciesLower,
            category: 'non_lactating_adult',
            count: Math.floor(comp.count * 0.7), // Default 70% as non-lactating adults
            totalAvailable
          });

          // Add lactating category if applicable
          if (['cattle', 'sheep', 'goats'].includes(speciesLower)) {
            categories.push({
              species: speciesLower,
              category: 'lactating',
              count: Math.floor(comp.count * 0.2), // Default 20% lactating
              totalAvailable
            });
          }

          // Add growing category
          categories.push({
            species: speciesLower,
            category: 'growing',
            count: Math.floor(comp.count * 0.1), // Default 10% growing
            totalAvailable
          });
        });
      });

      // Remove duplicates and consolidate by species/category
      const consolidatedCategories: LivestockCategory[] = [];
      categories.forEach(cat => {
        const existing = consolidatedCategories.find(c => 
          c.species === cat.species && c.category === cat.category
        );
        if (existing) {
          existing.count += cat.count;
        } else {
          consolidatedCategories.push({ ...cat });
        }
      });

      setLivestockCategories(consolidatedCategories);
    }
  }, [herds, useHerdData]);

  // Calculate total animals from categories
  const getTotalAnimalsInCategories = () => {
    return livestockCategories.reduce((sum, cat) => sum + cat.count, 0);
  };

  // Update category count
  const updateCategoryCount = (species: string, category: string, newCount: number) => {
    setLivestockCategories(prev => prev.map(cat => 
      cat.species === species && cat.category === category 
        ? { ...cat, count: Math.max(0, Math.min(newCount, cat.totalAvailable)) }
        : cat
    ));
  };

  // Get total available for a species
  const getTotalAvailableForSpecies = (species: string) => {
    const speciesCategories = livestockCategories.filter(cat => cat.species === species);
    return speciesCategories.length > 0 ? speciesCategories[0].totalAvailable : 0;
  };

  // Get total used for a species
  const getTotalUsedForSpecies = (species: string) => {
    return livestockCategories
      .filter(cat => cat.species === species)
      .reduce((sum, cat) => sum + cat.count, 0);
  };

  // Nutritional requirements database
  const requirements: Record<string, NutritionalRequirement> = {
    cattle_non_lactating_adult: {
      species: "cattle",
      category: "non_lactating_adult",
      dmIntake: 26,
      protein: 8,
      energy: 55,
      calcium: 0.18,
      phosphorus: 0.16
    },
    cattle_lactating: {
      species: "cattle", 
      category: "lactating",
      dmIntake: 32,
      protein: 12,
      energy: 65,
      calcium: 0.43,
      phosphorus: 0.26
    },
    cattle_growing: {
      species: "cattle",
      category: "growing",
      dmIntake: 20,
      protein: 12,
      energy: 65,
      calcium: 0.31,
      phosphorus: 0.21
    },
    sheep_non_lactating_adult: {
      species: "sheep",
      category: "non_lactating_adult",
      dmIntake: 3.5,
      protein: 9,
      energy: 55,
      calcium: 0.20,
      phosphorus: 0.16
    },
    sheep_lactating: {
      species: "sheep",
      category: "lactating", 
      dmIntake: 5.5,
      protein: 14,
      energy: 65,
      calcium: 0.52,
      phosphorus: 0.37
    },
    sheep_growing: {
      species: "sheep",
      category: "growing",
      dmIntake: 3.0,
      protein: 16,
      energy: 68,
      calcium: 0.41,
      phosphorus: 0.23
    },
    goats_non_lactating_adult: {
      species: "goats",
      category: "non_lactating_adult",
      dmIntake: 3.2,
      protein: 10,
      energy: 55,
      calcium: 0.19,
      phosphorus: 0.16
    },
    goats_lactating: {
      species: "goats",
      category: "lactating",
      dmIntake: 5.0,
      protein: 16,
      energy: 70,
      calcium: 0.60,
      phosphorus: 0.40
    },
    goats_growing: {
      species: "goats",
      category: "growing",
      dmIntake: 2.8,
      protein: 18,
      energy: 70,
      calcium: 0.45,
      phosphorus: 0.25
    }
  };

  // Supplement options database
  const supplementOptions: SupplementOption[] = [
    {
      id: "alfalfa_hay",
      name: "Alfalfa Hay",
      type: "hay",
      nutrients: { protein: 17, energy: 58, calcium: 1.24, phosphorus: 0.23 },
      costPerTon: 180,
      availability: "good",
      feedingNotes: ["High quality protein source", "Excellent calcium content", "Feed 2-3 times daily"]
    },
    {
      id: "bermuda_hay",
      name: "Bermuda Hay",
      type: "hay", 
      nutrients: { protein: 10, energy: 52, calcium: 0.40, phosphorus: 0.25 },
      costPerTon: 120,
      availability: "excellent",
      feedingNotes: ["Good maintenance feed", "Lower protein than alfalfa", "Cost effective option"]
    },
    {
      id: "alfalfa_cubes",
      name: "Alfalfa Cubes",
      type: "cubes",
      nutrients: { protein: 16, energy: 55, calcium: 1.20, phosphorus: 0.22 },
      costPerTon: 220,
      availability: "good", 
      feedingNotes: ["Convenient to feed", "Reduced waste", "Soak if feeding to horses"]
    },
    {
      id: "protein_pellets",
      name: "20% Protein Pellets",
      type: "pellets",
      nutrients: { protein: 20, energy: 68, calcium: 0.75, phosphorus: 0.45 },
      costPerTon: 350,
      availability: "excellent",
      feedingNotes: ["High protein supplement", "Small amounts needed", "Feed according to label"]
    },
    {
      id: "grain_mix",
      name: "Complete Feed Mix",
      type: "grain",
      nutrients: { protein: 14, energy: 75, calcium: 0.60, phosphorus: 0.40 },
      costPerTon: 280,
      availability: "excellent",
      feedingNotes: ["Balanced nutrition", "High energy", "Limit intake to prevent acidosis"]
    },
    {
      id: "protein_tub",
      name: "Protein Supplement Tub",
      type: "protein",
      nutrients: { protein: 25, energy: 45, calcium: 2.50, phosphorus: 0.50 },
      costPerTon: 480,
      availability: "good",
      feedingNotes: ["Self-limiting intake", "Weather resistant", "Convenient placement"]
    }
  ];

  // Calculate pasture analysis based on conditions
  const getPastureAnalysis = (): PastureAnalysis => {
    // Use real DM data if available, otherwise estimate
    let dmAvailable = 2000;
    let protein = 8;
    let energy = 55;
    
    if (dmData && dmData.length > 0) {
      const latestDM = dmData[0];
      dmAvailable = latestDM.utilizableDM || 2000;
      protein = latestDM.quality?.protein || 8;
      energy = latestDM.quality?.energy || 55;
    } else {
      // Estimate based on condition and season
      const conditionMultipliers = { poor: 0.6, fair: 0.8, good: 1.0, excellent: 1.2 };
      const seasonalProtein = { spring: 12, summer: 8, fall: 6, winter: 5 };
      const seasonalEnergy = { spring: 62, summer: 55, fall: 50, winter: 48 };
      
      dmAvailable = 2000 * conditionMultipliers[pastureCondition];
      protein = seasonalProtein[season] * conditionMultipliers[pastureCondition];
      energy = seasonalEnergy[season] * conditionMultipliers[pastureCondition];
    }

    return {
      dmAvailable,
      utilizableDM: dmAvailable * 0.5, // 50% utilization
      quality: {
        protein: Math.max(4, protein),
        energy: Math.max(45, energy),
        calcium: 0.35,
        phosphorus: 0.25
      },
      grazingDays: Math.floor(dmAvailable * 0.5 / 26), // Days for 1 AU
      season
    };
  };

  const calculateDeficits = () => {
    const pasture = getPastureAnalysis();
    
    // If using herd data but categories haven't loaded yet, just return silently
    if (useHerdData && livestockCategories.length === 0) {
      return;
    }
    
    if (!useHerdData && !requirements[selectedLivestock]) {
      return;
    }

    // Mark supplement calculator milestone as completed
    setTimeout(() => {
      try {
        const existingMilestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
        if (!existingMilestones.includes('supplement_calculator_used')) {
          existingMilestones.push('supplement_calculator_used');
          localStorage.setItem('cadence-completed-milestones', JSON.stringify(existingMilestones));
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'cadence-completed-milestones',
            newValue: JSON.stringify(existingMilestones)
          }));
        }
      } catch (error) {
        console.error('Error updating milestones:', error);
      }
    }, 100);

    let totalPastureProvides = { protein: 0, energy: 0, calcium: 0, phosphorus: 0 };
    let totalAnimalRequires = { protein: 0, energy: 0, calcium: 0, phosphorus: 0 };
    let totalAnimals = 0;

    if (useHerdData) {
      // Calculate for all livestock categories
      livestockCategories.forEach(category => {
        if (category.count === 0) return;
        
        const requirementKey = `${category.species}_${category.category}`;
        const requirement = requirements[requirementKey];
        
        if (!requirement) return;

        totalAnimals += category.count;

        // Calculate what pasture provides for this category
        const pastureIntake = Math.min(requirement.dmIntake, pasture.utilizableDM / 30);
        const categoryPastureProvides = {
          protein: (pastureIntake * pasture.quality.protein * category.count) / 100,
          energy: (pastureIntake * pasture.quality.energy * category.count) / 100,
          calcium: (pastureIntake * pasture.quality.calcium * category.count) / 100,
          phosphorus: (pastureIntake * pasture.quality.phosphorus * category.count) / 100
        };

        // Calculate what this category requires
        const categoryAnimalRequires = {
          protein: (requirement.dmIntake * requirement.protein * category.count) / 100,
          energy: (requirement.dmIntake * requirement.energy * category.count) / 100,
          calcium: (requirement.dmIntake * requirement.calcium * category.count) / 100,
          phosphorus: (requirement.dmIntake * requirement.phosphorus * category.count) / 100
        };

        // Add to totals
        totalPastureProvides.protein += categoryPastureProvides.protein;
        totalPastureProvides.energy += categoryPastureProvides.energy;
        totalPastureProvides.calcium += categoryPastureProvides.calcium;
        totalPastureProvides.phosphorus += categoryPastureProvides.phosphorus;

        totalAnimalRequires.protein += categoryAnimalRequires.protein;
        totalAnimalRequires.energy += categoryAnimalRequires.energy;
        totalAnimalRequires.calcium += categoryAnimalRequires.calcium;
        totalAnimalRequires.phosphorus += categoryAnimalRequires.phosphorus;
      });
    } else {
      // Use manual livestock selection (existing logic)
      const requirement = requirements[selectedLivestock];
      totalAnimals = animalCount;

      const pastureIntake = Math.min(requirement.dmIntake, pasture.utilizableDM / 30);
      totalPastureProvides = {
        protein: (pastureIntake * pasture.quality.protein * animalCount) / 100,
        energy: (pastureIntake * pasture.quality.energy * animalCount) / 100,
        calcium: (pastureIntake * pasture.quality.calcium * animalCount) / 100,
        phosphorus: (pastureIntake * pasture.quality.phosphorus * animalCount) / 100
      };

      totalAnimalRequires = {
        protein: (requirement.dmIntake * requirement.protein * animalCount) / 100,
        energy: (requirement.dmIntake * requirement.energy * animalCount) / 100,
        calcium: (requirement.dmIntake * requirement.calcium * animalCount) / 100,
        phosphorus: (requirement.dmIntake * requirement.phosphorus * animalCount) / 100
      };
    }

    // Calculate deficits
    const deficits = {
      protein: Math.max(0, totalAnimalRequires.protein - totalPastureProvides.protein),
      energy: Math.max(0, totalAnimalRequires.energy - totalPastureProvides.energy),
      calcium: Math.max(0, totalAnimalRequires.calcium - totalPastureProvides.calcium),
      phosphorus: Math.max(0, totalAnimalRequires.phosphorus - totalPastureProvides.phosphorus)
    };

    // Use first requirement for supplement recommendations (can be enhanced)
    const firstRequirement = useHerdData && livestockCategories.length > 0 
      ? requirements[`${livestockCategories[0].species}_${livestockCategories[0].category}`]
      : requirements[selectedLivestock];

    const recommendations = generateRecommendations(deficits, firstRequirement);
    const totalMonthlyCost = recommendations.reduce((sum, rec) => sum + rec.costPerMonth, 0);

    setDeficitAnalysis({
      pastureProvides: totalPastureProvides,
      animalRequires: totalAnimalRequires,
      deficits,
      recommendations,
      totalMonthlyCost,
      costPerAU: totalMonthlyCost / animalCount
    });
  };

  const generateRecommendations = (deficits: any, requirement: NutritionalRequirement): SupplementRecommendation[] => {
    const recommendations: SupplementRecommendation[] = [];

    // Priority 1: Address protein deficit
    if (deficits.protein > 0.1) {
      const proteinOptions = supplementOptions.filter(s => s.nutrients.protein > 15);
      const bestProtein = proteinOptions.reduce((best, current) => 
        (current.costPerTon / current.nutrients.protein) < (best.costPerTon / best.nutrients.protein) ? current : best
      );

      const dailyAmount = (deficits.protein / (bestProtein.nutrients.protein / 100)) * 1.1; // 10% buffer
      recommendations.push({
        supplement: bestProtein,
        dailyAmount: Math.min(dailyAmount, requirement.dmIntake * 0.3), // Max 30% of intake
        costPerDay: (dailyAmount * bestProtein.costPerTon) / 2000,
        costPerMonth: ((dailyAmount * bestProtein.costPerTon) / 2000) * 30,
        purpose: "Protein supplementation",
        feedingSchedule: "1-2 times daily",
        transitionDays: 7
      });
    }

    // Priority 2: Address energy deficit
    if (deficits.energy > 2) {
      const energyOptions = supplementOptions.filter(s => s.nutrients.energy > 60);
      const bestEnergy = energyOptions.reduce((best, current) => 
        (current.costPerTon / current.nutrients.energy) < (best.costPerTon / best.nutrients.energy) ? current : best
      );

      const dailyAmount = (deficits.energy / (bestEnergy.nutrients.energy / 100)) * 1.1;
      recommendations.push({
        supplement: bestEnergy,
        dailyAmount: Math.min(dailyAmount, requirement.dmIntake * 0.4),
        costPerDay: (dailyAmount * bestEnergy.costPerTon) / 2000,
        costPerMonth: ((dailyAmount * bestEnergy.costPerTon) / 2000) * 30,
        purpose: "Energy supplementation",
        feedingSchedule: "2-3 times daily",
        transitionDays: 10
      });
    }

    // Priority 3: Mineral supplementation (always recommended)
    if (complexityLevel !== "basic") {
      const mineralSupplement = supplementOptions.find(s => s.type === "protein" && s.nutrients.calcium > 2);
      if (mineralSupplement) {
        recommendations.push({
          supplement: mineralSupplement,
          dailyAmount: 0.25, // 1/4 lb per day typical
          costPerDay: (0.25 * mineralSupplement.costPerTon) / 2000,
          costPerMonth: ((0.25 * mineralSupplement.costPerTon) / 2000) * 30,
          purpose: "Mineral supplementation",
          feedingSchedule: "Free choice",
          transitionDays: 0
        });
      }
    }

    return recommendations;
  };

  useEffect(() => {
    calculateDeficits();
  }, [selectedLivestock, animalCount, pastureCondition, season, complexityLevel]);

  const renderDeficitAnalysis = () => {
    if (!deficitAnalysis) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nutritional Analysis</CardTitle>
            <CardDescription>Pasture supply vs. animal requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-3">
                <h4 className="font-medium text-green-600">Pasture Provides</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span>{deficitAnalysis.pastureProvides.protein.toFixed(1)} lbs/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energy:</span>
                    <span>{deficitAnalysis.pastureProvides.energy.toFixed(1)} lbs TDN/day</span>
                  </div>
                  {complexityLevel !== "basic" && (
                    <>
                      <div className="flex justify-between">
                        <span>Calcium:</span>
                        <span>{(deficitAnalysis.pastureProvides.calcium * 1000).toFixed(0)} g/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phosphorus:</span>
                        <span>{(deficitAnalysis.pastureProvides.phosphorus * 1000).toFixed(0)} g/day</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-blue-600">Animal Requires</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span>{deficitAnalysis.animalRequires.protein.toFixed(1)} lbs/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energy:</span>
                    <span>{deficitAnalysis.animalRequires.energy.toFixed(1)} lbs TDN/day</span>
                  </div>
                  {complexityLevel !== "basic" && (
                    <>
                      <div className="flex justify-between">
                        <span>Calcium:</span>
                        <span>{(deficitAnalysis.animalRequires.calcium * 1000).toFixed(0)} g/day</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phosphorus:</span>
                        <span>{(deficitAnalysis.animalRequires.phosphorus * 1000).toFixed(0)} g/day</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-red-600">Deficit</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span className={deficitAnalysis.deficits.protein > 0.1 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {deficitAnalysis.deficits.protein.toFixed(1)} lbs/day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energy:</span>
                    <span className={deficitAnalysis.deficits.energy > 2 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {deficitAnalysis.deficits.energy.toFixed(1)} lbs TDN/day
                    </span>
                  </div>
                  {complexityLevel !== "basic" && (
                    <>
                      <div className="flex justify-between">
                        <span>Calcium:</span>
                        <span className={deficitAnalysis.deficits.calcium > 0.01 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {(deficitAnalysis.deficits.calcium * 1000).toFixed(0)} g/day
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phosphorus:</span>
                        <span className={deficitAnalysis.deficits.phosphorus > 0.01 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {(deficitAnalysis.deficits.phosphorus * 1000).toFixed(0)} g/day
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {deficitAnalysis.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Supplement Recommendations</CardTitle>
              <CardDescription>Targeted supplementation to address nutritional gaps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deficitAnalysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{rec.supplement.name}</span>
                        <Badge variant="outline" className="capitalize">{rec.supplement.type}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">${rec.costPerMonth.toFixed(0)}/month</div>
                        <div className="text-xs text-gray-500">${rec.costPerDay.toFixed(2)}/day</div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div>
                        <span className="font-medium">Amount:</span> {rec.dailyAmount.toFixed(1)} lbs/day per AU
                      </div>
                      <div>
                        <span className="font-medium">Purpose:</span> {rec.purpose}
                      </div>
                      <div>
                        <span className="font-medium">Schedule:</span> {rec.feedingSchedule}
                      </div>
                      <div>
                        <span className="font-medium">Transition:</span> {rec.transitionDays} days
                      </div>
                    </div>

                    {rec.supplement.feedingNotes.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-sm">Notes:</span>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-4 list-disc">
                          {rec.supplement.feedingNotes.map((note, noteIndex) => (
                            <li key={noteIndex}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Total Monthly Cost</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      For {useHerdData ? getTotalAnimalsInCategories() : animalCount} animals ({deficitAnalysis.costPerAU.toFixed(2)} per AU)
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${deficitAnalysis.totalMonthlyCost.toFixed(0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderSupplementDatabase = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Supplements</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {supplementOptions.map(supplement => (
            <Card key={supplement.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{supplement.name}</CardTitle>
                  <Badge variant="outline" className="capitalize">{supplement.type}</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ${supplement.costPerTon}/ton
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>Protein: {supplement.nutrients.protein}%</div>
                  <div>Energy: {supplement.nutrients.energy}% TDN</div>
                  {complexityLevel !== "basic" && (
                    <>
                      <div>Calcium: {supplement.nutrients.calcium}%</div>
                      <div>Phosphorus: {supplement.nutrients.phosphorus}%</div>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  <div>Availability: <span className="capitalize">{supplement.availability}</span></div>
                  {supplement.feedingNotes.length > 0 && (
                    <div className="mt-1">{supplement.feedingNotes[0]}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Nutrition Management Tool
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Analyze nutritional needs, manage feeding strategies, and optimize livestock nutrition with intelligent cost planning
            </p>
          </div>
          {tierLevel === "full" && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                {user?.subscriptionTier?.replace('_', ' ').toUpperCase()} Plan
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Basic Tier - Simplified Nutrition Check */}
      {tierLevel === "basic" ? (
        <div className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="h-5 w-5 mr-2 text-blue-600" />
                Basic Nutrition Check
              </CardTitle>
              <CardDescription>
                Quick nutrition assessment for your livestock - upgrade for advanced analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">✅ Available Now</h4>
                <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Basic pasture condition assessment</li>
                  <li>• Simple feeding recommendations</li>
                  <li>• Seasonal feeding tips</li>
                  <li>• Basic supplement suggestions</li>
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Your Pasture Condition</Label>
                  <Select value={pastureCondition} onValueChange={(value: any) => setPastureCondition(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor (brown, sparse)</SelectItem>
                      <SelectItem value="fair">Fair (mixed green/brown)</SelectItem>
                      <SelectItem value="good">Good (mostly green)</SelectItem>
                      <SelectItem value="excellent">Excellent (lush green)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Current Season</Label>
                  <Select value={season} onValueChange={(value: any) => setSeason(value)}>
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
              </div>
              
              <Button 
                onClick={() => {
                  console.log('Button clicked!');
                  setButtonClicked(true);
                  
                  // Mark workflow task as complete
                  const milestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
                  console.log('Current milestones before:', milestones);
                  
                  if (!milestones.includes('supplement_calculator_used')) {
                    milestones.push('supplement_calculator_used');
                    localStorage.setItem('cadence-completed-milestones', JSON.stringify(milestones));
                    console.log('Added supplement_calculator_used milestone');
                    console.log('New milestones:', JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]'));
                    
                    // Force immediate widget refresh
                    setTimeout(() => {
                      window.dispatchEvent(new StorageEvent('storage', { 
                        key: 'cadence-completed-milestones',
                        newValue: JSON.stringify(milestones)
                      }));
                      console.log('Storage event dispatched');
                    }, 50);
                  } else {
                    console.log('Milestone already exists!');
                  }
                }} 
                className="w-full"
                disabled={buttonClicked}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {buttonClicked ? 'Task Completed!' : 'Get Basic Nutrition Recommendations'}
              </Button>
              
              {buttonClicked && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    ✅ Nutrition check completed! Your workflow task has been marked as done.
                  </p>
                </div>
              )}
              
              {pastureCondition && season && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">
                    Recommendations for {pastureCondition} pasture in {season}
                  </h4>
                  <div className="text-sm space-y-1 text-green-700 dark:text-green-300">
                    {pastureCondition === "poor" && (
                      <>
                        <p>• Increase hay supplementation significantly</p>
                        <p>• Consider protein blocks or cubes</p>
                        <p>• Move livestock off poor areas to allow recovery</p>
                      </>
                    )}
                    {pastureCondition === "fair" && (
                      <>
                        <p>• Light hay supplementation may be needed</p>
                        <p>• Monitor livestock body condition closely</p>
                        <p>• Consider mineral supplements</p>
                      </>
                    )}
                    {pastureCondition === "good" && (
                      <>
                        <p>• Pasture may meet most nutritional needs</p>
                        <p>• Mineral supplementation recommended</p>
                        <p>• Monitor for seasonal changes</p>
                      </>
                    )}
                    {pastureCondition === "excellent" && (
                      <>
                        <p>• Pasture likely meets nutritional needs</p>
                        <p>• Basic mineral supplementation sufficient</p>
                        <p>• Great condition for rotational grazing</p>
                      </>
                    )}
                    {season === "winter" && <p>• Extra energy/protein needed for cold weather</p>}
                    {season === "summer" && <p>• Ensure adequate water and shade</p>}
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                <h4 className="font-medium mb-2 text-amber-800 dark:text-amber-200">🔒 Upgrade for Advanced Features</h4>
                <ul className="text-sm space-y-1 text-amber-700 dark:text-amber-300">
                  <li>• Precise nutritional deficit calculations</li>
                  <li>• Cost optimization and ROI analysis</li>
                  <li>• Integration with pasture assessments</li>
                  <li>• Multi-species nutrition planning</li>
                  <li>• Custom supplement formulations</li>
                </ul>
                <Button onClick={() => window.location.href = '/settings'} className="w-full mt-3" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade to Professional
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tier Features Display */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
            <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">
              ✅ {user?.subscriptionTier?.replace('_', ' ').toUpperCase()} Features Available
            </h4>
            <ul className="text-sm space-y-1 text-green-700 dark:text-green-300">
              <li>• Auto-detection from pasture assessments</li>
              <li>• Multi-species nutritional analysis</li>
              <li>• Feed supplement recommendations</li>
              <li>• Cost analysis and planning</li>
              {complexityLevel === "advanced" && (
                <>
                  <li>• Advanced micronutrient tracking</li>
                  <li>• Custom supplement formulations</li>
                  <li>• Detailed economic modeling</li>
                </>
              )}
            </ul>
          </div>

      <Tabs defaultValue="calculate" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculate">Calculate</TabsTrigger>
          <TabsTrigger value="supplements">Supplements</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="calculate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Livestock & Conditions</CardTitle>
              <CardDescription>Define your animals and current pasture conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {herds.length > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">✓ Auto-populated from your herds:</span>
                  <Button
                    variant={useHerdData ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseHerdData(!useHerdData)}
                  >
                    {useHerdData ? "Using Herds" : "Manual Entry"}
                  </Button>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {herds.reduce((total, herd) => {
                      if (herd.composition) {
                        return total + herd.composition.reduce((sum, comp) => sum + comp.count, 0);
                      }
                      return total + (herd.count || 0);
                    }, 0)} livestock detected
                  </span>
                </div>
              )}

              {useHerdData && herds.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-4">
                    <h4 className="font-medium">Specify Livestock Categories</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Break down your livestock by age, sex, and lactation status for more accurate nutritional calculations.
                    </p>
                    
                    {/* Group by species */}
                    {Object.entries(
                      herds.reduce((acc, herd) => {
                        herd.composition.forEach(comp => {
                          const species = comp.species.toLowerCase();
                          if (!acc[species]) acc[species] = 0;
                          acc[species] += comp.count;
                        });
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([species, total]) => (
                      <div key={species} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="font-medium capitalize">{species}</h5>
                          <div className="text-sm text-gray-500">
                            Total Available: {total} | 
                            Used: {getTotalUsedForSpecies(species)} | 
                            Remaining: {total - getTotalUsedForSpecies(species)}
                          </div>
                        </div>
                        
                        <div className="grid gap-3 md:grid-cols-3">
                          {/* Non-lactating adult category */}
                          {(() => {
                            const nonLactatingCat = livestockCategories.find(cat => 
                              cat.species === species && cat.category === 'non_lactating_adult'
                            );
                            return nonLactatingCat ? (
                              <div>
                                <Label className="text-xs">Non-lactating adult {species}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={total}
                                  value={nonLactatingCat.count}
                                  onChange={(e) => updateCategoryCount(species, 'non_lactating_adult', parseInt(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                            ) : null;
                          })()}

                          {/* Lactating category for applicable species */}
                          {['cattle', 'sheep', 'goats'].includes(species) && (() => {
                            const lactatingCat = livestockCategories.find(cat => 
                              cat.species === species && cat.category === 'lactating'
                            );
                            return lactatingCat ? (
                              <div>
                                <Label className="text-xs">Lactating {species}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={total}
                                  value={lactatingCat.count}
                                  onChange={(e) => updateCategoryCount(species, 'lactating', parseInt(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                            ) : null;
                          })()}

                          {/* Growing category */}
                          {(() => {
                            const growingCat = livestockCategories.find(cat => 
                              cat.species === species && cat.category === 'growing'
                            );
                            return growingCat ? (
                              <div>
                                <Label className="text-xs">Young {species}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max={total}
                                  value={growingCat.count}
                                  onChange={(e) => updateCategoryCount(species, 'growing', parseInt(e.target.value) || 0)}
                                  className="mt-1"
                                />
                              </div>
                            ) : null;
                          })()}
                        </div>

                        {getTotalUsedForSpecies(species) > total && (
                          <Alert>
                            <AlertDescription className="text-red-600">
                              Total specified ({getTotalUsedForSpecies(species)}) exceeds available {species} ({total})
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}

                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-sm font-medium">
                        Total Animals in Categories: {getTotalAnimalsInCategories()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Livestock Type</Label>
                    <Select value={selectedLivestock} onValueChange={setSelectedLivestock}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cattle_adult">Adult Cattle (Dry Cows)</SelectItem>
                        <SelectItem value="cattle_lactating">Lactating Cattle</SelectItem>
                        <SelectItem value="cattle_growing">Growing Cattle</SelectItem>
                        <SelectItem value="sheep_adult">Adult Sheep (Dry Ewes)</SelectItem>
                        <SelectItem value="sheep_lactating">Lactating Sheep</SelectItem>
                        <SelectItem value="goats_adult">Adult Goats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Number of Animals</Label>
                    <Input
                      type="number"
                      value={animalCount}
                      onChange={(e) => setAnimalCount(parseInt(e.target.value) || 1)}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              {autoDetectedData.dataSource && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                      Auto-detected from your farm data
                    </span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    {autoDetectedData.dataSource}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Pasture Condition</Label>
                  <Select value={pastureCondition} onValueChange={(value: any) => setPastureCondition(value)}>
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
                  {autoDetectedData.pastureCondition && (
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-detected: {autoDetectedData.pastureCondition}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Season</Label>
                  <Select value={season} onValueChange={(value: any) => setSeason(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="winter">Winter</SelectItem>
                    </SelectContent>
                  </Select>
                  {autoDetectedData.season && (
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-detected: {autoDetectedData.season}
                    </p>
                  )}
                </div>
              </div>

              {dmData && dmData.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Using DM availability data from recent pasture assessment. 
                    Quality: {dmData[0].quality?.protein}% protein, {dmData[0].quality?.energy}% TDN
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={calculateDeficits} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Supplement Needs
              </Button>
            </CardContent>
          </Card>

          {renderDeficitAnalysis()}
        </TabsContent>

        <TabsContent value="supplements" className="space-y-6">
          {renderSupplementDatabase()}
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          {deficitAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Comparison Analysis</CardTitle>
                <CardDescription>Monthly feeding costs and alternatives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Current Plan</h4>
                      <div className="text-2xl font-bold text-green-600">
                        ${deficitAnalysis.totalMonthlyCost.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${deficitAnalysis.costPerAU.toFixed(2)} per AU
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Annual Cost</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        ${(deficitAnalysis.totalMonthlyCost * 12).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Full year projection
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Per Animal</h4>
                      <div className="text-2xl font-bold text-orange-600">
                        ${(deficitAnalysis.totalMonthlyCost / (useHerdData ? getTotalAnimalsInCategories() : animalCount)).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Monthly per head
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Cost Breakdown</h4>
                    {deficitAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <span>{rec.supplement.name}</span>
                        <div className="text-right">
                          <div className="font-medium">${rec.costPerMonth.toFixed(0)}/month</div>
                          <div className="text-sm text-gray-500">
                            {rec.dailyAmount.toFixed(1)} lbs/day × ${(rec.supplement.costPerTon / 2000).toFixed(3)}/lb
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration with Farm Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Scale className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">AU Calculator</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Base calculations on standardized animal units for accurate feed planning
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wheat className="h-4 w-4 text-green-600" />
                    <span className="font-medium">DM Availability</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use real pasture assessment data for precise deficit calculations
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Grazing Calendar</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plan supplementation timing with rotation schedules
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Performance Analytics</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track supplementation effectiveness and animal performance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Planning Strategy</CardTitle>
              <CardDescription>Adapt supplementation throughout the year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Spring & Summer</h4>
                  <ul className="text-sm space-y-1 list-disc ml-4">
                    <li>Minimal supplementation typically needed</li>
                    <li>Focus on mineral supplements</li>
                    <li>Monitor rapid pasture changes</li>
                    <li>Prepare for summer heat stress</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Fall & Winter</h4>
                  <ul className="text-sm space-y-1 list-disc ml-4">
                    <li>Increase protein supplementation</li>
                    <li>Add energy sources as needed</li>
                    <li>Plan hay and stored feed usage</li>
                    <li>Adjust for breeding and lactation</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h4 className="font-medium mb-2">Cost Management Tips</h4>
                <ul className="text-sm space-y-1 list-disc ml-4">
                  <li>Buy supplements in bulk during off-season for better prices</li>
                  <li>Consider group purchasing with neighboring farms</li>
                  <li>Compare protein cost per pound across different supplements</li>
                  <li>Factor in convenience and labor costs, not just feed prices</li>
                  <li>Monitor performance to ensure supplements are cost-effective</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Smart Workflow Handoffs */}
      <SmartWorkflowHandoffs 
        currentTool="feed-calculator"
        completedActions={deficitAnalysis ? ['deficit_calculated'] : []}
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

      {/* Upgrade Value Proposition - Tier-Appropriate */}
      {user?.subscriptionTier === 'basic' && deficitAnalysis && (
        <UpgradeValueProposition 
          currentTier="basic"
          lockedFeature="cost optimization and bulk purchasing recommendations"
          context="analysis"
        />
      )}
        </div>
      )}
    </div>
  );
}