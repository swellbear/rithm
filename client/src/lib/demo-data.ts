// Comprehensive demo data for showcasing Cadence functionality

export const isDemoMode = () => localStorage.getItem('cadence-demo-mode') === 'true';

// Hook for using demo data in GPS tools
export const useDemoGPSData = () => {
  const isDemo = isDemoMode();
  
  return {
    isDemo,
    savedLocations: isDemo ? demoSavedLocations : [],
    gpsTracks: isDemo ? demoGPSTracks : [],
    paddocks: isDemo ? demoPaddocks : []
  };
};

// Demo livestock data
export const demoAnimals = [
  { id: 1, species: 'cattle', breed: 'Angus', count: 25, averageWeight: 1200, lactating: false, earTagNumber: 'C001', age: 24, notes: 'Breeding herd' },
  { id: 2, species: 'cattle', breed: 'Angus', count: 8, averageWeight: 1400, lactating: true, earTagNumber: 'C002', age: 36, notes: 'Lactating cows' },
  { id: 3, species: 'sheep', breed: 'Katahdin', count: 40, averageWeight: 150, lactating: false, earTagNumber: 'S001', age: 18, notes: 'Hair sheep flock' },
  { id: 4, species: 'goats', breed: 'Boer', count: 12, averageWeight: 120, lactating: false, earTagNumber: 'G001', age: 24, notes: 'Meat goats' }
];

// Demo paddock data
export const demoPaddocks = [
  { 
    id: 1, 
    name: "North Pasture", 
    acres: "25.5", 
    gpsCoordinates: "35.2271,-80.8431", 
    pastureType: "bermuda", 
    restDays: 28, 
    notes: "Good water access", 
    userId: 1,
    currentlyGrazing: true,
    shadeAvailability: "moderate",
    shadeType: "natural",
    waterSources: 2,
    lastGrazed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  { 
    id: 2, 
    name: "South Bottom", 
    acres: "18.3", 
    gpsCoordinates: "35.2245,-80.8398", 
    pastureType: "fescue", 
    restDays: 35, 
    notes: "Needs drainage work", 
    userId: 1,
    currentlyGrazing: false,
    shadeAvailability: "limited",
    shadeType: "artificial",
    waterSources: 1,
    lastGrazed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
  },
  { 
    id: 3, 
    name: "East Ridge", 
    acres: "32.1", 
    gpsCoordinates: "35.2289,-80.8372", 
    pastureType: "mixed", 
    restDays: 21, 
    notes: "High elevation", 
    userId: 1,
    currentlyGrazing: false,
    shadeAvailability: "good",
    shadeType: "trees",
    waterSources: 1,
    lastGrazed: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
  },
  { 
    id: 4, 
    name: "West Creek", 
    acres: "15.7", 
    gpsCoordinates: "35.2258,-80.8456", 
    pastureType: "clover", 
    restDays: 42, 
    notes: "Creek runs through", 
    userId: 1,
    currentlyGrazing: false,
    shadeAvailability: "excellent",
    shadeType: "natural",
    waterSources: 3,
    lastGrazed: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
  }
];

// Demo herd data
export const demoHerds = [
  { id: 1, name: "Main Cattle Herd", species: "cattle", count: 33, averageWeight: "1250", lactatingCount: 8, notes: "Primary breeding stock", userId: 1 },
  { id: 2, name: "Sheep Flock", species: "sheep", count: 40, averageWeight: "150", lactatingCount: 0, notes: "Katahdin hair sheep", userId: 1 },
  { id: 3, name: "Goat Herd", species: "goats", count: 12, averageWeight: "120", lactatingCount: 0, notes: "Boer meat goats", userId: 1 }
];

// Demo assessment data
export const demoAssessments = [
  { id: 1, paddockId: 1, totalPoints: 50, averageHeight: 6.2, coveragePercent: 85, quality: 4, assessmentDate: "2025-01-15", notes: "Excellent recovery", userId: 1 },
  { id: 2, paddockId: 2, totalPoints: 35, averageHeight: 4.1, coveragePercent: 72, quality: 3, assessmentDate: "2025-01-12", notes: "Ready for grazing", userId: 1 },
  { id: 3, paddockId: 3, totalPoints: 42, averageHeight: 5.8, coveragePercent: 78, quality: 3, assessmentDate: "2025-01-10", notes: "Good condition", userId: 1 }
];

// Demo DM availability data
export const demoDMData = [
  { id: 1, paddockId: 1, quality: 4, availability: 2800, protein: 18, energy: 65, assessmentDate: '2025-01-15', notes: "Peak growing season" },
  { id: 2, paddockId: 2, quality: 3, availability: 1900, protein: 14, energy: 58, assessmentDate: '2025-01-12', notes: "Fair condition" },
  { id: 3, paddockId: 3, quality: 3, availability: 2400, protein: 16, energy: 62, assessmentDate: '2025-01-10', notes: "Good recovery" }
];

// Demo GPS saved locations
export const demoSavedLocations = [
  {
    id: "1",
    name: "Main Barn",
    description: "Primary livestock shelter and equipment storage",
    coordinate: { lat: 35.2271, lng: -80.8431, accuracy: 3.2, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    type: "barn" as const,
    paddockId: 1
  },
  {
    id: "2", 
    name: "Well #1",
    description: "Primary water source for north paddocks",
    coordinate: { lat: 35.2275, lng: -80.8425, accuracy: 2.8, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    type: "well" as const,
    paddockId: 1
  },
  {
    id: "3",
    name: "Feed Storage",
    description: "Hay and supplement storage facility", 
    coordinate: { lat: 35.2268, lng: -80.8438, accuracy: 4.1, timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000) },
    type: "feed_area" as const
  },
  {
    id: "4",
    name: "Main Gate",
    description: "Primary farm entrance",
    coordinate: { lat: 35.2263, lng: -80.8445, accuracy: 3.5, timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000) },
    type: "gate" as const
  },
  {
    id: "5",
    name: "Farm Center",
    description: "Central location for weather and planning",
    coordinate: { lat: 35.2271, lng: -80.8431, accuracy: 2.1, timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000) },
    type: "farm_center" as const
  }
];

// Demo GPS tracks (boundary/infrastructure mapping)
export const demoGPSTracks = [
  {
    id: "track1",
    name: "North Pasture Boundary",
    description: "Complete perimeter walk of North Pasture",
    coordinates: [
      { lat: 35.2271, lng: -80.8431, accuracy: 3.2, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { lat: 35.2285, lng: -80.8428, accuracy: 2.8, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 300000) },
      { lat: 35.2287, lng: -80.8442, accuracy: 3.1, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 600000) },
      { lat: 35.2273, lng: -80.8445, accuracy: 2.9, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 900000) },
      { lat: 35.2271, lng: -80.8431, accuracy: 3.2, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 1200000) }
    ],
    totalDistance: 1247.5,
    totalArea: 25.5,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 1200000),
    type: "boundary" as const
  },
  {
    id: "track2", 
    name: "Infrastructure Survey",
    description: "Mapping of all farm infrastructure locations",
    coordinates: [
      { lat: 35.2271, lng: -80.8431, accuracy: 2.1, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      { lat: 35.2275, lng: -80.8425, accuracy: 2.8, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000 + 180000) },
      { lat: 35.2268, lng: -80.8438, accuracy: 4.1, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000 + 360000) },
      { lat: 35.2263, lng: -80.8445, accuracy: 3.5, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000 + 540000) }
    ],
    totalDistance: 892.3,
    startTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 48 * 60 * 60 * 1000 + 540000),
    type: "infrastructure" as const
  },
  {
    id: "track3",
    name: "Daily Route",
    description: "Regular livestock check route",
    coordinates: [
      { lat: 35.2271, lng: -80.8431, accuracy: 3.2, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
      { lat: 35.2245, lng: -80.8398, accuracy: 2.9, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000 + 600000) },
      { lat: 35.2289, lng: -80.8372, accuracy: 3.1, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000 + 1200000) },
      { lat: 35.2258, lng: -80.8456, accuracy: 2.7, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000 + 1800000) }
    ],
    totalDistance: 2104.7,
    startTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 8 * 60 * 60 * 1000 + 1800000),
    type: "route" as const
  }
];

// Unified demo AU calculations for consistent mixed herd data
export const demoAUData = {
  totalAU: 45.2,
  calculations: [
    { species: "cattle", count: 33, averageWeight: 1250, animalUnits: 41.25, method: "weight-based" },
    { species: "sheep", count: 40, averageWeight: 150, animalUnits: 3.0, method: "standard" },
    { species: "goats", count: 12, averageWeight: 120, animalUnits: 0.96, method: "standard" }
  ],
  stockingRate: 0.98, // AU per acre
  recommendedAcreage: 46.1,
  // Mixed herd composition consistency
  mixedHerdBreakdown: {
    totalLivestock: 85,
    cattlePercent: 38.8,
    sheepPercent: 47.1,
    goatPercent: 14.1
  },
  // Consolidated data consistency markers
  dataVersion: "2.1",
  lastUpdated: "2025-01-08",
  consistencyChecks: {
    totalMatches: true,
    speciesBreakdownMatches: true,
    auCalculationMatches: true
  }
};

// Demo weather data
export const demoWeatherData = {
  current: {
    temperature: 78,
    humidity: 65,
    conditions: "Partly Cloudy",
    windSpeed: 8,
    feelsLike: 82,
    uvIndex: 6
  },
  forecast: [
    { date: "2025-01-05", high: 75, low: 52, conditions: "Sunny", precipitation: 0 },
    { date: "2025-01-06", high: 78, low: 55, conditions: "Partly Cloudy", precipitation: 10 },
    { date: "2025-01-07", high: 72, low: 48, conditions: "Rain", precipitation: 80 },
    { date: "2025-01-08", high: 68, low: 45, conditions: "Cloudy", precipitation: 20 },
    { date: "2025-01-09", high: 74, low: 50, conditions: "Sunny", precipitation: 0 }
  ],
  alerts: [
    { type: "heat", message: "Heat stress possible this afternoon", severity: "medium" }
  ]
};

// Demo alerts
export const demoAlerts = [
  { 
    id: 1, 
    type: "rotation", 
    title: "Time to Move Cattle", 
    message: "North Pasture has been grazed for 7 days. Consider moving to South Bottom.", 
    severity: "high", 
    created: "2025-01-05T08:00:00Z",
    acknowledged: false 
  },
  { 
    id: 2, 
    type: "weather", 
    title: "Heat Stress Warning", 
    message: "Temperature expected to reach 85°F today. Ensure adequate water and shade.", 
    severity: "medium", 
    created: "2025-01-05T06:00:00Z",
    acknowledged: false 
  },
  { 
    id: 3, 
    type: "health", 
    title: "Vaccination Due", 
    message: "Annual cattle vaccinations due within 2 weeks.", 
    severity: "low", 
    created: "2025-01-04T10:00:00Z",
    acknowledged: true 
  }
];

// Demo livestock alerts
export const demoLivestockAlerts = [
  {
    id: 1,
    animalId: 1,
    alertType: "vaccination",
    title: "Cattle Vaccination Due",
    message: "Annual vaccination schedule due for main herd",
    severity: "medium",
    dueDate: "2025-01-20",
    acknowledged: false,
    species: "cattle"
  },
  {
    id: 2, 
    animalId: 3,
    alertType: "health",
    title: "Sheep Health Check",
    message: "Quarterly health assessment recommended",
    severity: "low",
    dueDate: "2025-01-15",
    acknowledged: false,
    species: "sheep"
  }
];

// Demo performance data
export const demoPerformanceData = {
  weightGain: [
    { date: "2024-12-01", cattle: 2.1, sheep: 0.3, goats: 0.25 },
    { date: "2024-12-15", cattle: 2.3, sheep: 0.35, goats: 0.28 },
    { date: "2025-01-01", cattle: 2.0, sheep: 0.32, goats: 0.26 },
  ],
  production: {
    milkProduction: 45.2, // gallons per day
    conception_rate: 92,
    calf_survival: 98,
    average_weaning_weight: 585
  },
  financial: {
    revenue: 15750,
    expenses: 8920,
    profit: 6830,
    profitMargin: 43.4
  }
};

// Demo plant identification data
export const demoPlantData = [
  { 
    id: 1, 
    name: "Bermuda Grass", 
    scientificName: "Cynodon dactylon",
    confidence: 0.94,
    nutritionalValue: { protein: 12, energy: 58, palatability: "high" },
    description: "Warm-season perennial grass, excellent for grazing"
  },
  { 
    id: 2, 
    name: "White Clover", 
    scientificName: "Trifolium repens",
    confidence: 0.89,
    nutritionalValue: { protein: 22, energy: 65, palatability: "very high" },
    description: "Nitrogen-fixing legume, highly nutritious"
  },
  { 
    id: 3, 
    name: "Tall Fescue", 
    scientificName: "Festuca arundinacea",
    confidence: 0.91,
    nutritionalValue: { protein: 14, energy: 62, palatability: "medium" },
    description: "Cool-season grass, drought tolerant"
  }
];

// Demo financial data
export const demoFinancialData = {
  overview: {
    totalRevenue: 125750,
    totalExpenses: 78920,
    netProfit: 46830,
    profitMargin: 37.2
  },
  monthlyData: [
    { month: "Jan", revenue: 12500, expenses: 8200, profit: 4300 },
    { month: "Feb", revenue: 11800, expenses: 7900, profit: 3900 },
    { month: "Mar", revenue: 13200, expenses: 8500, profit: 4700 },
    { month: "Apr", revenue: 14100, expenses: 9100, profit: 5000 },
    { month: "May", revenue: 15600, expenses: 9800, profit: 5800 },
    { month: "Jun", revenue: 16200, expenses: 10200, profit: 6000 }
  ],
  categories: [
    { name: "Cattle Sales", amount: 89500, type: "revenue" },
    { name: "Sheep Sales", amount: 24750, type: "revenue" },
    { name: "Feed Costs", amount: 32100, type: "expense" },
    { name: "Veterinary", amount: 8900, type: "expense" },
    { name: "Equipment", amount: 15200, type: "expense" }
  ]
};

// Demo soil health data
export const demoSoilData = {
  tests: [
    { paddockId: 1, ph: 6.8, organicMatter: 3.2, nitrogen: 45, phosphorus: 25, potassium: 180, testDate: "2024-11-15" },
    { paddockId: 2, ph: 6.2, organicMatter: 2.8, nitrogen: 38, phosphorus: 18, potassium: 145, testDate: "2024-11-15" },
    { paddockId: 3, ph: 7.1, organicMatter: 3.6, nitrogen: 52, phosphorus: 32, potassium: 195, testDate: "2024-11-15" }
  ],
  carbonSequestration: 2.4, // tons per acre per year
  recommendations: [
    { paddockId: 2, recommendation: "Apply lime to raise pH to 6.5-7.0 range", priority: "high" },
    { paddockId: 1, recommendation: "Consider phosphorus supplement", priority: "medium" }
  ]
};

// Demo market data
export const demoMarketData = {
  prices: {
    cattle: { current: 1.85, change: 0.12, trend: "up" },
    sheep: { current: 2.45, change: -0.05, trend: "down" },
    goats: { current: 2.15, change: 0.08, trend: "up" },
    hay: { current: 185, change: 15, trend: "up" }
  },
  opportunities: [
    { type: "Premium Market", description: "Grass-fed beef premium: +$0.25/lb", potential: "+15% revenue" },
    { type: "Direct Sales", description: "Farmers market opportunity", potential: "+22% margins" }
  ]
};

// Demo analytics data  
export const demoAnalyticsData = {
  farmStats: {
    totalAcreage: 91.6,
    totalAnimals: 85,
    activeTools: 12,
    completedAssessments: 8
  },
  toolUsage: [
    { tool: "Grazing Calendar", usage: 24, category: "Planning" },
    { tool: "Water Requirements", usage: 18, category: "Daily Operations" },
    { tool: "AU Calculator", usage: 15, category: "Assessment" },
    { tool: "Pasture Assessment", usage: 12, category: "Assessment" },
    { tool: "Performance Analytics", usage: 10, category: "Analysis" }
  ],
  insights: [
    "Your rotation schedule is 23% more efficient than regional average",
    "Water consumption patterns suggest optimal animal health",
    "Pasture recovery times have improved 18% this season"
  ],
  // Demo usage analytics data matching API format
  usageData: [
    { date: "2025-01-05", tools: 8, assessments: 3, decisions: 12 },
    { date: "2025-01-04", tools: 6, assessments: 2, decisions: 9 },
    { date: "2025-01-03", tools: 12, assessments: 4, decisions: 15 },
    { date: "2025-01-02", tools: 5, assessments: 1, decisions: 7 },
    { date: "2025-01-01", tools: 9, assessments: 3, decisions: 11 },
    { date: "2024-12-31", tools: 7, assessments: 2, decisions: 8 },
    { date: "2024-12-30", tools: 11, assessments: 3, decisions: 14 },
    { date: "2024-12-29", tools: 4, assessments: 1, decisions: 6 },
    { date: "2024-12-28", tools: 8, assessments: 2, decisions: 10 },
    { date: "2024-12-27", tools: 6, assessments: 2, decisions: 8 },
    { date: "2024-12-26", tools: 10, assessments: 4, decisions: 13 },
    { date: "2024-12-25", tools: 3, assessments: 1, decisions: 4 },
    { date: "2024-12-24", tools: 7, assessments: 2, decisions: 9 },
    { date: "2024-12-23", tools: 9, assessments: 3, decisions: 12 },
    { date: "2024-12-22", tools: 5, assessments: 1, decisions: 7 },
    { date: "2024-12-21", tools: 8, assessments: 3, decisions: 11 },
    { date: "2024-12-20", tools: 12, assessments: 4, decisions: 16 },
    { date: "2024-12-19", tools: 6, assessments: 2, decisions: 8 },
    { date: "2024-12-18", tools: 9, assessments: 3, decisions: 12 },
    { date: "2024-12-17", tools: 7, assessments: 2, decisions: 9 },
    { date: "2024-12-16", tools: 11, assessments: 4, decisions: 14 },
    { date: "2024-12-15", tools: 4, assessments: 1, decisions: 5 },
    { date: "2024-12-14", tools: 8, assessments: 3, decisions: 10 },
    { date: "2024-12-13", tools: 6, assessments: 2, decisions: 8 },
    { date: "2024-12-12", tools: 10, assessments: 3, decisions: 13 },
    { date: "2024-12-11", tools: 5, assessments: 1, decisions: 6 },
    { date: "2024-12-10", tools: 9, assessments: 3, decisions: 11 },
    { date: "2024-12-09", tools: 7, assessments: 2, decisions: 9 },
    { date: "2024-12-08", tools: 8, assessments: 3, decisions: 10 },
    { date: "2024-12-07", tools: 6, assessments: 2, decisions: 8 }
  ],
  // Demo tool usage data with tool names and metrics
  demoToolUsageData: [
    { id: 1, toolId: 1, toolName: "Farm Profile Setup", usageCount: 1, lastUsedAt: "2025-01-01", isActive: true, complexityLevel: "basic" },
    { id: 2, toolId: 4, toolName: "GPS Location Tools", usageCount: 15, lastUsedAt: "2025-01-05", isActive: true, complexityLevel: "intermediate" },
    { id: 3, toolId: 5, toolName: "Animal Unit Calculator", usageCount: 12, lastUsedAt: "2025-01-04", isActive: true, complexityLevel: "intermediate" },
    { id: 4, toolId: 7, toolName: "Daily Water Requirements", usageCount: 18, lastUsedAt: "2025-01-05", isActive: true, complexityLevel: "basic" },
    { id: 5, toolId: 9, toolName: "Enhanced Pasture Assessment", usageCount: 8, lastUsedAt: "2025-01-03", isActive: true, complexityLevel: "intermediate" },
    { id: 6, toolId: 12, toolName: "Performance Analytics", usageCount: 22, lastUsedAt: "2025-01-05", isActive: true, complexityLevel: "advanced" },
    { id: 7, toolId: 15, toolName: "Weather Integration", usageCount: 25, lastUsedAt: "2025-01-05", isActive: true, complexityLevel: "intermediate" },
    { id: 8, toolId: 16, toolName: "Alert System", usageCount: 14, lastUsedAt: "2025-01-04", isActive: true, complexityLevel: "basic" },
    { id: 9, toolId: 17, toolName: "Enhanced Grazing Calendar", usageCount: 28, lastUsedAt: "2025-01-05", isActive: true, complexityLevel: "advanced" },
    { id: 10, toolId: 18, toolName: "Livestock Health & Breeding", usageCount: 6, lastUsedAt: "2025-01-02", isActive: true, complexityLevel: "intermediate" },
    { id: 11, toolId: 23, toolName: "Educational Content & Training", usageCount: 11, lastUsedAt: "2025-01-03", isActive: true, complexityLevel: "basic" },
    { id: 12, toolId: 24, toolName: "Data Analytics & Reporting Hub", usageCount: 19, lastUsedAt: "2025-01-05", isActive: true, complexityLevel: "intermediate" }
  ]
};

// Helper function to get demo data if in demo mode, otherwise return real data
export function useDemoData<T>(realData: T, demoData: T): T {
  const demoModeActive = isDemoMode();
  
  // If demo mode is active, always use demo data
  if (demoModeActive) {
    return demoData;
  }
  
  // If not in demo mode, use real data
  return realData;
}