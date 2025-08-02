import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MLResults {
  accuracy: number;
  training_time: number;
  expected_loss: number;
  confidence_interval: [number, number];
  samples: number;
}

export default function MLTraining() {
  const [dataset, setDataset] = useState('');
  const [model, setModel] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [results, setResults] = useState<MLResults | null>(null);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const trainModel = async () => {
    if (!dataset || !model) {
      toast({
        title: "Selection Required",
        description: "Please select both dataset and model type.",
        variant: "destructive"
      });
      return;
    }

    setIsTraining(true);
    setError('');
    
    try {
      const response = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset, model })
      });

      if (!response.ok) {
        throw new Error(`Training failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      toast({
        title: "Training Complete",
        description: `Model trained successfully with ${(data.accuracy * 100).toFixed(1)}% accuracy`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Training failed';
      setError(errorMsg);
      toast({
        title: "Training Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">ML Training Monitor</h1>
        <p className="text-muted-foreground">
          Train machine learning models with real scikit-learn and Monte Carlo integration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Training Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Training Configuration</CardTitle>
            <CardDescription>
              Select your dataset and model for training
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Dataset Domain</label>
              <Select onValueChange={setDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose dataset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthcare">Healthcare (Age, BMI, BP, Cholesterol)</SelectItem>
                  <SelectItem value="finance">Finance (Market Cap, P/E, Debt, ROE)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Model Type</label>
              <Select onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logistic">Logistic Regression</SelectItem>
                  <SelectItem value="random_forest">Random Forest</SelectItem>
                  <SelectItem value="linear">Linear Regression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={trainModel} 
              disabled={isTraining || !dataset || !model}
              className="w-full"
            >
              {isTraining ? 'Training Model...' : 'Train Model'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Display */}
        <Card>
          <CardHeader>
            <CardTitle>Training Results</CardTitle>
            <CardDescription>
              Model performance and Monte Carlo analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(results.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.training_time.toFixed(3)}s
                    </div>
                    <div className="text-sm text-muted-foreground">Training Time</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Monte Carlo Integration</h4>
                  <div className="text-sm space-y-1">
                    <div>Expected Loss: <Badge variant="outline">{results.expected_loss.toFixed(6)}</Badge></div>
                    <div>95% Confidence: [{results.confidence_interval[0].toFixed(6)}, {results.confidence_interval[1].toFixed(6)}]</div>
                    <div>Samples: {results.samples.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select dataset and model to begin training
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Badge variant="secondary">scikit-learn</Badge>
              <div className="text-muted-foreground">Real ML training</div>
            </div>
            <div>
              <Badge variant="secondary">Monte Carlo</Badge>
              <div className="text-muted-foreground">E[L] = ∫ L(θ,x|D(ξ)) p(ξ) dξ</div>
            </div>
            <div>
              <Badge variant="secondary">Statistics</Badge>
              <div className="text-muted-foreground">Confidence intervals</div>
            </div>
            <div>
              <Badge variant="secondary">Real Data</Badge>
              <div className="text-muted-foreground">Authentic results only</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}