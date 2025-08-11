import { getPolicyById } from "@/lib/queries/policies";
import PolicyDetail from "@/components/policy-detail";
import React from "react";

type PolicyPageProps = {
  params: Promise<{
    id: number;
  }>;
};

const PolicyPage = async ({ params }: PolicyPageProps) => {
  const { id } = await params;

  const policy = await getPolicyById(id);

  if (!policy) {
    return <div className="text-red-500">Policy not found</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Policy Details</h1>
      <PolicyDetail policy={policy} />
    </div>
  );
};

export default PolicyPage;
