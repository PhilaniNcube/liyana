import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard } from "lucide-react";

interface Application {
  application_amount: number | null;
  term: number;
  loan_purpose: string | null;
  loan_purpose_reason: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_holder: string | null;
  branch_code: string | null;
  bank_account_number: string | null;
}

interface LoanBankingInfoCardProps {
  application: Application;
}

export function LoanBankingInfoCard({ application }: LoanBankingInfoCardProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Loan & Banking Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Loan Amount
            </p>
            <p className="text-sm font-semibold">
              {formatCurrency(application.application_amount)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Loan Term
            </p>
            <p className="text-sm">{application.term} days</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Loan Purpose
          </p>
          <p className="text-sm">{application.loan_purpose || "N/A"}</p>
        </div>
        {application.loan_purpose_reason && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Loan Purpose Reason
            </p>
            <p className="text-sm">{application.loan_purpose_reason}</p>
          </div>
        )}
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Bank Name
            </p>
            <p className="text-sm">{application.bank_name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Account Type
            </p>
            <p className="text-sm">{application.bank_account_type || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Account Holder
            </p>
            <p className="text-sm">
              {application.bank_account_holder || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Branch Code
            </p>
            <p className="text-sm">{application.branch_code || "N/A"}</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Account Number
          </p>
          <p className="text-sm">{application.bank_account_number || "N/A"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
