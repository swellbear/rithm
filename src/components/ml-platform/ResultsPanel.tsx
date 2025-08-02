import React, { useMemo, useCallback, memo, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Eye, Download, Loader2, MessageSquare, Mic, Shield, Cloud, Edit2, Undo, Brain, Camera, Volume2, Scale, Pencil, Database } from 'lucide-react'; // ALL TOOLS icons
import { MLData, TrainingResults, NLPResults, VisionResults, SpeechResults, GovernanceMetrics, DeployedModel, ReportStructure, ReportSection } from './types'; // NEW: Added report editing types
import ReportEditor from './ReportEditor'; // NEW: Import visual report editor
import { useAppStore } from '@/store'; // Import Zustand store

// Memoized components for better tab performance
const MemoizedReportEditor = memo(ReportEditor);

/**
 * Props interface for the ResultsPanel component
 * @interface ResultsPanelProps
 */
interface ResultsPanelProps {
  /** Selected report format for export (Word document or PowerPoint) */
  reportFormat: 'word' | 'ppt';
  /** Whether data preview button should be shown */
  showDataPreview: boolean;
  /** Whether data preview dialog is currently open */
  dataPreviewOpen: boolean;
  /** Current page number in data pagination */
  currentPage: number;
  /** Number of rows per page in data preview */
  pageSize: number;
  /** Total number of samples in dataset */
  sampleSize: number;
  /** Callback when report format selection changes */
  onReportFormatChange: (format: 'word' | 'ppt') => void;
  /** Callback to generate and preview report */
  onGenerateReport: () => void;
  /** Callback to show data preview */
  onShowDataPreview: () => void;
  /** Callback when data preview dialog open state changes */
  onDataPreviewOpenChange: (open: boolean) => void;
  /** Callback when data pagination page changes */
  onPageChange: (page: number) => void;
  /** Callback to retry model training operation */
  onRetryTrainModel: () => void;
  /** Callback to retry data generation operation */
  onRetryGenerateData: () => void;
  /** Callback to retry AI message sending operation */
  onRetrySendMessage: () => void;
  /** Callback to retry report generation operation */
  onRetryGenerateReport: () => void;
  // NEW: Props for report editing capabilities
  reportStructure?: ReportStructure;
  reportVersions?: ReportStructure[];
  editReport?: (instruction: string) => Promise<void>;
  onUndoReportEdit?: () => void;
  onToolRun?: (toolName: string, output: any) => void;
}

/**
 * ResultsPanel - Comprehensive results visualization and report generation interface
 * 
 * This component handles the display and interaction with ML training results, data visualization,
 * and professional report generation. It provides multiple views including data preview,
 * training metrics, feature importance charts, and export capabilities.
 * 
 * Key Features:
 * - Interactive data preview with virtualized scrolling for performance
 * - Training results visualization with metrics and feature importance
 * - Professional report generation (Word/PowerPoint formats)
 * - Advanced error handling with specific retry options
 * - Accessibility compliance with ARIA attributes and keyboard navigation
 * - Performance optimization with useMemo for expensive calculations
 * 
 * NEW: Added Watson-like AI result tabs:
 * - NLP: Entity confidence charts, sentiment analysis visualization
 * - Vision: Object detection tables, classification results
 * - Speech: Transcript display, word confidence breakdown
 * - Governance: SHAP explainability bars, bias detection metrics
 * - Deployment: Model endpoint information, performance stats
 * 
 * Performance Optimizations:
 * - Virtual scrolling for large datasets (react-window integration)
 * - Memoized row rendering to prevent unnecessary re-renders
 * - Optimized pagination calculations with stable references
 * - Feature importance data processing with caching
 * 
 * @component
 * @param {ResultsPanelProps} props - Component props containing results data and callbacks
 * @returns {JSX.Element} The results visualization and export interface
 * 
 * @example
 * ```tsx
 * <ResultsPanel
 *   data={processedData}
 *   trainingResults={modelResults}
 *   reportFormat="word"
 *   loading={{ report: false }}
 *   onGenerateReport={generateReport}
 *   onShowDataPreview={showPreview}
 * />
 * ```
 */
export default function ResultsPanel({
  reportFormat,
  showDataPreview,
  dataPreviewOpen,
  currentPage,
  pageSize,
  sampleSize,
  onReportFormatChange,
  onGenerateReport,
  onShowDataPreview,
  onDataPreviewOpenChange,
  onPageChange,
  onRetryTrainModel,
  onRetryGenerateData,
  onRetrySendMessage,
  onRetryGenerateReport,
  // NEW: Report editing props
  reportStructure,
  reportVersions,
  editReport,
  onUndoReportEdit,
  // NEW: Central workspace integration
  onToolRun
}: ResultsPanelProps) {
  // Get state from Zustand store using selector pattern
  const data = useAppStore((state) => state.data);
  const trainingResults = useAppStore((state) => state.trainingResults);
  const nlpResults = useAppStore((state) => state.nlpResults);
  const visionResults = useAppStore((state) => state.visionResults);
  const speechResults = useAppStore((state) => state.speechResults);
  const governanceMetrics = useAppStore((state) => state.governanceMetrics);
  const deployedModel = useAppStore((state) => state.deployedModel);
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);
  const useLocalModel = useAppStore((state) => state.useLocalModel);
  
  // Debug: Log loading state changes
  useEffect(() => {
    console.log('🎯 ResultsPanel loading state changed:', loading);
  }, [loading]);
  
  // State for accordion open values with tool mapping
  const [openAccordionPanes, setOpenAccordionPanes] = useState<string[]>(['data-management']);
  
  // Log when data changes from store
  useEffect(() => {
    if (data) {
      console.log('Results updated from store - data available:', Object.keys(data).length, 'columns');
    }
  }, [data]);
  
  // State for accordion open values
  const [openItems, setOpenItems] = useState<string[]>([]);

  // Tool-to-accordion mapping for auto-opening Results panes
  const toolToAccordionMap: Record<string, string> = {
    'analyze_image': 'vision',
    'view_image': 'vision', 
    'image_analysis': 'vision',
    'analyze_text': 'nlp',
    'text_analysis': 'nlp',
    'sentiment': 'nlp',
    'speech_analysis': 'speech',
    'transcribe': 'speech',
    'audio_analysis': 'speech',
    'web_search': 'data-management',
    'generate_data': 'data-management',
    'train_model': 'training',
    'model_training': 'training',
    'code_execution': 'governance',
    'governance_analysis': 'governance',
    'bias_detection': 'governance'
  };

  // Enhanced useEffect for tool execution auto-opening
  useEffect(() => {
    if (onToolRun) {
      // Auto-open relevant accordion panes when new results are available
      const newOpenItems = [...openItems];
      
      // Auto-open NLP section when NLP results are available
      if (nlpResults && !openItems.includes('nlp')) {
        newOpenItems.push('nlp');
      }
      
      // Auto-open Vision section when vision results are available
      if (visionResults && !openItems.includes('vision')) {
        newOpenItems.push('vision');
      }
      
      // Auto-open Speech section when speech results are available
      if (speechResults && !openItems.includes('speech')) {
        newOpenItems.push('speech');
      }
      
      // Auto-open Governance section when governance metrics are available
      if (governanceMetrics && !openItems.includes('governance')) {
        newOpenItems.push('governance');
      }
      
      // Auto-open Training section when training results are available
      if (trainingResults && !openItems.includes('training')) {
        newOpenItems.push('training');
      }
      
      // Auto-open Data section when data is available
      if (data && !openItems.includes('data')) {
        newOpenItems.push('data');
      }
      
      // Update state if new items were added
      if (newOpenItems.length > openItems.length) {
        setOpenItems(newOpenItems);
        console.log('Auto-opened accordion sections:', newOpenItems.filter(item => !openItems.includes(item)));
      }
    }
  }, [nlpResults, visionResults, speechResults, governanceMetrics, trainingResults, data, openItems, onToolRun]);

  // Handle tool execution from ChatPanel
  useEffect(() => {
    if (onToolRun) {
      // Create a callback that handles tool execution results
      const handleToolExecution = (toolName: string, output: any) => {
        console.log(`Tool execution received in ResultsPanel: ${toolName}`, output);
        
        // Map tool name to accordion pane
        const accordionPane = toolToAccordionMap[toolName];
        if (accordionPane && !openItems.includes(accordionPane)) {
          setOpenItems(prev => [...prev, accordionPane]);
          console.log(`Auto-opened accordion pane: ${accordionPane} for tool: ${toolName}`);
        }
      };
      
      // Note: The actual tool execution callback will be handled in ChatPanel
      // This useEffect sets up the mapping logic for when tools complete
    }
  }, [onToolRun, openItems]);
  // Optimized paginatedData with minimal dependencies
  const headers = useMemo(() => data ? Object.keys(data) : [], [data]);

  // NEW: Memoized Watson-like AI chart data
  const nlpChartData = useMemo(() => {
    if (!nlpResults) return [];
    return nlpResults.entities.map(entity => ({ 
      name: entity.type, 
      confidence: entity.confidence * 100,
      text: entity.text.substring(0, 20) + (entity.text.length > 20 ? '...' : '')
    }));
  }, [nlpResults]);

  const governanceChartData = useMemo(() => {
    if (!governanceMetrics) return [];
    return governanceMetrics.explanations.map(exp => ({
      feature: exp.feature,
      impact: Math.abs(exp.impact) * 100,
      direction: exp.impact > 0 ? 'positive' : 'negative'
    }));
  }, [governanceMetrics]);
  
  const paginatedData = useMemo(() => {
    if (!data || headers.length === 0) return [];
    const start = (currentPage - 1) * pageSize;
    const availableRows = Math.min(pageSize, sampleSize - start);
    if (availableRows <= 0) return [];
    
    return Array.from({ length: availableRows }, (_, i) => {
      const rowIndex = start + i;
      return headers.reduce((acc, header) => {
        acc[header] = data[header][rowIndex];
        return acc;
      }, {} as Record<string, any>);
    });
  }, [headers, currentPage, pageSize, sampleSize, data]);

  const totalPages = useMemo(() => Math.ceil(sampleSize / pageSize), [sampleSize, pageSize]);

  // Virtualized row component for performance with accessibility
  const VirtualizedRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = paginatedData[index];
    if (!row) return null;
    
    return (
      <div 
        style={style} 
        className="flex border-b border-gray-200 dark:border-gray-700"
        role="row"
        aria-rowindex={index + 2}
      >
        {Object.values(row).map((value, cellIndex) => (
          <div 
            key={cellIndex} 
            className="flex-1 p-2 text-xs truncate border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            title={String(value)}
            role="gridcell"
            aria-colindex={cellIndex + 1}
          >
            {typeof value === 'number' ? value.toFixed(2) : String(value)}
          </div>
        ))}
      </div>
    );
  }, [paginatedData]);

  const featureImportanceData = useMemo(() => {
    if (!trainingResults?.additional_metrics?.feature_importance) return [];
    return Object.entries(trainingResults.additional_metrics.feature_importance)
      .map(([name, importance]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
        importance: Number((importance * 100).toFixed(2))
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }, [trainingResults]);

  return (
    <>
      <Card className="h-full min-h-0 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Results & Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0 overflow-y-auto docked-results" role="region" aria-label="Results and reports content">

            
            {/* Accordion Layout */}
            <Accordion 
              type="multiple" 
              value={openItems} 
              onValueChange={setOpenItems}
              className="w-full px-4"
            >
            
            {/* Data Section */}
            <AccordionItem value="data" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  Data Overview
                  {data && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {Object.keys(data).length} columns, {Object.values(data)[0]?.length || 0} rows
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="animate-slide-in-right pb-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 p-4">
              {/* Data Preview Section */}
              {data && showDataPreview && (
                <div className="space-y-3">
                  <Button 
                    onClick={onShowDataPreview}
                    variant="outline" 
                    className="w-full h-9 text-sm border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Data
                  </Button>
                </div>
              )}

              {/* Report Generation Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Download className="h-4 w-4 text-purple-600" />
                  Generate Report
                </h3>
                <Select value={reportFormat} onValueChange={onReportFormatChange} disabled={useLocalModel}>
                  <SelectTrigger className="h-9 text-sm" aria-label="Select report format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word">Word Document</SelectItem>
                    <SelectItem value="ppt">PowerPoint</SelectItem>
                  </SelectContent>
                </Select>
                {useLocalModel && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    ⚠️ Cloud exports (Word/PPT) disabled in local mode
                  </p>
                )}
                <div className="space-y-2">
                  <Button 
                    onClick={onGenerateReport}
                    disabled={loading.report}
                    className="w-full h-9 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!trainingResults ? "Report will focus on data and analysis only" : "Generate complete report with training metrics"}
                  >
                    {loading.report ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                    Preview Report
                  </Button>
                  {!trainingResults && data && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ No training metrics. Report focuses on data & analysis.
                    </p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                    {error.includes('training') && <Button onClick={onRetryTrainModel} variant="link" className="text-sm">Retry</Button>}
                    {error.includes('generating data') && <Button onClick={onRetryGenerateData} variant="link" className="text-sm">Retry</Button>}
                    {error.includes('analysis') && <Button onClick={onRetrySendMessage} variant="link" className="text-sm">Retry</Button>}
                    {error.includes('report') && <Button onClick={onRetryGenerateReport} variant="link" className="text-sm">Retry</Button>}
                  </Alert>
                )}

                {/* Edit History Section */}
                {reportVersions && reportVersions.length > 1 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Undo className="h-4 w-4 text-blue-600" />
                      Edit History
                    </h4>
                    <ul className="space-y-2 mt-2">
                      {reportVersions.slice(-5).reverse().map((ver, i) => ( // Last 5 versions
                        <li key={i} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <span className="text-gray-700 dark:text-gray-300">Version {reportVersions.length - i}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => onUndoReportEdit && onUndoReportEdit()}
                            className="h-7 px-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
                          >
                            Revert
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
                </div>
              </ScrollArea>
              </AccordionContent>
            </AccordionItem>
            
            {/* Training Section */}
            <AccordionItem value="training" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Training Results
                  {trainingResults && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      R² {trainingResults.r2_score.toFixed(3)}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="animate-slide-in-right pb-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 p-4">
                  {/* Training Results Section */}
                  {trainingResults && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Training Results
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Model:</span>
                            <span className="font-medium">{(trainingResults.best_model_type || trainingResults.model_type).replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">R² Score:</span>
                            <Badge variant={trainingResults.r2_score > 0.8 ? 'default' : trainingResults.r2_score > 0.5 ? 'secondary' : 'destructive'} className="text-xs">
                              {trainingResults.r2_score.toFixed(4)}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">MSE:</span>
                            <span className="font-medium">{trainingResults.mse.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Feature Importance Chart */}
                      {featureImportanceData.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Top Feature Importance</h4>
                          <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={featureImportanceData.slice(0, 8)} layout="horizontal">
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                                <RechartsTooltip 
                                  formatter={(value) => [`${value}%`, 'Importance']}
                                  labelStyle={{ color: '#374151' }}
                                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db' }}
                                />
                                <Bar dataKey="importance" fill="#3b82f6" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
              </AccordionContent>
            </AccordionItem>
            
            {/* NLP Section */}
            <AccordionItem value="nlp" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  NLP Analysis
                  {nlpResults && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {nlpResults.entities.length} entities
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="animate-slide-in-right pb-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 p-4">
                  {nlpResults ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-medium">NLP Analysis Results</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-gray-50 dark:bg-gray-800">
                          <CardHeader>
                            <CardTitle className="text-sm">Sentiment Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Sentiment:</span>
                                <Badge variant={nlpResults.sentiment === 'positive' ? 'default' : 
                                               nlpResults.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                                  {nlpResults.sentiment.charAt(0).toUpperCase() + nlpResults.sentiment.slice(1)}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Language:</span>
                                <span className="text-sm font-medium">{nlpResults.language}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 dark:bg-gray-800">
                          <CardHeader>
                            <CardTitle className="text-sm">Key Phrases</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {nlpResults.keyPhrases.map((phrase, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{phrase}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {nlpChartData.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Entity Confidence Scores</h4>
                          <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={nlpChartData}>
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <RechartsTooltip 
                                  formatter={(value) => [`${value}%`, 'Confidence']}
                                  labelFormatter={(label) => `Entity: ${label}`}
                                />
                                <Bar dataKey="confidence" fill="#10b981" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      
                      {nlpResults.entities.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Detected Entities</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Text</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Confidence</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {nlpResults.entities.map((entity, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">{entity.text}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{entity.type}</Badge>
                                  </TableCell>
                                  <TableCell>{(entity.confidence * 100).toFixed(1)}%</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No NLP analysis results yet</p>
                      <p className="text-xs text-gray-400 mt-1">Run text analysis in the Data Management panel</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              </AccordionContent>
            </AccordionItem>
            
            {/* Vision Section */}
            <AccordionItem value="vision" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-indigo-500" />
                  Vision Analysis
                  {visionResults && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {visionResults.objects.length} objects
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="animate-slide-in-right pb-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 p-4">
                  {visionResults ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-medium">Vision Analysis Results</h3>
                      </div>
                      
                      {visionResults.classifications.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Image Classifications</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Label</TableHead>
                                <TableHead>Confidence</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visionResults.classifications.map((classification, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">{classification.label}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span>{(classification.score * 100).toFixed(1)}%</span>
                                      <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full" 
                                          style={{ width: `${classification.score * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      
                      {visionResults.objects.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Detected Objects</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Object</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead>Bounding Box</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visionResults.objects.map((object, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">{object.label}</TableCell>
                                  <TableCell>{(object.score * 100).toFixed(1)}%</TableCell>
                                  <TableCell className="text-xs text-gray-500">
                                    {object.location ? `x:${object.location.x}, y:${object.location.y}, w:${object.location.w}, h:${object.location.h}` : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      
                      {/* Image Preview Section */}
                      {visionResults.imageUrl && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Analyzed Image</h4>
                          <Card className="bg-gray-50 dark:bg-gray-800">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <img 
                                  src={visionResults.imageUrl} 
                                  alt="Analyzed image" 
                                  className="max-w-full h-auto rounded-lg border"
                                  style={{ maxHeight: '300px' }}
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = visionResults.imageUrl!;
                                      link.download = 'analyzed-image.jpg';
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(visionResults.imageUrl, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Full Size
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {visionResults.ocrText && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Extracted Text (OCR)</h4>
                          <Card className="bg-gray-50 dark:bg-gray-800">
                            <CardContent className="p-4">
                              <p className="text-sm whitespace-pre-wrap">{visionResults.ocrText}</p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Eye className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No vision analysis results yet</p>
                      <p className="text-xs text-gray-400 mt-1">Upload and analyze an image in the Data Management panel</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              </AccordionContent>
            </AccordionItem>
            
            {/* Speech Section */}
            <AccordionItem value="speech" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-teal-500" />
                  Speech Analysis
                  {speechResults && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {speechResults.transcript.split(' ').length} words
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="animate-slide-in-right pb-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 p-4">
                  {speechResults ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Mic className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-medium">Speech Analysis Results</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <Card className="bg-gray-50 dark:bg-gray-800">
                          <CardHeader>
                            <CardTitle className="text-sm">Transcript</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed">{speechResults.transcript}</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t">
                              <span className="text-xs text-gray-500">Overall Confidence:</span>
                              <Badge variant="outline">{(speechResults.confidence * 100).toFixed(1)}%</Badge>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {speechResults.words.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Word-level Analysis</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Word</TableHead>
                                  <TableHead>Confidence</TableHead>
                                  <TableHead>Timing</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {speechResults.words.map((word, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium">{word.word}</TableCell>
                                    <TableCell>
                                      <Badge variant={word.confidence > 0.8 ? 'default' : word.confidence > 0.5 ? 'secondary' : 'destructive'}>
                                        {(word.confidence * 100).toFixed(1)}%
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500">
                                      {word.start && word.end ? `${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s` : 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        
                        {speechResults.speakerLabels && speechResults.speakerLabels.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Speaker Analysis</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Speaker</TableHead>
                                  <TableHead>Time Range</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {speechResults.speakerLabels.map((label, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium">Speaker {label.speaker}</TableCell>
                                    <TableCell className="text-sm">{label.from}s - {label.to}s</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Mic className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No speech analysis results yet</p>
                      <p className="text-xs text-gray-400 mt-1">Record or upload audio in the Data Management panel</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              </AccordionContent>
            </AccordionItem>
            
            {/* Governance Section */}
            <AccordionItem value="governance" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-yellow-600" />
                  Governance & Bias Analysis
                  {(governanceMetrics || (trainingResults && trainingResults.bias_metrics)) && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {governanceMetrics ? `${governanceMetrics.explanations.length} features` : 'Bias Analysis'}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="animate-slide-in-right pb-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 p-4">
                  {(governanceMetrics || (trainingResults && trainingResults.bias_metrics)) ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-medium">AI Governance & Explainability</h3>
                      </div>
                      
                      {/* Bias Analysis Section */}
                      {trainingResults && trainingResults.bias_metrics && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Scale className="h-4 w-4 text-orange-600" />
                            Bias Analysis
                          </h4>
                          <div className="space-y-3 text-sm">
                            {trainingResults.bias_metrics.bias_analysis && (
                              <Card className="bg-gray-50 dark:bg-gray-800">
                                <CardContent className="p-4">
                                  <div className="text-gray-600 dark:text-gray-400">
                                    {trainingResults.bias_metrics.bias_analysis}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            {trainingResults.bias_metrics.sensitive_feature_used && (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Sensitive Feature:</span>
                                  <span className="font-medium">{trainingResults.bias_metrics.sensitive_feature_used}</span>
                                </div>
                                {Object.entries(trainingResults.bias_metrics).map(([key, value]) => {
                                  if (key.startsWith('bias_dp_')) {
                                    const biasValue = value as number;
                                    const severity = Math.abs(biasValue) > 0.1 ? 'high' : Math.abs(biasValue) > 0.05 ? 'medium' : 'low';
                                    const severityColor = severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                                                        severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                                                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                                    
                                    return (
                                      <div key={key} className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Demographic Parity:</span>
                                        <Badge className={severityColor}>
                                          {Math.abs(biasValue).toFixed(3)} ({severity})
                                        </Badge>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                                {trainingResults.bias_metrics.sensitive_feature_values && (
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Group Values:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {trainingResults.bias_metrics.sensitive_feature_values.map((value: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {value}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Show governance metrics grid only if governanceMetrics exist */}
                      {governanceMetrics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-gray-50 dark:bg-gray-800">
                            <CardHeader>
                              <CardTitle className="text-sm">Bias Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                <Badge variant={governanceMetrics.biasDetection?.[0]?.value < 0.3 ? 'default' : 
                                               governanceMetrics.biasDetection?.[0]?.value < 0.7 ? 'secondary' : 'destructive'}>
                                  {governanceMetrics.biasDetection?.[0]?.value ? (governanceMetrics.biasDetection[0].value * 100).toFixed(1) : '0'}%
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Lower is better</p>
                            </CardContent>
                          </Card>
                        
                        <Card className="bg-gray-50 dark:bg-gray-800">
                          <CardHeader>
                            <CardTitle className="text-sm">Fairness Score</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              <Badge variant={governanceMetrics.fairnessScore > 0.7 ? 'default' : 
                                             governanceMetrics.fairnessScore > 0.4 ? 'secondary' : 'destructive'}>
                                {(governanceMetrics.fairnessScore * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Higher is better</p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gray-50 dark:bg-gray-800">
                          <CardHeader>
                            <CardTitle className="text-sm">Explainability</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              <Badge variant={governanceMetrics.explanations?.length > 5 ? 'default' : 
                                             governanceMetrics.explanations?.length > 2 ? 'secondary' : 'destructive'}>
                                {governanceMetrics.explanations?.length || 0} features
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Model interpretability</p>
                          </CardContent>
                        </Card>
                        </div>
                      )}
                      
                      {/* Show SHAP chart only if governanceMetrics exist */}
                      {governanceMetrics && governanceChartData.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">SHAP Feature Impact Analysis</h4>
                          <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={governanceChartData} layout="horizontal">
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <YAxis type="category" dataKey="feature" tick={{ fontSize: 10 }} width={80} />
                                <RechartsTooltip 
                                  formatter={(value, name, props) => [
                                    `${value}% ${props.payload.direction === 'positive' ? '(+)' : '(-)'}`, 
                                    'Impact'
                                  ]}
                                  labelFormatter={(label) => `Feature: ${label}`}
                                />
                                <Bar 
                                  dataKey="impact" 
                                  fill="#10b981"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Shield className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No governance metrics available</p>
                      <p className="text-xs text-gray-400 mt-1">Train a model to see explainability and bias analysis</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </AccordionContent>
            </AccordionItem>
            
            {/* Report Section */}
            <AccordionItem value="report" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-orange-500" />
                  Report Generation
                  {reportStructure && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {reportStructure.sections.length} sections
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="animate-slide-in-right pb-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 p-4">
                  {reportStructure ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Edit2 className="h-5 w-5 text-purple-600" />
                          <h3 className="text-lg font-medium">Report Structure</h3>
                        </div>
                        <div className="flex gap-2">
                          {reportVersions && reportVersions.length > 0 && onUndoReportEdit && (
                            <Button 
                              onClick={onUndoReportEdit}
                              variant="outline"
                              size="sm"
                              disabled={reportVersions.length === 0}
                              className="text-xs"
                            >
                              <Undo className="mr-1 h-3 w-3" />
                              Undo ({reportVersions.length})
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              // Use a custom event to communicate with ChatPanel
                              const editEvent = new CustomEvent('editViaChat', {
                                detail: { text: 'Edit the report by ' }
                              });
                              window.dispatchEvent(editEvent);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                            size="sm"
                          >
                            <Edit2 className="mr-1 h-3 w-3" />
                            Edit via Chat
                          </Button>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <strong>{reportStructure.title}</strong> • {reportStructure.sections.length} sections • Version {reportVersions?.length || 1}
                        </div>
                        
                        <div className="space-y-4">
                          {reportStructure.sections.map((section, index) => (
                            <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500">Section {index + 1}</span>
                                <Badge variant="outline" className="text-xs">
                                  {section.type}
                                </Badge>
                              </div>
                              
                              {section.type === 'heading' && (
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {section.content}
                                </h2>
                              )}
                              
                              {section.type === 'paragraph' && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {section.content}
                                </p>
                              )}
                              
                              {section.type === 'list' && section.items && (
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                  {section.items.map((item, itemIndex) => (
                                    <li key={itemIndex}>{item}</li>
                                  ))}
                                </ul>
                              )}
                              
                              {section.type === 'chart' && section.chartData && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium mb-2">{section.chartTitle || 'Chart'}</h4>
                                  <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                      {section.chartType === 'bar' ? (
                                        <BarChart data={section.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
                                          <XAxis 
                                            dataKey={section.chartConfig?.xKey || 'name'} 
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                            fontSize={10}
                                          />
                                          <YAxis fontSize={10} />
                                          <RechartsTooltip 
                                            formatter={(value: any) => [value, section.chartConfig?.yLabel || 'Value']}
                                            labelStyle={{ color: '#374151' }}
                                          />
                                          <Bar 
                                            dataKey={section.chartConfig?.yKey || 'value'} 
                                            fill="hsl(var(--primary))" 
                                            radius={[2, 2, 0, 0]} 
                                          />
                                        </BarChart>
                                      ) : (
                                        <div className="flex items-center justify-center h-full">
                                          <span className="text-gray-500 text-sm">Chart type not supported</span>
                                        </div>
                                      )}
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              )}
                              
                              {section.type === 'table' && section.tableData && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium mb-2">{section.tableTitle || 'Table'}</h4>
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          {section.tableHeaders?.map((header, headerIndex) => (
                                            <TableHead key={headerIndex} className="text-xs">{header}</TableHead>
                                          ))}
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {section.tableData.slice(0, 5).map((row, rowIndex) => (
                                          <TableRow key={rowIndex}>
                                            {row.map((cell, cellIndex) => (
                                              <TableCell key={cellIndex} className="text-xs">{String(cell)}</TableCell>
                                            ))}
                                          </TableRow>
                                        ))}
                                        {section.tableData.length > 5 && (
                                          <TableRow>
                                            <TableCell colSpan={section.tableHeaders?.length || 1} className="text-xs text-gray-500 italic">
                                              ... and {section.tableData.length - 5} more rows
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Edit via Conversational AI
                              </p>
                              <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                                Click "Edit via Chat" or go to the AI Chat panel and say things like:
                                "Add a conclusion section", "Change the chart to a pie chart", "Remove the third paragraph", or "Add bullet points about key findings"
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Edit2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No report structure available</p>
                      <p className="text-xs text-gray-400 mt-1">Generate a report first to enable conversational editing</p>
                      <Button
                        onClick={() => {
                          if (onGenerateReport) {
                            onGenerateReport();
                          }
                        }}
                        variant="outline"
                        className="mt-4 text-xs"
                        disabled={loading.report}
                      >
                        {loading.report ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                        Generate Report First
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </AccordionContent>
            </AccordionItem>
            
            {/* Visual Editor Section */}
            <AccordionItem value="visual-editor" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-pink-500" />
                  Visual Report Editor
                  {reportStructure && (
                    <Badge variant="secondary" className="text-xs ml-auto">
                      Interactive
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="animate-slide-in-right pb-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4 p-4">
                  {reportStructure ? (
                    <MemoizedReportEditor
                      structure={reportStructure}
                      onUpdate={(updatedStructure) => {
                        // Convert visual editor updates to structured JSON actions
                        const jsonAction = JSON.stringify({
                          action: 'update_structure',
                          data: updatedStructure
                        });
                        
                        // Dispatch via editReport function
                        if (editReport) {
                          editReport(jsonAction).catch(error => {
                            console.error('Error updating report structure:', error);
                          });
                        }
                      }}
                      className="w-full"
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Edit2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No report structure available</p>
                      <p className="text-xs text-gray-400 mt-1">Generate a report first to enable visual editing</p>
                      <Button
                        onClick={() => {
                          if (onGenerateReport) {
                            onGenerateReport();
                          }
                        }}
                        variant="outline"
                        className="mt-4 text-xs"
                        disabled={loading.report}
                      >
                        {loading.report ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                        Generate Report First
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Data Preview Dialog */}
      <Dialog open={dataPreviewOpen} onOpenChange={onDataPreviewOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Data Preview</DialogTitle>
            <DialogDescription>
              Showing {pageSize} rows per page of {Object.values(data || {})[0]?.length || 0} total rows
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="table" className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="flex-1 overflow-hidden">
              <div className="border rounded-lg bg-white shadow-sm overflow-hidden h-full flex flex-col">
                <div className="flex-1">
                  {/* Header Row with ARIA attributes */}
                  <div 
                    className="flex bg-gray-50 dark:bg-gray-800 border-b"
                    role="row"
                    aria-rowindex={1}
                  >
                    {headers.map((header, index) => (
                      <div 
                        key={header} 
                        className="flex-1 p-2 text-xs font-medium border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                        role="columnheader"
                        aria-colindex={index + 1}
                        aria-sort="none"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            // Future: Add sorting functionality
                          }
                        }}
                      >
                        {header}
                      </div>
                    ))}
                  </div>
                  
                  {/* Virtualized Data Rows */}
                  <div className="bg-white dark:bg-gray-900">
                    {paginatedData.length > 50 ? (
                      <List
                        height={300}
                        width="100%"
                        itemCount={paginatedData.length}
                        itemSize={32}
                        itemData={paginatedData}
                      >
                        {VirtualizedRow}
                      </List>
                    ) : (
                      // For small datasets, use regular divs for better UX
                      <div className="max-h-80 overflow-y-auto" role="grid" aria-label="Data table">
                        {paginatedData.map((row, index) => (
                          <div 
                            key={index} 
                            className="flex border-b border-gray-200 dark:border-gray-700"
                            role="row"
                            aria-rowindex={index + 2}
                          >
                            {Object.values(row).map((value, cellIndex) => (
                              <div 
                                key={cellIndex} 
                                className="flex-1 p-2 text-xs truncate border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                                title={String(value)}
                                role="gridcell"
                                aria-colindex={cellIndex + 1}
                              >
                                {typeof value === 'number' ? value.toFixed(2) : String(value)}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center p-4 border-t flex-shrink-0">
                  <Pagination role="navigation" aria-label="Data table pagination">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                          aria-disabled={currentPage <= 1}
                          tabIndex={currentPage <= 1 ? -1 : 0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (currentPage > 1) onPageChange(currentPage - 1);
                            }
                          }}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (page > totalPages) return null;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink 
                              onClick={() => onPageChange(page)}
                              isActive={currentPage === page}
                              aria-current={currentPage === page ? 'page' : undefined}
                              aria-label={`Go to page ${page}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onPageChange(page);
                                }
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                          aria-disabled={currentPage >= totalPages}
                          tabIndex={currentPage >= totalPages ? -1 : 0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if (currentPage < totalPages) onPageChange(currentPage + 1);
                            }
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="summary" className="flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(data || {}).length}
                    </div>
                    <div className="text-sm text-blue-600/80">Columns</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.values(data || {})[0]?.length || 0}
                    </div>
                    <div className="text-sm text-green-600/80">Rows</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}