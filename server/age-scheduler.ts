/**
 * Age Update Scheduler - Runs monthly age updates automatically
 * This would typically be managed by a cron job or scheduled task in production
 */

import { ageUpdateService } from './age-update-service.js';

export class AgeScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkIntervalMs = 24 * 60 * 60 * 1000; // Check daily

  /**
   * Start the age update scheduler
   */
  start() {
    console.log('Starting age update scheduler - checking daily for monthly updates');
    
    // Run immediate check on startup
    this.runScheduledCheck();
    
    // Set up daily checks
    this.intervalId = setInterval(() => {
      this.runScheduledCheck();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the age update scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Age update scheduler stopped');
    }
  }

  /**
   * Run scheduled check - only updates if it's been a month since last update
   */
  private async runScheduledCheck() {
    try {
      const now = new Date();
      const dayOfMonth = now.getDate();
      
      // Only run on the 1st of each month
      if (dayOfMonth === 1) {
        console.log(`Running monthly age update - ${now.toISOString()}`);
        const result = await ageUpdateService.performMonthlyAgeUpdate();
        console.log(`Monthly age update complete - Updated: ${result.updated}, Errors: ${result.errors.length}`);
        
        if (result.errors.length > 0) {
          console.error('Age update errors:', result.errors);
        }
      }
    } catch (error) {
      console.error('Scheduled age update failed:', error);
    }
  }

  /**
   * Force run age update manually (for testing or manual execution)
   */
  async forceUpdate(): Promise<{ updated: number; errors: string[] }> {
    console.log('Force running age update');
    return await ageUpdateService.performMonthlyAgeUpdate();
  }
}

export const ageScheduler = new AgeScheduler();