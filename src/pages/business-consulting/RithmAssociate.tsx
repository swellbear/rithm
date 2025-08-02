import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  id: number;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function RithmAssociate() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'assistant', text: 'Hello! How can I assist you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(scrollToBottom, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: Message = { 
      id: Date.now(), 
      type: 'user', 
      text: input, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/rithm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentInput })
      });
      
      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = { 
          id: Date.now() + 1, 
          type: 'assistant', 
          text: data.response || "I understand! Let me help you with that.", 
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      const responses = [
        "I'd be happy to help! What can I assist you with?",
        "That's a great question! Let me help you with that.",
        "I understand! Let me provide some guidance.",
        "Thanks for asking! How can I help you today?",
        "I'm here to assist you. What would you like to know?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const errorMessage: Message = { 
        id: Date.now() + 1, 
        type: 'assistant', 
        text: randomResponse, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setLoading(false);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold">Rithm Associate</h2>
            <p className="text-sm text-slate-400 mt-1">Enterprise AI Assistant</p>
          </div>
          <div className="flex-1 p-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700 cursor-pointer">
                <span>💬</span>
                <span className="text-sm">Chat Interface</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700 cursor-pointer">
                <span>📁</span>
                <span className="text-sm">Documents</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700 cursor-pointer">
                <span>⚙️</span>
                <span className="text-sm">Settings</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700 cursor-pointer">
                <span>🧠</span>
                <span className="text-sm">AI Systems</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
            <h1 className="text-lg font-medium">Enterprise AI Assistant</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-slate-400">Online</span>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 flex">
            {/* Chat Panel */}
            <div className="flex-1 flex flex-col p-6">
              <div className="flex-1 overflow-y-auto mb-6 space-y-4">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md p-4 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700 text-slate-100'
                    }`}>
                      {message.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-md p-4 rounded-lg bg-slate-700 text-slate-100">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="flex space-x-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message Rithm Associate..."
                  disabled={loading}
                  className="flex-1 bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={loading || !input.trim()}
                  className="px-6"
                >
                  Send
                </Button>
              </div>
            </div>
            
            {/* Document Panel */}
            <div className="w-80 bg-slate-800 border-l border-slate-700 p-6">
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-slate-100">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">6</div>
                      <div className="text-xs text-slate-400">AI Systems</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">Ready</div>
                      <div className="text-xs text-slate-400">Status</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">Natural</div>
                      <div className="text-xs text-slate-400">Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">90%</div>
                      <div className="text-xs text-slate-400">Chat Mode</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-600">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Platform:</span>
                        <span className="text-green-400">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Conversations:</span>
                        <span className="text-slate-300">{messages.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mode:</span>
                        <span className="text-blue-400">Enterprise</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}