import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Type, Palette } from "lucide-react";
import GrazeFlowLogo from "@/components/graze-flow-logo";

interface LetteringStyle {
  id: string;
  name: string;
  description: string;
  personality: string;
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string;
  textTransform: string;
  fontSize: string;
  additionalStyles?: string;
  gradient?: string;
  shadow?: string;
}

const letteringStyles: LetteringStyle[] = [
  {
    id: "modern-sans",
    name: "Modern Sans-Serif",
    description: "Clean, contemporary lettering with excellent readability",
    personality: "Professional • Clean • Accessible",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: "600",
    letterSpacing: "-0.025em",
    textTransform: "none",
    fontSize: "1.5rem",
    additionalStyles: ""
  },
  {
    id: "bold-impact",
    name: "Bold Impact",
    description: "Strong, confident lettering that commands attention",
    personality: "Bold • Powerful • Commanding",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "800",
    letterSpacing: "-0.05em",
    textTransform: "none",
    fontSize: "1.5rem",
    additionalStyles: "text-shadow: 0 2px 4px rgba(0,0,0,0.1);"
  },
  {
    id: "elegant-serif",
    name: "Elegant Serif",
    description: "Sophisticated serif lettering with traditional agricultural heritage",
    personality: "Traditional • Elegant • Heritage",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: "500",
    letterSpacing: "0.015em",
    textTransform: "none",
    fontSize: "1.5rem",
    additionalStyles: ""
  },
  {
    id: "tech-mono",
    name: "Tech Monospace",
    description: "Modern monospace suggesting precision and data-driven approach",
    personality: "Technical • Precise • Data-Driven",
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
    fontWeight: "600",
    letterSpacing: "0.05em",
    textTransform: "none",
    fontSize: "1.4rem",
    additionalStyles: ""
  },
  {
    id: "gradient-modern",
    name: "Gradient Modern",
    description: "Contemporary lettering with purple-to-green gradient",
    personality: "Innovative • Premium • Cohesive",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "700",
    letterSpacing: "-0.03em",
    textTransform: "none",
    fontSize: "1.5rem",
    gradient: "linear-gradient(135deg, hsl(262, 83%, 66%), hsl(167, 85%, 39%))",
    additionalStyles: "background-clip: text; -webkit-background-clip: text; color: transparent;"
  },
  {
    id: "outlined-bold",
    name: "Outlined Bold",
    description: "Bold lettering with subtle outline for enhanced visibility",
    personality: "Strong • Visible • Distinctive",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "800",
    letterSpacing: "-0.04em",
    textTransform: "none",
    fontSize: "1.5rem",
    additionalStyles: "-webkit-text-stroke: 1px rgba(255,255,255,0.3);",
    shadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  {
    id: "small-caps",
    name: "Small Caps Refined",
    description: "Refined small capitals for sophisticated brand expression",
    personality: "Sophisticated • Refined • Distinctive",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "600",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontSize: "1.3rem",
    additionalStyles: "font-variant: small-caps;"
  },
  {
    id: "organic-rounded",
    name: "Organic Rounded",
    description: "Soft, rounded lettering reflecting natural agricultural themes",
    personality: "Natural • Approachable • Organic",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "600",
    letterSpacing: "-0.01em",
    textTransform: "none",
    fontSize: "1.5rem",
    additionalStyles: "border-radius: 4px; padding: 2px 6px; background: rgba(255,255,255,0.1);"
  }
];

interface LogoPreviewProps {
  style: LetteringStyle;
  isSelected: boolean;
}

function LogoPreview({ style, isSelected }: LogoPreviewProps) {
  const textStyle = {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    textTransform: style.textTransform as any,
    fontSize: style.fontSize,
    ...(style.gradient && {
      background: style.gradient,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent'
    }),
    ...(style.shadow && {
      textShadow: style.shadow
    })
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-lg">
      {/* Header Preview */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-white/20 p-2 rounded-lg">
          <GrazeFlowLogo className="w-8 h-8 text-white" />
        </div>
        <span 
          className="text-white font-semibold"
          style={textStyle}
        >
          Cadence
        </span>
      </div>
      
      {/* Mock Interface Elements */}
      <div className="space-y-3 text-white/80 text-sm">
        <div className="flex justify-between">
          <span>Dashboard</span>
          <span>73 Animals • 4 Paddocks</span>
        </div>
        
        <div className="bg-white/10 p-3 rounded">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-white/90">North Pasture Ready</span>
          </div>
          <div className="text-xs text-white/70">Move cattle tomorrow morning</div>
        </div>
      </div>
    </div>
  );
}

export default function LogoLetteringVariants() {
  const [selectedStyle, setSelectedStyle] = useState<string>("gradient-modern");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Logo Lettering Options</h2>
        <p className="text-gray-600">
          Explore different typography styles for the Cadence brand lettering. Each option shows how the text would appear in the header alongside your Purple Harmony icon.
        </p>
      </div>

      {/* Style Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {letteringStyles.map((style) => (
          <Card 
            key={style.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedStyle === style.id 
                ? 'ring-2 ring-purple-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedStyle(style.id)}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-purple-600" />
                  <span>{style.name}</span>
                </div>
                {selectedStyle === style.id && (
                  <Star className="w-5 h-5 text-purple-500 fill-current" />
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">{style.description}</p>
              <p className="text-xs font-medium text-purple-600">{style.personality}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Typography Details */}
              <div>
                <div className="text-sm font-medium mb-2">Typography Details</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Font:</span>
                    <div className="text-gray-600">{style.fontFamily.split(',')[0].replace(/['"]/g, '')}</div>
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span>
                    <div className="text-gray-600">{style.fontWeight}</div>
                  </div>
                  <div>
                    <span className="font-medium">Spacing:</span>
                    <div className="text-gray-600">{style.letterSpacing}</div>
                  </div>
                  <div>
                    <span className="font-medium">Transform:</span>
                    <div className="text-gray-600">{style.textTransform || 'none'}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Live Preview */}
              <LogoPreview style={style} isSelected={selectedStyle === style.id} />
              
              {/* Text Sample */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Text Sample</div>
                <div 
                  className="text-gray-900"
                  style={{
                    fontFamily: style.fontFamily,
                    fontWeight: style.fontWeight,
                    letterSpacing: style.letterSpacing,
                    textTransform: style.textTransform as any,
                    fontSize: '1.25rem',
                    ...(style.gradient && {
                      background: style.gradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent'
                    })
                  }}
                >
                  Cadence
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Rotational Grazing Management Platform
                </div>
              </div>
              
              {/* Apply Button */}
              <Button 
                className="w-full"
                variant={selectedStyle === style.id ? "default" : "outline"}
                onClick={() => setSelectedStyle(style.id)}
              >
                {selectedStyle === style.id ? "Selected" : "Preview This Style"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Style Implementation */}
      {selectedStyle && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Selected: {letteringStyles.find(s => s.id === selectedStyle)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 mb-4">
              Would you like me to implement this lettering style in the header and throughout the application? 
              I can update the logo component and all brand text to use your selected typography.
            </p>
            <div className="flex gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Apply This Lettering Style
              </Button>
              <Button variant="outline">
                Show CSS Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Typography Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Typography Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Consider for Agricultural Apps:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• High readability in field conditions</li>
                <li>• Professional yet approachable feel</li>
                <li>• Good visibility on mobile devices</li>
                <li>• Consistent with your premium positioning</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Brand Consistency:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Complements Purple Harmony logo</li>
                <li>• Works across all interface elements</li>
                <li>• Maintains readability at all sizes</li>
                <li>• Reflects Cadence's personality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}