import PoliciesDataTable from "@/components/policies-data-table";
import { getFuneralActivePolicies } from "@/lib/queries/policies";
import React from "react";

const ActiveFuneralPolicyPage = async () => {
  // fetch funeral policies
  const funeralPolicies = await getFuneralActivePolicies();

  console.log(funeralPolicies);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Active Funeral Insurance Policies
      </h1>
      <PoliciesDataTable
        data={funeralPolicies}
        exportFilters={{ productType: "funeral_policy", status: "active" }}
      />
    </div>
  );
};

export default ActiveFuneralPolicyPage;
