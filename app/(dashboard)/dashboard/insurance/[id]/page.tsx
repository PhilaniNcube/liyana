import { getCompletePolicyData } from "@/lib/queries/policy-details";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PolicyDetailsTab from "./_components/policy-details-tab";
import PolicyBeneficiariesTab from "./_components/policy-beneficiaries-tab";
import PolicyClaimsTab from "./_components/policy-claims-tab";
import PolicyPaymentsTab from "./_components/policy-payments-tab";

type PolicyPageProps = {
  params: Promise<{
    id: number;
  }>;
};

const PolicyPage = async ({ params }: PolicyPageProps) => {
  const { id } = await params;

  const policyData = await getCompletePolicyData(id);

  if (!policyData) {
    return <div className="text-red-500">Policy not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Policy #{policyData.id}</h1>
        <p className="text-muted-foreground capitalize">
          {policyData.product_type?.replaceAll("_", " ") ?? "Insurance Policy"}
        </p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Policy Details</TabsTrigger>
          <TabsTrigger value="beneficiaries">
            Beneficiaries ({policyData.beneficiaries.length})
          </TabsTrigger>
          <TabsTrigger value="claims">
            Claims ({policyData.claims.length})
          </TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <PolicyDetailsTab policy={policyData} />
        </TabsContent>

        <TabsContent value="beneficiaries" className="mt-6">
          <PolicyBeneficiariesTab beneficiaries={policyData.beneficiaries} />
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          <PolicyClaimsTab claims={policyData.claims} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PolicyPaymentsTab
            payments={policyData.premium_payments}
            policy={policyData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolicyPage;
