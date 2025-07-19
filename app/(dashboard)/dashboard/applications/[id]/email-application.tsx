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
}

const EmailApplicationWrapper = ({
  id,
  creditReports,
}: EmailApplicationWrapperProps) => {
  return (
    <EmailApplication
      applicationId={id.toString()}
      creditReports={creditReports}
    />
  );
};

export default EmailApplicationWrapper;
