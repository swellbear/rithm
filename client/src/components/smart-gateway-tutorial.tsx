import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, HelpCircle, Target, Users, Calendar, Cloud, FileText, TrendingUp } from 'lucide-react';

interface TutorialStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ElementType;
  whyItMatters: string;
  expectedOutcome: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'intro',
    target: 'smart-gateway-container',
    title: 'Welcome to Smart Gateway',
    content: 'Cadence uses an intelligent task-based system that adapts to your farm\'s needs. Let\'s explore how it works.',
    position: 'bottom',
    icon: Target,
    whyItMatters: 'Traditional farm tools are overwhelming. Smart Gateway gives you exactly what you need, when you need it.',
    expectedOutcome: 'Complete tasks 50% faster with personalized recommendations'
  },
  {
    id: 'check-animals',
    target: 'check-animals-button',
    title: 'Livestock Management',
    content: 'Start your day by checking on your livestock. This intelligent workflow adapts based on weather, health alerts, and breeding schedules.',
    position: 'right',
    icon: Users,
    whyItMatters: 'Catching health issues early saves $200-500 per animal in treatment costs.',
    expectedOutcome: 'Reduce livestock mortality by 30% with proactive monitoring'
  },
  {
    id: 'walk-pastures',
    target: 'walk-pastures-button',
    title: 'Paddock Management',
    content: 'Comprehensive paddock management including assessment, mapping, and planning. The system guides you through scientific methods for accurate data.',
    position: 'right',
    icon: Target,
    whyItMatters: 'Proper paddock management prevents overgrazing and increases carrying capacity by 25%.',
    expectedOutcome: 'Extend grazing season by 2-4 weeks with better paddock management'
  },
  {
    id: 'plan-rotation',
    target: 'plan-rotation-button',
    title: 'Plan Rotation',
    content: 'Get AI-powered rotation recommendations based on pasture recovery, weather forecasts, and livestock needs.',
    position: 'left',
    icon: Calendar,
    whyItMatters: 'Optimized rotation increases pasture productivity by 40% and reduces feed costs.',
    expectedOutcome: 'Save $50-100 per animal annually on supplemental feed'
  },
  {
    id: 'check-weather',
    target: 'check-weather-button',
    title: 'Check Weather',
    content: 'View agricultural-specific weather insights including heat stress warnings and grazing condition forecasts.',
    position: 'left',
    icon: Cloud,
    whyItMatters: 'Weather-aware decisions prevent 80% of heat stress incidents.',
    expectedOutcome: 'Maintain optimal animal performance in all conditions'
  },
  {
    id: 'adaptive-intelligence',
    target: 'smart-gateway-container',
    title: 'Adaptive Intelligence',
    content: 'As you complete tasks, the system learns and suggests next steps. Your experience level and farm size determine complexity.',
    position: 'top',
    icon: TrendingUp,
    whyItMatters: 'No more information overload - get recommendations matched to your expertise.',
    expectedOutcome: 'Progress from beginner to expert with guided learning paths'
  }
];

interface SmartGatewayTutorialProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export function SmartGatewayTutorial({ onComplete, forceShow = false }: SmartGatewayTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('cadence-smart-gateway-tutorial-completed');
    if (!hasSeenTutorial || forceShow) {
      setIsVisible(true);
    }
  }, [forceShow]);

  useEffect(() => {
    if (isVisible && tutorialSteps[currentStep]) {
      const targetElement = document.getElementById(tutorialSteps[currentStep].target);
      if (targetElement) {
        setHighlightPosition(targetElement.getBoundingClientRect());
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('cadence-smart-gateway-tutorial-completed', 'true');
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <>
      {/* Backdrop with highlight */}
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={handleSkip} />
        
        {/* Highlight box */}
        {highlightPosition && (
          <div
            className="absolute border-4 border-green-500 rounded-lg pointer-events-none animate-pulse"
            style={{
              left: highlightPosition.left - 8,
              top: highlightPosition.top - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16,
            }}
          />
        )}

        {/* Tutorial card */}
        <Card className={`absolute z-50 p-4 sm:p-6 max-w-[90vw] sm:max-w-md shadow-2xl ${
          step.position === 'top' ? 'bottom-20 sm:bottom-24' :
          step.position === 'bottom' ? 'top-20 sm:top-24' :
          step.position === 'left' ? 'right-4 sm:right-8' : 'left-4 sm:left-8'
        } ${
          step.position === 'left' || step.position === 'right' ? 'top-1/2 -translate-y-1/2' : 'left-1/2 -translate-x-1/2'
        }`}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleSkip}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-start space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base sm:text-lg">{step.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{step.content}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
            <div className="flex items-start space-x-2">
              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-blue-900">Why this matters:</p>
                <p className="text-xs sm:text-sm text-blue-700">{step.whyItMatters}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-medium text-green-900">Expected outcome:</p>
            <p className="text-xs sm:text-sm text-green-700">{step.expectedOutcome}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <Button
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
                onClick={handleNext}
              >
                {currentStep === tutorialSteps.length - 1 ? 'Complete' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}