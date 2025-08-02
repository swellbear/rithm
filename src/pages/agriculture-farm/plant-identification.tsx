import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Camera, Upload, Search, Leaf, MapPin, Calendar, 
  Info, BookOpen, Target, Database, Zap, Eye,
  CheckCircle, X, RotateCcw, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlantIdentification {
  id: string;
  species: string;
  commonName: string;
  scientificName: string;
  confidence: number;
  category: "grass" | "legume" | "forb" | "weed" | "shrub" | "tree";
  nutritionalValue: {
    protein: number;
    fiber: number;
    digestibility: number;
    palatability: "high" | "medium" | "low";
  };
  characteristics: {
    growthHabit: string;
    season: "cool" | "warm" | "both";
    drought: "tolerant" | "moderate" | "sensitive";
    grazing: "excellent" | "good" | "fair" | "poor" | "avoid";
  };
  description: string;
  managementNotes: string[];
}

interface PhotoCapture {
  id: string;
  imageData: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  paddockId?: number;
  assessmentId?: string;
  identified: boolean;
  plantId?: string;
}

interface PlantLibrary {
  id: string;
  species: string;
  category: string;
  region: string;
  images: string[];
  description: string;
  nutritionalData: any;
  managementTips: string[];
  season: string;
  addedBy: string;
  verified: boolean;
}

export default function PlantIdentification() {
  // Auto-set complexity based on subscription tier
  const complexityLevel = 'intermediate'; // All users get same plant identification features
  const [captureMode, setCaptureMode] = useState<"camera" | "upload" | "library">("camera");
  const [captures, setCaptures] = useState<PhotoCapture[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<PhotoCapture | null>(null);
  const [identificationResults, setIdentificationResults] = useState<PlantIdentification[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEducational, setShowEducational] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Mock plant database for demonstration
  const plantDatabase: PlantIdentification[] = [
    {
      id: "bermuda_grass",
      species: "Bermudagrass",
      commonName: "Common Bermudagrass",
      scientificName: "Cynodon dactylon",
      confidence: 92,
      category: "grass",
      nutritionalValue: {
        protein: 10,
        fiber: 28,
        digestibility: 65,
        palatability: "high"
      },
      characteristics: {
        growthHabit: "Stoloniferous, rhizomatous perennial",
        season: "warm",
        drought: "tolerant",
        grazing: "excellent"
      },
      description: "Aggressive warm-season perennial grass with excellent grazing tolerance and nutritional value.",
      managementNotes: [
        "Responds well to rotational grazing",
        "Requires adequate nitrogen for quality",
        "Can become dormant in cool weather",
        "Excellent for high-traffic areas"
      ]
    },
    {
      id: "white_clover",
      species: "White Clover",
      commonName: "Dutch White Clover",
      scientificName: "Trifolium repens",
      confidence: 88,
      category: "legume",
      nutritionalValue: {
        protein: 18,
        fiber: 20,
        digestibility: 75,
        palatability: "high"
      },
      characteristics: {
        growthHabit: "Low-growing, stoloniferous perennial",
        season: "cool",
        drought: "moderate",
        grazing: "excellent"
      },
      description: "Nitrogen-fixing legume that improves soil fertility and provides high-quality forage.",
      managementNotes: [
        "Fixes atmospheric nitrogen",
        "Excellent protein source",
        "Sensitive to overgrazing",
        "Prefers slightly acidic soils"
      ]
    },
    {
      id: "tall_fescue",
      species: "Tall Fescue",
      commonName: "Kentucky 31 Fescue",
      scientificName: "Schedonorus arundinaceus",
      confidence: 85,
      category: "grass",
      nutritionalValue: {
        protein: 12,
        fiber: 32,
        digestibility: 60,
        palatability: "medium"
      },
      characteristics: {
        growthHabit: "Bunch-type cool-season perennial",
        season: "cool",
        drought: "tolerant",
        grazing: "good"
      },
      description: "Hardy cool-season grass with good persistence but potential endophyte concerns.",
      managementNotes: [
        "May contain endophytes affecting livestock",
        "Very drought tolerant",
        "Best grazed in cool weather",
        "Consider novel endophyte varieties"
      ]
    },
    {
      id: "common_plantain",
      species: "Broadleaf Plantain",
      commonName: "Common Plantain",
      scientificName: "Plantago major",
      confidence: 76,
      category: "forb",
      nutritionalValue: {
        protein: 14,
        fiber: 25,
        digestibility: 70,
        palatability: "medium"
      },
      characteristics: {
        growthHabit: "Rosette-forming perennial",
        season: "both",
        drought: "moderate",
        grazing: "fair"
      },
      description: "Useful forb that indicates soil compaction and provides medicinal properties.",
      managementNotes: [
        "Indicates compacted soils",
        "Has natural antibiotic properties",
        "Good mineral content",
        "Can become weedy in overgrazed areas"
      ]
    },
    {
      id: "johnsongrass",
      species: "Johnsongrass",
      commonName: "Johnson Grass",
      scientificName: "Sorghum halepense",
      confidence: 94,
      category: "weed",
      nutritionalValue: {
        protein: 8,
        fiber: 35,
        digestibility: 55,
        palatability: "low"
      },
      characteristics: {
        growthHabit: "Rhizomatous perennial",
        season: "warm",
        drought: "tolerant",
        grazing: "avoid"
      },
      description: "Invasive grass species that can be toxic to livestock and difficult to control.",
      managementNotes: [
        "Can be toxic when stressed or frosted",
        "Aggressive spreader",
        "Requires intensive management",
        "Best controlled through rotation and competition"
      ]
    }
  ];

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions or try upload mode.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    const newCapture: PhotoCapture = {
      id: Date.now().toString(),
      imageData,
      timestamp: new Date(),
      identified: false
    };

    // Get GPS location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          newCapture.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setCaptures(prev => [newCapture, ...prev]);
        },
        () => {
          setCaptures(prev => [newCapture, ...prev]);
        }
      );
    } else {
      setCaptures(prev => [newCapture, ...prev]);
    }

    toast({
      title: "Photo Captured",
      description: "Image captured successfully. Ready for identification."
    });
  }, [toast]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      const newCapture: PhotoCapture = {
        id: Date.now().toString(),
        imageData,
        timestamp: new Date(),
        identified: false
      };
      
      setCaptures(prev => [newCapture, ...prev]);
      toast({
        title: "Image Uploaded",
        description: "Image uploaded successfully. Ready for identification."
      });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const identifyPlant = useCallback(async (capture: PhotoCapture) => {
    setIsProcessing(true);
    setSelectedCapture(capture);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock identification results - in production would call AI service
    const mockResults = plantDatabase
      .map(plant => ({
        ...plant,
        confidence: Math.random() * 40 + 60 // Random confidence 60-100%
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    setIdentificationResults(mockResults);
    
    // Update capture as identified
    setCaptures(prev => prev.map(c => 
      c.id === capture.id ? { ...c, identified: true, plantId: mockResults[0].id } : c
    ));

    setIsProcessing(false);
    
    toast({
      title: "Identification Complete",
      description: `Found ${mockResults.length} possible matches with ${mockResults[0].confidence.toFixed(0)}% confidence.`
    });
  }, [toast]);

  const saveIdentification = useCallback((plantId: string) => {
    if (!selectedCapture) return;

    // In production, would save to database
    toast({
      title: "Identification Saved",
      description: "Plant identification has been saved to your records."
    });

    setSelectedCapture(null);
    setIdentificationResults([]);
  }, [selectedCapture, toast]);

  const renderCameraInterface = () => {
    return (
      <div className="space-y-4">
        {captureMode === "camera" && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-md mx-auto rounded-lg bg-gray-900"
              onLoadedMetadata={startCamera}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex justify-center space-x-4 mt-4">
              <Button onClick={capturePhoto} size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Capture Photo
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Stop Camera
              </Button>
            </div>
          </div>
        )}

        {captureMode === "upload" && (
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} size="lg">
              <Upload className="h-5 w-5 mr-2" />
              Upload Image
            </Button>
          </div>
        )}

        <div className="flex justify-center space-x-2">
          <Button
            variant={captureMode === "camera" ? "default" : "outline"}
            onClick={() => setCaptureMode("camera")}
            size="sm"
          >
            <Camera className="h-4 w-4 mr-1" />
            Camera
          </Button>
          <Button
            variant={captureMode === "upload" ? "default" : "outline"}
            onClick={() => setCaptureMode("upload")}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </div>
    );
  };

  const renderCaptureGallery = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Captures</h3>
        {captures.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No photos captured yet. Start by taking a photo or uploading an image.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {captures.map(capture => (
              <Card key={capture.id} className="relative">
                <CardContent className="p-3">
                  <img
                    src={capture.imageData}
                    alt="Plant capture"
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div>{capture.timestamp.toLocaleDateString()}</div>
                      <div className="text-gray-500">{capture.timestamp.toLocaleTimeString()}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {capture.identified ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          ID'd
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => identifyPlant(capture)}
                          disabled={isProcessing}
                        >
                          <Search className="h-3 w-3 mr-1" />
                          Identify
                        </Button>
                      )}
                    </div>
                  </div>

                  {capture.location && (
                    <div className="text-xs text-gray-500 mt-2 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      GPS: ±{capture.location.accuracy.toFixed(0)}m
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderIdentificationResults = () => {
    if (!isProcessing && identificationResults.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Plant Identification Results</CardTitle>
          <CardDescription>AI-powered species identification with confidence scores</CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Analyzing image...</p>
              <Progress value={75} className="mt-4 max-w-sm mx-auto" />
            </div>
          ) : (
            <div className="space-y-4">
              {identificationResults.map((result, index) => (
                <div key={result.id} className={`p-4 border rounded-lg ${index === 0 ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{result.commonName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">{result.scientificName}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={result.confidence > 80 ? "default" : "secondary"}>
                        {result.confidence.toFixed(0)}% confidence
                      </Badge>
                      <Badge variant="outline" className="ml-2 capitalize">
                        {result.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm mb-3">{result.description}</p>

                  {complexityLevel !== "basic" && (
                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div>
                        <h5 className="font-medium mb-1">Nutritional Value</h5>
                        <div className="space-y-1">
                          <div>Protein: {result.nutritionalValue.protein}%</div>
                          <div>Fiber: {result.nutritionalValue.fiber}%</div>
                          <div>Digestibility: {result.nutritionalValue.digestibility}%</div>
                          <div>Palatability: {result.nutritionalValue.palatability}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-1">Characteristics</h5>
                        <div className="space-y-1">
                          <div>Season: {result.characteristics.season}</div>
                          <div>Drought: {result.characteristics.drought}</div>
                          <div>Grazing: {result.characteristics.grazing}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {complexityLevel === "advanced" && result.managementNotes.length > 0 && (
                    <div className="mt-3">
                      <h5 className="font-medium mb-1">Management Notes</h5>
                      <ul className="text-xs space-y-1 list-disc ml-4">
                        {result.managementNotes.map((note, noteIndex) => (
                          <li key={noteIndex}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {index === 0 && (
                    <div className="mt-4 flex space-x-2">
                      <Button onClick={() => saveIdentification(result.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm Identification
                      </Button>
                      <Button variant="outline">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Learn More
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPlantDatabase = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Plant Database</h3>
          <div className="flex items-center space-x-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants</SelectItem>
                <SelectItem value="grass">Grasses</SelectItem>
                <SelectItem value="legume">Legumes</SelectItem>
                <SelectItem value="forb">Forbs</SelectItem>
                <SelectItem value="weed">Weeds</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {plantDatabase.map(plant => (
            <Card key={plant.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{plant.commonName}</CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {plant.category}
                  </Badge>
                </div>
                <CardDescription className="italic">{plant.scientificName}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{plant.description}</p>
                
                {complexityLevel !== "basic" && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Protein:</span> {plant.nutritionalValue.protein}%
                    </div>
                    <div>
                      <span className="font-medium">Digestibility:</span> {plant.nutritionalValue.digestibility}%
                    </div>
                    <div>
                      <span className="font-medium">Season:</span> {plant.characteristics.season}
                    </div>
                    <div>
                      <span className="font-medium">Grazing:</span> {plant.characteristics.grazing}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Plant Identification
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              AI-powered plant identification for pasture management and species assessment
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowEducational(!showEducational)}
              className="text-xs sm:text-sm"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Learn
            </Button>

          </div>
        </div>

        {showEducational && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Plant Identification</strong> helps you understand pasture composition, nutritional value, 
              and management needs. Knowing your plant species enables better grazing decisions and pasture improvements.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="capture" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capture">Capture</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="space-y-6">
          {renderCameraInterface()}
          {renderIdentificationResults()}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          {renderCaptureGallery()}
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          {renderPlantDatabase()}
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration with Farm Management</CardTitle>
              <CardDescription>Connect plant identification with other tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Step-Point Assessment</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Identify species at each step-point for accurate pasture composition analysis
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Leaf className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Nutritional Analysis</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use species data for detailed nutritional composition calculations
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Performance Analytics</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track species changes over time and correlate with performance
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Educational Content</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access species-specific management guides and best practices
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {complexityLevel === "advanced" && (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Features</CardTitle>
                <CardDescription>Professional-grade identification capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Personal Plant Library</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Build a custom database of plants specific to your farm with notes and observations.
                    </p>
                    <div className="text-xs text-gray-500 italic">
                      Available in future updates
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Batch Processing</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Upload multiple images for processing and automatic organization.
                    </p>
                    <div className="text-xs text-gray-500 italic">
                      Available in future updates
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-medium mb-2">Export & Reporting</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Generate species reports for consultants, certification, or record keeping.
                    </p>
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}