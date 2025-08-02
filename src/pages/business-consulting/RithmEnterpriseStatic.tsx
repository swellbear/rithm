import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Zap, Plus, FileText, File, Folder, Upload, Download, Search,
  Activity, BarChart3, Brain, MessageSquare, Send, Target,
  Calculator, Save, X, Settings, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, GripVertical
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
  isDirty: boolean;
  lastModified: Date;
}

interface Conversation {
  id: string;
  type: 'user' | 'rithm';
  content: string;
  framework?: string;
  confidence?: number;
  timestamp: Date;
}

interface AnalysisResult {
  id: string;
  framework: string;
  confidence: number;
  insights: string[];
  recommendations: string[];
  dataPoints: number;
  accuracy: number;
  timestamp: Date;
}

interface LearnedPattern {
  pattern: string;
  confidence: number;
  frequency: number;
  accuracy: number;
  lastSeen: Date;
}

export default function RithmEnterpriseStatic() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  const [analysisView, setAnalysisView] = useState<'documents' | 'analysis' | 'patterns'>('documents');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Panel state management
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Queries
  const { data: rithmDocuments = [] } = useQuery({
    queryKey: ['/api/rithm/documents'],
    refetchInterval: 30000,
  });

  const { data: analysisResults = [] } = useQuery<AnalysisResult[]>({
    queryKey: ['/api/rithm/analysis'],
    refetchInterval: 30000,
  });

  const { data: learnedPatterns = [] } = useQuery<LearnedPattern[]>({
    queryKey: ['/api/rithm/patterns'],
    refetchInterval: 30000,
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('POST', '/api/rithm/chat', { query });
      return await response.json();
    },
    onSuccess: (data) => {
      const newConversation: Conversation = {
        id: data.id,
        type: 'rithm',
        content: data.content,
        framework: data.framework,
        confidence: data.confidence,
        timestamp: new Date(),
      };
      setConversations(prev => [...prev, newConversation]);
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Analysis Error",
        description: "Failed to process mathematical analysis",
        variant: "destructive",
      });
    },
  });

  // Initialize sample documents
  useEffect(() => {
    if (rithmDocuments && rithmDocuments.length > 0) {
      const sampleDocs = rithmDocuments.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        content: doc.content,
        type: doc.type,
        size: doc.content.length,
        isDirty: false,
        lastModified: new Date(doc.lastModified),
      }));
      setDocuments(prev => {
        // Only update if documents actually changed
        if (prev.length !== sampleDocs.length || 
            prev.some((doc, i) => doc.id !== sampleDocs[i]?.id)) {
          return sampleDocs;
        }
        return prev;
      });
    }
  }, [rithmDocuments]);

  const activeDoc = documents.find(doc => doc.id === activeDocument);

  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim() || isProcessing) return;

    const userMessage: Conversation = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };

    setConversations(prev => [...prev, userMessage]);
    setIsProcessing(true);
    chatMutation.mutate(currentMessage);
    setCurrentMessage('');
  }, [currentMessage, isProcessing, chatMutation]);

  const updateDocumentContent = useCallback((docId: string, content: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId
        ? { ...doc, content, isDirty: true, size: content.length }
        : doc
    ));
  }, []);

  const createDocument = (name: string, type: string) => {
    return {
      id: `doc-${Date.now()}`,
      name,
      content: '',
      type,
      size: 0,
      isDirty: false,
      lastModified: new Date(),
    };
  };

  const closeDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
    if (activeDocument === docId) {
      setActiveDocument(prev => {
        const remainingDocs = documents.filter(doc => doc.id !== docId);
        return remainingDocs.length > 0 ? remainingDocs[0].id : null;
      });
    }
  }, [activeDocument, documents]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Static Header - Fixed Height */}
      <header className="h-12 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Zap className="h-5 w-5 text-yellow-400" />
          <h1 className="text-base font-bold text-white">Rithm Associate</h1>
          <Badge variant="outline" className="text-xs bg-green-400/10 text-green-400 border-green-400 hidden md:flex">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5" />
            Mathematical Intelligence
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newDoc = createDocument(`document-${Date.now()}`, 'txt');
              setDocuments(prev => [...prev, newDoc]);
              setActiveDocument(newDoc.id);
            }}
            className="h-8 px-3 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </header>

      {/* Main Tri-Screen Layout - Resizable Panels */}
      <main className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Files Directory */}
          <Panel 
            defaultSize={20} 
            minSize={15} 
            maxSize={40}
            collapsible={true}
            {...(leftPanelCollapsed && { collapsed: leftPanelCollapsed })}
            onCollapse={setLeftPanelCollapsed}
          >
            <aside className="h-full bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden">
              {/* Files Header */}
              <div className="h-10 bg-slate-750 border-b border-slate-600 flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">Files</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Upload className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => setLeftPanelCollapsed(true)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Files List - Static, No Scrolling */}
              <div className="flex-1 p-3 overflow-hidden">
                <div className="space-y-1">
                  {documents.slice(0, 6).map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all hover:bg-slate-700 ${
                        activeDocument === doc.id ? 'bg-blue-600/20 border-l-2 border-l-blue-400' : ''
                      }`}
                      onClick={() => setActiveDocument(doc.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-200 truncate">{doc.name}</div>
                          <div className="text-xs text-slate-500">{doc.size} bytes</div>
                        </div>
                      </div>
                      {doc.isDirty && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-slate-600 hover:bg-slate-500 transition-colors flex items-center justify-center group">
            <GripVertical className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </PanelResizeHandle>

          {/* Middle Panel - Chat Agent (Central Focus) */}
          <Panel defaultSize={50} minSize={30}>
            <section className="h-full bg-slate-900 border-r border-slate-600 flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="h-10 bg-slate-750 border-b border-slate-600 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  {leftPanelCollapsed && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 mr-2"
                      onClick={() => setLeftPanelCollapsed(false)}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">Associate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5" />
                    Online
                  </Badge>
                  {rightPanelCollapsed && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => setRightPanelCollapsed(false)}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Messages - Scrollable */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {conversations.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-100 border border-slate-600'
                      }`}>
                        <div className="text-sm">{message.content}</div>
                        {message.framework && (
                          <div className="mt-2 pt-2 border-t border-slate-600 text-xs opacity-90">
                            <div className="flex items-center justify-between">
                              <span>Framework: {message.framework}</span>
                              <span>Confidence: {message.confidence}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input - Fixed Bottom */}
              <div className="p-4 border-t border-slate-600 bg-slate-800">
                <div className="space-y-2">
              <div className="flex space-x-2">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Message Associate.."
                  className="flex-1 h-12 bg-slate-900 border-slate-600 text-slate-100 resize-none text-sm"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isProcessing}
                  size="sm"
                  className="h-12 px-4"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex gap-1 text-xs text-slate-400 flex-wrap">
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">VAR Analysis</Badge>
                <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">SEM Framework</Badge>
                <Badge variant="outline" className="text-xs text-green-400 border-green-400">Convergence Prediction</Badge>
                </div>
              </div>
            </div>
            </section>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-1 bg-slate-600 hover:bg-slate-500 transition-colors flex items-center justify-center group">
            <GripVertical className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </PanelResizeHandle>

          {/* Right Panel - Document View & Analysis */}
          <Panel 
            defaultSize={30} 
            minSize={20} 
            maxSize={50}
            collapsible={true}
            {...(rightPanelCollapsed && { collapsed: rightPanelCollapsed })}
            onCollapse={setRightPanelCollapsed}
          >
            <aside className="h-full bg-slate-800 flex flex-col overflow-hidden">
              {/* Panel Header with Tabs */}
              <div className="h-10 bg-slate-750 border-b border-slate-600 flex items-center justify-between px-3">
                <div className="flex space-x-1">
                  <Button
                    variant={analysisView === 'documents' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAnalysisView('documents')}
                    className="h-6 px-2 text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Docs
                  </Button>
                  <Button
                    variant={analysisView === 'analysis' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAnalysisView('analysis')}
                    className="h-6 px-2 text-xs"
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Analysis
                  </Button>
                  <Button
                    variant={analysisView === 'patterns' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAnalysisView('patterns')}
                    className="h-6 px-2 text-xs"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    Patterns
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setRightPanelCollapsed(true)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>

              {/* Panel Content - Static, No Scrolling */}
              <div className="flex-1 overflow-hidden">
                {analysisView === 'documents' && (
                  <div className="h-full flex flex-col overflow-hidden">
                    {/* Document Tabs */}
                    {documents.length > 0 && (
                      <div className="flex-shrink-0 bg-slate-750 border-b border-slate-600 px-1 py-1">
                        <div className="flex space-x-0.5 overflow-x-auto">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className={`flex items-center group min-w-0 max-w-32 rounded-sm transition-colors ${
                                activeDocument === doc.id 
                                  ? 'bg-slate-600 text-white' 
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-650'
                              }`}
                            >
                              <button
                                onClick={() => setActiveDocument(doc.id)}
                                className="flex items-center gap-1 px-2 py-1 min-w-0 flex-1"
                              >
                                <FileText className="h-3 w-3 flex-shrink-0" />
                                <span className="text-xs truncate">{doc.name}</span>
                                {doc.isDirty && <div className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeDocument(doc.id);
                                }}
                                className="flex-shrink-0 p-1 hover:bg-slate-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Document Content Area */}
                    <div className="flex-1 p-3 overflow-hidden">
                      {activeDoc ? (
                        <div className="h-full flex flex-col">
                          {/* Document Content - Fixed height */}
                          <Textarea
                            value={activeDoc.content}
                            onChange={(e) => updateDocumentContent(activeDoc.id, e.target.value)}
                            className="flex-1 resize-none bg-slate-900 border-slate-600 text-slate-100 font-mono text-xs"
                            placeholder="Start writing..."
                          />
                        </div>

                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                          <div className="text-center">
                            <FileText className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">No Document Selected</p>
                            <p className="text-xs opacity-75">Open a file to start editing</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {analysisView === 'analysis' && (
                  <div className="p-3 h-full overflow-hidden">
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 mb-2">Mathematical Analysis</div>
                      {analysisResults.slice(0, 3).map((result) => (
                        <div key={result.id} className="bg-slate-700 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white">{result.framework}</span>
                            <Badge variant="outline" className="text-xs">
                              {result.confidence.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400">
                            {result.insights.slice(0, 1).map((insight, idx) => (
                              <div key={idx}>• {insight}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisView === 'patterns' && (
                  <div className="p-3 h-full overflow-hidden">
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 mb-2">Discovered Patterns</div>
                      {learnedPatterns.slice(0, 3).map((pattern, idx) => (
                        <div key={idx} className="bg-slate-700 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <Activity className="h-3 w-3 text-yellow-400" />
                              <span className="text-xs font-medium text-white truncate">{pattern.pattern}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {pattern.confidence.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Freq: {pattern.frequency}</span>
                            <span>Acc: {pattern.accuracy.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}