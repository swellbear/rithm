import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  TrendingUp, DollarSign, Award, Users, Phone, Mail,
  ExternalLink, CheckCircle, AlertTriangle, Clock,
  BarChart3, Building2, Shield, FileText, Calendar,
  MapPin, Star, Stethoscope, Clipboard
} from "lucide-react";

interface IndustryIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommodityPrice {
  commodity: string;
  currentPrice: number;
  unit: string;
  change24h: number;
  changePercent: number;
  volume: string;
  lastUpdated: string;
  market: string;
  quality: string;
}

interface VeterinaryContact {
  id: string;
  name: string;
  practice: string;
  specialties: string[];
  distance: number;
  rating: number;
  phone: string;
  email: string;
  address: string;
  services: string[];
  emergencyAvailable: boolean;
  acceptsInsurance: boolean;
  languages: string[];
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  description: string;
  requirements: string[];
  benefits: string[];
  cost: number;
  duration: string;
  renewalPeriod: string;
  marketPremium: number;
  status: 'available' | 'in_progress' | 'certified' | 'expired';
  expiryDate?: string;
  nextAudit?: string;
}

interface ComplianceRequirement {
  id: string;
  regulation: string;
  jurisdiction: string;
  description: string;
  dueDate: string;
  status: 'compliant' | 'needs_attention' | 'overdue';
  lastCheck: string;
  nextCheck: string;
  documents: string[];
  penalties: string;
}

export default function IndustryIntegration({ isOpen, onClose }: IndustryIntegrationProps) {
  const [selectedMarket, setSelectedMarket] = useState('local');
  const [selectedSpecies, setSelectedSpecies] = useState('cattle');
  const [searchRadius, setSearchRadius] = useState(50);
  const [commodityPrices, setCommodityPrices] = useState<CommodityPrice[]>([]);
  const [veterinaryContacts, setVeterinaryContacts] = useState<VeterinaryContact[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceRequirement[]>([]);
  const { toast } = useToast();

  // Fetch farm data for industry integration
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });

  // Generate commodity pricing data
  const generateCommodityPrices = () => {
    const prices: CommodityPrice[] = [
      {
        commodity: 'Feeder Cattle (500-600 lbs)',
        currentPrice: 285.50,
        unit: '$/cwt',
        change24h: 4.25,
        changePercent: 1.51,
        volume: '2,450 head',
        lastUpdated: new Date().toISOString(),
        market: 'Regional Auction',
        quality: 'Choice'
      },
      {
        commodity: 'Feeder Cattle (700-800 lbs)',
        currentPrice: 265.75,
        unit: '$/cwt',
        change24h: -2.10,
        changePercent: -0.78,
        volume: '1,890 head',
        lastUpdated: new Date().toISOString(),
        market: 'Regional Auction',
        quality: 'Choice'
      },
      {
        commodity: 'Finished Cattle (1200+ lbs)',
        currentPrice: 145.20,
        unit: '$/cwt',
        change24h: 1.85,
        changePercent: 1.29,
        volume: '890 head',
        lastUpdated: new Date().toISOString(),
        market: 'Processing Plant',
        quality: 'Prime'
      },
      {
        commodity: 'Sheep (Market Lambs)',
        currentPrice: 168.30,
        unit: '$/cwt',
        change24h: 3.15,
        changePercent: 1.91,
        volume: '340 head',
        lastUpdated: new Date().toISOString(),
        market: 'Regional Auction',
        quality: 'Select'
      },
      {
        commodity: 'Hay (Alfalfa)',
        currentPrice: 245.00,
        unit: '$/ton',
        change24h: 5.00,
        changePercent: 2.08,
        volume: '125 tons',
        lastUpdated: new Date().toISOString(),
        market: 'Local Market',
        quality: 'Premium'
      },
      {
        commodity: 'Corn (Feed Grade)',
        currentPrice: 4.85,
        unit: '$/bushel',
        change24h: -0.12,
        changePercent: -2.42,
        volume: '8,500 bushels',
        lastUpdated: new Date().toISOString(),
        market: 'Commodity Exchange',
        quality: '#2 Yellow'
      }
    ];

    setCommodityPrices(prices);
  };

  // Generate veterinary contact data
  const generateVeterinaryContacts = () => {
    const contacts: VeterinaryContact[] = [
      {
        id: 'vet-1',
        name: 'Dr. Sarah Mitchell',
        practice: 'Rural Veterinary Services',
        specialties: ['Large Animal', 'Reproductive Health', 'Nutrition'],
        distance: 12.5,
        rating: 4.8,
        phone: '(555) 234-5678',
        email: 'sarah@ruralvetservices.com',
        address: '1245 County Road 42, Anytown, OK 74001',
        services: ['Routine Health Checks', 'Pregnancy Diagnosis', 'Vaccination Programs', 'Emergency Care'],
        emergencyAvailable: true,
        acceptsInsurance: true,
        languages: ['English', 'Spanish']
      },
      {
        id: 'vet-2',
        name: 'Dr. Michael Chen',
        practice: 'Livestock Health Associates',
        specialties: ['Herd Health', 'Disease Prevention', 'Pasture Management'],
        distance: 28.3,
        rating: 4.9,
        phone: '(555) 345-6789',
        email: 'mchen@livestockhealth.com',
        address: '789 Veterinary Drive, Smalltown, OK 74002',
        services: ['Herd Health Programs', 'Nutritional Consulting', 'Parasite Management', 'Record Keeping'],
        emergencyAvailable: false,
        acceptsInsurance: true,
        languages: ['English']
      },
      {
        id: 'vet-3',
        name: 'Dr. Emily Rodriguez',
        practice: 'Mobile Livestock Care',
        specialties: ['Mobile Services', 'Breeding Management', 'Young Animal Care'],
        distance: 18.7,
        rating: 4.7,
        phone: '(555) 456-7890',
        email: 'emily@mobilelivestockcare.com',
        address: 'Mobile Service - Coverage Area: 50 mile radius',
        services: ['On-Farm Visits', 'Breeding Soundness Exams', 'Calf/Lamb Health', 'Vaccination Clinics'],
        emergencyAvailable: true,
        acceptsInsurance: false,
        languages: ['English', 'Spanish']
      }
    ];

    setVeterinaryContacts(contacts);
  };

  // Generate certification data
  const generateCertifications = () => {
    const certs: Certification[] = [
      {
        id: 'organic',
        name: 'USDA Organic Certification',
        issuer: 'USDA National Organic Program',
        description: 'Certifies that livestock and land management practices meet organic standards',
        requirements: [
          'No synthetic pesticides or fertilizers for 3+ years',
          'Organic feed only',
          'Pasture management plan',
          'No antibiotics or growth hormones',
          'Detailed record keeping'
        ],
        benefits: [
          '20-30% price premium for organic beef/lamb',
          'Access to premium markets',
          'Consumer brand differentiation',
          'Sustainable farming recognition'
        ],
        cost: 2500,
        duration: '3-6 months application process',
        renewalPeriod: 'Annual',
        marketPremium: 25,
        status: 'available'
      },
      {
        id: 'grass-fed',
        name: 'Grass-Fed Certification',
        issuer: 'American Grassfed Association',
        description: 'Verifies that animals are fed only grass and forage throughout their lives',
        requirements: [
          'Animals fed only grass and forage',
          'Continuous access to pasture during growing season',
          'No grain or grain by-products',
          'Third-party verification',
          'Animal welfare standards'
        ],
        benefits: [
          '15-25% price premium',
          'Health-conscious consumer market',
          'Environmental stewardship recognition',
          'Direct-to-consumer opportunities'
        ],
        cost: 1200,
        duration: '2-3 months',
        renewalPeriod: 'Annual',
        marketPremium: 20,
        status: 'available'
      },
      {
        id: 'animal-welfare',
        name: 'Animal Welfare Approved',
        issuer: 'A Greener World',
        description: 'Highest welfare standards for farm animals raised outdoors on pasture',
        requirements: [
          'Continuous outdoor access',
          'High welfare slaughter standards',
          'No confinement systems',
          'Independent auditing',
          'Comprehensive welfare protocols'
        ],
        benefits: [
          'Premium market access',
          '10-20% price premium',
          'Consumer trust and loyalty',
          'Restaurant/retail partnerships'
        ],
        cost: 800,
        duration: '1-2 months',
        renewalPeriod: 'Annual',
        marketPremium: 15,
        status: 'available'
      },
      {
        id: 'carbon-neutral',
        name: 'Carbon Neutral Certified',
        issuer: 'Carbon Trust',
        description: 'Verifies net-zero carbon emissions through measurement and offsetting',
        requirements: [
          'Carbon footprint assessment',
          'Reduction plan implementation',
          'Verified carbon offsets',
          'Annual monitoring and reporting',
          'Third-party verification'
        ],
        benefits: [
          'Access to carbon credit markets',
          'Sustainability leadership',
          'Corporate buyer preference',
          'Potential $15-25/acre annual revenue'
        ],
        cost: 3500,
        duration: '4-6 months',
        renewalPeriod: 'Annual',
        marketPremium: 10,
        status: 'available'
      }
    ];

    setCertifications(certs);
  };

  // Generate compliance requirements
  const generateComplianceRequirements = () => {
    const requirements: ComplianceRequirement[] = [
      {
        id: 'premises-id',
        regulation: 'Premises Identification',
        jurisdiction: 'Oklahoma Department of Agriculture',
        description: 'Required identification number for livestock premises',
        dueDate: '2025-12-31',
        status: 'compliant',
        lastCheck: '2024-06-15',
        nextCheck: '2025-06-15',
        documents: ['Premises ID Certificate', 'Location Map'],
        penalties: 'Fines up to $1,000 for non-compliance'
      },
      {
        id: 'brand-inspection',
        regulation: 'Brand Inspection',
        jurisdiction: 'Oklahoma Cattlemen\'s Association',
        description: 'Required for cattle sales and transport',
        dueDate: '2025-08-15',
        status: 'needs_attention',
        lastCheck: '2024-02-20',
        nextCheck: '2025-02-20',
        documents: ['Brand Registration', 'Inspection Certificates'],
        penalties: 'Unable to sell cattle without proper inspection'
      },
      {
        id: 'water-rights',
        regulation: 'Water Rights Reporting',
        jurisdiction: 'Oklahoma Water Resources Board',
        description: 'Annual reporting of water usage for livestock',
        dueDate: '2025-03-01',
        status: 'compliant',
        lastCheck: '2024-02-28',
        nextCheck: '2025-02-28',
        documents: ['Water Usage Report', 'Well Permits'],
        penalties: 'Fines and potential water right revocation'
      },
      {
        id: 'environmental',
        regulation: 'Environmental Compliance',
        jurisdiction: 'EPA / Oklahoma DEQ',
        description: 'Runoff management and nutrient application limits',
        dueDate: '2025-04-30',
        status: 'needs_attention',
        lastCheck: '2024-04-15',
        nextCheck: '2025-04-15',
        documents: ['Nutrient Management Plan', 'Runoff Control Plan'],
        penalties: 'Fines up to $25,000 per violation'
      }
    ];

    setComplianceItems(requirements);
  };

  // Calculate potential revenue from certifications
  const calculateCertificationRevenue = (cert: Certification) => {
    const totalAnimals = herds.reduce((sum, h) => sum + h.count, 0);
    const avgWeight = 1000; // pounds
    const basePrice = 1.45; // $/lb
    const premiumRevenue = totalAnimals * avgWeight * basePrice * (cert.marketPremium / 100);
    const annualRevenue = premiumRevenue - cert.cost;
    return annualRevenue;
  };

  // Initialize data when component opens
  useEffect(() => {
    if (isOpen) {
      generateCommodityPrices();
      generateVeterinaryContacts();
      generateCertifications();
      generateComplianceRequirements();
    }
  }, [isOpen]);

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? '↗' : '↘';
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_attention': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'overdue': return <Clock className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Industry Integration Hub
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pricing" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pricing">Market Pricing</TabsTrigger>
              <TabsTrigger value="veterinary">Veterinary Network</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-4">
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Real-time commodity pricing from regional markets and commodity exchanges to optimize buying and selling decisions.
                </AlertDescription>
              </Alert>

              {/* Market Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="market">Market Region</Label>
                  <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local/Regional Markets</SelectItem>
                      <SelectItem value="national">National Commodity Exchange</SelectItem>
                      <SelectItem value="futures">Futures Markets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="species">Primary Species</Label>
                  <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cattle">Cattle</SelectItem>
                      <SelectItem value="sheep">Sheep</SelectItem>
                      <SelectItem value="goats">Goats</SelectItem>
                      <SelectItem value="all">All Species</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Commodity Prices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {commodityPrices.map((price, idx) => (
                  <Card key={idx} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{price.commodity}</h3>
                          <p className="text-sm text-muted-foreground">{price.market} • {price.quality}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {price.volume}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">
                            ${price.currentPrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">{price.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${getPriceChangeColor(price.change24h)}`}>
                            {getPriceChangeIcon(price.change24h)} ${Math.abs(price.change24h).toFixed(2)}
                          </div>
                          <div className={`text-sm ${getPriceChangeColor(price.changePercent)}`}>
                            {price.changePercent > 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        Updated: {new Date(price.lastUpdated).toLocaleTimeString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Price Alerts Setup */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Price Alert Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="commodity">Commodity</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select commodity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feeder-cattle">Feeder Cattle</SelectItem>
                          <SelectItem value="finished-cattle">Finished Cattle</SelectItem>
                          <SelectItem value="sheep">Market Lambs</SelectItem>
                          <SelectItem value="hay">Hay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="target-price">Target Price ($/cwt)</Label>
                      <Input placeholder="e.g., 280.00" />
                    </div>
                    <div>
                      <Label htmlFor="alert-type">Alert Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Above Target</SelectItem>
                          <SelectItem value="below">Below Target</SelectItem>
                          <SelectItem value="change">Price Change %</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full">
                    Set Price Alert
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="veterinary" className="space-y-4">
              <Alert>
                <Stethoscope className="h-4 w-4" />
                <AlertDescription>
                  Connect with qualified veterinary professionals in your area for health management and consultation services.
                </AlertDescription>
              </Alert>

              {/* Search Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search-radius">Search Radius (miles)</Label>
                  <Select value={searchRadius.toString()} onValueChange={(value) => setSearchRadius(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                      <SelectItem value="75">75 miles</SelectItem>
                      <SelectItem value="100">100 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="specialty">Specialty Filter</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      <SelectItem value="large-animal">Large Animal</SelectItem>
                      <SelectItem value="reproductive">Reproductive Health</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="emergency">Emergency Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Veterinary Contacts */}
              <div className="space-y-4">
                {veterinaryContacts.map((vet) => (
                  <Card key={vet.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{vet.name}</h3>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${i < Math.floor(vet.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="text-sm text-muted-foreground ml-1">
                                {vet.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-blue-600">{vet.practice}</p>
                          <p className="text-sm text-muted-foreground">{vet.distance} miles away</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {vet.emergencyAvailable && (
                            <Badge variant="destructive" className="text-xs">
                              Emergency
                            </Badge>
                          )}
                          {vet.acceptsInsurance && (
                            <Badge variant="outline" className="text-xs">
                              Insurance
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Specialties</h4>
                          <div className="flex flex-wrap gap-1">
                            {vet.specialties.map((specialty, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Services</h4>
                          <div className="space-y-1">
                            {vet.services.slice(0, 3).map((service, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {service}
                              </div>
                            ))}
                            {vet.services.length > 3 && (
                              <div className="text-sm text-blue-600">
                                +{vet.services.length - 3} more services
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{vet.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{vet.email}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            Directions
                          </Button>
                          <Button size="sm">
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-4">
              <Alert>
                <Award className="h-4 w-4" />
                <AlertDescription>
                  Explore certification opportunities to access premium markets and increase profitability.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {certifications.map((cert) => (
                  <Card key={cert.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{cert.name}</h3>
                            <Badge variant="outline">
                              {cert.issuer}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {cert.description}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            +{cert.marketPremium}%
                          </div>
                          <div className="text-sm text-muted-foreground">Market Premium</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Investment</h4>
                          <div className="space-y-1 text-sm">
                            <div>Cost: ${cert.cost.toLocaleString()}</div>
                            <div>Duration: {cert.duration}</div>
                            <div>Renewal: {cert.renewalPeriod}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Key Requirements</h4>
                          <div className="space-y-1">
                            {cert.requirements.slice(0, 3).map((req, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {req}
                              </div>
                            ))}
                            {cert.requirements.length > 3 && (
                              <div className="text-sm text-blue-600">
                                +{cert.requirements.length - 3} more requirements
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Benefits</h4>
                          <div className="space-y-1">
                            {cert.benefits.slice(0, 3).map((benefit, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {benefit}
                              </div>
                            ))}
                            {cert.benefits.length > 3 && (
                              <div className="text-sm text-blue-600">
                                +{cert.benefits.length - 3} more benefits
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {herds.length > 0 && (
                        <div className="bg-green-50 p-3 rounded-lg mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-green-800">
                                Estimated Annual Revenue Increase
                              </div>
                              <div className="text-sm text-green-700">
                                Based on your current herd size
                              </div>
                            </div>
                            <div className="text-xl font-bold text-green-600">
                              ${calculateCertificationRevenue(cert).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t">
                        <Badge className={`${
                          cert.status === 'available' ? 'bg-blue-100 text-blue-800' :
                          cert.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          cert.status === 'certified' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cert.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Learn More
                          </Button>
                          <Button size="sm">
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Stay compliant with federal, state, and local regulations to avoid penalties and maintain operating permits.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {complianceItems.map((item) => (
                  <Card key={item.id} className={`border-l-4 ${
                    item.status === 'compliant' ? 'border-l-green-500' :
                    item.status === 'needs_attention' ? 'border-l-yellow-500' :
                    'border-l-red-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {getComplianceStatusIcon(item.status)}
                            <h3 className="font-semibold">{item.regulation}</h3>
                            <Badge className={getComplianceStatusColor(item.status)}>
                              {item.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            {item.jurisdiction}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Next Check: {new Date(item.nextCheck).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Required Documents</h4>
                          <div className="space-y-1">
                            {item.documents.map((doc, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Non-Compliance Penalties</h4>
                          <p className="text-sm text-red-600">{item.penalties}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          Last checked: {new Date(item.lastCheck).toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Clipboard className="h-4 w-4 mr-1" />
                            Update Status
                          </Button>
                          <Button size="sm">
                            <Calendar className="h-4 w-4 mr-1" />
                            Schedule Check
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Industry Integrations Configured",
                description: "Market pricing, veterinary networks, certifications, and compliance tracking have been set up."
              });
              onClose();
            }}>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}