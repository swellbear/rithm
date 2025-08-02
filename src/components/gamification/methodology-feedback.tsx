import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SamplingQualityMetrics, calculateMethodologyScore, generateFeedback } from "@/lib/gamification";
import { CheckCircle, AlertCircle, TrendingUp, Camera, MapPin, Clock, Target } from "lucide-react";

interface MethodologyFeedbackProps {
  metrics: SamplingQualityMetrics;
  pointsEarned: number;
  onClose: () => void;
}

export default function MethodologyFeedback({ 
  metrics, 
  pointsEarned, 
  onClose 
}: MethodologyFeedbackProps) {
  const overallScore = calculateMethodologyScore(metrics);
  const feedback = generateFeedback(metrics);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const metricDetails = [
    {
      name: "Photo Quality",
      score: metrics.photoQuality,
      icon: <Camera className="h-4 w-4" />,
      description: "Clarity, lighting, and consistency of photos"
    },
    {
      name: "Step Spacing",
      score: metrics.spacing,
      icon: <MapPin className="h-4 w-4" />,
      description: "Consistency of 5-foot intervals between sample points"
    },
    {
      name: "Paddock Coverage",
      score: metrics.coverage,
      icon: <Target className="h-4 w-4" />,
      description: "How well you covered the entire paddock area"
    },
    {
      name: "Timing Consistency",
      score: metrics.timing,
      icon: <Clock className="h-4 w-4" />,
      description: "Steady pace between sample points"
    },
    {
      name: "Overall Accuracy",
      score: metrics.accuracy,
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Technical accuracy of sampling method"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {getScoreIcon(overallScore)}
            <span>Assessment Complete!</span>
          </CardTitle>
          <div className="space-y-2">
            <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              +{pointsEarned} points earned
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Feedback */}
          <div className="text-center space-y-2">
            <p className="font-medium">{feedback.message}</p>
            <p className="text-sm text-muted-foreground italic">"{feedback.encouragement}"</p>
          </div>

          {/* Detailed Metrics */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Methodology Breakdown</span>
            </h3>
            
            {metricDetails.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {metric.icon}
                    <span className="font-medium text-sm">{metric.name}</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(metric.score)}`}>
                    {metric.score}%
                  </span>
                </div>
                <Progress value={metric.score} className="h-2" />
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            ))}
          </div>

          {/* Improvement Tips */}
          {feedback.tips.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Tips for Improvement</h3>
              <div className="space-y-2">
                {feedback.tips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button onClick={onClose} className="flex-1">
              Continue
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/reports'}>
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}