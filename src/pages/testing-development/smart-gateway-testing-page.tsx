// Smart Gateway Testing Page - Development Tool

import { SimpleHeader } from "@/components/simple-header";
import { SmartGatewayTestRunner } from "@/components/smart-gateway-test-runner";

export default function SmartGatewayTestingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SimpleHeader />
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <SmartGatewayTestRunner />
      </div>
    </div>
  );
}