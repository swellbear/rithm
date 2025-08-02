import { useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipData {
  buttonId: string;
  title: string;
  description: string;
  outcome: string;
  timeEstimate: string;
}

const tooltipData: TooltipData[] = [
  {
    buttonId: 'check-animals-button',
    title: 'Daily Animal Health Check',
    description: 'Monitor livestock health, track breeding schedules, and receive weather-based care recommendations.',
    outcome: 'Prevent health issues, reduce mortality by 30%',
    timeEstimate: '10-15 minutes'
  },
  {
    buttonId: 'walk-pastures-button',
    title: 'Scientific Pasture Assessment',
    description: 'Use step-point methodology to measure grass height, species composition, and grazing readiness.',
    outcome: 'Optimize carrying capacity, extend grazing season by 2-4 weeks',
    timeEstimate: '20-30 minutes per paddock'
  },
  {
    buttonId: 'plan-rotation-button',
    title: 'AI-Powered Rotation Planning',
    description: 'Get intelligent recommendations for moving livestock based on pasture recovery and weather forecasts.',
    outcome: 'Increase pasture productivity by 40%, reduce feed costs',
    timeEstimate: '5-10 minutes'
  },
  {
    buttonId: 'check-weather-button',
    title: 'Agricultural Weather Intelligence',
    description: 'View heat stress warnings, grazing conditions, and 7-day agricultural forecasts.',
    outcome: 'Prevent 80% of weather-related issues',
    timeEstimate: '2-3 minutes'
  },
  {
    buttonId: 'record-data-button',
    title: 'Quick Data Recording',
    description: 'Log weights, breeding events, health treatments, and pasture conditions.',
    outcome: 'Build valuable historical data for better decisions',
    timeEstimate: '5-10 minutes'
  },
  {
    buttonId: 'review-performance-button',
    title: 'Performance Analytics',
    description: 'Track weight gains, feed efficiency, and financial performance with trend analysis.',
    outcome: 'Identify profit opportunities worth $2,500-15,000 annually',
    timeEstimate: '10-15 minutes'
  }
];

export function SmartGatewayTooltips() {
  useEffect(() => {
    // Add help icons to each gateway button
    tooltipData.forEach((tooltip) => {
      const button = document.getElementById(tooltip.buttonId);
      if (button && !button.querySelector('.gateway-help-icon')) {
        const helpIcon = document.createElement('div');
        helpIcon.className = 'gateway-help-icon absolute top-2 right-2 z-10';
        helpIcon.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 hover:text-gray-600 cursor-help">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <path d="M12 17h.01"></path>
          </svg>
        `;
        
        // Add tooltip on hover
        helpIcon.setAttribute('title', `${tooltip.title}\n\n${tooltip.description}\n\n🎯 ${tooltip.outcome}\n⏱️ ${tooltip.timeEstimate}`);
        button.appendChild(helpIcon);
        
        // Prevent click propagation
        helpIcon.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    });
  }, []);

  return null;
}