import { getCompletePolicyData } from "@/lib/queries/policy-details";
import { getEmailsForPolicyWithDetails } from "@/lib/queries/emails";
import React from "react";
import PolicyTabs from "./_components/policy-tabs";

type PolicyPageProps = {
  params: Promise<{
    id: number;
  }>;
};

const PolicyPage = async ({ params }: PolicyPageProps) => {
  const { id } = await params;

  const [policyData, emailHistory] = await Promise.all([
    getCompletePolicyData(id),
    getEmailsForPolicyWithDetails(id),
  ]);

  if (!policyData) {
    return <div className="text-red-500">Policy not found</div>;
  }

  return <PolicyTabs policyData={policyData} emailHistory={emailHistory} />;
};

export default PolicyPage;
