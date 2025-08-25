"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, User } from "lucide-react";
import type { PolicyWithProduct } from "@/lib/queries/policies";
import type { Database } from "@/lib/database.types";
import {
  PolicyOverviewTab,
  PolicyHolderTab,
  PolicyFinancialTab,
  PolicyEmploymentTab,
  PolicyClaimsTab,
  PolicyBeneficiariesTab,
  PolicyDocumentsTab,
} from "./policy-detail/";

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
  const [documents, setDocuments] = useState<PolicyDocumentRow[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimWithDetails[]>(initialClaims);
  const [claimsLoading, setClaimsLoading] = useState(false);

  // Fetch policy documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(
          `/api/policy-documents?policy_id=${policy.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [policy.id]);

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
    setDocuments((prev) => [document, ...prev]);
  };

  const handleDocumentDeleted = (documentId: number) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
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
          <PolicyDocumentsTab
            policyId={policy.id}
            documents={documents}
            onDocumentUploaded={handleDocumentUploaded}
            onDocumentDeleted={handleDocumentDeleted}
          />
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
