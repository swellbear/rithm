import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, MapPin, Bell, Camera, HelpCircle, Shield, Download, Loader2, Trash2, Upload, Database, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

export default function Settings() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState("high");
  const [showDailyWidget, setShowDailyWidget] = useState(() => {
    const dismissed = localStorage.getItem('cadence-dailyWorkflow-dismissed');
    console.log('Daily widget localStorage value:', dismissed);
    return dismissed !== 'true';
  });
  
  // Profile form states
  const [farmName, setFarmName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [farmSize, setFarmSize] = useState("");
  
  // Account deletion states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Subscription update mutation
  const subscriptionUpdateMutation = useMutation({
    mutationFn: async (subscriptionTier: string) => {
      return await apiRequest("PUT", "/api/auth/subscription", { 
        subscriptionTier,
        farmTier: "basic", // Keep farm tier as basic for development
        billingCycle: "monthly" 
      });
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated",
        description: "Your subscription tier has been updated for testing.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update subscription tier.",
        variant: "destructive",
      });
    },
  });

  const updateSubscriptionTier = (tier: string) => {
    subscriptionUpdateMutation.mutate(tier);
  };

  // Helper function to determine user's tier
  const getUserTier = () => {
    if (!user?.subscriptionTier) return "basic";
    return user.subscriptionTier;
  };

  const isBasicTier = getUserTier() === "basic" || getUserTier() === "free";
  const isSmallBusinessPlus = ["small_farm", "professional", "enterprise"].includes(getUserTier());
  const isEnterprise = getUserTier() === "enterprise";

  // Update form states when user data changes
  useEffect(() => {
    if (user) {
      setFarmName((user as any)?.farmName || "");
      setZipCode((user as any)?.zipCode || "");
      setFarmSize((user as any)?.farmSizeAcres ? String((user as any).farmSizeAcres) : "");
    }
  }, [user]);

  // Profile update mutation
  const profileUpdateMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest("PUT", "/api/auth/profile", profileData);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); // Refresh user data to show updated information
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = () => {
    const profileData: any = {};
    if (farmName !== (user as any)?.farmName) profileData.farmName = farmName;
    if (zipCode !== (user as any)?.zipCode) profileData.zipCode = zipCode;
    if (farmSize !== (user as any)?.farmSizeAcres) profileData.farmSizeAcres = Number(farmSize) || undefined;
    
    if (Object.keys(profileData).length > 0) {
      profileUpdateMutation.mutate(profileData);
    } else {
      toast({
        title: "No Changes",
        description: "No changes detected to save.",
      });
    }
  };

  // Account deletion mutation
  const accountDeleteMutation = useMutation({
    mutationFn: async (password: string) => {
      return await apiRequest("DELETE", "/api/auth/account", { password });
    },
    onSuccess: () => {
      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      
      // Logout and redirect
      setTimeout(() => {
        logout();
        window.location.href = '/auth';
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    if (!deletePassword.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    
    accountDeleteMutation.mutate(deletePassword);
  };

  return (
    <div className="min-h-full p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Configure your grazing assessment preferences</p>
      </div>

      {/* Development Subscription Controls */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Development: Subscription Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-blue-700 bg-blue-100 rounded p-3">
            <p className="font-medium mb-2">Testing Environment</p>
            <p>Use these controls to test different subscription tiers and their features. Changes are immediate and persist across sessions.</p>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Tier</Label>
              <p className="text-lg font-semibold text-blue-800 capitalize">
                {user?.subscriptionTier || 'basic'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button 
                variant={user?.subscriptionTier === 'basic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSubscriptionTier('basic')}
                disabled={subscriptionUpdateMutation.isPending}
              >
                Basic
              </Button>
              <Button 
                variant={user?.subscriptionTier === 'small_farm' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSubscriptionTier('small_farm')}
                disabled={subscriptionUpdateMutation.isPending}
              >
                Small Farm
              </Button>
              <Button 
                variant={user?.subscriptionTier === 'professional' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSubscriptionTier('professional')}
                disabled={subscriptionUpdateMutation.isPending}
              >
                Professional
              </Button>
              <Button 
                variant={user?.subscriptionTier === 'enterprise' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSubscriptionTier('enterprise')}
                disabled={subscriptionUpdateMutation.isPending}
              >
                Enterprise
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Farm Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farm-name">Farm Name</Label>
              <Input
                id="farm-name"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Enter your farm name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip-code">Zip Code</Label>
              <Input
                id="zip-code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="12345"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="farm-size">Farm Size (acres)</Label>
            <Input
              id="farm-size"
              type="number"
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
              placeholder="100"
            />
          </div>
          <Button 
            onClick={handleUpdateProfile}
            disabled={profileUpdateMutation.isPending}
            className="w-full sm:w-auto"
          >
            {profileUpdateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Profile"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Location & GPS Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & GPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gps-accuracy">GPS Accuracy</Label>
            <Select value={gpsAccuracy} onValueChange={setGpsAccuracy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Accuracy (uses more battery)</SelectItem>
                <SelectItem value="balanced">Balanced (recommended)</SelectItem>
                <SelectItem value="low">Low Power (less accurate)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Enterprise GPS Features */}
          {isEnterprise ? (
            <div className="space-y-3 pt-4 border-t">
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">🚀 Enterprise GPS Features</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>RTK/CORS corrections for sub-meter accuracy</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>IoT sensor integration</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Precision agriculture integration</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Advanced GPS features available with Enterprise plan:
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• RTK/CORS corrections for professional accuracy</li>
                <li>• IoT sensor integration</li>
                <li>• Precision agriculture tools</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => updateSubscriptionTier('enterprise')}>
                Upgrade to Enterprise
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic notifications for all tiers */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-gray-500">Get notified about important farm activities</p>
            </div>
            <Button
              variant={notifications ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications(!notifications)}
            >
              {notifications ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {/* Advanced notifications for Small Business+ */}
          {isSmallBusinessPlus ? (
            <div className="space-y-3 pt-4 border-t">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">📱 Advanced Alert System</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>Predictive alerts (3-day advance warnings)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span>Weather-based plan adjustments</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Individual animal health alerts</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Breeding and pregnancy notifications</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Advanced notifications available with Small Business+ plans:
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Predictive alerts and early warnings</li>
                <li>• Individual animal health notifications</li>
                <li>• Breeding and pregnancy tracking alerts</li>
                <li>• Weather-based automatic adjustments</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => updateSubscriptionTier('small_farm')}>
                Upgrade to Small Business
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data & Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data & Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic backup for all tiers */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Backup</Label>
              <p className="text-sm text-gray-500">Automatically backup your farm data</p>
            </div>
            <Button
              variant={autoBackup ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoBackup(!autoBackup)}
            >
              {autoBackup ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {/* Data import/export for Small Business+ */}
          {isSmallBusinessPlus ? (
            <div className="space-y-3 pt-4 border-t">
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">📊 Data Management</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Farm Data (CSV/JSON)
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data from File
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Sync with QuickBooks
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Advanced data features available with Small Business+ plans:
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• CSV/JSON data export for external analysis</li>
                <li>• Data import from spreadsheets</li>
                <li>• QuickBooks integration</li>
                <li>• Automated data synchronization</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => updateSubscriptionTier('small_farm')}>
                Upgrade for Data Export
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Workflow Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Daily Workflow Widget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Widget</Label>
              <p className="text-sm text-gray-500">Display daily farm task guidance and progress tracking</p>
            </div>
            <Button
              variant={showDailyWidget ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const newValue = !showDailyWidget;
                console.log('Toggling daily widget:', { from: showDailyWidget, to: newValue });
                setShowDailyWidget(newValue);
                localStorage.setItem('cadence-dailyWorkflow-dismissed', (!newValue).toString());
                console.log('Set localStorage to:', (!newValue).toString());
                window.dispatchEvent(new CustomEvent('daily-workflow-widget-toggle'));
              }}
            >
              {showDailyWidget ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Management - Small Business+ Only */}
      {isSmallBusinessPlus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                👥 Team Access ({isEnterprise ? "Unlimited" : "Up to 3 users"})
              </h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
                {isEnterprise && (
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Role-Based Access Control
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Contact Support
          </Button>
          <Button variant="outline" className="w-full justify-start">
            View Documentation
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Report Bug
          </Button>
          
          {/* Tier-specific support levels */}
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 mb-2">Support Level:</p>
            {isEnterprise ? (
              <div className="p-2 bg-purple-50 rounded text-xs text-purple-700">
                🚀 Enterprise: 24/7 phone support + dedicated account manager
              </div>
            ) : isSmallBusinessPlus ? (
              <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                💼 Small Business: Priority email + chat support
              </div>
            ) : (
              <div className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                🌱 Basic: Community support + documentation
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Account Deletion</DialogTitle>
                  <DialogDescription>
                    This will permanently delete your account and all farm data. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Enter your password to confirm</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Password"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeletePassword("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={accountDeleteMutation.isPending || !deletePassword.trim()}
                  >
                    {accountDeleteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}