import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDemoData, demoPaddocks } from "@/lib/demo-data";
import type { Paddock, Herd } from "@shared/schema";
import { 
  MapPin, Ruler, TreePine, Calendar, Droplets, Home, 
  Compass, Zap, AlertTriangle, CheckCircle, Clock,
  Navigation, Trees, Fence, Route
} from "lucide-react";

export default function FarmMap() {
  const [selectedPaddock, setSelectedPaddock] = useState<Paddock | null>(null);
  const [mapView, setMapView] = useState<'aerial' | 'infrastructure' | 'grazing'>('aerial');

  const { data: apiPaddocks = [], isLoading: paddocksLoading } = useQuery<Paddock[]>({
    queryKey: ['/api/paddocks']
  });
  
  const paddocks = useDemoData(apiPaddocks, demoPaddocks);

  const { data: herds = [] } = useQuery<Herd[]>({
    queryKey: ['/api/herds']
  });

  // Calculate paddock status
  const getPaddockStatus = (paddock: Paddock) => {
    if (paddock.currentlyGrazing) {
      return { status: 'active', color: 'bg-green-500', label: 'Currently Grazing' };
    }
    
    const restDays = paddock.restDays || 0;
    const lastGrazed = paddock.lastGrazed ? new Date(paddock.lastGrazed) : null;
    
    if (lastGrazed) {
      const daysSinceGrazed = Math.floor((Date.now() - lastGrazed.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceGrazed < restDays * 0.7) {
        return { status: 'resting', color: 'bg-orange-500', label: `Resting (${daysSinceGrazed}/${restDays} days)` };
      } else if (daysSinceGrazed >= restDays) {
        return { status: 'ready', color: 'bg-blue-500', label: 'Ready for Grazing' };
      } else {
        return { status: 'recovering', color: 'bg-yellow-500', label: `Recovering (${daysSinceGrazed}/${restDays} days)` };
      }
    }
    
    return { status: 'unknown', color: 'bg-gray-400', label: 'Status Unknown' };
  };

  // Generate realistic farm layout with organic shapes
  const generateFarmLayout = (paddocks: Paddock[]) => {
    const positions: any[] = [];
    
    // Add farm infrastructure positions with better placement
    const infrastructure = [
      { type: 'barn', x: 20, y: 20, icon: Home, label: 'Main Barn', color: '#8B4513' },
      { type: 'well', x: 35, y: 25, icon: Droplets, label: 'Water Well', color: '#4A90E2' },
      { type: 'gate', x: 15, y: 70, icon: Route, label: 'Main Gate', color: '#666666' },
      { type: 'storage', x: 25, y: 15, icon: Home, label: 'Feed Storage', color: '#A0522D' },
      { type: 'pond', x: 70, y: 30, icon: Droplets, label: 'Livestock Pond', color: '#1E90FF' },
      { type: 'shelter', x: 45, y: 80, icon: Home, label: 'Field Shelter', color: '#8B4513' },
    ];
    
    // Create more realistic, organic paddock layouts
    const paddockShapes = [
      // Irregular shapes that look more natural
      { path: 'M10,10 L80,15 L85,70 L20,75 Z', x: 50, y: 50 },
      { path: 'M5,20 L90,25 L80,80 L15,85 Z', x: 250, y: 80 },
      { path: 'M15,5 L75,20 L70,90 L10,80 Z', x: 150, y: 200 },
      { path: 'M20,15 L85,10 L90,75 L25,90 Z', x: 350, y: 180 },
      { path: 'M10,25 L70,20 L75,85 L5,90 Z', x: 120, y: 320 },
      { path: 'M25,10 L95,20 L85,80 L15,85 Z', x: 320, y: 300 },
    ];
    
    paddocks.forEach((paddock, index) => {
      const shape = paddockShapes[index % paddockShapes.length];
      const acres = parseFloat(paddock.acres || '5');
      
      // Scale based on acreage
      const scale = Math.max(0.8, Math.min(1.5, acres / 10));
      const status = getPaddockStatus(paddock);
      
      // Create organic positioning
      const baseX = shape.x + (index > 5 ? 100 : 0);
      const baseY = shape.y + Math.floor(index / 2) * 20;
      
      positions.push({
        paddock,
        x: baseX,
        y: baseY,
        scale,
        shape: shape.path,
        status,
        // Add realistic paddock features
        features: {
          hasWater: paddock.waterSources && paddock.waterSources > 0,
          hasShade: paddock.shadeAvailability === 'good' || paddock.shadeAvailability === 'excellent',
          slope: Math.random() > 0.5 ? 'gentle' : 'moderate'
        }
      });
    });
    
    return { paddocks: positions, infrastructure };
  };

  const farmLayout = generateFarmLayout(paddocks);

  if (paddocksLoading) {
    return (
      <div className="min-h-screen bg-green-50">
        <div className="pb-20 pt-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading farm map...</p>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <div className="pb-20 pt-4 px-2 sm:px-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Mobile-Optimized Header */}
          <div className="space-y-3">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Farm Map</h1>
              <p className="text-sm text-gray-600 hidden sm:block">Interactive overview of paddocks and grazing status</p>
            </div>
            
            {/* Mobile View Selector */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <Button
                variant={mapView === 'aerial' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => setMapView('aerial')}
              >
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Aerial</span>
              </Button>
              <Button
                variant={mapView === 'infrastructure' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => setMapView('infrastructure')}
              >
                <Home className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Infrastructure</span>
              </Button>
              <Button
                variant={mapView === 'grazing' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1 text-xs sm:text-sm"
                onClick={() => setMapView('grazing')}
              >
                <Trees className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Status</span>
              </Button>
            </div>

            {/* Mobile-Optimized Toolbar - Hidden on very small screens */}
            <div className="hidden sm:flex flex-wrap gap-2 p-2 bg-white rounded-lg border">
              <Button variant="outline" size="sm" className="text-xs">
                <Route className="h-3 w-3 mr-1" />
                Route
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Schedule
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Ruler className="h-3 w-3 mr-1" />
                Measure
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Report
              </Button>
            </div>
          </div>

          {/* Mobile-Optimized Legend */}
          <Card className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">Legend</div>
                <div className="text-xs text-gray-500">Next move: 2 days</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-500 rounded border border-gray-400"></div>
                  <span className="text-xs">Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-orange-500 rounded border border-gray-400"></div>
                  <span className="text-xs">Resting</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-500 rounded border border-gray-400"></div>
                  <span className="text-xs">Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Home className="w-3 h-3 text-gray-600" />
                  <span className="text-xs">Buildings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-xs">Water</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gray-800 rounded-full text-white text-xs flex items-center justify-center font-bold">1</div>
                  <span className="text-xs">Order</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Mobile-Optimized Interactive Farm Map */}
          <Card className="p-2 sm:p-4">
            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-green-100 via-green-200 to-emerald-300 rounded-lg border-2 border-gray-300 overflow-hidden">
              {/* Background terrain texture */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" viewBox="0 0 800 500">
                  <defs>
                    <pattern id="grass" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <rect width="20" height="20" fill="#90EE90" />
                      <path d="M0,20 Q5,15 10,20 Q15,15 20,20" stroke="#7CFC00" strokeWidth="0.5" fill="none" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grass)" />
                </svg>
              </div>

              {/* Mobile-Optimized Compass */}
              <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg z-10">
                <Compass className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <div className="absolute -top-0.5 right-1 text-xs font-bold text-red-600">N</div>
              </div>

              {/* Mobile-Optimized Scale indicator */}
              <div className="absolute bottom-2 left-2 bg-white rounded px-2 py-1 shadow-lg text-xs font-medium z-10">
                <div className="flex items-center gap-1">
                  <div className="h-0.5 w-6 sm:w-8 bg-gray-800"></div>
                  <span className="text-xs">50m</span>
                </div>
              </div>

              {/* SVG for organic shapes */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500">
                {/* Farm Infrastructure */}
                {(mapView === 'aerial' || mapView === 'infrastructure') && farmLayout.infrastructure.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <g key={index}>
                      <circle
                        cx={item.x * 8}
                        cy={item.y * 5}
                        r="12"
                        fill={item.color}
                        stroke="#fff"
                        strokeWidth="2"
                        className="drop-shadow-lg"
                      />
                      <foreignObject
                        x={item.x * 8 - 6}
                        y={item.y * 5 - 6}
                        width="12"
                        height="12"
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </foreignObject>
                      <text
                        x={item.x * 8}
                        y={item.y * 5 + 25}
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-800"
                        style={{ fontSize: '10px' }}
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}

                {/* Organic Paddock Shapes */}
                {farmLayout.paddocks.map((layout, index) => {
                  const statusColor: string = mapView === 'grazing' ? 
                    layout.status.color.replace('bg-', '').replace('-500', '') : 'green';
                  
                  const colorMap: { [key: string]: string } = {
                    'green': '#10B981',
                    'orange': '#F59E0B', 
                    'yellow': '#EAB308',
                    'blue': '#3B82F6',
                    'gray': '#6B7280'
                  };
                  const fillColor = colorMap[statusColor] || '#10B981';

                  return (
                    <g key={layout.paddock.id}>
                      {/* Paddock shape with organic borders */}
                      <path
                        d={layout.shape}
                        fill={fillColor}
                        stroke="#374151"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-200 hover:opacity-90 drop-shadow-md"
                        transform={`translate(${layout.x}, ${layout.y}) scale(${layout.scale})`}
                        onClick={() => setSelectedPaddock(layout.paddock)}
                      />
                      
                      {/* Mobile-Optimized Paddock label */}
                      <text
                        x={layout.x + 45}
                        y={layout.y + 25}
                        textAnchor="middle"
                        className="fill-white font-bold drop-shadow-sm pointer-events-none"
                        style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                      >
                        {layout.paddock.name}
                      </text>
                      
                      {/* Mobile-Optimized Acreage */}
                      <text
                        x={layout.x + 45}
                        y={layout.y + 38}
                        textAnchor="middle"
                        className="fill-white opacity-90 pointer-events-none"
                        style={{ fontSize: window.innerWidth < 640 ? '8px' : '10px' }}
                      >
                        {layout.paddock.acres} acres
                      </text>

                      {/* Status indicator for grazing view */}
                      {mapView === 'grazing' && (
                        <rect
                          x={layout.x + 5}
                          y={layout.y + 5}
                          width="60"
                          height="12"
                          fill="rgba(0,0,0,0.7)"
                          rx="6"
                          className="pointer-events-none"
                        />
                      )}
                      {mapView === 'grazing' && (
                        <text
                          x={layout.x + 35}
                          y={layout.y + 13}
                          textAnchor="middle"
                          className="text-xs fill-white pointer-events-none"
                          style={{ fontSize: '8px' }}
                        >
                          {layout.status.label}
                        </text>
                      )}

                      {/* Water sources indicator */}
                      {layout.features.hasWater && (
                        <circle
                          cx={layout.x + 75}
                          cy={layout.y + 15}
                          r="6"
                          fill="#3B82F6"
                          stroke="#fff"
                          strokeWidth="1"
                          className="pointer-events-none"
                        />
                      )}

                      {/* Shade indicator */}
                      {layout.features.hasShade && (
                        <circle
                          cx={layout.x + 75}
                          cy={layout.y + 75}
                          r="4"
                          fill="#059669"
                          stroke="#fff"
                          strokeWidth="1"
                          className="pointer-events-none"
                        />
                      )}

                      {/* Rotation order indicator */}
                      {layout.paddock.rotationOrder && (
                        <circle
                          cx={layout.x + 15}
                          cy={layout.y + 75}
                          r="8"
                          fill="#1F2937"
                          stroke="#fff"
                          strokeWidth="2"
                          className="pointer-events-none"
                        />
                      )}
                      {layout.paddock.rotationOrder && (
                        <text
                          x={layout.x + 15}
                          y={layout.y + 78}
                          textAnchor="middle"
                          className="text-xs font-bold fill-white pointer-events-none"
                          style={{ fontSize: '10px' }}
                        >
                          {layout.paddock.rotationOrder}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Roads and paths */}
                {mapView === 'infrastructure' && (
                  <>
                    {/* Main road */}
                    <path
                      d="M80,250 Q200,240 400,250 Q600,260 720,250"
                      stroke="#4B5563"
                      strokeWidth="12"
                      fill="none"
                      opacity="0.8"
                    />
                    {/* Cross path */}
                    <path
                      d="M400,50 Q390,150 400,250 Q410,350 400,450"
                      stroke="#4B5563"
                      strokeWidth="8"
                      fill="none"
                      opacity="0.8"
                    />
                    {/* Farm entrance */}
                    <path
                      d="M0,250 L80,250"
                      stroke="#6B7280"
                      strokeWidth="10"
                      fill="none"
                      opacity="0.9"
                    />
                  </>
                )}

                {/* Property boundaries */}
                <rect
                  x="5"
                  y="5"
                  width="790"
                  height="490"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                  strokeDasharray="10,5"
                  opacity="0.6"
                />
              </svg>
            </div>
          </Card>

          {/* Mobile-Optimized Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card className="p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-600">{paddocks.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Paddocks</div>
            </Card>
            <Card className="p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                {paddocks.reduce((sum, p) => sum + parseFloat(p.acres || '0'), 0).toFixed(1)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Total Acres</div>
            </Card>
            <Card className="p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-orange-600">
                {paddocks.filter(p => p.currentlyGrazing).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Active</div>
            </Card>
            <Card className="p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-purple-600">
                {paddocks.reduce((sum, p) => sum + (p.waterSources || 0), 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Water</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Paddock Detail Modal */}
      <Dialog open={!!selectedPaddock} onOpenChange={() => setSelectedPaddock(null)}>
        <DialogContent className="max-w-sm sm:max-w-lg mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              {selectedPaddock?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedPaddock && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Size:</span>
                    <span className="text-sm">{selectedPaddock.acres} acres</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TreePine className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Type:</span>
                    <span className="text-sm capitalize">{selectedPaddock.pastureType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Water:</span>
                    <span className="text-sm">{selectedPaddock.waterSources || 0} sources</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Rest Period:</span>
                    <span className="text-sm">{selectedPaddock.restDays || 'N/A'} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trees className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Shade:</span>
                    <span className="text-sm capitalize">{selectedPaddock.shadeAvailability || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Last Grazed:</span>
                    <span className="text-sm">
                      {selectedPaddock.lastGrazed 
                        ? new Date(selectedPaddock.lastGrazed).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Current Status:</div>
                <Badge 
                  className={`${getPaddockStatus(selectedPaddock).color} text-white`}
                >
                  {getPaddockStatus(selectedPaddock).label}
                </Badge>
              </div>

              <div className="flex gap-2 pt-4">
                <Button size="sm" className="flex-1">
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate to Paddock
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule Grazing
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}