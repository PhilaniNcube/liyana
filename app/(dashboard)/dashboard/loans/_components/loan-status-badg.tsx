import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  status?: string;
  className?: string;
};

const STATUS_STYLES: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  closed:
    "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50",
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  defaulted: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
};

export function LoanStatusBadge({ status = "active", className }: Props) {
  const key = status?.toLowerCase?.() ?? "active";
  const style =
    STATUS_STYLES[key] ??
    "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50";
  return <Badge className={cn("capitalize", style, className)}>{status}</Badge>;
}
