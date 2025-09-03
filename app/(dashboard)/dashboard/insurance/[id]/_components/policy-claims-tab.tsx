"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import { PolicyWithAllData } from "@/lib/queries/policy-details";
import CreateClaimForm from "./create-claim-form";
import { Plus, Send } from "lucide-react";
import type { Database } from "@/lib/database.types";
import ClaimDetailsCard from "./claim-details-card";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

type Claim = {
  id: number;
  claim_number: string;
  date_filed: string;
  date_of_incident: string;
  created_at: string;
  status: string;
  claim_amount?: number | null;
  approved_amount?: number | null;
  claimant: {
    first_name?: string | null;
    last_name?: string | null;
    contact_details?: any;
  } | null;
  payouts: Array<{
    id: number;
    amount: number;
    payout_date: string;
    beneficiary: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  }>;
};

function formatName(
  person: { first_name?: string | null; last_name?: string | null } | null
) {
  if (!person) return "Unknown";
  const parts = [person.first_name ?? "", person.last_name ?? ""].filter(
    Boolean
  );
  return parts.length ? parts.join(" ") : "Unknown";
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "paid":
      return "default";
    case "pending":
    case "submitted":
      return "secondary";
    case "rejected":
    case "declined":
      return "destructive";
    default:
      return "outline";
  }
}

interface PolicyClaimsTabProps {
  claims: Claim[];
  policy: PolicyWithAllData;
}

function CreateClaimFormWrapper({
  policy,
  onClaimCreated,
}: {
  policy: PolicyWithAllData;
  onClaimCreated?: () => void;
}) {
  const [documents, setDocuments] = useState<PolicyDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(
          `/api/policy-documents?policy_id=${policy.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        const docs = await response.json();
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to fetch policy documents:", error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [policy.id]);

  const handleClaimCreated = () => {
    setOpen(false);
    onClaimCreated?.();
  };

  if (loading) {
    return <Button disabled>Loading...</Button>;
  }

  return (
    <CreateClaimForm
      policyId={policy.id}
      policyHolderId={policy.policy_holder?.id || ""}
      policyHolder={policy.policy_holder}
      beneficiaries={policy.beneficiaries.map((b) => ({
        id: b.id,
        beneficiary_party_id: b.beneficiary_party_id,
        allocation_percentage: b.allocation_percentage || 0,
        relation_type: b.relation_type || "",
        party: b.party,
      }))}
      documents={documents}
      onClaimCreated={handleClaimCreated}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create New Claim
        </Button>
      }
    />
  );
}

export default function PolicyClaimsTab({
  claims,
  policy,
}: PolicyClaimsTabProps) {
  if (claims.length === 0) {
    return (
      <Card className="max-w-7xl w-full mx-auto">
        <CardHeader>
          <div className="flex w-full items-center justify-between">
            {/* <CardTitle className="text-lg font-medium">Claims</CardTitle> */}
            <CreateClaimFormWrapper policy={policy} />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No claims found for this policy.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-col justify-between w-full">
        <CreateClaimFormWrapper policy={policy} />
      </div>
      <div className="grid gap-4">
        {claims.map((claim) => (
          <ClaimDetailsCard key={claim.id} claim={claim} policyId={policy.id} />
        ))}
      </div>
    </div>
  );
}
