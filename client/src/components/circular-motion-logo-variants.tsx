import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Grid3X3, Eye, Circle, Palette } from "lucide-react";

// Variant 1: Classic Green - Concentric circles with outer rotation dots
const CircularLogo1 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#7c3aed" strokeWidth="2" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#6d28d9"/>
        <circle cx="28" cy="16" r="2" fill="#8b5cf6"/>
        <circle cx="16" cy="4" r="1.5" fill="#7c3aed"/>
        <circle cx="4" cy="16" r="2" fill="#8b5cf6"/>
        <circle cx="16" cy="28" r="1.5" fill="#7c3aed"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

// Variant 2: Forest Green - Concentric circles with diagonal orbital lines
const CircularLogo2 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#059669" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#047857" strokeWidth="2" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#065f46"/>
        {/* Diagonal orbital points */}
        <circle cx="27" cy="9" r="2" fill="#10b981"/>
        <circle cx="23" cy="23" r="1.5" fill="#047857"/>
        <circle cx="9" cy="23" r="2" fill="#10b981"/>
        <circle cx="5" cy="9" r="1.5" fill="#047857"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

// Variant 3: Ocean Blue - Concentric circles with flowing wave indicators
const CircularLogo3 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#0ea5e9" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#0284c7" strokeWidth="2" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#0369a1"/>
        {/* Wave flow indicators */}
        <path d="M 28 16 Q 26 14 24 16" stroke="#38bdf8" strokeWidth="2" fill="none"/>
        <path d="M 16 4 Q 14 6 16 8" stroke="#38bdf8" strokeWidth="2" fill="none"/>
        <path d="M 4 16 Q 6 18 8 16" stroke="#38bdf8" strokeWidth="2" fill="none"/>
        <path d="M 16 28 Q 18 26 16 24" stroke="#38bdf8" strokeWidth="2" fill="none"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

// Variant 4: Sunset Orange - Concentric circles with triangular direction markers
const CircularLogo4 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#f97316" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#ea580c" strokeWidth="2" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#c2410c"/>
        {/* Triangular direction markers */}
        <polygon points="28,14 30,16 28,18" fill="#fb923c"/>
        <polygon points="18,4 16,2 14,4" fill="#fb923c"/>
        <polygon points="4,18 2,16 4,14" fill="#fb923c"/>
        <polygon points="14,28 16,30 18,28" fill="#fb923c"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

// Variant 5: Rose Pink - Concentric circles with diamond orbital markers
const CircularLogo5 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#e11d48" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#be123c" strokeWidth="2" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#9f1239"/>
        {/* Diamond orbital markers */}
        <polygon points="28,16 26,14 24,16 26,18" fill="#f43f5e"/>
        <polygon points="16,4 14,6 16,8 18,6" fill="#f43f5e"/>
        <polygon points="4,16 6,18 8,16 6,14" fill="#f43f5e"/>
        <polygon points="16,28 18,26 16,24 14,26" fill="#f43f5e"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

// Variant 6: Earth Brown - Concentric circles with square paddock markers
const CircularLogo6 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#a16207" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#92400e" strokeWidth="2" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#78350f"/>
        {/* Square paddock markers */}
        <rect x="26" y="14" width="4" height="4" fill="#d97706" rx="0.5"/>
        <rect x="14" y="2" width="4" height="4" fill="#d97706" rx="0.5"/>
        <rect x="2" y="14" width="4" height="4" fill="#d97706" rx="0.5"/>
        <rect x="14" y="26" width="4" height="4" fill="#d97706" rx="0.5"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

// Variant 7: Slate Gray - Concentric circles with hexagonal tech markers
const CircularLogo7 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#475569" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#334155" strokeWidth="2" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#1e293b"/>
        {/* Hexagonal tech markers */}
        <polygon points="28,16 26,13 24,13 22,16 24,19 26,19" fill="#64748b"/>
        <polygon points="16,4 13,6 13,8 16,10 19,8 19,6" fill="#64748b"/>
        <polygon points="4,16 6,19 8,19 10,16 8,13 6,13" fill="#64748b"/>
        <polygon points="16,28 19,26 19,24 16,22 13,24 13,26" fill="#64748b"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

// Variant 8: Teal Green - Concentric circles with star orbital points
const CircularLogo8 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#0d9488" strokeWidth="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#0f766e" strokeWidth="2" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="#134e4a"/>
        {/* Star orbital points */}
        <polygon points="28,16 26,14 24,16 26,18" fill="#14b8a6"/>
        <polygon points="24,9 22,11 24,13 26,11" fill="#14b8a6"/>
        <polygon points="16,4 14,6 16,8 18,6" fill="#14b8a6"/>
        <polygon points="8,9 6,11 8,13 10,11" fill="#14b8a6"/>
        <polygon points="4,16 6,18 8,16 6,14" fill="#14b8a6"/>
        <polygon points="8,23 10,21 8,19 6,21" fill="#14b8a6"/>
        <polygon points="16,28 18,26 16,24 14,26" fill="#14b8a6"/>
        <polygon points="24,23 26,21 24,19 22,21" fill="#14b8a6"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

const circularMotionVariants = [
  {
    id: 1,
    name: "Purple Harmony",
    colors: ["#8b5cf6", "#7c3aed", "#6d28d9"],
    component: CircularLogo1,
    description: "Classic concentric circles with cardinal direction orbital points",
    personality: "Professional, harmonious, premium",
    strengths: ["Balanced", "Premium feel", "Tech-friendly", "Calming"]
  },
  {
    id: 2,
    name: "Forest Green",
    colors: ["#059669", "#047857", "#065f46"],
    component: CircularLogo2,
    description: "Diagonal orbital arrangement suggesting natural movement patterns",
    personality: "Sustainable, natural, growth-oriented",
    strengths: ["Eco-friendly", "Natural", "Sustainable", "Fresh"]
  },
  {
    id: 3,
    name: "Ocean Blue",
    colors: ["#0ea5e9", "#0284c7", "#0369a1"],
    component: CircularLogo3,
    description: "Wave-flow indicators showing fluid, water-like movement",
    personality: "Fluid, refreshing, reliable, clean",
    strengths: ["Fluid", "Clean", "Reliable", "Refreshing"]
  },
  {
    id: 4,
    name: "Sunset Orange",
    colors: ["#f97316", "#ea580c", "#c2410c"],
    component: CircularLogo4,
    description: "Triangular direction markers emphasizing forward momentum",
    personality: "Energetic, warm, optimistic, dynamic",
    strengths: ["Energetic", "Warm", "Optimistic", "Dynamic"]
  },
  {
    id: 5,
    name: "Rose Pink",
    colors: ["#e11d48", "#be123c", "#9f1239"],
    component: CircularLogo5,
    description: "Diamond orbital markers suggesting precision and elegance",
    personality: "Elegant, precise, sophisticated, distinctive",
    strengths: ["Elegant", "Distinctive", "Sophisticated", "Memorable"]
  },
  {
    id: 6,
    name: "Earth Brown",
    colors: ["#a16207", "#92400e", "#78350f"],
    component: CircularLogo6,
    description: "Square paddock markers directly representing farm field rotation",
    personality: "Grounded, practical, agricultural, traditional",
    strengths: ["Agricultural", "Grounded", "Practical", "Traditional"]
  },
  {
    id: 7,
    name: "Slate Gray",
    colors: ["#475569", "#334155", "#1e293b"],
    component: CircularLogo7,
    description: "Hexagonal tech markers suggesting precision and connectivity",
    personality: "Professional, technical, sophisticated, modern",
    strengths: ["Professional", "Technical", "Modern", "Corporate"]
  },
  {
    id: 8,
    name: "Teal Green",
    colors: ["#0d9488", "#0f766e", "#134e4a"],
    component: CircularLogo8,
    description: "Eight-point star orbital pattern showing comprehensive coverage",
    personality: "Comprehensive, balanced, innovative, fresh",
    strengths: ["Comprehensive", "Balanced", "Innovative", "Fresh"]
  }
];

export default function CircularMotionLogoVariants() {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "detailed">("grid");

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Cadence Circular Motion Variants
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            8 color palette and icon variations of the circular motion design concept
          </p>
          
          <div className="flex justify-center gap-2 mb-6">
            <Button 
              onClick={() => setViewMode("grid")}
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              Grid View
            </Button>
            <Button 
              onClick={() => setViewMode("detailed")}
              variant={viewMode === "detailed" ? "default" : "outline"}
              size="sm"
            >
              <Eye className="mr-2 h-4 w-4" />
              Detailed View
            </Button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {circularMotionVariants.map((variant, index) => {
              const LogoComponent = variant.component;
              return (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedVariant(index)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-center mb-3">
                      <LogoComponent size={48} showText={false} />
                    </div>
                    <CardTitle className="text-lg text-center">Cadence</CardTitle>
                    <CardDescription className="text-sm text-center">{variant.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-center gap-1 mb-3">
                      {variant.colors.map((color, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">{variant.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 text-center italic">{variant.personality}</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {variant.strengths.slice(0, 2).map((strength, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{strength}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Tabs value={selectedVariant.toString()} onValueChange={(value) => setSelectedVariant(parseInt(value))}>
            <TabsList className="grid w-full grid-cols-4 mb-6 text-xs md:text-sm">
              {circularMotionVariants.slice(0, 4).map((variant, index) => (
                <TabsTrigger key={index} value={index.toString()} className="text-xs p-2">
                  {variant.name.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {circularMotionVariants.slice(0, 4).map((variant, index) => {
              const LogoComponent = variant.component;
              return (
                <TabsContent key={index} value={index.toString()}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-center mb-4">
                        <LogoComponent size={80} showText={true} />
                      </div>
                      <CardTitle className="text-2xl text-center">Cadence</CardTitle>
                      <CardDescription className="text-lg text-center">{variant.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2">Design Description</h4>
                        <p className="text-gray-600 dark:text-gray-300">{variant.description}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Brand Personality</h4>
                        <p className="text-gray-600 dark:text-gray-300">{variant.personality}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Key Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                          {variant.strengths.map((strength, i) => (
                            <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                              <Check className="mr-1 h-3 w-3" />
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Color Palette</h4>
                        <div className="flex gap-3">
                          {variant.colors.map((color, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: color }}></div>
                              <span className="text-sm font-mono text-gray-600">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Size Variations</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-center">
                            <LogoComponent size={20} showText={true} />
                            <p className="text-xs text-gray-600 mt-1">Mobile Header</p>
                          </div>
                          <div className="text-center">
                            <LogoComponent size={32} showText={false} />
                            <p className="text-xs text-gray-600 mt-1">App Icon</p>
                          </div>
                          <div className="text-center">
                            <LogoComponent size={48} showText={true} />
                            <p className="text-xs text-gray-600 mt-1">Desktop Header</p>
                          </div>
                          <div className="text-center">
                            <LogoComponent size={64} showText={true} />
                            <p className="text-xs text-gray-600 mt-1">Landing Page</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}

            {/* Second tab group for remaining variants */}
            <div className="mt-8">
              <TabsList className="grid w-full grid-cols-4 mb-6 text-xs md:text-sm">
                {circularMotionVariants.slice(4).map((variant, index) => (
                  <TabsTrigger key={index + 4} value={(index + 4).toString()} className="text-xs p-2">
                    {variant.name.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {circularMotionVariants.slice(4).map((variant, index) => {
                const actualIndex = index + 4;
                const LogoComponent = variant.component;
                return (
                  <TabsContent key={actualIndex} value={actualIndex.toString()}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                          <LogoComponent size={80} showText={true} />
                        </div>
                        <CardTitle className="text-2xl text-center">Cadence</CardTitle>
                        <CardDescription className="text-lg text-center">{variant.name}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-2">Design Description</h4>
                          <p className="text-gray-600 dark:text-gray-300">{variant.description}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Brand Personality</h4>
                          <p className="text-gray-600 dark:text-gray-300">{variant.personality}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Key Strengths</h4>
                          <div className="flex flex-wrap gap-2">
                            {variant.strengths.map((strength, i) => (
                              <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                                <Check className="mr-1 h-3 w-3" />
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Color Palette</h4>
                          <div className="flex gap-3">
                            {variant.colors.map((color, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: color }}></div>
                                <span className="text-sm font-mono text-gray-600">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Size Variations</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="text-center">
                              <LogoComponent size={20} showText={true} />
                              <p className="text-xs text-gray-600 mt-1">Mobile Header</p>
                            </div>
                            <div className="text-center">
                              <LogoComponent size={32} showText={false} />
                              <p className="text-xs text-gray-600 mt-1">App Icon</p>
                            </div>
                            <div className="text-center">
                              <LogoComponent size={48} showText={true} />
                              <p className="text-xs text-gray-600 mt-1">Desktop Header</p>
                            </div>
                            <div className="text-center">
                              <LogoComponent size={64} showText={true} />
                              <p className="text-xs text-gray-600 mt-1">Landing Page</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </div>
          </Tabs>
        )}

        {/* Selection Help */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5" />
              Choose Your Circular Motion Variant
            </CardTitle>
            <CardDescription>
              All variants use the same circular motion concept with concentric circles and orbital elements, 
              but with different color palettes and orbital marker styles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Popular Choices:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <strong>Forest Green</strong> - Natural, sustainable feel</li>
                  <li>• <strong>Ocean Blue</strong> - Clean, reliable, professional</li>
                  <li>• <strong>Earth Brown</strong> - Traditional agricultural appeal</li>
                  <li>• <strong>Teal Green</strong> - Fresh, innovative approach</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Design Elements:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Concentric circles representing rotation cycles</li>
                  <li>• Orbital markers showing movement direction</li>
                  <li>• Different marker styles (dots, waves, triangles, etc.)</li>
                  <li>• Coordinated 3-color palettes for each variant</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}