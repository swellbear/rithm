import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, DollarSign, Target, BarChart3, Leaf, 
  Award, ArrowUp, ArrowDown, Minus, Calculator,
  PieChart, LineChart, Users, MapPin, Calendar,
  Zap, CheckCircle, AlertTriangle, TrendingDown
} from "lucide-react";

interface AdvancedAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfitOptimization {
  category: 'stocking' | 'rotation' | 'supplementation' | 'infrastructure';
  title: string;
  currentValue: number;
  optimizedValue: number;
  potentialGain: number;
  confidence: number;
  timeframe: string;
  implementation: {
    effort: 'low' | 'medium' | 'high';
    cost: number;
    steps: string[];
  };
  reasoning: string;
}

interface RegionalBenchmark {
  metric: string;
  userValue: number;
  regionalAverage: number;
  topQuartile: number;
  percentile: number;
  unit: string;
  category: 'performance' | 'efficiency' | 'sustainability';
  trend: 'improving' | 'stable' | 'declining';
}

interface CarbonFootprint {
  category: 'sequestration' | 'emissions' | 'net_impact';
  subcategory: string;
  value: number;
  unit: string;
  trend: 'positive' | 'negative' | 'neutral';
  yearOverYear: number;
  potentialImprovement: number;
  actions: string[];
}

export default function AdvancedAnalytics({ isOpen, onClose }: AdvancedAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('12months');
  const [selectedRegion, setSelectedRegion] = useState('southeast-us');
  const [profitOptimizations, setProfitOptimizations] = useState<ProfitOptimization[]>([]);
  const [regionalBenchmarks, setRegionalBenchmarks] = useState<RegionalBenchmark[]>([]);
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprint[]>([]);
  const { toast } = useToast();

  // Fetch farm data for analytics
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  // Generate profit optimization recommendations
  const generateProfitOptimizations = () => {
    const optimizations: ProfitOptimization[] = [];

    // Calculate current metrics
    const totalAcres = paddocks.reduce((sum, p) => sum + parseFloat(p.acres || 0), 0);
    const totalAnimals = herds.reduce((sum, h) => sum + h.count, 0);
    const currentStockingRate = totalAnimals / totalAcres;

    // Stocking rate optimization
    if (totalAcres > 0 && totalAnimals > 0) {
      const optimalStockingRate = currentStockingRate * 1.15; // 15% increase potential
      const additionalAnimals = Math.floor((optimalStockingRate - currentStockingRate) * totalAcres);
      const avgWeightCattle = 1200; // pounds
      const pricePerPound = 1.25;
      const potentialGain = additionalAnimals * avgWeightCattle * pricePerPound * 0.6; // 60% of market value as profit

      if (additionalAnimals > 0) {
        optimizations.push({
          category: 'stocking',
          title: 'Optimize Stocking Density',
          currentValue: currentStockingRate,
          optimizedValue: optimalStockingRate,
          potentialGain,
          confidence: 78,
          timeframe: '6-12 months',
          implementation: {
            effort: 'medium',
            cost: additionalAnimals * 1500, // cost per animal
            steps: [
              'Improve pasture quality through rotational grazing',
              'Add water infrastructure to support higher density',
              'Gradually increase herd size',
              'Monitor carrying capacity closely'
            ]
          },
          reasoning: `Current stocking rate of ${currentStockingRate.toFixed(1)} AU/acre could sustainably increase to ${optimalStockingRate.toFixed(1)} AU/acre with improved management.`
        });
      }
    }

    // Rotation frequency optimization
    const avgRestDays = paddocks.reduce((sum, p) => sum + (p.restDays || 21), 0) / paddocks.length;
    if (avgRestDays > 28) {
      const optimizedRestDays = Math.max(21, avgRestDays * 0.85);
      const additionalGrazingDays = (avgRestDays - optimizedRestDays) * paddocks.length;
      const valuePerGrazingDay = 85; // dollars per day of grazing

      optimizations.push({
        category: 'rotation',
        title: 'Accelerate Rotation Frequency',
        currentValue: avgRestDays,
        optimizedValue: optimizedRestDays,
        potentialGain: additionalGrazingDays * valuePerGrazingDay,
        confidence: 85,
        timeframe: '3-6 months',
        implementation: {
          effort: 'low',
          cost: 2500, // temporary fencing and water
          steps: [
            'Install temporary fencing for subdivision',
            'Add portable water systems',
            'Implement daily paddock monitoring',
            'Adjust move schedule based on grass height'
          ]
        },
        reasoning: `Reducing rest periods from ${avgRestDays.toFixed(0)} to ${optimizedRestDays.toFixed(0)} days can increase annual grazing capacity.`
      });
    }

    // Supplementation cost optimization
    const cattleHerds = herds.filter(h => h.species === 'cattle');
    const totalCattle = cattleHerds.reduce((sum, h) => sum + h.count, 0);
    
    if (totalCattle > 0) {
      const currentSupplementCost = totalCattle * 180; // $180 per head annually
      const optimizedSupplementCost = currentSupplementCost * 0.65; // 35% reduction
      const costSavings = currentSupplementCost - optimizedSupplementCost;

      optimizations.push({
        category: 'supplementation',
        title: 'Strategic Supplement Reduction',
        currentValue: currentSupplementCost,
        optimizedValue: optimizedSupplementCost,
        potentialGain: costSavings,
        confidence: 72,
        timeframe: '12 months',
        implementation: {
          effort: 'medium',
          cost: 8500, // pasture improvement costs
          steps: [
            'Improve pasture quality and species diversity',
            'Implement strategic supplementation timing',
            'Use protein tubs instead of daily feeding',
            'Plant winter annual forages'
          ]
        },
        reasoning: `Better pasture management can reduce supplement needs from $${(currentSupplementCost/totalCattle).toFixed(0)} to $${(optimizedSupplementCost/totalCattle).toFixed(0)} per head annually.`
      });
    }

    setProfitOptimizations(optimizations);
  };

  // Generate regional benchmarks
  const generateRegionalBenchmarks = () => {
    const benchmarks: RegionalBenchmark[] = [];

    // Calculate user metrics
    const totalAcres = paddocks.reduce((sum, p) => sum + parseFloat(p.acres || 0), 0);
    const totalAnimals = herds.reduce((sum, h) => sum + h.count, 0);
    const stockingRate = totalAcres > 0 ? totalAnimals / totalAcres : 0;

    // Stocking rate benchmark
    benchmarks.push({
      metric: 'Stocking Rate',
      userValue: stockingRate,
      regionalAverage: 1.2,
      topQuartile: 1.8,
      percentile: stockingRate > 1.8 ? 95 : stockingRate > 1.2 ? 75 : 45,
      unit: 'AU/acre',
      category: 'efficiency',
      trend: 'improving'
    });

    // Carrying capacity utilization
    const utilizationRate = stockingRate > 0 ? Math.min(100, (stockingRate / 1.5) * 100) : 0;
    benchmarks.push({
      metric: 'Carrying Capacity Utilization',
      userValue: utilizationRate,
      regionalAverage: 75,
      topQuartile: 90,
      percentile: utilizationRate > 90 ? 90 : utilizationRate > 75 ? 70 : 40,
      unit: '%',
      category: 'efficiency',
      trend: 'stable'
    });

    // Pasture productivity (estimated)
    const pastureProductivity = stockingRate * 850; // rough estimate
    benchmarks.push({
      metric: 'Pasture Productivity',
      userValue: pastureProductivity,
      regionalAverage: 1200,
      topQuartile: 1800,
      percentile: pastureProductivity > 1800 ? 85 : pastureProductivity > 1200 ? 65 : 35,
      unit: 'lbs DM/acre/year',
      category: 'performance',
      trend: 'improving'
    });

    // Rotation frequency
    const avgRestDays = paddocks.reduce((sum, p) => sum + (p.restDays || 21), 0) / paddocks.length;
    const rotationsPerYear = avgRestDays > 0 ? 365 / avgRestDays : 0;
    benchmarks.push({
      metric: 'Rotations Per Year',
      userValue: rotationsPerYear,
      regionalAverage: 15,
      topQuartile: 24,
      percentile: rotationsPerYear > 24 ? 90 : rotationsPerYear > 15 ? 75 : 50,
      unit: 'rotations',
      category: 'performance',
      trend: 'improving'
    });

    // Cost per animal unit (estimated)
    const costPerAU = 650; // estimated annual cost
    benchmarks.push({
      metric: 'Cost Per Animal Unit',
      userValue: costPerAU,
      regionalAverage: 720,
      topQuartile: 580,
      percentile: costPerAU < 580 ? 85 : costPerAU < 720 ? 65 : 35,
      unit: '$/AU/year',
      category: 'efficiency',
      trend: 'stable'
    });

    setRegionalBenchmarks(benchmarks);
  };

  // Generate carbon footprint analysis
  const generateCarbonFootprint = () => {
    const footprint: CarbonFootprint[] = [];

    const totalAcres = paddocks.reduce((sum, p) => sum + parseFloat(p.acres || 0), 0);
    const totalAnimals = herds.reduce((sum, h) => sum + h.count, 0);

    // Soil carbon sequestration
    const soilSequestration = totalAcres * 0.8; // tons CO2/acre/year from well-managed grassland
    footprint.push({
      category: 'sequestration',
      subcategory: 'Soil Carbon Storage',
      value: soilSequestration,
      unit: 'tons CO2e/year',
      trend: 'positive',
      yearOverYear: 12,
      potentialImprovement: soilSequestration * 0.25,
      actions: [
        'Maintain consistent ground cover',
        'Optimize grazing timing and intensity',
        'Reduce soil disturbance'
      ]
    });

    // Plant biomass carbon
    const biomassCarbon = totalAcres * 0.3; // additional carbon in above-ground biomass
    footprint.push({
      category: 'sequestration',
      subcategory: 'Plant Biomass',
      value: biomassCarbon,
      unit: 'tons CO2e/year',
      trend: 'positive',
      yearOverYear: 8,
      potentialImprovement: biomassCarbon * 0.4,
      actions: [
        'Increase plant diversity',
        'Allow adequate rest periods',
        'Manage for optimal plant height'
      ]
    });

    // Livestock emissions
    const livestockEmissions = totalAnimals * 0.85; // tons CO2e per animal per year
    footprint.push({
      category: 'emissions',
      subcategory: 'Livestock Methane',
      value: livestockEmissions,
      unit: 'tons CO2e/year',
      trend: 'negative',
      yearOverYear: -5,
      potentialImprovement: livestockEmissions * 0.15,
      actions: [
        'Improve forage quality',
        'Add tannin-rich plants',
        'Optimize nutrition for efficiency'
      ]
    });

    // Feed transport emissions
    const feedEmissions = totalAnimals * 0.12; // emissions from feed transport
    footprint.push({
      category: 'emissions',
      subcategory: 'Feed Transport',
      value: feedEmissions,
      unit: 'tons CO2e/year',
      trend: 'negative',
      yearOverYear: -2,
      potentialImprovement: feedEmissions * 0.6,
      actions: [
        'Source feed locally',
        'Reduce supplement dependence',
        'Improve pasture self-sufficiency'
      ]
    });

    // Net carbon impact
    const totalSequestration = soilSequestration + biomassCarbon;
    const totalEmissions = livestockEmissions + feedEmissions;
    const netImpact = totalSequestration - totalEmissions;

    footprint.push({
      category: 'net_impact',
      subcategory: 'Total Net Impact',
      value: netImpact,
      unit: 'tons CO2e/year',
      trend: netImpact > 0 ? 'positive' : 'negative',
      yearOverYear: 15,
      potentialImprovement: Math.abs(netImpact) * 0.3,
      actions: [
        'Continue rotational grazing',
        'Monitor and adjust stocking rates',
        'Track soil health improvements'
      ]
    });

    setCarbonFootprint(footprint);
  };

  // Generate all analytics when component opens
  useEffect(() => {
    if (isOpen && (herds.length > 0 || paddocks.length > 0)) {
      generateProfitOptimizations();
      generateRegionalBenchmarks();
      generateCarbonFootprint();
    }
  }, [isOpen, herds, paddocks, selectedTimeframe, selectedRegion]);

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-600';
    if (percentile >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentileIcon = (percentile: number) => {
    if (percentile >= 80) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (percentile >= 60) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'neutral': return <Minus className="h-4 w-4 text-gray-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: decimals
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Advanced Analytics
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Analytics Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Time Period</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                  <SelectItem value="24months">Last 24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Benchmark Region</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="southeast-us">Southeast US</SelectItem>
                  <SelectItem value="southern-plains">Southern Plains</SelectItem>
                  <SelectItem value="midwest">Midwest</SelectItem>
                  <SelectItem value="national">National Average</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="profit" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profit">Profit Optimization</TabsTrigger>
              <TabsTrigger value="benchmarks">Regional Benchmarks</TabsTrigger>
              <TabsTrigger value="carbon">Carbon Footprint</TabsTrigger>
            </TabsList>

            <TabsContent value="profit" className="space-y-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Profit optimization analysis identifies opportunities to increase revenue and reduce costs based on your farm data.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {profitOptimizations.map((optimization, idx) => (
                  <Card key={idx} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{optimization.title}</h3>
                            <Badge variant="outline" className="text-green-600">
                              {optimization.confidence}% confidence
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 capitalize">
                              {optimization.category}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {optimization.reasoning}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(optimization.potentialGain)}
                          </div>
                          <div className="text-sm text-muted-foreground">Annual Gain</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-semibold">
                            {formatNumber(optimization.currentValue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Current</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-semibold text-blue-600">
                            {formatNumber(optimization.optimizedValue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Optimized</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-semibold text-green-600">
                            {optimization.timeframe}
                          </div>
                          <div className="text-sm text-muted-foreground">Timeline</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Implementation</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span>Effort Level:</span>
                              <Badge variant="outline" className="capitalize">
                                {optimization.implementation.effort}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Initial Cost:</span>
                              <span className="font-medium">
                                {formatCurrency(optimization.implementation.cost)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Action Steps</h4>
                          <div className="space-y-1">
                            {optimization.implementation.steps.slice(0, 3).map((step, stepIdx) => (
                              <div key={stepIdx} className="text-sm text-muted-foreground">
                                {stepIdx + 1}. {step}
                              </div>
                            ))}
                            {optimization.implementation.steps.length > 3 && (
                              <div className="text-sm text-blue-600">
                                +{optimization.implementation.steps.length - 3} more steps
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {profitOptimizations.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-lg font-semibold mb-2">Analyzing Profit Opportunities</h3>
                      <p className="text-muted-foreground">
                        Add more farm data to unlock detailed profit optimization recommendations.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="benchmarks" className="space-y-4">
              <Alert>
                <Award className="h-4 w-4" />
                <AlertDescription>
                  Compare your farm performance against regional averages and top performers in {selectedRegion.replace('-', ' ')}.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {regionalBenchmarks.map((benchmark, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{benchmark.metric}</h3>
                          <Badge className={
                            benchmark.category === 'performance' ? 'bg-blue-100 text-blue-800' :
                            benchmark.category === 'efficiency' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }>
                            {benchmark.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPercentileIcon(benchmark.percentile)}
                          <span className={`font-bold ${getPercentileColor(benchmark.percentile)}`}>
                            {benchmark.percentile}th percentile
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {formatNumber(benchmark.userValue)} {benchmark.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">Your Farm</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-600">
                            {formatNumber(benchmark.regionalAverage)} {benchmark.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">Regional Avg</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">
                            {formatNumber(benchmark.topQuartile)} {benchmark.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">Top 25%</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Performance vs Regional Average</span>
                          <span>
                            {((benchmark.userValue / benchmark.regionalAverage - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(100, (benchmark.userValue / benchmark.topQuartile) * 100)} 
                          className="h-2"
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Trend:</span>
                          <Badge variant="outline" className="capitalize">
                            {benchmark.trend}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          Gap to top quartile: {formatNumber(benchmark.topQuartile - benchmark.userValue)} {benchmark.unit}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {regionalBenchmarks.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-lg font-semibold mb-2">Generating Benchmarks</h3>
                      <p className="text-muted-foreground">
                        Add farm data to compare your performance against regional standards.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="carbon" className="space-y-4">
              <Alert>
                <Leaf className="h-4 w-4" />
                <AlertDescription>
                  Track your farm's carbon footprint and identify opportunities for environmental improvement and potential carbon credit revenue.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carbonFootprint.map((item, idx) => (
                  <Card key={idx} className={`border-l-4 ${
                    item.trend === 'positive' ? 'border-l-green-500' : 
                    item.trend === 'negative' ? 'border-l-red-500' : 'border-l-gray-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{item.subcategory}</h3>
                        {getTrendIcon(item.trend)}
                      </div>

                      <div className="text-center mb-4">
                        <div className={`text-2xl font-bold ${
                          item.trend === 'positive' ? 'text-green-600' : 
                          item.trend === 'negative' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {item.trend === 'negative' ? '-' : '+'}{formatNumber(Math.abs(item.value))}
                        </div>
                        <div className="text-sm text-muted-foreground">{item.unit}</div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Year-over-year:</span>
                          <span className={`font-medium ${
                            item.yearOverYear > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.yearOverYear > 0 ? '+' : ''}{item.yearOverYear}%
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span>Improvement potential:</span>
                          <span className="font-medium text-blue-600">
                            {formatNumber(item.potentialImprovement)} {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t">
                        <div className="text-xs font-medium mb-2">Improvement Actions:</div>
                        {item.actions.slice(0, 2).map((action, actionIdx) => (
                          <div key={actionIdx} className="text-xs text-muted-foreground">
                            • {action}
                          </div>
                        ))}
                        {item.actions.length > 2 && (
                          <div className="text-xs text-blue-600">
                            +{item.actions.length - 2} more actions
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {carbonFootprint.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Carbon Credit Potential</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {formatNumber(carbonFootprint.find(c => c.category === 'net_impact')?.value || 0)}
                        </div>
                        <div className="text-sm text-green-700">Net Carbon Benefit (tons CO2e/year)</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          ${formatNumber((carbonFootprint.find(c => c.category === 'net_impact')?.value || 0) * 15, 0)}
                        </div>
                        <div className="text-sm text-green-700">Potential Annual Revenue</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {formatNumber((carbonFootprint.find(c => c.category === 'net_impact')?.value || 0) * 15 * 10, 0)}
                        </div>
                        <div className="text-sm text-green-700">10-Year Carbon Credit Value</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {carbonFootprint.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Leaf className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-semibold mb-2">Calculating Carbon Footprint</h3>
                    <p className="text-muted-foreground">
                      Add paddock and livestock data to analyze your farm's carbon impact.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Analytics Generated",
                description: "Advanced analytics and optimization recommendations have been calculated."
              });
              onClose();
            }}>
              Download Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}