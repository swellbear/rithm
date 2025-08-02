import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';

interface TrainingProgress {
  current_status: {
    conversations_collected: number;
    terminology_collected: number;
    cases_collected: number;
    patterns_learned: number;
  };
  targets: {
    businessConversations: number;
    domainTerminology: number;
    dataAnalysisScenarios: number;
  };
  completion_rates: {
    conversations: string;
    terminology: string;
    cases: string;
  };
  available_datasets: number;
  next_actions: string[];
}

export default function DataIntegrationStatus() {
  const [isCollecting, setIsCollecting] = useState(false);
  
  const { data: progress, isLoading } = useQuery<TrainingProgress>({
    queryKey: ['/api/rithm/training/progress'],
    refetchInterval: 5000
  });

  const handleStartCollection = async () => {
    setIsCollecting(true);
    try {
      await fetch('/api/rithm/training/conversations', { method: 'POST' });
      await fetch('/api/rithm/training/terminology', { method: 'POST' });
      await fetch('/api/rithm/training/cases', { method: 'POST' });
    } catch (error) {
      console.error('Failed to start data collection:', error);
    } finally {
      setIsCollecting(false);
    }
  };

  if (isLoading || !progress) {
    return <div>Loading training data status...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Training Data Integration Status</span>
            <Badge variant="outline">
              {progress.available_datasets} Public Datasets Available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progress.current_status.conversations_collected}
              </div>
              <div className="text-sm text-gray-600">
                Business Conversations
              </div>
              <div className="text-xs text-gray-500">
                Target: {progress.targets.businessConversations}
              </div>
              <Badge variant="secondary" className="mt-1">
                {progress.completion_rates.conversations}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress.current_status.terminology_collected}
              </div>
              <div className="text-sm text-gray-600">
                Business Terms
              </div>
              <div className="text-xs text-gray-500">
                Target: {progress.targets.domainTerminology}
              </div>
              <Badge variant="secondary" className="mt-1">
                {progress.completion_rates.terminology}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progress.current_status.cases_collected}
              </div>
              <div className="text-sm text-gray-600">
                Case Studies
              </div>
              <div className="text-xs text-gray-500">
                Target: {progress.targets.dataAnalysisScenarios}
              </div>
              <Badge variant="secondary" className="mt-1">
                {progress.completion_rates.cases}
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Next Actions:</h4>
            <ul className="text-sm space-y-1">
              {progress.next_actions.map((action, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          <Button 
            onClick={handleStartCollection}
            disabled={isCollecting}
            className="w-full"
          >
            {isCollecting ? 'Collecting Data...' : 'Start Data Collection'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}