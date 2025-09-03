"use client";

import { EmailLoan } from "@/components/email-loan";

interface LoanEmailTabProps {
  loanId: number;
  borrowerEmail?: string;
  borrowerName?: string;
}

const LoanEmailTab = ({
  loanId,
  borrowerEmail,
  borrowerName,
}: LoanEmailTabProps) => {
  return (
    <div className="w-full mx-auto">
      <EmailLoan
        id={loanId}
        creditReports={[]}
        borrowerName={borrowerName}
        borrowerEmail={borrowerEmail}
      />
    </div>
  );
};

export default LoanEmailTab;
