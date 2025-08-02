import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Brain, Building, TrendingUp, AlertTriangle, CheckCircle, XCircle, Cpu, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

interface BusinessConsultingResponse {
  success: boolean;
  domain: string;
  confidence: number;
  analysis?: {
    type: string;
    results: any;
    dataSource: string;
    dataPoints: number;
  };
  error?: string;
  recommendations?: string[];
}

interface DomainTestResponse {
  query: string;
  domain: string;
  confidence: number;
  queryType: string;
  scores: {
    business: number;
    manufacturing: number;
    agriculture: number;
  };
}

interface HealthResponse {
  status: string;
  timestamp: string;
  message: string;
  fabricationPolicy: string;
}

export default function RithmConsultant() {
  const [query, setQuery] = useState('');
  const [testResults, setTestResults] = useState<DomainTestResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Health check query
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery<HealthResponse>({
    queryKey: ['/api/rithm/health'],
    refetchInterval: 10000, // Refresh every 10 seconds for better responsiveness
    retry: 2,
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Process business query mutation
  const processQueryMutation = useMutation({
    mutationFn: async (queryText: string) => {
      const response = await fetch('/api/rithm/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText }),
      });
      return response.json();
    },
    onSuccess: (data: BusinessConsultingResponse) => {
      if (data.success) {
        toast({
          title: "Analysis Complete",
          description: `Domain: ${data.domain} (${data.confidence}% confidence)`,
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "System Error",
        description: "Failed to process query",
        variant: "destructive",
      });
    },
  });

  // Test domain detection mutation
  const testDomainMutation = useMutation({
    mutationFn: async (queryText: string) => {
      const response = await fetch('/api/rithm/test-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText }),
      });
      return response.json();
    },
    onSuccess: (data: DomainTestResponse) => {
      setTestResults(data);
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: "Failed to test domain detection",
        variant: "destructive",
      });
    },
  });

  const handleSubmitQuery = () => {
    if (!query.trim()) {
      toast({
        title: "Invalid Query",
        description: "Please enter a query",
        variant: "destructive",
      });
      return;
    }
    processQueryMutation.mutate(query);
  };

  const handleTestDomain = () => {
    if (!query.trim()) {
      toast({
        title: "Invalid Query",
        description: "Please enter a query to test",
        variant: "destructive",
      });
      return;
    }
    testDomainMutation.mutate(query);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Rithm Associate</h1>
        </div>
        <p className="text-gray-600">
          Universal AI platform for business consulting, manufacturing, and agriculture
        </p>
        <div className="flex items-center justify-center gap-2">
          {healthLoading ? (
            <Badge variant="secondary">Checking...</Badge>
          ) : healthData?.status === 'healthy' ? (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              System Healthy
            </Badge>
          ) : healthError ? (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              Connection Error
            </Badge>
          ) : (
            <Badge variant="secondary">
              <CheckCircle className="w-3 h-3 mr-1" />
              OpenAI Ready
            </Badge>
          )}
          <Badge variant="outline">Zero Fabrication Policy</Badge>
        </div>
      </div>

      {/* ML Platform Access Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Cpu className="w-8 h-8" />
            🚀 Comprehensive ML Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Access your advanced machine learning platform with PyTorch, OpenAI integration, and customizable PDF reports.</p>
          <div className="flex gap-4">
            <Link href="/ml-platform">
              <Button className="bg-white text-purple-600 hover:bg-gray-100">
                <ExternalLink className="w-4 h-4 mr-2" />
                Launch ML Platform
              </Button>
            </Link>
            <Button 
              onClick={() => window.open('/streamlit', '_blank')}
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
            >
              Direct Access
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Consultation Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ask about financial analysis, market research, industry benchmarks, competitive analysis, or business strategy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmitQuery}
              disabled={processQueryMutation.isPending}
              className="flex-1"
            >
              {processQueryMutation.isPending ? 'Processing...' : 'Submit Query'}
            </Button>
            <Button 
              onClick={handleTestDomain}
              disabled={testDomainMutation.isPending}
              variant="outline"
            >
              Test Domain Detection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain Detection Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Domain Detection Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Detected Domain</p>
                <div>
                  <Badge variant={testResults.domain === 'business_consulting' ? 'default' : 'secondary'}>
                    {testResults.domain}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="text-lg font-semibold">{testResults.confidence}%</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">Keyword Match Scores</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-sm font-medium">Business</p>
                  <p className="text-lg font-bold text-blue-600">{testResults.scores.business}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Manufacturing</p>
                  <p className="text-lg font-bold text-green-600">{testResults.scores.manufacturing}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Agriculture</p>
                  <p className="text-lg font-bold text-orange-600">{testResults.scores.agriculture}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Query Type</p>
              <p className="font-medium">{testResults.queryType}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Processing Results */}
      {processQueryMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {processQueryMutation.data.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Domain</p>
                    <div><Badge>{processQueryMutation.data.domain}</Badge></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-lg font-semibold">{processQueryMutation.data.confidence}%</p>
                  </div>
                </div>
                
                {processQueryMutation.data.analysis && (
                  <div>
                    <p className="text-sm text-gray-600">Analysis Type</p>
                    <p className="font-medium">{processQueryMutation.data.analysis.type}</p>
                    <p className="text-sm text-gray-600">Data Source</p>
                    <p className="font-medium">{processQueryMutation.data.analysis.dataSource}</p>
                  </div>
                )}
                
                {processQueryMutation.data.recommendations && Object.keys(processQueryMutation.data.recommendations).length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">AI-Powered Recommendations</p>
                    <div className="space-y-3">
                      {Object.entries(processQueryMutation.data.recommendations).map(([key, rec]: [string, any]) => (
                        <div key={key} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          {typeof rec === 'object' && rec.title ? (
                            <div>
                              <h4 className="font-semibold text-blue-800 mb-1">{rec.title}</h4>
                              <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                              {rec.action_items && Array.isArray(rec.action_items) && (
                                <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                                  {rec.action_items.map((item: string, idx: number) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm">{typeof rec === 'string' ? rec : JSON.stringify(rec)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {processQueryMutation.data.analysis?.results && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Analysis Details</p>
                    <div className="text-sm bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(processQueryMutation.data.analysis.results, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>System Notice:</strong> {processQueryMutation.data.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Primary Domain:</strong> Business Consulting</p>
            <p><strong>Secondary Domains:</strong> Manufacturing, Agriculture</p>
            <p><strong>Data Policy:</strong> Zero Fabrication - Authentic Data Only</p>
            <p><strong>Supported Data Sources:</strong> SEC EDGAR, FRED API, Bureau of Labor Statistics, World Bank</p>
            <div className="flex items-center justify-between">
              <strong>System Status:</strong>
              <Badge variant="default">OpenAI Powered</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}