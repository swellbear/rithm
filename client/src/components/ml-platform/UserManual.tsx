import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Database, 
  MessageSquare, 
  BarChart3, 
  Brain, 
  Shield, 
  Workflow,
  Upload,
  Download,
  Search,
  Eye,
  Settings,
  Play,
  FileText,
  Zap,
  Globe,
  Lock,
  Users,
  TrendingUp,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  X
} from 'lucide-react';

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManual: React.FC<UserManualProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections = [
    { id: 'overview', title: 'Platform Overview', icon: BookOpen },
    { id: 'data', title: 'Data Management', icon: Database },
    { id: 'chat', title: 'AI Assistant', icon: MessageSquare },
    { id: 'results', title: 'Results & Reports', icon: BarChart3 },
    { id: 'ml', title: 'Machine Learning', icon: Brain },
    { id: 'security', title: 'Security & Privacy', icon: Shield },
    { id: 'advanced', title: 'Advanced Features', icon: Workflow }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0 pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Rithm AI Platform - User Manual
              <Badge variant="secondary">v2.0</Badge>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
          <div className="flex h-full">
            {/* Navigation Sidebar */}
            <div className="w-64 border-r bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
              <ScrollArea className="h-full">
                <nav className="space-y-2 p-4">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{section.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </ScrollArea>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 max-w-none">
                  {activeSection === 'overview' && <OverviewSection />}
                  {activeSection === 'data' && <DataManagementSection />}
                  {activeSection === 'chat' && <ChatSection />}
                  {activeSection === 'results' && <ResultsSection />}
                  {activeSection === 'ml' && <MLSection />}
                  {activeSection === 'security' && <SecuritySection />}
                  {activeSection === 'advanced' && <AdvancedSection />}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OverviewSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">Welcome to Rithm AI Platform</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Rithm is an AI-powered machine learning platform for data analysis, 
        model training, and report generation. This manual provides guidance on available platform features.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Start Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold">Upload Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload CSV files or generate synthetic datasets</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold">Analyze with AI</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Use chat interface for intelligent analysis</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold">Generate Reports</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create professional analysis reports</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Platform Architecture</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <Database className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold">Data Management</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upload and process CSV datasets</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold">AI Assistant</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Chat interface for data analysis</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-semibold">Results Panel</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">View training results and generate reports</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const DataManagementSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">Data Management</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Upload and process CSV data files for machine learning analysis.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Data Upload & Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Supported Formats</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> CSV files (.csv)</li>
              <li className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-500" /> Excel files (planned)</li>
              <li className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-500" /> JSON datasets (planned)</li>
              <li className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-500" /> Tab-separated values (planned)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">File Size Limits</h4>
            <ul className="space-y-1 text-sm">
              <li>• Maximum file size: 100MB</li>
              <li>• Maximum rows: 1,000,000</li>
              <li>• Maximum columns: 1,000</li>
              <li>• Multiple file upload supported</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Upload Process</h4>
          <ol className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
            <li>1. Click "Upload Data File" button</li>
            <li>2. Select file from your computer</li>
            <li>3. Review data preview and column detection</li>
            <li>4. Configure data types and parsing options</li>
            <li>5. Confirm upload and begin analysis</li>
          </ol>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Data Cleaning & Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Automatic Cleaning</h4>
            <ul className="space-y-1 text-sm">
              <li>• Missing value detection and imputation</li>
              <li>• Outlier identification and handling</li>
              <li>• Data type standardization</li>
              <li>• Duplicate row detection and removal</li>
              <li>• Column name standardization</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Data Quality Metrics</h4>
            <ul className="space-y-1 text-sm">
              <li>• Completeness percentage</li>
              <li>• Data consistency scores</li>
              <li>• Statistical summaries</li>
              <li>• Distribution analysis</li>
              <li>• Correlation matrices</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Privacy & Processing Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold">Local Processing Mode</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable local processing to keep all data on your device. No data is sent to external servers.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold">Consent Management</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control data processing permissions and manage privacy settings for each dataset.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ChatSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">AI Assistant</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Intelligent conversational interface for data analysis and machine learning guidance.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Chat Interface Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">AI Capabilities</h4>
            <ul className="space-y-1 text-sm">
              <li>• Natural language data queries</li>
              <li>• Statistical analysis explanations</li>
              <li>• Machine learning recommendations</li>
              <li>• Code generation and debugging</li>
              <li>• Report writing assistance</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">AI Models</h4>
            <ul className="space-y-1 text-sm">
              <li>• OpenAI GPT models (with API key)</li>
              <li>• Local models (when configured)</li>
              <li>• Chat-based data analysis</li>
              <li>• Natural language queries</li>
            </ul>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Example Queries</h4>
          <ul className="space-y-1 text-sm text-green-600 dark:text-green-400">
            <li>• "Train a linear regression model"</li>
            <li>• "Show me a summary of the uploaded data"</li>
            <li>• "Generate a report with the training results"</li>
            <li>• "What columns are in my dataset?"</li>
            <li>• "Help me understand the model performance"</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="w-5 h-5" />
          Workflow Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Intelligent Action Detection</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            The AI assistant automatically detects your intent and creates workflow nodes for complex operations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-1">Trigger Keywords</h5>
              <ul className="space-y-1 text-sm">
                <li>• "train model" → ML Training Node</li>
                <li>• "search" → Web Search Node</li>
                <li>• "analyze image" → Vision Analysis</li>
                <li>• "generate report" → Report Node</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-1">Workflow Actions</h5>
              <ul className="space-y-1 text-sm">
                <li>• Automatic node creation</li>
                <li>• Parameter configuration</li>
                <li>• Execution monitoring</li>
                <li>• Result integration</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Web Search Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Built-in web search capabilities for research and data augmentation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Search Features</h4>
              <ul className="space-y-1 text-sm">
                <li>• Real-time web search</li>
                <li>• Result summarization</li>
                <li>• Source citation</li>
                <li>• Downloadable results</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Use Cases</h4>
              <ul className="space-y-1 text-sm">
                <li>• Market research</li>
                <li>• Industry benchmarking</li>
                <li>• Competitive analysis</li>
                <li>• Data validation</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ResultsSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">Results & Reports</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Comprehensive visualization and reporting capabilities for data insights.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Data Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Chart Types</h4>
            <ul className="space-y-1 text-sm">
              <li>• Line charts</li>
              <li>• Bar charts</li>
              <li>• Scatter plots</li>
              <li>• Histograms</li>
              <li>• Box plots</li>
              <li>• Heatmaps</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Statistical Charts</h4>
            <ul className="space-y-1 text-sm">
              <li>• Correlation matrices</li>
              <li>• Distribution plots</li>
              <li>• Regression lines</li>
              <li>• Confidence intervals</li>
              <li>• Trend analysis</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Interactive Features</h4>
            <ul className="space-y-1 text-sm">
              <li>• Zoom and pan</li>
              <li>• Data point tooltips</li>
              <li>• Legend toggling</li>
              <li>• Color customization</li>
              <li>• Export options</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Report Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Report Types</h4>
            <ul className="space-y-1 text-sm">
              <li>• Executive summaries</li>
              <li>• Technical analysis reports</li>
              <li>• Data quality assessments</li>
              <li>• Model performance reports</li>
              <li>• Custom formatted reports</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Export Formats</h4>
            <ul className="space-y-1 text-sm">
              <li>• PDF documents</li>
              <li>• Word documents (.docx)</li>
              <li>• PowerPoint presentations</li>
              <li>• HTML reports</li>
              <li>• JSON data exports</li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Report Features</h4>
          <ul className="space-y-1 text-sm text-purple-600 dark:text-purple-400">
            <li>• Automatic chart embedding</li>
            <li>• Professional formatting</li>
            <li>• Statistical summaries</li>
            <li>• Methodology descriptions</li>
            <li>• Recommendations and insights</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Training Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Model Metrics</h4>
              <ul className="space-y-1 text-sm">
                <li>• Accuracy scores</li>
                <li>• Precision and recall</li>
                <li>• F1 scores</li>
                <li>• ROC curves</li>
                <li>• Confusion matrices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Training Analytics</h4>
              <ul className="space-y-1 text-sm">
                <li>• Loss curves</li>
                <li>• Validation metrics</li>
                <li>• Feature importance</li>
                <li>• Learning curves</li>
                <li>• Hyperparameter impact</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const MLSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">Machine Learning</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Comprehensive machine learning capabilities with automated model selection and training.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Supported Algorithms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Currently Available</h4>
            <ul className="space-y-1 text-sm">
              <li>• Linear Regression</li>
              <li>• Random Forest</li>
              <li>• Basic model training</li>
              <li>• Performance metrics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Planned Features</h4>
            <ul className="space-y-1 text-sm">
              <li>• Classification models</li>
              <li>• Clustering algorithms</li>
              <li>• Advanced preprocessing</li>
              <li>• Hyperparameter tuning</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Output</h4>
            <ul className="space-y-1 text-sm">
              <li>• Training metrics</li>
              <li>• Model performance</li>
              <li>• Basic visualizations</li>
              <li>• Generated reports</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Training Process
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
            </div>
            <div>
              <h4 className="font-semibold">Data Preparation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatic feature engineering, scaling, and train/test split
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold">Model Selection</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Intelligent algorithm recommendation based on data characteristics
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold">Training & Validation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cross-validation and hyperparameter optimization
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">4</span>
            </div>
            <div>
              <h4 className="font-semibold">Evaluation & Reporting</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comprehensive performance metrics and visualizations
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Bias Detection & Fairness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Basic model evaluation and performance monitoring capabilities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Current Features</h4>
              <ul className="space-y-1 text-sm">
                <li>• Basic accuracy metrics</li>
                <li>• Training performance</li>
                <li>• Model evaluation</li>
                <li>• Results visualization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Future Development</h4>
              <ul className="space-y-1 text-sm">
                <li>• Advanced bias detection</li>
                <li>• Fairness analysis</li>
                <li>• Comprehensive metrics</li>
                <li>• Mitigation strategies</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SecuritySection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">Security & Privacy</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Basic security features and privacy options for data processing.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Data Privacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Local Processing</h4>
            <ul className="space-y-1 text-sm">
              <li>• Client-side data processing</li>
              <li>• No data transmission to servers</li>
              <li>• Local AI model execution</li>
              <li>• Browser-based computations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Data Encryption</h4>
            <ul className="space-y-1 text-sm">
              <li>• End-to-end encryption</li>
              <li>• TLS 1.3 for data in transit</li>
              <li>• AES-256 for data at rest</li>
              <li>• Secure key management</li>
            </ul>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Privacy Controls</h4>
          <ul className="space-y-1 text-sm text-green-600 dark:text-green-400">
            <li>• Granular consent management</li>
            <li>• Data retention policies</li>
            <li>• Right to delete functionality</li>
            <li>• Audit trail logging</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Access Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Authentication</h4>
            <ul className="space-y-1 text-sm">
              <li>• Username/password login</li>
              <li>• User registration</li>
              <li>• Session-based auth</li>
              <li>• Logout functionality</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Access Control</h4>
            <ul className="space-y-1 text-sm">
              <li>• User-specific data isolation</li>
              <li>• Protected API endpoints</li>
              <li>• Session validation</li>
              <li>• Basic permission checks</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Data Handling</h4>
              <ul className="space-y-1 text-sm">
                <li>• Local data processing option</li>
                <li>• User consent controls</li>
                <li>• Session-based authentication</li>
                <li>• Basic privacy settings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Current Implementation</h4>
              <ul className="space-y-1 text-sm">
                <li>• Basic user authentication</li>
                <li>• Session management</li>
                <li>• Optional local processing</li>
                <li>• File upload restrictions</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AdvancedSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold mb-4">Advanced Features</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Additional platform features and technical information.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          API Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">REST API</h4>
            <ul className="space-y-1 text-sm">
              <li>• Full platform API access</li>
              <li>• RESTful endpoints</li>
              <li>• JSON request/response</li>
              <li>• Rate limiting</li>
              <li>• API versioning</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Current Integration</h4>
            <ul className="space-y-1 text-sm">
              <li>• Web-based interface</li>
              <li>• RESTful API access</li>
              <li>• OpenAI API integration</li>
              <li>• CSV data import</li>
              <li>• Report export (Word/PowerPoint)</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Available Endpoints</h4>
          <div className="space-y-1 text-sm text-blue-600 dark:text-blue-400 font-mono">
            <div>POST /api/ml/train-model</div>
            <div>POST /api/ml/generate-report</div>
            <div>POST /api/auth/login</div>
            <div>POST /api/auth/register</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Data Export & Backup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Export Formats</h4>
            <ul className="space-y-1 text-sm">
              <li>• CSV/Excel exports</li>
              <li>• JSON data exports</li>
              <li>• Model exports (pkl, onnx)</li>
              <li>• Report exports (PDF, Word)</li>
              <li>• Configuration backups</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Backup Options</h4>
            <ul className="space-y-1 text-sm">
              <li>• Automatic backups</li>
              <li>• Manual export triggers</li>
              <li>• Cloud storage integration</li>
              <li>• Version control</li>
              <li>• Incremental backups</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Customization & Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">UI Customization</h4>
              <ul className="space-y-1 text-sm">
                <li>• Theme customization</li>
                <li>• Dashboard layouts</li>
                <li>• Custom color schemes</li>
                <li>• Panel configurations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Workflow Settings</h4>
              <ul className="space-y-1 text-sm">
                <li>• Default algorithms</li>
                <li>• Processing pipelines</li>
                <li>• Validation rules</li>
                <li>• Notification preferences</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default UserManual;