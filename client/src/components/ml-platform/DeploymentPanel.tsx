import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle, Rocket, Download, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface DeployedModel {
  id: string;
  endpoint: string;
  format: 'REST' | 'ONNX' | 'PMML';
  status: 'deployed' | 'deploying' | 'failed';
  version: string;
  createdAt: string;
}

interface ModelConfig {
  name: string;
  format: 'REST' | 'ONNX' | 'PMML';
  environment: 'production' | 'staging' | 'development';
  autoScale: boolean;
  memoryLimit: string;
}

interface DeploymentPanelProps {
  onDeployModel: (modelConfig: ModelConfig) => Promise<DeployedModel>;
  deployedModel?: DeployedModel;
  loading: boolean;
  modelData?: any;
}

export default function DeploymentPanel({ 
  onDeployModel, 
  deployedModel, 
  loading, 
  modelData 
}: DeploymentPanelProps) {
  const [config, setConfig] = useState<ModelConfig>({
    name: 'ml-model',
    format: 'REST',
    environment: 'staging',
    autoScale: true,
    memoryLimit: '512Mi'
  });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleDeploy = async () => {
    if (!modelData) {
      setError('No trained model available. Train a model first.');
      return;
    }

    try {
      setError(null);
      await onDeployModel(config);
      toast({
        title: "Deployment Started",
        description: `Model "${config.name}" is being deployed...`,
      });
    } catch (err) {
      setError('Failed to deploy model. Please try again.');
    }
  };

  const handleExportONNX = () => {
    if (!modelData) {
      setError('No trained model available for export.');
      return;
    }

    // Simulate ONNX export
    const onnxData = `# ONNX Model Export
# Model: ${config.name}
# Format: ONNX
# Exported: ${new Date().toISOString()}

import onnxruntime as ort
import numpy as np

# Load the exported model
session = ort.InferenceSession("${config.name}.onnx")

# Get input and output names
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

# Example prediction
def predict(data):
    result = session.run([output_name], {input_name: data})
    return result[0]

# Usage example:
# prediction = predict(your_input_data)
`;

    const blob = new Blob([onnxData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.name}.onnx.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "ONNX Export Complete",
      description: `Model exported as ${config.name}.onnx.py`,
    });
  };

  const handleExportPMML = () => {
    if (!modelData) {
      setError('No trained model available for export.');
      return;
    }

    // Simulate PMML export
    const pmmlData = `<?xml version="1.0" encoding="UTF-8"?>
<PMML version="4.4" xmlns="http://www.dmg.org/PMML-4_4">
  <Header copyright="ML Platform" description="Exported ML Model">
    <Application name="ML Platform" version="1.0"/>
    <Timestamp>${new Date().toISOString()}</Timestamp>
  </Header>
  
  <DataDictionary numberOfFields="4">
    <DataField name="feature1" optype="continuous" dataType="double"/>
    <DataField name="feature2" optype="continuous" dataType="double"/>
    <DataField name="feature3" optype="continuous" dataType="double"/>
    <DataField name="prediction" optype="continuous" dataType="double"/>
  </DataDictionary>
  
  <RegressionModel modelName="${config.name}" functionName="regression">
    <MiningSchema>
      <MiningField name="feature1"/>
      <MiningField name="feature2"/>
      <MiningField name="feature3"/>
      <MiningField name="prediction" usageType="target"/>
    </MiningSchema>
    
    <RegressionTable intercept="0.0">
      <NumericPredictor name="feature1" coefficient="1.0"/>
      <NumericPredictor name="feature2" coefficient="0.5"/>
      <NumericPredictor name="feature3" coefficient="0.25"/>
    </RegressionTable>
  </RegressionModel>
</PMML>`;

    const blob = new Blob([pmmlData], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.name}.pmml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "PMML Export Complete",
      description: `Model exported as ${config.name}.pmml`,
    });
  };

  const copyEndpoint = () => {
    if (deployedModel?.endpoint) {
      navigator.clipboard.writeText(deployedModel.endpoint);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Model endpoint URL copied successfully",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'deploying': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Model Deployment
          </CardTitle>
          <CardDescription>
            Deploy trained models to production or export in standard formats (ONNX, PMML)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!modelData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Train a machine learning model first to enable deployment.
              </AlertDescription>
            </Alert>
          )}

          {/* Deployment Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model Name</label>
              <Input
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Enter model name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deployment Format</label>
              <Select value={config.format} onValueChange={(value: any) => setConfig({ ...config, format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REST">REST API</SelectItem>
                  <SelectItem value="ONNX">ONNX Runtime</SelectItem>
                  <SelectItem value="PMML">PMML Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Environment</label>
              <Select value={config.environment} onValueChange={(value: any) => setConfig({ ...config, environment: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Memory Limit</label>
              <Select value={config.memoryLimit} onValueChange={(value) => setConfig({ ...config, memoryLimit: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="256Mi">256 MB</SelectItem>
                  <SelectItem value="512Mi">512 MB</SelectItem>
                  <SelectItem value="1Gi">1 GB</SelectItem>
                  <SelectItem value="2Gi">2 GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleDeploy} 
              disabled={loading || !modelData}
              className="flex-1"
            >
              {loading ? 'Deploying...' : 'Deploy Model'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportONNX}
              disabled={!modelData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export ONNX
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportPMML}
              disabled={!modelData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PMML
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Status */}
      {(loading || deployedModel) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Deployment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : deployedModel ? (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="font-medium text-sm">Model Status</p>
                    <p className="text-xs text-gray-500">{deployedModel.version}</p>
                  </div>
                  <Badge className={getStatusColor(deployedModel.status)}>
                    {deployedModel.status}
                  </Badge>
                </div>

                {deployedModel.endpoint && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Endpoint</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={deployedModel.endpoint} 
                        readOnly 
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyEndpoint}
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(deployedModel.endpoint, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="font-medium">Format</p>
                    <p className="text-gray-600 dark:text-gray-400">{deployedModel.format}</p>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="font-medium">Deployed</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(deployedModel.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* API Usage Example */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">API Usage Example</h4>
                  <div className="p-3 bg-gray-900 text-gray-100 rounded text-xs font-mono overflow-x-auto">
                    <pre>{`curl -X POST "${deployedModel.endpoint}/predict" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": [[1.0, 2.0, 3.0]],
    "format": "json"
  }'`}</pre>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Export Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Export Format Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 border rounded">
            <p className="font-medium">ONNX Export</p>
            <p className="text-gray-600 dark:text-gray-400">
              Open Neural Network Exchange format for cross-platform model deployment.
              Compatible with TensorFlow, PyTorch, and scikit-learn.
            </p>
          </div>
          <div className="p-3 border rounded">
            <p className="font-medium">PMML Export</p>
            <p className="text-gray-600 dark:text-gray-400">
              Predictive Model Markup Language for statistical models.
              Widely supported in enterprise environments and analytics platforms.
            </p>
          </div>
          <div className="p-3 border rounded">
            <p className="font-medium">REST API Deployment</p>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time inference endpoint with JSON input/output.
              Includes auto-scaling and monitoring capabilities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}