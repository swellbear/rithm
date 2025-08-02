import HealthMonitor from '@/components/HealthMonitor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function HealthPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Back Button */}
      <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Platform
            </Button>
          </Link>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-lg font-semibold">System Health Monitor</h1>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <HealthMonitor />
      </div>
    </div>
  );
}