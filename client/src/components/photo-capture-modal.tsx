import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AnalysisResultsModal from "./analysis-results-modal";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Camera, RotateCcw, Check, MapPin, Lightbulb, X } from "lucide-react";

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId?: number | null;
}

export default function PhotoCaptureModal({ isOpen, onClose, assessmentId }: PhotoCaptureModalProps) {
  const [currentPoint, setCurrentPoint] = useState(1);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const { capturePhoto, isSupported: cameraSupported } = useCamera();
  const { location, accuracy, isLoading: locationLoading } = useGeolocation();

  const identifyPlantsMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest("POST", "/api/identify-plants", {
        imageData,
        gpsLocation: location,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      setIsAnalysisOpen(true);
    },
  });

  const handleCapture = useCallback(async () => {
    if (!cameraSupported) {
      // Fallback for demo - use a sample image
      setCapturedPhoto("data:image/jpeg;base64,sample");
      return;
    }

    try {
      const photoData = await capturePhoto();
      setCapturedPhoto(photoData);
    } catch (error) {
      // Photo capture failed - device may not support camera access
    }
  }, [capturePhoto, cameraSupported]);

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleAnalyze = () => {
    if (capturedPhoto) {
      identifyPlantsMutation.mutate(capturedPhoto);
    }
  };

  const handleClose = () => {
    setCapturedPhoto(null);
    setCurrentPoint(1);
    setAnalysisResults(null);
    onClose();
  };

  const nextStepPoint = () => {
    setCurrentPoint(prev => prev + 1);
    setCapturedPhoto(null);
    setIsAnalysisOpen(false);
    setAnalysisResults(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Step Point #{currentPoint}</DialogTitle>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Camera Preview Area */}
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
              {capturedPhoto ? (
                <img 
                  src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Captured pasture" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {cameraSupported ? "Ready to capture" : "Camera not available - using demo mode"}
                  </p>
                </div>
              )}
              
              {/* Overlay guides */}
              {!capturedPhoto && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Center crosshair */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-white shadow-lg"></div>
                    <div className="w-0.5 h-8 bg-white shadow-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  
                  {/* Corner guides */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-white shadow-lg"></div>
                  <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-white shadow-lg"></div>
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-white shadow-lg"></div>
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-white shadow-lg"></div>
                </div>
              )}
            </div>
            
            {/* GPS and Instructions */}
            <div className="space-y-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center text-sm text-text-secondary mb-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="font-medium">GPS Location</span>
                    {locationLoading && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Locating...
                      </Badge>
                    )}
                  </div>
                  {location ? (
                    <>
                      <div className="text-xs text-gray-600">
                        {location.latitude.toFixed(4)}° N, {location.longitude.toFixed(4)}° W
                      </div>
                      <div className="text-xs text-gray-500">
                        Accuracy: ±{accuracy || "unknown"} feet
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-600">Location unavailable</div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="text-sm font-medium text-blue-800 mb-1 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-1" />
                    Photo Tip
                  </div>
                  <div className="text-xs text-blue-700">
                    Hold camera 3-4 feet above ground. Center the crosshair on your step point. 
                    Ensure good lighting for plant identification.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Modal Actions */}
          <div className="flex space-x-3">
            {capturedPhoto ? (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleRetake}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary-dark" 
                  onClick={handleAnalyze}
                  disabled={identifyPlantsMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {identifyPlantsMutation.isPending ? "Analyzing..." : "Analyze"}
                </Button>
              </>
            ) : (
              <Button 
                className="flex-1 bg-primary hover:bg-primary-dark" 
                onClick={handleCapture}
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AnalysisResultsModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        results={analysisResults}
        onNextPoint={nextStepPoint}
        pointNumber={currentPoint}
      />
    </>
  );
}
