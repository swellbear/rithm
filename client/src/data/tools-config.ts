export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: 'core' | 'assessment' | 'planning' | 'monitoring' | 'advanced' | 'enterprise';
  minTier: 'free' | 'small_farm' | 'professional' | 'enterprise';
  complexity: 'basic' | 'intermediate' | 'advanced';
}

export const allTools: Tool[] = [
  // Core Management Tools
  {
    id: 'farm-profile',
    name: 'Farm Profile Setup',
    description: 'Configure your farm details and preferences',
    icon: 'Settings',
    route: '/farm-profile',
    category: 'core',
    minTier: 'free',
    complexity: 'basic'
  },
  {
    id: 'paddock-management',
    name: 'Paddock Management',
    description: 'Manage your fields and pastures',
    icon: 'Map',
    route: '/paddock-management',
    category: 'core',
    minTier: 'free',
    complexity: 'basic'
  },
  {
    id: 'herd-management',
    name: 'Herd Management',
    description: 'Track and manage your livestock',
    icon: 'Users',
    route: '/herd-management',
    category: 'core',
    minTier: 'free',
    complexity: 'basic'
  },
  {
    id: 'gps-location',
    name: 'GPS Location Tools',
    description: 'Professional GPS tracking and mapping',
    icon: 'MapPin',
    route: '/gps-location-tools',
    category: 'core',
    minTier: 'small_farm',
    complexity: 'intermediate'
  },
  {
    id: 'au-calculator',
    name: 'AU Calculator',
    description: 'Calculate animal units for stocking rates',
    icon: 'Calculator',
    route: '/au-calculator',
    category: 'core',
    minTier: 'free',
    complexity: 'basic'
  },

  // Assessment Tools
  {
    id: 'dm-availability',
    name: 'DM Availability',
    description: 'Calculate dry matter availability',
    icon: 'Leaf',
    route: '/dm-availability',
    category: 'assessment',
    minTier: 'small_farm',
    complexity: 'intermediate'
  },
  {
    id: 'water-requirements',
    name: 'Daily Water Requirements',
    description: 'Calculate livestock water needs',
    icon: 'Droplet',
    route: '/water-requirements',
    category: 'assessment',
    minTier: 'small_farm',
    complexity: 'basic'
  },
  {
    id: 'water-management',
    name: 'Water Management',
    description: 'Comprehensive water source management and consumption tracking',
    icon: 'Droplet',
    route: '/water-management',
    category: 'core',
    minTier: 'professional',
    complexity: 'advanced'
  },
  {
    id: 'feed-supplement',
    name: 'Feed Supplement Calculator',
    description: 'Optimize supplemental feeding',
    icon: 'Package',
    route: '/feed-supplement-calculator',
    category: 'assessment',
    minTier: 'professional',
    complexity: 'advanced'
  },
  {
    id: 'pasture-assessment',
    name: 'Enhanced Pasture Assessment',
    description: 'Scientific pasture evaluation',
    icon: 'FileSearch',
    route: '/enhanced-pasture-assessment',
    category: 'assessment',
    minTier: 'small_farm',
    complexity: 'intermediate'
  },
  {
    id: 'plant-identification',
    name: 'Plant Identification',
    description: 'AI-powered plant species recognition',
    icon: 'Camera',
    route: '/plant-identification',
    category: 'assessment',
    minTier: 'professional',
    complexity: 'advanced'
  },
  {
    id: 'nutritional-analysis',
    name: 'Nutritional Analysis',
    description: 'Comprehensive feed analysis',
    icon: 'BarChart',
    route: '/nutritional-analysis',
    category: 'assessment',
    minTier: 'professional',
    complexity: 'advanced'
  },

  // Planning Tools
  {
    id: 'grazing-calendar',
    name: 'Enhanced Grazing Calendar',
    description: 'AI-optimized rotation scheduling',
    icon: 'Calendar',
    route: '/enhanced-grazing-calendar',
    category: 'planning',
    minTier: 'small_farm',
    complexity: 'intermediate'
  },
  {
    id: 'brush-hog',
    name: 'Brush Hog Recommendations',
    description: 'Intelligent maintenance scheduling',
    icon: 'Scissors',
    route: '/brush-hog-recommendations',
    category: 'planning',
    minTier: 'professional',
    complexity: 'intermediate'
  },

  // Monitoring Tools
  {
    id: 'weather-integration',
    name: 'Weather Integration',
    description: 'Agricultural weather intelligence',
    icon: 'Cloud',
    route: '/weather-integration',
    category: 'monitoring',
    minTier: 'free',
    complexity: 'basic'
  },
  {
    id: 'alert-system',
    name: 'Alert System',
    description: 'Proactive farm monitoring',
    icon: 'Bell',
    route: '/alert-system',
    category: 'monitoring',
    minTier: 'small_farm',
    complexity: 'intermediate'
  },
  {
    id: 'performance-analytics',
    name: 'Performance Analytics',
    description: 'Track farm performance metrics',
    icon: 'TrendingUp',
    route: '/performance-analytics',
    category: 'monitoring',
    minTier: 'professional',
    complexity: 'advanced'
  },
  {
    id: 'health-breeding',
    name: 'Livestock Health & Breeding',
    description: 'Health monitoring and breeding management',
    icon: 'Heart',
    route: '/livestock-health-breeding',
    category: 'monitoring',
    minTier: 'professional',
    complexity: 'advanced'
  },

  // Advanced Tools
  {
    id: 'financial-management',
    name: 'Financial Management',
    description: 'Farm financial analysis',
    icon: 'DollarSign',
    route: '/financial-management',
    category: 'advanced',
    minTier: 'professional',
    complexity: 'advanced'
  },
  {
    id: 'educational-content',
    name: 'Educational Content',
    description: 'Personalized learning paths',
    icon: 'BookOpen',
    route: '/educational-content',
    category: 'advanced',
    minTier: 'professional',
    complexity: 'intermediate'
  },

  // Enterprise Tools
  {
    id: 'soil-health',
    name: 'Soil Health & Pasture Improvement',
    description: 'Regenerative agriculture system',
    icon: 'Sprout',
    route: '/soil-health-pasture-improvement',
    category: 'enterprise',
    minTier: 'enterprise',
    complexity: 'advanced'
  },
  {
    id: 'infrastructure-equipment',
    name: 'Infrastructure & Equipment',
    description: 'IoT-powered asset management',
    icon: 'Wrench',
    route: '/infrastructure-equipment',
    category: 'enterprise',
    minTier: 'enterprise',
    complexity: 'advanced'
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis & Supply Chain',
    description: 'Market intelligence and trading',
    icon: 'LineChart',
    route: '/market-analysis',
    category: 'enterprise',
    minTier: 'enterprise',
    complexity: 'advanced'
  },
  {
    id: 'analytics-hub',
    name: 'Data Analytics Hub',
    description: 'Comprehensive farm analytics',
    icon: 'Database',
    route: '/analytics-hub',
    category: 'enterprise',
    minTier: 'enterprise',
    complexity: 'advanced'
  }
];

// Tool access by subscription tier
export const tierToolAccess = {
  free: [
    'farm-profile',
    'paddock-management', // limited to 5
    'herd-management', // limited to 50 animals
    'au-calculator',
    'weather-integration'
  ],
  small_farm: [
    // All free tools plus:
    'gps-location',
    'dm-availability',
    'water-requirements',
    'pasture-assessment',
    'grazing-calendar',
    'alert-system'
  ],
  professional: [
    // All small_farm tools plus:
    'feed-supplement',
    'plant-identification',
    'nutritional-analysis',
    'performance-analytics',
    'brush-hog',
    'health-breeding',
    'financial-management',
    'educational-content'
  ],
  enterprise: [
    // All tools
    'soil-health',
    'infrastructure-equipment',
    'market-analysis',
    'analytics-hub'
  ]
};

// Get tools available for a subscription tier
export function getAvailableTools(tier: string): Tool[] {
  const availableIds = new Set<string>();
  
  // Add tools based on tier hierarchy
  if (tier === 'free' || tier === 'small_farm' || tier === 'professional' || tier === 'enterprise') {
    tierToolAccess.free.forEach(id => availableIds.add(id));
  }
  if (tier === 'small_farm' || tier === 'professional' || tier === 'enterprise') {
    tierToolAccess.small_farm.forEach(id => availableIds.add(id));
  }
  if (tier === 'professional' || tier === 'enterprise') {
    tierToolAccess.professional.forEach(id => availableIds.add(id));
  }
  if (tier === 'enterprise') {
    tierToolAccess.enterprise.forEach(id => availableIds.add(id));
  }
  
  return allTools.filter(tool => availableIds.has(tool.id));
}

// Group tools by category
export function groupToolsByCategory(tools: Tool[]) {
  return tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);
}