import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, MessageCircle, User, Bot, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useMLStore } from "@/store/useMLStore";

interface GoalAnalysisResponse {
  success: boolean;
  analysis: {
    reasoning?: string;
    raw_response?: string;
    domain_suggestions?: string[];
    model_recommendations?: string[];
    confidence_score?: number;
    action_trigger?: string;
    custom_params?: {
      sample_size?: number;
      features?: string[];
      domain?: string;
      [key: string]: any;
    };
  };
}

interface ChatInterfaceProps {
  onActionTrigger?: (action: any) => void;
}

export function ChatInterface({ onActionTrigger }: ChatInterfaceProps) {
  const { 
    chatMessages: messages, 
    chatInput, 
    setMessages, 
    setChatInput,
    setDomain,
    setSampleSize,
    setModelType,
    setCustomParams
  } = useMLStore();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // OpenAI status check
  const { data: openaiStatus } = useQuery({
    queryKey: ['/api/ml/test-openai'],
    refetchInterval: 30000,
  });

  const sendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;
    
    const newMessages = [...messages, {role: 'user', content: chatInput}];
    setMessages(newMessages);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ml/analyze-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }) // Send full history
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GoalAnalysisResponse = await response.json();
      
      if (result.success && result.analysis) {
        const assistantResponse = result.analysis.raw_response || result.analysis.reasoning || 'I understand your request. Let me help you with your ML goals.';
        setMessages([...newMessages, {role: 'assistant', content: assistantResponse}]);
        
        // DISABLED: Auto-trigger removed per user's zero-fabrication requirement
        // User must explicitly control all data generation actions
        // const responseText = assistantResponse.toLowerCase();
        // if (responseText.includes("let's proceed with generating") || 
        //     responseText.includes("i'll generate") || 
        //     responseText.includes("let me create the dataset") ||
        //     responseText.includes("generating the data") ||
        //     responseText.includes("proceed with generating the data")) {
        //   
        //   // Auto-trigger data generation
        //   setTimeout(() => {
        //     if (onActionTrigger) {
        //       onActionTrigger('generate_data', result.analysis.custom_params);
        //     }
        //   }, 500); // Small delay to let the message appear first
        // }
        
        // Apply custom parameters from analysis
        if (result.analysis.custom_params) {
          const params = result.analysis.custom_params;
          
          // Update UI state based on extracted parameters
          if (params.domain) {
            setDomain(params.domain);
          }
          if (params.sample_size) {
            setSampleSize(params.sample_size);
          }
          if (result.analysis.model_recommendations?.[0]) {
            setModelType(result.analysis.model_recommendations[0]);
          }
          
          // Store custom parameters (ensure clean object)
          const safeParams = {
            domain: params.domain || '',
            sample_size: params.sample_size || 0,
            features: params.features || [],
            ...(typeof params === 'object' ? Object.fromEntries(
              Object.entries(params).filter(([key, value]) => 
                typeof value !== 'object' || Array.isArray(value)
              )
            ) : {})
          };
          setCustomParams(safeParams);
        }

        // ENABLED: Apply parameter recommendations (but no auto-actions)
        if (result.analysis.action_trigger && onActionTrigger) {
          const trigger = result.analysis.action_trigger.toLowerCase();
          if (trigger.includes('generate data') || trigger.includes('create dataset')) {
            onActionTrigger({
              type: 'generate_data', 
              domain: result.analysis.domain_suggestions?.[0] || result.analysis.custom_params?.domain,
              sample_size: result.analysis.custom_params?.sample_size,
              features: result.analysis.custom_params?.features
            });
          } else if (trigger.includes('train model') || trigger.includes('start training')) {
            onActionTrigger({
              type: 'train_model',
              model_type: result.analysis.model_recommendations?.[0] || 'linear_regression' 
            });
          }
        }
      } else {
        setMessages([...newMessages, {role: 'assistant', content: 'I apologize, but I encountered an issue analyzing your request. Could you please rephrase your ML goal?'}]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, {role: 'assistant', content: 'I encountered a technical issue. Please check your connection and try again.'}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 p-3 border-b">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-semibold">AI Goal Analysis Chat</h3>
        <Badge variant={(openaiStatus as any)?.success && (openaiStatus as any)?.openai_status?.openai_available ? "default" : "secondary"} className="text-xs ml-auto">
          {(openaiStatus as any)?.success && (openaiStatus as any)?.openai_status?.openai_available ? "✅ Connected" : "🔴 AI Offline"}
        </Badge>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ask me about your ML goals, data requirements, or model recommendations</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'}`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyzing your request...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="flex gap-2 mt-4">
        <Input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your ML goals or ask questions..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          onClick={sendMessage} 
          disabled={isLoading || !chatInput.trim()}
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}