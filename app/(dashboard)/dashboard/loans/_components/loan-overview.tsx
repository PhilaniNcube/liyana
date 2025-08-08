import { CalendarDays, DollarSign, Percent, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoanStatusBadge } from "./loan-status-badg";
import { Stat } from "./stat";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import { InfoRow } from "./info-row";

type Props = {
  loan: Database["public"]["Tables"]["approved_loans"]["Row"];
};

export function LoanOverview({ loan }: Props) {
  const {
    id,
    application_id,
    status,
    approved_date,
    next_payment_date,
    monthly_payment,
    interest_rate,
    loan_term_days,
    total_repayment_amount,
    initiation_fee,
    service_fee,
    profile_id,
    created_at,
    updated_at,
  } = loan;

  const approved = new Date(approved_date);
  const nextPayment = next_payment_date ? new Date(next_payment_date) : null;
  let progress;
  let daysElapsed;
  const daysTotal = loan_term_days;

  if (approved) {
    const now = new Date();
    const timeDiff = now.getTime() - approved.getTime();
    daysElapsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    progress = Math.min(daysElapsed / daysTotal, 1);
  } else {
    daysElapsed = 0;
    progress = 0;
  }

  const numberOfPayments = Math.ceil(daysTotal / 30); // Assuming monthly payments

  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{`Loan #${id}`}</div>
          <div className="text-lg font-medium">{`Application ID: ${application_id}`}</div>
        </div>
        <LoanStatusBadge status={status} />
      </div>

      {/* Key stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={DollarSign}
          label="Monthly payment"
          value={formatCurrency(monthly_payment)}
          hint={`${numberOfPayments} installments`}
        />
        <Stat
          icon={Percent}
          label="Interest rate (APR)"
          value={`${interest_rate.toFixed(2)}%`}
          hint="Fixed"
        />
        <Stat
          icon={Clock}
          label="Term"
          value={`${loan_term_days} days`}
          hint={`${clamp(daysElapsed, 0, daysTotal)} of ${daysTotal} days`}
          progress={progress}
        />
        <Stat
          icon={CalendarDays}
          label="Next payment"
          value={nextPayment ? formatDate(nextPayment, "PP") : "Not set"}
          hint={nextPayment ? "Scheduled" : "Auto-calculated by schedule"}
        />
      </div>

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total repayment</div>
            <div className="text-xl font-semibold">
              {formatCurrency(total_repayment_amount)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Initiation fee</div>
            <div className="text-xl font-semibold">
              {formatCurrency(initiation_fee)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Service fee</div>
            <div className="text-xl font-semibold">
              {formatCurrency(service_fee)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Schedule */}
      <section className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-medium">Payment Schedule</h2>
          <div className="text-xs text-muted-foreground">
            {`${numberOfPayments} payments, starting ${formatDate(new Date(approved.getFullYear(), approved.getMonth() + 1, approved.getDate()), "PP")}`}
          </div>
        </header>
      </section>

      <Separator />

      {/* Details */}
      <section className="space-y-3">
        <h3 className="text-base font-medium">Details</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Profile ID" value={profile_id} />
          <InfoRow label="Approved date" value={formatDate(approved, "PP")} />
          <InfoRow
            label="Created at"
            value={created_at ? formatDate(new Date(created_at), "PP") : "—"}
          />
          <InfoRow
            label="Updated at"
            value={updated_at ? formatDate(new Date(updated_at), "PP") : "—"}
          />
          <InfoRow label="Status" value={<LoanStatusBadge status={status} />} />
          <InfoRow label="Loan ID" value={`#${id}`} />
        </div>
      </section>
    </div>
  );
}
