import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";

interface PolicyDetailsTabProps {
  policy: {
    id: number;
    product_type: string | null;
    policy_status: string;
    premium_amount: number | null;
    frequency: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    coverage_amount?: number | null;
    policy_holder: {
      id?: string;
      first_name?: string | null;
      last_name?: string | null;
      organization_name?: string | null;
      date_of_birth?: string | null;
      party_type?: string | null;
      contact_details?: any;
      employment_details?: any;
    } | null;
  };
}

export default function PolicyDetailsTab({ policy }: PolicyDetailsTabProps) {
  const holder = policy.policy_holder;
  const holderName =
    holder?.organization_name ||
    [holder?.first_name, holder?.last_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      {/* Policy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Policy #{policy.id}
            <Badge variant="secondary" className="uppercase">
              {policy.policy_status}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {policy.product_type?.replaceAll("_", " ") ?? "—"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Frequency</div>
                <div className="capitalize">{policy.frequency || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Premium</div>
                <div className="font-medium">
                  {policy.premium_amount
                    ? formatCurrency(policy.premium_amount)
                    : "—"}
                </div>
              </div>
              {policy.coverage_amount && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Coverage Amount
                  </div>
                  <div className="font-medium">
                    {formatCurrency(policy.coverage_amount)}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Start Date</div>
                <div>
                  {policy.start_date
                    ? formatDate(policy.start_date, "PP")
                    : "—"}
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

      {/* Policy Holder Information */}
      {holder && (
        <Card>
          <CardHeader>
            <CardTitle>Policy Holder Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div className="font-medium">{holderName || "—"}</div>
                </div>
                {holder.date_of_birth && (
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Date of Birth
                    </div>
                    <div>{formatDate(holder.date_of_birth, "PP")}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground">
                    Party Type
                  </div>
                  <div className="capitalize">{holder.party_type || "—"}</div>
                </div>
              </div>

              {holder.contact_details && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {holder.contact_details.phone && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Phone
                          </div>
                          <div>{holder.contact_details.phone}</div>
                        </div>
                      )}
                      {holder.contact_details.email && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Email
                          </div>
                          <div>{holder.contact_details.email}</div>
                        </div>
                      )}
                      {holder.contact_details.address && (
                        <div className="md:col-span-2">
                          <div className="text-xs text-muted-foreground">
                            Address
                          </div>
                          <div>{holder.contact_details.address}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {holder.employment_details && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Employment Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {holder.employment_details.employer_name && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Employer
                          </div>
                          <div>{holder.employment_details.employer_name}</div>
                        </div>
                      )}
                      {holder.employment_details.job_title && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Job Title
                          </div>
                          <div>{holder.employment_details.job_title}</div>
                        </div>
                      )}
                      {holder.employment_details.employment_type && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Employment Type
                          </div>
                          <div className="capitalize">
                            {holder.employment_details.employment_type.replace(
                              /_/g,
                              " "
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
