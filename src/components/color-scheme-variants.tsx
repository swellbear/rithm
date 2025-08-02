import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Leaf, BarChart3, MapPin, Calendar, Users, 
  TrendingUp, Droplets, Sun, CheckCircle,
  AlertTriangle, Star
} from "lucide-react";

interface ColorScheme {
  id: string;
  name: string;
  description: string;
  personality: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

const colorSchemes: ColorScheme[] = [
  {
    id: "current-green",
    name: "Current Agricultural Green",
    description: "Natural farm-inspired greens with traditional agricultural feel",
    personality: "Traditional • Natural • Familiar",
    primary: "#228B22",
    primaryLight: "#32CD32", 
    primaryDark: "#006400",
    secondary: "#8FBC8F",
    accent: "#FFD700",
    background: "#FAFAFA",
    surface: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB"
  },
  {
    id: "purple-harmony",
    name: "Purple Harmony (Logo Match)",
    description: "Full purple alignment with our new logo branding",
    personality: "Premium • Modern • Innovative",
    primary: "#8B5CF6",
    primaryLight: "#A78BFA",
    primaryDark: "#7C3AED",
    secondary: "#C4B5FD",
    accent: "#F3E8FF",
    background: "#FAFAFA",
    surface: "#FFFFFF", 
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB"
  },
  {
    id: "purple-green-harmony",
    name: "Purple + Green Harmony",
    description: "Purple primary with green agricultural accents",
    personality: "Balanced • Premium • Agricultural",
    primary: "#8B5CF6",
    primaryLight: "#A78BFA", 
    primaryDark: "#7C3AED",
    secondary: "#10B981",
    accent: "#34D399",
    background: "#FAFAFA",
    surface: "#FFFFFF",
    text: "#1F2937", 
    textSecondary: "#6B7280",
    border: "#E5E7EB"
  },
  {
    id: "neutral-purple",
    name: "Clean Neutral + Purple",
    description: "Professional neutral base with purple highlights",
    personality: "Professional • Clean • Focused",
    primary: "#8B5CF6",
    primaryLight: "#A78BFA",
    primaryDark: "#7C3AED", 
    secondary: "#6B7280",
    accent: "#F3F4F6",
    background: "#F9FAFB",
    surface: "#FFFFFF",
    text: "#111827",
    textSecondary: "#6B7280",
    border: "#D1D5DB"
  },
  {
    id: "earth-tones",
    name: "Natural Earth Tones",
    description: "Warm browns and greens inspired by soil and pasture",
    personality: "Earthy • Warm • Organic",
    primary: "#8B4513",
    primaryLight: "#CD853F",
    primaryDark: "#654321",
    secondary: "#9ACD32", 
    accent: "#F4A460",
    background: "#FDF6E3",
    surface: "#FFFFFF",
    text: "#2D1B0E",
    textSecondary: "#8B4513",
    border: "#D2B48C"
  },
  {
    id: "blue-professional",
    name: "Professional Blue-Gray",
    description: "Corporate-style blues with agricultural green accents",
    personality: "Professional • Trustworthy • Corporate",
    primary: "#3B82F6",
    primaryLight: "#60A5FA",
    primaryDark: "#2563EB",
    secondary: "#10B981",
    accent: "#EFF6FF", 
    background: "#F8FAFC",
    surface: "#FFFFFF",
    text: "#0F172A",
    textSecondary: "#475569",
    border: "#CBD5E1"
  },
  {
    id: "sunset-warm",
    name: "Sunset Agricultural",
    description: "Warm oranges and yellows like golden hour on the farm",
    personality: "Warm • Energetic • Optimistic",
    primary: "#EA580C",
    primaryLight: "#FB923C",
    primaryDark: "#C2410C",
    secondary: "#84CC16",
    accent: "#FEF3C7",
    background: "#FFFBEB", 
    surface: "#FFFFFF",
    text: "#1C1917",
    textSecondary: "#78716C",
    border: "#E7E5E4"
  },
  {
    id: "forest-premium",
    name: "Premium Forest",
    description: "Deep forest greens with gold accents for luxury feel",
    personality: "Luxury • Sophisticated • Natural",
    primary: "#134E4A",
    primaryLight: "#0F766E",
    primaryDark: "#042F2E",
    secondary: "#F59E0B", 
    accent: "#FEF3C7",
    background: "#F0FDF4",
    surface: "#FFFFFF",
    text: "#14532D",
    textSecondary: "#166534",
    border: "#BBF7D0"
  }
];

interface MockUIProps {
  scheme: ColorScheme;
}

function MockUI({ scheme }: MockUIProps) {
  return (
    <div 
      className="w-full h-96 rounded-lg border-2 overflow-hidden"
      style={{ 
        backgroundColor: scheme.background,
        borderColor: scheme.border 
      }}
    >
      {/* Header */}
      <div 
        className="h-14 flex items-center justify-between px-4"
        style={{ backgroundColor: scheme.primary }}
      >
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6" style={{ color: 'white' }} />
          <span className="font-semibold text-white">Cadence</span>
        </div>
        <Button 
          size="sm" 
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none'
          }}
        >
          Settings
        </Button>
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: scheme.surface,
              border: `1px solid ${scheme.border}`
            }}
          >
            <div 
              className="text-lg font-bold"
              style={{ color: scheme.primary }}
            >
              73
            </div>
            <div 
              className="text-xs"
              style={{ color: scheme.textSecondary }}
            >
              Animals
            </div>
          </div>
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: scheme.surface,
              border: `1px solid ${scheme.border}`
            }}
          >
            <div 
              className="text-lg font-bold"
              style={{ color: scheme.secondary }}
            >
              4
            </div>
            <div 
              className="text-xs"
              style={{ color: scheme.textSecondary }}
            >
              Paddocks
            </div>
          </div>
          <div 
            className="p-3 rounded-lg text-center"
            style={{ 
              backgroundColor: scheme.surface,
              border: `1px solid ${scheme.border}`
            }}
          >
            <div 
              className="text-lg font-bold"
              style={{ color: scheme.primary }}
            >
              85%
            </div>
            <div 
              className="text-xs"
              style={{ color: scheme.textSecondary }}
            >
              Health
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full justify-start text-white"
            style={{ backgroundColor: scheme.primary }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Plan Grazing Rotation
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            style={{ 
              borderColor: scheme.secondary,
              color: scheme.secondary
            }}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge 
            style={{ 
              backgroundColor: scheme.secondary,
              color: 'white'
            }}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Assessment Complete
          </Badge>
          <Badge 
            variant="outline"
            style={{ 
              borderColor: scheme.accent,
              color: scheme.text
            }}
          >
            <Sun className="w-3 h-3 mr-1" />
            Good Weather
          </Badge>
        </div>

        {/* Input Field */}
        <Input 
          placeholder="Search paddocks..."
          style={{ 
            borderColor: scheme.border,
            backgroundColor: scheme.surface
          }}
        />
      </div>

      {/* Bottom Navigation Preview */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-around"
        style={{ 
          backgroundColor: scheme.surface,
          borderTop: `1px solid ${scheme.border}`
        }}
      >
        {[
          { icon: MapPin, label: "Fields" },
          { icon: Users, label: "Livestock" }, 
          { icon: Calendar, label: "Calendar" },
          { icon: TrendingUp, label: "Analytics" }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <item.icon 
              className="w-5 h-5" 
              style={{ color: i === 0 ? scheme.primary : scheme.textSecondary }}
            />
            <span 
              className="text-xs"
              style={{ color: i === 0 ? scheme.primary : scheme.textSecondary }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ColorSchemeVariants() {
  const [selectedScheme, setSelectedScheme] = useState<string>("purple-harmony");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Color Scheme Options</h2>
        <p className="text-gray-600">
          Explore different color palettes for Cadence. Each scheme shows how the interface would look with that color system.
        </p>
      </div>

      {/* Scheme Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {colorSchemes.map((scheme) => (
          <Card 
            key={scheme.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedScheme === scheme.id 
                ? 'ring-2 ring-purple-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedScheme(scheme.id)}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span>{scheme.name}</span>
                {selectedScheme === scheme.id && (
                  <Star className="w-5 h-5 text-purple-500 fill-current" />
                )}
              </CardTitle>
              <p className="text-sm text-gray-600">{scheme.description}</p>
              <p className="text-xs font-medium text-gray-500">{scheme.personality}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Color Palette */}
              <div>
                <div className="text-sm font-medium mb-2">Color Palette</div>
                <div className="flex gap-2">
                  {[
                    { color: scheme.primary, label: "Primary" },
                    { color: scheme.secondary, label: "Secondary" },
                    { color: scheme.accent, label: "Accent" },
                    { color: scheme.text, label: "Text" }
                  ].map((color, i) => (
                    <div key={i} className="text-center">
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: color.color }}
                      />
                      <div className="text-xs mt-1">{color.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <MockUI scheme={scheme} />
              
              {/* Apply Button */}
              <Button 
                className="w-full"
                variant={selectedScheme === scheme.id ? "default" : "outline"}
                onClick={() => setSelectedScheme(scheme.id)}
              >
                {selectedScheme === scheme.id ? "Selected" : "Preview This Scheme"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Scheme Details */}
      {selectedScheme && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">
              Selected: {colorSchemes.find(s => s.id === selectedScheme)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 mb-4">
              Would you like me to implement this color scheme across the entire application? 
              I can update all the CSS variables and component styling to match your selection.
            </p>
            <div className="flex gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Apply This Color Scheme
              </Button>
              <Button variant="outline">
                Show More Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}