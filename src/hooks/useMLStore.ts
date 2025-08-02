// Custom hook wrapper for ML Platform-specific store operations
import { useAppStore } from '../store';
import { useCallback } from 'react';
import type { MLData, TrainingResults, NLPResults, VisionResults, SpeechResults } from '../components/ml-platform/types';

export const useMLStore = () => {
  const store = useAppStore();

  // Enhanced actions with logging and error handling
  const setDataWithLogging = useCallback((data: MLData | null) => {
    console.log('[MLStore] Setting data:', data ? Object.keys(data).length + ' columns' : 'null');
    store.setData(data);
  }, [store.setData]);

  const setTrainingResultsWithLogging = useCallback((results: TrainingResults | null) => {
    console.log('[MLStore] Setting training results:', results ? `R²: ${results.r2_score}` : 'null');
    store.setTrainingResults(results);
  }, [store.setTrainingResults]);

  const setNLPResultsWithLogging = useCallback((results: NLPResults | null) => {
    console.log('[MLStore] Setting NLP results:', results ? `${results.entities.length} entities` : 'null');
    store.setNLPResults(results);
  }, [store.setNLPResults]);

  // Helper to check if any results are available
  const hasAnyResults = useCallback(() => {
    return !!(store.trainingResults || store.nlpResults || store.visionResults || store.speechResults);
  }, [store.trainingResults, store.nlpResults, store.visionResults, store.speechResults]);

  // Helper to get loading status
  const isAnyLoading = useCallback(() => {
    return Object.values(store.loading).some(loading => loading);
  }, [store.loading]);

  return {
    // State
    ...store,
    // Enhanced actions
    setData: setDataWithLogging,
    setTrainingResults: setTrainingResultsWithLogging,
    setNLPResults: setNLPResultsWithLogging,
    // Helpers
    hasAnyResults,
    isAnyLoading,
  };
};