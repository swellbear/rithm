import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Shield, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface GovernanceMetrics {
  explainability: number;
  biasScore: number;
  fairnessMetrics: {
    demographicParity: number;
    equalizedOdds: number;
  };
  featureImportance: { feature: string; importance: number }[];
}

interface GovernancePanelProps {
  onGenerateGovernanceMetrics: (modelData: any) => Promise<GovernanceMetrics>;
  governanceMetrics?: GovernanceMetrics;
  loading: boolean;
  modelData?: any;
}

export default function GovernancePanel({ 
  onGenerateGovernanceMetrics, 
  governanceMetrics, 
  loading, 
  modelData 
}: GovernancePanelProps) {
  const [error, setError] = useState<string | null>(null);

  const handleGenerateMetrics = async () => {
    if (!modelData) {
      setError('No model data available. Train a model first.');
      return;
    }

    try {
      setError(null);
      await onGenerateGovernanceMetrics(modelData);
    } catch (err) {
      setError('Failed to generate governance metrics. Please try again.');
    }
  };

  const getBiasRiskLevel = (biasScore: number) => {
    if (biasScore <= 0.2) return { level: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    if (biasScore <= 0.4) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { level: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  };

  const getExplainabilityLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Excellent', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    if (score >= 0.6) return { level: 'Good', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    if (score >= 0.4) return { level: 'Fair', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    return { level: 'Poor', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
  };

  const fairnessColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  const fairnessData = governanceMetrics?.fairnessMetrics ? [
    { name: 'Demographic Parity', value: governanceMetrics.fairnessMetrics.demographicParity },
    { name: 'Equalized Odds', value: governanceMetrics.fairnessMetrics.equalizedOdds },
  ] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI Governance & Explainability
          </CardTitle>
          <CardDescription>
            Generate bias metrics, fairness analysis, and model explainability reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!modelData && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Train a machine learning model first to generate governance metrics.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleGenerateMetrics} 
            disabled={loading || !modelData}
            className="w-full"
          >
            {loading ? 'Generating Metrics...' : 'Generate Governance Metrics'}
          </Button>
        </CardContent>
      </Card>

      {(loading || governanceMetrics) && (
        <div className="space-y-6">
          {/* Explainability Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Model Explainability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : governanceMetrics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Explainability Score</span>
                    <Badge className={getExplainabilityLevel(governanceMetrics.explainability).color}>
                      {getExplainabilityLevel(governanceMetrics.explainability).level}
                    </Badge>
                  </div>
                  <Progress value={governanceMetrics.explainability * 100} className="h-3" />
                  <p className="text-sm text-gray-500">
                    {Math.round(governanceMetrics.explainability * 100)}% - Higher scores indicate better model interpretability
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Bias Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Bias Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : governanceMetrics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bias Risk Level</span>
                    <Badge className={getBiasRiskLevel(governanceMetrics.biasScore).color}>
                      {getBiasRiskLevel(governanceMetrics.biasScore).level} Risk
                    </Badge>
                  </div>
                  <Progress value={governanceMetrics.biasScore * 100} className="h-3" />
                  <p className="text-sm text-gray-500">
                    {Math.round(governanceMetrics.biasScore * 100)}% bias score - Lower scores indicate less biased predictions
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Fairness Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Fairness Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : governanceMetrics?.fairnessMetrics ? (
                <div className="space-y-4">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fairnessData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${Math.round(value * 100)}%`}
                        >
                          {fairnessData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={fairnessColors[index % fairnessColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number | undefined) => value ? [`${Math.round(value * 100)}%`, 'Score'] : ['N/A', 'Score']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="font-medium">Demographic Parity</p>
                      <p className="text-lg font-bold">
                        {Math.round(governanceMetrics.fairnessMetrics.demographicParity * 100)}%
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="font-medium">Equalized Odds</p>
                      <p className="text-lg font-bold">
                        {Math.round(governanceMetrics.fairnessMetrics.equalizedOdds * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Feature Importance (SHAP-like) */}
          {governanceMetrics?.featureImportance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Feature Importance Analysis
                </CardTitle>
                <CardDescription>
                  SHAP-like feature importance for model interpretability
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={governanceMetrics.featureImportance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="feature" 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          fontSize={12}
                        />
                        <YAxis 
                          label={{ value: 'Importance', angle: -90, position: 'insideLeft' }}
                          fontSize={12}
                        />
                        <Tooltip 
                          formatter={(value: number) => [value.toFixed(3), 'Importance']}
                        />
                        <Bar 
                          dataKey="importance" 
                          fill="#8884d8"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compliance Summary */}
          {governanceMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">Model Transparency</span>
                    <Badge variant={governanceMetrics.explainability >= 0.7 ? "default" : "destructive"}>
                      {governanceMetrics.explainability >= 0.7 ? "✓ Compliant" : "⚠ Needs Review"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">Bias Assessment</span>
                    <Badge variant={governanceMetrics.biasScore <= 0.3 ? "default" : "destructive"}>
                      {governanceMetrics.biasScore <= 0.3 ? "✓ Low Risk" : "⚠ High Risk"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm font-medium">Fairness Standards</span>
                    <Badge variant={
                      (governanceMetrics.fairnessMetrics.demographicParity >= 0.8 && 
                       governanceMetrics.fairnessMetrics.equalizedOdds >= 0.8) ? "default" : "destructive"
                    }>
                      {(governanceMetrics.fairnessMetrics.demographicParity >= 0.8 && 
                        governanceMetrics.fairnessMetrics.equalizedOdds >= 0.8) ? "✓ Fair" : "⚠ Unfair"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}