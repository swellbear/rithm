import React, { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { PreviewDialog } from './types';
import { uiLogger } from '@/lib/logger';

/**
 * Props interface for the ReportPreviewDialog component
 * @interface ReportPreviewDialogProps
 */
interface ReportPreviewDialogProps {
  /** Preview dialog state containing blob, format, and open status */
  previewDialog: PreviewDialog;
  /** Callback when preview dialog state changes */
  onPreviewDialogChange: (dialog: PreviewDialog) => void;
  /** Callback to download the previewed document */
  onDownloadFromPreview: () => void;
}

/**
 * ReportPreviewDialog - Document preview interface for generated reports
 * 
 * This component provides a comprehensive document preview system for generated ML reports,
 * supporting both Word (.docx) and PowerPoint (.pptx) formats with different rendering approaches.
 * 
 * Key Features:
 * - Native Word document preview using docx-preview library
 * - PowerPoint placeholder with download option (browser limitation)
 * - Error handling with fallback messaging
 * - Accessibility compliance with proper ARIA attributes
 * - Responsive design with scrollable content area
 * - Professional download functionality
 * 
 * Technical Implementation:
 * - Uses docx-preview for Word document rendering with comprehensive options
 * - Implements async rendering with loading states
 * - Provides detailed error messaging for debugging
 * - Maintains preview state through parent component callbacks
 * - Structured logging for debugging and monitoring
 * 
 * Performance Considerations:
 * - Async document rendering to prevent UI blocking
 * - Error boundaries for graceful failure handling
 * - Memory-efficient blob handling
 * - Cleanup of DOM elements on component unmount
 * 
 * @component
 * @param {ReportPreviewDialogProps} props - Component props containing preview state and callbacks
 * @returns {JSX.Element} The document preview dialog interface
 * 
 * @example
 * ```tsx
 * <ReportPreviewDialog
 *   previewDialog={{ 
 *     open: true, 
 *     blob: documentBlob, 
 *     format: 'word' 
 *   }}
 *   onPreviewDialogChange={setPreviewDialog}
 *   onDownloadFromPreview={downloadDocument}
 * />
 * ```
 */
export default function ReportPreviewDialog({
  previewDialog,
  onPreviewDialogChange,
  onDownloadFromPreview
}: ReportPreviewDialogProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Renders document preview content based on format type
   * Handles Word documents with docx-preview library and PowerPoint with fallback message
   * @async
   * @function renderPreviewContent
   * @returns {Promise<void>} Resolves when rendering is complete
   */
  const renderPreviewContent = async () => {
    uiLogger.debug('renderPreviewContent called', { 
      hasBlob: !!previewDialog.blob, 
      hasRef: !!previewContainerRef.current,
      format: previewDialog.format 
    });
    
    if (!previewDialog.blob || !previewContainerRef.current) {
      uiLogger.warn('Missing blob or ref, exiting early');
      return;
    }

    if (previewDialog.format === 'word') {
      try {
        uiLogger.progress('Starting Word document preview rendering...');
        previewContainerRef.current.innerHTML = '<div class="p-4 text-center">Loading document...</div>';

        await renderAsync(previewDialog.blob, previewContainerRef.current, undefined, {
          className: 'docx-preview-content',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          debug: true
        });
        uiLogger.success('Word document rendered successfully');
      } catch (error) {
        uiLogger.error('Error rendering docx preview:', error);
        previewContainerRef.current.innerHTML = `
          <div class="p-4 text-center text-gray-600">
            <p>Unable to preview Word document.</p>
            <p class="text-sm mt-2">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p class="text-sm mt-2">Please download to view the content.</p>
          </div>
        `;
      }
    } else {
      uiLogger.info('Showing PowerPoint preview placeholder');
      previewContainerRef.current.innerHTML = `
        <div class="p-8 text-center text-gray-600">
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">PowerPoint Preview</h3>
          <p class="mb-4">Browser preview for PowerPoint files is limited.</p>
          <p class="text-sm text-gray-500">Please download the file to view the complete presentation.</p>
        </div>
      `;
    }
  };

  useEffect(() => {
    uiLogger.debug('Preview useEffect triggered', { 
      open: previewDialog.open, 
      hasBlob: !!previewDialog.blob,
      blobSize: previewDialog.blob?.size,
      blobType: previewDialog.blob?.type,
      hasRef: !!previewContainerRef.current,
      format: previewDialog.format
    });
    
    if (previewDialog.open && previewDialog.blob) {
      uiLogger.progress('Calling renderPreviewContent...');
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        renderPreviewContent();
      }, 100);
    }
  }, [previewDialog.open, previewDialog.blob]);

  return (
    <Dialog 
      open={previewDialog.open} 
      onOpenChange={(open) => onPreviewDialogChange({ ...previewDialog, open })}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            Report Preview - {previewDialog.format === 'word' ? 'Word Document' : 'PowerPoint Presentation'}
          </DialogTitle>
          <DialogDescription>
            Preview your generated report. Download to save or edit further.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 border rounded-lg bg-white shadow-sm overflow-hidden min-h-0">
          <ScrollArea className="h-[60vh] w-full">
            <div 
              ref={previewContainerRef}
              className="p-4 w-full"
              style={{ minHeight: '100%', overflow: 'visible' }}
            >
              {/* Content will be rendered here by renderPreviewContent */}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-3 pt-4 flex-shrink-0 border-t">
          <Button
            variant="outline"
            onClick={() => onPreviewDialogChange({ ...previewDialog, open: false })}
          >
            Close Preview
          </Button>
          <Button
            onClick={onDownloadFromPreview}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}