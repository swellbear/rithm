// Workflow Engine - Smart Task Completion and Handoff System

export interface TaskResult {
  taskId: string;
  completedAt: Date;
  success: boolean;
  data: any; // Task-specific completion data
  userActionsTaken: string[];
  timeSpent: number; // minutes
}

export interface WorkflowRecommendation {
  nextTaskId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  contextData: any; // Data to pass to next task
  urgency?: string; // "Complete within 24 hours"
  estimatedTime?: number; // minutes
}

export interface WorkflowState {
  currentSession: {
    startedAt: Date;
    tasksCompleted: TaskResult[];
    activeTask?: string;
  };
  historical: {
    lastWeekTasks: string[];
    commonPatterns: string[];
    preferredSequences: string[];
  };
}

// Smart handoff logic based on task completion results
export class WorkflowEngine {
  
  // Detect task completion based on user actions and data changes
  static detectTaskCompletion(taskId: string, userActions: string[], dataChanges: any): TaskResult | null {
    const completionCriteria = this.getCompletionCriteria(taskId);
    
    for (const criteria of completionCriteria) {
      if (this.matchesCriteria(criteria, userActions, dataChanges)) {
        return {
          taskId,
          completedAt: new Date(),
          success: true,
          data: dataChanges,
          userActionsTaken: userActions,
          timeSpent: this.calculateTimeSpent(taskId)
        };
      }
    }
    return null;
  }

  // Generate smart recommendations for next tasks
  static generateRecommendations(completedTask: TaskResult, farmData: any): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];
    
    switch (completedTask.taskId) {
      case 'check_animals':
        recommendations.push(...this.getAnimalCheckRecommendations(completedTask, farmData));
        break;
      case 'walk_pastures':
        recommendations.push(...this.getPastureWalkRecommendations(completedTask, farmData));
        break;
      case 'plan_rotation':
        recommendations.push(...this.getRotationPlanRecommendations(completedTask, farmData));
        break;
      case 'track_performance':
        recommendations.push(...this.getPerformanceTrackRecommendations(completedTask, farmData));
        break;
      case 'check_weather':
        recommendations.push(...this.getWeatherCheckRecommendations(completedTask, farmData));
        break;
      case 'quick_calc':
        recommendations.push(...this.getQuickCalcRecommendations(completedTask, farmData));
        break;
    }

    return recommendations.sort((a, b) => this.priorityScore(a.priority) - this.priorityScore(b.priority));
  }

  // Task-specific completion criteria
  private static getCompletionCriteria(taskId: string) {
    const criteria: Record<string, any[]> = {
      'check_animals': [
        { actions: ['view_animals', 'check_health_status'], data: ['health_recorded'] },
        { actions: ['calculate_water_needs'], data: ['water_calculated'] },
        { actions: ['review_livestock_health'], data: ['health_assessment_complete'] }
      ],
      'walk_pastures': [
        { actions: ['capture_assessment', 'record_conditions'], data: ['assessment_saved'] },
        { actions: ['measure_grass_height'], data: ['height_recorded'] },
        { actions: ['complete_pasture_assessment'], data: ['assessment_complete'] }
      ],
      'plan_rotation': [
        { actions: ['schedule_moves', 'set_grazing_dates'], data: ['rotation_scheduled'] },
        { actions: ['calculate_grazing_days'], data: ['rotation_planned'] },
        { actions: ['create_rotation_plan'], data: ['plan_saved'] }
      ],
      'track_performance': [
        { actions: ['record_weights', 'update_metrics'], data: ['performance_recorded'] },
        { actions: ['analyze_trends'], data: ['analysis_complete'] },
        { actions: ['review_analytics'], data: ['metrics_reviewed'] }
      ],
      'check_weather': [
        { actions: ['view_forecast', 'check_conditions'], data: ['weather_reviewed'] },
        { actions: ['assess_agricultural_impact'], data: ['impact_assessed'] },
        { actions: ['review_weather_alerts'], data: ['alerts_acknowledged'] }
      ],
      'quick_calc': [
        { actions: ['calculate_values', 'save_results'], data: ['calculation_saved'] },
        { actions: ['run_au_calculation'], data: ['au_calculated'] },
        { actions: ['complete_calculation'], data: ['calc_complete'] }
      ]
    };
    return criteria[taskId] || [];
  }

  private static matchesCriteria(criteria: any, userActions: string[], dataChanges: any): boolean {
    const actionsMatch = criteria.actions.some((action: string) => userActions.includes(action));
    const dataMatch = criteria.data.some((data: string) => dataChanges[data]);
    return actionsMatch && dataMatch;
  }

  private static calculateTimeSpent(taskId: string): number {
    // Get from localStorage or session tracking
    const startTime = localStorage.getItem(`task_start_${taskId}`);
    if (startTime) {
      return Math.round((Date.now() - parseInt(startTime)) / (1000 * 60));
    }
    return 0;
  }

  // Smart recommendation generators for each task type
  private static getAnimalCheckRecommendations(task: TaskResult, farmData: any): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];
    
    // Analyze completion data to determine next steps
    if (task.data.health_issues_found) {
      recommendations.push({
        nextTaskId: 'walk_pastures',
        priority: 'high',
        reasoning: 'Health issues detected. Check pasture conditions for potential causes.',
        contextData: { focus: 'health_related_conditions', animals_affected: task.data.affected_animals },
        urgency: 'Complete today',
        estimatedTime: 20
      });
    }

    if (task.data.water_shortage_detected) {
      recommendations.push({
        nextTaskId: 'quick_calc',
        priority: 'critical',
        reasoning: 'Water shortage identified. Calculate immediate water requirements.',
        contextData: { calculation_type: 'water_requirements', shortage_amount: task.data.water_deficit },
        urgency: 'Complete immediately',
        estimatedTime: 10
      });
    }

    if (task.data.all_animals_healthy) {
      recommendations.push({
        nextTaskId: 'track_performance',
        priority: 'medium',
        reasoning: 'Animals are healthy. Good time to record performance metrics.',
        contextData: { focus: 'weight_tracking', health_baseline: task.data.health_summary },
        estimatedTime: 15
      });
    }

    return recommendations;
  }

  private static getPastureWalkRecommendations(task: TaskResult, farmData: any): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];

    if (task.data.overgrazing_detected) {
      recommendations.push({
        nextTaskId: 'plan_rotation',
        priority: 'critical',
        reasoning: 'Overgrazing detected. Immediate rotation planning needed.',
        contextData: { 
          priority_paddocks: task.data.overgrazed_paddocks,
          move_urgency: 'immediate'
        },
        urgency: 'Complete within 24 hours',
        estimatedTime: 25
      });
    }

    if (task.data.grass_conditions_good) {
      recommendations.push({
        nextTaskId: 'check_weather',
        priority: 'medium',
        reasoning: 'Good grass conditions. Check weather for optimal grazing timing.',
        contextData: { focus: 'grazing_conditions', good_paddocks: task.data.quality_paddocks },
        estimatedTime: 10
      });
    }

    if (task.data.assessment_complete) {
      recommendations.push({
        nextTaskId: 'track_performance',
        priority: 'low',
        reasoning: 'Pasture assessment complete. Update performance tracking with conditions.',
        contextData: { 
          pasture_data: task.data.assessment_results,
          update_type: 'pasture_conditions'
        },
        estimatedTime: 15
      });
    }

    return recommendations;
  }

  private static getRotationPlanRecommendations(task: TaskResult, farmData: any): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];

    if (task.data.rotation_scheduled) {
      recommendations.push({
        nextTaskId: 'check_weather',
        priority: 'high',
        reasoning: 'Rotation scheduled. Verify weather conditions for planned moves.',
        contextData: { 
          move_dates: task.data.scheduled_moves,
          weather_focus: 'move_timing'
        },
        urgency: 'Check before next move',
        estimatedTime: 10
      });
    }

    if (task.data.nutritional_concerns) {
      recommendations.push({
        nextTaskId: 'quick_calc',
        priority: 'medium',
        reasoning: 'Nutritional gaps identified. Calculate supplemental feed requirements.',
        contextData: { 
          calculation_type: 'feed_supplements',
          deficiencies: task.data.nutrition_gaps
        },
        estimatedTime: 20
      });
    }

    return recommendations;
  }

  private static getPerformanceTrackRecommendations(task: TaskResult, farmData: any): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];

    if (task.data.performance_decline) {
      recommendations.push({
        nextTaskId: 'walk_pastures',
        priority: 'high',
        reasoning: 'Performance decline detected. Assess pasture quality for potential causes.',
        contextData: { focus: 'performance_factors', declining_metrics: task.data.decline_areas },
        estimatedTime: 25
      });
    }

    if (task.data.weight_gain_good) {
      recommendations.push({
        nextTaskId: 'check_weather',
        priority: 'low',
        reasoning: 'Good performance trends. Check weather to maintain optimal conditions.',
        contextData: { focus: 'maintain_conditions' },
        estimatedTime: 10
      });
    }

    return recommendations;
  }

  private static getWeatherCheckRecommendations(task: TaskResult, farmData: any): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];

    if (task.data.severe_weather_incoming) {
      recommendations.push({
        nextTaskId: 'check_animals',
        priority: 'critical',
        reasoning: 'Severe weather approaching. Check animal shelter and water access.',
        contextData: { 
          weather_type: task.data.weather_severity,
          preparation_focus: 'shelter_and_water'
        },
        urgency: 'Complete before weather arrives',
        estimatedTime: 30
      });
    }

    if (task.data.optimal_grazing_conditions) {
      recommendations.push({
        nextTaskId: 'plan_rotation',
        priority: 'medium',
        reasoning: 'Optimal weather for grazing. Good time to execute planned rotations.',
        contextData: { 
          optimal_period: task.data.good_weather_window,
          move_recommendations: 'execute_planned'
        },
        estimatedTime: 20
      });
    }

    return recommendations;
  }

  private static getQuickCalcRecommendations(task: TaskResult, farmData: any): WorkflowRecommendation[] {
    const recommendations: WorkflowRecommendation[] = [];

    if (task.data.calculation_type === 'water_requirements') {
      recommendations.push({
        nextTaskId: 'check_animals',
        priority: 'high',
        reasoning: 'Water requirements calculated. Monitor animals for adequate hydration.',
        contextData: { 
          water_targets: task.data.calculated_requirements,
          monitoring_focus: 'hydration_status'
        },
        estimatedTime: 15
      });
    }

    if (task.data.calculation_type === 'feed_supplements') {
      recommendations.push({
        nextTaskId: 'track_performance',
        priority: 'medium',
        reasoning: 'Feed calculations complete. Track performance impact of supplementation.',
        contextData: { 
          supplement_plan: task.data.feeding_plan,
          tracking_focus: 'supplement_effectiveness'
        },
        estimatedTime: 15
      });
    }

    return recommendations;
  }

  private static priorityScore(priority: string): number {
    const scores = { critical: 1, high: 2, medium: 3, low: 4 };
    return scores[priority as keyof typeof scores] || 5;
  }

  // Store and retrieve workflow state
  static saveWorkflowState(state: WorkflowState): void {
    localStorage.setItem('cadence-workflow-state', JSON.stringify(state));
  }

  static loadWorkflowState(): WorkflowState | null {
    const stored = localStorage.getItem('cadence-workflow-state');
    return stored ? JSON.parse(stored) : null;
  }

  // Track task start for timing
  static trackTaskStart(taskId: string): void {
    localStorage.setItem(`task_start_${taskId}`, Date.now().toString());
  }

  // Clear task timing when completed
  static clearTaskTiming(taskId: string): void {
    localStorage.removeItem(`task_start_${taskId}`);
  }
}