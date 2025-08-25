"use client";

import { EmailApplication } from "@/components/email-application";

interface PolicyDocument {
  id: number;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface PolicyEmailTabProps {
  policyId: number;
  policyHolderEmail: string;
  policyHolderName: string;
  documents: PolicyDocument[];
}

const PolicyEmailTab = ({
  policyId,
  policyHolderEmail,
  policyHolderName,
  documents,
}: PolicyEmailTabProps) => {
  // For now, we pass empty creditReports as this is not a loan application
  // and allow file uploads via EmailApplication
  return (
    <div className="max-w-2xl mx-auto">
      <EmailApplication id={policyId} creditReports={[]} />
    </div>
  );
};

export default PolicyEmailTab;
