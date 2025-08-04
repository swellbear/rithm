import { Bell, User, Settings, LogOut, MapPin, Wrench, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import GettingStartedAssistant from "@/components/getting-started-assistant";
import CadenceLogo from "@/components/graze-flow-logo";
import { useAuth } from "@/contexts/auth-context";

interface LivestockAlert {
  id: number;
  animalId: number;
  alertType: string;
  severity: string;
  message: string;
  isActive: boolean;
  acknowledgedAt?: string;
}

interface PastureAlert {
  id: number;
  paddockId: number;
  alertType: string;
  severity: string;
  message: string;
  isActive: boolean;
  acknowledgedAt?: string;
}

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  
  // Track current location for navigation logic

  // Fetch user's active tools for the assistant
  const { data: userTools = [] } = useQuery<any[]>({
    queryKey: [`/api/tools/user/${user?.id || 1}`],
    retry: false,
    enabled: !!user?.id,
  });

  // Fetch livestock alerts
  const { data: livestockAlerts = [] } = useQuery<LivestockAlert[]>({
    queryKey: ["/api/livestock-alerts/active"],
    retry: false,
  });

  // Fetch pasture alerts
  const { data: pastureAlerts = [] } = useQuery<PastureAlert[]>({
    queryKey: ["/api/alerts/active"],
    retry: false,
  });

  const activatedTools = userTools.filter(t => t.isActive).map(t => t.toolId);

  // Calculate unread alerts count
  const unreadAlertsCount = [
    ...livestockAlerts.filter(alert => alert.isActive && !alert.acknowledgedAt),
    ...pastureAlerts.filter(alert => alert.isActive && !alert.acknowledgedAt)
  ].length;

  // Handle escape key and scroll to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    const handleScroll = (event: Event) => {
      // Don't close if scrolling inside the dropdown menu
      const target = event.target as HTMLElement;
      if (target && target.closest('.user-dropdown-menu')) {
        return;
      }
      setShowUserMenu(false);
    };

    const handleResize = () => {
      setShowUserMenu(false);
    };

    const handleTouchMove = (event: TouchEvent) => {
      // Don't close if touch is inside the dropdown menu
      const target = event.target as HTMLElement;
      if (target && target.closest('.user-dropdown-menu')) {
        return;
      }
      setShowUserMenu(false);
    };

    if (showUserMenu) {
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchstart', handleTouchMove, { passive: true });
      
      // Also listen for scroll on the main container and body
      const mainContainer = document.querySelector('.container');
      const body = document.body;
      
      if (mainContainer) {
        mainContainer.addEventListener('scroll', handleScroll, { passive: true });
      }
      if (body) {
        body.addEventListener('scroll', handleScroll, { passive: true });
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchstart', handleTouchMove);
      
      const mainContainer = document.querySelector('.container');
      const body = document.body;
      
      if (mainContainer) {
        mainContainer.removeEventListener('scroll', handleScroll);
      }
      if (body) {
        body.removeEventListener('scroll', handleScroll);
      }
    };
  }, [showUserMenu]);

  const handleProfileClick = () => {
    setShowUserMenu(false);
    
    // Try a more direct approach
    try {
      setLocation('/settings');
      // Also try using window.location as a backup
      setTimeout(() => {
        if (location !== '/settings') {
          window.location.hash = '/settings';
          window.location.pathname = '/settings';
        }
      }, 100);
    } catch (error) {
      console.error('Error during navigation:', error);
    }
  };

  const handleLocationClick = () => {
    setShowUserMenu(false);
    alert('Location: Southeastern Oklahoma\nClimate Zone: Southeastern Oklahoma\nUpdated during onboarding setup');
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAlertsClick = () => {
    setLocation('/unified-alert-dashboard');
  };

  return (
    <header className="header-enhanced text-white shadow-lg sticky top-0 z-50">
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="header-logo-enhanced">
            <CadenceLogo 
              size={28} 
              showText={true} 
              className="text-white drop-shadow-lg sm:size-32" 
            />
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 sm:p-2 hover:bg-primary-light rounded-full transition-colors text-white hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setShowGettingStarted(true)}
              title="Getting Started Guide"
            >
              <HelpCircle className="h-5 w-5 sm:h-5 sm:w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 sm:p-2 hover:bg-primary-light rounded-full transition-colors text-white hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={handleAlertsClick}
              title="View Alerts"
            >
              <Bell className="h-5 w-5 sm:h-5 sm:w-5" />
              {unreadAlertsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-accent text-xs h-5 w-5 p-0 flex items-center justify-center min-w-[20px] rounded-full">
                  {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                </Badge>
              )}
            </Button>
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 sm:p-2 hover:bg-primary-light rounded-full transition-colors text-white hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User className="h-5 w-5 sm:h-5 sm:w-5" />
              </Button>
              
              {showUserMenu && (
                <div className="user-dropdown-menu absolute right-0 top-full mt-2 w-56 sm:w-48 bg-white rounded-lg shadow-xl border z-50 max-w-[calc(100vw-1rem)] mr-2 sm:mr-0">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900 truncate">{user?.username || "User"}</div>
                      <div className="text-xs text-gray-500 truncate">{(user as any)?.farmName || "Farm Owner"}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocationClick();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center active:bg-gray-200 transition-colors"
                    >
                      <MapPin className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="truncate">View Location</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center active:bg-gray-200 transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="truncate">Settings</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center active:bg-gray-200 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
                      <span className="truncate">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay to close menu when clicking outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Getting Started Assistant */}
      {showGettingStarted && (
        <GettingStartedAssistant
          onClose={() => setShowGettingStarted(false)}
          activatedTools={activatedTools}
        />
      )}
    </header>
  );
}
