"use client";

import { EmailPolicy } from "@/components/email-policy";
import type { Database } from "@/lib/database.types";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

interface PolicyEmailTabProps {
  policyId: number;
  policyHolderEmail: string;
  policyHolderName: string;
  documents: PolicyDocumentRow[];
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
