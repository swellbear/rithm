import { create } from 'zustand';
import { 
  MLData, 
  TrainingResults, 
  NLPResults, 
  VisionResults, 
  SpeechResults, 
  GovernanceMetrics, 
  DeployedModel,
  ReportStructure 
} from './components/ml-platform/types';

/**
 * Loading state interface for different operations
 */
interface LoadingState {
  data: boolean;
  training: boolean;
  nlp: boolean;
  vision: boolean;
  speech: boolean;
  governance: boolean;
  deployment: boolean;
  report: boolean;
}

/**
 * Main application store state interface
 */
interface AppStore {
  // Data state
  data: MLData | null;
  trainingResults: TrainingResults | null;
  nlpResults: NLPResults | null;
  visionResults: VisionResults | null;
  speechResults: SpeechResults | null;
  governanceMetrics: GovernanceMetrics | null;
  deployedModel: DeployedModel | null;
  reportStructure: ReportStructure | null;
  
  // UI state
  loading: LoadingState;
  error: string | null;
  
  // Privacy consent state
  consent: boolean;
  
  // Local model state
  useLocalModel: boolean;
  
  // Actions
  setData: (data: MLData | null) => void;
  setTrainingResults: (results: TrainingResults | null) => void;
  setNLPResults: (results: NLPResults | null) => void;
  setVisionResults: (results: VisionResults | null) => void;
  setSpeechResults: (results: SpeechResults | null) => void;
  setGovernanceMetrics: (metrics: GovernanceMetrics | null) => void;
  setDeployedModel: (model: DeployedModel | null) => void;
  setReportStructure: (structure: ReportStructure | null) => void;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  setError: (error: string | null) => void;
  setConsent: (consent: boolean) => void;
  setUseLocalModel: (useLocal: boolean) => void;
  
  // Utility actions
  clearAllData: () => void;
  clearError: () => void;
}

/**
 * Initial loading state
 */
const initialLoadingState: LoadingState = {
  data: false,
  training: false,
  nlp: false,
  vision: false,
  speech: false,
  governance: false,
  deployment: false,
  report: false,
};

/**
 * Zustand store for ML Platform state management
 * 
 * This store provides centralized state management for the entire ML platform,
 * eliminating prop drilling and enabling efficient component subscriptions.
 * 
 * Features:
 * - Individual selectors for optimal performance
 * - TypeScript support with proper interfaces
 * - Structured loading states for different operations
 * - Error handling with centralized error state
 * - Utility functions for clearing data and errors
 * 
 * Usage:
 * ```tsx
 * // Subscribe to specific state slice
 * const data = useAppStore((state) => state.data);
 * const setData = useAppStore((state) => state.setData);
 * 
 * // Or use multiple selectors
 * const { data, trainingResults, loading } = useAppStore((state) => ({
 *   data: state.data,
 *   trainingResults: state.trainingResults,
 *   loading: state.loading
 * }));
 * ```
 */
export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  data: null,
  trainingResults: null,
  nlpResults: null,
  visionResults: null,
  speechResults: null,
  governanceMetrics: null,
  deployedModel: null,
  reportStructure: null,
  loading: initialLoadingState,
  error: null,
  consent: true, // Default to consent enabled for ML training functionality
  useLocalModel: false, // Default to cloud processing
  
  // Data setters
  setData: (data) => set({ data }),
  
  setTrainingResults: (trainingResults) => set({ trainingResults }),
  
  setNLPResults: (nlpResults) => set({ nlpResults }),
  
  setVisionResults: (visionResults) => set({ visionResults }),
  
  setSpeechResults: (speechResults) => set({ speechResults }),
  
  setGovernanceMetrics: (governanceMetrics) => set({ governanceMetrics }),
  
  setDeployedModel: (deployedModel) => set({ deployedModel }),
  
  setReportStructure: (reportStructure) => {
    console.log('🔧 Store setReportStructure called:', !!reportStructure, reportStructure?.sections?.length);
    set({ reportStructure });
  },
  
  // Loading state setter
  setLoading: (key, value) => {
    console.log(`🔧 Store setLoading called: ${key} = ${value}`);
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: value
      }
    }));
  },
  
  // Error setter
  setError: (error) => set({ error }),
  
  // Privacy consent setter
  setConsent: (consent) => set({ consent }),
  
  // Local model setter
  setUseLocalModel: (useLocalModel) => set({ useLocalModel }),
  
  // Utility actions
  clearAllData: () => set({
    data: null,
    trainingResults: null,
    nlpResults: null,
    visionResults: null,
    speechResults: null,
    governanceMetrics: null,
    deployedModel: null,
    reportStructure: null,
    loading: initialLoadingState,
    error: null,
  }),
  
  clearError: () => set({ error: null }),
}));

/**
 * Selector helpers for common use cases
 */
export const useAppStoreSelectors = {
  // Check if any data exists
  hasAnyData: () => useAppStore((state) => 
    !!(state.data || state.trainingResults || state.nlpResults || 
       state.visionResults || state.speechResults)
  ),
  
  // Check if any loading is active
  isAnyLoading: () => useAppStore((state) => 
    Object.values(state.loading).some(loading => loading)
  ),
  
  // Get all results together
  getAllResults: () => useAppStore((state) => ({
    data: state.data,
    trainingResults: state.trainingResults,
    nlpResults: state.nlpResults,
    visionResults: state.visionResults,
    speechResults: state.speechResults,
    governanceMetrics: state.governanceMetrics,
    deployedModel: state.deployedModel,
  })),
  
  // Get all loading states
  getAllLoading: () => useAppStore((state) => state.loading),
};

export default useAppStore;