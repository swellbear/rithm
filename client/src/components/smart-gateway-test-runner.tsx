// Smart Gateway Test Runner Component

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Target,
  Route,
  Brain,
  TrendingUp,
  Users,
  BarChart3
} from "lucide-react";
import { SmartGatewayTestFramework, type TestResult, type TestScenario } from "@/lib/smart-gateway-testing";

export function SmartGatewayTestRunner() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    // Simulate async testing
    await new Promise(resolve => setTimeout(resolve, 1000));
    const results = SmartGatewayTestFramework.runAllTests();
    setTestResults(results);
    setIsRunning(false);
  };

  const runSingleTest = async (scenario: TestScenario) => {
    setIsRunning(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = SmartGatewayTestFramework.runTestScenario(scenario);
    setTestResults(prev => [...prev.filter(r => r.scenarioId !== scenario.id), result]);
    setIsRunning(false);
  };

  const scenarios = SmartGatewayTestFramework.generateTestScenarios();
  const testReport = testResults.length > 0 ? SmartGatewayTestFramework.generateTestReport(testResults) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Smart Gateway Testing & Validation
          </CardTitle>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive test scenarios to validate intelligent adaptations across farm types and experience levels
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            {testReport && (
              <div className="flex items-center gap-4 text-sm">
                <Badge variant={testReport.summary.passRate === 100 ? 'default' : 'destructive'}>
                  {testReport.summary.passed}/{testReport.summary.totalTests} Passed ({testReport.summary.passRate}%)
                </Badge>
                <div className="text-gray-600">
                  {testReport.summary.failed} failures
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="report">Summary Report</TabsTrigger>
        </TabsList>

        {/* Test Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-4">
            {scenarios.map((scenario) => {
              const result = testResults.find(r => r.scenarioId === scenario.id);
              
              return (
                <Card key={scenario.id} className="border-gray-200 dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {result?.passed === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {result?.passed === false && <XCircle className="h-5 w-5 text-red-500" />}
                        {scenario.name}
                      </CardTitle>
                      <Button 
                        size="sm" 
                        onClick={() => runSingleTest(scenario)}
                        disabled={isRunning}
                      >
                        Test
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {scenario.description}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {/* Farm Context */}
                      <div className="space-y-2">
                        <div className="font-medium flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Farm Context
                        </div>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <div>{scenario.farmContext.animals.length} animals</div>
                          <div>{scenario.farmContext.paddocks.length} paddocks</div>
                          <div>{scenario.farmContext.assessments.length} assessments</div>
                          <div className="capitalize">{scenario.farmContext.tier} tier</div>
                          <div className="capitalize">{scenario.farmContext.season} season</div>
                        </div>
                      </div>

                      {/* Expected Behavior */}
                      <div className="space-y-2">
                        <div className="font-medium flex items-center gap-1">
                          <Brain className="h-4 w-4" />
                          Expected
                        </div>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <div>Experience: {scenario.expectedBehavior.experienceLevel}</div>
                          <div>Priority: {scenario.expectedBehavior.topPriorityTask}</div>
                          <div>Urgency: {scenario.expectedBehavior.urgencyRange[0]}-{scenario.expectedBehavior.urgencyRange[1]}</div>
                        </div>
                      </div>

                      {/* Routing Logic */}
                      <div className="space-y-2">
                        <div className="font-medium flex items-center gap-1">
                          <Route className="h-4 w-4" />
                          Smart Routing
                        </div>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          {scenario.expectedBehavior.routingDecisions.slice(0, 2).map((decision, i) => (
                            <div key={i} className="text-xs">
                              {decision.taskId} → {decision.expectedRoute.split('/').pop()}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Adaptations */}
                      <div className="space-y-2">
                        <div className="font-medium flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Adaptations
                        </div>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          {scenario.expectedBehavior.seasonalAdaptations.slice(0, 2).map((adaptation, i) => (
                            <div key={i} className="text-xs">
                              {adaptation.slice(0, 40)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Test Result */}
                    {result && (
                      <div className="mt-4 pt-4 border-t">
                        {result.passed ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Test Passed
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="h-4 w-4" />
                              Test Failed
                            </div>
                            <div className="text-sm text-red-600 space-y-1">
                              {result.issues.map((issue, i) => (
                                <div key={i}>• {issue}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {testResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  No test results yet. Run tests to see results.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {testResults.map((result) => {
                const scenario = scenarios.find(s => s.id === result.scenarioId);
                return (
                  <Card key={result.scenarioId}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        {scenario?.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium mb-2">Expected vs Actual</div>
                          <div className="space-y-1">
                            <div>Experience: {scenario?.expectedBehavior.experienceLevel} → {result.actualBehavior.experienceLevel}</div>
                            <div>Top Priority: {scenario?.expectedBehavior.topPriorityTask} → {result.actualBehavior.topPriorityTask}</div>
                            <div>Max Urgency: {Math.max(...(result.actualBehavior.urgencyScores || [0]))}</div>
                          </div>
                        </div>
                        
                        {!result.passed && (
                          <div>
                            <div className="font-medium mb-2 text-red-600">Issues Found</div>
                            <div className="space-y-1 text-red-600">
                              {result.issues.map((issue, i) => (
                                <div key={i}>• {issue}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Summary Report Tab */}
        <TabsContent value="report" className="space-y-4">
          {testReport ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Test Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{testReport.summary.totalTests}</div>
                      <div className="text-sm text-gray-600">Total Tests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{testReport.summary.passed}</div>
                      <div className="text-sm text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{testReport.summary.failed}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{testReport.summary.passRate}%</div>
                      <div className="text-sm text-gray-600">Pass Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {testReport.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {testReport.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">{rec}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  Run tests to generate summary report.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}