import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, TrendingUp, Shield, Users } from "lucide-react";

interface UpgradeValuePropositionProps {
  currentTier: 'basic' | 'small_farm' | 'professional' | 'enterprise';
  lockedFeature?: string;
  context?: 'calculation' | 'analysis' | 'integration' | 'automation';
}

export function UpgradeValueProposition({ 
  currentTier, 
  lockedFeature, 
  context = 'calculation' 
}: UpgradeValuePropositionProps) {
  const getUpgradeValue = () => {
    if (currentTier === 'basic') {
      return {
        targetTier: 'Small Farm Plan',
        monthlyPrice: '$29',
        annualSavings: '$87',
        keyBenefits: [
          "Individual livestock tracking & health records",
          "Advanced nutritional analysis with deficit calculations", 
          "Smart workflow automation & data integration",
          "Weather-integrated planning with alerts",
          "Export data to spreadsheets & farm management software"
        ],
        valueProposition: "Transform from basic tracking to professional farm management",
        roi: "Average users see 20-30% improvement in efficiency"
      };
    }
    
    if (currentTier === 'small_farm') {
      return {
        targetTier: 'Professional Plan',
        monthlyPrice: '$79',
        annualSavings: '$237',
        keyBenefits: [
          "AI-powered insights & predictive recommendations",
          "Advanced performance analytics with benchmarking",
          "Automated rotation optimization & scheduling",
          "Complete integration with farm management systems",
          "Priority support & consultation calls"
        ],
        valueProposition: "Scale to advanced automation and AI-driven insights",
        roi: "Professional users report $2,500-$15,000 annual improvements"
      };
    }

    return {
      targetTier: 'Enterprise Plan',
      monthlyPrice: '$199',
      annualSavings: '$597',
      keyBenefits: [
        "Multi-farm management & team collaboration",
        "Advanced AI optimization & predictive modeling",
        "Complete supply chain integration & market analysis", 
        "Custom reports & white-label capabilities",
        "Dedicated account manager & priority support"
      ],
      valueProposition: "Enterprise-grade tools for scaling operations",
      roi: "Enterprise clients average $50,000+ annual improvements"
    };
  };

  const upgrade = getUpgradeValue();

  const getContextualMessage = () => {
    switch (context) {
      case 'calculation':
        return `Unlock advanced ${lockedFeature || 'calculations'} with automatic data integration`;
      case 'analysis': 
        return `Get detailed ${lockedFeature || 'analytics'} with AI-powered recommendations`;
      case 'integration':
        return `Enable seamless ${lockedFeature || 'data flow'} across all farm management tools`;
      case 'automation':
        return `Activate smart ${lockedFeature || 'automation'} for hands-free farm optimization`;
      default:
        return `Unlock ${lockedFeature || 'advanced features'} with professional tools`;
    }
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Upgrade to {upgrade.targetTier}</CardTitle>
              <CardDescription>
                {getContextualMessage()}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {upgrade.roi}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-900/60 rounded-lg">
          <div>
            <div className="text-2xl font-bold text-green-600">{upgrade.monthlyPrice}/month</div>
            <div className="text-sm text-muted-foreground">
              Save {upgrade.annualSavings} with annual billing
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600">30-day free trial</div>
            <div className="text-xs text-muted-foreground">Cancel anytime</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            What You'll Get:
          </h4>
          <div className="space-y-2">
            {upgrade.keyBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">{upgrade.valueProposition}</span>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            <Zap className="h-4 w-4 mr-2" />
            Start Free Trial
          </Button>
          <Button variant="outline" size="sm">
            Compare Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}