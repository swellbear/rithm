import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMLStore } from '@/hooks/useMLStore';
import { Database, Brain, Eye, Mic, BarChart3, Loader2 } from 'lucide-react';

/**
 * StoreStatusWidget - Displays the current state of the Zustand ML store
 * This component demonstrates how to use the centralized store across components
 */
export const StoreStatusWidget: React.FC = () => {
  const { 
    data, 
    trainingResults, 
    nlpResults, 
    visionResults, 
    speechResults, 
    loading,
    hasAnyResults,
    isAnyLoading
  } = useMLStore();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          ML Store Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Data Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm flex items-center gap-2">
            <Database className="h-3 w-3" />
            Data
          </span>
          <Badge variant={data ? "default" : "secondary"}>
            {data ? `${Object.keys(data).length} columns` : 'No data'}
          </Badge>
        </div>

        {/* Training Results */}
        <div className="flex items-center justify-between">
          <span className="text-sm flex items-center gap-2">
            <Brain className="h-3 w-3" />
            ML Model
          </span>
          <Badge variant={trainingResults ? "default" : "secondary"}>
            {trainingResults ? `R²: ${trainingResults.r2_score.toFixed(3)}` : 'Not trained'}
          </Badge>
        </div>

        {/* NLP Results */}
        <div className="flex items-center justify-between">
          <span className="text-sm flex items-center gap-2">
            <BarChart3 className="h-3 w-3" />
            NLP
          </span>
          <Badge variant={nlpResults ? "default" : "secondary"}>
            {nlpResults ? `${nlpResults.sentiment} (${nlpResults.entities.length} entities)` : 'No analysis'}
          </Badge>
        </div>

        {/* Vision Results */}
        <div className="flex items-center justify-between">
          <span className="text-sm flex items-center gap-2">
            <Eye className="h-3 w-3" />
            Vision
          </span>
          <Badge variant={visionResults ? "default" : "secondary"}>
            {visionResults ? `${visionResults.classifications.length} objects` : 'No analysis'}
          </Badge>
        </div>

        {/* Speech Results */}
        <div className="flex items-center justify-between">
          <span className="text-sm flex items-center gap-2">
            <Mic className="h-3 w-3" />
            Speech
          </span>
          <Badge variant={speechResults ? "default" : "secondary"}>
            {speechResults ? `${Math.round(speechResults.confidence * 100)}% confidence` : 'No analysis'}
          </Badge>
        </div>

        {/* Overall Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Status</span>
            <Badge variant={hasAnyResults() ? "default" : "secondary"}>
              {isAnyLoading() ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing...
                </span>
              ) : hasAnyResults() ? (
                'Active'
              ) : (
                'Ready'
              )}
            </Badge>
          </div>
        </div>

        {/* Loading Details */}
        {Object.keys(loading).length > 0 && (
          <div className="text-xs text-gray-500">
            Loading: {Object.entries(loading)
              .filter(([, isLoading]) => isLoading)
              .map(([key]) => key)
              .join(', ') || 'None'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};