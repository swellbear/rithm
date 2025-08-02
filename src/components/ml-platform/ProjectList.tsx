import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Save, File, Trash2 } from 'lucide-react';
import { Project } from './types';

/**
 * Props interface for the ProjectList component
 * @interface ProjectListProps
 */
interface ProjectListProps {
  /** Array of all saved projects */
  projects: Project[];
  /** Current search query for filtering projects */
  projectSearch: string;
  /** Filtered array of projects based on search query */
  filteredProjects: Project[];
  /** Callback when project search query changes */
  onProjectSearchChange: (search: string) => void;
  /** Callback to save current session as a new project */
  onSaveProject: () => void;
  /** Callback to load a selected project */
  onLoadProject: (project: Project) => void;
  /** Callback to delete a project by ID */
  onDeleteProject: (id: string) => void;
}

/**
 * ProjectList - Project management interface for saving, loading, and organizing ML workflows
 * 
 * This component provides comprehensive project management capabilities allowing users to:
 * - Save current ML sessions with complete state preservation
 * - Search and filter through saved projects
 * - Load previous projects with full state restoration
 * - Delete unwanted projects with confirmation
 * 
 * Key Features:
 * - Real-time search filtering with instant results
 * - Collapsible project details with accordion interface
 * - Complete state preservation (data, models, chat history)
 * - Safe deletion with user confirmation
 * - Accessibility compliance with keyboard navigation
 * - Responsive design for various screen sizes
 * 
 * Storage Integration:
 * - Uses IndexedDB for large project storage (>5MB)
 * - Falls back to localStorage for smaller projects
 * - Automatic compression for efficient storage
 * - Error handling for storage quota limitations
 * 
 * @component
 * @param {ProjectListProps} props - Component props containing project data and callbacks
 * @returns {JSX.Element} The project management interface
 * 
 * @example
 * ```tsx
 * <ProjectList
 *   projects={savedProjects}
 *   projectSearch=""
 *   filteredProjects={filteredProjects}
 *   onSaveProject={saveCurrentProject}
 *   onLoadProject={loadProject}
 *   onDeleteProject={deleteProject}
 * />
 * ```
 */
export default function ProjectList({
  projects,
  projectSearch,
  filteredProjects,
  onProjectSearchChange,
  onSaveProject,
  onLoadProject,
  onDeleteProject
}: ProjectListProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <label htmlFor="project-search-input" className="sr-only">
          Search projects
        </label>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input 
          id="project-search-input"
          placeholder="Search projects..." 
          value={projectSearch} 
          onChange={(e) => onProjectSearchChange(e.target.value)} 
          className="pl-10 h-9 text-sm"
          aria-label="Search projects by name"
        />
      </div>
      
      <Button onClick={onSaveProject} className="w-full h-9 text-sm bg-green-600 hover:bg-green-700">
        <Save className="mr-2 h-4 w-4" />
        Save Current Project
      </Button>
      
      <div className="space-y-2">
        <Accordion type="single" collapsible className="w-full">
          {filteredProjects.map((project) => (
            <AccordionItem value={project.id} key={project.id}>
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  {project.name}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 p-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Domain: {project.domain}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Samples: {project.sampleSize}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Model: {project.modelType}</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onLoadProject(project)}
                    >
                      Load
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => onDeleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {filteredProjects.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-4">No projects found.</p>
        )}
      </div>
    </div>
  );
}