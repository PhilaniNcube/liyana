"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import {
  ApplicationProgress,
  getCurrentApplicationStep,
  type ApplicationStep,
} from "@/components/application-progress";
import { cn } from "@/lib/utils";

// Create context for step change functionality
const ApplicationStepContext = createContext<{
  onStepChange: (step: ApplicationStep) => void;
} | null>(null);

export const useApplicationStep = () => {
  const context = useContext(ApplicationStepContext);
  if (!context) {
    return {
      onStepChange: () => {}, // No-op function if not in context
    };
  }
  return context;
};

interface ApplicationLayoutProps {
  children: React.ReactNode;
  className?: string;
  currentStep?: ApplicationStep;
  showProgress?: boolean;
  onStepChange?: (step: ApplicationStep) => void;
}

export function ApplicationLayout({
  children,
  className,
  currentStep: propCurrentStep,
  showProgress = true,
  onStepChange: propOnStepChange,
}: ApplicationLayoutProps) {
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<ApplicationStep>(
    propCurrentStep || getCurrentApplicationStep(pathname)
  );

  // Update step based on pathname changes
  useEffect(() => {
    if (!propCurrentStep) {
      setCurrentStep(getCurrentApplicationStep(pathname));
    }
  }, [pathname, propCurrentStep]);

  // Use prop step if provided, otherwise use calculated step
  const activeStep = propCurrentStep || currentStep;

  const handleStepChange = (step: ApplicationStep) => {
    if (!propCurrentStep) {
      setCurrentStep(step);
    }
    // Call the prop callback if provided
    propOnStepChange?.(step);
  };
  return (
    <ApplicationStepContext.Provider value={{ onStepChange: handleStepChange }}>
      <div className={cn("w-full space-y-6", className)}>
        {/* Progress Bar - shown on application flow pages */}
        {showProgress && activeStep !== "complete" && (
          <div className="w-full max-w-2xl mx-auto">
            <ApplicationProgress currentStep={activeStep} />
          </div>
        )}

        {/* Page Content */}
        <div className="w-full">{children}</div>
      </div>
    </ApplicationStepContext.Provider>
  );
}
