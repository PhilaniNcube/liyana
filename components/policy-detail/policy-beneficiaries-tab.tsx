"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import { formatDate } from "date-fns";
import type { Database } from "@/lib/types";

type PartyRow = Database["public"]["Tables"]["parties"]["Row"];
type PolicyBeneficiaryRow =
  Database["public"]["Tables"]["policy_beneficiaries"]["Row"];

type BeneficiaryWithDetails = PolicyBeneficiaryRow & {
  party: Partial<PartyRow> | null;
  id_number: string | null;
};

interface PolicyBeneficiariesTabProps {
  beneficiaries: BeneficiaryWithDetails[];
}

const parseJsonField = (jsonField: any) => {
  if (!jsonField) return null;
  try {
    return typeof jsonField === "string" ? JSON.parse(jsonField) : jsonField;
  } catch {
    return null;
  }
};

export default function PolicyBeneficiariesTab({
  beneficiaries,
}: PolicyBeneficiariesTabProps) {
  return (
    <div className="space-y-6">
      {beneficiaries && beneficiaries.length > 0 ? (
        beneficiaries.map((beneficiary) => {
          const party = beneficiary.party;
          const fullName = party
            ? `${party.first_name || ""} ${party.last_name || ""}`.trim() ||
              party.organization_name ||
              "Unknown"
            : "Unknown";

          return (
            <Card key={beneficiary.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {fullName}
                  </div>
                </CardTitle>
                <CardDescription>
                  {beneficiary.relation_type.charAt(0).toUpperCase() +
                    beneficiary.relation_type.slice(1)}{" "}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Full Name</p>
                      <p className="text-sm text-muted-foreground">
                        {fullName}
                      </p>
                    </div>
                    {beneficiary.id_number && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">ID Number</p>
                          <p className="text-sm text-muted-foreground">
                            {beneficiary.id_number}
                          </p>
                        </div>
                      </>
                    )}
                    {party?.date_of_birth && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Date of Birth</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(party.date_of_birth, "PP")}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Relationship</p>
                      <p className="text-sm text-muted-foreground">
                        {beneficiary.relation_type.charAt(0).toUpperCase() +
                          beneficiary.relation_type.slice(1)}
                      </p>
                    </div>

                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Added</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(beneficiary.created_at, "PP")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information if available */}
                {party?.contact_details && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h4 className="text-sm font-medium mb-4">
                        Contact Information
                      </h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        {(() => {
                          const contactDetails = parseJsonField(
                            party.contact_details
                          );
                          if (!contactDetails) return null;

                          return (
                            <>
                              {contactDetails.email && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Email
                                  </p>
                                  <p className="text-sm">
                                    {contactDetails.email}
                                  </p>
                                </div>
                              )}
                              {contactDetails.phone && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Phone
                                  </p>
                                  <p className="text-sm">
                                    {contactDetails.phone}
                                  </p>
                                </div>
                              )}
                              {contactDetails.mobile && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Mobile
                                  </p>
                                  <p className="text-sm">
                                    {contactDetails.mobile}
                                  </p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}

                {/* Address Information if available */}
                {party?.address_details && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h4 className="text-sm font-medium mb-4">
                        Address Information
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        {(() => {
                          const addressDetails = parseJsonField(
                            party.address_details
                          );
                          if (!addressDetails) return null;

                          return (
                            <>
                              {addressDetails.street && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Street Address
                                  </p>
                                  <p className="text-sm">
                                    {addressDetails.street}
                                  </p>
                                </div>
                              )}
                              {addressDetails.city && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    City
                                  </p>
                                  <p className="text-sm">
                                    {addressDetails.city}
                                  </p>
                                </div>
                              )}
                              {addressDetails.province && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Province
                                  </p>
                                  <p className="text-sm">
                                    {addressDetails.province}
                                  </p>
                                </div>
                              )}
                              {addressDetails.postal_code && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Postal Code
                                  </p>
                                  <p className="text-sm">
                                    {addressDetails.postal_code}
                                  </p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Beneficiaries Found
            </h3>
            <p className="text-muted-foreground">
              There are no beneficiaries assigned to this policy.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
