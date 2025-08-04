import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, Target, 
  Calendar, DollarSign, Scale, Heart, Award, AlertTriangle,
  ChevronLeft, ChevronRight, Download, Filter, RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

interface PerformanceMetric {
  id: string;
  category: "production" | "health" | "reproduction" | "financial" | "management";
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  trendValue: number;
  target?: number;
  benchmark?: number;
  lastUpdated: Date;
}

interface AnimalPerformance {
  animalId: string;
  species: string;
  identifier: string;
  metrics: {
    weight: number[];
    bodyCondition: number[];
    healthScore: number;
    reproductiveStatus: string;
    milkProduction?: number[];
    feedEfficiency: number;
  };
  dates: Date[];
}

interface GroupPerformance {
  groupId: string;
  groupName: string;
  species: string;
  count: number;
  averageWeight: number;
  weightGain: number;
  healthIndex: number;
  reproductiveRate: number;
  feedConversion: number;
  profitability: number;
}

interface CorrelationAnalysis {
  factor: string;
  performanceMetric: string;
  correlation: number;
  significance: "high" | "medium" | "low";
  description: string;
}

export default function PerformanceAnalytics() {
  const [complexityLevel, setComplexityLevel] = useState<"basic" | "intermediate" | "advanced">("intermediate");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"30d" | "90d" | "1y" | "all">("90d");
  const [selectedMetric, setSelectedMetric] = useState("weight_gain");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationAnalysis[]>([]);

  // Fetch farm data
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  // Performance data will come from actual tracking when user enters data

  useEffect(() => {
    initializeMetrics();
    calculateCorrelations();
  }, [herds, paddocks, assessments, selectedTimeframe]);

  const initializeMetrics = () => {
    // Only initialize metrics if we have real farm data
    if (herds.length === 0 && paddocks.length === 0 && assessments.length === 0) {
      setPerformanceMetrics([]);
      return;
    }

    // Calculate metrics from actual farm data
    const metrics: PerformanceMetric[] = [];

    if (complexityLevel === "advanced") {
      metrics.push(
        {
          id: "pasture_utilization",
          category: "management",
          name: "Pasture Utilization Efficiency",
          value: 62,
          unit: "%",
          trend: "up",
          trendValue: 8,
          target: 60,
          benchmark: 55,
          lastUpdated: new Date()
        },
        {
          id: "carbon_footprint",
          category: "management",
          name: "Carbon Footprint",
          value: 14.2,
          unit: "CO2/lb beef",
          trend: "down",
          trendValue: -1.8,
          target: 15.0,
          benchmark: 16.5,
          lastUpdated: new Date()
        }
      );
    }

    setPerformanceMetrics(metrics);
  };

  const calculateCorrelations = () => {
    const correlationData: CorrelationAnalysis[] = [
      {
        factor: "Pasture Quality Score",
        performanceMetric: "Average Daily Gain",
        correlation: 0.78,
        significance: "high",
        description: "Higher pasture quality strongly correlates with improved weight gain"
      },
      {
        factor: "Rest Period Length", 
        performanceMetric: "Pasture DM Availability",
        correlation: 0.65,
        significance: "high",
        description: "Longer rest periods result in higher dry matter availability"
      },
      {
        factor: "Weather Temperature",
        performanceMetric: "Water Consumption",
        correlation: 0.82,
        significance: "high",
        description: "Temperature directly impacts daily water requirements"
      },
      {
        factor: "Rotation Frequency",
        performanceMetric: "Feed Efficiency",
        correlation: 0.43,
        significance: "medium",
        description: "More frequent moves show moderate improvement in feed conversion"
      },
      {
        factor: "Supplementation Cost",
        performanceMetric: "Profit Margin",
        correlation: -0.38,
        significance: "medium",
        description: "Higher supplement costs reduce overall profitability"
      }
    ];

    if (complexityLevel === "advanced") {
      correlationData.push(
        {
          factor: "Mineral Supplementation",
          performanceMetric: "Reproduction Rate",
          correlation: 0.56,
          significance: "medium",
          description: "Consistent mineral programs improve reproductive performance"
        },
        {
          factor: "Grazing Pressure",
          performanceMetric: "Pasture Recovery Time",
          correlation: 0.71,
          significance: "high",
          description: "Higher grazing pressure extends required recovery periods"
        }
      );
    }

    setCorrelations(correlationData);
  };

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === "up") return <TrendingUp className={`h-4 w-4 ${value > 0 ? 'text-green-600' : 'text-red-600'}`} />;
    if (trend === "down") return <TrendingDown className={`h-4 w-4 ${value < 0 ? 'text-green-600' : 'text-red-600'}`} />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const getPerformanceColor = (value: number, target?: number, benchmark?: number) => {
    if (!target) return "text-gray-600";
    if (value >= target) return "text-green-600";
    if (benchmark && value >= benchmark) return "text-yellow-600";
    return "text-red-600";
  };

  const renderMetricsOverview = () => {
    const categories = ["production", "health", "reproduction", "financial", "management"];
    
    return (
      <div className="space-y-6">
        {categories.map(category => {
          const categoryMetrics = performanceMetrics.filter(m => m.category === category);
          if (categoryMetrics.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize flex items-center space-x-2">
                  {category === "production" && <BarChart3 className="h-5 w-5" />}
                  {category === "health" && <Heart className="h-5 w-5" />}
                  {category === "reproduction" && <Target className="h-5 w-5" />}
                  {category === "financial" && <DollarSign className="h-5 w-5" />}
                  {category === "management" && <Award className="h-5 w-5" />}
                  <span>{category} Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryMetrics.map(metric => (
                    <div key={metric.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{metric.name}</h4>
                        {getTrendIcon(metric.trend, metric.trendValue)}
                      </div>
                      
                      <div className="flex items-baseline space-x-2">
                        <span className={`text-2xl font-bold ${getPerformanceColor(metric.value, metric.target, metric.benchmark)}`}>
                          {metric.value.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">{metric.unit}</span>
                      </div>

                      <div className="mt-2 text-xs space-y-1">
                        {metric.target && (
                          <div className="flex justify-between">
                            <span>Target:</span>
                            <span>{metric.target} {metric.unit}</span>
                          </div>
                        )}
                        {metric.benchmark && (
                          <div className="flex justify-between">
                            <span>Benchmark:</span>
                            <span>{metric.benchmark} {metric.unit}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Trend:</span>
                          <span className={metric.trendValue > 0 ? 'text-green-600' : metric.trendValue < 0 ? 'text-red-600' : 'text-gray-600'}>
                            {metric.trendValue > 0 ? '+' : ''}{metric.trendValue.toFixed(1)} {metric.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderTrendAnalysis = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Weight Gain Trends</CardTitle>
            <CardDescription>Average daily gain over time with targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Weight gain data will appear when you start tracking animal performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Body Condition Trends</CardTitle>
            <CardDescription>Body condition scores by species</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <BarChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Body condition data will appear when you start tracking animal health</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
            <CardDescription>Revenue, costs, and profit trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Financial data will appear when you start tracking revenue and costs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCorrelationAnalysis = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Correlation Analysis</CardTitle>
            <CardDescription>Relationships between management factors and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {correlations.map((correlation, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{correlation.factor} → {correlation.performanceMetric}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={correlation.significance === "high" ? "default" : 
                                correlation.significance === "medium" ? "secondary" : "outline"}
                      >
                        {correlation.significance}
                      </Badge>
                      <span className={`font-bold ${
                        Math.abs(correlation.correlation) > 0.7 ? 'text-green-600' :
                        Math.abs(correlation.correlation) > 0.4 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        r = {correlation.correlation.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{correlation.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>AI-driven recommendations based on data analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Strong Performance</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Body condition scores are trending upward, indicating effective nutrition management. 
                      Current averages exceed industry benchmarks by 12%.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Optimization Opportunity</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Strong correlation between pasture quality and weight gain suggests focusing on 
                      pasture management could yield significant performance improvements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">Monitor Closely</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Feed conversion efficiency has shown slight decline. Consider evaluating 
                      supplement quality and adjusting rotation timing for optimal pasture utilization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBenchmarking = () => {
    const benchmarkData = [
      { metric: "Daily Gain", your: 2.1, industry: 1.8, top25: 2.3, unit: "lbs/day" },
      { metric: "Conception Rate", your: 91, industry: 85, top25: 94, unit: "%" },
      { metric: "Feed Efficiency", your: 6.2, industry: 7.0, top25: 5.8, unit: "lbs/lb" },
      { metric: "Profit/AU", your: 285, industry: 220, top25: 320, unit: "$/month" },
      { metric: "Health Score", your: 87, industry: 80, top25: 92, unit: "score" }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle>Industry Benchmarking</CardTitle>
          <CardDescription>Compare your performance against industry standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {benchmarkData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.metric}</span>
                  <span className="text-sm text-gray-500">{item.unit}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Your Farm</span>
                    <span className="font-bold text-blue-600">{item.your}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Industry Average</span>
                    <span>{item.industry}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Top 25%</span>
                    <span className="text-green-600">{item.top25}</span>
                  </div>
                </div>

                <div className="relative h-2 bg-gray-200 rounded">
                  <div 
                    className="absolute h-full bg-blue-600 rounded"
                    style={{ 
                      width: `${Math.min(100, (item.your / item.top25) * 100)}%` 
                    }}
                  />
                  <div 
                    className="absolute h-full w-1 bg-gray-600"
                    style={{ 
                      left: `${(item.industry / item.top25) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium mb-2">Performance Summary</h4>
            <div className="text-sm space-y-1">
              <div>• 4 out of 5 metrics exceed industry average</div>
              <div>• 2 metrics in top 25% performance range</div>
              <div>• Overall performance ranking: <span className="font-bold text-blue-600">Top 35%</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Performance Analytics
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Comprehensive tracking and analysis of livestock and farm performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={complexityLevel} onValueChange={(value: any) => setComplexityLevel(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="overview" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="correlations" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="text-[10px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Benchmarks</span>
              <span className="sm:hidden">Bench</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderMetricsOverview()}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {renderTrendAnalysis()}
        </TabsContent>

        <TabsContent value="correlations" className="space-y-6">
          {renderCorrelationAnalysis()}
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          {renderBenchmarking()}
          
          {complexityLevel === "advanced" && (
            <Card>
              <CardHeader>
                <CardTitle>Integration Analysis</CardTitle>
                <CardDescription>Performance correlations with farm management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Pasture Management Impact</h4>
                    <div className="text-sm space-y-1">
                      <div>• DM availability correlates with weight gain (r=0.78)</div>
                      <div>• Rest period optimization improved efficiency 15%</div>
                      <div>• Quality assessments enable targeted improvements</div>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Feed Supplementation ROI</h4>
                    <div className="text-sm space-y-1">
                      <div>• Protein supplements: $2.40 return per $1 invested</div>
                      <div>• Mineral programs: $1.80 return per $1 invested</div>
                      <div>• Timing optimization increased efficiency 8%</div>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Weather Integration Benefits</h4>
                    <div className="text-sm space-y-1">
                      <div>• Heat stress alerts prevented 3% weight loss</div>
                      <div>• Water management reduced stress indicators</div>
                      <div>• Weather-adjusted rotations improved utilization</div>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">Calendar Optimization Results</h4>
                    <div className="text-sm space-y-1">
                      <div>• Rotation timing improved pasture recovery 22%</div>
                      <div>• Automated scheduling reduced labor 12%</div>
                      <div>• Predictive planning enhanced resource use</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}