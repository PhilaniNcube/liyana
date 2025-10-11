import { CalendarDays, DollarSign, Percent, Clock, CoinsIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoanStatusBadge } from "./loan-status-badg";
import { Stat } from "./stat";
import { formatCurrency } from "@/lib/utils/format-currency";
import { PaydayLoanCalculator } from "@/lib/utils/loancalculator";
import { formatDate } from "date-fns";
import { InfoRow } from "./info-row";
import { Database } from "@/lib/types";
import { EditableStat } from "./editable-stat";

type LoanWithApplication =
  Database["public"]["Tables"]["approved_loans"]["Row"] & {
    application: Database["public"]["Tables"]["applications"]["Row"];
  };

type Props = {
  loan: LoanWithApplication;
  onAmountChange: (newAmount: number) => void;
  onTermChange: (newTerm: number) => void;
  isPending: boolean;
};

export function LoanOverview({ loan, onAmountChange, onTermChange, isPending }: Props) {
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
    approved_loan_amount,
    application,
  } = loan;

  const approved = new Date(approved_date);
  const nextPayment = next_payment_date ? new Date(next_payment_date) : null;

  // Use PaydayLoanCalculator for headline figures
  const calculator = new PaydayLoanCalculator({
    principal: approved_loan_amount ?? 0,
    termInDays: loan_term_days,
    loanStartDate: approved,
    interestRate: interest_rate / 100, // assuming interest_rate is in percent
    salaryDay: application.salary_date ? application.salary_date : undefined,
  });

  const totalRepayment = calculator.getTotalRepayment();
  const totalInterestAmount = calculator.getTotalInterest();
  const initiationFee = calculator.getInitiationFee();
  const serviceFee = calculator.getServiceFeeForTerm();
  const monthlyPayment = calculator.getMonthlyRepayment();
  const numberOfPayments = calculator.getNumberOfRepayments();
  const scheduleDates = calculator.getPaymentScheduleDates();
  const payments = scheduleDates.map((date, idx) => {
    const isLast = idx === scheduleDates.length - 1;
    const amount = isLast
      ? totalRepayment - monthlyPayment * (scheduleDates.length - 1)
      : monthlyPayment;
    return { date, amount: Math.max(0, amount) };
  });

  // Progress calculation
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <EditableStat
          icon={CoinsIcon}
          label="Loan Amount"
          value={approved_loan_amount ?? 0}
          displayValue={formatCurrency(approved_loan_amount ?? 0)}
          hint={`${numberOfPayments} installments`}
          onSave={onAmountChange}
          isPending={isPending}
        />
        <Stat
          icon={CoinsIcon}
          label="Monthly payment"
          value={formatCurrency(monthlyPayment)}
          hint={`${numberOfPayments} installments`}
        />
        <Stat
          icon={Percent}
          label="Interest rate (APR)"
          value={`${interest_rate.toFixed(2)}%`}
          hint="Fixed"
        />
        <EditableStat
          icon={Clock}
          label="Term"
          value={loan_term_days}
          displayValue={`${loan_term_days} days`}
          hint={`${clamp(daysElapsed, 0, daysTotal)} of ${daysTotal} days`}
          onSave={onTermChange}
          isPending={isPending}
        />
        <Stat
          icon={CalendarDays}
          label="Next payment"
          value={nextPayment ? formatDate(nextPayment, "PP") : "Not set"}
          hint={nextPayment ? "Scheduled" : "Auto-calculated by schedule"}
        />
      </div>

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total repayment</div>
            <div className="text-xl font-semibold">
              {formatCurrency(totalRepayment)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total interest</div>
            <div className="text-xl font-semibold">
              {formatCurrency(totalInterestAmount)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Initiation fee</div>
            <div className="text-xl font-semibold">
              {formatCurrency(initiationFee)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Service fee</div>
            <div className="text-xl font-semibold">
              {formatCurrency(serviceFee)}
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
            {`${numberOfPayments} payments${payments.length ? `, starting ${formatDate(payments[0].date, "PP")}` : ""}`}
          </div>
        </header>
        {payments.length ? (
          <div className="rounded-md border">
            <div className="divide-y">
              {payments.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <div className="text-muted-foreground">
                    {formatDate(p.date, "PP")}
                  </div>
                  <div className="font-medium">{formatCurrency(p.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No scheduled payments
          </div>
        )}
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
