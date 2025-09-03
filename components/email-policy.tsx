"use client";

import { EmailApplicationComponent } from "./email-application-component";

interface CreditReport {
  id: string;
  check_type: string;
  status: string;
  created_at: string;
  report_data?: any;
}

interface EmailPolicyProps {
  id: number | string;
  creditReports?: CreditReport[];
  policyHolderName?: string;
  policyHolderEmail?: string;
}

export function EmailPolicy({
  id,
  creditReports = [],
  policyHolderName,
  policyHolderEmail,
}: EmailPolicyProps) {
  return (
    <EmailApplicationComponent
      id={id}
      creditReports={creditReports}
      type="policy"
      recipientName={policyHolderName}
      recipientEmail={policyHolderEmail}
    />
  );
}
