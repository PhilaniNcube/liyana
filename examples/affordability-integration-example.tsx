/**
 * Example: How to integrate the enhanced affordability view
 * into the application detail client component
 */

import React from "react";
import { EnhancedAffordabilityView } from "@/components/enhanced-affordability-view";

// This shows how you would use the component in your application detail client
export function ExampleAffordabilityIntegration({
  application,
}: {
  application: any;
}) {
  return (
    <div className="space-y-6">
      {/* Other application details... */}

      {/* Enhanced Affordability Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Financial Affordability Assessment
        </h3>
        <EnhancedAffordabilityView
          monthlyIncome={application.monthly_income || 0}
          affordabilityData={application.affordability}
          showBreakdown={true}
        />
      </div>

      {/* Other sections... */}
    </div>
  );
}

// Alternative: Add it as a new tab in the existing tabs structure
export function TabIntegrationExample() {
  return (
    <>
      {/* Add this to your existing TabsList */}
      {/* <TabsTrigger value="affordability">Affordability</TabsTrigger> */}

      {/* Add this as a new TabsContent */}
      {/* 
      <TabsContent value="affordability">
        <EnhancedAffordabilityView
          monthlyIncome={application.monthly_income || 0}
          affordabilityData={application.affordability}
          showBreakdown={true}
        />
      </TabsContent>
      */}
    </>
  );
}

// You can also use the calculation utility directly for other purposes
import {
  calculateAffordability,
  formatAffordabilityCalculation,
} from "@/lib/utils/affordability-calculator";

export function useAffordabilityCalculation(application: any) {
  const calculation = calculateAffordability(
    application.monthly_income || 0,
    application.affordability
  );

  const formatted = formatAffordabilityCalculation(calculation);

  return {
    raw: calculation,
    formatted,
    isAffordable: calculation.disposableIncome > 0,
    affordabilityRating:
      calculation.disposableIncome > 3000
        ? "good"
        : calculation.disposableIncome > 1000
          ? "moderate"
          : "poor",
  };
}
