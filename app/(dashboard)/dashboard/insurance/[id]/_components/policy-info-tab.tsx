import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import { PolicyWithAllData } from "@/lib/queries/policy-details";
import UpdatePolicyStatus from "./update-policy-status";
import { User, PenTool } from "lucide-react";

interface PolicyInfoTabProps {
  policy: PolicyWithAllData;
}

export default function PolicyInfoTab({ policy }: PolicyInfoTabProps) {
  const employmentDetails = policy.employment_details as any;
  const beneficiary = employmentDetails?.beneficiary;
  const bankingDetails = policy.policy_holder?.banking_details as any;

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

        {/* Separator */}
        <hr className="my-6 border-slate-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Policy Beneficiary Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Policy Beneficiary (Payout Recipient)
            </h3>
            {beneficiary && beneficiary.name ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Name &amp; Surname</div>
                    <div className="font-medium text-slate-900">{beneficiary.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Relationship</div>
                    <div className="font-medium text-slate-900 capitalize">{beneficiary.relationship || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Date of Birth / ID</div>
                    <div className="font-medium text-slate-900">{beneficiary.dob_or_id || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Cellphone</div>
                    <div className="font-medium text-slate-900">{beneficiary.phone || "—"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                No policy beneficiary details recorded.
              </div>
            )}
          </div>

          {/* Signature & Consent Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <PenTool className="h-4 w-4 text-emerald-600" />
              Consent &amp; Electronic Signature
            </h3>
            {bankingDetails && (bankingDetails.signature_name || bankingDetails.signature_svg) ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Signed By</div>
                    <div className="font-medium text-slate-900">{bankingDetails.signature_name || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Signed Date</div>
                    <div className="font-medium text-slate-900">{bankingDetails.signature_date || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Mandate Accepted</div>
                    <Badge variant={bankingDetails.mandate_accepted ? "default" : "destructive"} className="mt-0.5">
                      {bankingDetails.mandate_accepted ? "ACCEPTED" : "DECLINED"}
                    </Badge>
                  </div>
                </div>

                {bankingDetails.signature_svg && (
                  <div className="pt-3 border-t border-slate-200">
                    <div className="text-xs text-muted-foreground mb-1.5">Recorded Signature</div>
                    <div className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-center min-h-[64px] max-h-[80px] overflow-hidden">
                      {bankingDetails.signature_svg.startsWith("data:") ? (
                        <img
                          src={bankingDetails.signature_svg}
                          alt="Signature"
                          className="max-h-12 object-contain"
                        />
                      ) : (
                        <div
                          className="max-h-12 overflow-auto"
                          dangerouslySetInnerHTML={{ __html: bankingDetails.signature_svg }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                No signature or consent details recorded.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
