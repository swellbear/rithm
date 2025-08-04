// Location-specific agricultural calculations based on GPS coordinates
// Calculates growth rates, rest periods, and seasonal adjustments for specific locations

interface LocationData {
  lat: number;
  lon: number;
}

interface ClimateZone {
  name: string;
  growthRates: {
    spring: number;
    summer: number;
    fall: number;
    winter: number;
  };
  parasiteRestDays: number;
  firstFrostDate: string;
  lastFrostDate: string;
  averageAnnualRainfall: number;
}

// Define climate zones based on latitude/longitude ranges
const getClimateZoneFromCoordinates = (lat: number, lon: number): ClimateZone => {
  // Southeastern Oklahoma (34-37°N, 94-100°W)
  if (lat >= 33.5 && lat <= 37.5 && lon >= -100.5 && lon <= -93.5) {
    // More precise calculations based on exact coordinates within SE Oklahoma
    const distanceFromCenter = Math.sqrt(Math.pow(lat - 34.2484, 2) + Math.pow(lon - (-95.3717), 2));
    
    // Adjust growth rates based on micro-location within the region
    const baseGrowthRates = {
      spring: 0.18, // Base rate for SE Oklahoma
      summer: 0.12,
      fall: 0.15,
      winter: 0.05
    };

    // Northern areas (higher latitude) have slightly different patterns
    if (lat > 36) {
      baseGrowthRates.spring = 0.16; // Slower spring start
      baseGrowthRates.fall = 0.17;   // Better fall growth
      baseGrowthRates.winter = 0.03; // Harsher winters
    }

    // Eastern areas (closer to Arkansas) get more rainfall
    if (lon > -95) {
      baseGrowthRates.spring += 0.01;
      baseGrowthRates.summer += 0.01;
    }

    // Western areas (more arid) need longer rest periods
    const parasiteRestDays = lon < -96 ? 35 : 32;

    return {
      name: "Southeastern Oklahoma",
      growthRates: baseGrowthRates,
      parasiteRestDays,
      firstFrostDate: lat > 36 ? "November 5" : "November 15",
      lastFrostDate: lat > 36 ? "March 25" : "March 15",
      averageAnnualRainfall: lon > -95 ? 45 : 38 // inches
    };
  }

  // Texas (25-37°N, 93-107°W)
  if (lat >= 25 && lat <= 37 && lon >= -107 && lon <= -93) {
    return {
      name: "Texas",
      growthRates: {
        spring: 0.20,
        summer: 0.10, // Hot summers slow growth
        fall: 0.18,
        winter: 0.08
      },
      parasiteRestDays: 28, // Warmer climate, shorter rest needed
      firstFrostDate: "December 1",
      lastFrostDate: "February 15",
      averageAnnualRainfall: 32
    };
  }

  // Arkansas (33-37°N, 89-95°W)  
  if (lat >= 33 && lat <= 37 && lon >= -95 && lon <= -89) {
    return {
      name: "Arkansas",
      growthRates: {
        spring: 0.17,
        summer: 0.13,
        fall: 0.16,
        winter: 0.06
      },
      parasiteRestDays: 30,
      firstFrostDate: "November 10",
      lastFrostDate: "March 20",
      averageAnnualRainfall: 48
    };
  }

  // Kansas (37-40°N, 94-102°W)
  if (lat >= 37 && lat <= 40 && lon >= -102 && lon <= -94) {
    return {
      name: "Kansas",
      growthRates: {
        spring: 0.16,
        summer: 0.14,
        fall: 0.13,
        winter: 0.02
      },
      parasiteRestDays: 35, // Drier climate needs longer rest
      firstFrostDate: "October 25",
      lastFrostDate: "April 5",
      averageAnnualRainfall: 28
    };
  }

  // Default to general Great Plains if coordinates don't match specific zones
  return {
    name: "Great Plains Region",
    growthRates: {
      spring: 0.15,
      summer: 0.12,
      fall: 0.14,
      winter: 0.04
    },
    parasiteRestDays: 32,
    firstFrostDate: "November 1",
    lastFrostDate: "March 30",
    averageAnnualRainfall: 35
  };
};

// Get current season based on date
export const getCurrentSeason = (): 'spring' | 'summer' | 'fall' | 'winter' => {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
};

// Calculate location-specific agricultural parameters
export const calculateLocationSpecificData = (location: LocationData) => {
  const climateZone = getClimateZoneFromCoordinates(location.lat, location.lon);
  const currentSeason = getCurrentSeason();
  
  return {
    climateZone: climateZone.name,
    currentGrowthRate: climateZone.growthRates[currentSeason],
    parasiteRestDays: climateZone.parasiteRestDays,
    growthRates: climateZone.growthRates,
    firstFrostDate: climateZone.firstFrostDate,
    lastFrostDate: climateZone.lastFrostDate,
    averageAnnualRainfall: climateZone.averageAnnualRainfall,
    season: currentSeason
  };
};

// Get seasonal recommendations based on location
export const getSeasonalRecommendations = (location: LocationData) => {
  const data = calculateLocationSpecificData(location);
  const recommendations = [];

  // Growth rate based recommendations
  if (data.currentGrowthRate > 0.15) {
    recommendations.push(`Excellent growth conditions (${(data.currentGrowthRate * 100).toFixed(0)}% daily rate)`);
  } else if (data.currentGrowthRate > 0.10) {
    recommendations.push(`Moderate growth expected (${(data.currentGrowthRate * 100).toFixed(0)}% daily rate)`);
  } else {
    recommendations.push(`Slow growth period (${(data.currentGrowthRate * 100).toFixed(0)}% daily rate) - extend grazing periods`);
  }

  // Rest period recommendations
  recommendations.push(`${data.parasiteRestDays}-day rest periods optimal for this location`);

  // Seasonal specific advice
  const season = data.season;
  if (season === 'spring') {
    recommendations.push("Spring flush period - monitor for bloat risk");
  } else if (season === 'summer') {
    recommendations.push("Summer heat - provide shade and increase water access");
  } else if (season === 'fall') {
    recommendations.push("Fall stockpiling recommended before frost");
  } else {
    recommendations.push("Winter feeding may be needed - monitor body condition");
  }

  return {
    recommendations,
    data
  };
};