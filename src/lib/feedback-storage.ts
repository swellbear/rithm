import { uiLogger } from './logger';

/**
 * Feedback submission data structure (client-side mirror of server type)
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
 * Client-side feedback storage utilities
 * 
 * This module provides localStorage-based feedback storage with API submission fallback.
 * All feedback is always stored locally as a backup, even when successfully submitted to the server.
 */
export class FeedbackStorage {
  private static readonly STORAGE_KEY = 'mlPlatformFeedback';
  private static readonly QUEUE_KEY = 'mlPlatformFeedbackQueue';
  private static readonly MAX_LOCAL_STORAGE = 100; // Maximum number of feedback items to keep locally

  /**
   * Save feedback to localStorage
   */
  static saveToLocalStorage(feedback: FeedbackSubmission): void {
    try {
      const existing = this.getFromLocalStorage();
      existing.push(feedback);
      
      // Keep only the most recent MAX_LOCAL_STORAGE items
      const trimmed = existing
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.MAX_LOCAL_STORAGE);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
      uiLogger.info('Feedback saved to localStorage');
    } catch (error) {
      uiLogger.error('Failed to save feedback to localStorage:', error);
    }
  }

  /**
   * Get all feedback from localStorage
   */
  static getFromLocalStorage(): FeedbackSubmission[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      uiLogger.error('Failed to load feedback from localStorage:', error);
      return [];
    }
  }

  /**
   * Add feedback to submission queue for retry
   */
  static addToQueue(feedback: FeedbackSubmission): void {
    try {
      const queue = this.getQueue();
      queue.push(feedback);
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      uiLogger.info('Feedback added to submission queue');
    } catch (error) {
      uiLogger.error('Failed to add feedback to queue:', error);
    }
  }

  /**
   * Get pending feedback submissions from queue
   */
  static getQueue(): FeedbackSubmission[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      uiLogger.error('Failed to load feedback queue:', error);
      return [];
    }
  }

  /**
   * Remove feedback from submission queue after successful submission
   */
  static removeFromQueue(feedbackId: string): void {
    try {
      const queue = this.getQueue();
      const filtered = queue.filter(f => f.id !== feedbackId);
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(filtered));
      uiLogger.info('Feedback removed from submission queue');
    } catch (error) {
      uiLogger.error('Failed to remove feedback from queue:', error);
    }
  }

  /**
   * Submit feedback to API with retry logic
   */
  static async submitToAPI(feedback: FeedbackSubmission): Promise<boolean> {
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
        uiLogger.success('Feedback submitted to API successfully');
        this.removeFromQueue(feedback.id);
        return true;
      } else {
        throw new Error(result.error || 'API submission failed');
      }
    } catch (error) {
      uiLogger.warn('API submission failed, feedback queued for retry:', error);
      this.addToQueue(feedback);
      return false;
    }
  }

  /**
   * Submit feedback with dual storage (localStorage + API)
   */
  static async submitFeedback(feedback: FeedbackSubmission): Promise<{ success: boolean; method: 'api' | 'localStorage' }> {
    // Always save to localStorage as backup
    this.saveToLocalStorage(feedback);

    // Attempt API submission
    const apiSuccess = await this.submitToAPI(feedback);

    return {
      success: true, // Always successful since we have localStorage fallback
      method: apiSuccess ? 'api' : 'localStorage'
    };
  }

  /**
   * Retry failed submissions from queue
   */
  static async retryQueuedSubmissions(): Promise<number> {
    const queue = this.getQueue();
    let successCount = 0;

    for (const feedback of queue) {
      const success = await this.submitToAPI(feedback);
      if (success) {
        successCount++;
      }
    }

    uiLogger.info(`Retried ${queue.length} queued submissions, ${successCount} successful`);
    return successCount;
  }

  /**
   * Get feedback statistics
   */
  static getStats(): {
    total: number;
    byType: Record<string, number>;
    pending: number;
    recent: FeedbackSubmission[];
  } {
    const allFeedback = this.getFromLocalStorage();
    const pendingQueue = this.getQueue();
    
    const byType = allFeedback.reduce((acc, feedback) => {
      acc[feedback.type] = (acc[feedback.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recent = allFeedback
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return {
      total: allFeedback.length,
      byType,
      pending: pendingQueue.length,
      recent
    };
  }

  /**
   * Clear all local feedback data (for privacy/cleanup)
   */
  static clearLocalData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.QUEUE_KEY);
      uiLogger.info('Local feedback data cleared');
    } catch (error) {
      uiLogger.error('Failed to clear local feedback data:', error);
    }
  }
}

// Auto-retry queued submissions when the page loads
if (typeof window !== 'undefined') {
  // Check for queued submissions every 5 minutes
  setInterval(async () => {
    const queue = FeedbackStorage.getQueue();
    if (queue.length > 0) {
      await FeedbackStorage.retryQueuedSubmissions();
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Initial retry on page load after a short delay
  setTimeout(async () => {
    await FeedbackStorage.retryQueuedSubmissions();
  }, 10000); // 10 seconds after load
}