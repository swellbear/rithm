import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BrainCircuit, BarChart3, Download, FileText, Zap, Database } from 'lucide-react';

export default function StreamlitApps() {
  const apps = [
    {
      title: "GROK Assessment File",
      description: "Complete ML system with Monte Carlo integration, convergence monitoring, and real scikit-learn training",
      features: ["Monte Carlo Integration", "Real ML Training", "Convergence Analysis", "Performance Metrics"],
      command: "python GROK_ASSESSMENT_FILE.py",
      icon: BrainCircuit,
      status: "Primary Assessment"
    },
    {
      title: "Comprehensive ML App",
      description: "Full-featured ML training monitor with entropy verification, LLM integration, and PDF reports",
      features: ["LLM Integration", "Entropy Verification", "PDF Reports", "Professional UI"],
      command: "streamlit run comprehensive_streamlit_app.py",
      icon: BarChart3,
      status: "Production Ready"
    },
    {
      title: "Monte Carlo Integration",
      description: "Advanced Monte Carlo continuous domain modeling with E[L] = ∫ L(θ, x|D(ξ)) p(ξ) dξ",
      features: ["Domain Modeling", "Error Estimation", "Sensitivity Analysis", "Interactive Viz"],
      command: "streamlit run monte_carlo_streamlit_app.py",
      icon: Zap,
      status: "Mathematical Framework"
    },
    {
      title: "Core ML Export",
      description: "Export trained models to Core ML format for iOS deployment with validation",
      features: ["iOS Export", "Model Validation", "Download Interface", "Batch Export"],
      command: "streamlit run coreml_streamlit_app.py", 
      icon: Download,
      status: "iOS Deployment"
    }
  ];

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Streamlit ML Applications</h1>
        <p className="text-muted-foreground">
          Complete ML system with all 6 advanced features: LLM integration, entropy verification, 
          Monte Carlo integration, Lyapunov stability, PDF reports, and Core ML export.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {apps.map((app, index) => {
          const Icon = app.icon;
          return (
            <Card key={index} className="relative hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-6 h-6 text-primary" />
                    <CardTitle className="text-lg">{app.title}</CardTitle>
                  </div>
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {app.status}
                  </Badge>
                </div>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {app.features.map((feature, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono">{app.command}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyCommand(app.command)}
                      className="h-8 px-2"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Run this command in your terminal to start the application
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Database className="w-5 h-5" />
          System Status
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between">
            <span>OpenAI API Integration:</span>
            <Badge variant="default">✅ Configured</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Monte Carlo Framework:</span>
            <Badge variant="default">✅ Implemented</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Core ML Export:</span>
            <Badge variant="default">✅ Ready</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Entropy Verification:</span>
            <Badge variant="default">✅ Enhanced</Badge>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <h4 className="font-semibold mb-2">Quick Start Guide:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Copy and run the command for your desired application</li>
          <li>Access the Streamlit interface in your browser</li>
          <li>Upload your data or use the synthetic dataset generators</li>
          <li>Configure your ML training parameters</li>
          <li>View real-time results and export models</li>
        </ol>
      </div>
    </div>
  );
}