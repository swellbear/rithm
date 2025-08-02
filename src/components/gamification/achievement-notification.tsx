import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Achievement } from "@/lib/gamification";
import { Trophy, X, Star } from "lucide-react";

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  show: boolean;
}

export default function AchievementNotification({ 
  achievement, 
  onClose, 
  show 
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className="w-80 bg-gradient-to-r from-primary to-primary-light text-white border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-300" />
              <span className="font-semibold text-sm">Achievement Unlocked!</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{achievement.icon}</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{achievement.title}</h3>
              <p className="text-sm opacity-90">{achievement.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  +{achievement.points} points
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-300" />
                  <span className="text-xs capitalize">{achievement.category}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}