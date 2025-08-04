import { Link, useLocation } from "wouter";
import { Home, Wrench, BarChart3, MapPin, Calendar, Users, Zap } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/tools", icon: Wrench, label: "Tools" },
  { path: "/analytics", icon: BarChart3, label: "Data" },
  { path: "/gps-location-tools", icon: MapPin, label: "Fields" },
  { path: "/enhanced-grazing-calendar", icon: Calendar, label: "Plan" },
  { path: "/livestock-health-breeding", icon: Users, label: "Livestock" },
  { path: "/au-calculator", icon: Zap, label: "Daily" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bottom-nav-enhanced z-40 safe-area-inset-bottom border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="grid grid-cols-7 h-16 sm:h-18">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          
          return (
            <Link 
              key={path} 
              href={path} 
              className={`nav-item-enhanced flex flex-col items-center justify-center h-full px-0.5 sm:px-1 min-w-0 transition-colors active:bg-gray-100 dark:active:bg-gray-800 ${
                isActive 
                  ? "active text-primary dark:text-primary bg-primary/5 dark:bg-primary/10" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1 flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-medium leading-tight text-center w-full px-0.5">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
