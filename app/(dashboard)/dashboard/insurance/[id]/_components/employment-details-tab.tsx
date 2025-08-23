import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/format-currency";
import { PolicyWithAllData } from "@/lib/queries/policy-details";

interface EmploymentDetailsTabProps {
  policy: PolicyWithAllData;
}

export default function EmploymentDetailsTab({
  policy,
}: EmploymentDetailsTabProps) {
  const holder = policy.policy_holder;

  return (
    <div className="space-y-6">
      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
        </CardHeader>
        <CardContent>
          {!policy.employment_details ? (
            <div className="text-center text-muted-foreground">
              No employment information available for this policy.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {policy.employment_details.employer_name && (
                <div>
                  <div className="text-xs text-muted-foreground">Employer</div>
                  <div className="font-medium">
                    {policy.employment_details.employer_name}
                  </div>
                </div>
              )}
              {policy.employment_details.job_title && (
                <div>
                  <div className="text-xs text-muted-foreground">Job Title</div>
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
                  <div className="font-medium text-lg">
                    {formatCurrency(
                      parseFloat(policy.employment_details.monthly_income)
                    )}
                  </div>
                </div>
              )}
              {policy.employment_details.employer_address && (
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">
                    Employer Address
                  </div>
                  <div>{policy.employment_details.employer_address}</div>
                </div>
              )}
              {policy.employment_details.employer_contact_number && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Employer Contact
                  </div>
                  <div>{policy.employment_details.employer_contact_number}</div>
                </div>
              )}
              {policy.employment_details.employment_end_date && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Employment End Date
                  </div>
                  <div>{policy.employment_details.employment_end_date}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banking Information */}
      {holder?.banking_details && (
        <Card>
          <CardHeader>
            <CardTitle>Banking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(holder.banking_details as any)?.account_name && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Account Name
                  </div>
                  <div className="font-medium">
                    {(holder.banking_details as any).account_name}
                  </div>
                </div>
              )}
              {(holder.banking_details as any)?.bank_name && (
                <div>
                  <div className="text-xs text-muted-foreground">Bank Name</div>
                  <div>{(holder.banking_details as any).bank_name}</div>
                </div>
              )}
              {(holder.banking_details as any)?.account_number && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Account Number
                  </div>
                  <div className="font-mono">
                    {(holder.banking_details as any).account_number}
                  </div>
                </div>
              )}
              {(holder.banking_details as any)?.branch_code && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Branch Code
                  </div>
                  <div className="font-mono">
                    {(holder.banking_details as any).branch_code}
                  </div>
                </div>
              )}
              {(holder.banking_details as any)?.account_type && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Account Type
                  </div>
                  <div className="capitalize">
                    {(holder.banking_details as any).account_type.replace(
                      /_/g,
                      " "
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
