import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDemoData, demoSoilData } from "@/lib/demo-data";
import { 
  Sprout, TestTube, TrendingUp, Droplets, Zap, 
  Leaf, Calendar, Target, AlertTriangle, CheckCircle,
  Microscope, FlaskConical, Mountain, Wind, Beaker
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface SoilTest {
  id: string;
  paddockId: number;
  paddockName: string;
  testDate: Date;
  sampleDepth: number;
  location: { lat: number; lng: number };
  results: {
    pH: number;
    organicMatter: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    calcium: number;
    magnesium: number;
    sulfur: number;
    cec: number; // Cation Exchange Capacity
    basePercentage: number;
    salinity: number;
    sodiumPercentage: number;
  };
  recommendations: SoilRecommendation[];
  cost: number;
  laboratory: string;
}

interface SoilRecommendation {
  id: string;
  type: "fertilizer" | "amendment" | "seeding" | "management";
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  product?: string;
  rate: string;
  timing: string;
  expectedBenefit: string;
  cost: number;
  roi: number;
}

interface CarbonSequestration {
  paddockId: number;
  currentCarbon: number; // tons CO2 equivalent per acre
  potential: number;
  practicesBenefits: {
    practice: string;
    carbonIncrease: number;
    timeToRealize: number;
    implementation: string;
  }[];
  marketValue: number; // carbon credit value
  certification: "verified" | "pending" | "not_certified";
}

interface RegenerativePractice {
  id: string;
  name: string;
  description: string;
  category: "soil_building" | "biodiversity" | "water_management" | "carbon_sequestration";
  difficulty: "beginner" | "intermediate" | "advanced";
  timeToResults: number; // months
  benefits: string[];
  implementation: {
    season: string;
    steps: string[];
    equipment: string[];
    cost: number;
  };
}

interface SoilHealthScore {
  paddockId: number;
  overallScore: number;
  components: {
    biological: number;
    chemical: number;
    physical: number;
  };
  indicators: {
    name: string;
    value: number;
    target: number;
    status: "excellent" | "good" | "fair" | "poor";
  }[];
  trends: {
    period: string;
    score: number;
  }[];
}

export default function SoilHealthPastureImprovement() {
  // Auto-set complexity based on subscription tier
  const complexityLevel = 'intermediate'; // All users get same soil health features
  const [selectedPaddock, setSelectedPaddock] = useState<string>("");
  const [soilTests, setSoilTests] = useState<SoilTest[]>([]);
  const [soilHealthScores, setSoilHealthScores] = useState<SoilHealthScore[]>([]);
  const [carbonData, setCarbonData] = useState<CarbonSequestration[]>([]);
  const [practices, setPractices] = useState<RegenerativePractice[]>([]);

  const { toast } = useToast();

  // Fetch farm data
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  useEffect(() => {
    // Only initialize if we have real farm data
    if (paddocks.length === 0 && assessments.length === 0) {
      // Clear all data when no farm soil data exists
      setSoilTests([]);
      setSoilHealthScores([]);
      setCarbonData([]);
      setPractices([]);
    }
  }, [paddocks, assessments]);



  const getSoilHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const renderSoilHealthDashboard = () => {
    const avgHealthScore = soilHealthScores.reduce((sum, score) => sum + score.overallScore, 0) / soilHealthScores.length || 0;
    const totalCarbonPotential = carbonData.reduce((sum, data) => sum + (data.potential - data.currentCarbon), 0);
    const carbonValue = totalCarbonPotential * (carbonData[0]?.marketValue || 45);

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Sprout className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{avgHealthScore.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Soil Health Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{soilTests.length}</div>
                  <div className="text-sm text-gray-600">Recent Tests</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Leaf className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{totalCarbonPotential.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Carbon Potential (tons)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">${carbonValue.toFixed(0)}</div>
                  <div className="text-sm text-gray-600">Carbon Credit Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Soil Health by Paddock</CardTitle>
              <CardDescription>Overall soil health scores and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={soilHealthScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="paddockId" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="overallScore" fill="#10B981" name="Health Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Carbon Sequestration Potential</CardTitle>
              <CardDescription>Current vs. potential carbon storage by paddock</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={carbonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="paddockId" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="currentCarbon" fill="#3B82F6" name="Current Carbon" />
                  <Bar dataKey="potential" fill="#10B981" name="Potential Carbon" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderSoilTesting = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Soil Test Results</CardTitle>
            <CardDescription>Laboratory analysis results and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {soilTests.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No soil tests recorded yet. Schedule your first soil test.</p>
                <Button className="mt-4">
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Schedule Soil Test
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {soilTests.map(test => (
                  <div key={test.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{test.paddockName}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{test.testDate.toLocaleDateString()}</Badge>
                        <Badge variant="outline">${test.cost}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">pH:</span>
                        <span className="ml-2 font-medium">{test.results.pH.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Organic Matter:</span>
                        <span className="ml-2 font-medium">{test.results.organicMatter.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">P (ppm):</span>
                        <span className="ml-2 font-medium">{test.results.phosphorus.toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">K (ppm):</span>
                        <span className="ml-2 font-medium">{test.results.potassium.toFixed(0)}</span>
                      </div>
                    </div>

                    {complexityLevel !== "basic" && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">CEC:</span>
                          <span className="ml-2 font-medium">{test.results.cec.toFixed(1)} meq/100g</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Base %:</span>
                          <span className="ml-2 font-medium">{test.results.basePercentage.toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Ca (ppm):</span>
                          <span className="ml-2 font-medium">{test.results.calcium.toFixed(0)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Mg (ppm):</span>
                          <span className="ml-2 font-medium">{test.results.magnesium.toFixed(0)}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h5 className="font-medium">Recommendations:</h5>
                      {test.recommendations.map(rec => (
                        <div key={rec.id} className={`p-2 rounded border text-sm ${
                          rec.priority === "critical" ? "border-red-200 bg-red-50" :
                          rec.priority === "high" ? "border-orange-200 bg-orange-50" :
                          "border-yellow-200 bg-yellow-50"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{rec.action}</span>
                            <Badge variant="outline" className="text-xs">{rec.priority}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-gray-600">Rate:</span> {rec.rate}</div>
                            <div><span className="text-gray-600">Timing:</span> {rec.timing}</div>
                            <div><span className="text-gray-600">Cost:</span> ${rec.cost}/acre</div>
                            <div><span className="text-gray-600">ROI:</span> {rec.roi}%</div>
                          </div>
                          <p className="text-xs mt-1">{rec.expectedBenefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {complexityLevel === "advanced" && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Soil Analysis</CardTitle>
              <CardDescription>Detailed soil chemistry and biology assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Microbiome Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Advanced soil microbiome testing to assess biological activity and diversity.
                  </p>
                  <div className="text-xs text-gray-500 italic">
                    Available in future updates
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Penetrometer Testing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Soil compaction assessment using penetrometer for physical health evaluation.
                  </p>
                  <div className="text-xs text-gray-500 italic">
                    Available in future updates
                  </div>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Infiltration Rate Testing</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Water infiltration testing to assess soil structure and water holding capacity.
                  </p>
                  <Button size="sm">
                    <Droplets className="h-4 w-4 mr-1" />
                    Test Infiltration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderRegenerativePractices = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Regenerative Agriculture Practices</CardTitle>
            <CardDescription>Science-based practices to improve soil health and farm resilience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {practices.map(practice => (
                <div key={practice.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{practice.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">{practice.difficulty}</Badge>
                      <Badge variant="outline">{practice.timeToResults} months</Badge>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{practice.description}</p>

                  <div className="grid gap-3 md:grid-cols-2 mb-3">
                    <div>
                      <h5 className="font-medium text-sm mb-1">Benefits:</h5>
                      <ul className="text-xs space-y-1 list-disc ml-4">
                        {practice.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-1">Implementation:</h5>
                      <div className="text-xs space-y-1">
                        <div><span className="text-gray-600">Season:</span> {practice.implementation.season}</div>
                        <div><span className="text-gray-600">Cost:</span> ${practice.implementation.cost}/acre</div>
                        <div><span className="text-gray-600">Equipment:</span> {practice.implementation.equipment.join(", ")}</div>
                      </div>
                    </div>
                  </div>

                  {complexityLevel !== "basic" && (
                    <div className="mb-3">
                      <h5 className="font-medium text-sm mb-1">Implementation Steps:</h5>
                      <ol className="text-xs space-y-1 list-decimal ml-4">
                        {practice.implementation.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button size="sm">
                      <Target className="h-3 w-3 mr-1" />
                      Plan Implementation
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCarbonTracking = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Carbon Sequestration & Credits</CardTitle>
            <CardDescription>Track carbon storage potential and market opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {carbonData.map((data, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Paddock {data.paddockId}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant={data.certification === "verified" ? "default" : "secondary"}>
                        {data.certification}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        ${(data.potential - data.currentCarbon).toFixed(0)} potential value
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Current Carbon:</span>
                      <span className="ml-2 font-medium">{data.currentCarbon.toFixed(1)} tons/acre</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Potential:</span>
                      <span className="ml-2 font-medium">{data.potential.toFixed(1)} tons/acre</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Opportunity:</span>
                      <span className="ml-2 font-medium">{(data.potential - data.currentCarbon).toFixed(1)} tons/acre</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Market Value:</span>
                      <span className="ml-2 font-medium">${data.marketValue}/ton</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2">Carbon-Building Practices:</h5>
                    <div className="space-y-2">
                      {data.practicesBenefits.map((practice, practiceIndex) => (
                        <div key={practiceIndex} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{practice.practice}</span>
                            <span className="text-green-600">+{practice.carbonIncrease} tons/acre/year</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <span>Time to realize: {practice.timeToRealize} months</span>
                            <span className="ml-4">Implementation: {practice.implementation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {complexityLevel === "advanced" && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2">Carbon Credit Certification</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Pursue third-party verification for carbon credit monetization through established programs.
                </p>
                <div className="flex space-x-2">
                  <Button size="sm">
                    <Beaker className="h-4 w-4 mr-1" />
                    Start Verification
                  </Button>
                  <Button size="sm" variant="outline">
                    <Target className="h-4 w-4 mr-1" />
                    Market Analysis
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderIntegration = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Farm Management Integration</CardTitle>
            <CardDescription>How soil health data enhances overall farm management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Pasture Assessment</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Soil test results inform pasture assessment interpretation and management recommendations
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Nutritional Analysis</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Soil mineral content correlates with forage nutritional quality and supplementation needs
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Grazing Planning</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Soil health guides rest periods and stocking rates for optimal regeneration
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Financial Management</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Soil improvement investments and carbon credit potential inform economic decisions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrated Soil Health Monitoring</CardTitle>
            <CardDescription>Comprehensive approach combining multiple data sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Laboratory Testing</span>
                  <span className="text-sm text-gray-600">Annual comprehensive analysis</span>
                </div>
                <p className="text-sm text-gray-600">Chemical and biological soil assessment with detailed recommendations</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Field Assessments</span>
                  <span className="text-sm text-gray-600">Quarterly visual evaluation</span>
                </div>
                <p className="text-sm text-gray-600">Visual soil health indicators integrated with pasture condition scoring</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Plant Response Monitoring</span>
                  <span className="text-sm text-gray-600">Continuous observation</span>
                </div>
                <p className="text-sm text-gray-600">Plant species diversity and health as indicators of soil condition changes</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Performance Correlation</span>
                  <span className="text-sm text-gray-600">Monthly analysis</span>
                </div>
                <p className="text-sm text-gray-600">Livestock performance metrics correlated with soil health improvements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Soil Health & Pasture Improvement
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Regenerative agriculture practices and soil health monitoring for sustainable pasture management
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedPaddock} onValueChange={setSelectedPaddock}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Paddocks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Paddocks</SelectItem>
                {paddocks.map(paddock => (
                  <SelectItem key={paddock.id} value={paddock.id.toString()}>
                    {paddock.name}
                  </SelectItem>
                ))}
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

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="dashboard" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Soil Testing</span>
              <span className="sm:hidden">Soil</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="practices" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Regenerative</span>
              <span className="sm:hidden">Regen</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="carbon" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Carbon</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Integration</span>
              <span className="sm:hidden">Integrate</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {renderSoilHealthDashboard()}
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          {renderSoilTesting()}
        </TabsContent>

        <TabsContent value="practices" className="space-y-6">
          {renderRegenerativePractices()}
        </TabsContent>

        <TabsContent value="carbon" className="space-y-6">
          {renderCarbonTracking()}
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          {renderIntegration()}
        </TabsContent>
      </Tabs>
    </div>
  );
}