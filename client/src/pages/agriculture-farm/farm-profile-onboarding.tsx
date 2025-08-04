import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import IntentBasedOnboarding from "@/components/intent-based-onboarding";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function FarmProfileOnboarding() {
  const [isOpen, setIsOpen] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem('onboarding_completed', 'true');
    // Redirect to home page
    setLocation('/');
  };

  const handleClose = () => {
    // Allow closing but don't mark as complete
    setLocation('/');
  };

  const handleDeveloperSkip = async () => {
    try {
      // Mark onboarding as complete in backend
      await apiRequest('POST', '/api/onboarding/complete');
      
      // Set local storage
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('cadence-onboardingCompleted', 'true');
      
      // Invalidate auth query to refresh user status
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Onboarding Skipped",
        description: "Developer mode: You can now access all features",
      });
      
      // Navigate to home
      setLocation('/');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      // Even if backend fails, let developer through
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('cadence-onboardingCompleted', 'true');
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-surface relative">
      <IntentBasedOnboarding 
        isOpen={isOpen}
        onClose={handleClose}
        onComplete={handleComplete}
      />
      
      {/* Developer Skip Button - More visible on mobile */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          onClick={handleDeveloperSkip}
          variant="default"
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl"
        >
          Skip Setup →
        </Button>
      </div>
    </div>
  );
}