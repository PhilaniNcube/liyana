"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import { formatDate } from "date-fns";
import type { PolicyWithProduct } from "@/lib/queries/policies";

interface PolicyHolderTabProps {
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

export default function PolicyHolderTab({ policy }: PolicyHolderTabProps) {
  const holder = policy.policy_holder;
  const holderName =
    holder?.organization_name ||
    [holder?.first_name, holder?.last_name].filter(Boolean).join(" ");
  const addressDetails = parseJsonField(holder?.address_details);
  const contactDetails = parseJsonField(holder?.contact_details);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {holder ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Full Name</p>
                <p className="text-sm text-muted-foreground">
                  {holderName || "N/A"}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">ID Number</p>
                <p className="text-sm text-muted-foreground">
                  {holder.id_number || "N/A"}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">
                  {holder.date_of_birth
                    ? formatDate(holder.date_of_birth, "PP")
                    : "N/A"}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Party Type</p>
                <p className="text-sm text-muted-foreground">
                  {holder.party_type
                    ? holder.party_type.charAt(0).toUpperCase() +
                      holder.party_type.slice(1)
                    : "N/A"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No policy holder information available
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactDetails ? (
            <>
              {contactDetails.email && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {contactDetails.email}
                    </p>
                  </div>
                  <Separator />
                </>
              )}
              {contactDetails.phone && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {contactDetails.phone}
                    </p>
                  </div>
                  <Separator />
                </>
              )}
              {contactDetails.mobile && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Mobile</p>
                  <p className="text-sm text-muted-foreground">
                    {contactDetails.mobile}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No contact information available
            </p>
          )}
        </CardContent>
      </Card>

      {addressDetails && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {addressDetails.street && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Street Address</p>
                  <p className="text-sm text-muted-foreground">
                    {addressDetails.street}
                  </p>
                </div>
              )}
              {addressDetails.city && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">City</p>
                  <p className="text-sm text-muted-foreground">
                    {addressDetails.city}
                  </p>
                </div>
              )}
              {addressDetails.province && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Province</p>
                  <p className="text-sm text-muted-foreground">
                    {addressDetails.province}
                  </p>
                </div>
              )}
              {addressDetails.postal_code && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Postal Code</p>
                  <p className="text-sm text-muted-foreground">
                    {addressDetails.postal_code}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
