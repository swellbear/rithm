// Seasonal Badge Component - Shows current season and complexity level

import { Badge } from "@/components/ui/badge";
import { 
  Sun, 
  Cloud, 
  Leaf, 
  Snowflake 
} from "lucide-react";
import type { Season, ComplexityLevel } from "@/lib/seasonal-adaptation";

interface SeasonalBadgeProps {
  season: Season;
  complexityLevel: ComplexityLevel;
  className?: string;
}

export function SeasonalBadge({ season, complexityLevel, className = "" }: SeasonalBadgeProps) {
  const getSeasonIcon = (season: Season) => {
    switch (season) {
      case 'spring': return <Leaf className="h-3 w-3 text-green-600" />;
      case 'summer': return <Sun className="h-3 w-3 text-yellow-600" />;
      case 'fall': return <Leaf className="h-3 w-3 text-orange-600" />;
      case 'winter': return <Snowflake className="h-3 w-3 text-blue-600" />;
    }
  };

  const getSeasonColor = (season: Season) => {
    switch (season) {
      case 'spring': return 'bg-green-100 text-green-800 border-green-300';
      case 'summer': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'fall': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'winter': return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getComplexityColor = (level: ComplexityLevel) => {
    switch (level) {
      case 'beginner': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className={`${getSeasonColor(season)} flex items-center gap-1`}>
        {getSeasonIcon(season)}
        {season.charAt(0).toUpperCase() + season.slice(1)}
      </Badge>
      <Badge variant="outline" className={getComplexityColor(complexityLevel)}>
        {complexityLevel.charAt(0).toUpperCase() + complexityLevel.slice(1)}
      </Badge>
    </div>
  );
}