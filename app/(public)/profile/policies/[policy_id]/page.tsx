import {
  getPolicyByPolicyId,
  getPolicyBeneficiaries,
} from "@/lib/queries/policies";
import { getPolicyClaims } from "@/lib/queries/policy-details";
import PolicyDetail from "@/components/policy-detail";
import React from "react";

type PageProps = {
  params: Promise<{
    policy_id: number;
  }>;
};

const PolicyPage = async ({ params }: PageProps) => {
  const { policy_id } = await params;

  try {
    const [policy, claims, beneficiaries] = await Promise.all([
      getPolicyByPolicyId(policy_id),
      getPolicyClaims(policy_id),
      getPolicyBeneficiaries(policy_id),
    ]);

    if (!policy) {
      return (
        <div className="container mx-auto py-4 max-w-7xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Policy Not Found
            </h1>
            <p className="mt-2 text-gray-600">
              The requested policy could not be found.
            </p>
          </div>
        </div>
      );
    }

    return (
      <PolicyDetail
        policy={policy}
        claims={claims}
        beneficiaries={beneficiaries}
      />
    );
  } catch (error) {
    return (
      <div className="container mx-auto py-4 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You are not authorized to view this policy.
          </p>
        </div>
      </div>
    );
  }
};

export default PolicyPage;
