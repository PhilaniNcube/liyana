"use client";

import { EmailPolicy } from "@/components/email-policy";

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
  return (
    <div className="w-full mx-auto">
      <EmailPolicy
        id={policyId}
        creditReports={[]}
        policyHolderName={policyHolderName}
        policyHolderEmail={policyHolderEmail}
      />
    </div>
  );
};

export default PolicyEmailTab;
