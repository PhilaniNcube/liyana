"use client";

import { EmailApplicationComponent } from "./email-application-component";

interface CreditReport {
  id: string;
  check_type: string;
  status: string;
  created_at: string;
  report_data?: any;
}

interface EmailLoanProps {
  id: number | string;
  creditReports?: CreditReport[];
  borrowerName?: string;
  borrowerEmail?: string;
}

export function EmailLoan({
  id,
  creditReports = [],
  borrowerName,
  borrowerEmail,
}: EmailLoanProps) {
  return (
    <EmailApplicationComponent
      id={id}
      creditReports={creditReports}
      type="loan"
      recipientName={borrowerName}
      recipientEmail={borrowerEmail}
    />
  );
}
