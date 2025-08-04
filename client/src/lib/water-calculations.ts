// Water consumption calculations for livestock based on multiple variables
// Includes weather conditions, animal factors, pasture conditions, and shade availability

interface AnimalData {
  species: string;
  weight: number;
  age: number; // in months
  lactating: boolean;
  count: number;
}

interface EnvironmentalFactors {
  temperature: number; // Fahrenheit
  humidity: number; // percentage
  windSpeed: number; // mph
  heatIndex?: number;
}

interface PastureConditions {
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  moistureContent: number; // percentage
  shadeAvailability: 'none' | 'minimal' | 'moderate' | 'abundant';
  shadeType: 'natural' | 'artificial' | 'mixed';
}

interface PaddockData {
  shadeAvailability: string | null;
  shadeType: string | null;
  pastureType: string;
}

// Helper function to convert paddock data to pasture conditions
export const convertPaddockToPastureConditions = (paddock: PaddockData): PastureConditions => {
  // Map pastureType to quality and moistureContent
  let quality: 'poor' | 'fair' | 'good' | 'excellent';
  let moistureContent: number;
  
  switch (paddock.pastureType) {
    case 'lush':
      quality = 'excellent';
      moistureContent = 85;
      break;
    case 'mixed':
      quality = 'good';
      moistureContent = 70;
      break;
    case 'native':
    default:
      quality = 'fair';
      moistureContent = 60;
      break;
  }
  
  return {
    quality,
    moistureContent,
    shadeAvailability: (paddock.shadeAvailability as 'none' | 'minimal' | 'moderate' | 'abundant') || 'moderate',
    shadeType: (paddock.shadeType as 'natural' | 'artificial' | 'mixed') || 'natural'
  };
};

// Base water requirements by species (gallons per day per 100 lbs body weight)
const BASE_WATER_REQUIREMENTS = {
  cattle: 1.2,      // Beef cattle
  dairy: 1.8,       // Dairy cattle (higher due to milk production)
  sheep: 0.8,       // Sheep and goats
  goats: 0.8,
  horses: 1.0,      // Horses
  pigs: 1.5,        // Pigs
  chickens: 0.2,    // Per bird (not per 100 lbs)
  default: 1.0
};

// Age adjustment factors
const getAgeAdjustment = (ageMonths: number, species: string): number => {
  if (species === 'chickens') return 1.0; // Chickens handled differently
  
  if (ageMonths < 6) return 0.6;      // Young animals need less
  if (ageMonths < 12) return 0.8;     // Growing animals
  if (ageMonths < 24) return 1.0;     // Mature animals
  if (ageMonths < 60) return 1.1;     // Prime adults
  return 1.2;                         // Older animals may need more
};

// Temperature adjustment factors
const getTemperatureAdjustment = (temp: number, humidity: number): number => {
  // Calculate heat index for more accurate assessment
  const heatIndex = calculateHeatIndex(temp, humidity);
  
  if (heatIndex < 70) return 1.0;       // Comfortable conditions
  if (heatIndex < 80) return 1.2;       // Warm
  if (heatIndex < 90) return 1.5;       // Hot
  if (heatIndex < 100) return 2.0;      // Very hot
  if (heatIndex < 110) return 2.5;      // Dangerous
  return 3.0;                           // Extreme danger
};

// Calculate heat index
const calculateHeatIndex = (temp: number, humidity: number): number => {
  if (temp < 80) return temp;
  
  const T = temp;
  const R = humidity;
  
  let HI = -42.379 + 2.04901523 * T + 10.14333127 * R 
         - 0.22475541 * T * R - 0.00683783 * T * T 
         - 0.05481717 * R * R + 0.00122874 * T * T * R 
         + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
  
  return Math.round(HI);
};

// Lactation adjustment
const getLactationAdjustment = (lactating: boolean, species: string): number => {
  if (!lactating) return 1.0;
  
  switch (species.toLowerCase()) {
    case 'dairy':
    case 'cattle': return 1.5;  // Lactating cattle need significantly more
    case 'sheep':
    case 'goats': return 1.3;   // Lactating small ruminants
    default: return 1.2;
  }
};

// Pasture quality adjustment
const getPastureAdjustment = (quality: string, moistureContent: number): number => {
  let baseAdjustment = 1.0;
  
  // Dry pasture means animals get less water from forage
  switch (quality) {
    case 'poor': baseAdjustment = 1.4; break;
    case 'fair': baseAdjustment = 1.2; break;
    case 'good': baseAdjustment = 1.1; break;
    case 'excellent': baseAdjustment = 1.0; break;
  }
  
  // Adjust for moisture content (green grass provides water)
  if (moistureContent > 70) baseAdjustment *= 0.9;      // Lush pasture
  else if (moistureContent > 50) baseAdjustment *= 1.0; // Normal pasture
  else if (moistureContent > 30) baseAdjustment *= 1.2; // Dry pasture
  else baseAdjustment *= 1.4;                           // Very dry pasture
  
  return baseAdjustment;
};

// Shade availability adjustment
const getShadeAdjustment = (shadeAvailability: string, temperature: number): number => {
  // Shade becomes more critical as temperature increases
  const tempFactor = temperature > 85 ? 1.5 : (temperature > 75 ? 1.2 : 1.0);
  
  switch (shadeAvailability) {
    case 'abundant': return 1.0;                    // Adequate shade
    case 'moderate': return 1.1 * tempFactor;       // Some shade stress
    case 'minimal': return 1.3 * tempFactor;        // Significant shade stress
    case 'none': return 1.5 * tempFactor;           // No shade - high stress
    default: return 1.2 * tempFactor;
  }
};

// Main water calculation function
export const calculateWaterNeeds = (
  animals: AnimalData[], 
  environmental: EnvironmentalFactors, 
  pasture: PastureConditions
) => {
  let totalGallonsPerDay = 0;
  const animalBreakdown: any[] = [];
  
  animals.forEach(animal => {
    const species = animal.species.toLowerCase();
    const baseRate = BASE_WATER_REQUIREMENTS[species as keyof typeof BASE_WATER_REQUIREMENTS] || BASE_WATER_REQUIREMENTS.default;
    
    let waterPerAnimal;
    
    if (species === 'chickens') {
      // Chickens calculated per bird, not per weight
      waterPerAnimal = baseRate; // 0.2 gallons per bird
    } else {
      // Other animals calculated per 100 lbs body weight
      const weightFactor = animal.weight / 100;
      waterPerAnimal = baseRate * weightFactor;
    }
    
    // Apply all adjustment factors
    const ageAdjustment = getAgeAdjustment(animal.age, species);
    const tempAdjustment = getTemperatureAdjustment(environmental.temperature, environmental.humidity);
    const lactationAdjustment = getLactationAdjustment(animal.lactating, species);
    const pastureAdjustment = getPastureAdjustment(pasture.quality, pasture.moistureContent);
    const shadeAdjustment = getShadeAdjustment(pasture.shadeAvailability, environmental.temperature);
    
    const adjustedWaterPerAnimal = waterPerAnimal * ageAdjustment * tempAdjustment * 
                                   lactationAdjustment * pastureAdjustment * shadeAdjustment;
    
    const totalForHerd = adjustedWaterPerAnimal * animal.count;
    totalGallonsPerDay += totalForHerd;
    
    animalBreakdown.push({
      species: animal.species,
      count: animal.count,
      weight: animal.weight,
      waterPerAnimal: Math.round(adjustedWaterPerAnimal * 10) / 10,
      totalWater: Math.round(totalForHerd * 10) / 10,
      factors: {
        age: ageAdjustment,
        temperature: tempAdjustment,
        lactation: lactationAdjustment,
        pasture: pastureAdjustment,
        shade: shadeAdjustment
      }
    });
  });
  
  return {
    totalGallonsPerDay: Math.round(totalGallonsPerDay * 10) / 10,
    animalBreakdown,
    recommendations: generateWaterRecommendations(totalGallonsPerDay, environmental, pasture)
  };
};

// Generate water management recommendations
const generateWaterRecommendations = (
  totalWater: number, 
  environmental: EnvironmentalFactors, 
  pasture: PastureConditions
): string[] => {
  const recommendations = [];
  const heatIndex = calculateHeatIndex(environmental.temperature, environmental.humidity);
  
  // Basic water recommendations
  recommendations.push(`Provide ${Math.ceil(totalWater)} gallons of fresh water daily`);
  
  // Heat stress recommendations
  if (heatIndex > 90) {
    recommendations.push("HEAT ALERT: Increase water checks to twice daily");
    recommendations.push("Consider electrolyte supplements in extreme heat");
  }
  
  if (heatIndex > 100) {
    recommendations.push("DANGER: Provide emergency cooling measures immediately");
    recommendations.push("Move animals to shade and increase water access");
  }
  
  // Shade recommendations
  if (pasture.shadeAvailability === 'none' && environmental.temperature > 80) {
    recommendations.push("URGENT: Provide shade structures - animals at risk");
  } else if (pasture.shadeAvailability === 'minimal' && environmental.temperature > 85) {
    recommendations.push("Consider additional shade structures for hot days");
  }
  
  // Water system recommendations
  if (totalWater > 100) {
    recommendations.push("Consider automatic waterers for large herds");
  }
  
  recommendations.push("Check water sources twice daily during hot weather");
  recommendations.push("Clean water containers regularly to prevent algae growth");
  
  return recommendations;
};

// Calculate daily supplemental feed needs
export const calculateSupplementalFeedNeeds = (
  animals: AnimalData[],
  pastureQuality: string,
  season: string,
  dmAvailability: number // dry matter lbs per acre
) => {
  let totalFeedNeeded = 0;
  const feedBreakdown: any[] = [];
  
  animals.forEach(animal => {
    const species = animal.species.toLowerCase();
    
    // Base daily dry matter needs (% of body weight)
    let dmNeedPercent = 0.025; // 2.5% default
    
    switch (species) {
      case 'cattle':
      case 'dairy':
        dmNeedPercent = animal.lactating ? 0.035 : 0.025;
        break;
      case 'sheep':
      case 'goats':
        dmNeedPercent = animal.lactating ? 0.04 : 0.03;
        break;
      case 'horses':
        dmNeedPercent = 0.02;
        break;
    }
    
    const dailyDmNeeds = animal.weight * dmNeedPercent * animal.count;
    
    // Adjust for pasture quality and season
    let pastureDeficit = 0;
    if (pastureQuality === 'poor') pastureDeficit = 0.7;
    else if (pastureQuality === 'fair') pastureDeficit = 0.4;
    else if (pastureQuality === 'good') pastureDeficit = 0.1;
    
    if (season === 'winter') pastureDeficit += 0.3;
    else if (season === 'fall') pastureDeficit += 0.1;
    
    const supplementNeeded = dailyDmNeeds * pastureDeficit;
    totalFeedNeeded += supplementNeeded;
    
    if (supplementNeeded > 0) {
      feedBreakdown.push({
        species: animal.species,
        count: animal.count,
        dailyNeeds: Math.round(dailyDmNeeds * 10) / 10,
        supplementNeeded: Math.round(supplementNeeded * 10) / 10,
        recommendedFeed: getRecommendedFeedType(species, animal.lactating)
      });
    }
  });
  
  return {
    totalSupplementalFeed: Math.round(totalFeedNeeded * 10) / 10,
    feedBreakdown,
    recommendations: generateFeedRecommendations(totalFeedNeeded, pastureQuality, season)
  };
};

const getRecommendedFeedType = (species: string, lactating: boolean): string => {
  switch (species.toLowerCase()) {
    case 'dairy':
    case 'cattle':
      return lactating ? "High-quality alfalfa hay + grain supplement" : "Mixed grass hay";
    case 'sheep':
    case 'goats':
      return lactating ? "Alfalfa pellets + grain" : "Good quality hay";
    case 'horses':
      return "Timothy hay + oats if needed";
    default:
      return "Species-appropriate hay or pellets";
  }
};

const generateFeedRecommendations = (totalFeed: number, quality: string, season: string): string[] => {
  const recommendations = [];
  
  if (totalFeed > 0) {
    recommendations.push(`Provide ${Math.ceil(totalFeed)} lbs of supplemental feed daily`);
    
    if (season === 'winter') {
      recommendations.push("Increase feed quality during winter months");
      recommendations.push("Monitor body condition scores weekly");
    }
    
    if (quality === 'poor') {
      recommendations.push("Consider pasture renovation in spring");
      recommendations.push("Increase protein content in supplemental feed");
    }
    
    recommendations.push("Transition feed changes gradually over 7-10 days");
    recommendations.push("Provide mineral supplements year-round");
  } else {
    recommendations.push("Pasture appears adequate - monitor body condition");
    recommendations.push("Always provide mineral supplements");
  }
  
  return recommendations;
};