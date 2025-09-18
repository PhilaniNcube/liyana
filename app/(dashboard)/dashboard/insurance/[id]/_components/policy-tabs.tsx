"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonalInfoTab from "./personal-info-tab";
import PolicyInfoTab from "./policy-info-tab";
import EmploymentDetailsTab from "./employment-details-tab";
import PolicyBeneficiariesTab from "./policy-beneficiaries-tab";
import PolicyClaimsTab from "./policy-claims-tab";
import PolicyPaymentsTab from "./policy-payments-tab";
import PolicyEmailTab from "./policy-email-tab";
import PolicyDocumentsTab from "./policy-documents-tab";
import { SendToLinarDialog } from "./send-to-linar-dialog";
import SmsPolicy from "@/components/sms-policy";
import { useTabState } from "@/hooks/use-tab-state";
import UpdatePolicyStatus from "./update-policy-status";

type PolicyTabsProps = {
  policyData: any; // Replace with proper type
  emailHistory: any; // Replace with proper type
};

const PolicyTabs = ({ policyData, emailHistory }: PolicyTabsProps) => {
  const [selectedTab, setSelectedTab] = useTabState("personal");

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
        <div className="flex items-center gap-2">
          <UpdatePolicyStatus
            currentStatus={
              policyData.policy_status as
                | "pending"
                | "active"
                | "lapsed"
                | "cancelled"
            }
            policyId={policyData.id}
          />
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
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
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
          <PolicyBeneficiariesTab
            beneficiaries={policyData.beneficiaries}
            user_id={policyData.user_id}
          />
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
            emailHistory={emailHistory}
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

export default PolicyTabs;
