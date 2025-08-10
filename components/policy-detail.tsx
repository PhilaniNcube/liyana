"use client";

import * as React from "react";
import type { PolicyWithProduct } from "@/lib/queries/policies";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";

export default function PolicyDetail({
  policy,
}: {
  policy: PolicyWithProduct;
}) {
  const holder = policy.policy_holder;
  const holderName =
    holder?.organization_name ||
    [holder?.first_name, holder?.last_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Policy #{policy.id}
            <Badge variant="secondary" className="uppercase">
              {policy.policy_status}
            </Badge>
          </CardTitle>
          <CardDescription>{policy.product?.name ?? "—"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">
                  Policy holder
                </div>
                <div className="font-medium">{holderName || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Frequency</div>
                <div className="capitalize">{policy.frequency}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Premium</div>
                <div>
                  {policy.premium_amount
                    ? formatCurrency(policy.premium_amount)
                    : "—"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Start date</div>
                <div>
                  {policy.start_date
                    ? formatDate(policy.start_date, "PP")
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">End date</div>
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
          {holder && (
            <>
              <Separator className="my-6" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground">DOB</div>
                  <div>
                    {holder.date_of_birth
                      ? formatDate(holder.date_of_birth, "PP")
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Party Type
                  </div>
                  <div className="capitalize">{holder.party_type}</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
