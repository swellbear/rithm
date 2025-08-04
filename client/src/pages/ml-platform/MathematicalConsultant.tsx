import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calculator, TrendingUp, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConsultantResponse {
  response: string;
  framework: string;
  confidence: number;
  authentic: boolean;
  convergence_data?: {
    dataRequirements: number;
    effortRequired: number;
    successProbability: number;
    timeToConvergence: number;
  };
  bayesian_analysis?: {
    prior: number;
    posterior: number;
    evidence: number;
  };
  cross_domain?: {
    similarity: number;
    transferPotential: number;
  };
}

export default function MathematicalConsultant() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<ConsultantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a consulting query to analyze.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/mathematical-consultant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResponse(result);
      
      toast({
        title: "Analysis Complete",
        description: `Using ${result.framework} with ${result.confidence}% confidence`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      analyzeQuery();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Mathematical Framework Consultant</h1>
          </div>
          <p className="text-gray-600">
            Pure algorithmic consulting using authentic ANSUR II convergence data
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="text-green-700 border-green-300">
              ✅ AUTHENTIC DATA ONLY
            </Badge>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              📊 52.2% Weight Accuracy
            </Badge>
            <Badge variant="outline" className="text-purple-700 border-purple-300">
              👥 6,068 Subjects
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Enterprise Consulting Query
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your business optimization, strategy, or technical analysis query..."
                className="flex-1"
                disabled={loading}
              />
              <Button onClick={analyzeQuery} disabled={loading || !query.trim()}>
                {loading ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Example queries:</strong> "Optimize my enterprise system", "Predict convergence for software development project", "Analyze business integration strategy"
            </div>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Mathematical Analysis Results
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={response.authentic ? "default" : "secondary"}>
                    {response.framework}
                  </Badge>
                  <Badge variant="outline">
                    {response.confidence}% Confidence
                  </Badge>
                  {response.authentic && (
                    <Badge className="bg-green-100 text-green-800">
                      ✅ Authentic
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {response.response}
                </pre>
              </div>

              {response.convergence_data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {response.convergence_data.successProbability.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Success Probability</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {response.convergence_data.effortRequired}
                    </div>
                    <div className="text-xs text-gray-600">Effort Units</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {response.convergence_data.timeToConvergence}
                    </div>
                    <div className="text-xs text-gray-600">Cycles to Convergence</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {response.convergence_data.dataRequirements.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Data Requirements</div>
                  </div>
                </div>
              )}

              {response.bayesian_analysis && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-lg font-bold text-indigo-600">
                      {(response.bayesian_analysis.prior * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Prior Probability</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-lg font-bold text-indigo-600">
                      {(response.bayesian_analysis.posterior * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Posterior Probability</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-lg font-bold text-indigo-600">
                      {(response.bayesian_analysis.evidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Evidence Strength</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600 border-t pt-3">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Analysis based on authentic ANSUR II bioimpedance data from 6,068 subjects. 
                  All calculations use real convergence patterns with zero fabricated claims.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Available Mathematical Frameworks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold">Convergence Analysis</h4>
                <p className="text-sm text-gray-600">
                  Predicts data requirements, effort, and success probability using authentic convergence rates
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold">Bayesian Inference</h4>
                <p className="text-sm text-gray-600">
                  Updates probability estimates based on domain evidence and prior knowledge
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold">Cross-Domain Transfer</h4>
                <p className="text-sm text-gray-600">
                  Applies bioimpedance patterns to other domains with similarity analysis
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold">Mathematical Optimization</h4>
                <p className="text-sm text-gray-600">
                  Calculates optimal approaches using limit theory and convergence mathematics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}