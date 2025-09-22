import PoliciesDataTable from "@/components/policies-data-table";
import { getFuneralPendingPolicies } from "@/lib/queries/policies";
import React from "react";

const PendingFuneralPolicyPage = async () => {
  // fetch funeral policies
  const funeralPolicies = await getFuneralPendingPolicies();

  console.log(funeralPolicies);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Pending Funeral Insurance Policies
      </h1>
      <PoliciesDataTable
        data={funeralPolicies}
        exportFilters={{ productType: "funeral_policy", status: "pending" }}
      />
    </div>
  );
};

export default PendingFuneralPolicyPage;
