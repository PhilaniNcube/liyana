import { getCompletePolicyData } from "@/lib/queries/policy-details";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "./_components/personal-info-tab";
import PolicyInfoTab from "./_components/policy-info-tab";
import EmploymentDetailsTab from "./_components/employment-details-tab";
import PolicyBeneficiariesTab from "./_components/policy-beneficiaries-tab";
import PolicyClaimsTab from "./_components/policy-claims-tab";
import PolicyPaymentsTab from "./_components/policy-payments-tab";
import PolicyEmailTab from "./_components/policy-email-tab";
import PolicyDocumentsTab from "./_components/policy-documents-tab";
import { SendToLinarDialog } from "./_components/send-to-linar-dialog";
import SmsPolicy from "@/components/sms-policy";
import { Button } from "@/components/ui/button";
import { Send, FileText, Download, Eye } from "lucide-react";

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Policy #{policyData.id}</h1>
          <p className="text-muted-foreground capitalize">
            {policyData.product_type?.replaceAll("_", " ") ??
              "Insurance Policy"}
          </p>
        </div>
        <SendToLinarDialog
          policyId={policyData.id}
          policyHolderName={
            [
              policyData.policy_holder?.first_name,
              policyData.policy_holder?.last_name,
            ]
              .filter(Boolean)
              .join(" ") || "Policy Holder"
          }
          documents={policyData.documents}
        />
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-9 gap-2">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="policy">Policy Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="beneficiaries">
            Covered Persons ({policyData.beneficiaries.length})
          </TabsTrigger>
          <TabsTrigger value="claims">
            Claims ({policyData.claims.length})
          </TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({policyData.documents.length})
          </TabsTrigger>
          <TabsTrigger value="email">Email Client</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalInfoTab policy={policyData} />
        </TabsContent>

        <TabsContent value="policy" className="mt-6">
          <PolicyInfoTab policy={policyData} />
        </TabsContent>

        <TabsContent value="employment" className="mt-6">
          <EmploymentDetailsTab policy={policyData} />
        </TabsContent>

        <TabsContent value="beneficiaries" className="mt-6">
          <PolicyBeneficiariesTab beneficiaries={policyData.beneficiaries} />
        </TabsContent>

        <TabsContent value="claims" className="mt-6">
          <PolicyClaimsTab claims={policyData.claims} policy={policyData} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PolicyPaymentsTab
            payments={policyData.premium_payments}
            policy={policyData}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <PolicyDocumentsTab
            policyId={policyData.id}
            initialDocuments={policyData.documents}
          />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <PolicyEmailTab
            policyId={policyData.id}
            policyHolderEmail={
              typeof policyData.policy_holder?.contact_details === "object" &&
              policyData.policy_holder?.contact_details !== null
                ? (policyData.policy_holder.contact_details as any).email || ""
                : ""
            }
            policyHolderName={
              [
                policyData.policy_holder?.first_name,
                policyData.policy_holder?.last_name,
              ]
                .filter(Boolean)
                .join(" ") || ""
            }
            documents={policyData.documents}
          />
        </TabsContent>
        <TabsContent value="sms" className="mt-6">
          <SmsPolicy
            policyId={policyData.id}
            profileId={policyData.user_id || ""}
            phoneNumber={
              typeof policyData.policy_holder?.contact_details === "object" &&
              policyData.policy_holder?.contact_details !== null
                ? (policyData.policy_holder.contact_details as any).phone || ""
                : ""
            }
            policyHolderName={
              [
                policyData.policy_holder?.first_name,
                policyData.policy_holder?.last_name,
              ]
                .filter(Boolean)
                .join(" ") || "Policy Holder"
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolicyPage;
