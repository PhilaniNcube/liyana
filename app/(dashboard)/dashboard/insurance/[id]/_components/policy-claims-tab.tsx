import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import { PolicyWithAllData } from "@/lib/queries/policy-details";
import CreateClaimForm from "./create-claim-form";
import { Send } from "lucide-react";

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

export default function PolicyClaimsTab({
  claims,
  policy,
}: PolicyClaimsTabProps) {
  if (claims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Claims</CardTitle>
            <CreateClaimForm policy={policy} />
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Claims</h3>
        <CreateClaimForm policy={policy} />
      </div>
      <div className="grid gap-4">
        {claims.map((claim) => (
          <Card key={claim.id}>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2">
                  <span>Claim #{claim.claim_number}</span>
                  <Badge variant={getStatusVariant(claim.status)}>
                    {claim.status.charAt(0).toUpperCase() +
                      claim.status.slice(1)}
                  </Badge>
                </CardTitle>
                <form action="#send-claim">
                  <Button size="sm" className="bg-black">
                    <Send className="h-4 w-4 mr-2" />
                    Send to Linar
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Claimant</div>
                  <div className="font-medium">
                    {formatName(claim.claimant)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Incident Date
                  </div>
                  <div>{formatDate(claim.date_of_incident, "PP")}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Submitted</div>
                  <div>{formatDate(claim.created_at, "PP")}</div>
                </div>
                {claim.claim_amount && (
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Claim Amount
                    </div>
                    <div className="font-medium">
                      {formatCurrency(claim.claim_amount)}
                    </div>
                  </div>
                )}
                {claim.approved_amount && (
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Approved Amount
                    </div>
                    <div className="font-medium">
                      {formatCurrency(claim.approved_amount)}
                    </div>
                  </div>
                )}
              </div>

              {claim.payouts.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Payouts</h4>
                  <div className="space-y-2">
                    {claim.payouts.map((payout) => (
                      <div
                        key={payout.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {formatName(payout.beneficiary)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(payout.payout_date, "PP")}
                          </div>
                        </div>
                        <div className="text-right">
                          {payout.amount && (
                            <div className="font-medium">
                              {formatCurrency(payout.amount)}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {formatDate(payout.payout_date, "PP")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
