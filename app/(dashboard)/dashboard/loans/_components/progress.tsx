import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      {...props}
    >
      <div
        className="h-full w-full flex-1 rounded-full bg-emerald-600 transition-all dark:bg-emerald-500"
        style={{
          transform: `translateX(${Math.max(-100, Math.min(0, value - 100))}%)`,
        }}
      />
      <span className="sr-only">{`Progress: ${value}%`}</span>
    </div>
  )
);
Progress.displayName = "Progress";
