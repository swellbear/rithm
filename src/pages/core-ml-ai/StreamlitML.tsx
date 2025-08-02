import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Cpu, BarChart3, Brain } from 'lucide-react';

export default function StreamlitML() {
  useEffect(() => {
    // Auto-redirect to Streamlit app after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = '/streamlit';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 Comprehensive ML Platform
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            Advanced Machine Learning with PyTorch, OpenAI Integration & PDF Reports
          </p>
          
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <p className="text-green-300 font-medium">
              ✅ Redirecting to your ML platform in 3 seconds...
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Cpu className="h-5 w-5 text-blue-400" />
                PyTorch ML
              </CardTitle>
              <CardDescription className="text-slate-400">
                Domain adaptation, adversarial training, automation pipeline
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Brain className="h-5 w-5 text-purple-400" />
                OpenAI Integration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Intelligent goal analysis and recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5 text-green-400" />
                Advanced Reports
              </CardTitle>
              <CardDescription className="text-slate-400">
                PDF reports with client branding and insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => window.location.href = '/streamlit'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Access ML Platform Now
          </Button>
          
          <p className="text-slate-400 mt-4 text-sm">
            Can't see the redirect? Click the button above to access your ML platform directly.
          </p>
        </div>
      </div>
    </div>
  );
}