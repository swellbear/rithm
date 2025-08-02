import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Eye, Upload, Image as ImageIcon, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VisionResults {
  classifications: { label: string; score: number }[];
  objects: { label: string; score: number; bbox: { x: number; y: number; width: number; height: number } }[];
  ocrText: string;
}

interface VisionPanelProps {
  onAnalyzeVision: (imageBase64: string) => Promise<VisionResults>;
  visionResults?: VisionResults;
  loading: boolean;
}

export default function VisionPanel({ onAnalyzeVision, visionResults, loading }: VisionPanelProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    try {
      setError(null);
      await onAnalyzeVision(selectedImage);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vision Analysis
          </CardTitle>
          <CardDescription>
            Upload images for object detection, classification, and OCR text extraction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Image</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              {selectedImage ? (
                <div className="space-y-4">
                  <img 
                    src={selectedImage} 
                    alt="Selected for analysis" 
                    className="max-w-full h-48 mx-auto object-contain rounded"
                  />
                  <div className="flex justify-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Image
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedImage(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Select Image
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleAnalyze} 
            disabled={loading || !selectedImage}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Analyze Image'}
          </Button>
        </CardContent>
      </Card>

      {(loading || visionResults) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Vision Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : visionResults ? (
              <>
                {/* Image Classifications */}
                {visionResults.classifications && visionResults.classifications.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Image Classifications</h4>
                    <div className="space-y-2">
                      {visionResults.classifications.map((classification, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm">{classification.label}</span>
                          <Badge className={getConfidenceColor(classification.score)}>
                            {Math.round(classification.score * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Object Detection */}
                {visionResults.objects && visionResults.objects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Detected Objects</h4>
                    <div className="space-y-2">
                      {visionResults.objects.map((object, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex flex-col">
                            <span className="text-sm">{object.label}</span>
                            <span className="text-xs text-gray-500">
                              Position: ({object.bbox.x}, {object.bbox.y}) Size: {object.bbox.width}×{object.bbox.height}
                            </span>
                          </div>
                          <Badge className={getConfidenceColor(object.score)}>
                            {Math.round(object.score * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OCR Text Extraction */}
                {visionResults.ocrText && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Extracted Text (OCR)
                    </h4>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                      <p className="text-sm whitespace-pre-wrap">{visionResults.ocrText}</p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}