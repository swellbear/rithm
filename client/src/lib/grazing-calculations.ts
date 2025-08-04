// Port of Python grazing calculations to TypeScript

export interface ClimateData {
  region: string;
  growthRates: Record<string, number>;
  parasiteRest: number;
  normalRainfall: number;
}

export interface HerdData {
  species: string;
  count: number;
  averageWeight: number;
  dmPercent: number;
  lactating: boolean;
  breed?: string;
  ageMonths?: number;
  breedingStatus?: string;
}

export interface AnimalUnitData {
  totalAnimalUnits: number;
  averageAnimalUnits: number;
  projectedGrowthMonthly: number;
  adjustmentFactors: {
    age: number;
    breed: number;
    physiological: number;
  };
}

export interface PastureData {
  type: string;
  grassHeight: number;
  groundCover: number;
  species: Array<{
    name: string;
    percentage: number;
    yieldValue?: number;
  }>;
}

export interface GrazingCalculation {
  recommendedDays: number;
  reasoning: string;
  metrics: {
    totalDmRequired: number;
    availableDm: number;
    utilizationRate: number;
    restPeriod: number;
  };
}

// Animal Unit Reference Data (1 AU = 1,000 lb mature cow)
const SPECIES_BASE_AU: Record<string, number> = {
  'cattle': 1.0,
  'beef cattle': 1.0,
  'dairy cattle': 1.25,
  'horses': 1.25,
  'sheep': 0.2,
  'goats': 0.2,
  'bison': 1.25,
  'llamas': 0.25,
  'alpacas': 0.2
};

// Breed size multipliers for cattle
const BREED_MULTIPLIERS: Record<string, number> = {
  // Large breeds
  'charolais': 1.3,
  'chianina': 1.35,
  'simmental': 1.25,
  'maine-anjou': 1.2,
  'limousin': 1.15,
  
  // Medium-large breeds
  'angus': 1.0,
  'hereford': 1.0,
  'shorthorn': 1.0,
  'brahman': 1.1,
  'santa gertrudis': 1.05,
  
  // Medium breeds
  'devon': 0.9,
  'red poll': 0.85,
  'murray grey': 0.9,
  
  // Smaller breeds
  'dexter': 0.4,
  'highland': 0.6,
  'jersey': 0.6,
  'belted galloway': 0.7,
  
  // Default for unknown breeds
  'other': 1.0
};

// Age-based growth curves (months to maturity multiplier)
const AGE_MULTIPLIERS: Record<string, (age: number) => number> = {
  'cattle': (age: number) => {
    if (age <= 6) return 0.15 + (age * 0.1); // Calves
    if (age <= 12) return 0.75 + ((age - 6) * 0.04); // Growing
    if (age <= 24) return 0.99 + ((age - 12) * 0.001); // Young adult
    return 1.0; // Mature
  },
  'sheep': (age: number) => {
    if (age <= 4) return 0.25 + (age * 0.1); // Lambs
    if (age <= 12) return 0.65 + ((age - 4) * 0.04); // Growing
    return 1.0; // Mature
  },
  'horses': (age: number) => {
    if (age <= 6) return 0.3 + (age * 0.08); // Foals/yearlings
    if (age <= 24) return 0.78 + ((age - 6) * 0.012); // Growing
    return 1.0; // Mature
  },
  'goats': (age: number) => {
    if (age <= 4) return 0.3 + (age * 0.12); // Kids
    if (age <= 12) return 0.78 + ((age - 4) * 0.025); // Growing
    return 1.0; // Mature
  }
};

// Physiological state multipliers
const PHYSIOLOGICAL_MULTIPLIERS: Record<string, number> = {
  'lactating': 1.2,
  'pregnant': 1.1,
  'pregnant_lactating': 1.3,
  'growing': 1.1,
  'mature': 1.0,
  'breeding_male': 1.15
};

// Monthly growth rates by species (AU increase per month for growing animals)
const MONTHLY_GROWTH_RATES: Record<string, number> = {
  'cattle': 0.025, // 2.5% AU increase per month for growing cattle
  'sheep': 0.035,  // 3.5% AU increase per month for growing sheep
  'horses': 0.015, // 1.5% AU increase per month for growing horses
  'goats': 0.04    // 4% AU increase per month for growing goats
};

// Constants from Python code
const PASTURE_YIELDS = { native: 200, mixed: 250, lush: 300 };
const PASTURE_ADJUSTMENTS = { native: 0.9, mixed: 1.0, lush: 1.1 };
const GRASS_YIELDS: Record<string, number> = {
  "big bluestem": 175,
  "little bluestem": 125,
  "switchgrass": 175,
  "wild rye": 150,
  "clover": 225,
  "alfalfa": 275,
  "vetch": 200,
  "fescue": 225,
  "ryegrass": 275,
  "brome": 225,
  "bermudagrass": 300,
  "thistles": 100,
  "cheatgrass": 100,
  "ragweed": 100,
  "generic": 150
};

const GROWTH_RATES = {
  temperate: { spring: 0.25, "late spring": 0.27, summer: 0.15, fall: 0.075, winter: 0.01 },
  arid: { spring: 0.125, "late spring": 0.135, summer: 0.075, fall: 0.0375, winter: 0.005 },
  humid: { spring: 0.3, "late spring": 0.32, summer: 0.18, fall: 0.09, winter: 0.012 },
  "southern_plains": { spring: 0.28, "late spring": 0.35, summer: 0.12, fall: 0.08, winter: 0.015 },
  "southeastern_oklahoma": { spring: 0.32, "late spring": 0.38, summer: 0.14, fall: 0.095, winter: 0.02 }
};

const PARASITE_REST = { 
  temperate: 28, 
  humid: 21, 
  arid: 35,
  "southern_plains": 30,
  "southeastern_oklahoma": 32  // Higher parasite pressure in warm, humid SE Oklahoma
};

export function estimateWeight(species: string, age: number, sex: string): number {
  const maleMultiplier = ["cow", "sheep", "goat"].includes(species) ? 1.2 : 1.1;
  const femaleMultiplier = species === "cow" ? 0.9 : ["sheep", "goat"].includes(species) ? 0.95 : 1.0;
  
  let baseWeight = 100; // Default
  
  if (species === "cow") {
    baseWeight = age >= 4 ? 1000 : (age >= 2 ? 700 + (age - 2) * 150 : 400 + age * 150);
  } else if (species === "sheep") {
    baseWeight = age >= 3 ? 175 : (age >= 1 ? 100 + (age - 1) * 37.5 : 60 + age * 40);
  } else if (species === "goat") {
    baseWeight = age >= 3 ? 150 : (age >= 1 ? 80 + (age - 1) * 35 : 40 + age * 40);
  }
  
  const sexMultiplier = sex === "male" ? maleMultiplier : sex === "female" ? femaleMultiplier : (maleMultiplier + femaleMultiplier) / 2;
  
  return baseWeight * sexMultiplier;
}

// Calculate comprehensive animal units with age, breed, and growth considerations
export function calculateAnimalUnits(herd: HerdData): AnimalUnitData {
  const species = herd.species.toLowerCase();
  const baseAU = SPECIES_BASE_AU[species] || SPECIES_BASE_AU['cattle'];
  
  // Age adjustment
  const ageMultiplier = herd.ageMonths 
    ? (AGE_MULTIPLIERS[species] || AGE_MULTIPLIERS['cattle'])(herd.ageMonths)
    : 1.0;
  
  // Breed adjustment for cattle
  const breedMultiplier = (species === 'cattle' && herd.breed) 
    ? BREED_MULTIPLIERS[herd.breed.toLowerCase()] || BREED_MULTIPLIERS['other']
    : 1.0;
  
  // Physiological state adjustment
  const physiologicalMultiplier = herd.breedingStatus 
    ? PHYSIOLOGICAL_MULTIPLIERS[herd.breedingStatus] || PHYSIOLOGICAL_MULTIPLIERS['mature']
    : (herd.lactating ? PHYSIOLOGICAL_MULTIPLIERS['lactating'] : PHYSIOLOGICAL_MULTIPLIERS['mature']);
  
  // Calculate current animal units per head
  const auPerHead = baseAU * ageMultiplier * breedMultiplier * physiologicalMultiplier;
  const totalAnimalUnits = auPerHead * herd.count;
  
  // Calculate projected monthly growth for young animals
  const monthlyGrowthRate = (herd.ageMonths && herd.ageMonths < 24) 
    ? MONTHLY_GROWTH_RATES[species] || MONTHLY_GROWTH_RATES['cattle']
    : 0;
  
  const projectedGrowthMonthly = totalAnimalUnits * monthlyGrowthRate;
  
  return {
    totalAnimalUnits: Math.round(totalAnimalUnits * 100) / 100,
    averageAnimalUnits: Math.round(auPerHead * 100) / 100,
    projectedGrowthMonthly: Math.round(projectedGrowthMonthly * 100) / 100,
    adjustmentFactors: {
      age: ageMultiplier,
      breed: breedMultiplier,
      physiological: physiologicalMultiplier
    }
  };
}

// Project animal units growth over time
export function projectAnimalUnitsGrowth(herd: HerdData, months: number): number {
  const currentAU = calculateAnimalUnits(herd);
  
  if (currentAU.projectedGrowthMonthly === 0) {
    return currentAU.totalAnimalUnits; // No growth for mature animals
  }
  
  // Compound growth over months, but cap at mature size
  let projectedAU = currentAU.totalAnimalUnits;
  for (let month = 0; month < months; month++) {
    const monthlyIncrease = projectedAU * (currentAU.projectedGrowthMonthly / currentAU.totalAnimalUnits);
    projectedAU += monthlyIncrease;
    
    // Cap at mature size (when age adjustment reaches 1.0)
    const futureAge = (herd.ageMonths || 24) + month;
    const species = herd.species.toLowerCase();
    const maxMultiplier = (AGE_MULTIPLIERS[species] || AGE_MULTIPLIERS['cattle'])(futureAge);
    
    if (maxMultiplier >= 1.0) {
      // Animal has reached maturity
      const baseAU = SPECIES_BASE_AU[species] || SPECIES_BASE_AU['cattle'];
      const breedMultiplier = (species === 'cattle' && herd.breed) 
        ? BREED_MULTIPLIERS[herd.breed.toLowerCase()] || BREED_MULTIPLIERS['other']
        : 1.0;
      const physiologicalMultiplier = herd.breedingStatus 
        ? PHYSIOLOGICAL_MULTIPLIERS[herd.breedingStatus] || PHYSIOLOGICAL_MULTIPLIERS['mature']
        : PHYSIOLOGICAL_MULTIPLIERS['mature'];
      
      const matureAU = baseAU * breedMultiplier * physiologicalMultiplier * herd.count;
      projectedAU = Math.min(projectedAU, matureAU);
      break;
    }
  }
  
  return Math.round(projectedAU * 100) / 100;
}

function calculateDmIntake(herd: HerdData): number {
  // Use animal units for more accurate DM calculation
  const animalUnits = calculateAnimalUnits(herd);
  
  // 1 AU requires approximately 26 lbs DM per day
  const dmRequired = animalUnits.totalAnimalUnits * 26;
  
  return dmRequired;
}

export function calculatePastureYield(pastureData: PastureData, acres: number): number {
  const baseYield = PASTURE_YIELDS[pastureData.type as keyof typeof PASTURE_YIELDS] || 200;
  const adjustment = PASTURE_ADJUSTMENTS[pastureData.type as keyof typeof PASTURE_ADJUSTMENTS] || 1.0;
  
  // Calculate weighted yield from species composition
  let speciesYield = 0;
  let totalPercentage = 0;
  
  pastureData.species.forEach(species => {
    const speciesYieldValue = GRASS_YIELDS[species.name.toLowerCase()] || GRASS_YIELDS.generic;
    speciesYield += speciesYieldValue * (species.percentage / 100);
    totalPercentage += species.percentage;
  });
  
  // Use species-based calculation if we have good data, otherwise use base yield
  const finalYield = totalPercentage > 50 ? speciesYield : baseYield;
  
  // Adjust for grass height and ground cover
  const heightMultiplier = Math.min(1.0, Math.max(0.3, pastureData.grassHeight / 6));
  const coverMultiplier = pastureData.groundCover / 100;
  
  return finalYield * adjustment * heightMultiplier * coverMultiplier * acres;
}

export function calculateGrazingPlan(
  herd: HerdData,
  pastureData: PastureData,
  acres: number,
  climate: string,
  season: string = "spring"
): GrazingCalculation {
  
  // Calculate daily DM requirement
  const dailyDmRequired = calculateDmIntake(herd);
  
  // Calculate available DM in pasture
  const totalAvailableDm = calculatePastureYield(pastureData, acres);
  
  // Apply utilization rate (typically 50% to maintain pasture health)
  const utilizationRate = 0.5;
  const utilizableDm = totalAvailableDm * utilizationRate;
  
  // Calculate grazing days
  const basicGrazingDays = utilizableDm / dailyDmRequired;
  
  // Apply seasonal and climate adjustments
  const climateData = GROWTH_RATES[climate as keyof typeof GROWTH_RATES] || GROWTH_RATES.temperate;
  const seasonalGrowth = climateData[season as keyof typeof climateData] || 0.15;
  const growthAdjustment = 1 + seasonalGrowth;
  
  const adjustedGrazingDays = basicGrazingDays * growthAdjustment;
  
  // Ensure minimum rest period
  const restPeriod = PARASITE_REST[climate as keyof typeof PARASITE_REST] || 28;
  const maxGrazingDays = Math.min(adjustedGrazingDays, 7); // Cap at 7 days for rotational grazing
  
  const recommendedDays = Math.max(1, Math.min(maxGrazingDays, adjustedGrazingDays));
  
  const reasoning = `Based on ${herd.count} ${herd.species} (avg ${Math.round(herd.averageWeight)} lbs) requiring ${Math.round(dailyDmRequired)} lbs DM/day. ` +
    `Pasture: ${acres} acres of ${pastureData.type} with ${pastureData.grassHeight}" grass height and ${pastureData.groundCover}% cover. ` +
    `Climate: ${climate}, Season: ${season}. Available DM: ${Math.round(utilizableDm)} lbs (${Math.round(utilizationRate * 100)}% utilization).`;

  return {
    recommendedDays: Math.round(recommendedDays * 10) / 10,
    reasoning,
    metrics: {
      totalDmRequired: dailyDmRequired,
      availableDm: utilizableDm,
      utilizationRate,
      restPeriod
    }
  };
}

export function getSeason(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  if (month === 5 && day >= 15) return "late spring";
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

export function getClimateFromRegion(region: string): string {
  const regionLower = region.toLowerCase();
  
  // Specific regional mappings
  if (regionLower.includes('southeastern oklahoma') || regionLower.includes('se oklahoma')) {
    return "southeastern_oklahoma";
  }
  if (regionLower.includes('oklahoma') || regionLower.includes('southern plains')) {
    return "southern_plains";
  }
  if (regionLower.includes('arizona') || regionLower.includes('nevada') || regionLower.includes('desert')) {
    return "arid";
  }
  if (regionLower.includes('florida') || regionLower.includes('louisiana') || regionLower.includes('humid')) {
    return "humid";
  }
  
  return "temperate"; // Default
}

export function getClimateFromZip(zipCode: string): string {
  // ZIP to climate mapping - can be enhanced with more data
  const zipRegions: Record<string, string> = {
    "67501": "temperate", // Hutchinson, KS
    "85001": "arid",      // Phoenix, AZ
    "30301": "humid"      // Atlanta, GA
  };
  
  const climate = zipRegions[zipCode];
  if (climate) return climate;
  
  // Oklahoma ZIP codes (73xxx and 74xxx)
  const firstTwo = parseInt(zipCode.substring(0, 2));
  if (firstTwo === 73 || firstTwo === 74) {
    // Check if it's southeastern Oklahoma (roughly 74500+)
    const zipNum = parseInt(zipCode);
    if (zipNum >= 74500) return "southeastern_oklahoma";
    return "southern_plains";
  }
  
  // Default based on rough geographic patterns
  const firstDigit = parseInt(zipCode.charAt(0));
  if (firstDigit >= 8 && firstDigit <= 9) return "arid"; // Western states
  if (firstDigit >= 3 && firstDigit <= 4) return "humid"; // Southeastern states
  return "temperate"; // Default
}
