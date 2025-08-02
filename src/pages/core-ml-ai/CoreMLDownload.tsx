import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, FileText, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MLModel {
  name: string;
  filename: string;
  size: number;
  modified: string;
}

interface ModelsResponse {
  models: MLModel[];
}

export default function CoreMLDownload() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data: ModelsResponse = await response.json();
      setModels(data.models);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load models",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadModel = async (modelName: string, filename: string) => {
    setDownloading(modelName);
    
    try {
      const response = await fetch(`/api/download/${modelName}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `Downloaded ${filename}`,
      });
      
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to download model",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📱 Core ML Model Downloads
        </h1>
        <p className="text-gray-600">
          Download .mlmodel files for iOS app integration and testing
        </p>
      </div>

      {/* iOS Instructions */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Smartphone className="w-5 h-5" />
            iOS Safari Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <ol className="list-decimal list-inside space-y-2">
            <li>Open this page in Safari on your iPhone/iPad</li>
            <li>Click download button for any model below</li>
            <li>Files will save to iOS Files app automatically</li>
            <li>Use with CoreMLCompare app from App Store for testing</li>
          </ol>
        </CardContent>
      </Card>

      {/* Models List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading models...</div>
            </CardContent>
          </Card>
        ) : models.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No models available</p>
                <p className="text-sm text-gray-400">Train a model first to generate downloads</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          models.map((model) => (
            <Card key={model.name} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {model.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span>{formatFileSize(model.size)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(model.modified)}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">.mlmodel</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Core ML format • iOS compatible • Ready for integration
                  </div>
                  <Button 
                    onClick={() => downloadModel(model.name, model.filename)}
                    disabled={downloading === model.name}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {downloading === model.name ? 'Downloading...' : 'Download'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Testing Info */}
      <Card className="mt-8 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Testing with CoreMLCompare</CardTitle>
        </CardHeader>
        <CardContent className="text-green-800 space-y-2">
          <p>1. Download CoreMLCompare from the App Store (free)</p>
          <p>2. Open the downloaded .mlmodel file in CoreMLCompare</p>
          <p>3. View model architecture, input/output specifications</p>
          <p>4. Test with sample inputs to verify functionality</p>
          <p className="text-sm text-green-600 mt-4">
            Note: These are dummy models for testing download infrastructure only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}