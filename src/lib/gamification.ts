// Gamification system for encouraging proper sampling methodology

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: 'methodology' | 'consistency' | 'accuracy' | 'progress';
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface SamplingQualityMetrics {
  photoQuality: number; // 0-100
  spacing: number; // How consistent the step spacing was
  coverage: number; // How well they covered the paddock
  timing: number; // Time between samples (consistency)
  accuracy: number; // Overall methodology score
}

export interface UserProgress {
  level: number;
  totalPoints: number;
  assessmentsCompleted: number;
  streakDays: number;
  lastAssessment: Date | null;
  achievements: Achievement[];
  badges: Badge[];
}

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_assessment',
    title: 'First Steps',
    description: 'Complete your first step point assessment',
    icon: '🎯',
    points: 50,
    category: 'progress',
    unlocked: false
  },
  {
    id: 'perfect_spacing',
    title: 'Consistent Stepper',
    description: 'Maintain consistent 5-foot spacing for entire assessment',
    icon: '📏',
    points: 100,
    category: 'methodology',
    unlocked: false
  },
  {
    id: 'photo_perfectionist',
    title: 'Photo Perfectionist',
    description: 'Take 10 high-quality photos in a single assessment',
    icon: '📸',
    points: 75,
    category: 'accuracy',
    unlocked: false
  },
  {
    id: 'seven_day_streak',
    title: 'Weekly Warrior',
    description: 'Complete assessments for 7 consecutive days',
    icon: '🔥',
    points: 200,
    category: 'consistency',
    unlocked: false
  },
  {
    id: 'scientific_sampler',
    title: 'Scientific Sampler',
    description: 'Complete 25+ sample points in a single assessment',
    icon: '🔬',
    points: 150,
    category: 'methodology',
    unlocked: false
  },
  {
    id: 'accuracy_expert',
    title: 'Accuracy Expert',
    description: 'Achieve 90%+ methodology score on 5 consecutive assessments',
    icon: '🎖️',
    points: 300,
    category: 'accuracy',
    unlocked: false
  },
  {
    id: 'rapid_assessor',
    title: 'Rapid Assessor',
    description: 'Complete assessment in under 15 minutes with good quality',
    icon: '⚡',
    points: 125,
    category: 'progress',
    unlocked: false
  },
  {
    id: 'paddock_master',
    title: 'Paddock Master',
    description: 'Assess 10 different paddocks',
    icon: '🏆',
    points: 250,
    category: 'progress',
    unlocked: false
  }
];

// Badge definitions
export const BADGES: Badge[] = [
  {
    id: 'methodology_bronze',
    name: 'Methodology Novice',
    description: 'Maintain 70%+ methodology score',
    icon: '🥉',
    criteria: 'Average methodology score ≥ 70%',
    tier: 'bronze'
  },
  {
    id: 'methodology_silver',
    name: 'Methodology Expert',
    description: 'Maintain 85%+ methodology score',
    icon: '🥈', 
    criteria: 'Average methodology score ≥ 85%',
    tier: 'silver'
  },
  {
    id: 'methodology_gold',
    name: 'Methodology Master',
    description: 'Maintain 95%+ methodology score',
    icon: '🥇',
    criteria: 'Average methodology score ≥ 95%',
    tier: 'gold'
  },
  {
    id: 'consistency_bronze',
    name: 'Regular Sampler',
    description: 'Complete assessments 3 days per week',
    icon: '🥉',
    criteria: '3+ assessments per week',
    tier: 'bronze'
  },
  {
    id: 'consistency_silver',
    name: 'Dedicated Sampler',
    description: 'Complete assessments 5 days per week',
    icon: '🥈',
    criteria: '5+ assessments per week', 
    tier: 'silver'
  },
  {
    id: 'accuracy_gold',
    name: 'Precision Champion',
    description: 'Achieve perfect accuracy on 10 assessments',
    icon: '🥇',
    criteria: '100% accuracy on 10 assessments',
    tier: 'gold'
  }
];

// Calculate methodology score based on sampling quality
export function calculateMethodologyScore(metrics: SamplingQualityMetrics): number {
  const weights = {
    photoQuality: 0.25,
    spacing: 0.25,
    coverage: 0.25,
    timing: 0.15,
    accuracy: 0.10
  };

  return Math.round(
    metrics.photoQuality * weights.photoQuality +
    metrics.spacing * weights.spacing +
    metrics.coverage * weights.coverage +
    metrics.timing * weights.timing +
    metrics.accuracy * weights.accuracy
  );
}

// Check for achieved milestones
export function checkAchievements(
  userProgress: UserProgress,
  currentMetrics: SamplingQualityMetrics,
  assessmentData: any
): Achievement[] {
  const newAchievements: Achievement[] = [];

  // First assessment
  if (userProgress.assessmentsCompleted === 1) {
    const achievement = ACHIEVEMENTS.find(a => a.id === 'first_assessment');
    if (achievement && !achievement.unlocked) {
      newAchievements.push({ ...achievement, unlocked: true, unlockedAt: new Date() });
    }
  }

  // Perfect spacing (spacing score ≥ 95%)
  if (currentMetrics.spacing >= 95) {
    const achievement = ACHIEVEMENTS.find(a => a.id === 'perfect_spacing');
    if (achievement && !achievement.unlocked) {
      newAchievements.push({ ...achievement, unlocked: true, unlockedAt: new Date() });
    }
  }

  // Photo perfectionist (10+ high quality photos)
  if (assessmentData.stepPoints?.length >= 10 && currentMetrics.photoQuality >= 85) {
    const achievement = ACHIEVEMENTS.find(a => a.id === 'photo_perfectionist');
    if (achievement && !achievement.unlocked) {
      newAchievements.push({ ...achievement, unlocked: true, unlockedAt: new Date() });
    }
  }

  // Scientific sampler (25+ sample points)
  if (assessmentData.stepPoints?.length >= 25) {
    const achievement = ACHIEVEMENTS.find(a => a.id === 'scientific_sampler');
    if (achievement && !achievement.unlocked) {
      newAchievements.push({ ...achievement, unlocked: true, unlockedAt: new Date() });
    }
  }

  // Seven day streak
  if (userProgress.streakDays >= 7) {
    const achievement = ACHIEVEMENTS.find(a => a.id === 'seven_day_streak');
    if (achievement && !achievement.unlocked) {
      newAchievements.push({ ...achievement, unlocked: true, unlockedAt: new Date() });
    }
  }

  return newAchievements;
}

// Calculate points for completing an assessment
export function calculateAssessmentPoints(metrics: SamplingQualityMetrics, stepPointCount: number): number {
  const basePoints = 25;
  const qualityBonus = Math.round(calculateMethodologyScore(metrics) * 0.5);
  const volumeBonus = Math.min(stepPointCount * 2, 50); // Max 50 bonus points
  
  return basePoints + qualityBonus + volumeBonus;
}

// Get user level based on total points
export function getUserLevel(totalPoints: number): number {
  if (totalPoints < 100) return 1;
  if (totalPoints < 300) return 2;
  if (totalPoints < 600) return 3;
  if (totalPoints < 1000) return 4;
  if (totalPoints < 1500) return 5;
  if (totalPoints < 2500) return 6;
  if (totalPoints < 4000) return 7;
  if (totalPoints < 6000) return 8;
  if (totalPoints < 9000) return 9;
  return 10;
}

// Get points needed for next level
export function getPointsToNextLevel(totalPoints: number): number {
  const currentLevel = getUserLevel(totalPoints);
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000];
  
  if (currentLevel >= 10) return 0;
  return levelThresholds[currentLevel] - totalPoints;
}

// Generate encouraging feedback based on performance
export function generateFeedback(metrics: SamplingQualityMetrics): {
  message: string;
  tips: string[];
  encouragement: string;
} {
  const score = calculateMethodologyScore(metrics);
  
  if (score >= 90) {
    return {
      message: "Excellent methodology! Your sampling technique is scientifically sound.",
      tips: [
        "Keep maintaining this high standard",
        "Consider sharing your technique with other farmers"
      ],
      encouragement: "You're setting the gold standard for pasture assessment!"
    };
  } else if (score >= 75) {
    return {
      message: "Good sampling technique with room for improvement.",
      tips: [
        "Focus on maintaining consistent step spacing",
        "Ensure photos are taken from the same height",
        "Try to cover the paddock more systematically"
      ],
      encouragement: "You're developing solid scientific habits!"
    };
  } else if (score >= 60) {
    return {
      message: "Your sampling shows promise but needs refinement.",
      tips: [
        "Review the step point tutorial for proper technique",
        "Take more time to ensure quality over speed",
        "Focus on one aspect at a time to improve"
      ],
      encouragement: "Every expert was once a beginner - keep practicing!"
    };
  } else {
    return {
      message: "Let's work on improving your sampling methodology.",
      tips: [
        "Start with the basics tutorial",
        "Practice maintaining consistent spacing",
        "Take time to learn proper photo techniques"
      ],
      encouragement: "The journey to expertise starts with a single step!"
    };
  }
}

// Mock function to simulate quality analysis of photos and spacing
export function analyzeAssessmentQuality(stepPoints: any[], duration: number): SamplingQualityMetrics {
  // In a real implementation, this would analyze:
  // - Photo clarity, lighting, consistency
  // - GPS data to check spacing consistency
  // - Time stamps to check pacing
  // - Coverage pattern analysis
  
  // For now, return simulated metrics based on basic data
  const photoQuality = Math.min(95, 60 + Math.random() * 35 + (stepPoints.length > 10 ? 10 : 0));
  const spacing = Math.min(95, 50 + Math.random() * 45);
  const coverage = Math.min(95, 65 + Math.random() * 30);
  const timing = duration > 600 && duration < 1800 ? 85 + Math.random() * 15 : 60 + Math.random() * 25;
  const accuracy = Math.min(95, 70 + Math.random() * 25);

  return {
    photoQuality: Math.round(photoQuality),
    spacing: Math.round(spacing),
    coverage: Math.round(coverage),
    timing: Math.round(timing),
    accuracy: Math.round(accuracy)
  };
}