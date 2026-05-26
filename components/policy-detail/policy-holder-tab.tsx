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
  const bankingDetails = parseJsonField(holder?.banking_details);

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

      {bankingDetails && (bankingDetails.mandate_accepted || bankingDetails.signature_svg) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Mandate & Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Mandate Status</p>
                <p className="text-sm font-semibold text-green-600 mt-1">
                  {bankingDetails.mandate_accepted ? "✓ Accepted" : "✗ Not Accepted"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Signature Date</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {bankingDetails.signature_date || "N/A"}
                </p>
              </div>
              {bankingDetails.signature_name && (
                <div className="space-y-2 col-span-2">
                  <p className="text-sm font-medium">Signed By</p>
                  <p className="text-sm text-muted-foreground">
                    {bankingDetails.signature_name}
                  </p>
                </div>
              )}
              {bankingDetails.signature_svg && (
                <div className="space-y-2 col-span-2">
                  <p className="text-sm font-medium mb-1">Signature Image</p>
                  <div className="border border-dashed rounded bg-slate-50/50 p-3 inline-block max-w-full">
                    {bankingDetails.signature_svg.startsWith("data:") ? (
                      <img
                        src={bankingDetails.signature_svg}
                        alt="Signature"
                        className="max-h-[100px] object-contain block bg-transparent"
                      />
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{ __html: bankingDetails.signature_svg }}
                        className="max-h-[100px] inline-block bg-transparent"
                      />
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
