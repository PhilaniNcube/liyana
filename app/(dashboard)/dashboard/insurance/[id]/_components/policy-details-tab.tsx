import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import { PolicyWithAllData } from "@/lib/queries/policy-details";
import { decryptValue } from "@/lib/encryption";

interface PolicyDetailsTabProps {
  policy: PolicyWithAllData;
}

export default function PolicyDetailsTab({ policy }: PolicyDetailsTabProps) {
  const holder = policy.policy_holder;
  const holderName =
    holder?.organization_name ||
    [holder?.first_name, holder?.last_name].filter(Boolean).join(" ");

  console.log("policy", policy);

  return (
    <div className="space-y-6">
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
                <div>
                  <div className="text-xs text-muted-foreground">ID Number</div>
                  <div className="capitalize">
                    {decryptValue(holder.id_number!) || "—"}
                  </div>
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
                      {(holder.contact_details as any)?.phone && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Phone
                          </div>
                          <div>{(holder.contact_details as any).phone}</div>
                        </div>
                      )}
                      {(holder.contact_details as any)?.email && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Email
                          </div>
                          <div>{(holder.contact_details as any).email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {holder.address_details && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Address Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(holder.address_details as any)?.physical && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Physical Address
                          </div>
                          <div>{(holder.address_details as any).physical}</div>
                        </div>
                      )}
                      {(holder.address_details as any)?.city && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            City
                          </div>
                          <div>{(holder.address_details as any).city}</div>
                        </div>
                      )}
                      {(holder.address_details as any)?.postal_code && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Postal Code
                          </div>
                          <div>
                            {(holder.address_details as any).postal_code}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {policy.employment_details && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Employment Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {policy.employment_details.employer_name && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Employer
                          </div>
                          <div>{policy.employment_details.employer_name}</div>
                        </div>
                      )}
                      {policy.employment_details.job_title && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Job Title
                          </div>
                          <div>{policy.employment_details.job_title}</div>
                        </div>
                      )}
                      {policy.employment_details.employment_type && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Employment Type
                          </div>
                          <div className="capitalize">
                            {policy.employment_details.employment_type.replace(
                              /_/g,
                              " "
                            )}
                          </div>
                        </div>
                      )}
                      {policy.employment_details.monthly_income && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Monthly Income
                          </div>
                          <div>
                            {formatCurrency(
                              parseFloat(
                                policy.employment_details.monthly_income
                              )
                            )}
                          </div>
                        </div>
                      )}
                      {policy.employment_details.employer_address && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Employer Address
                          </div>
                          <div>
                            {policy.employment_details.employer_address}
                          </div>
                        </div>
                      )}
                      {policy.employment_details.employer_contact_number && (
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Employer Contact
                          </div>
                          <div>
                            {policy.employment_details.employer_contact_number}
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
    </div>
  );
}
