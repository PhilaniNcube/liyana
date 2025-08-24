import PoliciesDataTable from "@/components/policies-data-table";
import { getFuneralDeclinedPolicies } from "@/lib/queries/policies";
import React from "react";

const DeclinedFuneralPolicyPage = async () => {
  // fetch funeral policies
  const funeralPolicies = await getFuneralDeclinedPolicies();

  console.log(funeralPolicies);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Declined Funeral Insurance Policies
      </h1>
      <PoliciesDataTable data={funeralPolicies} />
    </div>
  );
};

export default DeclinedFuneralPolicyPage;
