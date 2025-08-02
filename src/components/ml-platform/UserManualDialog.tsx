import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, ChevronRight, Book, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface UserManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
        aria-label="Open user manual"
      >
        <HelpCircle className="h-4 w-4" />
        Help
      </Button>
      <UserManualDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function UserManualDialog({ open, onOpenChange }: UserManualDialogProps) {
  const [manualContent, setManualContent] = useState<string>('');
  const [currentSection, setCurrentSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Fetch the user manual content
      fetch('/docs/USER_MANUAL.md')
        .then(response => response.text())
        .then(content => {
          setManualContent(content);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load user manual:', error);
          setManualContent('# Error\n\nFailed to load user manual. Please try again later.');
          setLoading(false);
        });
    }
  }, [open]);

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'authentication', title: 'Authentication', icon: '🔐' },
    { id: 'data-management', title: 'Data Management', icon: '📊' },
    { id: 'model-training', title: 'Model Training', icon: '🤖' },
    { id: 'ai-chat-features', title: 'AI Chat Features', icon: '💬' },
    { id: 'results--visualization', title: 'Results & Visualization', icon: '📈' },
    { id: 'project-management', title: 'Project Management', icon: '📁' },
    { id: 'reports--export', title: 'Reports & Export', icon: '📄' },
    { id: 'storage-management', title: 'Storage Management', icon: '💾' },
    { id: 'accessibility-features', title: 'Accessibility Features', icon: '♿' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  ];

  const scrollToSection = (sectionId: string) => {
    setCurrentSection(sectionId);
    // Small delay to ensure the DOM is ready
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        // Scroll the element into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            <DialogTitle>ML Platform User Manual</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex h-[calc(100%-4rem)] overflow-hidden">
          {/* Table of Contents Sidebar */}
          <div className="w-64 border-r bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4 text-sm uppercase text-gray-600 dark:text-gray-400">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-800 ${
                      currentSection === section.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    aria-label={`Navigate to ${section.title}`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span className="flex-1">{section.title}</span>
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Manual Content */}
          <ScrollArea className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
            <div className="px-8 py-6" id="manual-content-wrapper">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading user manual...</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children, ...props }) => (
                        <h1 {...props} className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                          {children}
                        </h1>
                      ),
                      h2: ({ children, ...props }) => {
                        const id = children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                        return (
                          <h2 {...props} id={id} className="text-2xl font-semibold mt-8 mb-4 text-gray-800 dark:text-gray-200">
                            {children}
                          </h2>
                        );
                      },
                      h3: ({ children, ...props }) => (
                        <h3 {...props} className="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">
                          {children}
                        </h3>
                      ),
                      h4: ({ children, ...props }) => (
                        <h4 {...props} className="text-lg font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-300">
                          {children}
                        </h4>
                      ),
                      p: ({ children, ...props }) => (
                        <p {...props} className="mb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children, ...props }) => (
                        <ul {...props} className="mb-4 ml-6 list-disc text-gray-600 dark:text-gray-400">
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol {...props} className="mb-4 ml-6 list-decimal text-gray-600 dark:text-gray-400">
                          {children}
                        </ol>
                      ),
                      li: ({ children, ...props }) => (
                        <li {...props} className="mb-2">
                          {children}
                        </li>
                      ),
                      code: ({ children, ...props }) => (
                        <code {...props} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400">
                          {children}
                        </code>
                      ),
                      pre: ({ children, ...props }) => (
                        <pre {...props} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">
                          {children}
                        </pre>
                      ),
                      blockquote: ({ children, ...props }) => (
                        <blockquote {...props} className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-700 dark:text-gray-300">
                          {children}
                        </blockquote>
                      ),
                      a: ({ children, href, ...props }) => {
                        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                          if (href?.startsWith('#')) {
                            e.preventDefault();
                            const id = href.substring(1);
                            scrollToSection(id);
                          }
                        };
                        
                        return (
                          <a 
                            {...props} 
                            href={href} 
                            onClick={handleClick}
                            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {children}
                          </a>
                        );
                      },
                      hr: ({ ...props }) => (
                        <hr {...props} className="my-8 border-gray-300 dark:border-gray-700" />
                      ),
                    }}
                  >
                    {manualContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}