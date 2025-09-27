"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, User } from "lucide-react";
import type { PolicyWithProduct } from "@/lib/queries/policies";
import type { Database } from "@/lib/types";
import {
  usePolicyDocuments,
  useOptimisticPolicyDocumentUpdate,
} from "@/hooks/use-policy-documents";
import {
  PolicyOverviewTab,
  PolicyHolderTab,
  PolicyFinancialTab,
  PolicyEmploymentTab,
  PolicyClaimsTab,
  PolicyBeneficiariesTab,
  PolicyDocumentsTab,
} from "./policy-detail/";
import PolicyDocumentsList from "./policy-documents-list";

// Types
type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];
type PartyRow = Database["public"]["Tables"]["parties"]["Row"];
type ClaimPayoutRow = Database["public"]["Tables"]["claim_payouts"]["Row"];
type PolicyBeneficiaryRow =
  Database["public"]["Tables"]["policy_beneficiaries"]["Row"];
type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

type ClaimWithDetails = ClaimRow & {
  claimant: Partial<PartyRow> | null;
  claim_payouts: Array<
    ClaimPayoutRow & {
      beneficiary: Partial<PartyRow> | null;
    }
  >;
};

type BeneficiaryWithDetails = PolicyBeneficiaryRow & {
  party: Partial<PartyRow> | null;
  id_number: string | null;
};

interface PolicyDetailProps {
  policy: PolicyWithProduct;
  claims: ClaimWithDetails[];
  beneficiaries: BeneficiaryWithDetails[];
}

export default function PolicyDetail({
  policy,
  claims: initialClaims,
  beneficiaries,
}: PolicyDetailProps) {
  const [claims, setClaims] = useState<ClaimWithDetails[]>(initialClaims);
  const [claimsLoading, setClaimsLoading] = useState(false);

  // Fetch policy documents using tanstack/react-query
  const {
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError,
  } = usePolicyDocuments(policy.id);

  // Optimistic updates for documents
  const { addDocument, removeDocument } = useOptimisticPolicyDocumentUpdate();

  // Log any errors for debugging
  if (documentsError) {
    console.error("Error fetching policy documents:", documentsError);
  }

  // Function to refresh claims
  const refreshClaims = async () => {
    setClaimsLoading(true);
    try {
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing claims:", error);
    } finally {
      setClaimsLoading(false);
    }
  };

  const handleDocumentUploaded = (document: PolicyDocumentRow) => {
    addDocument(policy.id, document);
  };

  const handleDocumentDeleted = (documentId: number) => {
    removeDocument(policy.id, documentId);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "declined":
        return "destructive";
      case "cancelled":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getProductTypeIcon = (productType: string | null) => {
    switch (productType?.toLowerCase()) {
      case "funeral":
        return <Shield className="h-12 w-12" />;
      case "life":
        return <User className="h-12 w-12" />;
      default:
        return <FileText className="h-12 w-12" />;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getProductTypeIcon(policy.product_type)}
            <div>
              <h1 className="text-3xl font-bold">
                {policy.product_type === "funeral_policy"
                  ? "Funeral Cover"
                  : policy.product_type === "life_insurance"
                    ? "Life Insurance"
                    : "General Insurance"}{" "}
              </h1>
              <p className="text-muted-foreground">Policy ID: {policy.id}</p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(policy.policy_status)}>
            {policy.policy_status.charAt(0).toUpperCase() +
              policy.policy_status.slice(1)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holder">Policy Holder</TabsTrigger>
          <TabsTrigger value="financial">Financial Details</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="claims">
            Claims {claims.length > 0 && `(${claims.length})`}
          </TabsTrigger>
          <TabsTrigger value="beneficiaries">
            Covered People{" "}
            {beneficiaries.length > 0 && `(${beneficiaries.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <PolicyOverviewTab
            policy={policy}
            claims={claims}
            beneficiaries={beneficiaries}
          />
        </TabsContent>

        {/* Policy Holder Tab */}
        <TabsContent value="holder">
          <PolicyHolderTab policy={policy} />
        </TabsContent>

        {/* Financial Details Tab */}
        <TabsContent value="financial">
          <PolicyFinancialTab policy={policy} />
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment">
          <PolicyEmploymentTab policy={policy} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PolicyDocumentsTab
              policyId={policy.id}
              documents={documents}
              onDocumentUploaded={handleDocumentUploaded}
              onDocumentDeleted={handleDocumentDeleted}
            />
            <PolicyDocumentsList policyId={policy.id} />
          </div>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims">
          <PolicyClaimsTab
            policy={policy}
            claims={claims}
            beneficiaries={beneficiaries}
            documents={documents}
            onRefreshClaims={refreshClaims}
          />
        </TabsContent>

        {/* Beneficiaries Tab */}
        <TabsContent value="beneficiaries">
          <PolicyBeneficiariesTab beneficiaries={beneficiaries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
