import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Database, BrainCircuit, Target, TrendingUp, Download, Send, Upload, Eye, X, Folder, File, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { renderAsync } from 'docx-preview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MLData {
  [key: string]: any[]; // Changed to any[] to handle mixed types
}

interface TrainingResults {
  model_type: string;
  best_model_type?: string; // For AutoML: the selected best model
  r2_score: number;
  mse: number;
  n_features: number;
  n_samples: number;
  test_size: number;
  additional_metrics?: {
    mae?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    feature_importance?: { [key: string]: number };
  };
}

interface OpenAIStatus {
  openai_available: boolean;
  api_key_format: string;
  client_created?: boolean;
  client_error?: string;
}

interface Project {
  id: string;
  name: string;
  data: MLData | null;
  domain: string;
  sampleSize: number;
  modelType: string;
  trainingResults: TrainingResults | null;
  goalDescription: string;
  goalAnalysis: any;
  messages: { role: 'user' | 'assistant'; content: string }[];
  useFaker: boolean;
  customParams: any;
  uploadedFileName: string;
  reportFormat: 'word' | 'ppt';
  useLocalModel: boolean;
}

export default function MLPlatform() {
  const [openaiStatus, setOpenaiStatus] = useState<OpenAIStatus | null>(null);
  const [data, setData] = useState<MLData | null>(null);
  const [domain, setDomain] = useState<string>('healthcare');
  const [sampleSize, setSampleSize] = useState<number>(1000);
  const [modelType, setModelType] = useState<string>('linear_regression');
  const [trainingResults, setTrainingResults] = useState<TrainingResults | null>(null);
  const [goalDescription, setGoalDescription] = useState<string>('');
  const [goalAnalysis, setGoalAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string>('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [useFaker, setUseFaker] = useState<boolean>(false);
  const [customParams, setCustomParams] = useState<any>(null);
  const [showDataPreview, setShowDataPreview] = useState<boolean>(false);
  const [reportFormat, setReportFormat] = useState<'word' | 'ppt'>('word');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    blob: Blob | null;
    format: 'word' | 'ppt';
    filename: string;
  }>({
    open: false,
    blob: null,
    format: 'word',
    filename: ''
  });
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [dataPreviewOpen, setDataPreviewOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [useLocalModel, setUseLocalModel] = useState<boolean>(false);
  const [localModelStatus, setLocalModelStatus] = useState<string>('idle'); // 'idle', 'loading', 'ready', 'error'
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const modelDescriptions: { [key: string]: string } = {
    linear_regression: 'Predicts continuous values using a linear equation.',
    logistic_regression: 'Classifies data into categories using a logistic function.',
    decision_tree: 'Uses a tree structure for decisions, good for interpretable models.',
    random_forest: 'Combines multiple decision trees for robust predictions.',
    gradient_boosting: 'Builds sequential trees to improve prediction accuracy.',
    xgboost: 'Optimized gradient boosting for high performance.',
    lightgbm: 'Fast gradient boosting optimized for large datasets.',
    catboost: 'Handles categorical data well with gradient boosting.',
    support_vector_machine: 'Finds optimal boundaries for classification or regression.',
    k_nearest_neighbors: 'Predicts based on nearest data points.',
    naive_bayes: 'Probabilistic classifier based on Bayes’ theorem.',
    neural_network: 'Deep learning model for complex patterns (requires GPU for best performance).',
    auto_ml: 'Automatically tests multiple models and selects the best one.',
    k_means: 'Clusters data into groups based on similarity.'
  };

  useEffect(() => {
    // Load projects from localStorage
    const savedProjects = localStorage.getItem('mlProjects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  useEffect(() => {
    // Save projects to localStorage
    localStorage.setItem('mlProjects', JSON.stringify(projects));
  }, [projects]);

  const saveProject = () => {
    const name = prompt('Enter project name:');
    if (!name) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name,
      data,
      domain,
      sampleSize,
      modelType,
      trainingResults,
      goalDescription,
      goalAnalysis,
      messages,
      useFaker,
      customParams,
      uploadedFileName,
      reportFormat,
      useLocalModel,
    };

    setProjects(prev => [...prev, newProject]);
    toast.success('Project saved!');
  };

  const loadProject = (project: Project) => {
    setData(project.data);
    setDomain(project.domain);
    setSampleSize(project.sampleSize);
    setModelType(project.modelType);
    setTrainingResults(project.trainingResults);
    setGoalDescription(project.goalDescription);
    setGoalAnalysis(project.goalAnalysis);
    setMessages(project.messages);
    setUseFaker(project.useFaker);
    setCustomParams(project.customParams);
    setUploadedFileName(project.uploadedFileName);
    setReportFormat(project.reportFormat);
    setUseLocalModel(project.useLocalModel);
    setSelectedProjectId(project.id);
    setShowDataPreview(!!project.data);
    toast.success(`Loaded project: ${project.name}`);
  };

  const deleteProject = (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
    toast.success('Project deleted');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const isExcel = file.name.toLowerCase().endsWith('.xls') || file.name.toLowerCase().endsWith('.xlsx');

    if (!isCSV && !isExcel) {
      toast.error('Please select a CSV or Excel file (.csv, .xls, .xlsx)');
      return;
    }

    if (isExcel) {
      toast.error('Excel files require conversion. Please save your Excel file as CSV format and upload again.');
      return;
    }

    if (!window.confirm('Confirm upload? Data will be processed securely in-memory, not stored persistently, and transmitted over HTTPS. For anonymization, ask the Associate to "anonymize data".')) {
      return;
    }

    setLoading(prev => ({ ...prev, data: true }));
    setError('');

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');

      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      if (rows.length > 5000 && !window.confirm(`Large dataset (${rows.length} rows). Proceed? This may impact performance.`)) {
        return;
      }

      const csvData: MLData = {};
      headers.forEach((header, index) => {
        csvData[header] = rows.map(row => {
          const value = row[index];
          const num = Number(value);
          return isNaN(num) ? value : num;
        });
      });

      setData(csvData);
      setUploadedFileName(file.name);
      setSampleSize(rows.length);
      toast.success(`CSV uploaded: ${file.name} (${rows.length} rows, ${headers.length} columns)`);
      setShowDataPreview(true);
      setDataPreviewOpen(true);

    } catch (err) {
      setError(`Failed to process CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error('CSV upload failed');
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
      event.target.value = '';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(prev => ({ ...prev, openai: true }));
      checkOpenAIStatus();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const checkOpenAIStatus = async () => {
    try {
      const response = await fetch('/api/ml/test-openai');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOpenaiStatus(result.openai_status);
        }
      }
    } catch (err) {
      console.error('Failed to check OpenAI status:', err);
      setOpenaiStatus({ openai_available: false, api_key_format: 'invalid', client_created: false });
      toast.error('Failed to check OpenAI status');
    } finally {
      setLoading(prev => ({ ...prev, openai: false }));
    }
  };

  const generateData = async (overrideParams: any = null) => {
    if (sampleSize < 10 || sampleSize > 10000) {
      toast.error('Sample size must be between 10 and 10000');
      return;
    }

    if (sampleSize > 5000 && !window.confirm(`Large sample size (${sampleSize}). Proceed? This may impact performance.`)) {
      return;
    }

    setLoading(prev => ({ ...prev, data: true }));
    setError('');

    try {
      const body: any = { domain, samples: sampleSize, useFaker };
      if (overrideParams || customParams) {
        body.custom_features = overrideParams || customParams;
      }
      const response = await fetch('/api/ml/generate-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (result.success) {
        const typedData: MLData = {};
        for (const key in result.data) {
          typedData[key] = result.data[key].map((value: any) => {
            const num = Number(value);
            return isNaN(num) ? value : num;
          });
        }
        setData(typedData);
        toast.success('Data generated successfully!');
        setShowDataPreview(true);
        setDataPreviewOpen(true);
      } else {
        setError(result.error || 'Failed to generate data');
      }
    } catch (err) {
      setError('Network error generating data');
      toast.error('Network error generating data');
    } finally {
      setLoading(prev => ({ ...prev, data: false }));
    }
  };

  const trainModel = async () => {
    if (!data) {
      setError('Generate data first');
      return;
    }

    if (sampleSize > 5000 && !window.confirm(`Large dataset (${sampleSize} samples). Proceed with training?`)) {
      return;
    }

    setLoading(prev => ({ ...prev, training: true }));
    setError('');

    try {
      const targetColumn = domain === 'healthcare' ? 'risk_score' : 'return';

      const response = await fetch('/api/ml/train-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data, 
          model_type: modelType,
          target_column: targetColumn 
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTrainingResults(result.results);
          toast.success('Model trained successfully!');
        } else {
          setError(result.error || 'Training failed');
        }
      } else {
        if (response.status === 413 || response.statusText === 'Request Entity Too Large') {
          setError('Dataset too large for server. Please reduce the number of samples or use a smaller CSV file.');
          toast.error('Dataset too large - please use fewer samples');
        } else {
          const errorResult = await response.json().catch(() => ({ error: 'Network error' }));
          setError(errorResult.error || `Server error: ${response.status}`);
          toast.error('Training failed due to server error');
        }
      }
    } catch (err) {
      setError('Network error during training');
      toast.error('Network error during training');
    } finally {
      setLoading(prev => ({ ...prev, training: false }));
    }
  };

  const sendMessage = async () => {
    if (!goalDescription.trim()) {
      setError('Enter a message first');
      return;
    }

    if (!openaiStatus?.openai_available) {
      toast.error('OpenAI not available. Check status.');
      return;
    }

    const newMessages = [...messages, { role: 'user' as const, content: goalDescription }];
    setMessages(newMessages);
    setGoalDescription('');
    setLoading(prev => ({ ...prev, analysis: true }));
    setError('');

    try {
      const endpoint = '/api/ml/analyze-goal';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const result = await response.json();
      if (result.success) {
        const assistantResponse = result.analysis;
        const assistantMessage = { role: 'assistant' as const, content: assistantResponse.reasoning || assistantResponse.raw_response };
        setMessages([...newMessages, assistantMessage]);
        setGoalAnalysis(assistantResponse);

        if (assistantResponse.domain_suggestions && assistantResponse.domain_suggestions.length > 0) {
          const suggestedDomain = assistantResponse.domain_suggestions[0].toLowerCase();
          if (suggestedDomain !== domain) {
            setDomain(suggestedDomain);
            toast.success(`Domain updated to ${suggestedDomain} based on chat!`);
          }
        }

        try {
          const parsed = JSON.parse(assistantResponse.raw_response || assistantResponse.reasoning);
          if (parsed.custom_features) {
            setCustomParams(parsed.custom_features);
            toast.success('Custom parameters updated from chat.');
            if (!data && window.confirm('No dataset detected. Generate the suggested dataset now?')) {
              generateData(parsed.custom_features);
            }
          }
          if (parsed.anonymized_data) {
            setData(parsed.anonymized_data);
            toast.success('Data anonymized via Associate chat!');
            setShowDataPreview(true);
            setDataPreviewOpen(true);
          }
        } catch {}
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Network error during analysis');
      toast.error('Network error during analysis');
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  };

  const exportResults = () => {
    if (!trainingResults) return;
    const jsonString = JSON.stringify(trainingResults, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'training_results.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported as JSON!');
  };

  const exportData = () => {
    if (!data) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data).join(',') + '\n'
      + Array.from({length: sampleSize}, (_, i) => Object.values(data).map(col => col[i]).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'synthetic_data.csv');
    link.click();
    toast.success('Data exported as CSV!');
  };

  const generateReport = async () => {
    if (!data && !goalAnalysis && messages.length === 0) {
      setError('No data available for report generation. Generate data or start a conversation first.');
      return;
    }

    if (!trainingResults) {
      const proceed = window.confirm(
        'No training metrics available. Report will focus on data overview and analysis only. Proceed?'
      );
      if (!proceed) return;
    }

    setLoading(prev => ({ ...prev, report: true }));
    setError('');

    try {
      const response = await fetch('/api/ml/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: reportFormat,
          data,
          trainingResults: trainingResults || null,
          goalAnalysis,
          domain,
          sampleSize,
          modelType,
          messages,
          hasTrainingResults: !!trainingResults,
          useFaker,
          isUploaded: !!uploadedFileName,
          uploadedFileName
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const defaultName = 'ml_report';

        setPreviewDialog({
          open: true,
          blob,
          format: reportFormat,
          filename: defaultName
        });

        if (trainingResults) {
          toast.success('Complete report generated! Preview available.');
        } else {
          toast.success('Partial report generated! Preview available.');
        }
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to generate report');
        toast.error('Failed to generate report');
      }
    } catch (err) {
      setError('Network error generating report');
      toast.error('Network error generating report');
    } finally {
      setLoading(prev => ({ ...prev, report: false }));
    }
  };

  const handleDownloadFromPreview = () => {
    if (!previewDialog.blob) return;

    const userFileName = window.prompt('Enter file name (without extension):', previewDialog.filename);

    if (userFileName === null) {
      return;
    }

    const fileName = userFileName.trim() || previewDialog.filename;
    const extension = previewDialog.format === 'word' ? 'docx' : 'pptx';

    const url = URL.createObjectURL(previewDialog.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Report downloaded! Check your Downloads folder.');
  };

  const renderPreviewContent = async () => {
    if (!previewDialog.blob || !previewContainerRef.current) return;

    if (previewDialog.format === 'word') {
      try {
        previewContainerRef.current.innerHTML = '';

        await renderAsync(previewDialog.blob, previewContainerRef.current, undefined, {
          className: 'docx-preview-content',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          debug: false
        });
      } catch (error) {
        console.error('Error rendering docx preview:', error);
        previewContainerRef.current.innerHTML = `
          <div class="p-4 text-center text-gray-600">
            <p>Unable to preview Word document.</p>
            <p class="text-sm mt-2">Please download to view the content.</p>
          </div>
        `;
      }
    } else {
      previewContainerRef.current.innerHTML = `
        <div class="p-8 text-center text-gray-600">
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">PowerPoint Preview</h3>
          <p class="mb-4">Browser preview for PowerPoint files is limited.</p>
          <p class="text-sm text-gray-500">Please download the file to view the complete presentation.</p>
        </div>
      `;
    }
  };

  useEffect(() => {
    if (previewDialog.open && previewDialog.blob) {
      renderPreviewContent();
    }
  }, [previewDialog.open, previewDialog.blob]);

  const handleSampleSizeBlur = () => {
    if (sampleSize < 10) {
      setSampleSize(10);
      toast.error('Sample size set to minimum 10');
    } else if (sampleSize > 10000) {
      setSampleSize(10000);
      toast.error('Sample size set to maximum 10000');
    }
  };

  const paginatedData = useMemo(() => {
    if (!data) return [];
    const headers = Object.keys(data);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return Array.from({ length: Math.min(pageSize, sampleSize - start) }).map((_, i) => {
      const rowIndex = start + i;
      return headers.reduce((acc, header) => {
        acc[header] = data[header][rowIndex];
        return acc;
      }, {} as Record<string, any>);
    });
  }, [data, currentPage, sampleSize]);

  const totalPages = Math.ceil(sampleSize / pageSize);

  const retryTrainModel = () => {
    setError('');
    trainModel();
  };

  const retryGenerateData = () => {
    setError('');
    generateData();
  };

  const retrySendMessage = () => {
    setError('');
    sendMessage();
  };

  const retryGenerateReport = () => {
    setError('');
    generateReport();
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <header className="flex items-center justify-between p-4 bg-blue-600 text-white shadow-md">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6" />
            <h1 className="text-xl font-bold">ML Platform</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              Version 1.0
            </Badge>
          </div>
        </header>
        {Object.values(loading).some(l => l) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-hidden" role="region" aria-label="Main application panels">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel minSize={15} defaultSize={20}>
              <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
                <Tabs defaultValue="data" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                  </TabsList>
                  <TabsContent value="data" className="flex-1 overflow-y-auto p-4">
                    <Card className="bg-white dark:bg-gray-800 border-none shadow-sm flex flex-col h-full">
                      <CardHeader className="p-0 pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Database className="h-5 w-5 text-blue-500" />
                          Data Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 space-y-3 flex-1">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Client data stays private—processed ephemerally in-memory, no sharing without consent. GDPR-inspired compliance.
                        </Badge>
                        <span id="file-upload-description" className="sr-only">
                          Upload CSV or Excel files for data analysis. Supported formats: .csv, .xls, .xlsx. Files are processed securely and not stored permanently.
                        </span>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".csv,.xls,.xlsx"
                            id="file-upload"
                            className="sr-only"
                            onChange={handleFileUpload}
                            disabled={loading.data}
                            aria-label="Upload CSV or Excel file for data analysis"
                            aria-describedby="file-upload-description"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <label
                                htmlFor="file-upload"
                                className={`flex items-center justify-center w-full h-9 px-4 text-sm font-medium rounded-md cursor-pointer transition-colors duration-200 ${
                                  uploadedFileName 
                                    ? 'text-green-700 bg-green-50 border border-green-300 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-600 dark:hover:bg-green-800' 
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'
                                } ${loading.data ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {loading.data ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-2" />
                                )}
                                {uploadedFileName ? uploadedFileName.substring(0, 18) + (uploadedFileName.length > 18 ? '...' : '') : 'Choose File (CSV/Excel)'}
                              </label>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Data is processed securely over HTTPS, not stored on server. Ask Associate for anonymization if needed.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select value={domain} onValueChange={setDomain}>
                          <SelectTrigger className="h-9 text-sm" aria-label="Select data domain for analysis">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          type="number" 
                          value={sampleSize} 
                          onChange={(e) => setSampleSize(Number(e.target.value))} 
                          onBlur={handleSampleSizeBlur}
                          className="h-9 text-sm" 
                          aria-label="Number of data samples to generate"
                          min="10"
                          max="10000"
                          placeholder="Sample size"
                        />
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="use-faker" 
                            checked={useFaker} 
                            onCheckedChange={setUseFaker} 
                            aria-label="Enable Faker.js for realistic synthetic data generation"
                            aria-describedby="faker-description"
                          />
                          <label htmlFor="use-faker" className="text-sm cursor-pointer">Use Faker.js</label>
                          <span id="faker-description" className="sr-only">Toggle to use Faker.js library for generating realistic synthetic data</span>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="local-model"
                              checked={useLocalModel}
                              onCheckedChange={(checked) => {
                                setUseLocalModel(checked);
                                setLocalModelStatus(checked ? 'loading' : 'idle');
                                if (checked) {
                                  setTimeout(() => setLocalModelStatus('ready'), 1500);
                                }
                              }}
                            />
                            <label htmlFor="local-model" className="text-sm cursor-pointer text-gray-600 dark:text-gray-400">
                              Local Model (Offline)
                            </label>
                          </div>
                          <Badge 
                            variant={useLocalModel ? (localModelStatus === 'ready' ? 'default' : localModelStatus === 'error' ? 'destructive' : 'secondary') : 'outline'} 
                            className="text-xs"
                          >
                            {useLocalModel ? (
                              localModelStatus === 'ready' ? 'Ready' : 
                              localModelStatus === 'loading' ? 'Loading...' :
                              localModelStatus === 'error' ? 'Error' : 'Offline'
                            ) : 'Online'}
                          </Badge>
                        </div>
                        <Button onClick={() => generateData()} disabled={loading.data || sampleSize < 10 || sampleSize > 10000} className="w-full h-9 text-sm bg-blue-600 hover:bg-blue-700">
                          {loading.data ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Generate Data
                        </Button>
                        {data && <p className="text-sm text-gray-600 dark:text-gray-400">Data: {Object.keys(data).length} features, {sampleSize} samples</p>}
                        {showDataPreview && (
                          <Dialog open={dataPreviewOpen} onOpenChange={setDataPreviewOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full h-9 text-sm">Preview Data</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Data Preview (Page {currentPage} of {totalPages})</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {data && Object.keys(data).map(header => (
                                        <TableHead key={header}>{header}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {paginatedData.map((row, i) => (
                                      <TableRow key={i}>
                                        {Object.values(row).map((value, j) => (
                                          <TableCell key={j}>{value}</TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </ScrollArea>
                              <Pagination className="mt-4">
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious 
                                      href="#" 
                                      onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(prev => prev - 1); }} 
                                      aria-disabled={currentPage === 1}
                                    />
                                  </PaginationItem>
                                  <PaginationItem>
                                    <PaginationLink href="#" onClick={(e) => e.preventDefault()} isActive>
                                      {currentPage}
                                    </PaginationLink>
                                  </PaginationItem>
                                  <PaginationItem>
                                    <PaginationNext 
                                      href="#" 
                                      onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(prev => prev + 1); }} 
                                      aria-disabled={currentPage === totalPages}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Select value={modelType} onValueChange={setModelType}>
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
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{modelDescriptions[modelType] || 'Select a model to see its description.'}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Button 
                          onClick={trainModel} 
                          disabled={loading.training || !data} 
                          className="w-full h-9 text-sm bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Train machine learning model with generated or uploaded data"
                          aria-describedby="train-model-status"
                        >
                          {loading.training ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Train Model
                        </Button>
                        <span id="train-model-status" className="sr-only">
                          {!data ? 'Generate or upload data first to enable training' : 'Ready to train model'}
                        </span>
                        {data && (
                          <Button 
                            onClick={exportData} 
                            variant="outline" 
                            className="w-full h-9 text-sm border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Export generated data as CSV file"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export Data (CSV)
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="projects" className="flex-1 overflow-y-auto p-4">
                    <Card className="bg-white dark:bg-gray-800 border-none shadow-sm flex flex-col h-full">
                      <CardHeader className="p-0 pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Folder className="h-5 w-5 text-blue-500" />
                          Project Directory
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 flex-1">
                        <div className="space-y-4">
                          <Button onClick={saveProject} className="w-full h-9 text-sm bg-green-600 hover:bg-green-700">
                            <Save className="mr-2 h-4 w-4" />
                            Save Current Project
                          </Button>
                          <ScrollArea className="h-[calc(100%-40px)]">
                            <Accordion type="single" collapsible className="w-full">
                              {projects.map((project) => (
                                <AccordionItem value={project.id} key={project.id}>
                                  <AccordionTrigger className="text-sm">
                                    <div className="flex items-center gap-2">
                                      <File className="h-4 w-4" />
                                      {project.name}
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-2 p-2">
                                      <p className="text-xs text-gray-600 dark:text-gray-400">Domain: {project.domain}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">Samples: {project.sampleSize}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">Model: {project.modelType}</p>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => loadProject(project)}
                                        >
                                          Load
                                        </Button>
                                        <Button 
                                          variant="destructive" 
                                          size="sm"
                                          onClick={() => deleteProject(project.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                            {projects.length === 0 && (
                              <p className="text-center text-sm text-gray-500 mt-4">No projects saved yet.</p>
                            )}
                          </ScrollArea>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </Panel>

            <PanelResizeHandle className="bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors w-1" />

            <Panel minSize={30} defaultSize={50}>
              <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
                <Card className="h-full bg-white dark:bg-gray-800 border-none shadow-sm flex flex-col">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BrainCircuit className="h-5 w-5 text-blue-500" />
                      AI Associate
                      {openaiStatus && (
                        <Badge 
                          variant={openaiStatus.openai_available ? "default" : "destructive"} 
                          className="ml-2 text-xs"
                        >
                          {openaiStatus.openai_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden flex flex-col pt-3">
                    <ScrollArea className="flex-1 mb-3">
                      <div className="space-y-3 pr-4">
                        {messages.map((msg, i) => (
                          <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-50 dark:bg-gray-700 text-right' : 'bg-gray-50 dark:bg-gray-600 text-left'}`}>
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  components={{
                                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              msg.content
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex-shrink-0 relative">
                      <Textarea
                        placeholder="Message Associate... (e.g., 'Anonymize sensitive columns' for privacy)"
                        value={goalDescription}
                        onChange={(e) => setGoalDescription(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (goalDescription.trim() && !loading.analysis) {
                              sendMessage();
                            }
                          }
                        }}
                        className="h-20 text-sm pr-12 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none shadow-sm"
                        aria-label="Chat with AI Associate for guidance and recommendations"
                        maxLength={1000}
                        disabled={!openaiStatus?.openai_available}
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={loading.analysis || !goalDescription.trim() || !openaiStatus?.openai_available}
                        className="absolute right-2 bottom-2 h-8 w-8 text-xs bg-blue-600 hover:bg-blue-700 p-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                        aria-label="Send message to AI Associate"
                      >
                        {loading.analysis ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Panel>

            <PanelResizeHandle className="bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors w-1" />

            <Panel minSize={20} defaultSize={35}>
              <div className="h-full bg-white dark:bg-gray-900 p-4">
                <Card className="h-full bg-white dark:bg-gray-800 border-none shadow-sm flex flex-col">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Results & Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 text-sm min-h-0 pt-3">
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-4">
                        {trainingResults ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-600 dark:text-gray-400 font-medium">Model</div>
                              <div>{trainingResults.best_model_type || trainingResults.model_type}</div>
                              <div className="text-gray-600 dark:text-gray-400 font-medium">R² Score</div>
                              <div>{trainingResults.r2_score.toFixed(4)}</div>
                              <div className="text-gray-600 dark:text-gray-400 font-medium">MSE</div>
                              <div>{trainingResults.mse.toFixed(4)}</div>
                              <div className="text-gray-600 dark:text-gray-400 font-medium">Features</div>
                              <div>{trainingResults.n_features}</div>
                              <div className="text-gray-600 dark:text-gray-400 font-medium">Samples</div>
                              <div>{trainingResults.n_samples}</div>
                            </div>
                            {trainingResults.additional_metrics && (
                              <div>
                                <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300 text-sm">Additional Metrics</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  {trainingResults.additional_metrics.mae && (
                                    <>
                                      <div className="text-gray-600 dark:text-gray-400 font-medium">MAE</div>
                                      <div>{trainingResults.additional_metrics.mae.toFixed(4)}</div>
                                    </>
                                  )}
                                  {trainingResults.additional_metrics.accuracy && (
                                    <>
                                      <div className="text-gray-600 dark:text-gray-400 font-medium">Accuracy</div>
                                      <div>{(trainingResults.additional_metrics.accuracy * 100).toFixed(2)}%</div>
                                    </>
                                  )}
                                  {trainingResults.additional_metrics.precision && (
                                    <>
                                      <div className="text-gray-600 dark:text-gray-400 font-medium">Precision</div>
                                      <div>{(trainingResults.additional_metrics.precision * 100).toFixed(2)}%</div>
                                    </>
                                  )}
                                  {trainingResults.additional_metrics.recall && (
                                    <>
                                      <div className="text-gray-600 dark:text-gray-400 font-medium">Recall</div>
                                      <div>{(trainingResults.additional_metrics.recall * 100).toFixed(2)}%</div>
                                    </>
                                  )}
                                  {trainingResults.additional_metrics.f1_score && (
                                    <>
                                      <div className="text-gray-600 dark:text-gray-400 font-medium">F1 Score</div>
                                      <div>{(trainingResults.additional_metrics.f1_score * 100).toFixed(2)}%</div>
                                    </>
                                  )}
                                </div>
                                {trainingResults.additional_metrics.feature_importance && (
                                  <div className="mt-3">
                                    <h6 className="font-medium mb-2 text-gray-700 dark:text-gray-300 text-sm">Feature Importance</h6>
                                    <ResponsiveContainer width="100%" height={200}>
                                      <BarChart data={Object.entries(trainingResults.additional_metrics.feature_importance).map(([feature, importance]) => ({ feature, importance }))}>
                                        <XAxis dataKey="feature" tick={{fontSize: 10}} angle={-45} textAnchor="end" height={60} />
                                        <YAxis tick={{fontSize: 10}} />
                                        <RechartsTooltip />
                                        <Bar dataKey="importance" fill="#3b82f6" />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                              </div>
                            )}
                            <Button onClick={exportResults} variant="outline" className="w-full mt-2 h-9 text-sm border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <Download className="mr-2 h-4 w-4" />
                              Export Results (JSON)
                            </Button>
                          </div>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-500">No training results yet. Train a model to see metrics.</p>
                        )}

                        {goalAnalysis && <div className="mt-4">
                          <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300 text-sm">Goal Analysis</h5>
                          <div className="text-gray-600 dark:text-gray-400 text-sm">
                            <ReactMarkdown>{goalAnalysis.reasoning}</ReactMarkdown>
                          </div>
                        </div>}

                        <Separator className="my-4" />

                        <div className="space-y-3">
                          <h5 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Generate Report</h5>
                          <Select value={reportFormat} onValueChange={(value: 'word' | 'ppt') => setReportFormat(value)}>
                            <SelectTrigger className="h-9 text-sm" aria-label="Select report format">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="word">Word Document (.docx)</SelectItem>
                              <SelectItem value="ppt">PowerPoint (.pptx)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={generateReport} 
                            disabled={loading.report || (!data && !goalAnalysis && messages.length === 0)} 
                            className="w-full h-9 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Generate and preview ${reportFormat === 'word' ? 'Word document' : 'PowerPoint presentation'} report`}
                            title={!trainingResults ? "Report will focus on data and analysis only" : "Generate complete report with training metrics"}
                          >
                            {loading.report ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                            Preview Report
                          </Button>
                          {!trainingResults && (data || goalAnalysis || messages.length > 0) && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              ⚠️ No training metrics. Report focuses on data & analysis.
                            </p>
                          )}
                        </div>

                        {error && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertDescription className="text-sm">{error}</AlertDescription>
                            {error.includes('training') && <Button onClick={retryTrainModel} variant="link" className="text-sm">Retry</Button>}
                            {error.includes('generating data') && <Button onClick={retryGenerateData} variant="link" className="text-sm">Retry</Button>}
                            {error.includes('analysis') && <Button onClick={retrySendMessage} variant="link" className="text-sm">Retry</Button>}
                            {error.includes('report') && <Button onClick={retryGenerateReport} variant="link" className="text-sm">Retry</Button>}
                          </Alert>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </Panel>
          </PanelGroup>
        </div>

        <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Report Preview - {previewDialog.format === 'word' ? 'Word Document' : 'PowerPoint Presentation'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDialog(prev => ({ ...prev, open: false }))}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <DialogDescription>
                Preview your generated report. Download to save or edit further.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden border rounded-lg bg-white shadow-sm">
              <ScrollArea className="h-full p-4">
                <div 
                  ref={previewContainerRef}
                  className="min-h-[50vh]"
                >
                  {/* Content will be rendered here by renderPreviewContent */}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setPreviewDialog(prev => ({ ...prev, open: false }))}
              >
                Close Preview
              </Button>
              <Button
                onClick={handleDownloadFromPreview}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}