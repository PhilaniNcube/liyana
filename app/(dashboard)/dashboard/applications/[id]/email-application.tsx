"use client";

import { EmailApplication } from "@/components/email-application";

interface CreditReport {
  id: string;
  check_type: string;
  status: string;
  created_at: string;
  report_data?: any;
}

interface EmailApplicationWrapperProps {
  id: number;
  creditReports: CreditReport[];
  applicantName?: string;
  applicantEmail?: string;
}

const EmailApplicationWrapper = ({
  id,
  creditReports,
  applicantName,
  applicantEmail,
}: EmailApplicationWrapperProps) => {
  return (
    <EmailApplication
      id={id.toString()}
      creditReports={creditReports}
      applicantName={applicantName}
      applicantEmail={applicantEmail}
    />
  );
};

export default EmailApplicationWrapper;
