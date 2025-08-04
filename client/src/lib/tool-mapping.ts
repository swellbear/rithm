// Tool mapping for Smart Gateway navigation
export const TOOL_ROUTES: Record<number, string> = {
  1: "/onboarding",
  4: "/gps-location-tools", 
  5: "/au-calculator",
  6: "/dm-availability",
  7: "/water-requirements",
  8: "/feed-supplement-calculator",
  9: "/enhanced-pasture-assessment",
  10: "/plant-identification",
  11: "/nutritional-analysis", 
  12: "/performance-analytics",
  13: "/daily-needs",
  14: "/brush-hog-recommendations",
  15: "/weather-integration",
  16: "/alert-system",
  17: "/enhanced-grazing-calendar",
  18: "/livestock-health-breeding",
  19: "/financial-management",
  20: "/soil-health-pasture-improvement",
  21: "/infrastructure-equipment",
  22: "/market-analysis",
  23: "/educational-content",
  24: "/analytics"
};

export const TOOL_NAMES: Record<number, string> = {
  1: "Farm Profile Setup",
  4: "GPS Location Tools",
  5: "AU Calculator", 
  6: "DM Availability",
  7: "Water Requirements",
  8: "Feed Supplement Calculator",
  9: "Enhanced Pasture Assessment",
  10: "Plant Identification",
  11: "Nutritional Analysis",
  12: "Performance Analytics", 
  13: "Daily Needs Calculator",
  14: "Brush Hog Recommendations",
  15: "Weather Integration",
  16: "Alert System",
  17: "Enhanced Grazing Calendar",
  18: "Livestock Health & Breeding",
  19: "Financial Management",
  20: "Soil Health & Pasture Improvement", 
  21: "Infrastructure & Equipment",
  22: "Market Analysis",
  23: "Educational Content & Training",
  24: "Data Analytics Hub"
};

export const TOOL_CATEGORIES: Record<string, number[]> = {
  "assess": [6, 9, 10, 11, 15, 20],
  "manage": [1, 4, 7, 8, 13, 14, 16, 17, 18],
  "optimize": [5, 12, 19, 21, 22, 23, 24]
};

export function getToolRoute(toolId: number): string {
  return TOOL_ROUTES[toolId] || "/tools";
}

export function getToolName(toolId: number): string {
  return TOOL_NAMES[toolId] || `Tool ${toolId}`;
}