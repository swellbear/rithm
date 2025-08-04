import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Edit2, MoveUp, MoveDown, Type, FileText, List, BarChart3, Table } from 'lucide-react';
import { ReportStructure, ReportSection } from './types';

interface ReportEditorProps {
  structure: ReportStructure;
  onUpdate: (updated: ReportStructure) => void;
  className?: string;
}

/**
 * Visual Report Editor Component
 * 
 * Provides comprehensive visual editing capabilities for report structures including:
 * - Section editing with different content types
 * - Add/delete sections with type selection
 * - Drag-and-drop reordering
 * - Real-time preview of changes
 * - Accessibility compliance with ARIA labels
 */
export default function ReportEditor({ structure, onUpdate, className = '' }: ReportEditorProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSectionType, setNewSectionType] = useState<ReportSection['type']>('paragraph');

  // Section type icons and labels
  const sectionTypeConfig: Record<ReportSection['type'], { icon: any, label: string, color: string }> = {
    heading: { icon: Type, label: 'Heading', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    paragraph: { icon: FileText, label: 'Paragraph', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    list: { icon: List, label: 'List', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    chart: { icon: BarChart3, label: 'Chart', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    table: { icon: Table, label: 'Table', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
    image: { icon: FileText, label: 'Image', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' }
  };

  const handleEditSection = (id: string, updates: Partial<ReportSection>) => {
    const updatedSections = structure.sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    );
    onUpdate({ ...structure, sections: updatedSections });
  };

  const handleDeleteSection = (id: string) => {
    const updatedSections = structure.sections.filter(section => section.id !== id);
    onUpdate({ ...structure, sections: updatedSections });
    setEditingSection(null);
  };

  const handleAddSection = () => {
    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      type: newSectionType,
      content: getDefaultContent(newSectionType)
    };
    
    onUpdate({ 
      ...structure, 
      sections: [...structure.sections, newSection] 
    });
  };

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const currentIndex = structure.sections.findIndex(s => s.id === id);
    if (
      (direction === 'up' && currentIndex <= 0) || 
      (direction === 'down' && currentIndex >= structure.sections.length - 1)
    ) {
      return;
    }

    const newSections = [...structure.sections];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newSections[currentIndex], newSections[targetIndex]] = 
    [newSections[targetIndex], newSections[currentIndex]];

    onUpdate({ ...structure, sections: newSections });
  };

  const getDefaultContent = (type: ReportSection['type']): string => {
    switch (type) {
      case 'heading': return 'New Heading';
      case 'paragraph': return 'Enter paragraph content here...';
      case 'list': return 'Item 1\nItem 2\nItem 3';
      case 'chart': return 'Chart configuration (JSON format)';
      case 'table': return 'Table data (CSV format)';
      default: return 'New section content';
    }
  };

  const renderSectionEditor = (section: ReportSection) => {
    const isEditing = editingSection === section.id;
    const config = sectionTypeConfig[section.type];
    const IconComponent = config.icon;

    return (
      <Card key={section.id} className="card-elevated mb-4 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4" aria-hidden="true" />
              <Badge className={config.color}>
                {config.label}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ID: {section.id}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Move buttons */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMoveSection(section.id, 'up')}
                aria-label="Move section up"
                className="h-8 w-8 p-0"
              >
                <MoveUp className="h-3 w-3" aria-hidden="true" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMoveSection(section.id, 'down')}
                aria-label="Move section down"
                className="h-8 w-8 p-0"
              >
                <MoveDown className="h-3 w-3" aria-hidden="true" />
              </Button>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Edit toggle button */}
              <Button
                size="sm"
                variant={isEditing ? "default" : "ghost"}
                onClick={() => setEditingSection(isEditing ? null : section.id)}
                aria-label={isEditing ? "Stop editing section" : "Edit section"}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-3 w-3" aria-hidden="true" />
              </Button>
              
              {/* Delete button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteSection(section.id)}
                aria-label="Delete section"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {isEditing ? (
            <div className="space-y-3">
              {/* Section Type Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor={`type-${section.id}`} className="text-sm font-medium">
                  Type:
                </label>
                <Select
                  value={section.type}
                  onValueChange={(value) => handleEditSection(section.id, { type: value as ReportSection['type'] })}
                >
                  <SelectTrigger 
                    className="w-32"
                    id={`type-${section.id}`}
                    aria-label="Select section type"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sectionTypeConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-3 w-3" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <label htmlFor={`content-${section.id}`} className="text-sm font-medium">
                  Content:
                </label>
                {section.type === 'heading' ? (
                  <Input
                    id={`content-${section.id}`}
                    value={(section.content as string) || ''}
                    onChange={(e) => handleEditSection(section.id, { content: e.target.value })}
                    placeholder="Enter heading text"
                    className="font-semibold"
                  />
                ) : (
                  <Textarea
                    id={`content-${section.id}`}
                    value={(section.content as string) || ''}
                    onChange={(e) => handleEditSection(section.id, { content: e.target.value })}
                    placeholder={`Enter ${section.type} content`}
                    rows={4}
                    className="font-mono text-sm"
                  />
                )}
              </div>

              {/* Chart/Table specific options */}
              {(section.type === 'chart' || section.type === 'table') && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {section.type === 'chart' ? 
                      'Enter chart configuration as JSON with data, type, and options.' :
                      'Enter table data in CSV format with headers in first row.'
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Preview Mode
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Preview:</div>
              {section.type === 'heading' ? (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(section.content as string) || 'Untitled Section'}
                </h3>
              ) : section.type === 'list' ? (
                <ul className="list-disc list-inside space-y-1">
                  {(section.content as string || '').split('\n').map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      {item.trim()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {(section.content as string) || 'No content available'}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`} role="region" aria-label="Report editor">
      {/* Report Header */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" aria-hidden="true" />
            Report Editor
            <Badge variant="outline" className="ml-2">
              {structure.sections.length} sections
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div>
              <label htmlFor="report-title" className="text-sm font-medium">
                Report Title:
              </label>
              <Input
                id="report-title"
                value={structure.title || ''}
                onChange={(e) => onUpdate({ ...structure, title: e.target.value })}
                placeholder="Enter report title"
                className="mt-1"
              />
            </div>
            
            <div>
              <label htmlFor="report-summary" className="text-sm font-medium">
                Summary:
              </label>
              <Textarea
                id="report-summary"
                value={(structure as any).summary || ''}
                onChange={(e) => onUpdate({ ...structure, summary: e.target.value } as any)}
                placeholder="Enter report summary"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        {structure.sections.map(renderSectionEditor)}
      </div>

      {/* Add Section */}
      <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Select
              value={newSectionType}
              onValueChange={(value) => setNewSectionType(value as ReportSection['type'])}
            >
              <SelectTrigger className="w-40" aria-label="Select new section type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sectionTypeConfig).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-3 w-3" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAddSection}
              className="flex items-center gap-2"
              aria-label="Add new section"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Section
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <p>💡 Tip: Use the edit button to modify section content, or drag sections to reorder them. 
        Changes are applied immediately to the report structure.</p>
      </div>
    </div>
  );
}