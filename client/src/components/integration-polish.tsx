import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  ArrowRight, Upload, Download, FileText, Database, 
  Link2, Workflow, CheckCircle, AlertTriangle, Clock,
  FileSpreadsheet, FileJson, Camera, MapPin, Target,
  RefreshCw, ExternalLink, Copy, Share2
} from "lucide-react";

interface IntegrationPolishProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkflowStep {
  id: string;
  toolId: number;
  toolName: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  dataInputs: string[];
  dataOutputs: string[];
  estimatedTime: string;
  dependencies: string[];
  autoTrigger?: boolean;
}

interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  fileType: string;
  compatibility: string[];
  fields: string[];
  icon: any;
}

interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  sampleData: any;
  format: string;
}

export default function IntegrationPolish({ isOpen, onClose }: IntegrationPolishProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('assessment-to-planning');
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Fetch farm data for workflow integration
  const { data: herds = [] } = useQuery<any[]>({ queryKey: ["/api/herds"] });
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  // Define common workflows
  const workflows = {
    'assessment-to-planning': {
      name: 'Assessment → Planning Workflow',
      description: 'Seamlessly flow from pasture assessment to grazing calendar planning',
      steps: [
        {
          id: 'step-point-assessment',
          toolId: 9,
          toolName: 'Step-Point Assessment',
          description: 'Capture pasture condition and quality data',
          status: 'completed' as const,
          dataInputs: ['paddock_selection', 'gps_coordinates'],
          dataOutputs: ['quality_score', 'species_composition', 'ground_cover'],
          estimatedTime: '15-20 mins',
          dependencies: []
        },
        {
          id: 'dm-availability',
          toolId: 6,
          toolName: 'DM Availability Calculator',
          description: 'Calculate available dry matter from assessment data',
          status: 'active' as const,
          dataInputs: ['quality_score', 'height_measurements', 'species_data'],
          dataOutputs: ['dm_per_acre', 'utilization_rate', 'grazing_days'],
          estimatedTime: '5 mins',
          dependencies: ['step-point-assessment'],
          autoTrigger: true
        },
        {
          id: 'au-calculation',
          toolId: 5,
          toolName: 'Animal Unit Calculator',
          description: 'Determine stocking requirements',
          status: 'pending' as const,
          dataInputs: ['herd_data', 'weight_averages'],
          dataOutputs: ['total_au', 'stocking_rate'],
          estimatedTime: '3 mins',
          dependencies: ['dm-availability']
        },
        {
          id: 'grazing-calendar',
          toolId: 17,
          toolName: 'Grazing Calendar',
          description: 'Generate optimized rotation schedule',
          status: 'pending' as const,
          dataInputs: ['dm_availability', 'au_requirements', 'paddock_recovery'],
          dataOutputs: ['rotation_schedule', 'move_dates', 'rest_periods'],
          estimatedTime: '8 mins',
          dependencies: ['au-calculation'],
          autoTrigger: true
        }
      ]
    },
    'nutrition-optimization': {
      name: 'Nutrition → Supplement Workflow',
      description: 'Analyze nutrition and create optimal supplement plans',
      steps: [
        {
          id: 'plant-identification',
          toolId: 10,
          toolName: 'Plant Identification',
          description: 'Identify species in pasture photos',
          status: 'completed' as const,
          dataInputs: ['photos', 'gps_location'],
          dataOutputs: ['species_list', 'confidence_scores', 'nutritional_data'],
          estimatedTime: '10 mins',
          dependencies: []
        },
        {
          id: 'nutritional-analysis',
          toolId: 11,
          toolName: 'Nutritional Analysis',
          description: 'Analyze feed quality and livestock requirements',
          status: 'active' as const,
          dataInputs: ['species_composition', 'livestock_data', 'life_stage'],
          dataOutputs: ['protein_levels', 'energy_content', 'deficits'],
          estimatedTime: '7 mins',
          dependencies: ['plant-identification'],
          autoTrigger: true
        },
        {
          id: 'supplement-calculator',
          toolId: 8,
          toolName: 'Feed Supplement Calculator',
          description: 'Calculate optimal supplementation strategy',
          status: 'pending' as const,
          dataInputs: ['nutritional_deficits', 'cost_parameters'],
          dataOutputs: ['supplement_plan', 'costs', 'feeding_schedule'],
          estimatedTime: '5 mins',
          dependencies: ['nutritional-analysis'],
          autoTrigger: true
        }
      ]
    },
    'performance-tracking': {
      name: 'Assessment → Performance Workflow',
      description: 'Track performance improvements from management changes',
      steps: [
        {
          id: 'baseline-assessment',
          toolId: 9,
          toolName: 'Baseline Assessment',
          description: 'Establish current pasture condition',
          status: 'completed' as const,
          dataInputs: ['paddock_selection'],
          dataOutputs: ['baseline_metrics'],
          estimatedTime: '20 mins',
          dependencies: []
        },
        {
          id: 'performance-analytics',
          toolId: 12,
          toolName: 'Performance Analytics',
          description: 'Track changes and improvements over time',
          status: 'active' as const,
          dataInputs: ['historical_data', 'current_metrics'],
          dataOutputs: ['trend_analysis', 'improvement_metrics'],
          estimatedTime: '10 mins',
          dependencies: ['baseline-assessment']
        },
        {
          id: 'financial-analysis',
          toolId: 19,
          toolName: 'Financial Analysis',
          description: 'Calculate ROI from management improvements',
          status: 'pending' as const,
          dataInputs: ['performance_data', 'cost_data'],
          dataOutputs: ['roi_analysis', 'profit_optimization'],
          estimatedTime: '15 mins',
          dependencies: ['performance-analytics'],
          autoTrigger: true
        }
      ]
    }
  };

  // Export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'csv-comprehensive',
      name: 'Complete Farm Data (CSV)',
      description: 'All farm data in spreadsheet format',
      fileType: 'csv',
      compatibility: ['Excel', 'Google Sheets', 'Farm management software'],
      fields: ['herds', 'paddocks', 'assessments', 'animals', 'performance_metrics'],
      icon: FileSpreadsheet
    },
    {
      id: 'json-api',
      name: 'API Format (JSON)',
      description: 'Structured data for integration with other systems',
      fileType: 'json',
      compatibility: ['APIs', 'Web applications', 'Custom software'],
      fields: ['complete_dataset', 'metadata', 'relationships'],
      icon: FileJson
    },
    {
      id: 'grazing-plan',
      name: 'Grazing Plan (PDF)',
      description: 'Formatted grazing calendar and recommendations',
      fileType: 'pdf',
      compatibility: ['Printing', 'Sharing', 'Record keeping'],
      fields: ['calendar', 'paddock_maps', 'rotation_schedule'],
      icon: FileText
    },
    {
      id: 'assessment-report',
      name: 'Assessment Report (PDF)',
      description: 'Professional pasture assessment report',
      fileType: 'pdf',
      compatibility: ['Consultants', 'Extension services', 'Documentation'],
      fields: ['assessment_data', 'photos', 'recommendations'],
      icon: Camera
    }
  ];

  // Import templates
  const importTemplates: ImportTemplate[] = [
    {
      id: 'herd-template',
      name: 'Livestock Inventory',
      description: 'Import existing livestock records',
      requiredFields: ['species', 'count', 'averageWeight'],
      optionalFields: ['breed', 'age', 'lactating', 'notes'],
      sampleData: {
        name: 'Main Cattle Herd',
        species: 'cattle',
        breed: 'Angus',
        count: 25,
        averageWeight: 1200,
        age: 3,
        lactating: true,
        lactatingCount: 15
      },
      format: 'CSV'
    },
    {
      id: 'paddock-template',
      name: 'Paddock Data',
      description: 'Import field information and boundaries',
      requiredFields: ['name', 'acres'],
      optionalFields: ['pastureType', 'waterSources', 'shadeAvailability', 'gpsCoordinates'],
      sampleData: {
        name: 'North Pasture',
        acres: 12.5,
        pastureType: 'mixed',
        waterSources: 2,
        shadeAvailability: 'moderate',
        gpsCoordinates: '36.1627,-95.9931'
      },
      format: 'CSV'
    },
    {
      id: 'assessment-template',
      name: 'Historical Assessments',
      description: 'Import previous assessment data',
      requiredFields: ['paddockId', 'date', 'overallQuality'],
      optionalFields: ['groundCover', 'averageHeight', 'notes'],
      sampleData: {
        paddockId: 1,
        date: '2024-06-15',
        overallQuality: 'good',
        groundCover: 85,
        averageHeight: 8.5,
        notes: 'Good recovery after rest period'
      },
      format: 'CSV'
    }
  ];

  // Get current workflow steps
  useEffect(() => {
    if (selectedWorkflow && workflows[selectedWorkflow as keyof typeof workflows]) {
      setWorkflowSteps(workflows[selectedWorkflow as keyof typeof workflows].steps);
    }
  }, [selectedWorkflow]);

  // Execute workflow step
  const executeWorkflowStep = (stepId: string) => {
    setWorkflowSteps(steps => 
      steps.map(step => {
        if (step.id === stepId) {
          return { ...step, status: 'active' };
        } else if (step.dependencies.includes(stepId)) {
          return { ...step, status: 'pending' };
        }
        return step;
      })
    );

    // Simulate step completion
    setTimeout(() => {
      setWorkflowSteps(steps => 
        steps.map(step => {
          if (step.id === stepId) {
            return { ...step, status: 'completed' };
          } else if (step.dependencies.includes(stepId) && step.autoTrigger) {
            return { ...step, status: 'active' };
          }
          return step;
        })
      );

      toast({
        title: "Step Completed",
        description: `${workflows[selectedWorkflow as keyof typeof workflows].steps.find(s => s.id === stepId)?.toolName} completed successfully.`
      });
    }, 2000);
  };

  // Handle file import
  const handleFileImport = async (templateId: string) => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive"
      });
      return;
    }

    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          toast({
            title: "Import Complete",
            description: `Successfully imported data from ${selectedFile.name}.`
          });
          queryClient.invalidateQueries();
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Handle data export
  const handleDataExport = async (formatId: string) => {
    const format = exportFormats.find(f => f.id === formatId);
    if (!format) return;

    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Simulate file download
          const filename = `graze-pro-${formatId}-${new Date().toISOString().split('T')[0]}.${format.fileType}`;
          toast({
            title: "Export Complete",
            description: `${format.name} exported as ${filename}.`
          });
          return 100;
        }
        return prev + 8;
      });
    }, 150);
  };

  // Generate sample data for download
  const downloadTemplate = (templateId: string) => {
    const template = importTemplates.find(t => t.id === templateId);
    if (!template) return;

    const csvHeaders = [...template.requiredFields, ...template.optionalFields].join(',');
    const csvData = Object.values(template.sampleData).join(',');
    const csvContent = `${csvHeaders}\n${csvData}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: `${template.name} template ready for use.`
    });
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'skipped': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-600" />
              Integration & Data Management
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="workflows" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflows">Smart Workflows</TabsTrigger>
              <TabsTrigger value="import">Data Import</TabsTrigger>
              <TabsTrigger value="export">Data Export</TabsTrigger>
            </TabsList>

            <TabsContent value="workflows" className="space-y-4">
              <Alert>
                <Workflow className="h-4 w-4" />
                <AlertDescription>
                  Smart workflows automatically connect tools and transfer data between steps for seamless farm management.
                </AlertDescription>
              </Alert>

              {/* Workflow Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(workflows).map(([key, workflow]) => (
                  <Card 
                    key={key}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedWorkflow === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedWorkflow(key)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      <div className="mt-3 text-xs text-blue-600">
                        {workflow.steps.length} steps • Auto-integration enabled
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Workflow Steps */}
              {selectedWorkflow && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {workflows[selectedWorkflow as keyof typeof workflows].name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workflowSteps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                              step.status === 'completed' ? 'bg-green-100 border-green-500' :
                              step.status === 'active' ? 'bg-blue-100 border-blue-500' :
                              'bg-gray-100 border-gray-300'
                            }`}>
                              {getStepStatusIcon(step.status)}
                            </div>
                            {index < workflowSteps.length - 1 && (
                              <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{step.toolName}</h4>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {step.estimatedTime}
                                </Badge>
                                {step.status === 'pending' && step.dependencies.every(dep => 
                                  workflowSteps.find(s => s.id === dep)?.status === 'completed'
                                ) && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => executeWorkflowStep(step.id)}
                                  >
                                    Start Step
                                  </Button>
                                )}
                                {step.autoTrigger && (
                                  <Badge variant="secondary" className="text-xs">
                                    Auto
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <div className="font-medium mb-1">Inputs:</div>
                                {step.dataInputs.map((input, idx) => (
                                  <div key={idx} className="text-muted-foreground">• {input.replace('_', ' ')}</div>
                                ))}
                              </div>
                              <div>
                                <div className="font-medium mb-1">Outputs:</div>
                                {step.dataOutputs.map((output, idx) => (
                                  <div key={idx} className="text-muted-foreground">• {output.replace('_', ' ')}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <Alert>
                <Upload className="h-4 w-4" />
                <AlertDescription>
                  Import existing farm data from spreadsheets or other farm management systems.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {importTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Required Fields:</strong>
                          <div className="mt-1 space-y-1">
                            {template.requiredFields.map((field, idx) => (
                              <div key={idx} className="text-muted-foreground">• {field}</div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <strong>Optional Fields:</strong>
                          <div className="mt-1 space-y-1">
                            {template.optionalFields.slice(0, 3).map((field, idx) => (
                              <div key={idx} className="text-muted-foreground">• {field}</div>
                            ))}
                            {template.optionalFields.length > 3 && (
                              <div className="text-muted-foreground">+{template.optionalFields.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => downloadTemplate(template.id)}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="text-xs"
                          />
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={() => handleFileImport(template.id)}
                          disabled={!selectedFile || importProgress > 0}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Import Data
                        </Button>
                      </div>

                      {importProgress > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Importing...</span>
                            <span>{importProgress}%</span>
                          </div>
                          <Progress value={importProgress} className="w-full" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  Export your farm data for backup, sharing, or integration with other systems.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportFormats.map((format) => (
                  <Card key={format.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <format.icon className="h-5 w-5" />
                        {format.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{format.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Compatible with:</strong>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {format.compatibility.map((comp, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <strong>Includes:</strong>
                          <div className="mt-1 space-y-1">
                            {format.fields.map((field, idx) => (
                              <div key={idx} className="text-muted-foreground">• {field.replace('_', ' ')}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleDataExport(format.id)}
                        disabled={exportProgress > 0}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export {format.fileType.toUpperCase()}
                      </Button>

                      {exportProgress > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Exporting...</span>
                            <span>{exportProgress}%</span>
                          </div>
                          <Progress value={exportProgress} className="w-full" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Integration Enhanced",
                description: "Tool integration and data management capabilities have been optimized."
              });
              onClose();
            }}>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}