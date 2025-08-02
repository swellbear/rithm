import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Database, BrainCircuit, Target, TrendingUp, Download, Send, Upload, Eye, X, Folder, File, Trash2, Save, Moon, Sun, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { renderAsync } from 'docx-preview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming your UI lib has Skeleton

// ... (Keep all interfaces and states as before)

// Add new states for theme and project search
const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
const [projectSearch, setProjectSearch] = useState<string>('');

// In useEffect, load theme from localStorage
useEffect(() => {
  const savedTheme = localStorage.getItem('theme') || 'system';
  setTheme(savedTheme as 'light' | 'dark' | 'system');
  applyTheme(savedTheme);
}, []);

// Function to apply theme
const applyTheme = (newTheme: string) => {
  if (newTheme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  } else {
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }
  localStorage.setItem('theme', newTheme);
};

// Toggle theme function
const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  setTheme(newTheme);
  applyTheme(newTheme);
};

// Filtered projects for search
const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));

// ... (Keep all other functions as before)

return (
  <TooltipProvider>
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <header className="flex items-center justify-between p-4 bg-blue-600 text-white shadow-md">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6" />
          <h1 className="text-xl font-bold">ML Platform</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={toggleTheme} className="p-1">
            {theme === 'light' ? <Sun className="h-5 w-5" /> : theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Badge variant="secondary" className="text-sm">
            Version 1.0
          </Badge>
        </div>
      </header>
      {Object.values(loading).some(l => l) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden" role="region" aria-label="Main application panels">
        <style jsx global>{`
          @media (max-width: 1024px) {
            .panel-group {
              flex-direction: column !important;
            }
            .panel {
              width: 100% !important;
              height: auto !important;
              min-height: 200px;
            }
            .panel-resize-handle {
              display: none;
            }
          }
        `}</style>
        <PanelGroup direction="horizontal" className="h-full panel-group">
          <Panel minSize={15} defaultSize={20} maxSize={30}>
            <div className="h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
              <Tabs defaultValue="data" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>
                <TabsContent value="data" className="flex-1 overflow-y-auto p-4">
                  {loading.data ? (
                    <div className="space-y-4">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : (
                    <Card className="bg-white dark:bg-gray-800 border-none shadow-sm flex flex-col h-full">
                      {/* ... (Data Management content unchanged, but add more tooltips) */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={() => generateData()} disabled={loading.data || sampleSize < 10 || sampleSize > 10000} className="w-full h-9 text-sm bg-blue-600 hover:bg-blue-700">
                            {loading.data ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Generate Data
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Generate synthetic data based on domain and size. Max 10,000 samples for performance.</p>
                        </TooltipContent>
                      </Tooltip>
                      {/* Similar for other buttons */}
                    </Card>
                  )}
                </TabsContent>
                <TabsContent value="projects" className="flex-1 overflow-y-auto p-4">
                  <Card className="bg-white dark:bg-gray-800 border-none shadow-sm flex flex-col h-full">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Folder className="h-5 w-5 text-blue-500" />
                        Project Directory
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Search projects..." 
                            value={projectSearch} 
                            onChange={(e) => setProjectSearch(e.target.value)} 
                            className="pl-10 h-9 text-sm"
                          />
                        </div>
                        <Button onClick={saveProject} className="w-full h-9 text-sm bg-green-600 hover:bg-green-700">
                          <Save className="mr-2 h-4 w-4" />
                          Save Current Project
                        </Button>
                        <ScrollArea className="h-[calc(100%-80px)]">
                          <Accordion type="single" collapsible className="w-full">
                            {filteredProjects.map((project) => (
                              <AccordionItem value={project.id} key={project.id}>
                                {/* ... (Unchanged) */}
                              </AccordionItem>
                            ))}
                          </Accordion>
                          {filteredProjects.length === 0 && (
                            <p className="text-center text-sm text-gray-500 mt-4">No projects found.</p>
                          )}
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </Panel>

          {/* ... (PanelResizeHandle and other panels unchanged, but add skeletons to Associate and Results similarly) */}

          <Panel minSize={30} defaultSize={50} maxSize={60}>
            {/* ... */}
            <ScrollArea className="flex-1 mb-3 h-[calc(100%-80px)]">
              {loading.analysis ? (
                <div className="space-y-4 p-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                {/* Messages */}
              )}
            </ScrollArea>
            {/* ... */}
          </Panel>

          <Panel minSize={20} defaultSize={30} maxSize={40}>
            {/* ... */}
            <ScrollArea className="h-full pr-4">
              {loading.training || loading.report ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                {/* Results content */}
              )}
            </ScrollArea>
            {/* ... */}
          </Panel>
        </PanelGroup>
      </div>

      {/* ... (Dialogs unchanged) */}
    </div>
  </TooltipProvider>
);