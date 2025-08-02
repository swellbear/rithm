import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Brain, MessageSquare, Tag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NLPResults {
  sentiment: string;
  language: string;
  keyPhrases: string[];
  entities: { text: string; type: string; confidence: number }[];
}

interface NLPPanelProps {
  onAnalyzeNLP: (text: string) => Promise<NLPResults>;
  nlpResults?: NLPResults;
  loading: boolean;
}

export default function NLPPanel({ onAnalyzeNLP, nlpResults, loading }: NLPPanelProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter text to analyze');
      return;
    }
    
    try {
      setError(null);
      await onAnalyzeNLP(text);
    } catch (err) {
      setError('Failed to analyze text. Please try again.');
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getEntityTypeColor = (type: string) => {
    const colors = {
      'PERSON': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'ORG': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'LOC': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'MISC': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            NLP Text Analysis
          </CardTitle>
          <CardDescription>
            Analyze text for sentiment, entities, and key phrases using advanced NLP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="nlp-text" className="text-sm font-medium">
              Text to Analyze
            </label>
            <Textarea
              id="nlp-text"
              placeholder="Enter text for NLP analysis..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleAnalyze} 
            disabled={loading || !text.trim()}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Analyze Text'}
          </Button>
        </CardContent>
      </Card>

      {(loading || nlpResults) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : nlpResults ? (
              <>
                {/* Sentiment Analysis */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Sentiment</h4>
                  <Badge className={getSentimentColor(nlpResults.sentiment)}>
                    {nlpResults.sentiment || 'Unknown'}
                  </Badge>
                </div>

                {/* Language Detection */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Detected Language</h4>
                  <Badge variant="outline">
                    {nlpResults.language || 'Unknown'}
                  </Badge>
                </div>

                {/* Key Phrases */}
                {nlpResults.keyPhrases && nlpResults.keyPhrases.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Key Phrases
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {nlpResults.keyPhrases.map((phrase, index) => (
                        <Badge key={index} variant="secondary">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Named Entities */}
                {nlpResults.entities && nlpResults.entities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Named Entities</h4>
                    <div className="space-y-2">
                      {nlpResults.entities.map((entity, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center gap-2">
                            <Badge className={getEntityTypeColor(entity.type)}>
                              {entity.type}
                            </Badge>
                            <span className="text-sm">{entity.text}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(entity.confidence * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}