"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import type { PolicyWithProduct } from "@/lib/queries/policies";

interface PolicyEmploymentTabProps {
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

export default function PolicyEmploymentTab({
  policy,
}: PolicyEmploymentTabProps) {
  const employmentDetails = parseJsonField(policy.employment_details);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Employment Details
        </CardTitle>
        <CardDescription>
          Employment information provided during policy application
        </CardDescription>
      </CardHeader>
      <CardContent>
        {employmentDetails ? (
          <div className="grid gap-4 md:grid-cols-2">
            {employmentDetails.employer_name && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Employer</p>
                <p className="text-sm text-muted-foreground">
                  {employmentDetails.employer_name}
                </p>
              </div>
            )}
            {employmentDetails.job_title && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Job Title</p>
                <p className="text-sm text-muted-foreground">
                  {employmentDetails.job_title}
                </p>
              </div>
            )}
            {employmentDetails.monthly_income && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Monthly Income</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(employmentDetails.monthly_income)}
                </p>
              </div>
            )}
            {employmentDetails.employment_type && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Employment Type</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {employmentDetails.employment_type.charAt(0).toUpperCase() +
                    employmentDetails.employment_type.slice(1)}
                </p>
              </div>
            )}
            {employmentDetails.end_date && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Employment End Date</p>
                <p className="text-sm capitalize text-muted-foreground">
                  {formatDate(employmentDetails.end_date, "PP")}
                </p>
              </div>
            )}
            {employmentDetails.employer_contact_number && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Work Phone</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {employmentDetails.employer_contact_number}
                </p>
              </div>
            )}
            {employmentDetails.employer_address && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Work Address</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {employmentDetails.employer_address}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No employment details available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
