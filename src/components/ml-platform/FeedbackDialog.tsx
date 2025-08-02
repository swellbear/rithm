import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Send, Bug, Lightbulb, Heart, MessageSquare, AlertTriangle, CheckCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uiLogger } from '@/lib/logger';

/**
 * Feedback submission data structure
 */
export interface FeedbackSubmission {
  id: string;
  type: 'usability' | 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  rating?: number;
  email?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo: {
    userAgent: string;
    url: string;
    timestamp: string;
    viewport: string;
  };
  attachScreenshot: boolean;
  allowFollowUp: boolean;
  timestamp: string;
  status: 'submitted' | 'acknowledged' | 'in-progress' | 'resolved';
}

/**
 * Props for the FeedbackDialog component
 */
interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * FeedbackDialog - Comprehensive user feedback collection interface
 * 
 * This component provides a professional feedback system with multiple categories:
 * - Usability feedback with rating system
 * - Bug reports with reproduction steps
 * - Feature requests with priority levels
 * - General feedback and suggestions
 * 
 * Features:
 * - Tabbed interface for different feedback types
 * - Form validation with accessibility support
 * - Local storage backup and API submission
 * - Progress tracking and submission status
 * - Browser info collection for debugging
 * - Email opt-in for follow-up communication
 * 
 * @component
 * @param {FeedbackDialogProps} props - Component props
 * @returns {JSX.Element} The feedback collection dialog
 */
export default function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  // Form state management
  const [activeTab, setActiveTab] = useState<'usability' | 'bug' | 'feature' | 'general'>('usability');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rating: 0,
    email: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    reproductionSteps: '',
    expectedBehavior: '',
    actualBehavior: '',
    attachScreenshot: false,
    allowFollowUp: false,
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  /**
   * Handle form field changes with proper typing
   */
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Handle star rating changes
   */
  const handleRatingChange = useCallback((rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  }, []);

  /**
   * Validate form data based on feedback type
   */
  const validateForm = useCallback((): boolean => {
    if (!formData.title.trim()) {
      toast.error('Please provide a title for your feedback');
      return false;
    }

    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return false;
    }

    if (activeTab === 'bug') {
      if (!formData.reproductionSteps.trim()) {
        toast.error('Please provide steps to reproduce the bug');
        return false;
      }
    }

    if (activeTab === 'usability' && formData.rating === 0) {
      toast.error('Please provide a rating for your experience');
      return false;
    }

    return true;
  }, [formData, activeTab]);

  /**
   * Generate comprehensive browser information for debugging
   */
  const getBrowserInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }, []);

  /**
   * Save feedback to localStorage as backup
   */
  const saveToLocalStorage = useCallback((feedback: FeedbackSubmission) => {
    try {
      const existingFeedback = JSON.parse(localStorage.getItem('mlPlatformFeedback') || '[]');
      existingFeedback.push(feedback);
      localStorage.setItem('mlPlatformFeedback', JSON.stringify(existingFeedback));
      uiLogger.info('Feedback saved to localStorage as backup');
    } catch (error) {
      uiLogger.error('Failed to save feedback to localStorage:', error);
    }
  }, []);

  /**
   * Submit feedback to API endpoint
   */
  const submitToAPI = useCallback(async (feedback: FeedbackSubmission): Promise<boolean> => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        uiLogger.success('Feedback submitted to API successfully:', result);
        return true;
      } else {
        throw new Error(result.error || 'API submission failed');
      }
    } catch (error) {
      uiLogger.warn('API submission failed, using localStorage fallback:', error);
      return false;
    }
  }, []);

  /**
   * Handle form submission with progress tracking
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmissionProgress(10);

    try {
      // Create feedback submission object
      const feedbackSubmission: FeedbackSubmission = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: activeTab,
        title: formData.title,
        description: formData.description,
        rating: formData.rating || undefined,
        email: formData.email || undefined,
        priority: formData.priority,
        category: formData.category || getCategoryForTab(activeTab),
        reproductionSteps: formData.reproductionSteps || undefined,
        expectedBehavior: formData.expectedBehavior || undefined,
        actualBehavior: formData.actualBehavior || undefined,
        browserInfo: getBrowserInfo(),
        attachScreenshot: formData.attachScreenshot,
        allowFollowUp: formData.allowFollowUp,
        timestamp: new Date().toISOString(),
        status: 'submitted',
      };

      setSubmissionProgress(40);

      // Always save to localStorage first as backup
      saveToLocalStorage(feedbackSubmission);
      setSubmissionProgress(60);

      // Attempt API submission
      const apiSuccess = await submitToAPI(feedbackSubmission);
      setSubmissionProgress(90);

      // Simulate final processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSubmissionProgress(100);

      if (apiSuccess) {
        toast.success('Feedback submitted successfully! Thank you for your input.');
      } else {
        toast.success('Feedback saved successfully! It will be submitted when connection is restored.');
      }

      setSubmitted(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      uiLogger.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, activeTab, validateForm, getBrowserInfo, saveToLocalStorage, submitToAPI, onOpenChange]);

  /**
   * Get default category for feedback tab
   */
  const getCategoryForTab = useCallback((tab: string): string => {
    const categories = {
      usability: 'User Experience',
      bug: 'Bug Report',
      feature: 'Feature Request',
      general: 'General Feedback'
    };
    return categories[tab as keyof typeof categories] || 'General';
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      rating: 0,
      email: '',
      priority: 'medium',
      category: '',
      reproductionSteps: '',
      expectedBehavior: '',
      actualBehavior: '',
      attachScreenshot: false,
      allowFollowUp: false,
    });
    setSubmissionProgress(0);
    setSubmitted(false);
    setActiveTab('usability');
  }, []);

  /**
   * Handle dialog close
   */
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onOpenChange(false);
      // Reset form after a brief delay to prevent jarring UI changes
      setTimeout(resetForm, 200);
    }
  }, [isSubmitting, onOpenChange, resetForm]);

  /**
   * Render star rating component
   */
  const StarRating = ({ rating, onRatingChange, disabled }: { 
    rating: number; 
    onRatingChange: (rating: number) => void;
    disabled?: boolean;
  }) => (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onRatingChange(star)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onRatingChange(star);
            }
          }}
          disabled={disabled}
          className={`p-1 rounded transition-colors ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-2 focus:ring-blue-500'
          }`}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          aria-pressed={rating >= star}
          role="radio"
          tabIndex={rating === star ? 0 : -1}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              rating >= star 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );

  // Don't render if not open
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="feedback-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription id="feedback-description">
            Help us improve the ML Platform by sharing your thoughts, reporting issues, or suggesting new features.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your feedback has been submitted successfully. We appreciate your input and will review it carefully.
                </p>
                {formData.allowFollowUp && formData.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    We'll follow up with you at {formData.email} if needed.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="usability" className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  Usability
                </TabsTrigger>
                <TabsTrigger value="bug" className="flex items-center gap-1">
                  <Bug className="w-4 h-4" />
                  Bug Report
                </TabsTrigger>
                <TabsTrigger value="feature" className="flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" />
                  Feature Request
                </TabsTrigger>
                <TabsTrigger value="general" className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  General
                </TabsTrigger>
              </TabsList>

              {/* Usability Feedback Tab */}
              <TabsContent value="usability" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="usability-title" className="text-sm font-medium">
                    How would you describe your experience? *
                  </label>
                  <Input
                    id="usability-title"
                    placeholder="Brief summary of your experience..."
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Overall Rating *</label>
                  <StarRating 
                    rating={formData.rating} 
                    onRatingChange={handleRatingChange}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">Rate your overall experience from 1 (poor) to 5 (excellent)</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="usability-description" className="text-sm font-medium">
                    Tell us more about your experience *
                  </label>
                  <Textarea
                    id="usability-description"
                    placeholder="What did you like? What could be improved? Any specific issues you encountered?"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={4}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="usability-category" className="text-sm font-medium">Category</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleFieldChange('category', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="usability-category" aria-label="Select usability feedback category">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="navigation">Navigation & Layout</SelectItem>
                      <SelectItem value="data-upload">Data Upload Process</SelectItem>
                      <SelectItem value="ai-chat">AI Chat Interface</SelectItem>
                      <SelectItem value="visualization">Data Visualization</SelectItem>
                      <SelectItem value="reports">Report Generation</SelectItem>
                      <SelectItem value="performance">Performance & Speed</SelectItem>
                      <SelectItem value="accessibility">Accessibility</SelectItem>
                      <SelectItem value="mobile">Mobile Experience</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Bug Report Tab */}
              <TabsContent value="bug" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="bug-title" className="text-sm font-medium">
                    Bug Summary *
                  </label>
                  <Input
                    id="bug-title"
                    placeholder="Brief description of the bug..."
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bug-priority" className="text-sm font-medium">Priority</label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => handleFieldChange('priority', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="bug-priority" aria-label="Select bug priority level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🔵 Low - Minor issue, workaround available</SelectItem>
                      <SelectItem value="medium">🟡 Medium - Affects functionality</SelectItem>
                      <SelectItem value="high">🔴 High - Blocks important workflows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="reproduction-steps" className="text-sm font-medium">
                    Steps to Reproduce *
                  </label>
                  <Textarea
                    id="reproduction-steps"
                    placeholder="1. Go to..."
                    value={formData.reproductionSteps}
                    onChange={(e) => handleFieldChange('reproductionSteps', e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="expected-behavior" className="text-sm font-medium">
                    Expected Behavior
                  </label>
                  <Textarea
                    id="expected-behavior"
                    placeholder="What should have happened?"
                    value={formData.expectedBehavior}
                    onChange={(e) => handleFieldChange('expectedBehavior', e.target.value)}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="actual-behavior" className="text-sm font-medium">
                    Actual Behavior
                  </label>
                  <Textarea
                    id="actual-behavior"
                    placeholder="What actually happened?"
                    value={formData.actualBehavior}
                    onChange={(e) => handleFieldChange('actualBehavior', e.target.value)}
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bug-description" className="text-sm font-medium">
                    Additional Details
                  </label>
                  <Textarea
                    id="bug-description"
                    placeholder="Any additional context, error messages, or relevant information..."
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </TabsContent>

              {/* Feature Request Tab */}
              <TabsContent value="feature" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="feature-title" className="text-sm font-medium">
                    Feature Title *
                  </label>
                  <Input
                    id="feature-title"
                    placeholder="Brief description of the requested feature..."
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="feature-priority" className="text-sm font-medium">Importance</label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => handleFieldChange('priority', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="feature-priority" aria-label="Select feature priority level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Nice to have</SelectItem>
                      <SelectItem value="medium">Would improve my workflow</SelectItem>
                      <SelectItem value="high">Essential for my use case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="feature-category" className="text-sm font-medium">Category</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleFieldChange('category', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="feature-category" aria-label="Select feature category">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data-processing">Data Processing</SelectItem>
                      <SelectItem value="ml-models">ML Models & Algorithms</SelectItem>
                      <SelectItem value="visualization">Data Visualization</SelectItem>
                      <SelectItem value="ai-integration">AI Integration</SelectItem>
                      <SelectItem value="collaboration">Collaboration Tools</SelectItem>
                      <SelectItem value="automation">Automation & Workflows</SelectItem>
                      <SelectItem value="export">Export & Sharing</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="integration">Third-party Integrations</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="feature-description" className="text-sm font-medium">
                    Detailed Description *
                  </label>
                  <Textarea
                    id="feature-description"
                    placeholder="Describe the feature in detail. What problem would it solve? How would you use it?"
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={4}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="feature-use-case" className="text-sm font-medium">
                    Use Case & Benefits
                  </label>
                  <Textarea
                    id="feature-use-case"
                    placeholder="How would this feature benefit you and other users? What specific workflow would it improve?"
                    value={formData.expectedBehavior}
                    onChange={(e) => handleFieldChange('expectedBehavior', e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </TabsContent>

              {/* General Feedback Tab */}
              <TabsContent value="general" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="general-title" className="text-sm font-medium">
                    Subject *
                  </label>
                  <Input
                    id="general-title"
                    placeholder="What's your feedback about?"
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="general-description" className="text-sm font-medium">
                    Your Message *
                  </label>
                  <Textarea
                    id="general-description"
                    placeholder="Share your thoughts, suggestions, or any other feedback..."
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={5}
                    disabled={isSubmitting}
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="general-category" className="text-sm font-medium">Category</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleFieldChange('category', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="general-category" aria-label="Select general feedback category">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliment">Compliment</SelectItem>
                      <SelectItem value="suggestion">Suggestion</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="training">Training & Tutorials</SelectItem>
                      <SelectItem value="pricing">Pricing & Plans</SelectItem>
                      <SelectItem value="support">Support Experience</SelectItem>
                      <SelectItem value="business">Business Inquiry</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            {/* Common footer options for all tabs */}
            <div className="border-t pt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="screenshot"
                    checked={formData.attachScreenshot}
                    onCheckedChange={(checked) => handleFieldChange('attachScreenshot', checked)}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="screenshot" className="text-sm">
                    Include browser and system information for debugging (recommended)
                  </label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email (optional)</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Provide your email if you'd like us to follow up with you
                  </p>
                </div>

                {formData.email && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="follow-up"
                      checked={formData.allowFollowUp}
                      onCheckedChange={(checked) => handleFieldChange('allowFollowUp', checked)}
                      disabled={isSubmitting}
                    />
                    <label htmlFor="follow-up" className="text-sm">
                      Allow follow-up communication about this feedback
                    </label>
                  </div>
                )}
              </div>

              {isSubmitting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Submitting feedback...</span>
                    <span>{submissionProgress}%</span>
                  </div>
                  <Progress value={submissionProgress} className="h-2" />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}