import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import RithmConsultant from "@/components/RithmConsultant";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import CoreMLDownload from "@/pages/core-ml-ai/CoreMLDownload";
import MLTraining from "@/pages/ml-platform/MLTraining";
import StreamlitApps from "@/pages/core-ml-ai/StreamlitApps";
import StreamlitML from "@/pages/core-ml-ai/StreamlitML";
import MLPlatform from "@/pages/ml-platform/MLPlatform";
import DataManagementPanel from '@/components/ml-platform/DataManagementPanel';
import ChatPanel from '@/components/ml-platform/ChatPanel';
import ResultsPanel from '@/components/ml-platform/ResultsPanel';
import MLChatTest from "@/pages/ml-chat/MLChatTest";
import HealthPage from "@/pages/admin/HealthPage";
import { useAppStore } from '@/store';

import { User } from "@shared/schema";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BrainCircuit, 
  Settings,
  LogOut,
  BarChart3
} from "lucide-react";
import { toast } from "react-hot-toast";
import ReportPreviewDialog from '@/components/ml-platform/ReportPreviewDialog';
import { ReportStructure } from '@/components/ml-platform/types';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ReactFlowProvider } from "@xyflow/react";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent({ user, setUser }: { user: User | null; setUser: (user: User | null) => void }) {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileActivePanel, setMobileActivePanel] = useState<'data' | 'chat' | 'results'>('chat');
  
  // Add state management for ML Platform
  const [domain, setDomain] = useState('general');
  const [sampleSize, setSampleSize] = useState(100);
  const [modelType, setModelType] = useState('linear_regression');
  const [useFaker, setUseFaker] = useState(false);
  const [useLocalModel, setUseLocalModel] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [reportFormat, setReportFormat] = useState<'word' | 'ppt'>('word');
  const [consent, setConsent] = useState(true); // Default consent for report generation
  
  // Project management state
  const [projects, setProjects] = useState<any[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  
  // Get loading state from Zustand store
  const setLoading = useAppStore((state) => state.setLoading);
  
  // Report preview dialog state
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    blob?: Blob;
    format: 'word' | 'ppt';
    filename: string;
  }>({ open: false, format: 'word', filename: '' });
  
  // Report structure state for visual editor from Zustand store
  const setReportStructure = useAppStore((state) => state.setReportStructure);
  const reportStructure = useAppStore((state) => state.reportStructure);
  
  // Get training results from store
  const { data, trainingResults } = useAppStore();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Handle mobile/desktop detection and responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect logic for authenticated users
  useEffect(() => {
    if (user && (location === '/login' || location === '/register')) {
      window.history.pushState({}, '', '/');
    }
  }, [user, location]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Authentication check
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [user, location, setUser]);

  // Tool run handler for auto-opening result panes
  const handleToolRun = (tool: string, output: any) => {
    console.log(`Tool ${tool} executed with output:`, output);
    // Auto-open results panel on mobile when tool completes
    if (isMobile) {
      setMobileActivePanel('results');
    }
  };

  // ML Platform handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔥 UPLOAD HANDLER CALLED:', event.target.files?.length, 'files');
    const file = event.target.files?.[0];
    console.log('🔥 FILE OBJECT:', file?.name, file?.size, file?.type);
    if (!file) {
      console.log('❌ No file found, returning early');
      return;
    }
    
    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        console.log('🔥 CSV content read:', text.substring(0, 100) + '...');
        
        // Simple CSV parsing - split by lines and commas
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const data: any = {};
        
        headers.forEach(header => {
          data[header] = [];
        });
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          headers.forEach((header, index) => {
            data[header].push(values[index]?.trim() || '');
          });
        }
        
        console.log('🔥 CSV UPLOAD - Setting data to Zustand store:', data);
        
        // Set data to Zustand store for Train Model button  
        const appStore = useAppStore.getState();
        appStore.setData(data);
        
        console.log('🔥 Data set to Zustand store - Train button should now be enabled');
        
        setUploadedFileName(file.name);
        
        const rowCount = data[headers[0]]?.length || 0;
        console.log(`✅ CSV uploaded successfully: ${file.name} (${rowCount} rows, ${headers.length} columns)`);
        
      } else {
        console.log('❌ Only CSV files supported in simplified version');
      }
      
      event.target.value = '';
    } catch (error) {
      console.error('🚨 File upload error:', error);
    }
  };

  const handleGenerateData = async () => {
    // Implementation will call backend API
    console.log('Generating data with:', { domain, sampleSize, useFaker });
  };

  const handleTrainModel = async () => {
    console.log('🤖 Training linear_regression model with target column: Estimates Start After');
    
    const data = useAppStore.getState().data;
    console.log('🔧 Store setLoading called: training = true');
    
    if (!data) {
      console.error('❌ No data available for training');
      return;
    }

    try {
      const response = await fetch('/api/ml/train-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          model_type: 'linear_regression',
          target_column: Object.keys(data)[Object.keys(data).length - 1], // Use last column as target
          consent: true
        }),
      });

      const result = await response.json();
      console.log('✅ Training result:', result);
      
      if (result.success && result.model_type) {
        // Store results in Zustand
        useAppStore.getState().setTrainingResults(result);
        console.log('🎯 Training completed successfully');
      } else {
        console.error('❌ Training failed:', result.error || 'No model_type in response');
      }
    } catch (error) {
      console.error('❌ Model training error:', error);
    }
    
    console.log('🔧 Store setLoading called: training = false');
  };

  const handleExportData = () => {
    // Implementation will export data
    console.log('Exporting data');
  };

  const handleSampleSizeBlur = () => {
    // Validate sample size
    if (sampleSize < 10) setSampleSize(10);
    if (sampleSize > 10000) setSampleSize(10000);
  };

  // Project management handlers
  const handleSaveProject = () => {
    const newProject = {
      id: Date.now().toString(),
      name: `Project ${Date.now()}`,
      data: null,
      domain,
      sampleSize,
      modelType,
      trainingResults: null,
      goalDescription: '',
      goalAnalysis: null,
      messages: [],
      useFaker,
      customParams: null,
      uploadedFileName,
      reportFormat,
      useLocalModel,
      created: new Date().toISOString()
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('ml_projects', JSON.stringify(updatedProjects));
    console.log('Project saved:', newProject.name);
  };

  const handleLoadProject = (project: any) => {
    setDomain(project.domain);
    setSampleSize(project.sampleSize);
    setModelType(project.modelType);
    setUseFaker(project.useFaker);
    setUseLocalModel(project.useLocalModel);
    setUploadedFileName(project.uploadedFileName);
    setReportFormat(project.reportFormat);
    console.log('Project loaded:', project.name);
  };

  const handleDeleteProject = (id: string) => {
    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);
    setFilteredProjects(updatedProjects.filter(p => 
      p.name.toLowerCase().includes(projectSearch.toLowerCase())
    ));
    localStorage.setItem('ml_projects', JSON.stringify(updatedProjects));
    console.log('Project deleted:', id);
  };

  const handleProjectSearchChange = (search: string) => {
    setProjectSearch(search);
    setFilteredProjects(projects.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    ));
  };

  // Report generation handler
  const handleGenerateReport = async () => {
    console.log('🔥 handleGenerateReport called in App.tsx - button clicked!');
    console.log('📊 Current data available:', !!data);
    console.log('🤖 Training results available:', !!trainingResults);
    
    if (!data && !trainingResults) {
      console.log('❌ No data or training results - showing error');
      toast.error('No data available for report generation. Generate data or train a model first.');
      return;
    }

    console.log('⏳ Setting loading state to true');
    setLoading('report', true);

    try {
      console.log('📡 Making API request to /api/ml/generate-report');
      const response = await fetch('/api/ml/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: reportFormat,
          data,
          trainingResults: trainingResults, // Use consistent parameter name
          goal_analysis: null,
          chat_history: [],
          reportFormat: reportFormat,
          consent: consent,
          useLocalModel: useLocalModel,
          return_structure: true
        })
      });

      console.log('📡 API response status:', response.status);

      if (response.ok) {
        // Check if response is binary (docx/pptx file) or JSON
        const contentType = response.headers.get('content-type');
        console.log('📡 Response content-type:', contentType);
        
        if (contentType && contentType.includes('application/vnd.openxml')) {
          // Handle binary response (direct .docx/.pptx file)
          console.log('📄 Received binary document response');
          const blob = await response.blob();
          console.log('📄 Blob created successfully:', { size: blob.size, type: blob.type });
          
          const filename = `ML_Report_${new Date().toISOString().split('T')[0]}`;
          
          console.log('🎯 Setting preview dialog state:', { 
            open: true, 
            blobSize: blob.size, 
            format: reportFormat, 
            filename 
          });
          
          setPreviewDialog({
            open: true,
            blob,
            format: reportFormat,
            filename
          });
          
          console.log('🎯 Preview dialog state set - dialog should open now');
          toast.success('Report generated successfully!');
        } else {
          // Handle JSON response with base64 blob
          console.log('📄 Received JSON response with base64 data');
          const result = await response.json();
          console.log('✅ API response received:', { hasBlob: !!result.blob, hasStructure: !!result.structure, responseKeys: Object.keys(result) });
          
          // Set report structure if available for visual editor
          if (result.structure) {
            console.log('📊 Setting report structure for visual editor');
            setReportStructure(result.structure);
          }
          
          // Check if we have blob data
          if (!result.blob) {
            console.error('❌ No blob data in response:', result);
            toast.error('Report generation failed - no document data received');
            return;
          }
          
          try {
            // Convert base64 blob back to actual Blob with proper binary data
            const base64Data = result.blob;
            console.log('🔍 Base64 data length:', base64Data.length);
            
            const binaryString = atob(base64Data);
            console.log('🔍 Binary string length:', binaryString.length);
            
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { 
              type: reportFormat === 'word' ? 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
                'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
            });
            
            console.log('📄 Blob created successfully:', { size: blob.size, type: blob.type });
            
            const filename = `ML_Report_${new Date().toISOString().split('T')[0]}`;
            
            console.log('🎯 Setting preview dialog state:', { 
              open: true, 
              blobSize: blob.size, 
              format: reportFormat, 
              filename 
            });
            
            setPreviewDialog({
              open: true,
              blob,
              format: reportFormat,
              filename
            });
            
            console.log('🎯 Preview dialog state set - dialog should open now');
            toast.success('Report generated successfully!');
          } catch (blobError) {
            console.error('❌ Error creating blob from base64:', blobError);
            toast.error('Failed to process report document');
          }
        }
      } else {
        const result = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('❌ API error:', result);
        toast.error(result.error || 'Failed to generate report');
      }
    } catch (err: any) {
      console.error('❌ Network error:', err);
      toast.error('Network error generating report');
    } finally {
      console.log('⏳ Setting loading state to false');
      setLoading('report', false);
    }
  };

  // Load projects from localStorage on mount
  useEffect(() => {
    const storedProjects = localStorage.getItem('ml_projects');
    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects);
        setProjects(parsedProjects);
        setFilteredProjects(parsedProjects);
      } catch (e) {
        console.error('Failed to load projects:', e);
      }
    }
  }, []);

  // Update filtered projects when projects or search changes
  useEffect(() => {
    setFilteredProjects(projects.filter(p => 
      p.name.toLowerCase().includes(projectSearch.toLowerCase())
    ));
  }, [projects, projectSearch]);

  // Show welcome screen only on root path when not authenticated
  if (!user && location === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BrainCircuit className="w-8 h-8 text-blue-600" />
              <CardTitle className="text-2xl font-bold">Rithm</CardTitle>
            </div>
            <CardDescription>
              Comprehensive AI-powered analytics and machine learning platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Link href="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Login to Access Platform</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full">Create New Account</Button>
              </Link>
            </div>

            <div className="text-center">
              <ModeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login/register pages when not authenticated
  if (!user && (location.startsWith('/login') || location.startsWith('/register'))) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Switch>
            <Route path="/login">{() => <Login setUser={setUser} />}</Route>
            <Route path="/register">{() => <Register setUser={setUser} />}</Route>
          </Switch>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800 h-14 flex items-center justify-between px-4 z-40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-bold">Rithm</h1>
        </div>
        
        {/* Theme Toggle, Health Monitor, and Logout */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Link href="/health">
            <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
              <Settings className="w-4 h-4 mr-2" />
              Health
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content with Resizable Panels */}
      <main className="flex-1 min-h-0 bg-white dark:bg-gray-900">
        <Switch>
          <Route path="/health" component={HealthPage} />
          <Route path="/login">{() => <Login setUser={setUser} />}</Route>
          <Route path="/register">{() => <Register setUser={setUser} />}</Route>
          <Route path="/chat-test" component={MLChatTest} />
          <Route path="/">
            {() => isMobile ? (
              // Mobile layout with drawer navigation
              <div className="flex flex-col h-full">
                {/* Mobile panel selector */}
                <div className="flex bg-gray-100 dark:bg-gray-800 border-b">
                  <Button
                    variant={mobileActivePanel === 'data' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMobileActivePanel('data')}
                    className="flex-1 rounded-none"
                  >
                    Data
                  </Button>
                  <Button
                    variant={mobileActivePanel === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMobileActivePanel('chat')}
                    className="flex-1 rounded-none"
                  >
                    Chat
                  </Button>
                  <Button
                    variant={mobileActivePanel === 'results' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMobileActivePanel('results')}
                    className="flex-1 rounded-none"
                  >
                    Results
                  </Button>
                </div>
                
                {/* Mobile panel content */}
                <div className="flex-1 overflow-hidden">
                  {mobileActivePanel === 'data' && (
                    <div className="h-full p-4">
                      <DataManagementPanel 
                        domain={domain}
                        sampleSize={sampleSize}
                        modelType={modelType}
                        useFaker={useFaker}
                        useLocalModel={useLocalModel}
                        localModelStatus="idle"
                        uploadedFileName={uploadedFileName}
                        onDomainChange={setDomain}
                        onSampleSizeChange={setSampleSize}
                        onModelTypeChange={setModelType}
                        onUseFakerChange={setUseFaker}
                        onUseLocalModelChange={setUseLocalModel}
                        onFileUpload={handleFileUpload}
                        onGenerateData={handleGenerateData}
                        onTrainModel={handleTrainModel}
                        onExportData={handleExportData}
                        onSampleSizeBlur={handleSampleSizeBlur}
                        onOpenStorageMonitor={() => {}}
                        onVisualizationUpdate={() => {}}
                        projects={projects}
                        projectSearch={projectSearch}
                        filteredProjects={filteredProjects}
                        onProjectSearchChange={handleProjectSearchChange}
                        onSaveProject={handleSaveProject}
                        onLoadProject={handleLoadProject}
                        onDeleteProject={handleDeleteProject}
                      />
                    </div>
                  )}
                  {mobileActivePanel === 'chat' && (
                    <div className="h-full p-4">
                      <ReactFlowProvider>
                        <ChatPanel onToolRun={handleToolRun} />
                      </ReactFlowProvider>
                    </div>
                  )}
                  {mobileActivePanel === 'results' && (
                    <div className="h-full p-4">
                      <ResultsPanel 
                        reportFormat={reportFormat}
                        showDataPreview={false}
                        dataPreviewOpen={false}
                        currentPage={1}
                        pageSize={10}
                        sampleSize={sampleSize}
                        reportStructure={reportStructure}

                        onReportFormatChange={setReportFormat}
                        onGenerateReport={handleGenerateReport}
                        onShowDataPreview={() => {}}
                        onDataPreviewOpenChange={() => {}}
                        onPageChange={() => {}}
                        onRetryTrainModel={handleTrainModel}
                        onRetryGenerateData={handleGenerateData}
                        onRetrySendMessage={() => {}}
                        onRetryGenerateReport={handleGenerateReport}
                        onToolRun={handleToolRun} 
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Desktop layout with ResizablePanelGroup
              <ResizablePanelGroup 
                direction="horizontal" 
                className="ml-platform-main min-h-[calc(100vh-3.5rem)]"
              >
                <ResizablePanel 
                  defaultSize={30} 
                  minSize={15} 
                  maxSize={40}
                  className="data-management-panel"
                >
                  <div className="h-full p-4">
                    <DataManagementPanel 
                      domain={domain}
                      sampleSize={sampleSize}
                      modelType={modelType}
                      useFaker={useFaker}
                      useLocalModel={useLocalModel}
                      localModelStatus="idle"
                      uploadedFileName={uploadedFileName}
                      onDomainChange={setDomain}
                      onSampleSizeChange={setSampleSize}
                      onModelTypeChange={setModelType}
                      onUseFakerChange={setUseFaker}
                      onUseLocalModelChange={setUseLocalModel}
                      onFileUpload={handleFileUpload}
                      onGenerateData={handleGenerateData}
                      onTrainModel={handleTrainModel}
                      onExportData={handleExportData}
                      onSampleSizeBlur={handleSampleSizeBlur}
                      onOpenStorageMonitor={() => {}}
                      onVisualizationUpdate={() => {}}
                      projects={projects}
                      projectSearch={projectSearch}
                      filteredProjects={filteredProjects}
                      onProjectSearchChange={handleProjectSearchChange}
                      onSaveProject={handleSaveProject}
                      onLoadProject={handleLoadProject}
                      onDeleteProject={handleDeleteProject}
                    />
                  </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                <ResizablePanel 
                  defaultSize={45} 
                  minSize={30} 
                  maxSize={65}
                  className="ai-chat-panel"
                >
                  <div className="h-full p-4">
                    <ReactFlowProvider>
                      <ChatPanel onToolRun={handleToolRun} />
                    </ReactFlowProvider>
                  </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                <ResizablePanel 
                  defaultSize={25} 
                  minSize={20} 
                  maxSize={50}
                  className="results-panel"
                >
                  <div className="h-full p-4">
                    <ResultsPanel 
                      reportFormat={reportFormat}
                      showDataPreview={false}
                      dataPreviewOpen={false}
                      currentPage={1}
                      pageSize={10}
                      sampleSize={sampleSize}
                      reportStructure={reportStructure}

                      onReportFormatChange={setReportFormat}
                      onGenerateReport={handleGenerateReport}
                      onShowDataPreview={() => {}}
                      onDataPreviewOpenChange={() => {}}
                      onPageChange={() => {}}
                      onRetryTrainModel={handleTrainModel}
                      onRetryGenerateData={handleGenerateData}
                      onRetrySendMessage={() => {}}
                      onRetryGenerateReport={handleGenerateReport}
                      onToolRun={handleToolRun} 
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </Route>
        </Switch>
      </main>
      
      <ReportPreviewDialog
        previewDialog={previewDialog}
        onPreviewDialogChange={setPreviewDialog}
        onDownloadFromPreview={() => {
          if (!previewDialog.blob) return;
          const url = URL.createObjectURL(previewDialog.blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = previewDialog.filename + (previewDialog.format === 'word' ? '.docx' : '.pptx');
          link.click();
          URL.revokeObjectURL(url);
        }}
      />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <AppContent user={user} setUser={setUser} />
          <Toaster />
          <HotToaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />

        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
