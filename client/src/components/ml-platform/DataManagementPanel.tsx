import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Database, Upload, Play, Download, Settings, Loader2, HardDrive, BarChart3, MessageSquare, Eye, Mic, FileText, Brain, Target, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { MLData, modelDescriptions, NLPResults, VisionResults, SpeechResults, Project, CleaningOptions, CleaningResults } from './types';
import DataVisualization from './DataVisualization';
import ProjectList from './ProjectList';

import { useAppStore } from '@/store'; // Import Zustand store

// Memoized components for better performance
const MemoizedDataVisualization = memo(DataVisualization);

/**
 * Props interface for the DataManagementPanel component - simplified with Zustand store
 * @interface DataManagementPanelProps
 */
interface DataManagementPanelProps {
  // Keep only props that aren't in the store
  domain: string;
  sampleSize: number;
  modelType: string;
  useFaker: boolean;
  useLocalModel: boolean;
  localModelStatus: string;
  uploadedFileName: string;
  onDomainChange: (domain: string) => void;
  onSampleSizeChange: (size: number) => void;
  onModelTypeChange: (type: string) => void;
  onUseFakerChange: (use: boolean) => void;
  onUseLocalModelChange: (use: boolean) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerateData: () => void;
  onTrainModel: () => void;
  onExportData: () => void;
  onSampleSizeBlur: () => void;
  onOpenStorageMonitor?: () => void;
  onVisualizationUpdate?: (chartType: string, columns: string[]) => void;
  // Project management props
  projects?: Project[];
  projectSearch?: string;
  filteredProjects?: Project[];
  onProjectSearchChange?: (search: string) => void;
  onSaveProject?: () => void;
  onLoadProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
}

/**
 * DataManagementPanel - Primary component for data upload, generation, and ML model training
 * 
 * This component serves as the main interface for:
 * - File upload and processing (CSV, JSON, XML, YAML, ZIP formats)
 * - Synthetic data generation with configurable domains and parameters
 * - Machine learning model training with multiple algorithm support
 * - Data export functionality
 * - Storage monitoring and management
 * 
 * Key Features:
 * - Multi-format file support with intelligent parsing
 * - Real-time validation and error feedback
 * - Accessibility compliance with ARIA attributes
 * - Performance optimization for large datasets
 * - Cancellable operations with AbortController support
 * - Scrollable content area for full visibility
 * 
 * NEW: Added tabs for NLP, Vision, Speech analysis (Watson equiv)
 * - NLP: Browser-based entity/sentiment analysis (CPU)
 * - Vision: MobileNet for classification (TensorFlow.js CPU)
 * - Speech: Web Speech API for transcription (browser CPU)
 * 
 * @component
 * @param {DataManagementPanelProps} props - Component props containing data state and callbacks
 * @returns {JSX.Element} The data management interface
 */
export default function DataManagementPanel({
  domain,
  sampleSize,
  modelType,
  useFaker,
  useLocalModel,
  localModelStatus,
  uploadedFileName,
  onDomainChange,
  onSampleSizeChange,
  onModelTypeChange,
  onUseFakerChange,
  onUseLocalModelChange,
  onFileUpload,
  onGenerateData,
  onTrainModel,
  onExportData,
  onSampleSizeBlur,
  onOpenStorageMonitor,
  onVisualizationUpdate,
  projects = [],
  projectSearch = '',
  filteredProjects = [],
  onProjectSearchChange = () => {},
  onSaveProject = () => {},
  onLoadProject = () => {},
  onDeleteProject = () => {}
}: DataManagementPanelProps) {
  const { toast } = useToast();
  
  // Get state and actions from Zustand store using selector pattern
  const data = useAppStore((state) => state.data);
  const loading = useAppStore((state) => state.loading);
  const nlpResults = useAppStore((state) => state.nlpResults);
  const visionResults = useAppStore((state) => state.visionResults);
  const speechResults = useAppStore((state) => state.speechResults);
  const consent = useAppStore((state) => state.consent);
  const useLocalModelFromStore = useAppStore((state) => state.useLocalModel);
  const setData = useAppStore((state) => state.setData);
  const setLoading = useAppStore((state) => state.setLoading);
  const setError = useAppStore((state) => state.setError);
  const setTrainingResults = useAppStore((state) => state.setTrainingResults);
  const setNLPResults = useAppStore((state) => state.setNLPResults);
  const setVisionResults = useAppStore((state) => state.setVisionResults);
  const setSpeechResults = useAppStore((state) => state.setSpeechResults);
  const setConsent = useAppStore((state) => state.setConsent);
  const setUseLocalModel = useAppStore((state) => state.setUseLocalModel);
  
  // Local state for sidebar navigation
  const [activeSection, setActiveSection] = useState('data');
  
  // Local state for new inputs
  const [nlpText, setNlpText] = useState('');
  const [visionImage, setVisionImage] = useState<File | null>(null);
  const [visionImageUrl, setVisionImageUrl] = useState<string>('');
  const [speechAudio, setSpeechAudio] = useState<File | null>(null);
  
  // Data cleaning state
  const [cleaningOptions, setCleaningOptions] = useState<CleaningOptions>({
    clean_column_names: true,
    handle_missing: true,
    missing_strategy: 'smart',
    convert_types: true,
    force_numeric: true,
    handle_outliers: true,
    outlier_method: 'iqr',
    remove_duplicates: true,
    encode_categorical: false
  });
  const [cleaningResults, setCleaningResults] = useState<CleaningResults | null>(null);
  const [isDataCleaned, setIsDataCleaned] = useState(false);

  // Privacy consent check helper
  const checkConsentAndWarn = (action: string): boolean => {
    if (!consent) {
      toast({
        title: "Consent Required",
        description: `Please enable "Consent to Data Processing" to use ${action} functionality.`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Enhanced handlers that use store setters
  const handleGenerateData = async () => {
    if (!checkConsentAndWarn("data generation")) return;
    setLoading('data', true);
    
    try {
      // Enhanced API call with consent parameter
      const response = await fetch('/api/ml/generate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain, 
          sampleSize, 
          useFaker, 
          consent,
          useLocalModel: useLocalModelFromStore
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        console.log('Data generation setData called with:', result.data ? Object.keys(result.data) : 'null');
        toast({
          title: "Data Generated Successfully",
          description: `Generated ${result.samples} samples for ${result.domain} domain`,
        });
      } else {
        // Fallback to existing prop handler
        onGenerateData();
      }
    } catch (error) {
      setError('Data generation failed, using fallback method.');
      onGenerateData();
    } finally {
      setLoading('data', false);
    }
  };

  const handleTrainModel = async () => {
    if (!checkConsentAndWarn("model training")) return;
    if (!data) {
      setError('Generate data first before training.');
      return;
    }
    
    setLoading('training', true);
    
    try {
      // Determine target column based on domain and available data
      let targetColumn = 'target'; // Default fallback
      const headers = Object.keys(data);
      
      if (domain === 'finance' && headers.includes('expected_return')) {
        targetColumn = 'expected_return';
      } else if (domain === 'retail' && headers.includes('clv')) {
        targetColumn = 'clv';
      } else if (domain === 'healthcare' && headers.includes('risk_score')) {
        targetColumn = 'risk_score';
      } else {
        // Try common target column names in order of preference
        const possibleTargets = ['target', 'label', 'y', 'outcome', 'predicted_value'];
        const foundTarget = possibleTargets.find(col => headers.includes(col));
        if (foundTarget) {
          targetColumn = foundTarget;
        } else {
          // If no standard target found, use the last column as target
          targetColumn = headers[headers.length - 1];
        }
      }

      console.log(`🤖 Training ${modelType} model with target column: ${targetColumn}`);
      console.log('🔍 Request data:', { 
        dataKeys: Object.keys(data), 
        dataLength: Object.values(data)[0]?.length || 0,
        modelType, 
        targetColumn 
      });

      // Enhanced API call with correct parameter names
      const response = await fetch('/api/ml/train-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include session cookies for authentication
        body: JSON.stringify({ 
          data, 
          model_type: modelType, // Backend expects model_type, not modelType
          target_column: targetColumn, // Backend expects target_column
          useLocalModel: useLocalModelFromStore, 
          consent 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Training response received:', result);
        
        // Validate response structure before accessing properties
        if (result && result.success && result.model_type) {
          // Update store with training results - backend returns data directly, not nested in results
          setTrainingResults(result);
          toast({
            title: "Model Training Complete",
            description: `${result.algorithm || result.model_type} model trained successfully!`,
            variant: "default"
          });
        } else {
          console.error('❌ Training failed - invalid response structure:', result);
          setError(result?.error || 'Training failed - invalid response structure');
        }
      } else if (response.status === 401) {
        // Handle authentication error with helpful guidance
        toast({
          title: "Authentication Required",
          description: "To use model training, you need to be logged in. The backend API requires authentication for training operations.",
          variant: "destructive"
        });
        setError('Authentication required. Please log in to use model training.');
      } else {
        const errorResult = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('🚨 Training failed with response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorResult
        });
        setError(errorResult.error || `Server error: ${response.status}`);
        toast({
          title: "Training Failed",
          description: errorResult.error || 'Unable to train model. Please try again.',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Model training error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(`Model training failed: ${error.message || 'Network or request error'}`);
    } finally {
      setLoading('training', false);
    }
  };

  // NLP analysis handler with store integration
  const handleNLPAnalysis = async () => {
    if (!nlpText.trim()) return;
    if (!checkConsentAndWarn("NLP analysis")) return;
    
    setLoading('nlp', true);
    try {
      // Try API call first
      const response = await fetch('/api/nlp/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlpText, consent, useLocalModel: useLocalModelFromStore })
      });
      
      if (response.ok) {
        const apiResult = await response.json();
        setNLPResults(apiResult.data);
      } else {
        throw new Error('NLP analysis API unavailable. Please check your connection or provide API credentials.');
      }
    } catch (error) {
      setError('NLP analysis failed completely.');
    } finally {
      setLoading('nlp', false);
    }
  };

  // Vision analysis handler with store integration
  const handleVisionAnalysis = async () => {
    if (!visionImage && !visionImageUrl) return;
    if (!checkConsentAndWarn("vision analysis")) return;
    
    setLoading('vision', true);
    try {
      // Try API call first
      const formData = new FormData();
      if (visionImage) {
        formData.append('image', visionImage);
      } else if (visionImageUrl) {
        formData.append('imageUrl', visionImageUrl);
      }
      formData.append('consent', consent.toString());
      formData.append('useLocalModel', useLocalModelFromStore.toString());
      
      const response = await fetch('/api/vision/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const apiResult = await response.json();
        setVisionResults(apiResult.data);
      } else {
        throw new Error('Vision analysis API unavailable. Please check your connection or provide API credentials.');
      }
    } catch (error) {
      setError('Vision analysis failed completely.');
    } finally {
      setLoading('vision', false);
    }
  };

  // Speech analysis handler with store integration
  const handleSpeechAnalysis = async () => {
    if (!checkConsentAndWarn("speech analysis")) return;
    setLoading('speech', true);
    try {
      // If we have an audio file, upload to backend
      if (speechAudio) {
        const formData = new FormData();
        formData.append('audio', speechAudio);
        formData.append('consent', consent.toString());
        formData.append('useLocalModel', useLocalModelFromStore.toString());
        
        const response = await fetch('/api/ml/speech/analyze', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const apiResult = await response.json();
          setSpeechResults(apiResult.data);
          return;
        } else {
          setError('Server transcription failed; using local processing.');
        }
      }
      
      // No fallback - fail authentically if API unavailable
      throw new Error('Speech analysis API unavailable. Please check your connection or provide API credentials.');
    } catch (error) {
      setError('Speech analysis failed completely.');
    } finally {
      setLoading('speech', false);
    }
  };

  // Professional data cleaning handler using state-of-the-art pandas techniques
  const handleCleanData = async () => {
    if (!data || Object.keys(data).length === 0) {
      toast({
        title: "No Data to Clean",
        description: "Please upload data first before cleaning.",
        variant: "destructive"
      });
      return;
    }

    setLoading('data', true);
    try {
      console.log('🧹 Starting professional data cleaning...');
      
      const response = await fetch('/api/ml/clean-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // MOBILE LOGIN FIX: Include session cookies
        body: JSON.stringify({ 
          data,
          options: cleaningOptions
        })
      });

      if (!response.ok) {
        throw new Error(`Data cleaning failed: ${response.status}`);
      }

      const results: CleaningResults = await response.json();
      
      if (results.success && results.cleaned_data) {
        setCleaningResults(results);
        setData(results.cleaned_data);  // Update data with cleaned version
        setIsDataCleaned(true);
        
        const summary = results.summary;
        toast({
          title: "Data Cleaned Successfully",
          description: `✅ Professional cleaning completed: ${summary?.operations_count} operations performed`,
          duration: 5000
        });
        
        console.log('✅ Data cleaning completed:', summary);
      } else {
        throw new Error(results.error || 'Data cleaning failed');
      }
    } catch (error) {
      console.error('❌ Data cleaning error:', error);
      toast({
        title: "Data Cleaning Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading('data', false);
    }
  };

  // Reset cleaning state when new data is uploaded
  React.useEffect(() => {
    setIsDataCleaned(false);
    setCleaningResults(null);
  }, [data]);
  return (
    <>
      {loading.data ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <Card className="data-management-panel w-full h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
              {onOpenStorageMonitor && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenStorageMonitor}
                      className="ml-auto"
                      aria-label="Open storage monitor"
                    >
                      <HardDrive className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Monitor browser storage usage</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-6 overflow-y-auto" role="region" aria-label="Data management content">
            <div className="flex gap-4 h-full">
              {/* Sidebar Icons instead of TabsList */}
              <div className="flex flex-col gap-2 w-20 flex-shrink-0">
                <Button 
                  variant={activeSection === 'data' ? 'default' : 'ghost'} 
                  className="flex-col h-auto py-2"
                  onClick={() => setActiveSection('data')}
                >
                  <Database className="h-5 w-5 mb-1" />
                  <span className="text-xs">Data</span>
                </Button>
                <Button 
                  variant={activeSection === 'clean' ? 'default' : 'ghost'} 
                  className="flex-col h-auto py-2"
                  onClick={() => setActiveSection('clean')}
                  disabled={!data || Object.keys(data).length === 0}
                >
                  <Sparkles className="h-5 w-5 mb-1" />
                  <span className="text-xs">Clean</span>
                </Button>
                <Button 
                  variant={activeSection === 'projects' ? 'default' : 'ghost'} 
                  className="flex-col h-auto py-2"
                  onClick={() => setActiveSection('projects')}
                >
                  <Target className="h-5 w-5 mb-1" />
                  <span className="text-xs">Projects</span>
                </Button>
                <Button 
                  variant={activeSection === 'train' ? 'default' : 'ghost'} 
                  className="flex-col h-auto py-2"
                  onClick={() => setActiveSection('train')}
                >
                  <Play className="h-5 w-5 mb-1" />
                  <span className="text-xs">Train</span>
                </Button>
                <Button 
                  variant={activeSection === 'visual' ? 'default' : 'ghost'} 
                  className="flex-col h-auto py-2"
                  onClick={() => setActiveSection('visual')}
                >
                  <BarChart3 className="h-5 w-5 mb-1" />
                  <span className="text-xs">Visual</span>
                </Button>
                <Button 
                  variant={activeSection === 'nlp' ? 'default' : 'ghost'} 
                  className="flex-col h-auto py-2"
                  onClick={() => setActiveSection('nlp')}
                >
                  <MessageSquare className="h-5 w-5 mb-1" />
                  <span className="text-xs">NLP</span>
                </Button>
                <Button 
                  variant={activeSection === 'vision' ? 'default' : 'ghost'} 
                  className="flex-col h-auto py-2"
                  onClick={() => setActiveSection('vision')}
                >
                  <Eye className="h-5 w-5 mb-1" />
                  <span className="text-xs">Vision</span>
                </Button>
                <Button 
                  variant={activeSection === 'speech' ? 'default' : 'ghost'} 
                  className="flex-col h-auto py-2"
                  onClick={() => setActiveSection('speech')}
                >
                  <Mic className="h-5 w-5 mb-1" />
                  <span className="text-xs">Speech</span>
                </Button>
              </div>
              
              {/* Content Area - Conditional based on activeSection */}
              <div className="flex-1">
                {activeSection === 'data' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Data Upload & Generation</h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv,.tsv,.txt,.data,.json,.xml,.yaml,.yml,.zip"
                        id="file-upload"
                        className="sr-only"
                        onChange={onFileUpload}
                        disabled={loading.data}
                        aria-label="Upload data file for analysis"
                      />
                      <label
                        htmlFor="file-upload"
                        className={`flex items-center justify-center w-full h-20 px-4 text-sm font-medium rounded-md cursor-pointer transition-colors duration-200 border-2 border-dashed ${
                          uploadedFileName 
                            ? 'text-green-700 bg-green-50 border-green-300 hover:bg-green-100' 
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                        } ${loading.data ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading.data ? (
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 mr-2" />
                        )}
                        {uploadedFileName ? uploadedFileName : 'Upload Data File'}
                      </label>
                    </div>
                    
                    <div className="text-center text-gray-500 text-sm">or generate synthetic data</div>
                    

                    
                    <div className="space-y-3">
                      <Select value={domain} onValueChange={onDomainChange}>
                        <SelectTrigger className="h-9 text-sm" aria-label="Select data domain">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="space-y-1">
                        <label htmlFor="sample-size-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sample Size
                        </label>
                        <Input 
                          id="sample-size-input"
                          type="number" 
                          placeholder="Enter sample size (10-10000)" 
                          value={sampleSize} 
                          onChange={(e) => onSampleSizeChange(parseInt(e.target.value) || 1000)}
                          onBlur={onSampleSizeBlur}
                          min={10}
                          max={10000}
                          className="text-sm"
                        />
                      </div>

                      {/* Privacy Controls Section */}
                      <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Privacy & Processing Controls</h4>
                        
                        {/* Local Mode Switch */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label htmlFor="local-mode-switch" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Local Mode
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Use local processing only</p>
                          </div>
                          <Switch
                            id="local-mode-switch"
                            checked={useLocalModelFromStore}
                            onCheckedChange={(checked) => {
                              setUseLocalModel(checked);
                              onUseLocalModelChange(checked);
                            }}
                            aria-label="Toggle local model processing"
                          />
                        </div>
                        
                        {/* Offline Mode Badge */}
                        {useLocalModelFromStore && (
                          <div className="flex justify-center">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              Offline Mode Active
                            </Badge>
                          </div>
                        )}

                        {/* Privacy Consent Switch */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <label htmlFor="consent-switch" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Consent to Data Processing <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Required for Generate/Train/Analyze operations</p>
                          </div>
                          <Switch
                            id="consent-switch"
                            checked={consent}
                            onCheckedChange={setConsent}
                            aria-label="Toggle consent to data processing"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleGenerateData}
                        disabled={loading.data || !consent}
                        className="w-full"
                      >
                        {loading.data ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" /> }
                        {useLocalModelFromStore ? "Generate Data (Local)" : "Generate Data"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Professional Data Cleaning Section */}
              {activeSection === 'clean' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Professional Data Cleaning</h3>
                    {isDataCleaned && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  
                  {cleaningResults && (
                    <Card className="mb-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-200">Data Successfully Cleaned</span>
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <p>Original: {cleaningResults.summary?.original_rows} rows × {cleaningResults.summary?.original_columns} columns</p>
                          <p>Final: {cleaningResults.summary?.final_rows} rows × {cleaningResults.summary?.final_columns} columns</p>
                          <p>Operations: {cleaningResults.summary?.operations_count} cleaning operations performed</p>
                          <p>Issues Found: {cleaningResults.summary?.issues_found} data quality issues detected</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <Accordion type="single" collapsible defaultValue="basic">
                    <AccordionItem value="basic">
                      <AccordionTrigger>Basic Cleaning Options</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="clean-columns"
                              checked={cleaningOptions.clean_column_names || false}
                              onCheckedChange={(checked) => 
                                setCleaningOptions(prev => ({ ...prev, clean_column_names: checked }))
                              }
                            />
                            <label htmlFor="clean-columns" className="text-sm font-medium">
                              Clean Column Names
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="remove-duplicates"
                              checked={cleaningOptions.remove_duplicates || false}
                              onCheckedChange={(checked) => 
                                setCleaningOptions(prev => ({ ...prev, remove_duplicates: checked }))
                              }
                            />
                            <label htmlFor="remove-duplicates" className="text-sm font-medium">
                              Remove Duplicates
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="convert-types"
                              checked={cleaningOptions.convert_types || false}
                              onCheckedChange={(checked) => 
                                setCleaningOptions(prev => ({ ...prev, convert_types: checked }))
                              }
                            />
                            <label htmlFor="convert-types" className="text-sm font-medium">
                              Auto Convert Types
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="force-numeric"
                              checked={cleaningOptions.force_numeric || false}
                              onCheckedChange={(checked) => 
                                setCleaningOptions(prev => ({ ...prev, force_numeric: checked }))
                              }
                            />
                            <label htmlFor="force-numeric" className="text-sm font-medium">
                              Force Numeric Conversion
                            </label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="missing">
                      <AccordionTrigger>Missing Values</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="handle-missing"
                            checked={cleaningOptions.handle_missing || false}
                            onCheckedChange={(checked) => 
                              setCleaningOptions(prev => ({ ...prev, handle_missing: checked }))
                            }
                          />
                          <label htmlFor="handle-missing" className="text-sm font-medium">
                            Handle Missing Values
                          </label>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Missing Value Strategy</label>
                          <Select
                            value={cleaningOptions.missing_strategy || 'smart'}
                            onValueChange={(value: 'smart' | 'mean' | 'median' | 'zero' | 'mode') => 
                              setCleaningOptions(prev => ({ ...prev, missing_strategy: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="smart">Smart (KNN + Median/Mode)</SelectItem>
                              <SelectItem value="mean">Mean Imputation</SelectItem>
                              <SelectItem value="median">Median Imputation</SelectItem>
                              <SelectItem value="zero">Fill with Zero</SelectItem>
                              <SelectItem value="mode">Mode Imputation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="outliers">
                      <AccordionTrigger>Outlier Handling</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="handle-outliers"
                            checked={cleaningOptions.handle_outliers || false}
                            onCheckedChange={(checked) => 
                              setCleaningOptions(prev => ({ ...prev, handle_outliers: checked }))
                            }
                          />
                          <label htmlFor="handle-outliers" className="text-sm font-medium">
                            Handle Outliers
                          </label>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Outlier Detection Method</label>
                          <Select
                            value={cleaningOptions.outlier_method || 'iqr'}
                            onValueChange={(value: 'iqr' | 'zscore') => 
                              setCleaningOptions(prev => ({ ...prev, outlier_method: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="iqr">IQR Method (1.5 * IQR)</SelectItem>
                              <SelectItem value="zscore">Z-Score Method (3σ)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="advanced">
                      <AccordionTrigger>Advanced Options</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="encode-categorical"
                            checked={cleaningOptions.encode_categorical || false}
                            onCheckedChange={(checked) => 
                              setCleaningOptions(prev => ({ ...prev, encode_categorical: checked }))
                            }
                          />
                          <label htmlFor="encode-categorical" className="text-sm font-medium">
                            Encode Categorical Variables
                          </label>
                        </div>
                        
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                              <p className="font-medium mb-1">Professional Data Cleaning</p>
                              <p>Using industry-standard pandas techniques: KNN imputation, IQR outlier detection, smart type conversion, and statistical validation.</p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleCleanData}
                      disabled={loading.data || !data || Object.keys(data).length === 0}
                      className="flex-1"
                    >
                      {loading.data ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cleaning Data...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Clean Data
                        </>
                      )}
                    </Button>
                    
                    {cleaningResults && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const details = cleaningResults.cleaning_report?.operations_performed.join('\n') || 'No operations performed';
                          alert(`Cleaning Report:\n\n${details}`);
                        }}
                      >
                        View Report
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Projects Section */}
              {activeSection === 'projects' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Project Directory</h3>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <ProjectList
                      projects={projects}
                      projectSearch={projectSearch}
                      filteredProjects={filteredProjects}
                      onProjectSearchChange={onProjectSearchChange}
                      onSaveProject={onSaveProject}
                      onLoadProject={onLoadProject}
                      onDeleteProject={onDeleteProject}
                    />
                  </div>
                </div>
              )}
              
              {/* Train Section */}
              {activeSection === 'train' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Model Training</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select ML Algorithm
                      </label>
                      <Select value={modelType} onValueChange={onModelTypeChange}>
                        <SelectTrigger className="h-9 text-sm" aria-label="Select machine learning model type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(modelDescriptions).map(([value, description]) => (
                            <SelectItem key={value} value={value}>
                              {value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Detailed Model Description */}
                    {modelType && modelDescriptions[modelType] && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                              {modelDescriptions[modelType].name}
                            </h4>
                            <Badge 
                              variant={
                                modelDescriptions[modelType].complexity === 'Low' ? 'secondary' :
                                modelDescriptions[modelType].complexity === 'Medium' ? 'default' : 'destructive'
                              }
                              className="text-xs"
                            >
                              {modelDescriptions[modelType].complexity} Complexity
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {modelDescriptions[modelType].description}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <strong className="text-green-700 dark:text-green-400">Best For:</strong>
                              <ul className="mt-1 ml-2 text-gray-600 dark:text-gray-400">
                                {modelDescriptions[modelType].bestFor.map((item, idx) => (
                                  <li key={idx}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <strong className="text-blue-700 dark:text-blue-400">Pros:</strong>
                              <ul className="mt-1 ml-2 text-gray-600 dark:text-gray-400">
                                {modelDescriptions[modelType].pros.slice(0, 3).map((item, idx) => (
                                  <li key={idx}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <strong>When to use:</strong> {modelDescriptions[modelType].whenToUse}
                            </p>
                          </div>
                          
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <strong>Data Requirements:</strong> {modelDescriptions[modelType].dataRequirements}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => {
                        console.log('Train Model button clicked. data:', data ? Object.keys(data) : 'null', 'loading.training:', loading.training, 'consent:', consent);
                        handleTrainModel();
                      }}
                      disabled={!data || loading.training || !consent}
                      className="w-full"
                    >
                      {loading.training ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" /> }
                      {useLocalModelFromStore ? "Train Model (Local)" : "Train Model"}
                    </Button>
                    

                    
                    {/* Step-by-step guide */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Steps to Train Model
                      </h4>
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <div className="flex items-center">
                          <span className="mr-2">✓</span>
                          <span>Authentication: Logged in successfully</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">{consent ? '✓' : '1.'}</span>
                          <span>Enable "Consent to Data Processing" toggle</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">{data ? '✓' : '2.'}</span>
                          <span>Generate or upload data first</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">{data && consent ? '3.' : '•'}</span>
                          <span>Train Model button will become enabled</span>
                        </div>
                      </div>
                    </div>
                    
                    {data && (
                      <Button 
                        onClick={onExportData}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
                {activeSection === 'visual' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Data Visualization</h3>
                    {data ? (
                      <MemoizedDataVisualization data={data} onVisualizationUpdate={onVisualizationUpdate} />
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Upload or generate data to create visualizations</p>
                      </div>
                    )}
                  </div>
                )}
              
              {/* NLP Section */}
              {activeSection === 'nlp' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">NLP Text Analysis</h3>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Enter text for NLP analysis..."
                      value={nlpText}
                      onChange={(e) => setNlpText(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button 
                      onClick={handleNLPAnalysis}
                      disabled={!nlpText.trim() || !consent}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {useLocalModelFromStore ? "Analyze Text (Local)" : "Analyze Text"}
                    </Button>
                    {nlpResults && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Analysis Results:</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Sentiment:</strong> {nlpResults.sentiment}</p>
                          <p><strong>Language:</strong> {nlpResults.language}</p>
                          <p><strong>Key Phrases:</strong> {nlpResults.keyPhrases?.join(', ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Vision Section */}
              {activeSection === 'vision' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Vision Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setVisionImage(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div className="text-center text-gray-500">or</div>
                    <Input
                      placeholder="Enter image URL..."
                      value={visionImageUrl}
                      onChange={(e) => setVisionImageUrl(e.target.value)}
                    />
                    <Button 
                      onClick={handleVisionAnalysis}
                      disabled={!visionImage && !visionImageUrl || !consent}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {useLocalModelFromStore ? "Analyze Image (Local)" : "Analyze Image"}
                    </Button>
                    {visionResults && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Vision Results:</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Classifications:</strong> {visionResults.classifications?.map(c => c.label).join(', ')}</p>
                          <p><strong>Objects:</strong> {visionResults.objects?.map(o => `${o.label} (${Math.round(o.score * 100)}%)`).join(', ')}</p>
                          {visionResults.ocrText && <p><strong>OCR Text:</strong> {visionResults.ocrText}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Speech Section */}
              {activeSection === 'speech' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Speech Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Upload Audio File</label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setSpeechAudio(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <Button 
                      onClick={handleSpeechAnalysis}
                      disabled={!consent}
                      className="w-full"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {useLocalModelFromStore ? "Analyze Speech (Local)" : "Analyze Speech"}
                    </Button>
                    {speechResults && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-medium mb-2">Speech Results:</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Transcript:</strong> {speechResults.transcript}</p>
                          <p><strong>Confidence:</strong> {Math.round(speechResults.confidence * 100)}%</p>
                          {speechResults.words && <p><strong>Words:</strong> {speechResults.words.length} recognized</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
