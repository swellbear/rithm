import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDemoData, demoMarketData } from "@/lib/demo-data";
import { 
  TrendingUp, TrendingDown, Globe, DollarSign, Target, 
  Truck, ShoppingCart, Users, Calendar, BarChart3,
  Package, MapPin, Clock, Shield, Star, ArrowRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RechartsPI, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface MarketPrice {
  commodity: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  unit: string;
  market: string;
  lastUpdated: Date;
  trend: "up" | "down" | "stable";
  forecast: {
    shortTerm: number; // 30 days
    mediumTerm: number; // 90 days
    longTerm: number; // 12 months
  };
}

interface Buyer {
  id: string;
  name: string;
  type: "local" | "regional" | "national" | "export";
  location: string;
  distance: number; // miles
  commodities: string[];
  currentPricing: Record<string, number>;
  paymentTerms: string;
  qualityRequirements: string[];
  contactInfo: {
    phone: string;
    email: string;
    contact: string;
  };
  rating: number;
  reliabilityScore: number;
  lastTransaction?: Date;
}

interface Contract {
  id: string;
  buyerId: string;
  commodity: string;
  quantity: number;
  price: number;
  deliveryDate: Date;
  qualitySpecs: string[];
  status: "active" | "pending" | "completed" | "cancelled";
  penaltyClause: string;
  bonusOpportunity?: string;
}

interface SupplyChainMetrics {
  efficiency: number;
  costPerUnit: number;
  deliveryReliability: number;
  qualityScore: number;
  customerSatisfaction: number;
  carbonFootprint: number;
}

interface MarketOpportunity {
  id: string;
  type: "premium_market" | "direct_sales" | "value_added" | "export" | "seasonal";
  description: string;
  commodity: string;
  premiumPotential: number; // percentage above market
  requirements: string[];
  certification: string[];
  timeToMarket: number; // months
  investmentRequired: number;
  riskLevel: "low" | "medium" | "high";
  roi: number;
}

interface LogisticsOption {
  id: string;
  provider: string;
  type: "pickup" | "delivery" | "storage" | "processing";
  costStructure: string;
  coverage: string[];
  reliability: number;
  specializations: string[];
}

export default function MarketAnalysis() {
  const [complexityLevel, setComplexityLevel] = useState<"basic" | "intermediate" | "advanced">("intermediate");
  const [selectedCommodity, setSelectedCommodity] = useState<string>("cattle");
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [supplyChainMetrics, setSupplyChainMetrics] = useState<SupplyChainMetrics>({
    efficiency: 85,
    costPerUnit: 42.50,
    deliveryReliability: 92,
    qualityScore: 88,
    customerSatisfaction: 90,
    carbonFootprint: 3.2
  });

  const { toast } = useToast();

  // Fetch farm data
  const { data: animals = [] } = useQuery<any[]>({ queryKey: ["/api/animals"] });
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });

  useEffect(() => {
    generateMockMarketData();
  }, [selectedCommodity]);

  const generateMockMarketData = () => {
    // Generate market prices
    const mockPrices: MarketPrice[] = [
      {
        commodity: "Live Cattle",
        currentPrice: 142.50,
        priceChange: 2.75,
        priceChangePercent: 1.97,
        unit: "$/cwt",
        market: "Chicago Mercantile Exchange",
        lastUpdated: new Date(),
        trend: "up",
        forecast: {
          shortTerm: 145.25,
          mediumTerm: 148.80,
          longTerm: 152.30
        }
      },
      {
        commodity: "Feeder Cattle",
        currentPrice: 168.75,
        priceChange: -1.25,
        priceChangePercent: -0.73,
        unit: "$/cwt",
        market: "CME",
        lastUpdated: new Date(),
        trend: "down",
        forecast: {
          shortTerm: 166.50,
          mediumTerm: 171.20,
          longTerm: 175.40
        }
      },
      {
        commodity: "Lamb",
        currentPrice: 185.30,
        priceChange: 4.80,
        priceChangePercent: 2.66,
        unit: "$/cwt",
        market: "Regional Market",
        lastUpdated: new Date(),
        trend: "up",
        forecast: {
          shortTerm: 188.75,
          mediumTerm: 192.40,
          longTerm: 198.60
        }
      },
      {
        commodity: "Organic Grass-Fed Beef",
        currentPrice: 285.90,
        priceChange: 8.25,
        priceChangePercent: 2.97,
        unit: "$/cwt",
        market: "Premium Market",
        lastUpdated: new Date(),
        trend: "up",
        forecast: {
          shortTerm: 292.15,
          mediumTerm: 298.50,
          longTerm: 312.75
        }
      }
    ];

    // Generate buyer network
    const mockBuyers: Buyer[] = [
      {
        id: "b1",
        name: "Heartland Beef Co.",
        type: "regional",
        location: "Tulsa, OK",
        distance: 25,
        commodities: ["Live Cattle", "Feeder Cattle"],
        currentPricing: {
          "Live Cattle": 140.25,
          "Feeder Cattle": 166.50
        },
        paymentTerms: "Net 30",
        qualityRequirements: ["Grass-fed", "No antibiotics", "Weight 1100-1300 lbs"],
        contactInfo: {
          phone: "(918) 555-0123",
          email: "procurement@heartlandbeef.com",
          contact: "Sarah Johnson"
        },
        rating: 4.7,
        reliabilityScore: 94,
        lastTransaction: new Date(2024, 10, 15)
      },
      {
        id: "b2",
        name: "Premium Protein Partners",
        type: "national",
        location: "Kansas City, MO",
        distance: 180,
        commodities: ["Organic Grass-Fed Beef", "Lamb"],
        currentPricing: {
          "Organic Grass-Fed Beef": 282.50,
          "Lamb": 183.75
        },
        paymentTerms: "Net 45",
        qualityRequirements: ["Organic certified", "Grass-fed only", "Local processing"],
        contactInfo: {
          phone: "(816) 555-0456",
          email: "buyers@premiumprotein.com",
          contact: "Michael Chen"
        },
        rating: 4.9,
        reliabilityScore: 98,
        lastTransaction: new Date(2024, 11, 8)
      },
      {
        id: "b3",
        name: "Local Farm Market Collective",
        type: "local",
        location: "Stillwater, OK",
        distance: 8,
        commodities: ["Live Cattle", "Lamb", "Direct Sales"],
        currentPricing: {
          "Live Cattle": 145.00,
          "Lamb": 190.25
        },
        paymentTerms: "Cash on delivery",
        qualityRequirements: ["Pasture-raised", "Hormone-free", "Local origin"],
        contactInfo: {
          phone: "(405) 555-0789",
          email: "collective@localfarmmarket.com",
          contact: "Emily Rodriguez"
        },
        rating: 4.5,
        reliabilityScore: 89,
        lastTransaction: new Date(2024, 11, 20)
      },
      {
        id: "b4",
        name: "Global Protein Exports",
        type: "export",
        location: "Port of Houston, TX",
        distance: 320,
        commodities: ["Live Cattle", "Premium Cuts"],
        currentPricing: {
          "Live Cattle": 152.75,
          "Premium Cuts": 425.00
        },
        paymentTerms: "Letter of Credit",
        qualityRequirements: ["USDA Export Certified", "HACCP Compliant", "Traceable"],
        contactInfo: {
          phone: "(713) 555-0234",
          email: "exports@globalprotein.com",
          contact: "David Kim"
        },
        rating: 4.8,
        reliabilityScore: 96,
        lastTransaction: new Date(2024, 9, 30)
      }
    ];

    // Generate contracts
    const mockContracts: Contract[] = [
      {
        id: "c1",
        buyerId: "b1",
        commodity: "Live Cattle",
        quantity: 25,
        price: 142.00,
        deliveryDate: new Date(2025, 2, 15),
        qualitySpecs: ["Grass-fed", "Weight 1150-1250 lbs", "BCS 5-6"],
        status: "active",
        penaltyClause: "2% reduction for delivery >3 days late",
        bonusOpportunity: "3% bonus for organic certification"
      },
      {
        id: "c2",
        buyerId: "b2",
        commodity: "Lamb",
        quantity: 15,
        price: 188.50,
        deliveryDate: new Date(2025, 1, 28),
        qualitySpecs: ["Organic certified", "60-80 lb carcass weight"],
        status: "pending",
        penaltyClause: "5% reduction for failed organic inspection"
      }
    ];

    // Generate market opportunities
    const mockOpportunities: MarketOpportunity[] = [
      {
        id: "o1",
        type: "premium_market",
        description: "Certified Organic Grass-Fed Beef Program",
        commodity: "Live Cattle",
        premiumPotential: 35,
        requirements: [
          "USDA Organic Certification",
          "Grass-fed only (no grain finishing)",
          "Antibiotic and hormone-free",
          "Third-party animal welfare certification"
        ],
        certification: ["USDA Organic", "Animal Welfare Approved"],
        timeToMarket: 18,
        investmentRequired: 15000,
        riskLevel: "medium",
        roi: 145
      },
      {
        id: "o2",
        type: "direct_sales",
        description: "Farm-to-Table Restaurant Network",
        commodity: "Multiple",
        premiumPotential: 45,
        requirements: [
          "Consistent weekly delivery",
          "Custom cut specifications",
          "Farm story and transparency",
          "Seasonal menu planning"
        ],
        certification: ["Good Agricultural Practices"],
        timeToMarket: 6,
        investmentRequired: 8500,
        riskLevel: "low",
        roi: 185
      },
      {
        id: "o3",
        type: "value_added",
        description: "Artisan Sausage and Charcuterie Line",
        commodity: "Processed Products",
        premiumPotential: 125,
        requirements: [
          "USDA processing facility partnership",
          "Recipe development and testing",
          "Brand development and marketing",
          "Retail distribution network"
        ],
        certification: ["HACCP", "SQF Food Safety"],
        timeToMarket: 12,
        investmentRequired: 45000,
        riskLevel: "high",
        roi: 220
      },
      {
        id: "o4",
        type: "export",
        description: "Asian Premium Beef Export Program",
        commodity: "Live Cattle",
        premiumPotential: 65,
        requirements: [
          "Export facility qualification",
          "Traceability system implementation",
          "Cultural adaptation of products",
          "International logistics partnership"
        ],
        certification: ["USDA Export", "ISO 22000"],
        timeToMarket: 24,
        investmentRequired: 75000,
        riskLevel: "high",
        roi: 180
      }
    ];

    setMarketPrices(mockPrices);
    setBuyers(mockBuyers);
    setContracts(mockContracts);
    setOpportunities(mockOpportunities);
  };

  const calculatePriceHistory = () => {
    const basePrice = marketPrices.find(p => p.commodity === "Live Cattle")?.currentPrice || 140;
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().slice(5, 10),
      price: basePrice + (Math.random() - 0.5) * 10,
      volume: 1000 + Math.random() * 500
    }));
  };

  const renderMarketDashboard = () => {
    const priceHistory = calculatePriceHistory();
    const totalContractValue = contracts.reduce((sum, contract) => sum + (contract.quantity * contract.price), 0);
    const avgBuyerRating = buyers.reduce((sum, buyer) => sum + buyer.rating, 0) / buyers.length;
    const activeContracts = contracts.filter(c => c.status === "active").length;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">${marketPrices[0]?.currentPrice.toFixed(2) || "0.00"}</div>
                  <div className="text-sm text-gray-600">Current Price</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">${(totalContractValue / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-gray-600">Contract Value</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{buyers.length}</div>
                  <div className="text-sm text-gray-600">Active Buyers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{avgBuyerRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Price Trends</CardTitle>
              <CardDescription>30-day price movement and volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />
                  <Area type="monotone" dataKey="price" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Price ($/cwt)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Market Opportunities</CardTitle>
              <CardDescription>Premium potential vs. risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {opportunities.slice(0, 4).map(opp => (
                  <div key={opp.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{opp.description}</span>
                      <Badge variant={opp.riskLevel === "low" ? "default" : 
                                   opp.riskLevel === "medium" ? "secondary" : "destructive"}>
                        {opp.riskLevel} risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Premium:</span>
                        <span className="ml-1 font-medium">+{opp.premiumPotential}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">ROI:</span>
                        <span className="ml-1 font-medium">{opp.roi}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Timeline:</span>
                        <span className="ml-1 font-medium">{opp.timeToMarket}mo</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderBuyerNetwork = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Buyer Network</CardTitle>
            <CardDescription>Active and potential buyers for your commodities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buyers.map(buyer => (
                <div key={buyer.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{buyer.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">{buyer.type}</Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{buyer.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">{buyer.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Distance:</span>
                      <span className="ml-2 font-medium">{buyer.distance} miles</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reliability:</span>
                      <span className="ml-2 font-medium">{buyer.reliabilityScore}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Payment:</span>
                      <span className="ml-2 font-medium">{buyer.paymentTerms}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h5 className="font-medium text-sm mb-1">Current Pricing:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {Object.entries(buyer.currentPricing).map(([commodity, price]) => (
                        <div key={commodity}>
                          <span className="text-gray-600">{commodity}:</span>
                          <span className="ml-1 font-medium">${price}/cwt</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {complexityLevel !== "basic" && (
                    <div className="mb-3">
                      <h5 className="font-medium text-sm mb-1">Quality Requirements:</h5>
                      <div className="flex flex-wrap gap-1">
                        {buyer.qualityRequirements.map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{req}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 italic">
                    Contact features available in future updates
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContractManagement = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Contracts</CardTitle>
            <CardDescription>Current and pending sales contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts.map(contract => {
                const buyer = buyers.find(b => b.id === contract.buyerId);
                const totalValue = contract.quantity * contract.price;
                const daysToDelivery = Math.ceil((contract.deliveryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={contract.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{contract.commodity} - {buyer?.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={contract.status === "active" ? "default" : 
                                       contract.status === "pending" ? "secondary" : "outline"}>
                          {contract.status}
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          ${totalValue.toLocaleString()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <span className="ml-2 font-medium">{contract.quantity} head</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <span className="ml-2 font-medium">${contract.price}/cwt</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Delivery:</span>
                        <span className="ml-2 font-medium">{contract.deliveryDate.toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Days Left:</span>
                        <span className={`ml-2 font-medium ${
                          daysToDelivery < 7 ? 'text-red-600' : 
                          daysToDelivery < 30 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {daysToDelivery}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h5 className="font-medium text-sm mb-1">Quality Specifications:</h5>
                      <div className="flex flex-wrap gap-1">
                        {contract.qualitySpecs.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{spec}</Badge>
                        ))}
                      </div>
                    </div>

                    {complexityLevel !== "basic" && (
                      <div className="text-sm text-gray-600 mb-3">
                        <div><span className="font-medium">Penalty:</span> {contract.penaltyClause}</div>
                        {contract.bonusOpportunity && (
                          <div><span className="font-medium">Bonus:</span> {contract.bonusOpportunity}</div>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button size="sm">
                        <Truck className="h-3 w-3 mr-1" />
                        Logistics
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                      {contract.status === "active" && (
                        <Button size="sm" variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          Fulfill
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSupplyChainOptimization = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Performance</CardTitle>
            <CardDescription>Key metrics and optimization opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Efficiency</span>
                  <span className="text-lg font-bold">{supplyChainMetrics.efficiency}%</span>
                </div>
                <Progress value={supplyChainMetrics.efficiency} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">Operational efficiency score</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Delivery Reliability</span>
                  <span className="text-lg font-bold">{supplyChainMetrics.deliveryReliability}%</span>
                </div>
                <Progress value={supplyChainMetrics.deliveryReliability} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">On-time delivery rate</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Quality Score</span>
                  <span className="text-lg font-bold">{supplyChainMetrics.qualityScore}%</span>
                </div>
                <Progress value={supplyChainMetrics.qualityScore} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">Product quality consistency</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Cost Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Production Cost:</span>
                    <span>${supplyChainMetrics.costPerUnit.toFixed(2)}/unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transportation:</span>
                    <span>$3.25/unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing:</span>
                    <span>$2.80/unit</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Cost:</span>
                    <span className="font-medium">${(supplyChainMetrics.costPerUnit + 6.05).toFixed(2)}/unit</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Sustainability</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Carbon Footprint:</span>
                    <span>{supplyChainMetrics.carbonFootprint} kg CO2/unit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Local Sourcing:</span>
                    <span>78%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Renewable Energy:</span>
                    <span>45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waste Reduction:</span>
                    <span>12% vs. baseline</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {complexityLevel === "advanced" && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Supply Chain Features</CardTitle>
              <CardDescription>Cutting-edge supply chain optimization and automation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Blockchain Traceability</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Complete farm-to-fork traceability using blockchain technology for premium market access.
                  </p>
                  <div className="text-xs text-gray-500 italic">
                    Available in future updates
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">AI-Powered Demand Forecasting</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Machine learning algorithms predict market demand and optimize production scheduling.
                  </p>
                  <div className="text-xs text-gray-500 italic">
                    Available in future updates
                  </div>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Automated Trading Platform</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Automated contract execution and market-making for optimal pricing and timing.
                  </p>
                  <Button size="sm">
                    <Target className="h-4 w-4 mr-1" />
                    Configure Trading
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderIntegration = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Farm Management Integration</CardTitle>
            <CardDescription>How market intelligence drives operational decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Financial Management</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Market prices and contract values integrate with farm financial planning and cash flow forecasting
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Production Planning</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Market demand forecasts inform breeding, feeding, and grazing decisions for optimal timing
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Quality Management</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Buyer requirements drive animal health, nutrition, and pasture management protocols
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Performance Analytics</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Market performance metrics validate farm management strategies and guide improvements
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market-Driven Farm Optimization</CardTitle>
            <CardDescription>Strategic decision support based on market intelligence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Premium Market Positioning</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Market opportunities guide certification and management decisions</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Contract Production Planning</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Delivery commitments drive breeding schedules and resource allocation</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Risk Management</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Market volatility analysis informs hedging strategies and contract timing</p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Investment Prioritization</span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">Market value analysis guides infrastructure and technology investments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Market Analysis & Supply Chain Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Global market intelligence and supply chain optimization for maximum profitability
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cattle">Cattle</SelectItem>
                <SelectItem value="lamb">Lamb</SelectItem>
                <SelectItem value="goat">Goat</SelectItem>
                <SelectItem value="organic">Organic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={complexityLevel} onValueChange={(value: any) => setComplexityLevel(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto gap-0.5 p-1 bg-muted rounded-lg mb-6">
          <TabsTrigger value="dashboard" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="buyers" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">Buyers</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Contracts</span>
              <span className="sm:hidden">Cont.</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="supply-chain" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Supply Chain</span>
              <span className="sm:hidden">Supply</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="text-[9px] sm:text-sm text-center px-0.5 py-1.5 min-h-[3rem] flex items-center justify-center rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <span className="leading-[1.1] max-w-full">
              <span className="hidden sm:inline">Integration</span>
              <span className="sm:hidden">Integrate</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {renderMarketDashboard()}
        </TabsContent>

        <TabsContent value="buyers" className="space-y-6">
          {renderBuyerNetwork()}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          {renderContractManagement()}
        </TabsContent>

        <TabsContent value="supply-chain" className="space-y-6">
          {renderSupplyChainOptimization()}
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          {renderIntegration()}
        </TabsContent>
      </Tabs>
    </div>
  );
}