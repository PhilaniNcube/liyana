import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { type ComponentType } from "react";

type Props = {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  progress?: number;
  className?: string;
};

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
  progress,
  className,
}: Props) {
  return (
    <div
      className={cn("flex items-start gap-3 rounded-lg border p-4", className)}
    >
      {Icon ? <Icon className="mt-1 h-5 w-5 text-muted-foreground" /> : null}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="truncate text-xl font-semibold">{value}</div>
        {hint ? (
          <div className="text-xs text-muted-foreground">{hint}</div>
        ) : null}
        {typeof progress === "number" ? (
          <div className="mt-2">
            <Progress
              aria-label="progress"
              value={Math.max(0, Math.min(100, progress))}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
