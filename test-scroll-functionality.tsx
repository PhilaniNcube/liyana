import React from "react";
import FuneralPremiumCalculatorDialog from "./app/(public)/insurance/funeral/_components/funeral-premium-calculator-dialog";

// Test component to verify the scroll-to-results functionality
export default function TestScrollFunctionality() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">
        Test Scroll to Results Functionality
      </h1>

      <div className="space-y-4">
        <p>
          This test verifies that when you click "Calculate Premium" in the
          dialog:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>✅ The calculator processes the form</li>
          <li>✅ Shows the premium results</li>
          <li>✅ Automatically scrolls to the results section</li>
          <li>✅ Also scrolls to errors if calculation fails</li>
        </ul>
      </div>

      <div className="border p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How to Test:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click the "Calculate Premium" button below</li>
          <li>Fill in your age (e.g., 35) and cover amount (e.g., 50000)</li>
          <li>Optionally add family members</li>
          <li>Click "Calculate Premium" in the form</li>
          <li>Watch as it automatically scrolls to show the results</li>
        </ol>
      </div>

      <FuneralPremiumCalculatorDialog />

      <div className="mt-16 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Technical Implementation:</h3>
        <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
          <li>Uses React useRef to reference the results section</li>
          <li>scrollIntoView with smooth behavior on successful calculation</li>
          <li>100ms delay to allow DOM updates before scrolling</li>
          <li>Scrolls to both success results and error messages</li>
        </ul>
      </div>
    </div>
  );
}
