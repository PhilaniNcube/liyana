"use client";

import { EmailLoan } from "@/components/email-loan";
import { EmailHistory } from "@/components/email-history";
import type { EmailWithDetails } from "@/lib/queries/emails";

interface LoanEmailTabProps {
  loanId: number;
  borrowerEmail?: string;
  borrowerName?: string;
  emailHistory: EmailWithDetails[];
}

const LoanEmailTab = ({
  loanId,
  borrowerEmail,
  borrowerName,
  emailHistory,
}: LoanEmailTabProps) => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      <EmailLoan
        id={loanId}
        creditReports={[]}
        borrowerName={borrowerName}
        borrowerEmail={borrowerEmail}
      />

      <EmailHistory emails={emailHistory} />
    </div>
  );
};

export default LoanEmailTab;
