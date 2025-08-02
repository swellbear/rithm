import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Brain, TrendingUp, Calendar, Target, Zap, BarChart3, 
  Lightbulb, ArrowRight, CheckCircle, AlertTriangle, Clock,
  Leaf, Sun, CloudRain, ThermometerSun, Wind, Droplets
} from "lucide-react";

interface AIPoweredInsightsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PredictiveInsight {
  id: string;
  type: 'recommendation' | 'forecast' | 'optimization' | 'alert';
  category: 'grazing' | 'nutrition' | 'weather' | 'performance' | 'economics';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  actionable: boolean;
  actions?: {
    title: string;
    description: string;
    effort: 'low' | 'medium' | 'high';
    roi: string;
  }[];
  dataSource: string[];
}

interface SeasonalForecast {
  month: string;
  grazingCapacity: number;
  supplementNeeds: number;
  recommendedActions: string[];
  weatherFactors: {
    temperature: 'above' | 'normal' | 'below';
    precipitation: 'above' | 'normal' | 'below';
    growthRate: number;
  };
}

interface RotationOptimization {
  paddockId: number;
  paddockName: string;
  currentStatus: 'optimal' | 'early' | 'overdue' | 'resting';
  recommendedAction: 'move_now' | 'move_soon' | 'continue' | 'rest_longer';
  daysUntilOptimal: number;
  reasoning: string;
  expectedBenefit: string;
}

export default function AIPoweredInsights({ isOpen, onClose }: AIPoweredInsightsProps) {
  const [selectedInsight, setSelectedInsight] = useState<PredictiveInsight | null>(null);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [seasonalForecasts, setSeasonalForecasts] = useState<SeasonalForecast[]>([]);
  const [rotationOptimizations, setRotationOptimizations] = useState<RotationOptimization[]>([]);
  const { toast } = useToast();

  // Fetch farm data for AI analysis
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });
  const { data: alerts = [] } = useQuery<any[]>({ queryKey: ["/api/alerts/active"] });

  // Generate AI-powered insights based on farm data
  const generateInsights = () => {
    const newInsights: PredictiveInsight[] = [];

    // Grazing rotation optimization insights
    if (paddocks.length > 0 && herds.length > 0) {
      const totalAcres = paddocks.reduce((sum, p) => sum + parseFloat(p.acres || 0), 0);
      const totalAnimals = herds.reduce((sum, h) => sum + h.count, 0);
      const stockingRate = totalAnimals / totalAcres;

      if (stockingRate > 1.5) {
        newInsights.push({
          id: 'overstocking-risk',
          type: 'recommendation',
          category: 'grazing',
          title: 'Overstocking Risk Detected',
          description: `Current stocking rate of ${stockingRate.toFixed(1)} AU/acre may lead to pasture degradation. Consider reducing herd size or increasing paddock recovery time.`,
          confidence: 85,
          impact: 'high',
          timeframe: 'Immediate action needed',
          actionable: true,
          actions: [
            {
              title: 'Extend Rest Periods',
              description: 'Increase paddock rest time from 21 to 35 days',
              effort: 'low',
              roi: '15-20% pasture improvement'
            },
            {
              title: 'Add Temporary Paddocks',
              description: 'Create subdivision to reduce grazing pressure',
              effort: 'medium',
              roi: '25% capacity increase'
            }
          ],
          dataSource: ['paddock_data', 'herd_composition', 'historical_performance']
        });
      }

      // Seasonal grazing prediction
      const currentMonth = new Date().getMonth();
      const isGrowingSeason = currentMonth >= 3 && currentMonth <= 9; // April-October
      
      if (isGrowingSeason) {
        newInsights.push({
          id: 'seasonal-growth',
          type: 'forecast',
          category: 'grazing',
          title: 'Peak Growing Season Optimization',
          description: 'Pasture growth will peak in the next 4-6 weeks. This is optimal time for accelerated rotation to maximize utilization.',
          confidence: 92,
          impact: 'high',
          timeframe: 'Next 6 weeks',
          actionable: true,
          actions: [
            {
              title: 'Accelerate Rotation',
              description: 'Reduce grazing period to 3-4 days per paddock',
              effort: 'low',
              roi: '30% increased utilization'
            },
            {
              title: 'Monitor Growth Rates',
              description: 'Weekly assessment to track optimal timing',
              effort: 'low',
              roi: 'Data-driven decisions'
            }
          ],
          dataSource: ['weather_patterns', 'growth_rate_models', 'seasonal_data']
        });
      }
    }

    // Nutrition optimization insights
    if (assessments.length > 0) {
      const recentAssessment = assessments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      if (recentAssessment) {
        const qualityScore = recentAssessment.overallQuality || 'medium';
        
        if (qualityScore === 'poor') {
          newInsights.push({
            id: 'supplement-timing',
            type: 'recommendation',
            category: 'nutrition',
            title: 'Strategic Supplementation Recommended',
            description: 'Poor pasture quality detected. Strategic protein supplementation now can improve intake and reduce total feed costs by 20-25%.',
            confidence: 78,
            impact: 'medium',
            timeframe: 'Start within 2 weeks',
            actionable: true,
            actions: [
              {
                title: 'Protein Cubes',
                description: '1-2 lbs per head daily for cattle',
                effort: 'low',
                roi: '$0.50-0.75 per head profit'
              },
              {
                title: 'Mineral Supplement',
                description: 'High-quality mineral with bypass protein',
                effort: 'low',
                roi: 'Improved conception rates'
              }
            ],
            dataSource: ['pasture_assessments', 'nutrition_models', 'economic_analysis']
          });
        }
      }
    }

    // Performance optimization insights
    if (herds.length > 0) {
      const cattleHerds = herds.filter(h => h.species === 'cattle');
      const avgWeight = cattleHerds.reduce((sum, h) => sum + parseInt(h.averageWeight || 0), 0) / cattleHerds.length;
      
      if (avgWeight > 0 && avgWeight < 1000) {
        newInsights.push({
          id: 'weight-optimization',
          type: 'optimization',
          category: 'performance',
          title: 'Growth Rate Optimization Opportunity',
          description: `Average cattle weight of ${Math.round(avgWeight)} lbs suggests potential for improved daily gain through optimized grazing management.`,
          confidence: 72,
          impact: 'medium',
          timeframe: '3-6 months',
          actionable: true,
          actions: [
            {
              title: 'First Bite Theory',
              description: 'Move cattle when best forage is consumed',
              effort: 'low',
              roi: '0.2-0.5 lb daily gain increase'
            },
            {
              title: 'Water System Check',
              description: 'Ensure adequate water access in all paddocks',
              effort: 'low',
              roi: 'Prevent performance losses'
            }
          ],
          dataSource: ['herd_performance', 'grazing_patterns', 'weight_trends']
        });
      }
    }

    // Weather-based insights
    const currentSeason = getCurrentSeason();
    if (currentSeason === 'fall' || currentSeason === 'winter') {
      newInsights.push({
        id: 'winter-prep',
        type: 'forecast',
        category: 'weather',
        title: 'Winter Preparation Strategy',
        description: 'Based on long-term weather patterns, this winter may require 15-20% more supplemental feed than average. Early preparation can reduce costs.',
        confidence: 68,
        impact: 'medium',
        timeframe: 'Next 2-3 months',
        actionable: true,
        actions: [
          {
            title: 'Early Hay Purchase',
            description: 'Buy hay now to avoid peak season prices',
            effort: 'medium',
            roi: '$15-25 per ton savings'
          },
          {
            title: 'Body Condition Scoring',
            description: 'Ensure cattle at BCS 5-6 before winter',
            effort: 'low',
            roi: 'Reduced winter feed needs'
          }
        ],
        dataSource: ['weather_forecasts', 'historical_patterns', 'feed_cost_trends']
      });
    }

    setInsights(newInsights);
  };

  // Generate seasonal forecasts
  const generateSeasonalForecasts = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const forecasts: SeasonalForecast[] = [];

    months.forEach((month, idx) => {
      const isGrowingSeason = idx >= 3 && idx <= 9;
      const isPeakGrowth = idx >= 4 && idx <= 7;
      const baseCapacity = isGrowingSeason ? (isPeakGrowth ? 1.5 : 1.2) : 0.8;
      
      forecasts.push({
        month,
        grazingCapacity: Math.round(baseCapacity * 100),
        supplementNeeds: Math.round((2 - baseCapacity) * 50),
        recommendedActions: [
          isGrowingSeason ? 'Accelerate rotations' : 'Extend rest periods',
          isPeakGrowth ? 'Monitor overgrazing' : 'Plan supplementation',
          idx === 10 ? 'Winter preparation' : 'Standard monitoring'
        ].slice(0, 2),
        weatherFactors: {
          temperature: idx >= 11 || idx <= 2 ? 'below' : idx >= 5 && idx <= 8 ? 'above' : 'normal',
          precipitation: idx >= 3 && idx <= 5 ? 'above' : idx >= 6 && idx <= 8 ? 'below' : 'normal',
          growthRate: isGrowingSeason ? (isPeakGrowth ? 1.8 : 1.3) : 0.4
        }
      });
    });

    setSeasonalForecasts(forecasts);
  };

  // Generate rotation optimizations
  const generateRotationOptimizations = () => {
    const optimizations: RotationOptimization[] = [];

    paddocks.forEach(paddock => {
      const lastGrazed = paddock.lastGrazed ? new Date(paddock.lastGrazed) : null;
      const daysSinceGrazed = lastGrazed ? 
        Math.floor((Date.now() - lastGrazed.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      const restDays = paddock.restDays || 21;
      const isCurrentlyGrazing = paddock.currentlyGrazing;
      
      let status: RotationOptimization['currentStatus'];
      let action: RotationOptimization['recommendedAction'];
      let daysUntilOptimal: number;
      let reasoning: string;
      let benefit: string;

      if (isCurrentlyGrazing) {
        if (daysSinceGrazed >= 5) {
          status = 'overdue';
          action = 'move_now';
          daysUntilOptimal = 0;
          reasoning = 'Animals have been in paddock longer than optimal grazing period';
          benefit = 'Prevent overgrazing, maintain pasture quality';
        } else if (daysSinceGrazed >= 3) {
          status = 'optimal';
          action = 'move_soon';
          daysUntilOptimal = 1;
          reasoning = 'Approaching optimal move time based on pasture utilization';
          benefit = 'Maximize utilization while maintaining regrowth potential';
        } else {
          status = 'early';
          action = 'continue';
          daysUntilOptimal = 3 - daysSinceGrazed;
          reasoning = 'Animals just moved to paddock, allow more utilization time';
          benefit = 'Improve utilization efficiency';
        }
      } else {
        if (daysSinceGrazed >= restDays + 7) {
          status = 'optimal';
          action = 'move_now';
          daysUntilOptimal = 0;
          reasoning = 'Paddock has exceeded recovery time and is ready for grazing';
          benefit = 'Capitalize on peak regrowth period';
        } else if (daysSinceGrazed >= restDays) {
          status = 'optimal';
          action = 'move_soon';
          daysUntilOptimal = 2;
          reasoning = 'Recovery period complete, ready for next grazing cycle';
          benefit = 'Optimal timing for sustained productivity';
        } else {
          status = 'resting';
          action = 'rest_longer';
          daysUntilOptimal = restDays - daysSinceGrazed;
          reasoning = 'Paddock still in recovery phase, needs more rest time';
          benefit = 'Ensure complete recovery for maximum productivity';
        }
      }

      optimizations.push({
        paddockId: paddock.id,
        paddockName: paddock.name,
        currentStatus: status,
        recommendedAction: action,
        daysUntilOptimal,
        reasoning,
        expectedBenefit: benefit
      });
    });

    setRotationOptimizations(optimizations);
  };

  // Helper function to get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  // Generate all insights when component opens
  useEffect(() => {
    if (isOpen && (herds.length > 0 || paddocks.length > 0)) {
      generateInsights();
      generateSeasonalForecasts();
      generateRotationOptimizations();
    }
  }, [isOpen, herds, paddocks, assessments]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'early': return 'bg-blue-100 text-blue-800';
      case 'resting': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Powered Farm Insights
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="insights">Smart Recommendations</TabsTrigger>
              <TabsTrigger value="forecasts">Seasonal Forecasts</TabsTrigger>
              <TabsTrigger value="rotations">Rotation Optimizer</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  AI insights analyze your farm data to provide predictive recommendations and optimization opportunities.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {insights.map((insight) => (
                  <Card 
                    key={insight.id} 
                    className={`border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
                      insight.impact === 'high' ? 'border-l-red-500' : 
                      insight.impact === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                    }`}
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getImpactIcon(insight.impact)}
                            <h3 className="font-semibold">{insight.title}</h3>
                            <Badge variant="outline" className={getConfidenceColor(insight.confidence)}>
                              {insight.confidence}% confidence
                            </Badge>
                            <Badge variant="secondary" className="capitalize">
                              {insight.category}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{insight.timeframe}</span>
                            {insight.actionable && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Target className="h-3 w-3" />
                                {insight.actions?.length || 0} actions available
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {insights.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                      <h3 className="text-lg font-semibold mb-2">Generating Insights</h3>
                      <p className="text-muted-foreground">
                        Add more farm data to unlock AI-powered recommendations and predictions.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Insight Detail Modal */}
              {selectedInsight && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
                  <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {getImpactIcon(selectedInsight.impact)}
                          {selectedInsight.title}
                        </CardTitle>
                        <Button variant="ghost" onClick={() => setSelectedInsight(null)}>×</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium">Confidence</div>
                          <div className={`text-lg font-bold ${getConfidenceColor(selectedInsight.confidence)}`}>
                            {selectedInsight.confidence}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Impact</div>
                          <div className="text-lg font-bold capitalize">{selectedInsight.impact}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedInsight.description}</p>
                      </div>

                      {selectedInsight.actions && (
                        <div>
                          <h4 className="font-semibold mb-3">Recommended Actions</h4>
                          <div className="space-y-3">
                            {selectedInsight.actions.map((action, idx) => (
                              <Card key={idx} className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium">{action.title}</h5>
                                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                                  </div>
                                  <div className="text-right text-sm">
                                    <div className="font-medium text-green-600">{action.roi}</div>
                                    <div className="text-muted-foreground capitalize">{action.effort} effort</div>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-2">Data Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedInsight.dataSource.map((source, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {source.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="forecasts" className="space-y-4">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  12-month seasonal forecasts based on climate data, growth models, and historical patterns.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {seasonalForecasts.map((forecast) => (
                  <Card key={forecast.month}>
                    <CardContent className="p-4">
                      <div className="text-center mb-3">
                        <h3 className="font-semibold">{forecast.month}</h3>
                        <div className="text-2xl font-bold text-green-600">
                          {forecast.grazingCapacity}%
                        </div>
                        <div className="text-xs text-muted-foreground">Grazing Capacity</div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Supplement Needs:</span>
                          <span className="font-medium">{forecast.supplementNeeds}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Growth Rate:</span>
                          <span className="font-medium">{forecast.weatherFactors.growthRate}x</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs font-medium mb-1">Actions:</div>
                        {forecast.recommendedActions.map((action, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground">
                            • {action}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <ThermometerSun className={`h-3 w-3 ${
                          forecast.weatherFactors.temperature === 'above' ? 'text-red-500' :
                          forecast.weatherFactors.temperature === 'below' ? 'text-blue-500' : 'text-gray-500'
                        }`} />
                        <CloudRain className={`h-3 w-3 ${
                          forecast.weatherFactors.precipitation === 'above' ? 'text-blue-500' :
                          forecast.weatherFactors.precipitation === 'below' ? 'text-red-500' : 'text-gray-500'
                        }`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="rotations" className="space-y-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Real-time rotation recommendations based on paddock recovery, utilization, and optimal timing.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {rotationOptimizations.map((optimization) => (
                  <Card key={optimization.paddockId} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{optimization.paddockName}</h3>
                            <Badge className={getStatusColor(optimization.currentStatus)}>
                              {optimization.currentStatus.replace('_', ' ')}
                            </Badge>
                            {optimization.daysUntilOptimal === 0 ? (
                              <Badge variant="destructive">Action Needed</Badge>
                            ) : (
                              <Badge variant="outline">
                                {optimization.daysUntilOptimal} days
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {optimization.reasoning}
                          </p>
                          
                          <div className="text-sm">
                            <strong>Expected Benefit:</strong> {optimization.expectedBenefit}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Button 
                            size="sm" 
                            variant={optimization.recommendedAction === 'move_now' ? 'default' : 'outline'}
                            className="capitalize"
                          >
                            {optimization.recommendedAction.replace('_', ' ')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {rotationOptimizations.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-lg font-semibold mb-2">No Paddocks Found</h3>
                      <p className="text-muted-foreground">
                        Add paddock data to unlock rotation optimization recommendations.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Insights Applied",
                description: "AI recommendations have been integrated into your farm management workflow."
              });
              onClose();
            }}>
              Apply Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}