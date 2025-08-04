// Context Intelligence Display - Shows smart routing decisions

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Users, 
  Map, 
  TrendingUp, 
  Brain,
  Route,
  Zap
} from "lucide-react";
import type { FarmContext } from "@/lib/smart-gateway-intelligence";

interface ContextIntelligenceDisplayProps {
  farmContext: FarmContext;
  className?: string;
}

export function ContextIntelligenceDisplay({ farmContext, className = "" }: ContextIntelligenceDisplayProps) {
  const { 
    animals = [], 
    paddocks = [], 
    assessments = [], 
    tier = 'basic', 
    season = 'spring', 
    location = {}, 
    user = null 
  } = farmContext || {};
  
  const getContextInsights = () => {
    const insights = [];
    
    // Farm completeness insight
    const dataCompleteness = [
      (animals?.length || 0) > 0 ? 'Animals' : null,
      (paddocks?.length || 0) > 0 ? 'Paddocks' : null,
      (assessments?.length || 0) > 0 ? 'Assessments' : null,
      location?.zipCode ? 'Location' : null
    ].filter(Boolean);
    
    insights.push({
      type: 'Farm Setup',
      icon: <TrendingUp className="h-4 w-4" />,
      value: `${dataCompleteness.length}/4 complete`,
      detail: dataCompleteness.join(', ') || 'None',
      color: dataCompleteness.length >= 3 ? 'text-green-600' : dataCompleteness.length >= 2 ? 'text-yellow-600' : 'text-red-600'
    });

    // Scale insight
    const farmScale = (animals?.length || 0) + ((paddocks?.length || 0) * 5); // Rough farm scale
    let scaleCategory = 'Hobby';
    if (farmScale > 100) scaleCategory = 'Commercial';
    else if (farmScale > 25) scaleCategory = 'Small Business';
    
    insights.push({
      type: 'Farm Scale',
      icon: <Users className="h-4 w-4" />,
      value: scaleCategory,
      detail: `${animals?.length || 0} animals, ${paddocks?.length || 0} paddocks`,
      color: 'text-blue-600'
    });

    // Experience insight
    const experienceFactors = [
      (assessments?.length || 0) > 5 ? 'Regular assessments' : null,
      (paddocks?.length || 0) > 10 ? 'Complex layout' : null,
      (animals?.length || 0) > 50 ? 'Large herd' : null,
      tier === 'enterprise' ? 'Enterprise tier' : null
    ].filter(Boolean);
    
    insights.push({
      type: 'Experience Level',
      icon: <Brain className="h-4 w-4" />,
      value: experienceFactors.length > 2 ? 'Advanced' : experienceFactors.length > 0 ? 'Intermediate' : 'Beginner',
      detail: experienceFactors.join(', ') || 'Building foundation',
      color: experienceFactors.length > 2 ? 'text-purple-600' : experienceFactors.length > 0 ? 'text-blue-600' : 'text-gray-600'
    });

    // Location insight
    if (location?.zipCode) {
      insights.push({
        type: 'Location Context',
        icon: <MapPin className="h-4 w-4" />,
        value: location.zipCode,
        detail: `${season} season adaptations active`,
        color: 'text-green-600'
      });
    }

    return insights;
  };

  const getRoutingIntelligence = () => {
    const routes = [];
    
    // Animal check routing logic
    if (animals.length === 0) {
      routes.push({
        task: 'Livestock Management',
        route: 'Setup → Livestock Management',
        reasoning: 'No animals tracked, routing to setup first',
        intelligence: 'Context-aware redirect'
      });
    } else if (animals.length > 50) {
      routes.push({
        task: 'Livestock Management', 
        route: 'Advanced → Precision Monitoring',
        reasoning: 'Large herd requires systematic approach',
        intelligence: 'Scale-based routing'
      });
    }

    // Pasture routing logic
    if (paddocks.length === 0) {
      routes.push({
        task: 'Walk Pastures',
        route: 'GPS Mapping → Boundary Setup', 
        reasoning: 'No paddocks mapped, GPS tracking needed',
        intelligence: 'Prerequisite detection'
      });
    } else if (assessments.length === 0) {
      routes.push({
        task: 'Walk Pastures',
        route: 'Guided Assessment → Data Collection',
        reasoning: 'No baseline data, structured approach needed',
        intelligence: 'Experience-based routing'
      });
    }

    // Tier-based routing
    if (tier === 'enterprise') {
      routes.push({
        task: 'Review Performance',
        route: 'Financial Management → ROI Analysis',
        reasoning: 'Enterprise tier gets advanced financial tools',
        intelligence: 'Tier-optimized routing'
      });
    }

    return routes;
  };

  const insights = getContextInsights();
  const routingLogic = getRoutingIntelligence();

  return (
    <Card className={`border-gray-200 dark:border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Smart Gateway Intelligence
        </CardTitle>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Context-aware routing and farm-specific adaptations
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Insights */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Farm Context Analysis
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="flex items-center gap-2">
                  <span className={insight.color}>{insight.icon}</span>
                  <span className="text-sm font-medium">{insight.type}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${insight.color}`}>{insight.value}</div>
                  <div className="text-xs text-gray-500">{insight.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligent Routing */}
        {routingLogic.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Route className="h-4 w-4" />
              Smart Routing Logic
            </h4>
            <div className="space-y-2">
              {routingLogic.map((route, i) => (
                <div key={i} className="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-blue-800 dark:text-blue-200">{route.task}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">{route.route}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">{route.reasoning}</div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900">
                      {route.intelligence}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Adaptations */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Map className="h-4 w-4" />
            Active Adaptations
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {season.charAt(0).toUpperCase() + season.slice(1)} priorities
            </Badge>
            <Badge variant="outline" className="text-xs">
              {tier.replace('_', ' ')} tier routing
            </Badge>
            {animals.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {animals.length} animal scale
              </Badge>
            )}
            {paddocks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {paddocks.length} paddock complexity
              </Badge>
            )}
            {location?.zipCode && (
              <Badge variant="outline" className="text-xs">
                Location-aware
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}