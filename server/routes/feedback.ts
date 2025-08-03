import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

/**
 * Feedback submission data structure
 */
interface FeedbackSubmission {
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
 * Simple file-based storage for feedback submissions
 */
class FeedbackStorage {
  private static readonly FEEDBACK_DIR = path.join(process.cwd(), 'data', 'feedback');
  private static readonly FEEDBACK_FILE = path.join(this.FEEDBACK_DIR, 'submissions.json');

  static async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.FEEDBACK_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create feedback directory:', error);
    }
  }

  static async loadFeedback(): Promise<FeedbackSubmission[]> {
    try {
      const data = await fs.readFile(this.FEEDBACK_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, return empty array
      return [];
    }
  }

  static async saveFeedback(feedback: FeedbackSubmission[]): Promise<void> {
    await this.ensureDirectory();
    await fs.writeFile(this.FEEDBACK_FILE, JSON.stringify(feedback, null, 2), 'utf-8');
  }

  static async addFeedback(feedback: FeedbackSubmission): Promise<void> {
    const existingFeedback = await this.loadFeedback();
    existingFeedback.push(feedback);
    await this.saveFeedback(existingFeedback);
  }
}

/**
 * Submit new feedback
 * POST /api/feedback
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const feedbackData: FeedbackSubmission = req.body;

    // Basic validation
    if (!feedbackData.title || !feedbackData.description || !feedbackData.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, and type are required'
      });
    }

    // Validate feedback type
    const validTypes = ['usability', 'bug', 'feature', 'general'];
    if (!validTypes.includes(feedbackData.type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feedback type. Must be one of: usability, bug, feature, general'
      });
    }

    // Ensure required fields are present
    const processedFeedback: FeedbackSubmission = {
      ...feedbackData,
      id: feedbackData.id || `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: feedbackData.timestamp || new Date().toISOString(),
      status: 'submitted'
    };

    // Save to file storage
    await FeedbackStorage.addFeedback(processedFeedback);

    console.log('Feedback received:', {
      id: processedFeedback.id,
      type: processedFeedback.type,
      title: processedFeedback.title,
      timestamp: processedFeedback.timestamp
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        id: processedFeedback.id,
        timestamp: processedFeedback.timestamp,
        status: processedFeedback.status
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing feedback'
    });
  }
});

/**
 * Get all feedback submissions (admin endpoint)
 * GET /api/feedback
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const feedback = await FeedbackStorage.loadFeedback();
    
    // Sort by timestamp, newest first
    const sortedFeedback = feedback.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json({
      success: true,
      data: sortedFeedback,
      count: sortedFeedback.length
    });

  } catch (error) {
    console.error('Failed to retrieve feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback submissions'
    });
  }
});

/**
 * Get feedback by ID
 * GET /api/feedback/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const feedback = await FeedbackStorage.loadFeedback();
    
    const targetFeedback = feedback.find(f => f.id === id);
    
    if (!targetFeedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: targetFeedback
    });

  } catch (error) {
    console.error('Failed to retrieve feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback'
    });
  }
});

/**
 * Update feedback status (admin endpoint)
 * PATCH /api/feedback/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['submitted', 'acknowledged', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: submitted, acknowledged, in-progress, resolved'
      });
    }

    const feedback = await FeedbackStorage.loadFeedback();
    const feedbackIndex = feedback.findIndex(f => f.id === id);
    
    if (feedbackIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    feedback[feedbackIndex].status = status;
    await FeedbackStorage.saveFeedback(feedback);

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback[feedbackIndex]
    });

  } catch (error) {
    console.error('Failed to update feedback status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback status'
    });
  }
});

/**
 * Get feedback statistics (admin endpoint)
 * GET /api/feedback/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const feedback = await FeedbackStorage.loadFeedback();
    
    const stats = {
      total: feedback.length,
      byType: {
        usability: feedback.filter(f => f.type === 'usability').length,
        bug: feedback.filter(f => f.type === 'bug').length,
        feature: feedback.filter(f => f.type === 'feature').length,
        general: feedback.filter(f => f.type === 'general').length,
      },
      byStatus: {
        submitted: feedback.filter(f => f.status === 'submitted').length,
        acknowledged: feedback.filter(f => f.status === 'acknowledged').length,
        'in-progress': feedback.filter(f => f.status === 'in-progress').length,
        resolved: feedback.filter(f => f.status === 'resolved').length,
      },
      byPriority: {
        low: feedback.filter(f => f.priority === 'low').length,
        medium: feedback.filter(f => f.priority === 'medium').length,
        high: feedback.filter(f => f.priority === 'high').length,
      },
      averageRating: feedback
        .filter(f => f.rating !== undefined)
        .reduce((sum, f, _, arr) => sum + (f.rating || 0) / arr.length, 0) || 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Failed to retrieve feedback stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback statistics'
    });
  }
});

export default router;