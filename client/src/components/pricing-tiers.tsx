import { Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingTier {
  name: string;
  displayName: string;
  price: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    paddocks: number | null;
    animals: number | null;
    teamMembers: number | null;
    dataRetention: number | null;
  };
  supportLevel: string;
  recommended?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "free",
    displayName: "Basic/Homesteader",
    price: 0,
    yearlyPrice: 0,
    features: [
      "Core tools (GPS, grazing calendar)",
      "Up to 5 paddocks",
      "Up to 50 animals",
      "30-day data retention",
      "Community support"
    ],
    limits: {
      paddocks: 5,
      animals: 50,
      teamMembers: 1,
      dataRetention: 30
    },
    supportLevel: "Community forums"
  },
  {
    name: "small_farm",
    displayName: "Small Farm",
    price: 29,
    yearlyPrice: 290,
    features: [
      "All tools unlocked",
      "Up to 25 paddocks",
      "Up to 500 animals",
      "1-year data retention",
      "Email support",
      "CSV exports",
      "Weather integration",
      "3 team members"
    ],
    limits: {
      paddocks: 25,
      animals: 500,
      teamMembers: 3,
      dataRetention: 365
    },
    supportLevel: "Email support",
    recommended: true
  },
  {
    name: "professional",
    displayName: "Professional",
    price: 79,
    yearlyPrice: 790,
    features: [
      "Unlimited paddocks & animals",
      "Priority support",
      "API access",
      "Custom reports",
      "5 team members",
      "3-year data retention",
      "Advanced analytics",
      "Integration support"
    ],
    limits: {
      paddocks: null,
      animals: null,
      teamMembers: 5,
      dataRetention: 1095
    },
    supportLevel: "Priority support"
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    price: 0, // Custom pricing
    yearlyPrice: 0,
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "White-label options",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantees",
      "Training included",
      "Custom features"
    ],
    limits: {
      paddocks: null,
      animals: null,
      teamMembers: null,
      dataRetention: null
    },
    supportLevel: "Dedicated support team"
  }
];

interface PricingTiersProps {
  currentTier?: string;
  onSelectTier?: (tier: string) => void;
  showYearlyPricing?: boolean;
}

export default function PricingTiers({ currentTier, onSelectTier, showYearlyPricing = false }: PricingTiersProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {pricingTiers.map((tier) => (
        <Card 
          key={tier.name} 
          className={`relative ${tier.recommended ? 'border-green-600 shadow-lg' : ''} ${currentTier === tier.name ? 'ring-2 ring-green-600' : ''}`}
        >
          {tier.recommended && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-green-600 text-white">Most Popular</Badge>
            </div>
          )}
          
          <CardHeader>
            <CardTitle className="text-xl">{tier.displayName}</CardTitle>
            <CardDescription>
              {tier.name === "enterprise" ? (
                <span className="text-2xl font-bold">Custom</span>
              ) : (
                <div>
                  <span className="text-3xl font-bold">
                    ${showYearlyPricing ? tier.yearlyPrice : tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-gray-600">
                      /{showYearlyPricing ? 'year' : 'month'}
                    </span>
                  )}
                  {showYearlyPricing && tier.price > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      Save ${tier.price * 12 - tier.yearlyPrice}/year
                    </div>
                  )}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 text-sm text-gray-600">
              <div className="font-medium mb-1">Support:</div>
              <div>{tier.supportLevel}</div>
            </div>
          </CardContent>
          
          <CardFooter>
            {onSelectTier && (
              <Button 
                className={`w-full ${tier.recommended ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => onSelectTier(tier.name)}
                variant={tier.recommended ? "default" : "outline"}
                disabled={currentTier === tier.name}
              >
                {currentTier === tier.name ? 'Current Plan' : 
                 tier.name === "enterprise" ? 'Contact Sales' : 'Select Plan'}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}