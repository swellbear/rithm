import React, { useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Eye, Download, Loader2 } from 'lucide-react';
import { MLData, TrainingResults } from './types';

interface ResultsPanelProps {
  data: MLData | null;
  trainingResults: TrainingResults | null;
  reportFormat: 'word' | 'ppt';
  error: string;
  loading: { [key: string]: boolean };
  showDataPreview: boolean;
  dataPreviewOpen: boolean;
  currentPage: number;
  pageSize: number;
  sampleSize: number;
  onReportFormatChange: (format: 'word' | 'ppt') => void;
  onGenerateReport: () => void;
  onShowDataPreview: () => void;
  onDataPreviewOpenChange: (open: boolean) => void;
  onPageChange: (page: number) => void;
  onRetryTrainModel: () => void;
  onRetryGenerateData: () => void;
  onRetrySendMessage: () => void;
  onRetryGenerateReport: () => void;
}

// **OPTIMIZATION 1**: Memoized row component for better virtual list performance
interface VirtualRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    rows: Array<Record<string, any>>;
    headers: string[];
  };
}

const VirtualizedRowComponent = memo<VirtualRowProps>(({ index, style, data }) => {
  const { rows, headers } = data;
  const row = rows[index];
  
  if (!row) return null;
  
  return (
    <div 
      style={style} 
      className="flex border-b border-gray-200 dark:border-gray-700"
      role="row"
      aria-rowindex={index + 2}
    >
      {headers.map((header, cellIndex) => (
        <div 
          key={cellIndex} 
          className="flex-1 p-2 text-xs truncate border-r border-gray-200 dark:border-gray-700 last:border-r-0"
          title={String(row[header])}
          role="gridcell"
          aria-colindex={cellIndex + 1}
        >
          {typeof row[header] === 'number' ? row[header].toFixed(2) : String(row[header])}
        </div>
      ))}
    </div>
  );
});

VirtualizedRowComponent.displayName = 'VirtualizedRowComponent';

// **OPTIMIZATION 2**: Memoized data stats component
interface DataStatsProps {
  data: MLData;
}

const DataStatsComponent = memo<DataStatsProps>(({ data }) => {
  const { columnCount, rowCount } = useMemo(() => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    return {
      columnCount: keys.length,
      rowCount: values[0]?.length || 0
    };
  }, [data]);

  return (
    <Badge variant="secondary" className="text-xs">
      {columnCount} columns, {rowCount} rows
    </Badge>
  );
});

DataStatsComponent.displayName = 'DataStatsComponent';

// **OPTIMIZATION 3**: Memoized feature importance component
interface FeatureImportanceProps {
  trainingResults: TrainingResults;
}

const FeatureImportanceComponent = memo<FeatureImportanceProps>(({ trainingResults }) => {
  const featureImportanceData = useMemo(() => {
    if (!trainingResults?.additional_metrics?.feature_importance) return [];
    
    return Object.entries(trainingResults.additional_metrics.feature_importance)
      .map(([name, importance]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
        importance: Number((importance * 100).toFixed(2))
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }, [trainingResults.additional_metrics?.feature_importance]);

  if (featureImportanceData.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Feature Importance</h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={featureImportanceData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              fontSize={10}
            />
            <YAxis fontSize={10} />
            <RechartsTooltip 
              formatter={(value: any) => [`${value}%`, 'Importance']}
              labelStyle={{ color: '#374151' }}
            />
            <Bar dataKey="importance" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

FeatureImportanceComponent.displayName = 'FeatureImportanceComponent';

export default function OptimizedResultsPanel({
  data,
  trainingResults,
  reportFormat,
  error,
  loading,
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
  onRetryGenerateReport
}: ResultsPanelProps) {
  
  // **OPTIMIZATION 4**: Stable headers reference to prevent unnecessary re-renders
  const headers = useMemo(() => data ? Object.keys(data) : [], [data]);
  
  // **OPTIMIZATION 5**: Optimized pagination data with stable references
  const { paginatedData, totalPages } = useMemo(() => {
    if (!data || headers.length === 0) {
      return { paginatedData: [], totalPages: 0 };
    }
    
    const start = (currentPage - 1) * pageSize;
    const availableRows = Math.min(pageSize, sampleSize - start);
    
    if (availableRows <= 0) {
      return { paginatedData: [], totalPages: 0 };
    }
    
    const rows = Array.from({ length: availableRows }, (_, i) => {
      const rowIndex = start + i;
      return headers.reduce((acc, header) => {
        acc[header] = data[header][rowIndex];
        return acc;
      }, {} as Record<string, any>);
    });
    
    return {
      paginatedData: rows,
      totalPages: Math.ceil(sampleSize / pageSize)
    };
  }, [data, headers, currentPage, pageSize, sampleSize]);
  
  // **OPTIMIZATION 6**: Stable itemData for react-window to prevent unnecessary re-renders
  const virtualListItemData = useMemo(() => ({
    rows: paginatedData,
    headers: headers
  }), [paginatedData, headers]);
  
  // **OPTIMIZATION 7**: Memoized pagination controls
  const PaginationControls = useMemo(() => (
    <div className="flex justify-center p-4 border-t flex-shrink-0">
      <Pagination role="navigation" aria-label="Data table pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
              aria-disabled={currentPage <= 1}
              tabIndex={currentPage <= 1 ? -1 : 0}
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
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  ), [currentPage, totalPages, onPageChange]);
  
  return (
    <>
      <Card className="h-full bg-white dark:bg-gray-800 border-none shadow-sm flex flex-col">
        <CardHeader className="p-0 pb-2 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-blue-500" />
            Results & Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden pt-3">
          <ScrollArea className="h-full">
            <div className="space-y-6 pr-4">
              {/* Data Preview Section */}
              {data && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Data Overview
                    </h3>
                    <DataStatsComponent data={data} />
                  </div>
                  {showDataPreview && (
                    <Button 
                      onClick={onShowDataPreview}
                      variant="outline" 
                      className="w-full h-9 text-sm border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Data
                    </Button>
                  )}
                </div>
              )}

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
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Features:</span>
                        <span className="font-medium">{trainingResults.n_features}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Samples:</span>
                        <span className="font-medium">{trainingResults.n_samples}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feature Importance Chart */}
                  <FeatureImportanceComponent trainingResults={trainingResults} />
                </div>
              )}

              {/* Report Generation Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Download className="h-4 w-4 text-purple-600" />
                  Generate Report
                </h3>
                <Select value={reportFormat} onValueChange={onReportFormatChange}>
                  <SelectTrigger className="h-9 text-sm" aria-label="Select report format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="word">Word Document</SelectItem>
                    <SelectItem value="ppt">PowerPoint</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={onGenerateReport}
                  disabled={loading.report}
                  className="w-full h-9 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading.report ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                  Preview Report
                </Button>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                    {error.includes('training') && <Button onClick={onRetryTrainModel} variant="link" className="text-sm">Retry</Button>}
                    {error.includes('generating data') && <Button onClick={onRetryGenerateData} variant="link" className="text-sm">Retry</Button>}
                    {error.includes('analysis') && <Button onClick={onRetrySendMessage} variant="link" className="text-sm">Retry</Button>}
                    {error.includes('report') && <Button onClick={onRetryGenerateReport} variant="link" className="text-sm">Retry</Button>}
                  </Alert>
                )}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* **OPTIMIZATION 8**: Optimized Data Preview Dialog */}
      <Dialog open={dataPreviewOpen} onOpenChange={onDataPreviewOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Data Preview</DialogTitle>
            <DialogDescription>
              Showing {pageSize} rows per page of {data ? Object.values(data)[0]?.length || 0 : 0} total rows
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="table" className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="flex-1 overflow-hidden">
              <div className="border rounded-lg bg-white shadow-sm overflow-hidden h-full flex flex-col">
                <ScrollArea className="flex-1">
                  {/* Header Row */}
                  <div className="flex bg-gray-50 dark:bg-gray-800 border-b" role="row" aria-rowindex={1}>
                    {headers.map((header, index) => (
                      <div 
                        key={header} 
                        className="flex-1 p-2 text-xs font-medium border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                        role="columnheader"
                        aria-colindex={index + 1}
                      >
                        {header}
                      </div>
                    ))}
                  </div>
                  
                  {/* **OPTIMIZATION 9**: Optimized Virtualized Data Rows */}
                  <div className="bg-white dark:bg-gray-900">
                    {paginatedData.length > 50 ? (
                      <List
                        height={300}
                        width="100%"
                        itemCount={paginatedData.length}
                        itemSize={32}
                        itemData={virtualListItemData}
                        overscanCount={5}
                      >
                        {VirtualizedRowComponent}
                      </List>
                    ) : (
                      // For small datasets, use regular rendering
                      <div className="max-h-80 overflow-y-auto" role="grid">
                        {paginatedData.map((row, index) => (
                          <div 
                            key={index} 
                            className="flex border-b border-gray-200 dark:border-gray-700"
                            role="row"
                            aria-rowindex={index + 2}
                          >
                            {headers.map((header, cellIndex) => (
                              <div 
                                key={cellIndex} 
                                className="flex-1 p-2 text-xs truncate border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                                title={String(row[header])}
                                role="gridcell"
                                aria-colindex={cellIndex + 1}
                              >
                                {typeof row[header] === 'number' ? row[header].toFixed(2) : String(row[header])}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {PaginationControls}
              </div>
            </TabsContent>
            <TabsContent value="summary" className="flex-1">
              {data && <DataStatsComponent data={data} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}