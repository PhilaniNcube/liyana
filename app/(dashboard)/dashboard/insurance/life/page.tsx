import { getLifeInsurancePolicies } from "@/lib/queries/policies";
import PoliciesDataTable from "@/components/policies-data-table";
import React from "react";

const LifeInsuranceDashboardPage = async () => {
  // fetch life insurance policies
  const lifeInsurancePolicies = await getLifeInsurancePolicies();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Life Insurance Policies</h1>
      <PoliciesDataTable data={lifeInsurancePolicies} />
    </div>
  );
};

export default LifeInsuranceDashboardPage;
