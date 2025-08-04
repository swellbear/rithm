import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, ArrowRight, ArrowLeft } from "lucide-react";
import { useDemoMode } from "@/hooks/useOptimizedStorage";

interface DemoTip {
  id: string;
  page: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'center';
  persistent?: boolean;
}

interface DemoTipsProps {
  currentPage: string;
}

export default function DemoTips({ currentPage }: DemoTipsProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Check if demo mode is active
  const [isDemoMode] = useDemoMode();
  
  const tips: DemoTip[] = [
    {
      id: 'home-overview',
      page: 'home',
      title: 'Welcome to Demo Mode!',
      content: 'You\'re viewing Cadence with realistic sample data. All features are fully functional - try adding assessments, moving herds, or exploring the calendar. You can switch to your own farm data anytime in Settings.',
      position: 'top',
      persistent: true
    },
    {
      id: 'paddocks-assessment',
      page: 'paddocks',
      title: 'Try Paddock Assessments',
      content: 'Click "Assess DM" on any paddock to see how Cadence calculates dry matter availability and generates feeding recommendations. The demo includes realistic grass conditions and livestock needs.',
      position: 'center'
    },
    {
      id: 'paddocks-rotation',
      page: 'paddocks',
      title: 'Rotation Order Management',
      content: 'Notice the numbered rotation order (1, 2, 3...) - this helps plan your grazing sequence. In demo mode, "North Pasture" is currently active. Try the map view to see paddock layout.',
      position: 'top'
    },
    {
      id: 'animals-tracking',
      page: 'animals',
      title: 'Individual Livestock Tracking',
      content: 'Demo mode includes detailed animal records with health data, breeding status, and weight tracking. This helps optimize grazing decisions based on specific livestock needs.',
      position: 'center'
    },
    {
      id: 'dashboard-analytics',
      page: 'dashboard',
      title: 'Performance Analytics',
      content: 'View realistic performance metrics and trends. The demo includes historical data showing how rotational grazing improves pasture health and livestock performance over time.',
      position: 'top'
    },
    {
      id: 'daily-needs-calculations',
      page: 'daily-needs',
      title: 'Automated Calculations',
      content: 'Cadence automatically calculates water needs, feed requirements, and brush hog recommendations based on your livestock and paddock data. All calculations use scientifically-backed formulas.',
      position: 'center'
    },
    {
      id: 'calendar-planning',
      page: 'calendar',
      title: 'Grazing Calendar',
      content: 'Plan your rotations with visual calendar planning. Demo data shows optimal move dates, rest periods, and seasonal adjustments for your climate zone.',
      position: 'top'
    },
    {
      id: 'settings-demo-control',
      page: 'settings',
      title: 'Demo Mode Controls',
      content: 'Use the Demo Mode toggle to switch between sample data and your own farm information. Demo data is completely separate from your real farm data.',
      position: 'center'
    }
  ];

  const pageTips = tips.filter(tip => tip.page === currentPage);
  
  useEffect(() => {
    // Reset tip index when page changes
    setCurrentTipIndex(0);
    setIsDismissed(false);
  }, [currentPage]);

  useEffect(() => {
    // Auto-dismiss tips after 30 seconds unless persistent
    if (!pageTips[currentTipIndex]?.persistent) {
      const timer = setTimeout(() => {
        if (currentTipIndex < pageTips.length - 1) {
          setCurrentTipIndex(prev => prev + 1);
        } else {
          setIsDismissed(true);
        }
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [currentTipIndex, pageTips]);

  if (!isDemoMode || isDismissed || pageTips.length === 0) {
    return null;
  }

  const currentTip = pageTips[currentTipIndex];
  if (!currentTip) return null;

  const positionClasses = {
    top: 'top-20 left-4 right-4',
    bottom: 'bottom-24 left-4 right-4',
    center: 'top-1/2 left-4 right-4 transform -translate-y-1/2'
  };

  return (
    <div className={`fixed ${positionClasses[currentTip.position]} z-50 pointer-events-none`}>
      <Card className="border-2 border-yellow-400 bg-yellow-50 shadow-lg pointer-events-auto animate-in slide-in-from-top-2 duration-300">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-yellow-900 mb-1">{currentTip.title}</h4>
              <p className="text-sm text-yellow-800">{currentTip.content}</p>
            </div>
            <div className="flex-shrink-0 flex items-center space-x-1">
              {pageTips.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentTipIndex(Math.max(0, currentTipIndex - 1))}
                    disabled={currentTipIndex === 0}
                    className="h-6 w-6 p-0 text-yellow-700 hover:text-yellow-900"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-yellow-700 px-1">
                    {currentTipIndex + 1}/{pageTips.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (currentTipIndex < pageTips.length - 1) {
                        setCurrentTipIndex(prev => prev + 1);
                      } else {
                        setIsDismissed(true);
                      }
                    }}
                    className="h-6 w-6 p-0 text-yellow-700 hover:text-yellow-900"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="h-6 w-6 p-0 text-yellow-700 hover:text-yellow-900"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to get current page name
export function useCurrentPage(): string {
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const updatePage = () => {
      const path = window.location.pathname;
      if (path === '/') {
        setCurrentPage('home');
      } else if (path.startsWith('/paddocks')) {
        setCurrentPage('paddocks');
      } else if (path.startsWith('/animals')) {
        setCurrentPage('animals');
      } else if (path.startsWith('/dashboard')) {
        setCurrentPage('dashboard');
      } else if (path.startsWith('/daily-needs')) {
        setCurrentPage('daily-needs');
      } else if (path.startsWith('/calendar')) {
        setCurrentPage('calendar');
      } else if (path.startsWith('/settings')) {
        setCurrentPage('settings');
      } else {
        setCurrentPage('other');
      }
    };

    updatePage();
    
    // Listen for navigation changes
    window.addEventListener('popstate', updatePage);
    
    // Listen for programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(updatePage, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(updatePage, 0);
    };

    return () => {
      window.removeEventListener('popstate', updatePage);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return currentPage;
}