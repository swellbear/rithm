import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Wifi, 
  WifiOff,
  MessageSquare,
  Brain,
  Zap
} from "lucide-react";
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysisType?: string;
  confidence?: number;
  model?: string;
  mode?: string;
  processingTime?: string;
  offline?: boolean;
}

interface ChatResponse {
  success: boolean;
  response: string;
  analysisType: string;
  confidence: number;
  model: string;
  mode: string;
  processing_time?: string;
  offline?: boolean;
  warning?: string;
  error?: string;
}

const MLChatTest = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useLocalModel, setUseLocalModel] = useState(false);
  const [openaiStatus, setOpenaiStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check OpenAI status on component mount
  useEffect(() => {
    const checkOpenAIStatus = async () => {
      try {
        const response = await fetch('/api/ml/test-openai');
        const data = await response.json();
        setOpenaiStatus(data.openai_status);
      } catch (error) {
        console.error('Failed to check OpenAI status:', error);
      }
    };

    checkOpenAIStatus();
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ml/chat/analyze-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: inputValue }],
          useLocalModel: useLocalModel
        }),
      });

      const data: ChatResponse = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          analysisType: data.analysisType,
          confidence: data.confidence,
          model: data.model,
          mode: data.mode,
          processingTime: data.processing_time,
          offline: data.offline
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (data.warning) {
          toast.error(data.warning);
        }
      } else {
        toast.error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
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

  const getModelIcon = (mode?: string, offline?: boolean) => {
    if (offline || mode === 'local' || mode === 'local_mock') {
      return <WifiOff className="w-4 h-4" />;
    }
    return <Wifi className="w-4 h-4" />;
  };

  const getModelBadgeColor = (mode?: string, offline?: boolean) => {
    if (offline || mode === 'local' || mode === 'local_mock') {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ML Chat Test Interface
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test both local Phi-3 and OpenAI modes for ML consulting
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Local Phi-3 Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {useLocalModel ? 'Active' : 'Standby'}
                </span>
                <Badge variant={useLocalModel ? 'default' : 'secondary'}>
                  {useLocalModel ? 'Local Mode' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                OpenAI API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {openaiStatus?.openai_available ? 'Connected' : 'Unavailable'}
                </span>
                <Badge variant={openaiStatus?.openai_available ? 'default' : 'destructive'}>
                  {openaiStatus?.openai_available ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="local-model"
                checked={useLocalModel}
                onCheckedChange={setUseLocalModel}
              />
              <Label htmlFor="local-model" className="text-sm font-medium">
                Use Local Phi-3 Model {useLocalModel ? '(Offline Mode)' : '(OpenAI Mode)'}
              </Label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {useLocalModel 
                ? 'Local processing with Phi-3-mini-4k-instruct model (downloads automatically if needed)'
                : 'Online processing with OpenAI GPT-3.5-turbo model'
              }
            </p>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="h-96">
          <CardHeader>
            <CardTitle className="text-lg">ML Consultant Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ask me about machine learning, data science, or AI implementation!</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div
                          className={`p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'assistant' && (
                          <div className="flex flex-wrap gap-1 text-xs">
                            <Badge 
                              variant="outline" 
                              className={getModelBadgeColor(message.mode, message.offline)}
                            >
                              <span className="flex items-center gap-1">
                                {getModelIcon(message.mode, message.offline)}
                                {message.model}
                              </span>
                            </Badge>
                            {message.confidence && (
                              <Badge variant="outline">
                                Confidence: {Math.round(message.confidence * 100)}%
                              </Badge>
                            )}
                            {message.processingTime && (
                              <Badge variant="outline">
                                {message.processingTime}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about ML, data science, or AI implementation..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Test Buttons */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setInputValue("What are the key steps in machine learning model development?")}
                className="text-sm"
              >
                ML Model Development Steps
              </Button>
              <Button
                variant="outline"
                onClick={() => setInputValue("How do I choose between different ML algorithms?")}
                className="text-sm"
              >
                Algorithm Selection Guide
              </Button>
              <Button
                variant="outline"
                onClick={() => setInputValue("What are best practices for data preprocessing?")}
                className="text-sm"
              >
                Data Preprocessing Best Practices
              </Button>
              <Button
                variant="outline"
                onClick={() => setInputValue("How can I evaluate model performance?")}
                className="text-sm"
              >
                Model Evaluation Methods
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MLChatTest;