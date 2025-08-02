import { useState, useEffect } from 'react';

interface ConceptNetStats {
  totalConcepts: number;
  totalRelations: number;
  relationTypes: string[];
  topConcepts: string[];
}

interface ConceptKnowledge {
  concept: string;
  relations: any[];
  relatedConcepts: string[];
  definitions: string[];
  examples: string[];
}

export const useConceptNet = () => {
  const [stats, setStats] = useState<ConceptNetStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rithm/knowledge/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch ConceptNet stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const searchConcepts = async (query: string): Promise<ConceptKnowledge[]> => {
    try {
      const response = await fetch('/api/rithm/knowledge/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to search concepts');
      }

      return await response.json();
    } catch (err) {
      console.error('Error searching concepts:', err);
      return [];
    }
  };

  const enhanceText = async (text: string) => {
    try {
      const response = await fetch('/api/rithm/knowledge/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance text');
      }

      return await response.json();
    } catch (err) {
      console.error('Error enhancing text:', err);
      return null;
    }
  };

  const getConcept = async (conceptName: string): Promise<ConceptKnowledge | null> => {
    try {
      const response = await fetch(`/api/rithm/knowledge/concept/${encodeURIComponent(conceptName)}`);
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching concept:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    searchConcepts,
    enhanceText,
    getConcept,
    refreshStats: fetchStats,
  };
};