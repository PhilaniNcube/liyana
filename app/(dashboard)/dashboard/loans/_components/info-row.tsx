import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function InfoRow({ label, value, className }: Props) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
