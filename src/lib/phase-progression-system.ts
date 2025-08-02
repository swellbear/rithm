// Phase-Aware Workflow Progression System
// This implements the comprehensive tier and phase detection system based on Cadence Subscription Tier Workflow Progressions

export interface UserPhase {
  tier: 'basic' | 'small_business' | 'enterprise';
  phase: number;
  phaseName: string;
  description: string;
  estimatedDuration: string;
  requiredMilestones: string[];
  completedMilestones: string[];
  nextPhase?: UserPhase;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: 'prerequisite' | 'time-sensitive' | 'learning' | 'optimization';
  priority: number; // 1 = highest priority
  completionType: 'form-submission' | 'page-view' | 'data-entry' | 'plan-generation';
  path: string;
  icon: any;
  requiredMilestones?: string[];
  estimatedTime: string;
  completed: boolean;
}

// BASIC TIER PHASE DEFINITIONS
export const BASIC_TIER_PHASES: UserPhase[] = [
  {
    tier: 'basic',
    phase: 1,
    phaseName: 'Initial Setup',
    description: 'Day 1: Complete account setup and onboarding',
    estimatedDuration: '1 day',
    requiredMilestones: [
      'account_created',
      'farm_profile_completed',
      'tier_selected',
      'onboarding_wizard_completed',
      'first_herd_added',
      'first_paddock_created'
    ],
    completedMilestones: []
  },
  {
    tier: 'basic',
    phase: 2,
    phaseName: 'Learning & Basic Assessment',
    description: 'Week 1: Learn the system and complete first assessments',
    estimatedDuration: '1 week',
    requiredMilestones: [
      'educational_tutorials_viewed',
      'first_pasture_assessment_completed',
      'animal_count_verified',
      'water_check_recorded',
      'first_rotation_planned'
    ],
    completedMilestones: []
  },
  {
    tier: 'basic',
    phase: 3,
    phaseName: 'Routine Establishment',
    description: 'Month 1: Establish basic management routines',
    estimatedDuration: '1 month',
    requiredMilestones: [
      'paddock_adjustments_made',
      'weight_tracking_started',
      'supplement_calculator_used'
    ],
    completedMilestones: []
  }
];

// SMALL BUSINESS TIER PHASE DEFINITIONS
export const SMALL_BUSINESS_PHASES: UserPhase[] = [
  {
    tier: 'small_business',
    phase: 1,
    phaseName: 'Enhanced Setup',
    description: 'Day 1: Advanced farm setup with GPS and team',
    estimatedDuration: '1 day',
    requiredMilestones: [
      'detailed_farm_profile_completed',
      'gps_coordinates_set',
      'team_members_invited',
      'advanced_onboarding_completed',
      'multiple_paddocks_mapped',
      'weather_station_connected'
    ],
    completedMilestones: []
  },
  {
    tier: 'small_business',
    phase: 2,
    phaseName: 'Data-Driven Management',
    description: 'Week 1-2: Comprehensive assessments and planning',
    estimatedDuration: '2 weeks',
    requiredMilestones: [
      'gps_perimeter_walked',
      'step_point_assessment_completed',
      'soil_samples_integrated',
      'species_identification_done',
      'ai_rotation_schedule_created',
      'performance_baselines_established'
    ],
    completedMilestones: []
  },
  {
    tier: 'small_business',
    phase: 3,
    phaseName: 'Optimization Phase',
    description: 'Month 1-3: Automated workflows and financial tracking',
    estimatedDuration: '3 months',
    requiredMilestones: [
      'automated_workflows_configured',
      'financial_tracking_active',
      'optimization_reports_reviewed',
      'equipment_integration_setup'
    ],
    completedMilestones: []
  },
  {
    tier: 'small_business',
    phase: 4,
    phaseName: 'Scaling Operations',
    description: 'Month 3-6: Multi-paddock systems and market integration',
    estimatedDuration: '3 months',
    requiredMilestones: [
      'complex_rotation_patterns_implemented',
      'multi_species_grazing_planned',
      'market_integration_active',
      'direct_sales_tools_used'
    ],
    completedMilestones: []
  }
];

// ENTERPRISE TIER PHASE DEFINITIONS
export const ENTERPRISE_PHASES: UserPhase[] = [
  {
    tier: 'enterprise',
    phase: 1,
    phaseName: 'Enterprise Onboarding',
    description: 'Week 1: White-glove setup with specialist support',
    estimatedDuration: '1 week',
    requiredMilestones: [
      'dedicated_setup_completed',
      'data_migration_finished',
      'iot_sensors_deployed',
      'team_training_completed'
    ],
    completedMilestones: []
  },
  {
    tier: 'enterprise',
    phase: 2,
    phaseName: 'Full Automation',
    description: 'Month 1: AI-powered operations and sensor integration',
    estimatedDuration: '1 month',
    requiredMilestones: [
      'sensor_integration_complete',
      'ai_algorithms_activated',
      'real_time_dashboard_configured',
      'predictive_modeling_active'
    ],
    completedMilestones: []
  },
  {
    tier: 'enterprise',
    phase: 3,
    phaseName: 'Optimization & Compliance',
    description: 'Month 2-3: Regulatory management and financial intelligence',
    estimatedDuration: '2 months',
    requiredMilestones: [
      'compliance_automation_active',
      'financial_intelligence_configured',
      'supply_chain_integrated'
    ],
    completedMilestones: []
  },
  {
    tier: 'enterprise',
    phase: 4,
    phaseName: 'Continuous Innovation',
    description: 'Ongoing: Research partnerships and market leadership',
    estimatedDuration: 'Ongoing',
    requiredMilestones: [
      'research_partnerships_established',
      'beta_testing_program_active',
      'market_leadership_achieved'
    ],
    completedMilestones: []
  }
];

// PHASE PROGRESSION SYSTEM
export class PhaseProgressionSystem {
  
  // Get all phases for a specific tier
  static getPhasesForTier(tier: 'basic' | 'small_business' | 'enterprise'): UserPhase[] {
    switch (tier) {
      case 'basic':
        return BASIC_TIER_PHASES;
      case 'small_business':
        return SMALL_BUSINESS_PHASES;
      case 'enterprise':
        return ENTERPRISE_PHASES;
      default:
        return BASIC_TIER_PHASES;
    }
  }

  // Detect current user phase based on milestone completion
  static detectCurrentPhase(
    tier: 'basic' | 'small_business' | 'enterprise',
    completedMilestones: string[]
  ): UserPhase {
    const phases = this.getPhasesForTier(tier);
    
    console.log('Phase Detection Debug:', {
      tier,
      completedMilestones,
      totalPhases: phases.length,
      phaseNames: phases.map(p => p.phaseName)
    });
    
    // Find the current phase by checking from the beginning
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const allMilestonesCompleted = phase.requiredMilestones.every(
        milestone => completedMilestones.includes(milestone)
      );
      
      console.log(`Phase ${i + 1} (${phase.phaseName}):`, {
        requiredMilestones: phase.requiredMilestones,
        allCompleted: allMilestonesCompleted
      });
      
      if (!allMilestonesCompleted) {
        // Still working on this phase
        console.log(`Returning Phase ${i + 1}: ${phase.phaseName}`);
        return { ...phase, completedMilestones };
      } else if (allMilestonesCompleted && i < phases.length - 1) {
        // Check if next phase is available, continue to check it
        console.log(`Phase ${i + 1} completed, checking next phase...`);
        continue;
      } else if (allMilestonesCompleted && i === phases.length - 1) {
        // All phases completed, stay in final phase
        console.log(`All phases completed, staying in final phase: ${phase.phaseName}`);
        return { ...phase, completedMilestones };
      }
    }
    
    // Default to first phase (fallback)
    console.log('Defaulting to first phase');
    return { ...phases[0], completedMilestones };
  }

  // Check if user is ready to progress to next phase
  static isReadyForNextPhase(currentPhase: UserPhase): boolean {
    return currentPhase.requiredMilestones.every(
      milestone => currentPhase.completedMilestones.includes(milestone)
    );
  }

  // Get next phase
  static getNextPhase(currentPhase: UserPhase): UserPhase | null {
    const phases = this.getPhasesForTier(currentPhase.tier);
    const currentIndex = phases.findIndex(p => p.phase === currentPhase.phase);
    
    if (currentIndex >= 0 && currentIndex < phases.length - 1) {
      return phases[currentIndex + 1];
    }
    
    return null; // No next phase (completed all phases)
  }

  // Calculate phase completion percentage
  static getPhaseCompletionPercentage(phase: UserPhase): number {
    if (phase.requiredMilestones.length === 0) return 100;
    
    const completedCount = phase.requiredMilestones.filter(
      milestone => phase.completedMilestones.includes(milestone)
    ).length;
    
    return Math.round((completedCount / phase.requiredMilestones.length) * 100);
  }
}