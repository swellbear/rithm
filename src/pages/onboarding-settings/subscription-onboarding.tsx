import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PricingTiers from "@/components/pricing-tiers";
import { 
  CreditCard, Shield, Users, Calendar, 
  Loader2, ChevronRight, Home, Building2, Factory
} from "lucide-react";

type FarmTier = "basic" | "small_business" | "enterprise";
type SubscriptionTier = "free" | "small_farm" | "professional" | "enterprise";

export default function SubscriptionOnboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [farmTier, setFarmTier] = useState<FarmTier>("basic");
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("free");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [showYearlyPricing, setShowYearlyPricing] = useState(false);

  // Farm tier options
  const farmTiers = [
    {
      value: "basic" as FarmTier,
      title: "Basic/Homesteader",
      description: "Perfect for hobby farms and homesteads",
      features: ["Simple workflows", "Essential tools", "Mobile-first design"],
      icon: Home,
      typical: "1-50 acres, 1-50 animals"
    },
    {
      value: "small_business" as FarmTier,
      title: "Small Business",
      description: "For working farms and growing operations",
      features: ["Enhanced features", "Business tools", "Performance tracking"],
      icon: Building2,
      typical: "50-500 acres, 50-500 animals"
    },
    {
      value: "enterprise" as FarmTier,
      title: "Enterprise",
      description: "Large-scale commercial operations",
      features: ["Full feature suite", "Team collaboration", "API access"],
      icon: Factory,
      typical: "500+ acres, 500+ animals"
    }
  ];

  const updateTierMutation = useMutation({
    mutationFn: async (data: { farmTier: FarmTier; subscriptionTier: SubscriptionTier; billingCycle: "monthly" | "annual" }) => {
      return await apiRequest("PUT", "/api/auth/subscription", data);
    },
    onSuccess: async () => {
      toast({
        title: "Setup complete!",
        description: "Your farm tier and subscription have been configured.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    updateTierMutation.mutate({ farmTier, subscriptionTier, billingCycle });
  };

  const steps = [
    {
      title: "Choose Your Farm Type",
      description: "This helps us customize your experience"
    },
    {
      title: "Select Your Plan",
      description: "Choose the subscription that fits your needs"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= index 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}
                `}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-full mx-2 ${
                    currentStep > index ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Step content */}
        {currentStep === 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {farmTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card 
                  key={tier.value}
                  className={`cursor-pointer transition-all ${
                    farmTier === tier.value 
                      ? 'ring-2 ring-green-600 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setFarmTier(tier.value)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="h-8 w-8 text-green-600" />
                      {farmTier === tier.value && (
                        <Badge className="bg-green-600 text-white">Selected</Badge>
                      )}
                    </div>
                    <CardTitle>{tier.title}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {tier.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 border-t pt-2">
                      <strong>Typical size:</strong> {tier.typical}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {currentStep === 1 && (
          <div>
            {/* Billing cycle toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={!showYearlyPricing ? "font-semibold" : ""}>Monthly</span>
              <Switch
                checked={showYearlyPricing}
                onCheckedChange={(checked) => {
                  setShowYearlyPricing(checked);
                  setBillingCycle(checked ? "annual" : "monthly");
                }}
              />
              <span className={showYearlyPricing ? "font-semibold" : ""}>
                Annual <Badge variant="secondary" className="ml-2">Save up to 17%</Badge>
              </span>
            </div>

            {/* Pricing tiers */}
            <PricingTiers 
              currentTier={subscriptionTier}
              onSelectTier={(tier) => setSubscriptionTier(tier as SubscriptionTier)}
              showYearlyPricing={showYearlyPricing}
            />

            {/* Security and features info */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold mb-1">Secure Payment</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Powered by Stripe with bank-level security
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold mb-1">Cancel Anytime</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No long-term contracts or commitments
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold mb-1">Upgrade Anytime</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scale up as your farm grows
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={updateTierMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateTierMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}