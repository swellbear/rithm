import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Grid3X3, Eye, ArrowRight, Zap, Leaf, Triangle, Waves, Circle, Diamond, Tractor, Sprout, Hexagon } from "lucide-react";

// Logo Component 1: Cadence - Modern Minimalist
const CadenceLogo1 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4,2"/>
        <path d="M 8 16 L 24 16" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"/>
        <polygon points="22,14 24,16 22,18" fill="#16a34a"/>
        <circle cx="8" cy="16" r="2" fill="#15803d"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Inter'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 2: Cadence - Tech Forward
const CadenceLogo2 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect x="6" y="6" width="20" height="20" fill="#3b82f6" rx="4" opacity="0.1"/>
        <path d="M 12 20 L 16 12 L 20 20" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="16" cy="10" r="1.5" fill="#1e40af"/>
        <circle cx="12" cy="22" r="1.5" fill="#1e40af"/>
        <circle cx="20" cy="22" r="1.5" fill="#1e40af"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Roboto'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 3: Cadence - Organic Natural
const CadenceLogo3 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M 16 6 Q 20 10 16 14 Q 12 18 16 22 Q 20 18 24 22" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="16" cy="8" r="2" fill="#047857"/>
        <circle cx="18" cy="16" r="1.5" fill="#065f46"/>
        <circle cx="14" cy="24" r="2" fill="#059669"/>
        <path d="M 10 16 Q 8 12 12 10" stroke="#16a34a" strokeWidth="1.5" fill="none"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Source Sans Pro'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 4: Cadence - Bold Confident
const CadenceLogo4 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <polygon points="16,6 26,24 6,24" fill="#dc2626" opacity="0.8"/>
        <polygon points="16,10 22,20 10,20" fill="#b91c1c"/>
        <polygon points="16,14 18,18 14,18" fill="#991b1b"/>
        <circle cx="16" cy="22" r="1" fill="#ffffff"/>
      </svg>
      {showText && <span className="font-bold text-gray-900 dark:text-white" style={{fontFamily: 'Montserrat'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 5: Cadence - Wave Pattern
const CadenceLogo5 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M 4 16 Q 8 8 12 16 T 20 16 T 28 16" stroke="#0891b2" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 4 20 Q 8 12 12 20 T 20 20 T 28 20" stroke="#0e7490" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
        <path d="M 4 12 Q 8 4 12 12 T 20 12 T 28 12" stroke="#155e75" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Open Sans'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 6: Cadence - Circular Motion
const CadenceLogo6 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
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
      {showText && <span className="font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Lato'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 7: Cadence - Premium Serif
const CadenceLogo7 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect x="6" y="6" width="20" height="20" fill="#0f172a" rx="2"/>
        <polygon points="16,10 20,14 16,18 12,14" fill="#334155"/>
        <polygon points="16,12 18,14 16,16 14,14" fill="#64748b"/>
        <circle cx="16" cy="14" r="1" fill="#ffffff"/>
      </svg>
      {showText && <span className="font-serif text-gray-900 dark:text-white" style={{fontFamily: 'Playfair Display'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 8: Cadence - Agricultural Focus
const CadenceLogo8 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect x="8" y="16" width="16" height="8" fill="#ca8a04" rx="2"/>
        <rect x="10" y="12" width="4" height="6" fill="#a16207"/>
        <circle cx="20" cy="10" r="3" fill="#854d0e"/>
        <circle cx="22" cy="8" r="1" fill="#ca8a04"/>
        <path d="M 6 26 L 26 26" stroke="#a16207" strokeWidth="2"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Nunito'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 9: Cadence - Grass & Growth
const CadenceLogo9 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M 16 26 L 16 18 Q 14 16 16 14 Q 18 12 16 10" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M 12 24 L 12 20 Q 10 18 12 16" stroke="#15803d" strokeWidth="2" strokeLinecap="round"/>
        <path d="M 20 24 L 20 20 Q 22 18 20 16" stroke="#15803d" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="8" r="2" fill="#166534"/>
        <ellipse cx="16" cy="26" rx="8" ry="2" fill="#16a34a" opacity="0.3"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'IBM Plex Sans'}}>Cadence</span>}
    </div>
  );
};

// Logo Component 10: Cadence - Connected Network
const CadenceLogo10 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        <polygon points="16,8 20,12 16,16 12,12" fill="#7c2d12"/>
        <polygon points="24,16 26,20 22,20" fill="#92400e"/>
        <polygon points="8,16 10,20 6,20" fill="#92400e"/>
        <polygon points="16,20 20,24 12,24" fill="#b45309"/>
        <line x1="16" y1="12" x2="22" y2="18" stroke="#7c2d12" strokeWidth="1.5"/>
        <line x1="16" y1="12" x2="10" y2="18" stroke="#7c2d12" strokeWidth="1.5"/>
        <line x1="16" y1="20" x2="22" y2="18" stroke="#92400e" strokeWidth="1.5"/>
        <line x1="16" y1="20" x2="10" y2="18" stroke="#92400e" strokeWidth="1.5"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white" style={{fontFamily: 'Space Grotesk'}}>Cadence</span>}
    </div>
  );
};

const grazeFlowConcepts = [
  {
    id: 1,
    name: "Cadence",
    style: "Modern Minimalist",
    icon: <ArrowRight className="h-5 w-5" />,
    component: CadenceLogo1,
    description: "Clean, flowing arrow suggesting movement and optimization",
    strengths: ["Professional", "Scalable", "Memorable", "Clear concept"],
    colors: ["#22c55e", "#16a34a", "#15803d"],
    font: "Inter",
    recommended: true
  },
  {
    id: 2,
    name: "Cadence", 
    style: "Tech Forward",
    icon: <Zap className="h-5 w-5" />,
    component: CadenceLogo2,
    description: "Lightning bolt emphasizing speed and efficiency",
    strengths: ["Dynamic", "Tech-savvy", "Modern", "Corporate appeal"],
    colors: ["#3b82f6", "#1d4ed8", "#1e40af"],
    font: "Roboto"
  },
  {
    id: 3,
    name: "Cadence",
    style: "Organic Natural",
    icon: <Leaf className="h-5 w-5" />,
    component: CadenceLogo3,
    description: "Flowing leaf pattern representing natural, sustainable farming",
    strengths: ["Eco-friendly", "Sustainable", "Approachable", "Natural"],
    colors: ["#059669", "#047857", "#065f46"],
    font: "Source Sans Pro"
  },
  {
    id: 4,
    name: "Cadence",
    style: "Bold Confident",
    icon: <Triangle className="h-5 w-5" />,
    component: CadenceLogo4,
    description: "Triangle suggesting growth, stability and upward movement",
    strengths: ["Authoritative", "Strong", "Memorable", "Leadership"],
    colors: ["#dc2626", "#b91c1c", "#991b1b"],
    font: "Montserrat"
  },
  {
    id: 5,
    name: "Cadence",
    style: "Wave Pattern",
    icon: <Waves className="h-5 w-5" />,
    component: CadenceLogo5,
    description: "Wave pattern emphasizing flow and natural rhythm", 
    strengths: ["Fluid", "Natural", "Rhythmic", "Calming"],
    colors: ["#0891b2", "#0e7490", "#155e75"],
    font: "Open Sans"
  },
  {
    id: 6,
    name: "Cadence",
    style: "Circular Motion",
    icon: <Circle className="h-5 w-5" />,
    component: CadenceLogo6,
    description: "Concentric circles representing rotation cycles and completeness",
    strengths: ["Cyclical", "Complete", "Balanced", "Harmonious"],
    colors: ["#8b5cf6", "#7c3aed", "#6d28d9"],
    font: "Lato"
  },
  {
    id: 7,
    name: "Cadence",
    style: "Premium Serif",
    icon: <Diamond className="h-5 w-5" />,
    component: CadenceLogo7,
    description: "Diamond with elegant serif font for premium feel",
    strengths: ["Elegant", "Premium", "Timeless", "Sophisticated"],
    colors: ["#0f172a", "#334155", "#64748b"],
    font: "Playfair Display"
  },
  {
    id: 8,
    name: "Cadence",
    style: "Agricultural Focus",
    icon: <Tractor className="h-5 w-5" />,
    component: CadenceLogo8,
    description: "Tractor-inspired design connecting directly to farming operations",
    strengths: ["Farm-focused", "Practical", "Industry-specific", "Relatable"],
    colors: ["#ca8a04", "#a16207", "#854d0e"],
    font: "Nunito"
  },
  {
    id: 9,
    name: "Cadence",
    style: "Grass & Growth",
    icon: <Sprout className="h-5 w-5" />,
    component: CadenceLogo9,
    description: "Grass sprouts representing pasture growth and regeneration",
    strengths: ["Growth-oriented", "Fresh", "Regenerative", "Life-giving"],
    colors: ["#16a34a", "#15803d", "#166534"],
    font: "IBM Plex Sans"
  },
  {
    id: 10,
    name: "Cadence",
    style: "Connected Network",
    icon: <Hexagon className="h-5 w-5" />,
    component: CadenceLogo10,
    description: "Connected hexagons suggesting interconnected paddocks and systems",
    strengths: ["Systematic", "Connected", "Geometric", "Structured"],
    colors: ["#7c2d12", "#92400e", "#b45309"],
    font: "Space Grotesk"
  }
];

export default function CadenceLogoShowcase() {
  const [selectedConcept, setSelectedConcept] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "detailed">("grid");

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Cadence Logo Concepts
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Choose your preferred visual identity for the Cadence platform
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {grazeFlowConcepts.map((concept, index) => {
              const LogoComponent = concept.component;
              return (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedConcept(index)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <LogoComponent size={40} showText={false} />
                      {concept.recommended && <Badge className="bg-blue-100 text-blue-800">Top Pick</Badge>}
                    </div>
                    <CardTitle className="text-lg">Cadence</CardTitle>
                    <CardDescription className="text-sm">{concept.style}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-1 mb-3">
                      {concept.colors.map((color, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{concept.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {concept.strengths.slice(0, 2).map((strength, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{strength}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Tabs value={selectedConcept.toString()} onValueChange={(value) => setSelectedConcept(parseInt(value))}>
            <TabsList className="grid w-full grid-cols-5 mb-6 text-xs md:text-sm">
              {grazeFlowConcepts.slice(0, 5).map((concept, index) => (
                <TabsTrigger key={index} value={index.toString()} className="text-xs p-2">
                  {concept.style.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {grazeFlowConcepts.slice(0, 5).map((concept, index) => {
              const LogoComponent = concept.component;
              return (
                <TabsContent key={index} value={index.toString()}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <LogoComponent size={60} showText={true} />
                        {concept.recommended && <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>}
                      </div>
                      <CardTitle className="text-2xl">Cadence</CardTitle>
                      <CardDescription className="text-lg">{concept.style}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2">Design Description</h4>
                        <p className="text-gray-600 dark:text-gray-300">{concept.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Key Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                          {concept.strengths.map((strength, i) => (
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
                          {concept.colors.map((color, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: color }}></div>
                              <span className="text-sm font-mono text-gray-600">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Typography</h4>
                        <p className="text-gray-600 dark:text-gray-300">Font: {concept.font}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Usage Examples</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div className="text-center">
                            <LogoComponent size={24} showText={true} />
                            <p className="text-xs text-gray-600 mt-1">Header Navigation</p>
                          </div>
                          <div className="text-center">
                            <LogoComponent size={32} showText={false} />
                            <p className="text-xs text-gray-600 mt-1">App Icon</p>
                          </div>
                          <div className="text-center">
                            <LogoComponent size={48} showText={true} />
                            <p className="text-xs text-gray-600 mt-1">Landing Page</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}

            {/* Second tab group for remaining concepts */}
            <div className="mt-8">
              <TabsList className="grid w-full grid-cols-5 mb-6 text-xs md:text-sm">
                {grazeFlowConcepts.slice(5).map((concept, index) => (
                  <TabsTrigger key={index + 5} value={(index + 5).toString()} className="text-xs p-2">
                    {concept.style.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {grazeFlowConcepts.slice(5).map((concept, index) => {
                const actualIndex = index + 5;
                const LogoComponent = concept.component;
                return (
                  <TabsContent key={actualIndex} value={actualIndex.toString()}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <LogoComponent size={60} showText={true} />
                        </div>
                        <CardTitle className="text-2xl">Cadence</CardTitle>
                        <CardDescription className="text-lg">{concept.style}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-2">Design Description</h4>
                          <p className="text-gray-600 dark:text-gray-300">{concept.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Key Strengths</h4>
                          <div className="flex flex-wrap gap-2">
                            {concept.strengths.map((strength, i) => (
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
                            {concept.colors.map((color, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: color }}></div>
                                <span className="text-sm font-mono text-gray-600">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Typography</h4>
                          <p className="text-gray-600 dark:text-gray-300">Font: {concept.font}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Usage Examples</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="text-center">
                              <LogoComponent size={24} showText={true} />
                              <p className="text-xs text-gray-600 mt-1">Header Navigation</p>
                            </div>
                            <div className="text-center">
                              <LogoComponent size={32} showText={false} />
                              <p className="text-xs text-gray-600 mt-1">App Icon</p>
                            </div>
                            <div className="text-center">
                              <LogoComponent size={48} showText={true} />
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
            <CardTitle>Which Cadence Logo Do You Prefer?</CardTitle>
            <CardDescription>
              Review the options above and let me know which design resonates with your vision for Cadence. 
              We'll implement the full rebrand once you've made your selection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Consider These Factors:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Professional appeal to farmers and agricultural professionals</li>
                  <li>• Scalability across different sizes (app icon to billboard)</li>
                  <li>• Brand personality that matches Cadence's mission</li>
                  <li>• Distinctiveness in the agricultural software market</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Popular Choices:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <strong>Modern Minimalist</strong> - Clean, professional, versatile</li>
                  <li>• <strong>Organic Natural</strong> - Emphasizes sustainability</li>
                  <li>• <strong>Wave Pattern</strong> - Natural flow and rhythm</li>
                  <li>• <strong>Grass & Growth</strong> - Directly agricultural</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}