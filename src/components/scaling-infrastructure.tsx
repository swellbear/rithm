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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Building2, Users, Settings, Crown, Palette, UserPlus,
  Shield, Key, Globe, Database, Cloud, Zap, 
  BarChart3, FileText, Mail, Phone, MapPin,
  CheckCircle, AlertTriangle, Clock, Star,
  Copy, Download, Share2, ExternalLink, DollarSign
} from "lucide-react";

interface ScalingInfrastructureProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FarmClient {
  id: string;
  name: string;
  owner: string;
  location: string;
  acreage: number;
  livestock: number;
  status: 'active' | 'inactive' | 'trial';
  lastActivity: string;
  subscription: 'basic' | 'professional' | 'enterprise';
  revenue: number;
  notes: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'consultant' | 'viewer';
  permissions: string[];
  farmsAccess: string[];
  lastLogin: string;
  status: 'active' | 'invited' | 'inactive';
  specialties: string[];
}

interface WhiteLabelConfig {
  companyName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string;
  features: string[];
  branding: {
    hideCadence: boolean;
    customFooter: string;
    supportEmail: string;
    supportPhone: string;
  };
  pricing: {
    model: 'subscription' | 'license' | 'revenue_share';
    basePrice: number;
    perFarmPrice: number;
    revenueShare: number;
  };
}

export default function ScalingInfrastructure({ isOpen, onClose }: ScalingInfrastructureProps) {
  const [selectedView, setSelectedView] = useState('overview');
  const [farmClients, setFarmClients] = useState<FarmClient[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>({
    companyName: '',
    logo: '',
    primaryColor: '#22c55e',
    secondaryColor: '#16a34a',
    customDomain: '',
    features: [],
    branding: {
      hideCadence: false,
      customFooter: '',
      supportEmail: '',
      supportPhone: ''
    },
    pricing: {
      model: 'subscription',
      basePrice: 199,
      perFarmPrice: 49,
      revenueShare: 20
    }
  });
  const { toast } = useToast();

  // Generate multi-farm client data
  const generateFarmClients = () => {
    const clients: FarmClient[] = [
      {
        id: 'farm-1',
        name: 'Johnson Ranch',
        owner: 'Bill Johnson',
        location: 'Tulsa County, OK',
        acreage: 450,
        livestock: 180,
        status: 'active',
        lastActivity: '2 hours ago',
        subscription: 'professional',
        revenue: 299,
        notes: 'Expanding operations, interested in carbon credit program'
      },
      {
        id: 'farm-2',
        name: 'Green Valley Farms',
        owner: 'Maria Santos',
        location: 'Rogers County, OK',
        acreage: 280,
        livestock: 95,
        status: 'active',
        lastActivity: '1 day ago',
        subscription: 'basic',
        revenue: 99,
        notes: 'New to rotational grazing, needs additional support'
      },
      {
        id: 'farm-3',
        name: 'Heritage Livestock',
        owner: 'David Chen',
        location: 'Creek County, OK',
        acreage: 720,
        livestock: 340,
        status: 'trial',
        lastActivity: '3 days ago',
        subscription: 'enterprise',
        revenue: 0,
        notes: 'Evaluating for multi-location implementation'
      },
      {
        id: 'farm-4',
        name: 'Sunset Pastures',
        owner: 'Jennifer Williams',
        location: 'Osage County, OK',
        acreage: 190,
        livestock: 65,
        status: 'active',
        lastActivity: '5 hours ago',
        subscription: 'professional',
        revenue: 299,
        notes: 'Excellent results, considering expansion to sheep'
      },
      {
        id: 'farm-5',
        name: 'Prairie Wind Ranch',
        owner: 'Robert Taylor',
        location: 'Payne County, OK',
        acreage: 850,
        livestock: 420,
        status: 'inactive',
        lastActivity: '2 weeks ago',
        subscription: 'basic',
        revenue: 99,
        notes: 'Payment issues, needs follow-up call'
      }
    ];

    setFarmClients(clients);
  };

  // Generate team member data
  const generateTeamMembers = () => {
    const members: TeamMember[] = [
      {
        id: 'team-1',
        name: 'Sarah Mitchell',
        email: 'sarah@ranchconsulting.com',
        role: 'owner',
        permissions: ['all'],
        farmsAccess: ['all'],
        lastLogin: '2 hours ago',
        status: 'active',
        specialties: ['Rotational Grazing', 'Pasture Management', 'Business Planning']
      },
      {
        id: 'team-2',
        name: 'Mike Rodriguez',
        email: 'mike@ranchconsulting.com',
        role: 'consultant',
        permissions: ['view_farms', 'edit_assessments', 'create_reports'],
        farmsAccess: ['farm-1', 'farm-2', 'farm-4'],
        lastLogin: '1 day ago',
        status: 'active',
        specialties: ['Animal Nutrition', 'Health Management', 'Performance Analytics']
      },
      {
        id: 'team-3',
        name: 'Emily Johnson',
        email: 'emily@ranchconsulting.com',
        role: 'admin',
        permissions: ['view_farms', 'edit_farms', 'manage_users', 'billing'],
        farmsAccess: ['all'],
        lastLogin: '3 hours ago',
        status: 'active',
        specialties: ['Farm Management', 'Technology Integration', 'Training']
      },
      {
        id: 'team-4',
        name: 'James Wilson',
        email: 'james@newconsultant.com',
        role: 'consultant',
        permissions: ['view_farms', 'edit_assessments'],
        farmsAccess: ['farm-3'],
        lastLogin: 'Never',
        status: 'invited',
        specialties: ['Soil Health', 'Carbon Sequestration', 'Regenerative Agriculture']
      }
    ];

    setTeamMembers(members);
  };

  // Calculate metrics
  const calculateMetrics = () => {
    const activeClients = farmClients.filter(f => f.status === 'active').length;
    const totalRevenue = farmClients.reduce((sum, f) => sum + f.revenue, 0);
    const totalAcreage = farmClients.reduce((sum, f) => sum + f.acreage, 0);
    const totalLivestock = farmClients.reduce((sum, f) => sum + f.livestock, 0);
    const avgRevenuePerFarm = activeClients > 0 ? totalRevenue / activeClients : 0;
    
    return {
      activeClients,
      totalRevenue,
      totalAcreage,
      totalLivestock,
      avgRevenuePerFarm,
      trialClients: farmClients.filter(f => f.status === 'trial').length,
      inactiveClients: farmClients.filter(f => f.status === 'inactive').length
    };
  };

  // Initialize data when component opens
  useEffect(() => {
    if (isOpen) {
      generateFarmClients();
      generateTeamMembers();
    }
  }, [isOpen]);

  const metrics = calculateMetrics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'invited': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'trial': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'inactive': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'invited': return <Mail className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'consultant': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
              Scaling Infrastructure
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="multi-farm" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="multi-farm">Multi-Farm Management</TabsTrigger>
              <TabsTrigger value="collaboration">Team Collaboration</TabsTrigger>
              <TabsTrigger value="white-label">White-Label Platform</TabsTrigger>
            </TabsList>

            <TabsContent value="multi-farm" className="space-y-4">
              <Alert>
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  Manage multiple client farms from a single dashboard with role-based access and consolidated reporting.
                </AlertDescription>
              </Alert>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.activeClients}</div>
                    <div className="text-sm text-muted-foreground">Active Clients</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">${metrics.totalRevenue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{metrics.totalAcreage.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Acres</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{metrics.totalLivestock.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Livestock</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">${Math.round(metrics.avgRevenuePerFarm)}</div>
                    <div className="text-sm text-muted-foreground">Avg/Farm</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{metrics.trialClients}</div>
                    <div className="text-sm text-muted-foreground">Trials</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{metrics.inactiveClients}</div>
                    <div className="text-sm text-muted-foreground">At Risk</div>
                  </CardContent>
                </Card>
              </div>

              {/* Client Management */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Client Farms</h3>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Client
                </Button>
              </div>

              <div className="space-y-3">
                {farmClients.map((farm) => (
                  <Card key={farm.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(farm.status)}
                            <h4 className="font-semibold">{farm.name}</h4>
                            <Badge className={getStatusColor(farm.status)}>
                              {farm.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {farm.subscription}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Owner:</span>
                              <div className="font-medium">{farm.owner}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <div className="font-medium">{farm.location}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Size:</span>
                              <div className="font-medium">{farm.acreage} acres • {farm.livestock} head</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Revenue:</span>
                              <div className="font-medium text-green-600">${farm.revenue}/month</div>
                            </div>
                          </div>
                          
                          {farm.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong>Notes:</strong> {farm.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-1" />
                            Reports
                          </Button>
                          <Button size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
                        <span>Last activity: {farm.lastActivity}</span>
                        <div className="flex items-center gap-4">
                          <span>Performance: Good</span>
                          <span>Health: 94%</span>
                          <span>Compliance: ✓</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="collaboration" className="space-y-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Enable team collaboration with role-based permissions and farm-specific access controls.
                </AlertDescription>
              </Alert>

              {/* Team Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
                    <div className="text-sm text-muted-foreground">Team Members</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {teamMembers.filter(m => m.status === 'active').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {teamMembers.filter(m => m.status === 'invited').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending Invites</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {teamMembers.filter(m => m.role === 'consultant').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Consultants</div>
                  </CardContent>
                </Card>
              </div>

              {/* Team Member Management */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(member.status)}
                            <h4 className="font-semibold">{member.name}</h4>
                            <Badge className={getRoleColor(member.role)}>
                              {member.role.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(member.status)}>
                              {member.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <div className="font-medium">{member.email}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Farm Access:</span>
                              <div className="font-medium">
                                {member.farmsAccess.includes('all') ? 'All Farms' : `${member.farmsAccess.length} farms`}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Login:</span>
                              <div className="font-medium">{member.lastLogin}</div>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <span className="text-muted-foreground text-sm">Specialties:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.specialties.map((specialty, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-muted-foreground text-sm">Permissions:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.permissions.map((permission, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {permission.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Permissions
                          </Button>
                          <Button size="sm">
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Permission Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Permission Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-3">
                      <h4 className="font-medium mb-2">Farm Owner</h4>
                      <p className="text-sm text-muted-foreground mb-2">Full access to all features</p>
                      <div className="text-xs text-green-600">All permissions</div>
                    </Card>
                    <Card className="p-3">
                      <h4 className="font-medium mb-2">Consultant</h4>
                      <p className="text-sm text-muted-foreground mb-2">Assessment and planning tools</p>
                      <div className="text-xs text-blue-600">Limited to assigned farms</div>
                    </Card>
                    <Card className="p-3">
                      <h4 className="font-medium mb-2">Veterinarian</h4>
                      <p className="text-sm text-muted-foreground mb-2">Health and breeding focus</p>
                      <div className="text-xs text-purple-600">Health data access only</div>
                    </Card>
                    <Card className="p-3">
                      <h4 className="font-medium mb-2">Viewer</h4>
                      <p className="text-sm text-muted-foreground mb-2">Read-only access</p>
                      <div className="text-xs text-gray-600">No editing permissions</div>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="white-label" className="space-y-4">
              <Alert>
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  Create your own branded platform with custom styling, domain, and pricing structure.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Branding Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Branding & Styling
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input 
                        id="company-name"
                        value={whiteLabelConfig.companyName}
                        onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Your Company Name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="custom-domain">Custom Domain</Label>
                      <Input 
                        id="custom-domain"
                        value={whiteLabelConfig.customDomain}
                        onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                        placeholder="app.yourcompany.com"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="primary-color"
                            type="color"
                            value={whiteLabelConfig.primaryColor}
                            onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-16"
                          />
                          <Input 
                            value={whiteLabelConfig.primaryColor}
                            onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="secondary-color">Secondary Color</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="secondary-color"
                            type="color"
                            value={whiteLabelConfig.secondaryColor}
                            onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-16"
                          />
                          <Input 
                            value={whiteLabelConfig.secondaryColor}
                            onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="hide-cadence">Hide Cadence Branding</Label>
                        <Switch
                          id="hide-cadence"
                          checked={whiteLabelConfig.branding.hideCadence}
                          onCheckedChange={(checked) => setWhiteLabelConfig(prev => ({
                            ...prev,
                            branding: { ...prev.branding, hideCadence: checked }
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="support-email">Support Email</Label>
                        <Input 
                          id="support-email"
                          type="email"
                          value={whiteLabelConfig.branding.supportEmail}
                          onChange={(e) => setWhiteLabelConfig(prev => ({
                            ...prev,
                            branding: { ...prev.branding, supportEmail: e.target.value }
                          }))}
                          placeholder="support@yourcompany.com"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="support-phone">Support Phone</Label>
                        <Input 
                          id="support-phone"
                          value={whiteLabelConfig.branding.supportPhone}
                          onChange={(e) => setWhiteLabelConfig(prev => ({
                            ...prev,
                            branding: { ...prev.branding, supportPhone: e.target.value }
                          }))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Model
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="pricing-model">Business Model</Label>
                      <Select 
                        value={whiteLabelConfig.pricing.model} 
                        onValueChange={(value: any) => setWhiteLabelConfig(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, model: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="subscription">Monthly Subscription</SelectItem>
                          <SelectItem value="license">Annual License</SelectItem>
                          <SelectItem value="revenue_share">Revenue Share</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {whiteLabelConfig.pricing.model === 'subscription' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="base-price">Base Price ($/month)</Label>
                          <Input 
                            id="base-price"
                            type="number"
                            value={whiteLabelConfig.pricing.basePrice}
                            onChange={(e) => setWhiteLabelConfig(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, basePrice: parseInt(e.target.value) }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="per-farm-price">Per Farm ($/month)</Label>
                          <Input 
                            id="per-farm-price"
                            type="number"
                            value={whiteLabelConfig.pricing.perFarmPrice}
                            onChange={(e) => setWhiteLabelConfig(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, perFarmPrice: parseInt(e.target.value) }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                    
                    {whiteLabelConfig.pricing.model === 'revenue_share' && (
                      <div>
                        <Label htmlFor="revenue-share">Revenue Share (%)</Label>
                        <Input 
                          id="revenue-share"
                          type="number"
                          value={whiteLabelConfig.pricing.revenueShare}
                          onChange={(e) => setWhiteLabelConfig(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, revenueShare: parseInt(e.target.value) }
                          }))}
                        />
                      </div>
                    )}
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Projected Monthly Revenue</h4>
                      <div className="text-2xl font-bold text-green-600">
                        ${(whiteLabelConfig.pricing.basePrice + (whiteLabelConfig.pricing.perFarmPrice * metrics.activeClients)).toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">
                        Based on {metrics.activeClients} active clients
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feature Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feature Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      'Multi-Farm Management',
                      'Team Collaboration',
                      'Advanced Analytics',
                      'API Access',
                      'White-Label Branding',
                      'Custom Integrations',
                      'Priority Support',
                      'Training & Onboarding',
                      'Custom Reports',
                      'Mobile Apps',
                      'Third-party Integrations',
                      'Advanced Security'
                    ].map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox 
                          id={feature}
                          checked={whiteLabelConfig.features.includes(feature)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setWhiteLabelConfig(prev => ({
                                ...prev,
                                features: [...prev.features, feature]
                              }));
                            } else {
                              setWhiteLabelConfig(prev => ({
                                ...prev,
                                features: prev.features.filter(f => f !== feature)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={feature} className="text-sm">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Implementation Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Branding Setup</h4>
                        <p className="text-sm text-muted-foreground">1-2 weeks: Custom styling, domain configuration, logo integration</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Feature Configuration</h4>
                        <p className="text-sm text-muted-foreground">2-3 weeks: Enable selected features, configure permissions, test workflows</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Training & Launch</h4>
                        <p className="text-sm text-muted-foreground">1-2 weeks: Team training, client onboarding, go-live support</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Scaling Infrastructure Configured",
                description: "Multi-farm management, team collaboration, and white-label platform settings have been saved."
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