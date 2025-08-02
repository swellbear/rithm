import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useConceptNet } from '@/hooks/useConceptNet';

const ConceptNetDemo: React.FC = () => {
  const { stats, isLoading, error, searchConcepts, enhanceText, getConcept } = useConceptNet();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [textToEnhance, setTextToEnhance] = useState('');
  const [enhancement, setEnhancement] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchConcepts(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnhance = async () => {
    if (!textToEnhance.trim()) return;
    
    setIsEnhancing(true);
    try {
      const result = await enhanceText(textToEnhance);
      setEnhancement(result);
    } catch (err) {
      console.error('Enhancement failed:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ConceptNet Integration Demo</h1>
        <p className="text-muted-foreground">
          Explore Rithm's offline knowledge capabilities powered by ConceptNet
        </p>
      </div>

      {/* Knowledge Base Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Statistics</CardTitle>
          <CardDescription>
            Current status of the offline ConceptNet knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading knowledge base stats...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">Error: {error}</div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalConcepts}</div>
                <div className="text-sm text-muted-foreground">Total Concepts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalRelations}</div>
                <div className="text-sm text-muted-foreground">Total Relations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.relationTypes.length}</div>
                <div className="text-sm text-muted-foreground">Relation Types</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.topConcepts.length}</div>
                <div className="text-sm text-muted-foreground">Top Concepts</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">No stats available</div>
          )}
        </CardContent>
      </Card>

      {/* Concept Search */}
      <Card>
        <CardHeader>
          <CardTitle>Concept Search</CardTitle>
          <CardDescription>
            Search the knowledge base for concepts and their relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter a concept to search (e.g., 'business', 'analysis', 'learning')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Search Results</h4>
              {searchResults.map((result, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="font-medium mb-2">{result.concept}</div>
                    {result.definitions.length > 0 && (
                      <div className="mb-2">
                        <div className="text-sm font-medium">Definitions:</div>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {result.definitions.slice(0, 2).map((def: string, idx: number) => (
                            <li key={idx}>{def}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.relatedConcepts.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-1">Related Concepts:</div>
                        <div className="flex flex-wrap gap-1">
                          {result.relatedConcepts.slice(0, 8).map((concept: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Text Enhancement */}
      <Card>
        <CardHeader>
          <CardTitle>Text Understanding Enhancement</CardTitle>
          <CardDescription>
            Enhance text understanding with contextual knowledge and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter text to enhance (e.g., 'I need help with business analysis')"
              value={textToEnhance}
              onChange={(e) => setTextToEnhance(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEnhance()}
            />
            <Button onClick={handleEnhance} disabled={isEnhancing}>
              {isEnhancing ? 'Enhancing...' : 'Enhance'}
            </Button>
          </div>
          
          {enhancement && (
            <div className="space-y-3">
              <h4 className="font-semibold">Enhanced Understanding</h4>
              
              {enhancement.concepts.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Identified Concepts:</div>
                  <div className="flex flex-wrap gap-1">
                    {enhancement.concepts.map((concept: any, idx: number) => (
                      <Badge key={idx} variant="outline">
                        {concept.concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              {enhancement.insights.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Contextual Insights:</div>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    {enhancement.insights.slice(0, 5).map((insight: string, idx: number) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {enhancement.relatedTopics.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Related Topics:</div>
                  <div className="flex flex-wrap gap-1">
                    {enhancement.relatedTopics.slice(0, 10).map((topic: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How ConceptNet Integration Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <strong>1. Offline Knowledge Base:</strong> ConceptNet data is processed and stored locally, 
              enabling Rithm to work completely offline without external API dependencies.
            </div>
            <div>
              <strong>2. Semantic Understanding:</strong> The system understands relationships between concepts 
              (IsA, UsedFor, HasProperty, CapableOf) to provide contextual insights.
            </div>
            <div>
              <strong>3. Independent Learning:</strong> Every conversation teaches the system new relationships, 
              expanding its knowledge base autonomously.
            </div>
            <div>
              <strong>4. Enhanced Conversations:</strong> ConceptNet provides contextual understanding that 
              makes conversations more natural and informative.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConceptNetDemo;