import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Lock, Clock } from "lucide-react";

interface TutorialCardProps {
  number: number;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  completed?: boolean;
  locked?: boolean;
  onClick?: () => void;
}

export default function TutorialCard({
  number,
  title,
  description,
  duration,
  difficulty,
  completed = false,
  locked = false,
  onClick
}: TutorialCardProps) {
  return (
    <Card 
      className={`border border-gray-200 hover:border-primary transition-colors cursor-pointer ${
        locked ? "opacity-60" : ""
      }`}
      onClick={!locked ? onClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold ${
            completed 
              ? "bg-green-500 text-white" 
              : locked 
                ? "bg-gray-300 text-gray-500" 
                : "bg-primary text-white"
          }`}>
            {completed ? "✓" : number}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium mb-1">{title}</h4>
            <p className="text-sm text-gray-600 mb-2">{description}</p>
            <div className="flex items-center text-xs text-gray-500 space-x-3">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{duration}</span>
              </div>
              <Badge variant="outline" className="text-primary">
                {difficulty}
              </Badge>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            {locked ? (
              <Lock className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
