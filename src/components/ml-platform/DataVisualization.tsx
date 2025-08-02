import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Info, RefreshCw, Download, Eye, Activity, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { MLData } from './types';
import { mlLogger } from '@/lib/logger';
import { mean, std, variance, median, mode, quantileSeq } from 'mathjs';
import { FixedSizeGrid } from 'react-window';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Props interface for DataVisualization component
 */
interface DataVisualizationProps {
  /** Current ML data containing authentic dataset columns */
  data: MLData | null;
  /** Optional callback when visualization updates */
  onVisualizationUpdate?: (chartType: string, columns: string[]) => void;
}

/**
 * Interface for statistical insights computed from real data
 */
interface DataInsights {
  mean: number;
  std: number;
  variance: number;
  median: number;
  mode: any;
  skewness: number;
  kurtosis: number;
  outliers: number;
  nullCount: number;
  recommendations: string[];
  riskFactors: string[];
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Interface for correlation matrix data
 */
interface CorrelationData {
  features: string[];
  matrix: number[][];
  highCorrelations: Array<{
    feature1: string;
    feature2: string;
    correlation: number;
    risk: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Interface for enhanced chart data
 */
interface ChartDataPoint {
  [key: string]: any;
  name?: string;
  value?: number;
  x?: number;
  y?: number;
  category?: string;
  count?: number;
  percentage?: number;
}

/**
 * Enhanced chart type definitions
 */
type ChartType = 'histogram' | 'scatter' | 'pie' | 'heatmap' | 'boxplot' | 'correlation' | 'distribution' | 'overview';

/**
 * Advanced statistical computation utilities using mathjs
 */
const computeStatistics = (values: number[], columnName: string = 'column'): Partial<DataInsights> => {
  if (!values || values.length === 0) return {};
  
  try {
    const cleanValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (cleanValues.length === 0) return {};

    // Basic statistics using mathjs
    const meanVal = Number(mean(cleanValues));
    const stdVal = Number(std(cleanValues));
    const varianceVal = Number(variance(cleanValues));
    const medianVal = Number(median(cleanValues));
    
    // Compute skewness (using formula: E[(X-μ)³]/σ³)
    const skewnessVal = cleanValues.reduce((sum, x) => sum + Math.pow((x - meanVal) / stdVal, 3), 0) / cleanValues.length;
    
    // Compute kurtosis (using formula: E[(X-μ)⁴]/σ⁴ - 3)
    const kurtosisVal = cleanValues.reduce((sum, x) => sum + Math.pow((x - meanVal) / stdVal, 4), 0) / cleanValues.length - 3;
    
    // Detect outliers using IQR method
    const sortedValues = [...cleanValues].sort((a, b) => a - b);
    const q1 = Number(quantileSeq(sortedValues, 0.25));
    const q3 = Number(quantileSeq(sortedValues, 0.75));
    const iqr = q3 - q1;
    const outliers = cleanValues.filter(v => v < (q1 - 1.5 * iqr) || v > (q3 + 1.5 * iqr)).length;
    
    // Generate recommendations based on statistics
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    
    if (Math.abs(skewnessVal) > 1) {
      recommendations.push(`High skewness (${skewnessVal.toFixed(2)}) - Consider log transformation: np.log(df['${columnName}'])`);
      riskFactors.push('Skewed distribution may impact model performance');
    }
    
    if (outliers > cleanValues.length * 0.05) {
      recommendations.push(`${outliers} outliers detected - Use IQR filtering: df = df[(df < Q3+1.5*IQR) & (df > Q1-1.5*IQR)]`);
      riskFactors.push('High outlier count may skew predictions');
    }
    
    if (stdVal / meanVal > 1) {
      recommendations.push('High coefficient of variation - Consider standardization: StandardScaler()');
      riskFactors.push('High variability may require normalization');
    }

    // Determine data quality
    let dataQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (outliers > cleanValues.length * 0.1 || Math.abs(skewnessVal) > 2) dataQuality = 'poor';
    else if (outliers > cleanValues.length * 0.05 || Math.abs(skewnessVal) > 1) dataQuality = 'fair';
    else if (outliers > cleanValues.length * 0.02 || Math.abs(skewnessVal) > 0.5) dataQuality = 'good';

    return {
      mean: meanVal,
      std: stdVal,
      variance: varianceVal,
      median: medianVal,
      skewness: skewnessVal,
      kurtosis: kurtosisVal,
      outliers,
      nullCount: values.length - cleanValues.length,
      recommendations,
      riskFactors,
      dataQuality
    };
  } catch (error) {
    mlLogger.warn('Statistics computation failed:', error);
    return {};
  }
};

/**
 * Compute correlation matrix for numeric columns
 */
const computeCorrelationMatrix = (data: MLData): CorrelationData => {
  if (!data) return { features: [], matrix: [], highCorrelations: [] };
  
  // Get numeric columns
  const numericColumns = Object.keys(data).filter(key => {
    const values = data[key];
    if (!Array.isArray(values)) return false;
    return values.some(v => !isNaN(Number(v)) && v !== null && v !== '');
  }).slice(0, 10); // Limit to 10 columns for performance

  if (numericColumns.length < 2) return { features: [], matrix: [], highCorrelations: [] };

  const matrix: number[][] = [];
  const highCorrelations: Array<{feature1: string; feature2: string; correlation: number; risk: 'high' | 'medium' | 'low'}> = [];

  // Compute correlation matrix
  for (let i = 0; i < numericColumns.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < numericColumns.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const col1 = data[numericColumns[i]].map(v => Number(v)).filter(v => !isNaN(v));
        const col2 = data[numericColumns[j]].map(v => Number(v)).filter(v => !isNaN(v));
        
        if (col1.length === 0 || col2.length === 0) {
          matrix[i][j] = 0;
          continue;
        }

        // Pearson correlation coefficient
        const mean1 = mean(col1);
        const mean2 = mean(col2);
        const numerator = col1.reduce((sum, val, idx) => sum + (val - mean1) * (col2[idx] - mean2), 0);
        const denominator = Math.sqrt(
          col1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) *
          col2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)
        );
        
        const correlation = denominator === 0 ? 0 : numerator / denominator;
        matrix[i][j] = correlation;

        // Track high correlations
        if (i < j && Math.abs(correlation) > 0.7) {
          const risk = Math.abs(correlation) > 0.9 ? 'high' : Math.abs(correlation) > 0.8 ? 'medium' : 'low';
          highCorrelations.push({
            feature1: numericColumns[i],
            feature2: numericColumns[j],
            correlation,
            risk
          });
        }
      }
    }
  }

  return { features: numericColumns, matrix, highCorrelations };
};

/**
 * Utility function to detect column data types from authentic data
 */
const detectColumnType = (columnData: any[]): 'numeric' | 'categorical' | 'boolean' | 'date' => {
  if (!columnData || columnData.length === 0) return 'categorical';
  
  // Sample first few non-null values for type detection
  const sample = columnData.filter(val => val !== null && val !== undefined).slice(0, 100);
  if (sample.length === 0) return 'categorical';

  // Check for boolean
  if (sample.every(val => typeof val === 'boolean' || val === 'true' || val === 'false' || val === 0 || val === 1)) {
    return 'boolean';
  }

  // Check for numeric
  const numericCount = sample.filter(val => {
    const num = Number(val);
    return !isNaN(num) && isFinite(num);
  }).length;

  if (numericCount / sample.length > 0.8) {
    return 'numeric';
  }

  // Check for dates
  const dateCount = sample.filter(val => {
    const date = new Date(val);
    return date instanceof Date && !isNaN(date.getTime());
  }).length;

  if (dateCount / sample.length > 0.8) {
    return 'date';
  }

  return 'categorical';
};

/**
 * Interface for histogram data processing
 */
interface HistogramData {
  range: string;
  count: number;
  percentage: number;
}

/**
 * Interface for scatter plot data processing
 */
interface ScatterData {
  x: number;
  y: number;
  index: number;
}

/**
 * Process authentic data into histogram bins
 */
const processHistogramData = (columnData: any[], binCount: number = 10): HistogramData[] => {
  if (!columnData || columnData.length === 0) return [];

  const validData = columnData
    .filter(val => val !== null && val !== undefined)
    .map(val => Number(val))
    .filter(num => !isNaN(num) && isFinite(num));

  if (validData.length === 0) return [];

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const binWidth = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    min: min + i * binWidth,
    max: min + (i + 1) * binWidth,
    count: 0
  }));

  // Count data points in each bin
  validData.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
    bins[binIndex].count++;
  });

  const total = validData.length;
  return bins.map(bin => ({
    range: `${bin.min.toFixed(2)} - ${bin.max.toFixed(2)}`,
    count: bin.count,
    percentage: (bin.count / total) * 100
  }));
};

/**
 * Process authentic data for scatter plot
 */
const processScatterData = (xData: any[], yData: any[]): ScatterData[] => {
  if (!xData || !yData || xData.length !== yData.length) return [];

  const scatterData: ScatterData[] = [];
  const minLength = Math.min(xData.length, yData.length);

  for (let i = 0; i < minLength; i++) {
    const x = Number(xData[i]);
    const y = Number(yData[i]);
    
    if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
      scatterData.push({ x, y, index: i });
    }
  }

  return scatterData;
};

/**
 * DataVisualization Component - Enhanced consultant-grade visualization with auto-insights
 */
export default function DataVisualization({ data, onVisualizationUpdate }: DataVisualizationProps) {
  const [chartType, setChartType] = useState<ChartType>('overview');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedXColumn, setSelectedXColumn] = useState<string>('');
  const [selectedYColumn, setSelectedYColumn] = useState<string>('');
  const [binCount, setBinCount] = useState<number>(10);
  const [insights, setInsights] = useState<Partial<DataInsights>>({});
  const [correlationData, setCorrelationData] = useState<CorrelationData>({ features: [], matrix: [], highCorrelations: [] });
  const chartRef = useRef<HTMLDivElement>(null);

  // Get available columns from authentic data
  const availableColumns = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).filter(key => Array.isArray(data[key]) && data[key].length > 0);
  }, [data]);

  // Get numeric columns for scatter plots and analysis
  const numericColumns = useMemo(() => {
    if (!data) return [];
    return availableColumns.filter(col => detectColumnType(data[col]) === 'numeric');
  }, [data, availableColumns]);

  // Compute insights automatically when data or column changes
  useEffect(() => {
    if (!data || !selectedColumn || !data[selectedColumn]) {
      setInsights({});
      return;
    }

    const columnData = data[selectedColumn];
    const numericValues = columnData
      .map(v => Number(v))
      .filter(v => !isNaN(v) && isFinite(v));

    if (numericValues.length > 0) {
      const computedInsights = computeStatistics(numericValues, selectedColumn);
      setInsights(computedInsights);
      mlLogger.info(`Computed insights for ${selectedColumn}:`, computedInsights);
    }
  }, [data, selectedColumn]);

  // Compute correlation matrix when data changes
  useEffect(() => {
    if (!data) return;

    const correlation = computeCorrelationMatrix(data);
    setCorrelationData(correlation);
    mlLogger.info('Correlation analysis:', correlation);
  }, [data]);

  // Auto-select first available columns
  useEffect(() => {
    if (availableColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(availableColumns[0]);
    }
    if (numericColumns.length >= 2 && (!selectedXColumn || !selectedYColumn)) {
      setSelectedXColumn(numericColumns[0]);
      setSelectedYColumn(numericColumns[1]);
    }
  }, [availableColumns, numericColumns, selectedColumn, selectedXColumn, selectedYColumn]);

  // Dataset overview stats
  const datasetStats = useMemo(() => {
    if (!data) return null;
    
    const totalRows = Math.max(...Object.values(data).map(col => Array.isArray(col) ? col.length : 0));
    const totalColumns = availableColumns.length;
    const numericCount = numericColumns.length;
    const categoricalCount = totalColumns - numericCount;
    
    // Calculate data completeness
    let totalCells = 0;
    let nullCells = 0;
    
    availableColumns.forEach(col => {
      const columnData = data[col];
      totalCells += columnData.length;
      nullCells += columnData.filter(val => val === null || val === undefined || val === '').length;
    });
    
    const completeness = totalCells > 0 ? ((totalCells - nullCells) / totalCells) * 100 : 0;
    
    return {
      totalRows,
      totalColumns,
      numericCount,
      categoricalCount,
      completeness: completeness.toFixed(1)
    };
  }, [data, availableColumns, numericColumns]);

  // Process chart data based on type
  const chartData = useMemo(() => {
    if (!data || !selectedColumn) return [];

    switch (chartType) {
      case 'histogram':
        const columnData = data[selectedColumn];
        const columnType = detectColumnType(columnData);
        
        if (columnType === 'numeric') {
          return processHistogramData(columnData, binCount);
        } else {
          // Categorical histogram
          const counts: { [key: string]: number } = {};
          columnData.forEach(val => {
            const key = String(val || 'null');
            counts[key] = (counts[key] || 0) + 1;
          });
          
          const total = columnData.length;
          return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([range, count]) => ({
              range: range.length > 20 ? range.slice(0, 17) + '...' : range,
              count,
              percentage: (count / total) * 100
            }));
        }

      case 'scatter':
        if (!selectedXColumn || !selectedYColumn || !data[selectedXColumn] || !data[selectedYColumn]) return [];
        return processScatterData(data[selectedXColumn], data[selectedYColumn]);

      case 'pie':
        if (!selectedColumn) return [];
        const pieData = data[selectedColumn];
        const pieCounts: { [key: string]: number } = {};
        
        pieData.forEach(val => {
          const key = String(val || 'null');
          pieCounts[key] = (pieCounts[key] || 0) + 1;
        });
        
        return Object.entries(pieCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, value]) => ({ name, value }));

      default:
        return [];
    }
  }, [data, chartType, selectedColumn, selectedXColumn, selectedYColumn, binCount]);

  // Export functions
  const exportPDF = useCallback(async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(16);
      pdf.text('Data Visualization Export', 20, 20);
      
      // Add chart
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
      
      // Add insights if available
      if (insights.recommendations && insights.recommendations.length > 0) {
        let yPos = 40 + imgHeight;
        pdf.setFontSize(12);
        pdf.text('Key Insights:', 20, yPos);
        
        insights.recommendations.slice(0, 3).forEach((rec, idx) => {
          yPos += 10;
          pdf.setFontSize(10);
          pdf.text(`• ${rec}`, 25, yPos);
        });
      }
      
      pdf.save(`data-visualization-${new Date().toISOString().slice(0, 10)}.pdf`);
      mlLogger.info('PDF export completed successfully');
    } catch (error) {
      mlLogger.error('PDF export failed:', error);
    }
  }, [insights.recommendations]);

  const exportCSV = useCallback(() => {
    if (!chartData || chartData.length === 0) return;

    const headers = Object.keys(chartData[0]);
    const csvContent = [
      headers.join(','),
      ...chartData.map(row => headers.map(header => `"${(row as any)[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chart-data-${chartType}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    mlLogger.info('CSV export completed successfully');
  }, [chartData, chartType]);

  // Render chart based on type
  const renderChart = () => {
    if (!data || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Info className="w-6 h-6 mr-2" />
          No data available for visualization
        </div>
      );
    }

    const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe', '#ff8042', '#8dd1e1'];

    switch (chartType) {
      case 'histogram':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value} (${name === 'count' ? 'items' : '%'})`,
                  name === 'count' ? 'Count' : 'Percentage'
                ]}
              />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" name={selectedXColumn || 'X'} />
              <YAxis dataKey="y" name={selectedYColumn || 'Y'} />
              <Tooltip 
                formatter={(value: any, name: string) => [value, name === 'x' ? selectedXColumn : selectedYColumn]}
              />
              <Scatter name="Data Points" data={chartData} fill="#82ca9d" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <div className="w-full space-y-4">
            {/* Pie Chart */}
            <div className="w-full max-w-xs mx-auto">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={0}
                    label={false}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value} items (${((value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data Insights & Recommendations</h4>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {chartData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-sm flex-shrink-0" 
                      style={{ backgroundColor: chartColors[index % chartColors.length] }}
                    />
                    <span className="text-gray-600 dark:text-gray-400 truncate">
                      {entry.name}: {entry.value} items ({((entry.value / chartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'correlation':
        if (correlationData.features.length === 0) {
          return (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <AlertTriangle className="w-6 h-6 mr-2" />
              Insufficient numeric columns for correlation analysis
            </div>
          );
        }
        
        // Create heatmap data
        const heatmapData: ChartDataPoint[] = [];
        correlationData.features.forEach((feature1, i) => {
          correlationData.features.forEach((feature2, j) => {
            heatmapData.push({
              x: i,
              y: j,
              value: correlationData.matrix[i]?.[j] || 0
            });
          });
        });

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {correlationData.highCorrelations.slice(0, 4).map((corr, idx) => (
                <Card key={idx} className={`border-l-4 ${corr.risk === 'high' ? 'border-red-500' : corr.risk === 'medium' ? 'border-yellow-500' : 'border-blue-500'}`}>
                  <CardContent className="p-4">
                    <div className="font-semibold text-sm">
                      {corr.feature1} ↔ {corr.feature2}
                    </div>
                    <div className="text-lg font-bold">
                      {corr.correlation.toFixed(3)}
                    </div>
                    <Badge variant={corr.risk === 'high' ? 'destructive' : corr.risk === 'medium' ? 'secondary' : 'default'}>
                      {corr.risk} risk
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Rows</p>
                    <p className="text-2xl font-bold">{datasetStats?.totalRows.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Columns</p>
                    <p className="text-2xl font-bold">{datasetStats?.totalColumns}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Numeric Columns</p>
                    <p className="text-2xl font-bold">{datasetStats?.numericCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Data Completeness</p>
                    <p className="text-2xl font-bold">{datasetStats?.completeness}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  if (!data) {
    return (
      <div className="p-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No data available. Please upload or generate data first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Chart Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Data Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
            <div className="space-y-2">
              {/* First row of tabs */}
              <TabsList className="grid w-full grid-cols-3 gap-2">
                <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                <TabsTrigger value="histogram" className="text-sm">Histogram</TabsTrigger>
                <TabsTrigger value="scatter" className="text-sm">Scatter</TabsTrigger>
              </TabsList>
              
              {/* Second row of tabs */}
              <TabsList className="grid w-full grid-cols-2 gap-2">
                <TabsTrigger value="pie" className="text-sm">Pie Chart</TabsTrigger>
                <TabsTrigger value="correlation" className="text-sm">Correlation</TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-4 space-y-4">
              {/* Column Selectors */}
              {(chartType === 'histogram' || chartType === 'pie') && (
                <div className="flex gap-4">
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger className="w-64" aria-label="Select column for visualization">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col.length > 30 ? col.slice(0, 27) + '...' : col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {chartType === 'histogram' && detectColumnType(data[selectedColumn] || []) === 'numeric' && (
                    <Select value={binCount.toString()} onValueChange={(value) => setBinCount(parseInt(value))}>
                      <SelectTrigger className="w-32" aria-label="Select number of bins">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 bins</SelectItem>
                        <SelectItem value="10">10 bins</SelectItem>
                        <SelectItem value="15">15 bins</SelectItem>
                        <SelectItem value="20">20 bins</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {chartType === 'scatter' && (
                <div className="flex gap-4">
                  <Select value={selectedXColumn} onValueChange={setSelectedXColumn}>
                    <SelectTrigger className="w-64" aria-label="Select X-axis column">
                      <SelectValue placeholder="Select X axis..." />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col.length > 30 ? col.slice(0, 27) + '...' : col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedYColumn} onValueChange={setSelectedYColumn}>
                    <SelectTrigger className="w-64" aria-label="Select Y-axis column">
                      <SelectValue placeholder="Select Y axis..." />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col.length > 30 ? col.slice(0, 27) + '...' : col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Export Buttons */}
              <div className="flex gap-2">
                <Button onClick={exportPDF} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={exportCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Chart Container */}
            <div ref={chartRef} className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4">
              {renderChart()}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Insights Panel */}
      {selectedColumn && insights.recommendations && insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Data Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Statistics */}
              <div>
                <h4 className="font-semibold mb-2">Statistical Summary</h4>
                <div className="space-y-2 text-sm">
                  {insights.mean !== undefined && (
                    <div>Mean: <span className="font-mono">{insights.mean.toFixed(4)}</span></div>
                  )}
                  {insights.std !== undefined && (
                    <div>Std Dev: <span className="font-mono">{insights.std.toFixed(4)}</span></div>
                  )}
                  {insights.skewness !== undefined && (
                    <div>Skewness: <span className="font-mono">{insights.skewness.toFixed(4)}</span></div>
                  )}
                  {insights.outliers !== undefined && (
                    <div>Outliers: <span className="font-mono">{insights.outliers}</span></div>
                  )}
                  {insights.dataQuality && (
                    <Badge variant={insights.dataQuality === 'excellent' ? 'default' : insights.dataQuality === 'good' ? 'secondary' : 'destructive'}>
                      {insights.dataQuality} quality
                    </Badge>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <div className="space-y-2">
                  {insights.recommendations.slice(0, 3).map((rec, idx) => (
                    <Alert key={idx}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {rec}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </div>

            {/* Sources */}
            <Separator className="my-4" />
            <div className="text-xs text-gray-500">
              <p><strong>Sources:</strong> Statistical analysis based on authentic dataset. 
              Recommendations follow 2025 ML best practices from Scikit-learn documentation 
              (<a href="https://scikit-learn.org/stable/modules/preprocessing.html" className="underline" target="_blank" rel="noopener noreferrer">
                scikit-learn.org/preprocessing
              </a>) and Towards Data Science guidelines.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}