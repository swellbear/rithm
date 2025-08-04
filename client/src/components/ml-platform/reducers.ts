// State management for ML Platform using React useReducer
import type { ReportStructure, ReportSection } from './types';
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  // Multimodal support
  attachments?: ChatAttachment[];
  chartData?: ChartData;
  isLocalResponse?: boolean;
  workflowId?: string; // ID of associated workflow for rendering buttons
  // NEW: NLP entities for Watson-like NLP
  nlpEntities?: { text: string; label: string; confidence: number }[];
  // NEW: Vision detections for Watson Visual Recognition equiv
  visionDetections?: { label: string; score: number; box: [number, number, number, number] }[];
  // NEW: Speech transcript with Watson Speech equiv
  speechTranscript?: { text: string; confidence: number; speaker?: string };
}

export interface ChatAttachment {
  type: 'image' | 'file' | 'document' | 'audio' | 'video'; // NEW: Added audio/video for multimedia
  name: string;
  size: number;
  base64?: string;
  url?: string;
  mimeType: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  data: any[];
  xKey?: string;
  yKey?: string;
  title?: string;
  description?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'generate_data' | 'anonymize_data' | 'train_model' | 'export_data' | 'visualize' | 'custom'
    | 'nlp_analyze' | 'vision_detect' | 'speech_transcribe' | 'discover_search' | 'deploy_model'; // NEW: Watson-like types
  parameters: Record<string, any>;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface WorkflowPlan {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'draft' | 'ready' | 'running' | 'completed' | 'failed';
  estimatedTime?: number;
  created: string;
}

export interface ChatState {
  messages: ChatMessage[];
  goalDescription: string;
  attachedFiles: File[];
  goalAnalysis: {
    feasibility: number;
    complexity: number;
  } | null;
  // Privacy enhancements
  dataShareConsent: boolean;
  encryptionEnabled: boolean;
  anonymizationLevel: 'none' | 'basic' | 'strict';
  encryptionKey?: string;
  // Workflow enhancements
  workflowPlans: WorkflowPlan[];
  activeWorkflow?: string;
  workflowSuggestions: WorkflowStep[];
  // NEW: Governance for Watson-like explainability
  governanceMetrics?: { biasScore: number; fairness: number; explainability: string[] };
}

export interface ProjectState {
  projects: Project[];
  projectSearch: string;
}

export interface DataState {
  data: { [key: string]: any[] } | null;
  domain: string;
  sampleSize: number;
  algorithm: string;
  trainingResults: {
    accuracy: number;
    trainTime: number;
    modelSize: number;
    algorithm: string;
  } | null;
  // Additional properties used in MLPlatform.tsx
  useFaker: boolean;
  modelType: string;
  customParams: any;
  uploadedFileName?: string;
  reportFormat: 'word' | 'ppt';
  // NEW: Report structure and versions for edits
  reportStructure?: ReportStructure;
  reportVersions?: ReportStructure[]; // For undo/history
  // NEW: NLP, Vision, Speech results
  nlpResults?: { sentiment: string; entities: any[]; keyPhrases: string[] };
  visionResults?: { objects: any[]; ocrText: string };
  speechResults?: { transcript: string; language: string };
  // NEW: Deployed model info
  deployedModel?: { id: string; endpoint: string; format: 'onnx' | 'pmml' };
  // NEW: Governance metrics for dataset analysis
  governanceMetrics?: { biasScore: number; fairness: number; explainability: string[] };
}

export interface LoadingState {
  data: boolean;
  training: boolean;
  generation: boolean;
  openai: boolean;
  reports: boolean;
  chat: boolean;
  // Additional loading states
  analysis: boolean;
  report: boolean;
  // NEW: Loadings for new features
  nlp: boolean;
  vision: boolean;
  speech: boolean;
  discovery: boolean;
  deployment: boolean;
}

export interface UIState {
  error: string | null;
  success: string | null;
  info: string | null;
  // Additional UI states used in MLPlatform.tsx
  useLocalModel: boolean;
  localModelStatus: 'loading' | 'ready' | 'error' | 'idle';
  showDataPreview: boolean;
  modelLoadingProgress: number;
  // NEW: UI for governance
  showGovernance: boolean;
}

export interface Project {
  id: string;
  name: string;
  data: { [key: string]: any[] } | null;
  createdAt: string;
  // Additional properties to match types.ts Project interface
  domain: string;
  sampleSize: number;
  modelType: string;
  trainingResults: DataState['trainingResults'];
  useFaker: boolean;
  customParams: any;
  uploadedFileName?: string;
  reportFormat: 'word' | 'ppt';
  // NEW: Include new states in projects
  nlpResults?: DataState['nlpResults'];
  visionResults?: DataState['visionResults'];
  speechResults?: DataState['speechResults'];
  deployedModel?: DataState['deployedModel'];
}

// Initial states (unchanged, but extended types handle new fields)
export const initialChatState: ChatState = {
  messages: [],
  goalDescription: '',
  attachedFiles: [],
  goalAnalysis: null,
  dataShareConsent: false,
  encryptionEnabled: true,
  anonymizationLevel: 'basic',
  encryptionKey: undefined,
  workflowPlans: [],
  activeWorkflow: undefined,
  workflowSuggestions: [],
  governanceMetrics: undefined // NEW
};

export const initialProjectState: ProjectState = {
  projects: [],
  projectSearch: ''
};

export const initialDataState: DataState = {
  data: null,
  domain: '',
  sampleSize: 100,
  algorithm: 'linear-regression',
  trainingResults: null,
  // Additional properties
  useFaker: false,
  modelType: 'linear-regression',
  customParams: null,
  uploadedFileName: undefined,
  reportFormat: 'word',
  // NEW: Report structure and versions for edits
  reportStructure: undefined,
  reportVersions: [],
  // NEW: NLP, Vision, Speech results
  nlpResults: undefined,
  visionResults: undefined,
  speechResults: undefined,
  // NEW: Deployed model info
  deployedModel: undefined,
  // NEW: Governance metrics for dataset analysis
  governanceMetrics: undefined
};

export const initialLoadingState: LoadingState = {
  data: false,
  training: false,
  generation: false,
  openai: false,
  reports: false,
  chat: false,
  // Additional loading states
  analysis: false,
  report: false,
  // NEW: Loadings for new features
  nlp: false,
  vision: false,
  speech: false,
  discovery: false,
  deployment: false
};

export const initialUIState: UIState = {
  error: null,
  success: null,
  info: null,
  // Additional UI states
  useLocalModel: false,
  localModelStatus: 'idle',
  showDataPreview: false,
  modelLoadingProgress: 0,
  // NEW: UI for governance
  showGovernance: false
};

// Action types (extended)
export type ChatAction = 
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_GOAL_DESCRIPTION'; payload: string }
  | { type: 'ADD_FILE'; payload: File }
  | { type: 'REMOVE_FILE'; payload: number }
  | { type: 'CLEAR_ATTACHMENTS' }
  | { type: 'SET_GOAL_ANALYSIS'; payload: { feasibility: number; complexity: number } }
  // Missing action type used in MLPlatform.tsx
  | { type: 'ATTACH_FILES'; payload: File[] }
  // Privacy and workflow actions
  | { type: 'SET_DATA_SHARE_CONSENT'; payload: boolean }
  | { type: 'SET_ENCRYPTION_ENABLED'; payload: boolean }
  | { type: 'SET_ANONYMIZATION_LEVEL'; payload: 'none' | 'basic' | 'strict' }
  | { type: 'SET_ENCRYPTION_KEY'; payload: string }
  | { type: 'ADD_WORKFLOW_PLAN'; payload: WorkflowPlan }
  | { type: 'UPDATE_WORKFLOW_STEP'; payload: { workflowId: string; stepId: string; updates: Partial<WorkflowStep> } }
  | { type: 'SET_ACTIVE_WORKFLOW'; payload: string | undefined }
  | { type: 'SET_WORKFLOW_SUGGESTIONS'; payload: WorkflowStep[] }
  | { type: 'CLEAR_WORKFLOW_PLANS' }
  | { type: 'SET_GOVERNANCE_METRICS'; payload: ChatState['governanceMetrics'] };

export type ProjectAction = 
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SET_SEARCH'; payload: string };

export type DataAction = 
  | { type: 'SET_DATA'; payload: { [key: string]: any[] } }
  | { type: 'SET_DOMAIN'; payload: string }
  | { type: 'SET_SAMPLE_SIZE'; payload: number }
  | { type: 'SET_ALGORITHM'; payload: string }
  | { type: 'SET_TRAINING_RESULTS'; payload: { accuracy: number; trainTime: number; modelSize: number; algorithm: string } }
  | { type: 'CLEAR_DATA' }
  // Missing action types used in MLPlatform.tsx
  | { type: 'SET_MODEL_TYPE'; payload: string }
  | { type: 'SET_USE_FAKER'; payload: boolean }
  | { type: 'SET_CUSTOM_PARAMS'; payload: any }
  | { type: 'SET_UPLOADED_FILE_NAME'; payload: string }
  | { type: 'SET_REPORT_FORMAT'; payload: 'word' | 'ppt' }
  // NEW: Report editing actions
  | { type: 'SET_REPORT_STRUCTURE'; payload: ReportStructure }
  | { type: 'EDIT_REPORT_SECTION'; payload: { sectionId: string; updates: Partial<ReportSection> } }
  | { type: 'ADD_REPORT_SECTION'; payload: ReportSection }
  | { type: 'DELETE_REPORT_SECTION'; payload: string }
  | { type: 'UNDO_REPORT_EDIT' }
  // NEW: Watson-like AI results
  | { type: 'SET_NLP_RESULTS'; payload: DataState['nlpResults'] }
  | { type: 'SET_VISION_RESULTS'; payload: DataState['visionResults'] }
  | { type: 'SET_SPEECH_RESULTS'; payload: DataState['speechResults'] }
  | { type: 'SET_DEPLOYED_MODEL'; payload: DataState['deployedModel'] }
  | { type: 'SET_GOVERNANCE_METRICS'; payload: DataState['governanceMetrics'] };

// Reducers (extended with new cases)
export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_GOAL_DESCRIPTION':
      return { ...state, goalDescription: action.payload };
    case 'ADD_FILE':
      return { ...state, attachedFiles: [...state.attachedFiles, action.payload] };
    case 'REMOVE_FILE':
      return { ...state, attachedFiles: state.attachedFiles.filter((_, index) => index !== action.payload) };
    case 'CLEAR_ATTACHMENTS':
      return { ...state, attachedFiles: [] };
    case 'SET_GOAL_ANALYSIS':
      return { ...state, goalAnalysis: action.payload };
    case 'SET_DATA_SHARE_CONSENT':
      return { ...state, dataShareConsent: action.payload };
    case 'SET_ENCRYPTION_ENABLED':
      return { ...state, encryptionEnabled: action.payload };
    case 'SET_ANONYMIZATION_LEVEL':
      return { ...state, anonymizationLevel: action.payload };
    case 'SET_ENCRYPTION_KEY':
      return { ...state, encryptionKey: action.payload };
    case 'ADD_WORKFLOW_PLAN':
      return { ...state, workflowPlans: [...state.workflowPlans, action.payload] };
    case 'UPDATE_WORKFLOW_STEP':
      return {
        ...state,
        workflowPlans: state.workflowPlans.map(plan =>
          plan.id === action.payload.workflowId
            ? {
                ...plan,
                steps: plan.steps.map(step =>
                  step.id === action.payload.stepId
                    ? { ...step, ...action.payload.updates }
                    : step
                )
              }
            : plan
        )
      };
    case 'SET_ACTIVE_WORKFLOW':
      return { ...state, activeWorkflow: action.payload };
    case 'SET_WORKFLOW_SUGGESTIONS':
      return { ...state, workflowSuggestions: action.payload };
    case 'CLEAR_WORKFLOW_PLANS':
      return { ...state, workflowPlans: [], activeWorkflow: undefined };
    case 'SET_GOVERNANCE_METRICS': // NEW
      return { ...state, governanceMetrics: action.payload };
    default:
      return state;
  }
};

export const projectReducer = (state: ProjectState, action: ProjectAction): ProjectState => {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.payload) };
    case 'SET_SEARCH':
      return { ...state, projectSearch: action.payload };
    default:
      return state;
  }
};

export const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload };
    case 'SET_DOMAIN':
      return { ...state, domain: action.payload };
    case 'SET_SAMPLE_SIZE':
      return { ...state, sampleSize: action.payload };
    case 'SET_ALGORITHM':
      return { ...state, algorithm: action.payload };
    case 'SET_TRAINING_RESULTS':
      return { ...state, trainingResults: action.payload };
    case 'CLEAR_DATA':
      return { ...state, data: null, domain: '', trainingResults: null };
    case 'SET_REPORT_STRUCTURE': // NEW
      return { ...state, reportStructure: action.payload, reportVersions: [...(state.reportVersions || []), action.payload] };
    case 'EDIT_REPORT_SECTION': // NEW
      if (!state.reportStructure) return state;
      const updatedSections = state.reportStructure.sections.map(section =>
        section.id === action.payload.sectionId ? { ...section, ...action.payload.updates } : section
      );
      const updatedStructure = { ...state.reportStructure, sections: updatedSections };
      return { ...state, reportStructure: updatedStructure, reportVersions: [...(state.reportVersions || []), updatedStructure] };
    case 'ADD_REPORT_SECTION': // NEW
      if (!state.reportStructure) return state;
      const newSections = [...state.reportStructure.sections, { ...action.payload, id: Date.now().toString() }];
      const newStructure = { ...state.reportStructure, sections: newSections };
      return { ...state, reportStructure: newStructure, reportVersions: [...(state.reportVersions || []), newStructure] };
    case 'DELETE_REPORT_SECTION': // NEW
      if (!state.reportStructure) return state;
      const filteredSections = state.reportStructure.sections.filter(section => section.id !== action.payload);
      const deletedStructure = { ...state.reportStructure, sections: filteredSections };
      return { ...state, reportStructure: deletedStructure, reportVersions: [...(state.reportVersions || []), deletedStructure] };
    case 'UNDO_REPORT_EDIT': // NEW
      if (!state.reportVersions || state.reportVersions.length < 2) return state;
      const previousVersions = [...state.reportVersions];
      previousVersions.pop(); // Remove current
      return { ...state, reportStructure: previousVersions[previousVersions.length - 1], reportVersions: previousVersions };
    case 'SET_NLP_RESULTS': // NEW
      return { ...state, nlpResults: action.payload };
    case 'SET_VISION_RESULTS': // NEW
      return { ...state, visionResults: action.payload };
    case 'SET_SPEECH_RESULTS': // NEW
      return { ...state, speechResults: action.payload };
    case 'SET_DEPLOYED_MODEL': // NEW
      return { ...state, deployedModel: action.payload };
    case 'SET_GOVERNANCE_METRICS': // NEW - For dataset governance analysis
      return { ...state, governanceMetrics: action.payload };
    default:
      return state;
  }
};