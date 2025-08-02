// Data Integration Hook - Seamless data flow between tools
// Automatically populates livestock data across all farm management tools

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface HerdComposition {
  species: string;
  count: number;
  breed?: string;
}

interface Herd {
  id: number;
  name: string;
  species?: string;
  count?: number;
  composition?: HerdComposition[];
  averageWeight?: number;
  breed?: string;
  lactating?: boolean;
  lactatingCount?: number;
  age?: string;
  sex?: string;
}

interface LivestockSummary {
  totalAnimals: number;
  speciesBreakdown: Record<string, number>;
  herds: Herd[];
  availableSpecies: string[];
  primarySpecies: string | null;
  mixedHerdConsistency: boolean;
  dataIntegrationStatus: 'idle' | 'syncing' | 'success' | 'error';
}

interface AutoPopulatedData {
  livestockCategories: Array<{
    species: string;
    category: string;
    count: number;
    herdName: string;
    herdId: number;
  }>;
  auCalculationGroups: Array<{
    name: string;
    species: string;
    breed: string;
    count: number;
    averageWeight: number;
    ageCategory: string;
    sex: string;
    lactating: boolean;
    lactatingCount: number;
  }>;
  weightTrackingDefaults: Array<{
    herdId: number;
    herdName: string;
    species: string;
    composition: HerdComposition[];
    averageWeight: number;
    count: number;
  }>;
}

export function useDataIntegration() {
  // Fetch all relevant farm data
  const { data: herds = [], isLoading: herdsLoading } = useQuery<Herd[]>({ 
    queryKey: ["/api/herds"] 
  });
  
  const { data: paddocks = [], isLoading: paddocksLoading } = useQuery<any[]>({ 
    queryKey: ["/api/paddocks"] 
  });
  
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery<any[]>({ 
    queryKey: ["/api/assessments"] 
  });

  // Calculate livestock summary
  const livestockSummary: LivestockSummary = useMemo(() => {
    const speciesBreakdown: Record<string, number> = {};
    let totalAnimals = 0;
    const availableSpecies: string[] = [];

    herds.forEach(herd => {
      if (herd.composition && Array.isArray(herd.composition)) {
        // Mixed herd format
        herd.composition.forEach(comp => {
          const species = comp.species.toLowerCase();
          const count = comp.count || 0;
          speciesBreakdown[species] = (speciesBreakdown[species] || 0) + count;
          totalAnimals += count;
          if (!availableSpecies.includes(species)) availableSpecies.push(species);
        });
      } else if (herd.species) {
        // Single species format
        const species = herd.species.toLowerCase();
        const count = herd.count || 0;
        speciesBreakdown[species] = (speciesBreakdown[species] || 0) + count;
        totalAnimals += count;
        if (!availableSpecies.includes(species)) availableSpecies.push(species);
      }
    });

    // Determine primary species (most common)
    const primarySpecies = Object.keys(speciesBreakdown).length > 0 
      ? Object.entries(speciesBreakdown).sort(([,a], [,b]) => b - a)[0][0]
      : null;

    return {
      totalAnimals,
      speciesBreakdown,
      herds,
      availableSpecies,
      primarySpecies
    };
  }, [herds]);

  // Generate auto-populated data for different tools
  const autoPopulatedData: AutoPopulatedData = useMemo(() => {
    const livestockCategories: any[] = [];
    const auCalculationGroups: any[] = [];
    const weightTrackingDefaults: any[] = [];

    herds.forEach(herd => {
      if (herd.composition && Array.isArray(herd.composition)) {
        // Mixed herd processing
        const mixedComposition: HerdComposition[] = [];
        
        herd.composition.forEach(comp => {
          const species = comp.species.toLowerCase();
          const count = comp.count || 0;
          
          // Add to composition for weight tracking
          mixedComposition.push({
            species: comp.species,
            count: comp.count,
            breed: comp.breed
          });

          // Generate livestock categories for nutrition calculator
          livestockCategories.push({
            species,
            category: 'non_lactating_adult',
            count: Math.floor(count * 0.7),
            herdName: herd.name,
            herdId: herd.id
          });

          if (['cattle', 'sheep', 'goats'].includes(species)) {
            livestockCategories.push({
              species,
              category: 'lactating',
              count: Math.floor(count * 0.2),
              herdName: herd.name,
              herdId: herd.id
            });
          }

          livestockCategories.push({
            species,
            category: 'growing',
            count: Math.floor(count * 0.1),
            herdName: herd.name,
            herdId: herd.id
          });

          // Generate AU calculation groups
          auCalculationGroups.push({
            name: `${herd.name} - ${comp.species}`,
            species: comp.species.toLowerCase(),
            breed: comp.breed || "Mixed",
            count: comp.count,
            averageWeight: getSpeciesDefaultWeight(comp.species),
            ageCategory: "adult",
            sex: "mixed",
            lactating: false,
            lactatingCount: 0
          });
        });

        // Add weight tracking defaults for mixed herd
        weightTrackingDefaults.push({
          herdId: herd.id,
          herdName: herd.name,
          species: 'mixed',
          composition: mixedComposition,
          averageWeight: 0, // Will be calculated per species
          count: mixedComposition.reduce((sum, comp) => sum + comp.count, 0)
        });

      } else if (herd.species) {
        // Single species processing
        const species = herd.species.toLowerCase();
        const count = herd.count || 0;

        // Generate livestock categories
        livestockCategories.push({
          species,
          category: 'non_lactating_adult',
          count: Math.floor(count * 0.7),
          herdName: herd.name,
          herdId: herd.id
        });

        if (['cattle', 'sheep', 'goats'].includes(species)) {
          livestockCategories.push({
            species,
            category: 'lactating',
            count: herd.lactatingCount || Math.floor(count * 0.2),
            herdName: herd.name,
            herdId: herd.id
          });
        }

        livestockCategories.push({
          species,
          category: 'growing',
          count: Math.floor(count * 0.1),
          herdName: herd.name,
          herdId: herd.id
        });

        // Generate AU calculation group
        auCalculationGroups.push({
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

        // Add weight tracking defaults
        weightTrackingDefaults.push({
          herdId: herd.id,
          herdName: herd.name,
          species: herd.species.toLowerCase(),
          composition: [{
            species: herd.species,
            count: herd.count || 0,
            breed: herd.breed
          }],
          averageWeight: herd.averageWeight || getSpeciesDefaultWeight(herd.species),
          count: herd.count || 0
        });
      }
    });

    return {
      livestockCategories,
      auCalculationGroups,
      weightTrackingDefaults
    };
  }, [herds]);

  // Helper function for default weights
  function getSpeciesDefaultWeight(species: string): number {
    const weights: Record<string, number> = {
      'cattle': 1200,
      'sheep': 140,
      'goats': 120,
      'horses': 1100,
      'pigs': 250
    };
    return weights[species.toLowerCase()] || 500;
  }

  // Check if user has sufficient data for different tool features
  const dataAvailability = useMemo(() => ({
    hasLivestock: herds.length > 0,
    hasPaddocks: paddocks.length > 0,
    hasAssessments: assessments.length > 0,
    hasMultipleSpecies: livestockSummary.availableSpecies.length > 1,
    hasEnoughDataForRotation: herds.length > 0 && paddocks.length >= 2,
    hasEnoughDataForNutrition: herds.length > 0,
    hasEnoughDataForAU: herds.length > 0
  }), [herds.length, paddocks.length, assessments.length, livestockSummary.availableSpecies.length]);

  return {
    livestockSummary,
    autoPopulatedData,
    dataAvailability,
    isLoading: herdsLoading || paddocksLoading || assessmentsLoading,
    herds,
    paddocks,
    assessments
  };
}