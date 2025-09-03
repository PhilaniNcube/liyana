import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";

type Beneficiary = {
  id: number;
  relation_type: string | null;
  allocation_percentage: number | null;
  beneficiary_party_id: string;
  party?: {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    contact_details?: any;
  } | null;
  id_number?: string | null;
};

function formatName(party: Beneficiary["party"]) {
  if (!party) return "Unknown";
  const parts = [party.first_name ?? "", party.last_name ?? ""].filter(Boolean);
  return parts.length ? parts.join(" ") : "Unknown";
}

function formatRelationship(rel: string | null | undefined) {
  if (!rel) return "—";
  return rel.charAt(0).toUpperCase() + rel.slice(1).replace(/_/g, " ");
}

interface PolicyBeneficiariesTabProps {
  beneficiaries: Beneficiary[];
}

export default function PolicyBeneficiariesTab({
  beneficiaries,
}: PolicyBeneficiariesTabProps) {
  if (beneficiaries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No beneficiaries found for this policy.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAllocation = beneficiaries.reduce(
    (sum, b) =>
      sum +
      (Number.isFinite(b.allocation_percentage as number)
        ? (b.allocation_percentage as number)
        : 0),
    0
  );

  const hasPayoutAllocations = totalAllocation > 0;
  const allocationWarning = hasPayoutAllocations && totalAllocation !== 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Beneficiaries ({beneficiaries.length})</span>
            {hasPayoutAllocations && (
              <Badge variant={allocationWarning ? "destructive" : "secondary"}>
                Total Allocation: {totalAllocation}%
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {beneficiaries.map((beneficiary) => (
              <div
                key={beneficiary.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {formatName(beneficiary.party)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatRelationship(beneficiary.relation_type)}
                  </div>
                  {beneficiary.id_number && (
                    <div className="text-xs text-muted-foreground">
                      ID: {beneficiary.id_number}
                    </div>
                  )}
                  {beneficiary.party?.contact_details && (
                    <div className="text-xs text-muted-foreground">
                      {beneficiary.party.contact_details.phone && (
                        <div>
                          Phone: {beneficiary.party.contact_details.phone}
                        </div>
                      )}
                      {beneficiary.party.contact_details.email && (
                        <div>
                          Email: {beneficiary.party.contact_details.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
