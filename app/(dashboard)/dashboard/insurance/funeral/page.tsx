import PoliciesDataTable from "@/components/policies-data-table";
import { getFuneralPolicies } from "@/lib/queries/policies";
import React from "react";

const FuneralPolicyPage = async () => {
  // fetch funeral policies
  const funeralPolicies = await getFuneralPolicies();

  console.log(funeralPolicies);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Funeral Insurance Policies</h1>
      <PoliciesDataTable
        data={funeralPolicies}
        exportFilters={{ productType: "funeral_policy" }}
      />
    </div>
  );
};

export default FuneralPolicyPage;
