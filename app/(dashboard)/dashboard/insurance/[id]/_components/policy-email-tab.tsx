"use client";

import { EmailHistory } from "@/components/email-history-new";
import { EmailPolicy } from "@/components/email-policy";
import type { Database } from "@/lib/database.types";
import type { EmailWithDetails } from "@/lib/queries/emails";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

interface PolicyEmailTabProps {
  policyId: number;
  policyHolderEmail: string;
  policyHolderName: string;
  documents: PolicyDocumentRow[];
  emailHistory: EmailWithDetails[];
}

const PolicyEmailTab = ({
  policyId,
  policyHolderEmail,
  policyHolderName,
  documents,
  emailHistory,
}: PolicyEmailTabProps) => {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5 mx-auto space-y-6">
      <EmailPolicy
        id={policyId}
        creditReports={[]}
        policyHolderName={policyHolderName}
        policyHolderEmail={policyHolderEmail}
      />

      <EmailHistory emails={emailHistory} />
    </div>
  );
};

export default PolicyEmailTab;
