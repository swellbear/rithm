// Example: How to integrate Zustand store into your ML Platform components
// This shows how to gradually migrate from useReducer to Zustand

import React from 'react';
import { useAppStore } from '../store';
import { MLData, TrainingResults } from '../components/ml-platform/types';

// Example 1: Simple component using Zustand store
export const DataStatusExample = () => {
  const { data, trainingResults, loading, setData, setLoading } = useAppStore();

  const handleDataUpdate = (newData: MLData) => {
    setLoading('data', true);
    // Simulate data processing
    setTimeout(() => {
      setData(newData);
      setLoading('data', false);
    }, 1000);
  };

  return (
    <div>
      <h3>Data Status</h3>
      <p>Has data: {data ? 'Yes' : 'No'}</p>
      <p>Has training results: {trainingResults ? 'Yes' : 'No'}</p>
      <p>Loading data: {loading.data ? 'Yes' : 'No'}</p>
    </div>
  );
};

// Example 2: Integration into existing component pattern
export const EnhancedDataManagementPanel = ({
  // Keep existing props for backward compatibility
  onGenerateData,
  onTrainModel,
  ...props
}: any) => {
  // Use Zustand for shared state
  const { 
    data, 
    trainingResults, 
    nlpResults, 
    visionResults, 
    speechResults,
    loading,
    setData, 
    setTrainingResults,
    setNLPResults,
    setVisionResults,
    setSpeechResults,
    setLoading 
  } = useAppStore();

  // Enhanced handlers that update global state
  const handleGenerateData = async () => {
    setLoading('generation', true);
    try {
      await onGenerateData(); // Call original handler
      // Data will be set through the store elsewhere
    } finally {
      setLoading('generation', false);
    }
  };

  const handleTrainModel = async () => {
    setLoading('training', true);
    try {
      const results = await onTrainModel();
      setTrainingResults(results); // Update global state
    } finally {
      setLoading('training', false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerateData} disabled={loading.generation}>
        {loading.generation ? 'Generating...' : 'Generate Data'}
      </button>
      <button onClick={handleTrainModel} disabled={loading.training}>
        {loading.training ? 'Training...' : 'Train Model'}
      </button>
      
      {/* Display state from store */}
      {data && <div>Data loaded: {Object.keys(data).length} columns</div>}
      {trainingResults && <div>Accuracy: {trainingResults.r2_score}</div>}
      {nlpResults && <div>Sentiment: {nlpResults.sentiment}</div>}
    </div>
  );
};

// Example 3: Cross-component communication
export const ResultsDisplay = () => {
  const { 
    data, 
    trainingResults, 
    nlpResults, 
    visionResults, 
    speechResults 
  } = useAppStore();

  // This component automatically updates when any component updates the store
  return (
    <div>
      <h3>All Results</h3>
      {data && <div>Data: {Object.keys(data).length} features</div>}
      {trainingResults && <div>Model R²: {trainingResults.r2_score}</div>}
      {nlpResults && <div>NLP: {nlpResults.entities.length} entities</div>}
      {visionResults && <div>Vision: {visionResults.classifications.length} objects</div>}
      {speechResults && <div>Speech: {speechResults.confidence}% confidence</div>}
    </div>
  );
};