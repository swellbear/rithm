// Fixed Cross-Workflow Progress Widget with 66% Completion System
// This implements the sophisticated interconnected workflow system where individual page tasks feed back to daily workflow

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, X, Minimize2, Maximize2 } from 'lucide-react';
import { 
  Cloud, Sun, Cat, Droplets, Calendar, MapPin, Route, Ruler, 
  Leaf, Calculator, FileText, Heart, Users, BarChart,
  Flower2, PieChart, Grid, BarChart3, Package, DollarSign,
  Camera, Sparkles, BookOpen, FlaskConical, AlertTriangle,
  LineChart, Award, Navigation, Eye, Wrench, Settings,
  Bell, Receipt, PiggyBank, TestTube, Sprout, ClipboardList,
  Handshake, TrendingUp, GraduationCap, Lightbulb
} from 'lucide-react';
import { useSmartTaskCompletion } from '@/hooks/useSmartTaskCompletion';

interface Task {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: any;
  completed: boolean;
}

interface WorkflowContext {
  title: string;
  tasks: Task[];
  route: string;
}

export function WorkflowProgressWidget() {
  const [location, navigate] = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentContext, setCurrentContext] = useState<WorkflowContext | null>(null);

  const { getTaskProgress, getCompletionCriteria } = useSmartTaskCompletion();

  // Get farm data for intelligent context detection
  const { data: paddocks = [] } = useQuery<any[]>({ queryKey: ["/api/paddocks"] });
  const { data: animals = [] } = useQuery<any[]>({ queryKey: ["/api/animals"] });
  const { data: assessments = [] } = useQuery<any[]>({ queryKey: ["/api/assessments"] });

  // CROSS-WORKFLOW COMPLETION SYSTEM - The magic happens here!
  const getWorkflowContext = (): WorkflowContext => {
    const hasAnimalData = animals.length > 0;
    const hasPaddockData = paddocks.length > 0;
    const hasAssessmentData = assessments.length > 0;

    // Smart context detection based on current page - NOW COVERS ALL 30+ PAGES
    const getContextTitle = (): string => {
      if (location === '/' || location === '/dashboard') return 'Daily Workflow';
      if (location.includes('weather')) return 'Weather Workflow';
      if (location.includes('livestock') || location.includes('animals') || location.includes('herd-management')) return 'Livestock Workflow';
      if (location.includes('water')) return 'Water Workflow';
      if (location.includes('enhanced-grazing-calendar') || location.includes('rotation-planning')) return 'Rotation Workflow';
      if (location.includes('au-calculator')) return 'AU Calculator Workflow';
      if (location.includes('enhanced-pasture-assessment')) return 'Pasture Assessment Workflow';
      if (location.includes('dm-availability')) return 'DM Availability Workflow';
      if (location.includes('feed-supplement')) return 'Feed Supplement Workflow';
      if (location.includes('plant-identification')) return 'Plant ID Workflow';
      if (location.includes('nutritional-analysis')) return 'Nutritional Analysis Workflow';
      if (location.includes('performance-analytics')) return 'Performance Analytics Workflow';
      if (location.includes('gps-location')) return 'GPS Tools Workflow';
      if (location.includes('brush-hog')) return 'Brush Hog Workflow';
      if (location.includes('alert-system')) return 'Alert System Workflow';
      if (location.includes('financial-management')) return 'Financial Management Workflow';
      if (location.includes('soil-health')) return 'Soil Health Workflow';
      if (location.includes('infrastructure')) return 'Infrastructure Workflow';
      if (location.includes('market-analysis')) return 'Market Analysis Workflow';
      if (location.includes('educational-content')) return 'Education Workflow';
      if (location.includes('tools')) return 'Tools Overview';
      if (location.includes('analytics')) return 'Analytics Workflow';
      if (location.includes('performance-optimization')) return 'Performance Optimization Workflow';
      if (location.includes('data-integration-hub')) return 'Data Integration Workflow';
      if (location.includes('onboarding')) return 'Setup Workflow';
      if (location.includes('subscription')) return 'Subscription Workflow';
      if (location.includes('settings')) return 'Settings Workflow';
      if (location.includes('farm-profile')) return 'Farm Profile Workflow';
      if (location.includes('paddock-management')) return 'Paddock Management Workflow';
      if (location.includes('water-systems')) return 'Water Systems Workflow';
      return 'Farm Workflow';
    };

    // DAILY WORKFLOW - The main dashboard workflow that gets completed by other workflows
    if (location === '/' || location === '/dashboard') {
      const dailyTasks: Task[] = [
        {
          id: 'check-weather',
          title: 'Check Weather',
          description: 'Review conditions and alerts',
          path: '/weather-integration',
          icon: Cloud,
          completed: getTaskProgress('weather').isComplete // 66% of weather tasks = complete
        },
        {
          id: 'check-animals',
          title: 'Livestock Management',
          description: 'Review health and records',
          path: '/livestock-health-breeding',
          icon: Cat,
          completed: getTaskProgress('animals').isComplete // 66% of animal tasks = complete
        },
        {
          id: 'assess-water',
          title: 'Assess Water',
          description: 'Verify water systems',
          path: '/water-requirements',
          icon: Droplets,
          completed: getTaskProgress('water').isComplete // 66% of water tasks = complete
        },
        {
          id: 'plan-moves',
          title: 'Plan Rotation',
          description: 'Schedule paddock moves',
          path: '/enhanced-grazing-calendar',
          icon: Calendar,
          completed: getTaskProgress('rotation').isComplete // 66% of rotation tasks = complete
        }
      ];
      
      return {
        title: getContextTitle(),
        tasks: dailyTasks,
        route: location
      };
    }

    // ASSESSMENT WORKFLOW - Multi-step process with sophisticated tracking
    if (location.includes('enhanced-pasture-assessment') || location.includes('dm-availability') || location.includes('plant-identification')) {
      const assessmentTasks: Task[] = [
        {
          id: 'select-paddock',
          title: 'Select Paddock',
          description: 'Choose paddock to assess',
          path: '/enhanced-pasture-assessment',
          icon: MapPin,
          completed: hasPaddockData
        },
        {
          id: 'walk-transect',
          title: 'Walk Transect',
          description: 'Collect step-point data',
          path: '/enhanced-pasture-assessment',
          icon: Route,
          completed: hasAssessmentData
        },
        {
          id: 'measure-height',
          title: 'Measure Grass',
          description: 'Record grass height',
          path: '/enhanced-pasture-assessment',
          icon: Ruler,
          completed: hasAssessmentData
        },
        {
          id: 'identify-species',
          title: 'Plant Species',
          description: 'Identify plant types',
          path: '/plant-identification',
          icon: Leaf,
          completed: hasAssessmentData && assessments.some(a => a.summary?.dominantSpecies?.length > 0)
        },
        {
          id: 'calculate-dm',
          title: 'Calculate DM',
          description: 'Estimate dry matter',
          path: '/dm-availability',
          icon: Calculator,
          completed: hasAssessmentData
        },
        {
          id: 'generate-report',
          title: 'Generate Report',
          description: 'Create recommendations',
          path: '/enhanced-pasture-assessment',
          icon: FileText,
          completed: hasAssessmentData && assessments.some(a => a.summary?.recommendations?.length > 0)
        }
      ];

      return {
        title: getContextTitle(),
        tasks: assessmentTasks,
        route: location
      };
    }

    // WEATHER WORKFLOW - Specific weather tasks that feed back to daily workflow
    if (location.includes('weather')) {
      const weatherProgress = getTaskProgress('weather');
      console.log('Weather workflow - progress data:', weatherProgress);
      
      // Get completion criteria directly from localStorage with debugging
      const rawData = localStorage.getItem('cadence-smart-task-completion');
      console.log('RAW LOCALSTORAGE DATA:', rawData);
      const criteriaData = JSON.parse(rawData || '{}');
      console.log('PARSED CRITERIA DATA:', criteriaData);
      
      // Use hook data directly - this fixes the completion display issue
      const allCriteria = getCompletionCriteria();
      const weatherCriteria = allCriteria.weather || {};
      console.log('HOOK WEATHER CRITERIA:', weatherCriteria);
      console.log('INDIVIDUAL WEATHER FLAGS:', {
        dataViewed: weatherCriteria.dataViewed,
        forecastChecked: weatherCriteria.forecastChecked,
        alertsReviewed: weatherCriteria.alertsReviewed
      });
      
      const weatherTasks: Task[] = [
        {
          id: 'check-current',
          title: 'Review Current Weather',
          description: 'Check temperature and conditions',
          path: '/weather-integration#current-weather',
          icon: Cloud,
          completed: weatherCriteria.dataViewed === true
        },
        {
          id: 'check-forecast',
          title: 'Review 7-day Forecast',
          description: 'Plan ahead for weather changes',
          path: '/weather-integration#forecast',
          icon: Sun,
          completed: weatherCriteria.forecastChecked === true
        },
        {
          id: 'check-alerts',
          title: 'Check Weather Alerts',
          description: 'Review warnings and advisories',
          path: '/weather-integration#alerts',
          icon: Cloud,
          completed: weatherCriteria.alertsReviewed === true
        }
      ];
      
      console.log('FINAL WEATHER TASKS WITH COMPLETION STATUS:', weatherTasks.map(t => ({ 
        title: t.title, 
        completed: t.completed 
      })));
      
      console.log('Weather tasks completion status:', weatherTasks.map(t => ({ title: t.title, completed: t.completed })));
      console.log('Weather progress criteria:', weatherProgress.criteria);
      console.log('Weather progress FULL OBJECT:', weatherProgress);

      return {
        title: getContextTitle(),
        tasks: weatherTasks,
        route: location
      };
    }

    // LIVESTOCK WORKFLOW - Animal-focused tasks that feed back to daily workflow
    if (location.includes('livestock') || location.includes('animals')) {
      const livestockProgress = getTaskProgress('animals');
      console.log('Livestock workflow - progress data:', livestockProgress);
      
      // Get completion criteria directly from localStorage with debugging
      const rawData = localStorage.getItem('cadence-smart-task-completion');
      console.log('RAW LOCALSTORAGE DATA (ANIMALS):', rawData);
      const criteriaData = JSON.parse(rawData || '{}');
      console.log('PARSED CRITERIA DATA (ANIMALS):', criteriaData);
      const animalsCriteria = criteriaData.animals || {};
      console.log('LIVESTOCK CRITERIA DEBUG:', animalsCriteria);
      
      // Use hook data instead of localStorage - this fixes the completion display issue
      const livestockTasks: Task[] = [
        {
          id: 'health-records',
          title: 'Review Health Records',
          description: 'Check vaccination schedules',
          path: '/livestock-health-breeding#health-records',
          icon: Heart,
          completed: livestockProgress.criteria?.healthRecordsViewed === true
        },
        {
          id: 'calculate-water',
          title: 'Calculate Water Needs',
          description: 'Assess daily water requirements',
          path: '/water-requirements#animal-needs',
          icon: Droplets,
          completed: livestockProgress.criteria?.waterCalculated === true
        },
        {
          id: 'assess-conditions',
          title: 'Assess Body Condition',
          description: 'Evaluate animal health status',
          path: '/livestock-health-breeding#body-condition',
          icon: Cat,
          completed: livestockProgress.criteria?.conditionsAssessed === true
        }
      ];
      
      console.log('Livestock tasks completion status:', livestockTasks.map(t => ({ title: t.title, completed: t.completed })));

      return {
        title: getContextTitle(),
        tasks: livestockTasks,
        route: location
      };
    }

    // WATER WORKFLOW - Water management tasks that feed back to daily workflow
    if (location.includes('water')) {
      const currentCriteria = getCompletionCriteria();
      const waterTasks: Task[] = [
        {
          id: 'calculate-requirements',
          title: 'Calculate Water Requirements',
          description: 'Determine daily water needs',
          path: '/water-requirements#requirements',
          icon: Droplets,
          completed: currentCriteria.water?.requirementsCalculated || false
        },
        {
          id: 'check-systems',
          title: 'Check Water Systems',
          description: 'Verify troughs and pumps',
          path: '/water-requirements#systems',
          icon: Droplets,
          completed: currentCriteria.water?.systemsChecked || false
        },
        {
          id: 'assess-adequacy',
          title: 'Assess Water Adequacy',
          description: 'Ensure sufficient supply',
          path: '/water-requirements#adequacy',
          icon: Droplets,
          completed: currentCriteria.water?.adequacyAssessed || false
        }
      ];

      return {
        title: getContextTitle(),
        tasks: waterTasks,
        route: location
      };
    }

    // ROTATION WORKFLOW - Grazing rotation tasks that feed back to daily workflow
    if (location.includes('calendar') || location.includes('grazing')) {
      const currentCriteria = getCompletionCriteria();
      const rotationTasks: Task[] = [
        {
          id: 'plan-moves',
          title: 'Plan Paddock Moves',
          description: 'Schedule next rotations',
          path: '/enhanced-grazing-calendar#planning',
          icon: MapPin,
          completed: currentCriteria.rotation?.movesPlanned || false
        },
        {
          id: 'schedule-dates',
          title: 'Schedule Move Dates',
          description: 'Set rotation timeline',
          path: '/enhanced-grazing-calendar#schedule',
          icon: Calendar,
          completed: currentCriteria.rotation?.datesScheduled || false
        },
        {
          id: 'calculate-capacity',
          title: 'Calculate Paddock Capacity',
          description: 'Assess carrying capacity',
          path: '/enhanced-grazing-calendar#capacity',
          icon: Calculator,
          completed: currentCriteria.rotation?.capacityCalculated || false
        }
      ];

      return {
        title: getContextTitle(),
        tasks: rotationTasks,
        route: location
      };
    }

    // AU CALCULATOR WORKFLOW
    if (location.includes('au-calculator')) {
      const auTasks: Task[] = [
        {
          id: 'select-method',
          title: 'Select Calculation Method',
          description: 'Choose weight or standard-based',
          path: '/au-calculator#method',
          icon: Calculator,
          completed: false
        },
        {
          id: 'enter-livestock',
          title: 'Enter Livestock Data',
          description: 'Add livestock weights or counts',
          path: '/au-calculator#livestock',
          icon: Users,
          completed: hasAnimalData
        },
        {
          id: 'calculate-stocking',
          title: 'Calculate Stocking Rate',
          description: 'Determine optimal AU per acre',
          path: '/au-calculator#stocking',
          icon: BarChart,
          completed: false
        }
      ];
      return { title: 'AU Calculator Workflow', tasks: auTasks, route: location };
    }

    // PASTURE ASSESSMENT WORKFLOW
    if (location.includes('enhanced-pasture-assessment')) {
      const assessTasks: Task[] = [
        {
          id: 'walk-transect',
          title: 'Walk Transect Lines',
          description: 'Follow step-point method',
          path: '/enhanced-pasture-assessment#transect',
          icon: MapPin,
          completed: hasAssessmentData
        },
        {
          id: 'identify-plants',
          title: 'Identify Plant Species',
          description: 'Record at each point',
          path: '/enhanced-pasture-assessment#identify',
          icon: Flower2,
          completed: false
        },
        {
          id: 'calculate-composition',
          title: 'Calculate Composition',
          description: 'Analyze species percentages',
          path: '/enhanced-pasture-assessment#composition',
          icon: PieChart,
          completed: false
        }
      ];
      return { title: 'Pasture Assessment Workflow', tasks: assessTasks, route: location };
    }

    // DM AVAILABILITY WORKFLOW
    if (location.includes('dm-availability')) {
      const dmTasks: Task[] = [
        {
          id: 'measure-height',
          title: 'Measure Grass Height',
          description: 'Use ruler or plate meter',
          path: '/dm-availability#height',
          icon: Ruler,
          completed: false
        },
        {
          id: 'assess-density',
          title: 'Assess Stand Density',
          description: 'Evaluate coverage',
          path: '/dm-availability#density',
          icon: Grid,
          completed: false
        },
        {
          id: 'calculate-yield',
          title: 'Calculate DM Yield',
          description: 'Estimate pounds per acre',
          path: '/dm-availability#yield',
          icon: Calculator,
          completed: false
        }
      ];
      return { title: 'DM Availability Workflow', tasks: dmTasks, route: location };
    }

    // FEED SUPPLEMENT WORKFLOW
    if (location.includes('feed-supplement')) {
      const feedTasks: Task[] = [
        {
          id: 'analyze-deficit',
          title: 'Analyze Nutritional Deficit',
          description: 'Compare needs vs supply',
          path: '/feed-supplement-calculator#deficit',
          icon: BarChart3,
          completed: false
        },
        {
          id: 'select-supplements',
          title: 'Select Supplements',
          description: 'Choose appropriate feeds',
          path: '/feed-supplement-calculator#select',
          icon: Package,
          completed: false
        },
        {
          id: 'calculate-cost',
          title: 'Calculate Feed Costs',
          description: 'Optimize for budget',
          path: '/feed-supplement-calculator#cost',
          icon: DollarSign,
          completed: false
        }
      ];
      return { title: 'Feed Supplement Workflow', tasks: feedTasks, route: location };
    }

    // PLANT IDENTIFICATION WORKFLOW
    if (location.includes('plant-identification')) {
      const plantTasks: Task[] = [
        {
          id: 'capture-photo',
          title: 'Capture Plant Photo',
          description: 'Take clear image',
          path: '/plant-identification#capture',
          icon: Camera,
          completed: false
        },
        {
          id: 'ai-analysis',
          title: 'AI Species Analysis',
          description: 'Get identification results',
          path: '/plant-identification#analysis',
          icon: Sparkles,
          completed: false
        },
        {
          id: 'save-library',
          title: 'Save to Library',
          description: 'Build personal database',
          path: '/plant-identification#library',
          icon: BookOpen,
          completed: false
        }
      ];
      return { title: 'Plant ID Workflow', tasks: plantTasks, route: location };
    }

    // NUTRITIONAL ANALYSIS WORKFLOW
    if (location.includes('nutritional-analysis')) {
      const nutritionTasks: Task[] = [
        {
          id: 'assess-quality',
          title: 'Assess Forage Quality',
          description: 'Evaluate protein and energy',
          path: '/nutritional-analysis#quality',
          icon: FlaskConical,
          completed: false
        },
        {
          id: 'match-requirements',
          title: 'Match Animal Requirements',
          description: 'Compare to livestock needs',
          path: '/nutritional-analysis#requirements',
          icon: Calculator,
          completed: false
        },
        {
          id: 'identify-gaps',
          title: 'Identify Nutritional Gaps',
          description: 'Find deficiencies',
          path: '/nutritional-analysis#gaps',
          icon: AlertTriangle,
          completed: false
        }
      ];
      return { title: 'Nutritional Analysis Workflow', tasks: nutritionTasks, route: location };
    }

    // PERFORMANCE ANALYTICS WORKFLOW
    if (location.includes('performance-analytics')) {
      const performTasks: Task[] = [
        {
          id: 'track-metrics',
          title: 'Track Key Metrics',
          description: 'Weight gain, production',
          path: '/performance-analytics#metrics',
          icon: TrendingUp,
          completed: false
        },
        {
          id: 'analyze-trends',
          title: 'Analyze Trends',
          description: 'Identify patterns',
          path: '/performance-analytics#trends',
          icon: LineChart,
          completed: false
        },
        {
          id: 'benchmark-performance',
          title: 'Benchmark Performance',
          description: 'Compare to standards',
          path: '/performance-analytics#benchmark',
          icon: Award,
          completed: false
        }
      ];
      return { title: 'Performance Analytics Workflow', tasks: performTasks, route: location };
    }

    // GPS LOCATION WORKFLOW
    if (location.includes('gps-location')) {
      const gpsTasks: Task[] = [
        {
          id: 'track-boundaries',
          title: 'Track Field Boundaries',
          description: 'Walk or drive perimeter',
          path: '/gps-location-tools#boundaries',
          icon: Navigation,
          completed: false
        },
        {
          id: 'calculate-area',
          title: 'Calculate Acreage',
          description: 'Get precise measurements',
          path: '/gps-location-tools#area',
          icon: Ruler,
          completed: false
        },
        {
          id: 'save-locations',
          title: 'Save Key Locations',
          description: 'Mark infrastructure points',
          path: '/gps-location-tools#save',
          icon: MapPin,
          completed: false
        }
      ];
      return { title: 'Paddock Mapping Workflow', tasks: gpsTasks, route: location };
    }

    // BRUSH HOG WORKFLOW
    if (location.includes('brush-hog')) {
      const brushTasks: Task[] = [
        {
          id: 'check-conditions',
          title: 'Check Field Conditions',
          description: 'Assess cutting needs',
          path: '/brush-hog-recommendations#conditions',
          icon: Eye,
          completed: false
        },
        {
          id: 'plan-schedule',
          title: 'Plan Cutting Schedule',
          description: 'Optimize timing',
          path: '/brush-hog-recommendations#schedule',
          icon: Calendar,
          completed: false
        },
        {
          id: 'track-maintenance',
          title: 'Track Maintenance',
          description: 'Log cutting history',
          path: '/brush-hog-recommendations#maintenance',
          icon: Wrench,
          completed: false
        }
      ];
      return { title: 'Brush Hog Workflow', tasks: brushTasks, route: location };
    }

    // ALERT SYSTEM WORKFLOW
    if (location.includes('alert-system')) {
      const alertTasks: Task[] = [
        {
          id: 'configure-alerts',
          title: 'Configure Alert Types',
          description: 'Set up notifications',
          path: '/alert-system#configure',
          icon: Settings,
          completed: false
        },
        {
          id: 'set-thresholds',
          title: 'Set Alert Thresholds',
          description: 'Define trigger points',
          path: '/alert-system#thresholds',
          icon: Bell,
          completed: false
        },
        {
          id: 'manage-notifications',
          title: 'Manage Notifications',
          description: 'Control delivery methods',
          path: '/alert-system#notifications',
          icon: Bell,
          completed: false
        }
      ];
      return { title: 'Alert System Workflow', tasks: alertTasks, route: location };
    }

    // FINANCIAL MANAGEMENT WORKFLOW
    if (location.includes('financial-management')) {
      const financeTasks: Task[] = [
        {
          id: 'track-expenses',
          title: 'Track Farm Expenses',
          description: 'Record all costs',
          path: '/financial-management#expenses',
          icon: Receipt,
          completed: false
        },
        {
          id: 'analyze-profitability',
          title: 'Analyze Profitability',
          description: 'Calculate margins',
          path: '/financial-management#profitability',
          icon: TrendingUp,
          completed: false
        },
        {
          id: 'plan-budget',
          title: 'Plan Budget',
          description: 'Forecast finances',
          path: '/financial-management#budget',
          icon: PiggyBank,
          completed: false
        }
      ];
      return { title: 'Financial Management Workflow', tasks: financeTasks, route: location };
    }

    // SOIL HEALTH WORKFLOW
    if (location.includes('soil-health')) {
      const soilTasks: Task[] = [
        {
          id: 'test-soil',
          title: 'Conduct Soil Tests',
          description: 'Analyze composition',
          path: '/soil-health-pasture-improvement#test',
          icon: TestTube,
          completed: false
        },
        {
          id: 'plan-improvements',
          title: 'Plan Improvements',
          description: 'Design interventions',
          path: '/soil-health-pasture-improvement#plan',
          icon: Sprout,
          completed: false
        },
        {
          id: 'track-progress',
          title: 'Track Progress',
          description: 'Monitor changes',
          path: '/soil-health-pasture-improvement#track',
          icon: LineChart,
          completed: false
        }
      ];
      return { title: 'Soil Health Workflow', tasks: soilTasks, route: location };
    }

    // INFRASTRUCTURE WORKFLOW
    if (location.includes('infrastructure')) {
      const infraTasks: Task[] = [
        {
          id: 'inventory-assets',
          title: 'Inventory Assets',
          description: 'Catalog equipment',
          path: '/infrastructure-equipment#inventory',
          icon: ClipboardList,
          completed: false
        },
        {
          id: 'schedule-maintenance',
          title: 'Schedule Maintenance',
          description: 'Plan service dates',
          path: '/infrastructure-equipment#maintenance',
          icon: Wrench,
          completed: false
        },
        {
          id: 'track-repairs',
          title: 'Track Repairs',
          description: 'Log service history',
          path: '/infrastructure-equipment#repairs',
          icon: Wrench,
          completed: false
        }
      ];
      return { title: 'Infrastructure Workflow', tasks: infraTasks, route: location };
    }

    // MARKET ANALYSIS WORKFLOW
    if (location.includes('market-analysis')) {
      const marketTasks: Task[] = [
        {
          id: 'check-prices',
          title: 'Check Market Prices',
          description: 'Review current rates',
          path: '/market-analysis#prices',
          icon: DollarSign,
          completed: false
        },
        {
          id: 'analyze-trends',
          title: 'Analyze Market Trends',
          description: 'Forecast movements',
          path: '/market-analysis#trends',
          icon: TrendingUp,
          completed: false
        },
        {
          id: 'find-buyers',
          title: 'Find Buyers',
          description: 'Connect with markets',
          path: '/market-analysis#buyers',
          icon: Handshake,
          completed: false
        }
      ];
      return { title: 'Market Analysis Workflow', tasks: marketTasks, route: location };
    }

    // EDUCATIONAL CONTENT WORKFLOW
    if (location.includes('educational-content')) {
      const educationTasks: Task[] = [
        {
          id: 'select-course',
          title: 'Select Learning Path',
          description: 'Choose your focus area',
          path: '/educational-content#courses',
          icon: GraduationCap,
          completed: false
        },
        {
          id: 'complete-modules',
          title: 'Complete Modules',
          description: 'Work through lessons',
          path: '/educational-content#modules',
          icon: BookOpen,
          completed: false
        },
        {
          id: 'apply-knowledge',
          title: 'Apply Knowledge',
          description: 'Implement on farm',
          path: '/educational-content#apply',
          icon: Lightbulb,
          completed: false
        }
      ];
      return { title: 'Education Workflow', tasks: educationTasks, route: location };
    }

    // SETUP WORKFLOW (ONBOARDING)
    if (location.includes('onboarding')) {
      const setupTasks: Task[] = [
        {
          id: 'select-tier',
          title: 'Choose Farm Tier',
          description: 'Select your operation size',
          path: '/onboarding#tier',
          icon: Award,
          completed: false
        },
        {
          id: 'farm-details',
          title: 'Enter Farm Details',
          description: 'Basic farm information',
          path: '/onboarding#details',
          icon: Navigation,
          completed: false
        },
        {
          id: 'complete-setup',
          title: 'Complete Setup',
          description: 'Finish initial configuration',
          path: '/onboarding#complete',
          icon: CheckCircle2,
          completed: false
        }
      ];
      return { title: 'Setup Workflow', tasks: setupTasks, route: location };
    }

    // SUBSCRIPTION WORKFLOW
    if (location.includes('subscription')) {
      const subscriptionTasks: Task[] = [
        {
          id: 'choose-plan',
          title: 'Choose Subscription Plan',
          description: 'Select pricing tier',
          path: '/subscription#plans',
          icon: DollarSign,
          completed: false
        },
        {
          id: 'payment-setup',
          title: 'Setup Payment',
          description: 'Configure billing',
          path: '/subscription#payment',
          icon: Receipt,
          completed: false
        },
        {
          id: 'activate-features',
          title: 'Activate Features',
          description: 'Enable paid features',
          path: '/subscription#features',
          icon: Sparkles,
          completed: false
        }
      ];
      return { title: 'Subscription Workflow', tasks: subscriptionTasks, route: location };
    }

    // SETTINGS WORKFLOW
    if (location.includes('settings')) {
      const settingsTasks: Task[] = [
        {
          id: 'profile-settings',
          title: 'Update Profile',
          description: 'Personal information',
          path: '/settings#profile',
          icon: Users,
          completed: false
        },
        {
          id: 'notification-settings',
          title: 'Configure Notifications',
          description: 'Alert preferences',
          path: '/settings#notifications',
          icon: Bell,
          completed: false
        },
        {
          id: 'data-management',
          title: 'Manage Data',
          description: 'Export/import options',
          path: '/settings#data',
          icon: ClipboardList,
          completed: false
        }
      ];
      return { title: 'Settings Workflow', tasks: settingsTasks, route: location };
    }

    // FARM PROFILE WORKFLOW
    if (location.includes('farm-profile')) {
      const profileTasks: Task[] = [
        {
          id: 'basic-info',
          title: 'Enter Basic Info',
          description: 'Farm name and location',
          path: '/farm-profile#basic',
          icon: MapPin,
          completed: false
        },
        {
          id: 'operation-details',
          title: 'Operation Details',
          description: 'Farm size and type',
          path: '/farm-profile#operation',
          icon: BarChart3,
          completed: false
        },
        {
          id: 'goals-setup',
          title: 'Set Goals',
          description: 'Define objectives',
          path: '/farm-profile#goals',
          icon: Award,
          completed: false
        }
      ];
      return { title: 'Farm Profile Workflow', tasks: profileTasks, route: location };
    }

    // PADDOCK MANAGEMENT WORKFLOW
    if (location.includes('paddock-management')) {
      const paddockTasks: Task[] = [
        {
          id: 'add-paddocks',
          title: 'Add Paddocks',
          description: 'Create field records',
          path: '/paddock-management#add',
          icon: MapPin,
          completed: hasPaddockData
        },
        {
          id: 'set-boundaries',
          title: 'Set Boundaries',
          description: 'Define field areas',
          path: '/paddock-management#boundaries',
          icon: Route,
          completed: false
        },
        {
          id: 'configure-features',
          title: 'Configure Features',
          description: 'Water, shelter, gates',
          path: '/paddock-management#features',
          icon: Wrench,
          completed: false
        }
      ];
      return { title: 'Paddock Management Workflow', tasks: paddockTasks, route: location };
    }

    // WATER SYSTEMS WORKFLOW
    if (location.includes('water-systems')) {
      const waterSystemTasks: Task[] = [
        {
          id: 'inventory-sources',
          title: 'Inventory Water Sources',
          description: 'Map wells, ponds, tanks',
          path: '/water-systems#inventory',
          icon: Droplets,
          completed: false
        },
        {
          id: 'check-capacity',
          title: 'Check System Capacity',
          description: 'Verify flow rates',
          path: '/water-systems#capacity',
          icon: BarChart3,
          completed: false
        },
        {
          id: 'plan-improvements',
          title: 'Plan Improvements',
          description: 'Upgrade recommendations',
          path: '/water-systems#improvements',
          icon: Wrench,
          completed: false
        }
      ];
      return { title: 'Water Systems Workflow', tasks: waterSystemTasks, route: location };
    }

    // PERFORMANCE OPTIMIZATION WORKFLOW
    if (location.includes('performance-optimization')) {
      const optimizationTasks: Task[] = [
        {
          id: 'analyze-performance',
          title: 'Analyze Current Performance',
          description: 'Review system metrics',
          path: '/performance-optimization#analyze',
          icon: BarChart3,
          completed: false
        },
        {
          id: 'identify-bottlenecks',
          title: 'Identify Bottlenecks',
          description: 'Find improvement areas',
          path: '/performance-optimization#bottlenecks',
          icon: AlertTriangle,
          completed: false
        },
        {
          id: 'implement-fixes',
          title: 'Implement Optimizations',
          description: 'Apply improvements',
          path: '/performance-optimization#implement',
          icon: Wrench,
          completed: false
        }
      ];
      return { title: 'Performance Optimization Workflow', tasks: optimizationTasks, route: location };
    }

    // DATA INTEGRATION WORKFLOW
    if (location.includes('data-integration-hub')) {
      const integrationTasks: Task[] = [
        {
          id: 'connect-sources',
          title: 'Connect Data Sources',
          description: 'Link external systems',
          path: '/data-integration-hub#connect',
          icon: Handshake,
          completed: false
        },
        {
          id: 'configure-sync',
          title: 'Configure Sync',
          description: 'Set up data flow',
          path: '/data-integration-hub#sync',
          icon: Clock,
          completed: false
        },
        {
          id: 'validate-data',
          title: 'Validate Data Quality',
          description: 'Ensure accuracy',
          path: '/data-integration-hub#validate',
          icon: Eye,
          completed: false
        }
      ];
      return { title: 'Data Integration Workflow', tasks: integrationTasks, route: location };
    }

    // DEFAULT WORKFLOW - Show daily workflow tasks for all other pages
    const defaultTasks: Task[] = [
      {
        id: 'check-weather',
        title: 'Check Weather',
        description: 'Review conditions and alerts',
        path: '/weather-integration',
        icon: Cloud,
        completed: getTaskProgress('weather').isComplete
      },
      {
        id: 'check-animals',
        title: 'Livestock Management',
        description: 'Review health and records',
        path: '/livestock-health-breeding',
        icon: Cat,
        completed: getTaskProgress('animals').isComplete
      },
      {
        id: 'assess-water',
        title: 'Assess Water',
        description: 'Verify water systems',
        path: '/water-requirements',
        icon: Droplets,
        completed: getTaskProgress('water').isComplete
      },
      {
        id: 'plan-moves',
        title: 'Plan Rotation',
        description: 'Schedule paddock moves',
        path: '/enhanced-grazing-calendar',
        icon: Calendar,
        completed: getTaskProgress('rotation').isComplete
      }
    ];
    
    return {
      title: getContextTitle(),
      tasks: defaultTasks,
      route: location
    };
  };

  // Update workflow context when location or data changes
  useEffect(() => {
    const context = getWorkflowContext();
    setCurrentContext(context);
    console.log('Cross-workflow context updated:', context.title, context.tasks.length, 'tasks');
  }, [location, paddocks, animals, assessments, getTaskProgress]);

  // Handle dismissal and restoration
  useEffect(() => {
    const dismissed = localStorage.getItem('cadence-workflow-dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('cadence-workflow-date');
    
    // Force reset dismissal for debugging
    console.log('WorkflowWidget: Checking dismissal state');
    const wasDismissed = localStorage.getItem('cadence-workflow-dismissed');
    console.log('WorkflowWidget: Was dismissed?', wasDismissed);
    
    if (lastCheck !== today || wasDismissed) {
      console.log('WorkflowWidget: Resetting dismissal state');
      localStorage.setItem('cadence-workflow-date', today);
      localStorage.removeItem('cadence-workflow-dismissed');
      setIsDismissed(false);
    }
  }, []);

  const handleTaskNavigate = (task: Task) => {
    console.log('Cross-workflow navigation:', task.title, 'at', task.path);
    
    // Handle hash navigation for specific sections
    if (task.path.includes('#')) {
      const [basePath, hash] = task.path.split('#');
      navigate(basePath);
      
      // After navigation, scroll to the specific section
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      navigate(task.path);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('cadence-workflow-dismissed', 'true');
  };

  const tasks = currentContext?.tasks || [];
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const allCompleted = completedTasks === totalTasks && totalTasks > 0;

  // Enhanced debugging for widget visibility
  console.log('WorkflowWidget Debug:');
  console.log('- isDismissed:', isDismissed);
  console.log('- currentContext:', currentContext?.title || 'null');
  console.log('- tasks.length:', tasks.length);
  console.log('- location:', location);
  
  // Don't show if dismissed, no context, or no tasks
  if (isDismissed || !currentContext || tasks.length === 0) {
    console.log('WorkflowWidget: Not rendering due to conditions above');
    return null;
  }

  console.log('WorkflowWidget: Rendering cross-workflow widget. Context:', currentContext.title, 'tasks:', tasks.length);

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 border-green-200 bg-white/95 backdrop-blur-sm z-50">
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            <div className="bg-green-100 p-1.5 rounded-full flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="text-sm font-medium text-gray-900 truncate leading-tight">
                {currentContext.title}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {completedTasks}/{totalTasks} done • Cross-workflow tracking
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
              title="Dismiss"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Progress bar showing cross-workflow completion */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 mx-0">
          <div 
            className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
          />
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="pt-0 px-3 pb-3">
          {allCompleted ? (
            <div className="text-center py-3">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">All done!</p>
              <p className="text-xs text-gray-600">{currentContext.title} complete</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const IconComponent = task.icon;
                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskNavigate(task)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left min-w-0"
                  >
                    <div className={`p-1.5 rounded-full ${task.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {task.completed ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <IconComponent className="h-3 w-3 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className={`text-sm font-medium truncate leading-tight ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {task.description}
                        </div>
                      )}
                    </div>
                    {!task.completed && (
                      <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}