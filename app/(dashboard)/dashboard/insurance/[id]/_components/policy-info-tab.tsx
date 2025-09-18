import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import { PolicyWithAllData } from "@/lib/queries/policy-details";
import UpdatePolicyStatus from "./update-policy-status";

interface PolicyInfoTabProps {
  policy: PolicyWithAllData;
}

export default function PolicyInfoTab({ policy }: PolicyInfoTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Policy #{policy.id}
              <Badge variant="secondary" className="uppercase">
                {policy.policy_status}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground capitalize">
              {policy.product_type?.replaceAll("_", " ") ?? "—"}
            </p>
          </div>
          <UpdatePolicyStatus
            currentStatus={
              policy.policy_status as
                | "pending"
                | "active"
                | "lapsed"
                | "cancelled"
            }
            policyId={policy.id}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Product Type</div>
              <div className="capitalize font-medium">
                {policy.product_type?.replaceAll("_", " ") ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Policy Status</div>
              <Badge variant="secondary" className="uppercase">
                {policy.policy_status}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Payment Frequency
              </div>
              <div className="capitalize">{policy.frequency || "—"}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">
                Premium Amount
              </div>
              <div className="font-medium text-lg">
                {policy.premium_amount
                  ? formatCurrency(policy.premium_amount)
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Coverage Amount
              </div>
              <div className="font-medium text-lg">
                {policy.coverage_amount
                  ? formatCurrency(policy.coverage_amount)
                  : "—"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Start Date</div>
              <div>
                {policy.start_date ? formatDate(policy.start_date, "PP") : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">End Date</div>
              <div>
                {policy.end_date ? formatDate(policy.end_date, "PP") : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Created</div>
              <div>{formatDate(policy.created_at, "PP")}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
