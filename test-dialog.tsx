import React from "react";
import FuneralPremiumCalculatorDialog from "./app/(public)/insurance/funeral/_components/funeral-premium-calculator-dialog";

// Simple test component to verify the dialog works
export default function TestDialog() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Test Funeral Premium Calculator Dialog
      </h1>
      <FuneralPremiumCalculatorDialog />
    </div>
  );
}
