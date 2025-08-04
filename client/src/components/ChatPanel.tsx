import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Bot, User, Loader2, MessageSquare, Lightbulb, Database, Target, Download, Search, Wifi, WifiOff, Workflow } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ReactMarkdown from 'react-markdown';
import { ReactFlow, Background, Controls, addEdge, useNodesState, useEdgesState, Position, Handle, NodeProps, Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/store';
import { useToast } from "@/hooks/use-toast";

// Define proper types for tool node data with all required React Flow properties
interface ToolNodeData extends Record<string, unknown> {
  label: string;
  tool: string;
  onClick?: (tool: string) => void;
  query?: string;
  dataset?: string;
  url?: string;
}

// Custom Tool Node for workflow builder with click handling and website opening
const ToolNode = ({ data }: NodeProps) => {
  const nodeData = data as ToolNodeData;
  
  const handleClick = () => {
    if (nodeData.url) {
      // RESTORED FEATURE: Open websites in new tabs
      window.open(nodeData.url, '_blank', 'noopener,noreferrer');
    }
    nodeData.onClick?.(nodeData.tool);
  };

  return (
    <div 
      className="p-3 bg-blue-100 dark:bg-blue-900 rounded shadow border border-blue-300 dark:border-blue-700 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-blue-500" />
      <div className="font-medium flex items-center gap-1">
        {nodeData.tool === 'web_search' && <Search className="w-3 h-3" />}
        {nodeData.tool === 'generate_data' && <Database className="w-3 h-3" />}
        {nodeData.tool === 'train_model' && <Target className="w-3 h-3" />}
        {nodeData.tool === 'open_website' && <Wifi className="w-3 h-3" />}
        {nodeData.label}
      </div>
      <span className="text-xs text-gray-500">{nodeData.tool}</span>
      {nodeData.url && <span className="text-xs text-blue-500 block">🔗 Click to open</span>}
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-500" />
    </div>
  );
};

// Memoized node types for React Flow to prevent unnecessary re-renders
const nodeTypes = { tool: ToolNode };

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysisType?: string;
  confidence?: number;
  suggestedActions?: string[];
  followUpQuestions?: string[];
  searchResults?: SearchResult[];
  downloadData?: any;
  reportEdited?: boolean;
  modifiedStructure?: any;
  datasetRecommendations?: DatasetRecommendation[];
}

interface DatasetRecommendation {
  name: string;
  url: string;
  description: string;
  category: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance?: number;
}

interface ChatResponse {
  success: boolean;
  response: string;
  suggestedActions?: string[];
  requiredData?: string[];
  analysisType?: string;
  confidence?: number;
  canUseFrameworks?: boolean;
  followUpQuestions?: string[];
  reportEdited?: boolean;
  modifiedStructure?: any;
  editType?: string;
  timestamp?: string;
}

// Simple layout function for workflow nodes
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // Simple grid layout for nodes
  const layoutedNodes = nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % 3) * 200 + 50,
      y: Math.floor(index / 3) * 100 + 50,
    },
  }));

  return {
    nodes: layoutedNodes,
    edges,
  };
};

interface ChatPanelProps {
  onToolRun?: (toolName: string, output: any) => void;
}

function ChatPanel({ onToolRun }: ChatPanelProps) {
  const { setError, setLoading, loading } = useAppStore();
  const useLocalModel = useAppStore((state) => state.useLocalModel);
  const consent = useAppStore((state) => state.consent);
  const reportStructure = useAppStore((state) => state.reportStructure);
  const setReportStructure = useAppStore((state) => state.setReportStructure);
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for the editViaChat custom event from ResultsPanel
  useEffect(() => {
    const handleEditViaChat = (event: CustomEvent) => {
      const { text } = event.detail;
      setInput(text);
      // Focus the textarea after a short delay to ensure it's rendered
      setTimeout(() => {
        const textarea = document.querySelector('[placeholder*="Ask about your data"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(text.length, text.length);
        }
      }, 100);
    };

    window.addEventListener('editViaChat', handleEditViaChat as EventListener);
    
    return () => {
      window.removeEventListener('editViaChat', handleEditViaChat as EventListener);
    };
  }, []);

  // Handle tool execution from node clicks
  const handleToolRun = useCallback(async (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    setIsLoading(true);
    try {
      const toolType = node.data.tool;
      
      if (toolType === 'web_search') {
        const query = input.trim() || 'machine learning best practices';
        const res = await fetch('/api/web_search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const data = await res.json();
        
        // Add result to messages
        const resultMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `## Search Results\n\n${data.results?.map((r: SearchResult, i: number) => 
            `**${i + 1}. ${r.title}**\n${r.snippet}\n🔗 [${r.url}](${r.url})\n`
          ).join('\n') || 'No results found'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, resultMessage]);
        
      } else if (toolType === 'generate_data') {
        // Call actual data generation API
        const res = await fetch('/api/ml/generate-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            domain: 'general',
            sampleSize: 100,
            useLocalModel,
            consent
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          // Update store with real generated data
          useAppStore.getState().setData(data.data);
          
          const resultMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ **Data Generated Successfully**\n\n📊 **Dataset:** ${data.data ? Object.keys(data.data).length : 0} columns, ${data.data ? Object.values(data.data)[0]?.length || 0 : 0} rows\n🔢 **Sample Size:** ${data.sampleSize || 100}\n📁 **Domain:** ${data.domain || 'general'}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, resultMessage]);
        }
        
      } else if (toolType === 'train_model') {
        // Check if data is available first
        const currentData = useAppStore.getState().data;
        if (!currentData) {
          toast({
            title: "No Data Available",
            description: "Please generate or upload data first before training a model",
            variant: "destructive"
          });
          return;
        }
        
        // Call actual model training API
        const res = await fetch('/api/ml/train-model', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            algorithm: 'random_forest',
            useLocalModel,
            consent
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          // Update store with real training results
          useAppStore.getState().setTrainingResults(data.results);
          
          const resultMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎯 **Model Training Complete**\n\n📈 **Accuracy:** ${(data.results?.accuracy * 100).toFixed(1)}%\n🤖 **Algorithm:** ${data.results?.algorithm || 'Random Forest'}\n📊 **Metrics:** R² = ${data.results?.r2_score?.toFixed(3) || 'N/A'}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, resultMessage]);
        }
        
      } else if (toolType === 'analyze_image' || toolType === 'view_image') {
        // Call vision analysis API with mock image for demo
        const res = await fetch('/api/ml/vision/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            useLocalModel,
            consent
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          // Update store with real vision results including imageUrl
          const visionResults = {
            ...data.results,
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          };
          useAppStore.getState().setVisionResults(visionResults);
          
          const resultMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `👁️ **Vision Analysis Complete**\n\n🏷️ **Classifications:** ${data.results?.classifications?.length || 0} found\n📦 **Objects:** ${data.results?.objects?.length || 0} detected\n📝 **OCR Text:** ${data.results?.ocrText ? 'Available' : 'None'}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, resultMessage]);
        }
        
      } else if (toolType === 'analyze_text' || toolType === 'nlp_analysis') {
        // Call NLP analysis API
        const textToAnalyze = input || 'This is a sample text for natural language processing analysis with various entities and sentiments.';
        const res = await fetch('/api/ml/nlp/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: textToAnalyze,
            useLocalModel,
            consent
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          // Update store with real NLP results
          useAppStore.getState().setNLPResults(data.results);
          
          const resultMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `💬 **NLP Analysis Complete**\n\n😊 **Sentiment:** ${data.results?.sentiment || 'Neutral'} (${((data.results?.confidence || 0.5) * 100).toFixed(1)}%)\n🏷️ **Entities:** ${data.results?.entities?.length || 0} found\n📝 **Key Phrases:** ${data.results?.keyPhrases?.length || 0} extracted`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, resultMessage]);
        }
        
      } else if (toolType === 'speech_analysis' || toolType === 'analyze_speech') {
        // Call speech analysis API
        const res = await fetch('/api/ml/speech/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            audioUrl: 'sample-audio',
            useLocalModel,
            consent
          }),
        });
        const data = await res.json();
        
        if (data.success) {
          // Update store with real speech results
          useAppStore.getState().setSpeechResults(data.results);
          
          const resultMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎤 **Speech Analysis Complete**\n\n📝 **Transcript:** "${data.results?.transcript?.substring(0, 50) || 'Sample transcript'}..."\n🎯 **Confidence:** ${((data.results?.confidence || 0.9) * 100).toFixed(1)}%\n👥 **Words:** ${data.results?.words?.length || 0} analyzed`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, resultMessage]);
        }
      }
    } catch (error) {
      setError(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, input, setError, toast]);

  // Handle node clicks for different tool types
  const handleNodeClick = useCallback(async (toolType: string) => {
    console.log('Node clicked:', toolType);
    
    // Find the node by tool type and execute it
    const node = nodes.find(n => n.data.tool === toolType);
    if (node) {
      await handleToolRun(node.id);
    }
  }, [nodes, handleToolRun]);

  // Initialize workflow nodes on component mount
  useEffect(() => {
    const initialNodes: Node<ToolNodeData>[] = [
      {
        id: 'web-search',
        type: 'tool',
        position: { x: 50, y: 50 },
        data: { 
          label: 'Web Search', 
          tool: 'web_search',
          onClick: handleNodeClick
        },
      },
      {
        id: 'generate-data',
        type: 'tool',
        position: { x: 250, y: 50 },
        data: { 
          label: 'Generate Data', 
          tool: 'generate_data',
          onClick: handleNodeClick
        },
      },
      {
        id: 'train-model',
        type: 'tool',
        position: { x: 450, y: 50 },
        data: { 
          label: 'Train Model', 
          tool: 'train_model',
          onClick: handleNodeClick
        },
      }
    ];

    setNodes(initialNodes);
  }, [handleNodeClick, setNodes]);



  // Web search functionality
  const handleWebSearch = useCallback(async () => {
    const query = input.trim() || 'machine learning best practices';
    
    setLoading('data', true);
    
    // Add user query message
    const searchMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `🔍 Searching for: "${query}"`,
      timestamp: new Date()
    };
    
    const newMessages = [...messages, searchMessage];
    setMessages(newMessages);
    
    try {
      const response = await fetch('/api/web_search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const searchData = await response.json();
      
      // Format search results for display
      const resultsContent = searchData.results?.length > 0 
        ? `## Search Results for "${query}"\n\n${searchData.results.map((result: SearchResult, idx: number) => 
            `**${idx + 1}. ${result.title}**\n${result.snippet}\n🔗 [${result.url}](${result.url})\n`
          ).join('\n')}`
        : `No results found for "${query}"`;

      const resultMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: resultsContent,
        timestamp: new Date(),
        analysisType: 'web_search',
        searchResults: searchData.results || [],
        downloadData: searchData
      };

      setMessages([...newMessages, resultMessage]);
      setInput(''); // Clear input after search
      
    } catch (error) {
      console.error('Web search error:', error);
      setError('Web search failed. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Search failed for "${query}". Please check your connection and try again.`,
        timestamp: new Date(),
        analysisType: 'error'
      };
      
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading('data', false);
    }
  }, [input, messages, setLoading, setError]);

  // Download search results
  const handleDownloadResults = useCallback((message: ChatMessage) => {
    if (!message.downloadData) return;
    
    const dataStr = JSON.stringify(message.downloadData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check consent first
    if (!consent) {
      toast({
        title: "Consent Required",
        description: "Please enable consent to data processing in the Data Management panel before chatting.",
        variant: "destructive"
      });
      return;
    }

    // Intent detection BEFORE API call - add nodes based on keywords
    const lowerInput = input.toLowerCase();
    let newNode = null;
    
    if (lowerInput.includes('search') && !nodes.some(n => n.data.tool === 'web_search')) {
      newNode = {
        id: Date.now().toString(),
        type: 'tool' as const,
        position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 },
        data: { 
          label: 'Web Search', 
          tool: 'web_search' as const,
          query: input,
          onClick: handleWorkflowToolExecution
        }
      };
    } else if ((lowerInput.includes('image') || lowerInput.includes('vision') || lowerInput.includes('analyze image')) && !nodes.some(n => n.data.tool === 'analyze_image')) {
      newNode = {
        id: Date.now().toString(),
        type: 'tool' as const,
        position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 },
        data: { 
          label: 'Vision Analysis', 
          tool: 'analyze_image' as const,
          onClick: handleWorkflowToolExecution
        }
      };
    } else if ((lowerInput.includes('text') || lowerInput.includes('nlp') || lowerInput.includes('sentiment')) && !nodes.some(n => n.data.tool === 'analyze_text')) {
      newNode = {
        id: Date.now().toString(),
        type: 'tool' as const,
        position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 },
        data: { 
          label: 'NLP Analysis', 
          tool: 'analyze_text' as const,
          onClick: handleWorkflowToolExecution
        }
      };
    } else if ((lowerInput.includes('speech') || lowerInput.includes('audio') || lowerInput.includes('transcribe')) && !nodes.some(n => n.data.tool === 'speech_analysis')) {
      newNode = {
        id: Date.now().toString(),
        type: 'tool' as const,
        position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 },
        data: { 
          label: 'Speech Analysis', 
          tool: 'speech_analysis' as const,
          onClick: handleWorkflowToolExecution
        }
      };
    } else if ((lowerInput.includes('code') || lowerInput.includes('execute')) && !nodes.some(n => n.data.tool === 'code_execution')) {
      newNode = {
        id: Date.now().toString(),
        type: 'tool' as const,
        position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 },
        data: { 
          label: 'Code Execution', 
          tool: 'code_execution' as const,
          code: input,
          onClick: handleWorkflowToolExecution
        }
      };
    } else if (lowerInput.includes('train') && !nodes.some(n => n.data.tool === 'train_model')) {
      newNode = {
        id: Date.now().toString(),
        type: 'tool' as const,
        position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 },
        data: { 
          label: 'Train Model', 
          tool: 'train_model' as const,
          onClick: handleWorkflowToolExecution
        }
      };
    } else if (lowerInput.includes('data') && !nodes.some(n => n.data.tool === 'generate_data')) {
      newNode = {
        id: Date.now().toString(),
        type: 'tool' as const,
        position: { x: 150 + Math.random() * 300, y: 150 + Math.random() * 200 },
        data: { 
          label: 'Generate Data', 
          tool: 'generate_data' as const,
          onClick: handleWorkflowToolExecution
        }
      };
    } else if ((lowerInput.includes('edit') && lowerInput.includes('report')) || lowerInput.includes('add conclusion') || lowerInput.includes('modify report')) {
      // RESTORE: Edit report intent detection from your original design
      console.log('🔄 Report editing intent detected:', input);
      
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        // Get current training results and data from store (your original approach)
        const currentData = useAppStore.getState().data;
        const currentResults = useAppStore.getState().trainingResults;
        
        const response = await fetch('/api/ml/edit-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instruction: input,
            currentReport: reportStructure || {},
            data: currentData,
            trainingResults: currentResults
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            reportEdited: true,
            modifiedStructure: data.modifiedStructure,
            suggestedActions: data.suggestedActions || ['Generate updated report', 'Add more sections']
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
          // Update report structure if provided
          if (data.modifiedStructure && setReportStructure) {
            setReportStructure(data.modifiedStructure);
          }
          
          toast({
            title: "Report Updated",
            description: "Report has been edited successfully. Generate a new report to see changes.",
          });
        } else {
          throw new Error(data.error || 'Report editing failed');
        }
      } catch (error) {
        console.error('Report editing error:', error);
        setError(`Report editing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ Failed to edit report: ${error instanceof Error ? error.message : 'Unknown error'}. Please try rephrasing your instruction.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      return; // Exit early for report editing (your original design)
    }
    
    // Add the node if intent was detected
    if (newNode) {
      const layouted = getLayoutedElements([...nodes, newNode], edges);
      setNodes(layouted.nodes);
    }

    // CHECK FOR REPORT EDITING INTENT
    if (lowerInput.includes('edit') && (lowerInput.includes('report') || lowerInput.includes('add') || lowerInput.includes('modify'))) {
      console.log('🔄 Report editing intent detected:', input);
      
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        // Get current training results and data from store
        const currentData = useAppStore.getState().data;
        const currentResults = useAppStore.getState().trainingResults;
        
        const response = await fetch('/api/ml/edit-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instruction: input,
            currentReport: {}, // Can be enhanced to track report structure
            data: currentData,
            trainingResults: currentResults
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            reportEdited: true,
            modifiedStructure: data.modifiedStructure,
            suggestedActions: data.suggestedActions || ['Generate updated report', 'Add more sections']
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
          // Show success toast
          toast({
            title: "Report Updated",
            description: "Report has been edited successfully. Generate a new report to see changes.",
          });
        } else {
          throw new Error(data.error || 'Report editing failed');
        }
      } catch (error) {
        console.error('Report editing error:', error);
        setError(`Report editing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ Failed to edit report: ${error instanceof Error ? error.message : 'Unknown error'}. Please try rephrasing your instruction.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      return; // Exit early for report editing
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ml/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          useLocalModel,
          context: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      const data: ChatResponse = await response.json();
      
      if (data.success) {
        // Connect to REAL backend dataset recommendations

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          analysisType: data.analysisType,
          confidence: data.confidence,
          suggestedActions: data.suggestedActions,
          followUpQuestions: data.followUpQuestions,
          datasetRecommendations: data.datasetRecommendations
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Handle report editing responses
        if (data.reportEdited && data.modifiedStructure) {
          console.log('📝 Report was modified, updating structure:', data.modifiedStructure);
          setReportStructure(data.modifiedStructure);
          
          toast({
            title: "Report Updated",
            description: `Successfully ${data.editType?.replace('_', ' ') || 'edited report'}`,
            variant: "default"
          });
        }
        
        // Call onToolRun callback if tool execution was detected
        if (onToolRun && data.analysisType && ['web_search', 'analyze_image', 'analyze_text', 'speech_analysis', 'code_execution', 'train_model', 'generate_data'].includes(data.analysisType)) {
          onToolRun(data.analysisType, data);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        analysisType: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  // Handle suggested action clicks
  const handleSuggestedAction = (action: string) => {
    setInput(action);
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle workflow tool execution (different from node clicks)
  const handleWorkflowToolExecution = useCallback(async (tool: string) => {
    console.log(`Workflow tool executed: ${tool}`);
    
    if (onToolRun) {
      const mockOutput = { tool, status: 'executed', timestamp: new Date() };
      onToolRun(tool, mockOutput);
    }
    
    // Add execution feedback to chat
    const executionMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `🔧 **Tool Executed:** ${tool}\n\nThe ${tool} tool has been triggered from the workflow builder.`,
      timestamp: new Date(),
      analysisType: tool
    };
    
    setMessages(prev => [...prev, executionMessage]);
  }, [onToolRun]);

  const [useOfflineMode, setUseOfflineMode] = useState(false); // Default to online since API key exists

  return (
    <Card className="chat-panel w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">AI Assistant</span>
          </div>
          
          {/* Offline/Online Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2" title="Toggle between OpenAI API (online) and local rithm-chat-engine (offline) processing modes.">
              <WifiOff className="h-4 w-4 text-gray-500" />
              <Switch
                id="offline-mode"
                checked={useOfflineMode}
                onCheckedChange={setUseOfflineMode}
                disabled={false} // Enabled since OpenAI key is configured
              />
              <Wifi className="h-4 w-4 text-green-500" />
              <Label htmlFor="offline-mode" className="text-sm cursor-pointer">
                {useOfflineMode ? (
                  <Badge variant="secondary" className="text-xs">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Local rithm-chat-engine
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs">
                    <Wifi className="w-3 h-3 mr-1" />
                    OpenAI API
                  </Badge>
                )}
              </Label>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-4 flex flex-col" role="region" aria-label="Chat content">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Workflow
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 pr-4 h-full max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Welcome to AI Assistant</p>
                    <p className="text-sm mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Ask questions about your data, request analysis, or get guidance on machine learning workflows</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-shrink-0 mt-1">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className={`rounded-2xl px-4 py-3 ${message.role === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm' 
                        : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : 'prose-gray dark:prose-invert'}`}>
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        
                        {message.analysisType && (
                          <div className="mt-2 flex gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {message.analysisType}
                            </Badge>
                            {message.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(message.confidence * 100)}% confidence
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {message.suggestedActions && message.suggestedActions.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="text-sm font-medium">Suggested actions:</div>
                            {message.suggestedActions.map((action, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 justify-start"
                                onClick={() => handleSuggestedAction(action)}
                              >
                                <Lightbulb className="w-3 h-3 mr-2" />
                                {action}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="text-sm font-medium">Follow-up questions:</div>
                            {message.followUpQuestions.map((question, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 justify-start text-left"
                                onClick={() => handleSuggestedAction(question)}
                              >
                                {question}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* RESTORED SOPHISTICATED FEATURE: Dataset Recommendations with New Tab Opening */}
                        {message.datasetRecommendations && message.datasetRecommendations.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-sm font-medium flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              Recommended Datasets:
                            </div>
                            {message.datasetRecommendations.map((dataset, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className="h-auto p-2 justify-start text-left w-full border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => window.open(dataset.url, '_blank', 'noopener,noreferrer')}
                              >
                                <div className="flex items-start gap-2 w-full">
                                  <Search className="w-3 h-3 mt-0.5 text-blue-500" />
                                  <div className="text-left flex-1">
                                    <div className="font-medium text-blue-600 dark:text-blue-400">{dataset.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{dataset.description}</div>
                                    <div className="text-xs text-blue-500 mt-1">🔗 Click to open in new tab</div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        {message.downloadData && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadResults(message)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-3 h-3" />
                              Download Results
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(isLoading || loading.search) && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">
                            {loading.search ? 'Searching...' : 'Thinking...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t bg-gray-50 dark:bg-gray-800/50 mt-4">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={!consent ? "Please enable consent in Data Management panel first..." : "Ask about your data, request analysis, or get ML guidance..."}
                  className="min-h-[100px] resize-none text-base"
                  disabled={isLoading || !consent}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleWebSearch}
                    disabled={loading.search}
                    variant="outline"
                    size="icon"
                    className="h-[50px] w-[50px] flex-shrink-0"
                    title="Web Search"
                  >
                    {loading.search ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || !consent}
                    size="icon"
                    className="h-[50px] w-[50px] flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="workflow" className="flex-1 flex flex-col mt-4 overflow-hidden">
            {/* Workflow Builder */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100 px-4">Workflow Builder</h3>
              <div className="flex-1 mx-4 mb-4 border rounded bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
                <ReactFlow 
                  nodes={nodes} 
                  edges={edges} 
                  onNodesChange={onNodesChange} 
                  onEdgesChange={onEdgesChange} 
                  onConnect={onConnect} 
                  nodeTypes={nodeTypes}
                  fitView
                  minZoom={0.5}
                  maxZoom={2}
                  defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                >
                  <Background />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ChatPanel;
