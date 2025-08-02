import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Microscope, 
  Search, 
  TrendingUp, 
  Brain,
  Database,
  BarChart3,
  FileText,
  Beaker,
  Stethoscope,
  Dna,
  Activity,
  Calculator
} from "lucide-react";

export default function MedicalResearchDashboard() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Microscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  MedicalResearch AI
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Advanced Patent Search & Optimization Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                <Activity className="w-3 h-3 mr-1" />
                Live System
              </Badge>
              <Badge variant="outline" className="border-blue-200 text-blue-800 dark:border-blue-700 dark:text-blue-300">
                Rithm Optimization Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="patent-search" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Patent Search</span>
            </TabsTrigger>
            <TabsTrigger value="rithm-optimization" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Rithm Optimization</span>
            </TabsTrigger>
            <TabsTrigger value="research-tools" className="flex items-center space-x-2">
              <Beaker className="w-4 h-4" />
              <span>Research Tools</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patent Analysis</CardTitle>
                  <FileText className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">847</div>
                  <p className="text-xs text-blue-100">Patents analyzed</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rithm Optimization</CardTitle>
                  <TrendingUp className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">96.8%</div>
                  <p className="text-xs text-green-100">Success probability</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Opportunity</CardTitle>
                  <Calculator className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$35-40B</div>
                  <p className="text-xs text-purple-100">TAM potential</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <Database className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-orange-100">Research initiatives</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Microscope className="w-5 h-5 text-blue-600" />
                    <span>Research Focus Areas</span>
                  </CardTitle>
                  <CardDescription>
                    Current medical research and bioimpedance analysis projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Dna className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Bioimpedance Algorithms</span>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Clinical Validation</span>
                    </div>
                    <Badge variant="secondary">Phase 3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Convergence Prediction</span>
                    </div>
                    <Badge variant="secondary">Complete</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Recursive Validation Results</span>
                  </CardTitle>
                  <CardDescription>
                    Revolutionary patent optimization achievements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Accuracy Improvement</span>
                      <span className="text-sm font-semibold">54%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Efficiency Gains</span>
                      <span className="text-sm font-semibold">38%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Patent Enhancement</span>
                      <span className="text-sm font-semibold">97.6%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Over-Delivery</span>
                      <span className="text-sm font-semibold">123%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patent-search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span>Advanced Patent Search & Optimization</span>
                </CardTitle>
                <CardDescription>
                  AI-powered patent analysis with Rithm convergence algorithms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Access the comprehensive patent search and optimization platform with mathematical 
                  convergence prediction capabilities.
                </p>
                <Button 
                  onClick={() => navigate('/patent-search')}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Launch Patent Search Platform
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rithm-optimization" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span>Universal Rithm Integration</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time optimization across all platform operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Monitor live optimization data collection and performance metrics 
                    across the entire platform with 5-second refresh intervals.
                  </p>
                  <Button 
                    onClick={() => navigate('/rithm-universal')}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    View Universal Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <span>Convergence Consulting</span>
                  </CardTitle>
                  <CardDescription>
                    Mathematical convergence prediction for business optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Access the world's first mathematical convergence platform with 
                    97.9% success probability vs 30% industry average.
                  </p>
                  <Button 
                    onClick={() => navigate('/convergence-consulting')}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Launch Convergence Platform
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="research-tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Dna className="w-5 h-5 text-green-600" />
                    <span>Bioimpedance Research</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Advanced bioimpedance algorithms for medical applications
                  </p>
                  <Button 
                    onClick={() => navigate('/rithm')}
                    variant="outline" 
                    className="w-full"
                  >
                    Access Rithm System
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span>Enhanced Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Comprehensive research data analysis and insights
                  </p>
                  <Button 
                    onClick={() => navigate('/rithm-enhanced')}
                    variant="outline" 
                    className="w-full"
                  >
                    Enhanced System
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <span>Feedback Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Real-time feedback loop optimization and monitoring
                  </p>
                  <Button 
                    onClick={() => navigate('/feedback-loop')}
                    variant="outline" 
                    className="w-full"
                  >
                    Feedback Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}