// Smart Daily Task Generator
// Generates phase-aware daily tasks based on user tier, phase, and completion status

import { 
  PhaseProgressionSystem, 
  UserPhase, 
  DailyTask, 
  BASIC_TIER_PHASES,
  SMALL_BUSINESS_PHASES,
  ENTERPRISE_PHASES 
} from './phase-progression-system';
import { 
  Cloud, Sun, Heart, Droplets, Calendar, MapPin, BookOpen, 
  Calculator, FileText, BarChart, PieChart, Settings, Users,
  Leaf, FlaskConical, Award, Navigation, Camera, Lightbulb,
  GraduationCap, Zap
} from 'lucide-react';

export interface TaskGenerationContext {
  userTier: 'basic' | 'small_business' | 'enterprise';
  currentPhase: UserPhase;
  farmData: {
    hasAnimals: boolean;
    hasPaddocks: boolean;
    hasAssessments: boolean;
    animalCount: number;
    paddockCount: number;
    assessmentCount: number;
  };
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  completedMilestones: string[];
  completionCriteria: any; // From useSmartTaskCompletion
}

export class DailyTaskGenerator {

  // Generate daily tasks based on phase and context
  static generateDailyTasks(context: TaskGenerationContext): DailyTask[] {
    const { currentPhase, userTier } = context;
    
    let tasks: DailyTask[] = [];

    // Generate phase-specific tasks
    switch (userTier) {
      case 'basic':
        tasks = this.generateBasicTierTasks(context);
        break;
      case 'small_business':
        tasks = this.generateSmallBusinessTasks(context);
        break;
      case 'enterprise':
        tasks = this.generateEnterpriseTasks(context);
        break;
    }

    // Apply smart prioritization
    tasks = this.prioritizeTasks(tasks, context);

    // Filter out completed tasks (unless they need daily repetition)
    tasks = this.filterActiveTasks(tasks, context);

    return tasks;
  }

  // BASIC TIER TASK GENERATION
  static generateBasicTierTasks(context: TaskGenerationContext): DailyTask[] {
    const { currentPhase, farmData } = context;
    
    switch (currentPhase.phase) {
      case 1: // Initial Setup
        return this.generateSetupTasks(context);
      case 2: // Learning & Basic Assessment
        return this.generateLearningTasks(context);
      case 3: // Routine Establishment
        return this.generateRoutineTasks(context);
      default:
        return this.generateRoutineTasks(context);
    }
  }

  // SETUP PHASE TASKS (Basic Tier Phase 1)
  static generateSetupTasks(context: TaskGenerationContext): DailyTask[] {
    const { farmData, completedMilestones } = context;
    const tasks: DailyTask[] = [];

    // PREREQUISITE TASKS (Priority 1-3)
    if (!completedMilestones.includes('farm_profile_completed')) {
      tasks.push({
        id: 'complete-farm-profile',
        title: 'Complete Farm Profile',
        description: 'Add farm name, location, and basic information',
        type: 'prerequisite',
        priority: 1,
        completionType: 'form-submission',
        path: '/settings',
        icon: Settings,
        estimatedTime: '3 min',
        completed: false
      });
    }

    // Show herd task if milestone not completed (regardless of individual animals)
    if (!completedMilestones.includes('first_herd_added')) {
      // Basic tier gets simple herd creation, Small Business+ gets individual animal tracking
      const isBasicTier = context.userTier === 'basic';
      
      // For basic tier: only show if no herds (individual animals don't count as "herds")
      // For higher tiers: show if neither herds nor animals exist
      const shouldShowTask = isBasicTier ? !farmData.hasHerds : (!farmData.hasHerds && !farmData.hasAnimals);
      
      if (shouldShowTask) {
        tasks.push({
          id: 'add-first-herd',
          title: isBasicTier ? 'Add Your First Herd' : 'Add Your First Animals',
          description: isBasicTier ? 'Add livestock groups (e.g., "25 cattle, 10 sheep")' : 'Register individual livestock in the system',
          type: 'prerequisite',
          priority: 2,
          completionType: 'form-submission',
          path: isBasicTier ? '/herd-management' : '/livestock-health-breeding',
          icon: Heart,
          estimatedTime: isBasicTier ? '3 min' : '5 min',
          completed: false
        });
      }
    }

    if (!farmData.hasPaddocks && !completedMilestones.includes('first_paddock_created')) {
      tasks.push({
        id: 'create-first-paddock',
        title: 'Map Your First Paddock',
        description: 'Use the Paddock Mapping Tool to track your first grazing area',
        type: 'prerequisite',
        priority: 3,
        completionType: 'form-submission',
        path: '/gps-location-tools',
        icon: MapPin,
        estimatedTime: '10 min',
        completed: false
      });
    }

    // LEARNING TASKS (Priority 8-10)
    // Goals task removed per user request

    return tasks;
  }

  // LEARNING PHASE TASKS (Basic Tier Phase 2)
  static generateLearningTasks(context: TaskGenerationContext): DailyTask[] {
    const { farmData, completedMilestones, timeOfDay } = context;
    const tasks: DailyTask[] = [];

    // TIME-SENSITIVE TASKS (Priority 4-7) - Morning priority
    if (timeOfDay === 'morning') {
      tasks.push({
        id: 'check-weather',
        title: 'Check Today\'s Weather',
        description: 'Review conditions for grazing decisions',
        type: 'time-sensitive',
        priority: 4,
        completionType: 'page-view',
        path: '/weather-integration',
        icon: Cloud,
        estimatedTime: '2 min',
        completed: context.completionCriteria?.weather?.dataViewed || false
      });

      if (farmData.hasAnimals) {
        tasks.push({
          id: 'check-animals',
          title: 'Check Animal Health',
          description: 'Observe livestock condition and behavior',
          type: 'time-sensitive',
          priority: 5,
          completionType: 'data-entry',
          path: '/livestock-health-breeding#health-records',
          icon: Heart,
          estimatedTime: '5 min',
          completed: context.completionCriteria?.animals?.healthRecordsViewed || false
        });
      }

      tasks.push({
        id: 'check-water',
        title: 'Assess Water Supply',
        description: 'Verify adequate water for livestock',
        type: 'time-sensitive',
        priority: 6,
        completionType: 'data-entry',
        path: '/water-requirements',
        icon: Droplets,
        estimatedTime: '3 min',
        completed: context.completionCriteria?.water?.adequacyAssessed || false
      });
    }

    // LEARNING TASKS
    tasks.push({
      id: 'watch-tutorial',
      title: 'Learn Rotational Grazing Basics',
      description: 'Watch introduction to rotational grazing',
      type: 'learning',
      priority: 9,
      completionType: 'page-view',
      path: '/educational-content#basics',
      icon: BookOpen,
      estimatedTime: '10 min',
      completed: completedMilestones.includes('educational_tutorials_viewed')
    });

    tasks.push({
      id: 'first-assessment',
      title: 'Complete First Pasture Assessment',
      description: 'Evaluate your pasture condition (good/fair/poor)',
      type: 'learning',
      priority: 10,
      completionType: 'form-submission',
      path: '/enhanced-pasture-assessment',
      icon: Leaf,
      estimatedTime: '15 min',
      completed: completedMilestones.includes('first_pasture_assessment_completed') || farmData.hasAssessments
    });

    // Additional Learning Phase Tasks
    if (!completedMilestones.includes('animal_count_verified')) {
      tasks.push({
        id: 'verify-animals',
        title: 'Verify Animal Count',
        description: 'Confirm livestock numbers and details',
        type: 'learning',
        priority: 11,
        completionType: 'data-entry',
        path: '/livestock-health-breeding#health-records',
        icon: Heart,
        estimatedTime: '5 min',
        completed: false
      });
    }

    if (!completedMilestones.includes('water_check_recorded')) {
      tasks.push({
        id: 'record-water-check',
        title: 'Record Water Assessment',
        description: 'Check and document water supply adequacy',
        type: 'learning',
        priority: 12,
        completionType: 'data-entry',
        path: '/water-requirements',
        icon: Droplets,
        estimatedTime: '5 min',
        completed: false
      });
    }

    if (!completedMilestones.includes('first_rotation_planned')) {
      // Check if user has enough paddocks for rotation
      if (farmData.paddockCount < 2) {
        // Need at least 2 paddocks to rotate between
        tasks.push({
          id: 'map-second-paddock',
          title: 'Map Second Paddock',
          description: 'Add a second paddock to enable rotation planning',
          type: 'learning',
          priority: 13,
          completionType: 'form-submission',
          path: '/gps-location-tools',
          icon: MapPin,
          estimatedTime: '10 min',
          completed: false
        });
      } else {
        // Has multiple paddocks, can plan rotation
        tasks.push({
          id: 'plan-first-rotation',
          title: 'Plan First Rotation',
          description: 'Create initial grazing schedule between paddocks',
          type: 'learning',
          priority: 13,
          completionType: 'plan-generation',
          path: '/enhanced-grazing-calendar',
          icon: Calendar,
          estimatedTime: '10 min',
          completed: false
        });
      }
    }

    return tasks;
  }

  // ROUTINE PHASE TASKS (Basic Tier Phase 3)
  static generateRoutineTasks(context: TaskGenerationContext): DailyTask[] {
    const { timeOfDay, season, farmData, completedMilestones } = context;
    const tasks: DailyTask[] = [];

    // PHASE 3 MILESTONE TASKS - Focus on establishing daily routines
    if (!completedMilestones.includes('weight_tracking_started')) {
      tasks.push({
        id: 'start-weight-tracking',
        title: 'Start Weight Tracking',
        description: 'Begin monitoring livestock body condition and weight',
        type: 'optimization',
        priority: 14,
        completionType: 'data-entry',
        path: '/livestock-health-breeding#health-records',
        icon: BarChart,
        estimatedTime: '10 min',
        completed: false
      });
    }

    // Always add supplement calculator task - mark completed if milestone exists
    tasks.push({
      id: 'use-supplement-calculator',
      title: 'Calculate Feed Supplements',
      description: 'Determine if additional feed is needed for current conditions',
      type: 'optimization',
      priority: 15,
      completionType: 'plan-generation',
      path: '/feed-supplement-calculator',
      icon: Calculator,
      estimatedTime: '8 min',
      completed: completedMilestones.includes('supplement_calculator_used')
    });

    // POST-COMPLETION CONTINUOUS IMPROVEMENT TASKS
    // When all core phases are complete, offer additional optimization opportunities
    const corePhase3Milestones = ['paddock_adjustments_made', 'weight_tracking_started', 'supplement_calculator_used'];
    const phase3Complete = corePhase3Milestones.every(milestone => completedMilestones.includes(milestone));
    
    if (phase3Complete) {
      // Additional pasture assessment for different paddocks
      if (!completedMilestones.includes('second_pasture_assessment') && farmData.paddockCount > 1) {
        tasks.push({
          id: 'assess-second-paddock',
          title: 'Assess Another Paddock',
          description: 'Complete detailed assessment of your second paddock',
          type: 'optimization',
          priority: 16,
          completionType: 'data-entry',
          path: '/enhanced-pasture-assessment',
          icon: MapPin,
          estimatedTime: '15 min',
          completed: false
        });
      }

      // Weather pattern learning for better planning
      if (!completedMilestones.includes('weather_patterns_studied')) {
        tasks.push({
          id: 'study-weather-patterns',
          title: 'Study Local Weather Patterns',
          description: 'Learn about seasonal patterns affecting your grazing',
          type: 'learning',
          priority: 17,
          completionType: 'page-view',
          path: '/weather-integration#forecast',
          icon: Cloud,
          estimatedTime: '8 min',
          completed: false
        });
      }

      // Educational content for advanced techniques
      if (!completedMilestones.includes('advanced_grazing_techniques')) {
        tasks.push({
          id: 'learn-advanced-techniques',
          title: 'Learn Advanced Grazing Techniques',
          description: 'Explore mob grazing, strip grazing, and other methods',
          type: 'learning',
          priority: 18,
          completionType: 'page-view',
          path: '/educational-content#advanced',
          icon: GraduationCap,
          estimatedTime: '12 min',
          completed: false
        });
      }

      // Farm efficiency optimization
      if (!completedMilestones.includes('efficiency_optimized') && farmData.paddockCount >= 2) {
        tasks.push({
          id: 'optimize-farm-efficiency',
          title: 'Optimize Farm Layout Efficiency',
          description: 'Review and improve your farm layout for better workflow',
          type: 'optimization',
          priority: 19,
          completionType: 'plan-generation',
          path: '/enhanced-grazing-calendar#optimization',
          icon: Zap,
          estimatedTime: '10 min',
          completed: false
        });
      }
    }

    // Tier-appropriate paddock task based on user's needs and tier
    if (!completedMilestones.includes('paddock_adjustments_made')) {
      const hasPaddocks = context.farmData.paddockCount > 0;
      const isBasicTier = context.userTier === 'basic';
      
      if (isBasicTier) {
        if (context.farmData.paddockCount >= 2) {
          // Basic tier with multiple paddocks - encourage additional ones
          tasks.push({
            id: 'create-additional-paddock',
            title: 'Map Another Paddock',
            description: 'Add more grazing areas to improve rotation flexibility',
            type: 'optimization',
            priority: 16,
            completionType: 'form-submission',
            path: '/gps-location-tools',
            icon: MapPin,
            estimatedTime: '10 min',
            completed: false
          });
        } else {
          // Basic tier with 0-1 paddocks - encourage reaching minimum for rotation
          tasks.push({
            id: 'create-second-paddock',
            title: 'Add Second Paddock',
            description: 'Create a second grazing area to enable rotation',
            type: 'prerequisite',
            priority: 16,
            completionType: 'form-submission',
            path: '/gps-location-tools',
            icon: MapPin,
            estimatedTime: '10 min',
            completed: false
          });
        }
      } else {
        // Small Business+ tier - advanced paddock optimization
        tasks.push({
          id: 'optimize-paddocks',
          title: 'Optimize Paddock Layout',
          description: 'Fine-tune boundaries, infrastructure, and rotation efficiency',
          type: 'optimization',
          priority: 16,
          completionType: 'data-entry',
          path: '/gps-location-tools',
          icon: MapPin,
          estimatedTime: '15 min',
          completed: false
        });
      }
    }

    // Performance analytics only for Small Business+ tiers (Basic tier lacks individual tracking data)
    if (!completedMilestones.includes('monthly_report_reviewed') && !context.userTier.includes('basic')) {
      tasks.push({
        id: 'review-monthly-report',
        title: 'Review Performance Report',
        description: 'Analyze farm performance and identify improvement areas',
        type: 'optimization',
        priority: 17,
        completionType: 'page-view',
        path: '/performance-analytics',
        icon: FileText,
        estimatedTime: '12 min',
        completed: false
      });
    }

    // DAILY ROUTINE TASKS - Always present
    if (timeOfDay === 'morning') {
      tasks.push(
        {
          id: 'morning-weather',
          title: 'Morning Weather Check',
          description: 'Review today\'s conditions and any alerts',
          type: 'time-sensitive',
          priority: 4,
          completionType: 'page-view',
          path: '/weather-integration',
          icon: Sun,
          estimatedTime: '2 min',
          completed: context.completionCriteria?.weather?.dataViewed || false
        },
        {
          id: 'animal-observation',
          title: 'Daily Animal Check',
          description: 'Observe health, behavior, and water access',
          type: 'time-sensitive',
          priority: 5,
          completionType: 'data-entry',
          path: '/livestock-health-breeding',
          icon: Heart,
          estimatedTime: '10 min',
          completed: context.completionCriteria?.animals?.conditionsAssessed || false
        },
        {
          id: 'water-systems',
          title: 'Check Water Systems',
          description: 'Verify pumps, troughs, and supply',
          type: 'time-sensitive',
          priority: 6,
          completionType: 'data-entry',
          path: '/water-requirements#systems',
          icon: Droplets,
          estimatedTime: '5 min',
          completed: context.completionCriteria?.water?.systemsChecked || false
        },
        {
          id: 'plan-moves',
          title: 'Plan Today\'s Activities',
          description: 'Review rotation schedule and plan moves',
          type: 'time-sensitive',
          priority: 7,
          completionType: 'plan-generation',
          path: '/enhanced-grazing-calendar',
          icon: Calendar,
          estimatedTime: '5 min',
          completed: context.completionCriteria?.rotation?.movesPlanned || false
        }
      );
    }

    return tasks;
  }

  // SMALL BUSINESS TIER TASK GENERATION
  static generateSmallBusinessTasks(context: TaskGenerationContext): DailyTask[] {
    // Build on basic tasks with more sophistication
    const basicTasks = this.generateBasicTierTasks(context);
    
    // Add small business specific tasks
    const advancedTasks: DailyTask[] = [
      {
        id: 'review-analytics',
        title: 'Review Performance Analytics',
        description: 'Check key metrics and trends',
        type: 'optimization',
        priority: 11,
        completionType: 'page-view',
        path: '/performance-analytics',
        icon: BarChart,
        estimatedTime: '5 min',
        completed: false
      },
      {
        id: 'financial-tracking',
        title: 'Update Financial Records',
        description: 'Record costs and track profitability',
        type: 'optimization',
        priority: 12,
        completionType: 'data-entry',
        path: '/financial-management',
        icon: PieChart,
        estimatedTime: '10 min',
        completed: false
      }
    ];

    return [...basicTasks, ...advancedTasks];
  }

  // ENTERPRISE TIER TASK GENERATION
  static generateEnterpriseTasks(context: TaskGenerationContext): DailyTask[] {
    // Build on small business tasks with automation focus
    const smallBusinessTasks = this.generateSmallBusinessTasks(context);
    
    // Add enterprise specific tasks
    const enterpriseTasks: DailyTask[] = [
      {
        id: 'review-automation',
        title: 'Review Automated Systems',
        description: 'Check AI recommendations and sensor data',
        type: 'optimization',
        priority: 13,
        completionType: 'page-view',
        path: '/analytics-hub',
        icon: FlaskConical,
        estimatedTime: '3 min',
        completed: false
      }
    ];

    return [...smallBusinessTasks, ...enterpriseTasks];
  }

  // SMART TASK PRIORITIZATION
  static prioritizeTasks(tasks: DailyTask[], context: TaskGenerationContext): DailyTask[] {
    return tasks.sort((a, b) => {
      // First sort by priority number (lower = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Then by type priority: prerequisite > time-sensitive > learning > optimization
      const typePriority = {
        'prerequisite': 1,
        'time-sensitive': 2,
        'learning': 3,
        'optimization': 4
      };
      
      return typePriority[a.type] - typePriority[b.type];
    });
  }

  // FILTER ACTIVE TASKS
  static filterActiveTasks(tasks: DailyTask[], context: TaskGenerationContext): DailyTask[] {
    return tasks.filter(task => {
      // Always show time-sensitive tasks (daily repetition)
      if (task.type === 'time-sensitive') return true;
      
      // Show incomplete prerequisite and learning tasks
      if (task.type === 'prerequisite' || task.type === 'learning') {
        return !task.completed;
      }
      
      // Show incomplete optimization tasks (hide completed ones)
      if (task.type === 'optimization') {
        return !task.completed;
      }
      
      // Show incomplete routine tasks
      if (task.type === 'routine') {
        return !task.completed;
      }
      
      return true;
    });
  }

  // GET MILESTONE COMPLETION STATUS
  static getMilestoneCompletionStatus(
    farmData: any,
    completionCriteria: any,
    user?: any
  ): string[] {
    const completed: string[] = [];
    
    // Check basic account milestones
    completed.push('account_created'); // User is logged in
    
    // Check farm profile completion (user has zipcode and basic info)
    if (user?.zipCode) {
      completed.push('farm_profile_completed');
    }
    
    // Check tier selection and onboarding completion
    // If user has any tier (including basic), they've effectively selected their tier
    if (user && user.subscriptionTier) {
      completed.push('tier_selected'); // User has any subscription tier
    }
    
    // If user is logged in with a farm profile, onboarding is effectively complete
    if (user && (user.onboardingCompleted !== false || user.farmName || user.zipCode)) {
      completed.push('onboarding_wizard_completed');
    }
    
    // Check farm setup milestones
    // Respect testing override for first_herd_added milestone
    if (farmData.hasAnimals && localStorage.getItem('prevent-milestone-sync') !== 'true') {
      completed.push('first_herd_added');
    }
    if (farmData.hasPaddocks) completed.push('first_paddock_created');
    if (farmData.hasAssessments) completed.push('first_pasture_assessment_completed');
    
    // Check localStorage milestones (educational content, goals, etc.) - Primary storage
    try {
      const completedMilestones = JSON.parse(localStorage.getItem('cadence-completed-milestones') || '[]');
      completed.push(...completedMilestones);
      
      // Legacy support for old key
      const legacyMilestones = JSON.parse(localStorage.getItem('cadence-milestones') || '[]');
      completed.push(...legacyMilestones);
    } catch (error) {
      console.warn('Failed to parse localStorage milestones:', error);
    }

    // Check database milestones for cross-device sync
    try {
      // This will be populated by the milestone sync hook
      const databaseMilestones = JSON.parse(localStorage.getItem('cadence-synced-milestones') || '[]');
      completed.push(...databaseMilestones);
    } catch (error) {
      console.warn('Failed to parse database milestones:', error);
    }
    
    // Check specific learning phase milestones
    if (farmData.hasAnimals) {
      completed.push('animal_count_verified'); // Already have animals, count is verified
    }
    
    // Check water assessment completion - check both completion criteria and direct milestone
    if (completionCriteria?.water?.adequacyAssessed || 
        localStorage.getItem('cadence-milestone-water_check_recorded') === 'true') {
      completed.push('water_check_recorded');
    }
    
    if (completionCriteria?.rotation?.movesPlanned || 
        completionCriteria?.rotation?.datesScheduled ||
        farmData.paddockCount >= 2) { // Having 2+ paddocks satisfies the rotation prerequisite
      completed.push('first_rotation_planned');
    }
    
    // Check daily workflow completion
    if (completionCriteria?.weather?.dataViewed && 
        completionCriteria?.animals?.healthRecordsViewed &&
        completionCriteria?.water?.adequacyAssessed &&
        completionCriteria?.rotation?.movesPlanned) {
      completed.push('daily_workflow_completed');
    }
    
    return completed;
  }
}