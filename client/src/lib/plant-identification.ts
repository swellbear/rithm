// Plant identification utilities and mock data for development

export interface PlantSpecies {
  id: string;
  name: string;
  scientificName: string;
  type: "grass" | "legume" | "forb" | "shrub" | "invasive";
  nutritionalValue: "high" | "medium" | "low";
  proteinContent?: number;
  yield: number; // lbs per acre
  description: string;
  identificationTips: string[];
  isInvasive: boolean;
  seasonalVariation?: Record<string, number>;
}

export interface IdentificationResult {
  species: PlantSpecies;
  confidence: number;
  percentage: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalysisResult {
  confidence: number;
  species: Array<{
    name: string;
    percentage: number;
    type: string;
    nutritionalValue?: string;
    warning?: string;
  }>;
  recommendations: string[];
  groundCover: number;
  bareGround: number;
  timestamp: string;
}

// Mock plant database for development
const PLANT_DATABASE: PlantSpecies[] = [
  {
    id: "big-bluestem",
    name: "Big Bluestem",
    scientificName: "Andropogon gerardii",
    type: "grass",
    nutritionalValue: "high",
    proteinContent: 8.5,
    yield: 175,
    description: "A tall, warm-season prairie grass with distinctive blue-purple stems.",
    identificationTips: [
      "Tall stems with blue-purple coloration",
      "Three-part seed head resembling a turkey foot",
      "Leaves 1/4 to 1/2 inch wide"
    ],
    isInvasive: false,
    seasonalVariation: {
      spring: 0.6,
      summer: 1.0,
      fall: 0.8,
      winter: 0.2
    }
  },
  {
    id: "white-clover",
    name: "White Clover",
    scientificName: "Trifolium repens",
    type: "legume",
    nutritionalValue: "high",
    proteinContent: 15.2,
    yield: 225,
    description: "A low-growing legume that fixes nitrogen and provides high-protein forage.",
    identificationTips: [
      "Three-leaflet compound leaves",
      "White flower heads",
      "Creeping stems that root at nodes"
    ],
    isInvasive: false,
    seasonalVariation: {
      spring: 1.0,
      summer: 0.7,
      fall: 0.9,
      winter: 0.3
    }
  },
  {
    id: "tall-fescue",
    name: "Tall Fescue",
    scientificName: "Festuca arundinacea",
    type: "grass",
    nutritionalValue: "medium",
    proteinContent: 7.2,
    yield: 225,
    description: "A cool-season grass that may contain endophyte fungi.",
    identificationTips: [
      "Broad, flat leaf blades",
      "Distinctive ridged stems",
      "Dense, upright growth habit"
    ],
    isInvasive: false,
    seasonalVariation: {
      spring: 1.0,
      summer: 0.5,
      fall: 0.8,
      winter: 0.4
    }
  }
];

// Mock plant identification function
export async function identifyPlantsFromImage(
  imageData: string,
  gpsLocation?: { latitude: number; longitude: number }
): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock identification results
  const mockResults: AnalysisResult = {
    confidence: 87,
    species: [
      {
        name: "Big Bluestem",
        percentage: 45,
        type: "grass",
        nutritionalValue: "high"
      },
      {
        name: "White Clover",
        percentage: 25,
        type: "legume",
        nutritionalValue: "high"
      },
      {
        name: "Tall Fescue",
        percentage: 20,
        type: "grass",
        nutritionalValue: "medium",
        warning: "Contains endophyte - monitor livestock closely"
      },
      {
        name: "Bare Soil",
        percentage: 10,
        type: "soil"
      }
    ],
    recommendations: [
      "Excellent species diversity with good legume content",
      "Monitor fescue endophyte levels during hot weather",
      "Optimal grazing window: 3-4 days based on species mix"
    ],
    groundCover: 90,
    bareGround: 10,
    timestamp: new Date().toISOString()
  };
  
  return mockResults;
}

export function getPlantSpeciesById(id: string): PlantSpecies | undefined {
  return PLANT_DATABASE.find(plant => plant.id === id);
}

export function searchPlantSpecies(query: string): PlantSpecies[] {
  const lowerQuery = query.toLowerCase();
  return PLANT_DATABASE.filter(plant =>
    plant.name.toLowerCase().includes(lowerQuery) ||
    plant.scientificName.toLowerCase().includes(lowerQuery)
  );
}

export function getPlantsByType(type: PlantSpecies["type"]): PlantSpecies[] {
  return PLANT_DATABASE.filter(plant => plant.type === type);
}

export function validateSpeciesComposition(species: Array<{ name: string; percentage: number }>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const totalPercentage = species.reduce((sum, s) => sum + s.percentage, 0);
  
  if (Math.abs(totalPercentage - 100) > 5) {
    errors.push(`Total percentage is ${totalPercentage.toFixed(1)}%, should be close to 100%`);
  }
  
  const invasiveSpecies = species.filter(s => {
    const plant = PLANT_DATABASE.find(p => p.name.toLowerCase() === s.name.toLowerCase());
    return plant?.isInvasive;
  });
  
  if (invasiveSpecies.length > 0) {
    warnings.push(`Invasive species detected: ${invasiveSpecies.map(s => s.name).join(", ")}`);
  }
  
  const legumePercentage = species
    .filter(s => {
      const plant = PLANT_DATABASE.find(p => p.name.toLowerCase() === s.name.toLowerCase());
      return plant?.type === "legume";
    })
    .reduce((sum, s) => sum + s.percentage, 0);
  
  if (legumePercentage < 10) {
    warnings.push("Low legume content may indicate need for nitrogen supplementation");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
