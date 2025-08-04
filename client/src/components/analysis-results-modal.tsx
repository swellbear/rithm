import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Leaf, AlertTriangle, Info, Lightbulb, X, Save, ArrowRight } from "lucide-react";

interface AnalysisResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: any;
  onNextPoint: () => void;
  pointNumber: number;
}

export default function AnalysisResultsModal({ 
  isOpen, 
  onClose, 
  results, 
  onNextPoint, 
  pointNumber 
}: AnalysisResultsModalProps) {
  if (!results) return null;

  const getSpeciesIcon = (type: string) => {
    switch (type) {
      case "legume":
        return <Leaf className="h-4 w-4 text-secondary" />;
      case "grass":
        return <Leaf className="h-4 w-4 text-primary" />;
      case "soil":
        return <div className="w-4 h-4 bg-gray-400 rounded"></div>;
      default:
        return <Leaf className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSpeciesColor = (type: string) => {
    switch (type) {
      case "legume":
        return "bg-secondary";
      case "grass":
        return "bg-primary";
      case "soil":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getWarningIcon = (species: any) => {
    if (species.warning) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>Analysis Results</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Confidence Score */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Analysis Confidence</span>
                <span className="text-lg font-bold text-green-600">{results.confidence}%</span>
              </div>
              <Progress value={results.confidence} className="h-2" />
            </CardContent>
          </Card>
          
          {/* Plant Species Detected */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center text-text-primary">
              <Leaf className="h-5 w-5 text-secondary mr-2" />
              Plant Species Detected
            </h4>
            <div className="space-y-2">
              {results.species.map((species: any, index: number) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getSpeciesIcon(species.type)}
                        <span className="font-medium text-primary">{species.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{species.percentage}%</span>
                    </div>
                    
                    {(species.nutritionalValue || species.warning) && (
                      <div className="text-xs text-gray-600 mb-2 flex items-start">
                        {getWarningIcon(species)}
                        <span className="ml-1">
                          {species.warning || `Nutritional value: ${species.nutritionalValue} protein`}
                        </span>
                      </div>
                    )}
                    
                    <Progress 
                      value={species.percentage} 
                      className="h-1.5" 
                    />
                    <div 
                      className={`w-full h-1.5 rounded-full ${getSpeciesColor(species.type)}`}
                      style={{ width: `${species.percentage}%` }}
                    ></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Recommendations */}
          <Card className="bg-surface">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center text-primary">
                <Lightbulb className="h-5 w-5 mr-2" />
                Recommendations
              </h4>
              <ul className="text-sm space-y-2 text-gray-700">
                {results.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        {/* Modal Actions */}
        <div className="flex space-x-3 sticky bottom-0 bg-white pt-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onClose}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Data
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary-dark" 
            onClick={onNextPoint}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Next Point
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
