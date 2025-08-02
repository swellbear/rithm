import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  last_updated?: string;
  collection_rate?: {
    conversations_per_hour: number;
    terminology_per_hour: number;
  };
}

export default function TrainingProgress() {
  const [isStarting, setIsStarting] = useState(false);
  
  const { data: progress, isLoading, refetch } = useQuery<TrainingProgress>({
    queryKey: ['/api/rithm/training/progress'],
    refetchInterval: 5000
  });

  const handleStartTraining = async () => {
    setIsStarting(true);
    try {
      await Promise.all([
        fetch('/api/rithm/training/conversations', { method: 'POST' }),
        fetch('/api/rithm/training/terminology', { method: 'POST' }),
        fetch('/api/rithm/training/cases', { method: 'POST' })
      ]);
      refetch();
    } catch (error) {
      console.error('Failed to start training:', error);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900 dark:text-white">Loading Training Progress...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8 min-h-screen w-full">
      <div className="max-w-4xl mx-auto pb-16 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-900 dark:text-white">Rithm Training Data Collection</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-lg sm:text-xl">Training Progress Overview</span>
              <Badge variant="outline" className="text-xs sm:text-sm">
                {progress.available_datasets} Datasets Available
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              {/* Business Conversations */}
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {progress.current_status.conversations_collected.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Business Conversations
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Target: {progress.targets.businessConversations.toLocaleString()}
                </div>
                <Progress 
                  value={parseFloat(progress.completion_rates.conversations)} 
                  className="h-2"
                />
                <Badge variant="secondary" className="mt-2">
                  {progress.completion_rates.conversations}
                </Badge>
              </div>
              
              {/* Domain Terminology */}
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {progress.current_status.terminology_collected.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Business Terms
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Target: {progress.targets.domainTerminology.toLocaleString()}
                </div>
                <Progress 
                  value={parseFloat(progress.completion_rates.terminology)} 
                  className="h-2"
                />
                <Badge variant="secondary" className="mt-2">
                  {progress.completion_rates.terminology}
                </Badge>
              </div>
              
              {/* Case Studies */}
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {progress.current_status.cases_collected.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Case Studies
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Target: {progress.targets.dataAnalysisScenarios.toLocaleString()}
                </div>
                <Progress 
                  value={parseFloat(progress.completion_rates.cases)} 
                  className="h-2"
                />
                <Badge variant="secondary" className="mt-2">
                  {progress.completion_rates.cases}
                </Badge>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Next Actions:</h3>
              <ul className="space-y-2">
                {progress.next_actions.map((action, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="break-words">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button 
              onClick={handleStartTraining}
              disabled={isStarting}
              className="w-full"
              size="lg"
            >
              {isStarting ? 'Starting Collection...' : 'Start Data Collection'}
            </Button>
            
            {/* Show real-time collection rates if available */}
            {progress.collection_rate && (
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                <div>Collection Rate: {progress.collection_rate.conversations_per_hour} conversations/hr</div>
                <div>{progress.collection_rate.terminology_per_hour} terms/hr</div>
                <div className="text-xs mt-1">Last updated: {new Date(progress.last_updated).toLocaleTimeString()}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg sm:text-xl font-semibold text-orange-600 dark:text-orange-400">
                  {progress.current_status.patterns_learned}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Patterns Learned</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400">
                  {progress.available_datasets}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Available Datasets</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400">
                  {Object.values(progress.current_status).reduce((a, b) => a + b, 0).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Collected</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-lg sm:text-xl font-semibold text-teal-600 dark:text-teal-400">
                  {Object.values(progress.targets).reduce((a, b) => a + b, 0).toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Target</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}