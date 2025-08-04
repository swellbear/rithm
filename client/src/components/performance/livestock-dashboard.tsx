import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, DollarSign, Scale } from "lucide-react";

interface LivestockPerformanceProps {
  userId: number;
}

// Mock data - in production this would come from the API
const mockPerformanceData = [
  {
    id: 1,
    herdName: "Holstein Dairy Herd",
    species: "cow",
    breed: "Holstein",
    count: 25,
    averageWeight: 1350,
    weightGain: 2.1,
    milkProduction: 6.8,
    bodyConditionScore: 3.2,
    reproductiveStatus: "breeding",
    pastureUtilization: 78,
    costPerHead: 4.50,
    healthIssues: ["mastitis"],
    date: "2024-12-30"
  },
  {
    id: 2,
    herdName: "Angus Beef Herd",
    species: "cow", 
    breed: "Angus",
    count: 40,
    averageWeight: 950,
    weightGain: 2.8,
    milkProduction: null,
    bodyConditionScore: 5.5,
    reproductiveStatus: "pregnant",
    pastureUtilization: 85,
    costPerHead: 3.20,
    healthIssues: [],
    date: "2024-12-30"
  }
];

const historicalWeightData = [
  { date: "2024-12-01", holstein: 1310, angus: 920 },
  { date: "2024-12-08", holstein: 1325, angus: 935 },
  { date: "2024-12-15", holstein: 1340, angus: 945 },
  { date: "2024-12-22", holstein: 1350, angus: 950 },
  { date: "2024-12-29", holstein: 1365, angus: 965 }
];

const pastureUtilizationData = [
  { name: "Utilized", value: 78, color: "#22c55e" },
  { name: "Available", value: 22, color: "#e5e7eb" }
];

const costAnalysisData = [
  { category: "Feed", holstein: 2.80, angus: 2.10 },
  { category: "Health", holstein: 0.90, angus: 0.60 },
  { category: "Labor", holstein: 0.80, angus: 0.50 }
];

export default function LivestockDashboard({ userId }: LivestockPerformanceProps) {
  const [selectedHerd, setSelectedHerd] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30days");

  const getPerformanceColor = (value: number, type: "gain" | "score" | "utilization") => {
    if (type === "gain") return value >= 2.5 ? "text-green-600" : value >= 1.5 ? "text-yellow-600" : "text-red-600";
    if (type === "score") return value >= 3.0 && value <= 3.5 ? "text-green-600" : value >= 2.5 ? "text-yellow-600" : "text-red-600";
    if (type === "utilization") return value >= 75 ? "text-green-600" : value >= 60 ? "text-yellow-600" : "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = (current: number, previous: number) => {
    return current > previous ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Livestock Performance Dashboard</h2>
          <p className="text-gray-600">Compare herd performance and track health metrics</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedHerd} onValueChange={setSelectedHerd}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select herd" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Herds</SelectItem>
              <SelectItem value="holstein">Holstein Dairy</SelectItem>
              <SelectItem value="angus">Angus Beef</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockPerformanceData.map((herd) => (
          <Card key={herd.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">🐄</div>
                <Badge variant="secondary" className="text-xs">
                  {herd.count} animals
                </Badge>
              </div>
              
              <h3 className="font-semibold text-text-primary mb-1">{herd.herdName}</h3>
              <p className="text-sm text-gray-600 mb-3">{herd.breed}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Weight Gain:</span>
                  <span className={getPerformanceColor(herd.weightGain, "gain")}>
                    {herd.weightGain} lbs/day {getTrendIcon(herd.weightGain, 2.0)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Body Condition:</span>
                  <span className={getPerformanceColor(herd.bodyConditionScore, "score")}>
                    {herd.bodyConditionScore}/9
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Pasture Use:</span>
                  <span className={getPerformanceColor(herd.pastureUtilization, "utilization")}>
                    {herd.pastureUtilization}%
                  </span>
                </div>
                
                {herd.milkProduction && (
                  <div className="flex justify-between text-sm">
                    <span>Milk Production:</span>
                    <span className="text-blue-600">{herd.milkProduction} gal/day</span>
                  </div>
                )}
              </div>
              
              {herd.healthIssues.length > 0 && (
                <div className="mt-3 p-2 bg-orange-50 rounded-md">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-xs text-orange-800">Health Alert</span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    {herd.healthIssues.join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Charts */}
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="weight">Weight Trends</TabsTrigger>
          <TabsTrigger value="utilization">Pasture Use</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="health">Health Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weight" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Weight Gain Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalWeightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="holstein" stroke="#2563eb" strokeWidth={2} name="Holstein" />
                  <Line type="monotone" dataKey="angus" stroke="#dc2626" strokeWidth={2} name="Angus" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="utilization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Average Pasture Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pastureUtilizationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pastureUtilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <p className="text-2xl font-bold text-primary">78%</p>
                  <p className="text-sm text-gray-600">Optimal Range: 70-85%</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Utilization by Herd</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Holstein Dairy</span>
                    <span className="text-sm font-semibold">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Angus Beef</span>
                    <span className="text-sm font-semibold">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-600">
                    Angus herd showing excellent pasture utilization. Consider extending grazing period.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Breakdown per Head
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="holstein" fill="#2563eb" name="Holstein" />
                  <Bar dataKey="angus" fill="#dc2626" name="Angus" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Holstein Total</p>
                  <p className="text-2xl font-bold text-blue-800">$4.50</p>
                  <p className="text-xs text-blue-600">per head/day</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600 mb-1">Angus Total</p>
                  <p className="text-2xl font-bold text-red-800">$3.20</p>
                  <p className="text-xs text-red-600">per head/day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Healthy Animals</span>
                  </div>
                  <span className="font-semibold text-green-800">64/65</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="text-sm">Health Concerns</span>
                  </div>
                  <span className="font-semibold text-orange-800">1/65</span>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Active Health Issues</h4>
                  <div className="text-sm text-gray-600">
                    <p>• Holstein #247: Mastitis (treating)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Body Condition Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Holstein Dairy</span>
                      <span className="text-sm font-semibold">3.2/9</span>
                    </div>
                    <Progress value={(3.2/9) * 100} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">Ideal range: 3.0-3.5</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Angus Beef</span>
                      <span className="text-sm font-semibold">5.5/9</span>
                    </div>
                    <Progress value={(5.5/9) * 100} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">Ideal range: 5.0-6.0</p>
                  </div>
                </div>
                
                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Both herds maintaining optimal body condition scores for their production stage.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}