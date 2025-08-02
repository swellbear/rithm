import { create } from 'zustand';

interface MLData {
  [key: string]: number[];
}

interface TrainingResults {
  model_type: string;
  r2_score: number;
  mse: number;
  n_features: number;
  n_samples: number;
  test_size: number;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface MLStore {
  // Data state
  data: MLData | null;
  results: TrainingResults | null;
  chatMessages: ChatMessage[];
  
  // UI state
  loading: { [key: string]: boolean };
  error: string;
  domain: string;
  sampleSize: number;
  modelType: string;
  goalDescription: string;
  goalAnalysis: any;
  chatInput: string;
  autoTraining: boolean;
  useFaker: boolean;
  customParams: {
    features?: string[];
    sampleSize?: number;
    domain?: string;
    [key: string]: any;
  };

  // Actions
  setData: (data: MLData | null) => void;
  setResults: (results: TrainingResults | null) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setLoading: (loading: { [key: string]: boolean }) => void;
  setError: (error: string) => void;
  setDomain: (domain: string) => void;
  setSampleSize: (size: number) => void;
  setModelType: (type: string) => void;
  setGoalDescription: (desc: string) => void;
  setGoalAnalysis: (analysis: any) => void;
  setChatInput: (input: string) => void;
  setAutoTraining: (enabled: boolean) => void;
  setUseFaker: (enabled: boolean) => void;
  setCustomParams: (params: any) => void;
  
  // Reset actions
  resetData: () => void;
  resetChat: () => void;
}

export const useMLStore = create<MLStore>((set) => ({
  // Initial state
  data: null,
  results: null,
  chatMessages: [],
  loading: {},
  error: '',
  domain: 'healthcare',
  sampleSize: 1000,
  modelType: 'linear_regression',
  goalDescription: '',
  goalAnalysis: null,
  chatInput: '',
  autoTraining: false,
  useFaker: true,
  customParams: {},

  // Actions
  setData: (data) => set({ data }),
  setResults: (results) => set({ results }),
  addMessage: (msg) => set((state) => ({ 
    chatMessages: [...state.chatMessages, msg] 
  })),
  setMessages: (messages) => set({ chatMessages: messages }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setDomain: (domain) => set({ domain }),
  setSampleSize: (sampleSize) => set({ sampleSize }),
  setModelType: (modelType) => set({ modelType }),
  setGoalDescription: (goalDescription) => set({ goalDescription }),
  setGoalAnalysis: (goalAnalysis) => set({ goalAnalysis }),
  setChatInput: (chatInput) => set({ chatInput }),
  setAutoTraining: (autoTraining) => set({ autoTraining }),
  setUseFaker: (useFaker) => set({ useFaker }),
  setCustomParams: (customParams) => set({ customParams }),

  // Reset actions
  resetData: () => set({ 
    data: null, 
    results: null, 
    error: '',
    loading: {} 
  }),
  resetChat: () => set({ 
    chatMessages: [], 
    chatInput: '',
    goalDescription: '',
    goalAnalysis: null 
  }),
}));