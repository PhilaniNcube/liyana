"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ApplicationStep =
  | "personal-info"
  | "employment-loan"
  | "documents"
  | "complete";

interface ApplicationProgressProps {
  currentStep: ApplicationStep;
  className?: string;
}

const STEPS = [
  {
    id: "personal-info" as const,
    title: "Personal Information",
    description: "Tell us about yourself",
  },
  {
    id: "employment-loan" as const,
    title: "Employment & Loan Details",
    description: "Employment and loan information",
  },
  {
    id: "documents" as const,
    title: "Document Upload",
    description: "Upload required documents",
  },
  {
    id: "complete" as const,
    title: "Complete",
    description: "Application submitted",
  },
] as const;

export function ApplicationProgress({
  currentStep,
  className,
}: ApplicationProgressProps) {
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="w-full" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center space-y-1 text-center flex-1",
                index < STEPS.length - 1 && "border-r border-border pr-2"
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isCompleted && "bg-green-100 text-green-700",
                  isCurrent && "bg-primary text-primary-foreground",
                  isUpcoming && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Title */}
              <div className="space-y-0.5">
                <p
                  className={cn(
                    "text-xs font-medium",
                    isCurrent && "text-foreground",
                    (isCompleted || isUpcoming) && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to determine current step based on URL or application state
export function getCurrentApplicationStep(
  pathname: string,
  applicationStatus?: string
): ApplicationStep {
  if (pathname.includes("/profile/") && !pathname.endsWith("/profile")) {
    // Document upload page
    return "documents";
  }

  if (
    applicationStatus === "complete" ||
    applicationStatus === "under_review"
  ) {
    return "complete";
  }

  // Default to the form steps (this will be managed by the form component)
  return "personal-info";
}
