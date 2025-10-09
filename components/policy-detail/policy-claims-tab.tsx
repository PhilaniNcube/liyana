"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import type { PolicyWithProduct } from "@/lib/queries/policies";
import type { Database } from "@/lib/types";
import CreateClaimDialog from "@/components/create-claim-dialog";

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

interface PolicyClaimsTabProps {
  policy: PolicyWithProduct;
  claims: ClaimWithDetails[];
  beneficiaries: BeneficiaryWithDetails[];
  documents: PolicyDocumentRow[];
  onRefreshClaims: () => void;
}

const getClaimStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "declined":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "paid":
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getClaimStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "declined":
      return "destructive";
    case "paid":
      return "outline";
    default:
      return "secondary";
  }
};

export default function PolicyClaimsTab({
  policy,
  claims,
  beneficiaries,
  documents,
  onRefreshClaims,
}: PolicyClaimsTabProps) {
  return (
    <div className="space-y-6">
      {/* Create Claim Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Policy Claims</h3>
          <p className="text-sm text-muted-foreground">
            Manage and create claims for this policy
          </p>
        </div>
        <CreateClaimDialog
          policyId={policy.id}
          policyHolderId={policy.policy_holder_id || ""}
          policyHolder={policy.policy_holder}
          beneficiaries={beneficiaries.map((b) => ({
            id: b.id,
            beneficiary_party_id: b.beneficiary_party_id,
            allocation_percentage: b.allocation_percentage,
            relation_type: b.relation_type,
            party: b.party,
          }))}
          documents={documents}
          onClaimCreated={onRefreshClaims}
        />
      </div>

      {claims && claims.length > 0 ? (
        claims.map((claim) => (
          <Card key={claim.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getClaimStatusIcon(claim.status)}
                  Claim #{claim.claim_number}
                </div>
                <Badge variant={getClaimStatusBadgeVariant(claim.status)}>
                  {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription>
                Filed on {formatDate(claim.date_filed, "PP")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Date of Incident</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(claim.date_of_incident, "PP")}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Claimant</p>
                    <p className="text-sm text-muted-foreground">
                      {claim.claimant
                        ? `${claim.claimant.first_name || ""} ${claim.claimant.last_name || ""}`.trim() ||
                          claim.claimant.organization_name ||
                          "Unknown"
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex items-center gap-2">
                      {getClaimStatusIcon(claim.status)}
                      <span className="text-sm text-muted-foreground">
                        {claim.status.charAt(0).toUpperCase() +
                          claim.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Claim Created</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(claim.created_at, "PP")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Claim Payouts */}
              {claim.claim_payouts && claim.claim_payouts.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h4 className="text-sm font-medium mb-4">Payouts</h4>
                    <div className="space-y-3">
                      {claim.claim_payouts.map((payout, index) => (
                        <div key={payout.id} className="border rounded-lg p-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Amount
                              </p>
                              <p className="text-sm">
                                {payout.amount
                                  ? formatCurrency(payout.amount)
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Payout Date
                              </p>
                              <p className="text-sm">
                                {payout.payout_date
                                  ? formatDate(payout.payout_date, "PP")
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Beneficiary
                              </p>
                              <p className="text-sm">
                                {payout.beneficiary
                                  ? `${payout.beneficiary.first_name || ""} ${payout.beneficiary.last_name || ""}`.trim() ||
                                    payout.beneficiary.organization_name ||
                                    "Unknown"
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Claims Found</h3>
            <p className="text-muted-foreground mb-6">
              There are no claims associated with this policy. You can create a
              new claim to get started.
            </p>
            <CreateClaimDialog
              policyId={policy.id}
              policyHolderId={policy.policy_holder_id || ""}
              policyHolder={policy.policy_holder}
              beneficiaries={beneficiaries.map((b) => ({
                id: b.id,
                beneficiary_party_id: b.beneficiary_party_id,
                allocation_percentage: b.allocation_percentage,
                relation_type: b.relation_type,
                party: b.party,
              }))}
              documents={documents}
              onClaimCreated={onRefreshClaims}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
