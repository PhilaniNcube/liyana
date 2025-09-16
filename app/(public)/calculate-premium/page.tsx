import React from "react";
import FuneralPremiumCalculatorDialog from "../insurance/funeral/_components/funeral-premium-calculator-dialog";

const page = () => {
  return (
    <div>
      <div className="bg-gray-100 py-12 h-[calc(100vh-6rem)] flex flex-col justify-center">
        <div className="space-y-4 flex flex-col items-center justify-center text-center px-4">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get comprehensive funeral cover for you and your family. Calculate
            your premium first to see what your monthly costs would be.
          </p>
          <FuneralPremiumCalculatorDialog />
        </div>
      </div>
    </div>
  );
};

export default page;
