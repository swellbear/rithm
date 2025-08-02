// Water Consumption Calculator - Calculates daily water needs based on animals, weather, and conditions

export interface AnimalData {
  species: string;
  weight: number;
  lactating: boolean;
  age: number;
  ageUnit: 'months' | 'years';
  count: number;
}

export interface WeatherData {
  temperature: number; // Fahrenheit
  humidity: number; // percentage
  heatIndex?: number; // calculated if not provided
}

export interface WaterConsumptionCalculation {
  baseConsumption: number; // gallons per day
  temperatureAdjustment: number; // additional gallons
  humidityAdjustment: number; // additional gallons
  lactationAdjustment: number; // additional gallons
  totalDailyNeed: number; // gallons per day
  animalBreakdown: {
    species: string;
    count: number;
    perAnimalNeed: number;
    totalNeed: number;
  }[];
  weatherAdjustmentFactor: number; // multiplier
}

export class WaterConsumptionCalculator {
  
  // Base water consumption by species (gallons per day per 100 lbs body weight)
  private static BASE_CONSUMPTION_RATES = {
    cattle: 2.0, // 2 gallons per 100 lbs
    sheep: 1.5, // 1.5 gallons per 100 lbs
    goats: 1.8, // 1.8 gallons per 100 lbs
    horses: 1.5, // 1.5 gallons per 100 lbs
    pigs: 3.0, // 3 gallons per 100 lbs
  };

  // Lactation multipliers
  private static LACTATION_MULTIPLIERS = {
    cattle: 1.5, // 50% increase for lactating cattle
    sheep: 1.4, // 40% increase for lactating sheep
    goats: 1.4, // 40% increase for lactating goats
    horses: 1.3, // 30% increase for lactating horses
    pigs: 1.6, // 60% increase for lactating pigs
  };

  // Age adjustment factors (young animals need less per pound)
  private static AGE_ADJUSTMENT_FACTORS = {
    young: 0.8, // animals under 6 months
    juvenile: 0.9, // animals 6-12 months
    adult: 1.0, // animals over 12 months
  };

  static calculateDailyConsumption(
    animals: AnimalData[],
    weather: WeatherData,
    conditions?: {
      feedType?: 'dry' | 'wet' | 'mixed';
      waterQuality?: 'poor' | 'fair' | 'good' | 'excellent';
      stressLevel?: 'low' | 'moderate' | 'high';
    }
  ): WaterConsumptionCalculation {
    
    const animalBreakdown: WaterConsumptionCalculation['animalBreakdown'] = [];
    let totalBaseConsumption = 0;
    let totalLactationAdjustment = 0;

    // Calculate base consumption for each animal group
    animals.forEach(animalGroup => {
      const species = animalGroup.species.toLowerCase();
      const baseRate = this.BASE_CONSUMPTION_RATES[species as keyof typeof this.BASE_CONSUMPTION_RATES] || 2.0;
      
      // Age adjustment
      const ageInMonths = animalGroup.ageUnit === 'years' ? animalGroup.age * 12 : animalGroup.age;
      const ageCategory = ageInMonths < 6 ? 'young' : ageInMonths < 12 ? 'juvenile' : 'adult';
      const ageAdjustment = this.AGE_ADJUSTMENT_FACTORS[ageCategory];
      
      // Base consumption per animal (gallons per day)
      const perAnimalBase = (animalGroup.weight / 100) * baseRate * ageAdjustment;
      
      // Lactation adjustment
      const lactationMultiplier = animalGroup.lactating ? 
        this.LACTATION_MULTIPLIERS[species as keyof typeof this.LACTATION_MULTIPLIERS] || 1.0 : 1.0;
      
      const perAnimalTotal = perAnimalBase * lactationMultiplier;
      const groupTotal = perAnimalTotal * animalGroup.count;
      
      animalBreakdown.push({
        species: animalGroup.species,
        count: animalGroup.count,
        perAnimalNeed: perAnimalTotal,
        totalNeed: groupTotal
      });
      
      totalBaseConsumption += perAnimalBase * animalGroup.count;
      totalLactationAdjustment += (perAnimalTotal - perAnimalBase) * animalGroup.count;
    });

    // Weather adjustments
    const weatherAdjustmentFactor = this.calculateWeatherAdjustmentFactor(weather);
    const temperatureAdjustment = totalBaseConsumption * (weatherAdjustmentFactor - 1);
    
    // Humidity adjustment (high humidity reduces consumption slightly)
    const humidityAdjustment = weather.humidity > 80 ? 
      totalBaseConsumption * -0.05 : // 5% reduction in high humidity
      weather.humidity < 30 ? 
      totalBaseConsumption * 0.03 : // 3% increase in low humidity
      0;

    // Condition adjustments
    let conditionAdjustment = 0;
    if (conditions) {
      // Dry feed increases water consumption
      if (conditions.feedType === 'dry') {
        conditionAdjustment += totalBaseConsumption * 0.1; // 10% increase
      }
      
      // Poor water quality reduces consumption
      if (conditions.waterQuality === 'poor') {
        conditionAdjustment -= totalBaseConsumption * 0.15; // 15% reduction
      } else if (conditions.waterQuality === 'fair') {
        conditionAdjustment -= totalBaseConsumption * 0.05; // 5% reduction
      }
      
      // High stress increases consumption
      if (conditions.stressLevel === 'high') {
        conditionAdjustment += totalBaseConsumption * 0.2; // 20% increase
      } else if (conditions.stressLevel === 'moderate') {
        conditionAdjustment += totalBaseConsumption * 0.1; // 10% increase
      }
    }

    const totalDailyNeed = totalBaseConsumption + totalLactationAdjustment + 
                          temperatureAdjustment + humidityAdjustment + conditionAdjustment;

    return {
      baseConsumption: totalBaseConsumption,
      temperatureAdjustment: temperatureAdjustment,
      humidityAdjustment: humidityAdjustment,
      lactationAdjustment: totalLactationAdjustment,
      totalDailyNeed: Math.max(totalDailyNeed, 0), // Never negative
      animalBreakdown,
      weatherAdjustmentFactor
    };
  }

  private static calculateWeatherAdjustmentFactor(weather: WeatherData): number {
    const temperature = weather.temperature;
    const humidity = weather.humidity;
    
    // Calculate heat index if not provided
    const heatIndex = weather.heatIndex || this.calculateHeatIndex(temperature, humidity);
    
    // Base adjustment on heat index
    if (heatIndex >= 105) {
      return 1.5; // 50% increase in extreme heat
    } else if (heatIndex >= 90) {
      return 1.3; // 30% increase in hot weather
    } else if (heatIndex >= 80) {
      return 1.15; // 15% increase in warm weather
    } else if (heatIndex >= 70) {
      return 1.0; // Normal consumption
    } else if (heatIndex >= 50) {
      return 0.95; // 5% reduction in cool weather
    } else {
      return 0.9; // 10% reduction in cold weather
    }
  }

  private static calculateHeatIndex(temperature: number, humidity: number): number {
    // Heat index calculation for temperatures >= 80°F
    if (temperature < 80) {
      return temperature; // No heat index adjustment below 80°F
    }
    
    const T = temperature;
    const R = humidity;
    
    // Simplified heat index formula
    const HI = -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 
               0.00683783 * T * T - 0.05481717 * R * R + 0.00122874 * T * T * R + 
               0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
    
    return Math.round(HI);
  }

  // Calculate water source capacity requirements
  static calculateSourceRequirements(
    dailyConsumption: number,
    sourceType: string,
    refillMethod: string,
    daysOfReserve: number = 3
  ): {
    minimumCapacity: number;
    recommendedCapacity: number;
    refillFrequency: string;
    flowRateNeeded?: number;
  } {
    const totalNeed = dailyConsumption * daysOfReserve;
    
    // Capacity recommendations by source type
    const capacityMultiplier = {
      'trough': 1.0, // Daily refill expected
      'tank': 1.5, // Every 2-3 days
      'pond': 2.0, // Natural reserve
      'well': 0.5, // On-demand
      'piped': 0.3, // Continuous supply
      'stream': 0.2, // Natural flow
      'spring': 0.4, // Natural but limited
    };
    
    const multiplier = capacityMultiplier[sourceType as keyof typeof capacityMultiplier] || 1.0;
    const minimumCapacity = dailyConsumption * multiplier;
    const recommendedCapacity = minimumCapacity * 1.5; // 50% safety margin
    
    // Refill frequency recommendations
    const refillFrequency = {
      'manual': sourceType === 'trough' ? 'Daily' : 'Every 2-3 days',
      'automatic': 'As needed',
      'gravity': 'Continuous',
      'pump': 'Scheduled'
    };
    
    // Flow rate needed for piped systems (gallons per minute)
    const flowRateNeeded = refillMethod === 'automatic' || refillMethod === 'pump' ? 
      Math.max(dailyConsumption / (8 * 60), 2) : // 8 hours to fill daily need, minimum 2 GPM
      undefined;
    
    return {
      minimumCapacity,
      recommendedCapacity,
      refillFrequency: refillFrequency[refillMethod as keyof typeof refillFrequency] || 'Daily',
      flowRateNeeded
    };
  }

  // Check if water source is adequate
  static evaluateWaterSource(
    source: {
      type: string;
      capacity: number;
      currentLevel: number;
      refillMethod: string;
      flowRate?: number;
    },
    dailyConsumption: number
  ): {
    isAdequate: boolean;
    daysRemaining: number;
    recommendations: string[];
    alerts: string[];
  } {
    const currentWater = source.capacity * (source.currentLevel / 100);
    const daysRemaining = currentWater / dailyConsumption;
    
    const recommendations: string[] = [];
    const alerts: string[] = [];
    
    // Check adequacy
    const isAdequate = currentWater >= dailyConsumption;
    
    // Generate recommendations
    if (daysRemaining < 1) {
      alerts.push('CRITICAL: Water will run out within 24 hours');
      recommendations.push('Immediate refill required');
    } else if (daysRemaining < 2) {
      alerts.push('WARNING: Water will run out within 48 hours');
      recommendations.push('Plan refill within 24 hours');
    } else if (daysRemaining < 3) {
      recommendations.push('Schedule refill within 2 days');
    }
    
    // Check flow rate for automatic systems
    if (source.refillMethod === 'automatic' && source.flowRate) {
      const minFlowRate = dailyConsumption / (8 * 60); // 8 hours to fill daily need
      if (source.flowRate < minFlowRate) {
        alerts.push(`Flow rate too low: ${source.flowRate} GPM, need ${minFlowRate.toFixed(1)} GPM`);
        recommendations.push('Increase flow rate or add additional water source');
      }
    }
    
    // Capacity recommendations
    const requirements = this.calculateSourceRequirements(
      dailyConsumption, 
      source.type, 
      source.refillMethod
    );
    
    if (source.capacity < requirements.minimumCapacity) {
      recommendations.push(
        `Increase capacity to ${requirements.recommendedCapacity.toFixed(0)} gallons`
      );
    }
    
    return {
      isAdequate,
      daysRemaining,
      recommendations,
      alerts
    };
  }
}