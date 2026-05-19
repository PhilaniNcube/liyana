"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, CreditCard, CoinsIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { PolicyWithProduct } from "@/lib/queries/policies";

interface PolicyFinancialTabProps {
  policy: PolicyWithProduct;
}

const parseJsonField = (jsonField: any) => {
  if (!jsonField) return null;
  try {
    return typeof jsonField === "string" ? JSON.parse(jsonField) : jsonField;
  } catch {
    return null;
  }
};

export default function PolicyFinancialTab({
  policy,
}: PolicyFinancialTabProps) {
  const holder = policy.policy_holder;
  const bankingDetails = parseJsonField(holder?.banking_details);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            Premium Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Premium Amount</p>
            <p className="text-2xl font-bold">
              {policy.premium_amount
                ? formatCurrency(policy.premium_amount)
                : "N/A"}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Frequency</p>
            <p className="text-sm text-muted-foreground">
              {policy.frequency.charAt(0).toUpperCase() +
                policy.frequency.slice(1)}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Coverage Amount</p>
            <p className="text-2xl font-bold">
              {policy.coverage_amount
                ? formatCurrency(policy.coverage_amount)
                : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      {bankingDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankingDetails.bank_name && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Bank Name</p>
                  <p className="text-sm text-muted-foreground">
                    {bankingDetails.bank_name}
                  </p>
                </div>
                <Separator />
              </>
            )}
            {bankingDetails.account_number && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Account Number</p>
                  <p className="text-sm text-muted-foreground">
                    ****{bankingDetails.account_number.slice(-4)}
                  </p>
                </div>
                <Separator />
              </>
            )}
            {bankingDetails.branch_code && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Branch Code</p>
                  <p className="text-sm text-muted-foreground">
                    {bankingDetails.branch_code}
                  </p>
                </div>
              </>
            )}
            
            {bankingDetails.mandate_accepted !== undefined && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800">Payment Mandate Authority</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Mandate Status</p>
                      <p className="text-sm font-semibold text-green-600 mt-0.5">
                        {bankingDetails.mandate_accepted ? "✓ Accepted" : "✗ Not Accepted"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Signature Date</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {bankingDetails.signature_date || "N/A"}
                      </p>
                    </div>
                  </div>
                  {bankingDetails.signature_name && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Signed By</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {bankingDetails.signature_name}
                      </p>
                    </div>
                  )}
                  {bankingDetails.signature_svg && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Signature Image</p>
                      <div className="border border-dashed rounded bg-slate-50/50 p-2 inline-block max-w-full">
                        {bankingDetails.signature_svg.startsWith("data:") ? (
                          <img
                            src={bankingDetails.signature_svg}
                            alt="Signature"
                            className="max-h-[60px] object-contain block bg-transparent"
                          />
                        ) : (
                          <div
                            dangerouslySetInnerHTML={{ __html: bankingDetails.signature_svg }}
                            className="max-h-[60px] inline-block bg-transparent"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
