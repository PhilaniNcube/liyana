"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, DollarSign, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import type { PolicyWithProduct } from "@/lib/queries/policies";
import type { Database } from "@/lib/types";

type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];
type PartyRow = Database["public"]["Tables"]["parties"]["Row"];
type ClaimPayoutRow = Database["public"]["Tables"]["claim_payouts"]["Row"];
type PolicyBeneficiaryRow =
  Database["public"]["Tables"]["policy_beneficiaries"]["Row"];

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

interface PolicyOverviewTabProps {
  policy: PolicyWithProduct;
  claims: ClaimWithDetails[];
  beneficiaries: BeneficiaryWithDetails[];
}

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

export default function PolicyOverviewTab({
  policy,
  claims,
  beneficiaries,
}: PolicyOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Policy Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Product Type</p>
            <p className="text-sm text-muted-foreground">
              {policy.product_type
                ? policy.product_type.charAt(0).toUpperCase() +
                  policy.product_type.slice(1)
                : "N/A"}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Status</p>
            <Badge variant={getStatusBadgeVariant(policy.policy_status)}>
              {policy.policy_status.charAt(0).toUpperCase() +
                policy.policy_status.slice(1)}
            </Badge>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Frequency</p>
            <p className="text-sm text-muted-foreground">
              {policy.frequency.charAt(0).toUpperCase() +
                policy.frequency.slice(1)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Policy Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Start Date</p>
            <p className="text-sm text-muted-foreground">
              {policy.start_date ? formatDate(policy.start_date, "PP") : "N/A"}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">End Date</p>
            <p className="text-sm text-muted-foreground">
              {policy.end_date ? formatDate(policy.end_date, "PP") : "N/A"}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Created</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(policy.created_at, "PP")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="font-mono text-3xl">R</div>
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Premium Amount</p>
              <p className="text-2xl font-bold">
                {policy.premium_amount
                  ? formatCurrency(policy.premium_amount)
                  : "N/A"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Coverage Amount</p>
              <p className="text-2xl font-bold">
                {policy.coverage_amount
                  ? formatCurrency(policy.coverage_amount)
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiaries & Claims Overview */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Policy Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Covered Persons</p>
              <p className="text-2xl font-bold">{beneficiaries.length + 1}</p>
              <p className="text-xs text-muted-foreground">
                Covered persons assigned
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Claims</p>
              <p className="text-2xl font-bold">{claims.length}</p>
              <p className="text-xs text-muted-foreground">
                {claims.length === 1 ? "claim" : "claims"} filed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
