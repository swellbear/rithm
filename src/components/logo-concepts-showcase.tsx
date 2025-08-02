import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Palette, Check, Download, Eye, Star, 
  RotateCcw, Zap, Target, Orbit, Grid3X3, Leaf
} from "lucide-react";

// Logo Component 1: Cadence - Circular Flow
const LogoConcept1 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  const scale = size / 32;
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        {/* Outer rotation ring */}
        <circle cx="16" cy="16" r="12" fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="3,2" opacity="0.8"/>
        
        {/* Paddock quadrants */}
        <rect x="10" y="10" width="6" height="6" fill="#86efac" rx="1"/>
        <rect x="16" y="10" width="6" height="6" fill="#4ade80" rx="1"/>
        <rect x="16" y="16" width="6" height="6" fill="#22c55e" rx="1"/>
        <rect x="10" y="16" width="6" height="6" fill="#16a34a" rx="1"/>
        
        {/* Central hub */}
        <circle cx="16" cy="16" r="3" fill="#1d4ed8"/>
        
        {/* Flow indicator */}
        <path d="M 26 12 Q 28 10 30 12" fill="none" stroke="#2563eb" strokeWidth="1.5"/>
        <polygon points="29,11 30,12 29,13" fill="#2563eb"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">Cadence</span>}
    </div>
  );
};

// Logo Component 2: PastureSync - Connected Fields  
const LogoConcept2 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  const scale = size / 32;
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        {/* Hexagonal paddocks */}
        <polygon points="16,6 22,10 22,18 16,22 10,18 10,10" fill="#86efac" stroke="#16a34a" strokeWidth="1.5" opacity="0.8"/>
        <polygon points="24,14 28,17 28,23 24,26 20,23 20,17" fill="#4ade80" stroke="#16a34a" strokeWidth="1.5" opacity="0.8"/>
        <polygon points="8,14 12,17 12,23 8,26 4,23 4,17" fill="#22c55e" stroke="#16a34a" strokeWidth="1.5" opacity="0.8"/>
        
        {/* Connection lines */}
        <line x1="16" y1="16" x2="20" y2="18" stroke="#1d4ed8" strokeWidth="2"/>
        <line x1="16" y1="16" x2="12" y2="18" stroke="#1d4ed8" strokeWidth="2"/>
        
        {/* Central sync point */}
        <circle cx="16" cy="16" r="3" fill="#1d4ed8"/>
        <circle cx="16" cy="16" r="1.5" fill="#ffffff"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">PastureSync</span>}
    </div>
  );
};

// Logo Component 3: FieldCycle - Orbital Pattern
const LogoConcept3 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  const scale = size / 32;
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        {/* Orbital rings */}
        <circle cx="16" cy="16" r="12" fill="none" stroke="#16a34a" strokeWidth="1.5" opacity="0.5"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="16" cy="16" r="4" fill="none" stroke="#4ade80" strokeWidth="1.5"/>
        
        {/* Livestock positions */}
        <circle cx="28" cy="16" r="2" fill="#059669"/>
        <circle cx="16" cy="4" r="2" fill="#059669"/>
        <circle cx="4" cy="16" r="2" fill="#059669"/>
        <circle cx="16" cy="28" r="2" fill="#059669"/>
        
        {/* Central farm */}
        <rect x="13" y="13" width="6" height="6" fill="#1d4ed8" rx="1"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">FieldCycle</span>}
    </div>
  );
};

// Logo Component 4: RotaWise - Dynamic Flow
const LogoConcept4 = ({ size = 32, showText = true }: { size?: number; showText?: boolean }) => {
  const scale = size / 32;
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32">
        {/* Background circle */}
        <circle cx="16" cy="16" r="12" fill="#f0f9ff" stroke="#16a34a" strokeWidth="1.5"/>
        
        {/* Flow path */}
        <path d="M 8 16 Q 16 8 24 16 Q 16 24 8 16" fill="none" stroke="#2563eb" strokeWidth="2.5" opacity="0.8"/>
        
        {/* Segment indicators */}
        <circle cx="20" cy="12" r="2" fill="#4ade80"/>
        <circle cx="20" cy="20" r="2" fill="#22c55e"/>
        <circle cx="12" cy="20" r="2" fill="#16a34a"/>
        <circle cx="12" cy="12" r="2" fill="#86efac"/>
        
        {/* Center wisdom indicator */}
        <circle cx="16" cy="16" r="3" fill="#1d4ed8"/>
        <circle cx="16" cy="16" r="1" fill="#ffffff"/>
      </svg>
      {showText && <span className="font-semibold text-gray-900 dark:text-white">RotaWise</span>}
    </div>
  );
};

const nameAlternatives = [
  {
    name: "Cadence",
    tagline: "Smooth rotational grazing management",
    icon: <Zap className="h-5 w-5" />,
    component: LogoConcept1,
    description: "Emphasizes the continuous, smooth flow of livestock through paddocks",
    strengths: ["Memorable", "Clear concept", "Modern sound", "Easy to say"],
    colors: ["#16a34a", "#1d4ed8", "#4ade80"]
  },
  {
    name: "PastureSync", 
    tagline: "Synchronized grazing optimization",
    icon: <Target className="h-5 w-5" />,
    component: LogoConcept2,
    description: "Professional sound suggesting coordinated, optimized management",
    strengths: ["Professional", "Tech-savvy", "Suggests precision", "Corporate appeal"],
    colors: ["#16a34a", "#1d4ed8", "#86efac"]
  },
  {
    name: "FieldCycle",
    tagline: "Complete rotational farm management", 
    icon: <RotateCcw className="h-5 w-5" />,
    component: LogoConcept3,
    description: "Direct reference to cycling livestock through fields",
    strengths: ["Clear concept", "Easy to understand", "Agricultural focus", "Action-oriented"],
    colors: ["#16a34a", "#059669", "#4ade80"]
  },
  {
    name: "RotaWise",
    tagline: "Intelligent rotational grazing",
    icon: <Star className="h-5 w-5" />,
    component: LogoConcept4,
    description: "Combines rotation with wisdom/intelligence",
    strengths: ["Suggests expertise", "AI/smart implications", "Professional", "Trustworthy"],
    colors: ["#1d4ed8", "#16a34a", "#2563eb"]
  },
  {
    name: "GrazeOptima",
    tagline: "Optimal pasture management",
    icon: <Grid3X3 className="h-5 w-5" />,
    component: LogoConcept1,
    description: "Sophisticated sound suggesting optimization",
    strengths: ["Premium feel", "Scientific sound", "Optimization focus", "Professional"],
    colors: ["#16a34a", "#1d4ed8", "#059669"]
  },
  {
    name: "PastureFlow",
    tagline: "Natural livestock movement",
    icon: <Leaf className="h-5 w-5" />,
    component: LogoConcept4,
    description: "Natural flow of livestock through pastures",
    strengths: ["Natural sound", "Easy concept", "Organic feel", "Flow emphasis"],
    colors: ["#22c55e", "#16a34a", "#4ade80"]
  },
  {
    name: "CycleFarm",
    tagline: "Rotational farming simplified",
    icon: <Orbit className="h-5 w-5" />,
    component: LogoConcept3,
    description: "Direct rotational farming reference",
    strengths: ["Simple", "Clear", "Farm-focused", "Memorable"],
    colors: ["#16a34a", "#059669", "#22c55e"]
  },
  {
    name: "GrazeOrbit",
    tagline: "Advanced grazing patterns",
    icon: <Orbit className="h-5 w-5" />,
    component: LogoConcept3,
    description: "Suggests circular movement patterns with modern tech feel",
    strengths: ["Modern tech feel", "Unique", "Movement focus", "Innovative sound"],
    colors: ["#1d4ed8", "#16a34a", "#2563eb"]
  }
];

export default function LogoConceptsShowcase() {
  const [selectedConcept, setSelectedConcept] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "detailed">("grid");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Brand Identity Concepts
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Exploring names and visual identity options for your rotational grazing platform
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
          {nameAlternatives.map((concept, index) => {
            const LogoComponent = concept.component;
            return (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedConcept(index)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <LogoComponent size={40} showText={false} />
                    {index === 0 && <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>}
                  </div>
                  <CardTitle className="text-lg">{concept.name}</CardTitle>
                  <CardDescription className="text-sm">{concept.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-1 mb-3">
                    {concept.colors.map((color, i) => (
                      <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{concept.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
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
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {nameAlternatives.slice(0, 4).map((concept, index) => (
              <TabsTrigger key={index} value={index.toString()} className="text-sm">
                {concept.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {nameAlternatives.slice(0, 4).map((concept, index) => {
            const LogoComponent = concept.component;
            return (
              <TabsContent key={index} value={index.toString()}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <LogoComponent size={60} showText={true} />
                      {index === 0 && <Badge className="bg-blue-100 text-blue-800">Top Pick</Badge>}
                    </div>
                    <CardTitle className="text-2xl">{concept.name}</CardTitle>
                    <CardDescription className="text-lg">{concept.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Concept Description</h4>
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
        </Tabs>
      )}

      {/* Additional concepts */}
      {viewMode === "grid" && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Additional Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {nameAlternatives.slice(4).map((concept, index) => {
              const LogoComponent = concept.component;
              const actualIndex = index + 4;
              return (
                <Card key={actualIndex} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center mb-2">
                      <LogoComponent size={32} showText={false} />
                    </div>
                    <CardTitle className="text-base">{concept.name}</CardTitle>
                    <CardDescription className="text-sm">{concept.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
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
        </div>
      )}

      {/* Implementation Notes */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Palette className="h-5 w-5" />
            Implementation Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200">
          <ul className="space-y-2 text-sm">
            <li>• All logos are designed as scalable SVG components</li>
            <li>• Color palettes work in both light and dark themes</li>
            <li>• Icons simplified for small sizes (16px, 24px, 32px)</li>
            <li>• Logos maintain readability at all scales</li>
            <li>• Design system supports the rotational grazing theme</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}