"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CreditCard,
  User,
  FileText,
  DollarSign,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import type { PolicyWithProduct } from "@/lib/queries/policies";
import type { Database } from "@/lib/database.types";

// Types
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

interface PolicyDetailProps {
  policy: PolicyWithProduct;
  claims: ClaimWithDetails[];
  beneficiaries: BeneficiaryWithDetails[];
}

export default function PolicyDetail({
  policy,
  claims,
  beneficiaries,
}: PolicyDetailProps) {
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

  const getProductTypeIcon = (productType: string | null) => {
    switch (productType?.toLowerCase()) {
      case "funeral":
        return <Shield className="h-12 w-12" />;
      case "life":
        return <User className="h-12 w-12" />;
      default:
        return <FileText className="h-12 w-12" />;
    }
  };

  const parseJsonField = (jsonField: any) => {
    if (!jsonField) return null;
    try {
      return typeof jsonField === "string" ? JSON.parse(jsonField) : jsonField;
    } catch {
      return null;
    }
  };

  const getClaimStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getClaimStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "declined":
        return "destructive";
      case "paid":
        return "outline";
      default:
        return "secondary";
    }
  };

  const holder = policy.policy_holder;
  const holderName =
    holder?.organization_name ||
    [holder?.first_name, holder?.last_name].filter(Boolean).join(" ");
  const addressDetails = parseJsonField(holder?.address_details);
  const contactDetails = parseJsonField(holder?.contact_details);
  const bankingDetails = parseJsonField(holder?.banking_details);
  const employmentDetails = parseJsonField(policy.employment_details);

  console.log(employmentDetails);

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getProductTypeIcon(policy.product_type)}
            <div>
              <h1 className="text-3xl font-bold">
                {policy.product_type === "funeral_policy"
                  ? "Funeral Cover"
                  : policy.product_type === "life_insurance"
                    ? "Life Insurance"
                    : "General Insurance"}{" "}
              </h1>
              <p className="text-muted-foreground">Policy ID: {policy.id}</p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(policy.policy_status)}>
            {policy.policy_status.charAt(0).toUpperCase() +
              policy.policy_status.slice(1)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holder">Policy Holder</TabsTrigger>
          <TabsTrigger value="financial">Financial Details</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="claims">
            Claims {claims.length > 0 && `(${claims.length})`}
          </TabsTrigger>
          <TabsTrigger value="beneficiaries">
            Beneficiaries{" "}
            {beneficiaries.length > 0 && `(${beneficiaries.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
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
                    {policy.start_date
                      ? formatDate(policy.start_date, "PP")
                      : "N/A"}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">End Date</p>
                  <p className="text-sm text-muted-foreground">
                    {policy.end_date
                      ? formatDate(policy.end_date, "PP")
                      : "N/A"}
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
                  <DollarSign className="h-5 w-5" />
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
                    <p className="text-xs text-muted-foreground">
                      per {policy.frequency}
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
                    <p className="text-sm font-medium">Beneficiaries</p>
                    <p className="text-2xl font-bold">{beneficiaries.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {beneficiaries.length === 1
                        ? "beneficiary"
                        : "beneficiaries"}{" "}
                      assigned
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Claims</p>
                    <p className="text-2xl font-bold">{claims.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {claims.length === 1 ? "claim" : "claims"} filed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Total Allocation</p>
                    <p className="text-2xl font-bold">
                      {beneficiaries.reduce(
                        (sum, b) => sum + b.allocation_percentage,
                        0
                      )}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      coverage allocated
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Policy Holder Tab */}
        <TabsContent value="holder">
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
        </TabsContent>

        {/* Financial Details Tab */}
        <TabsContent value="financial">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
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
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Branch Code</p>
                      <p className="text-sm text-muted-foreground">
                        {bankingDetails.branch_code}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment">
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
                      <p className="text-sm text-muted-foreground">
                        {employmentDetails.employment_type
                          .charAt(0)
                          .toUpperCase() +
                          employmentDetails.employment_type.slice(1)}
                      </p>
                    </div>
                  )}
                  {employmentDetails.end_date && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Employment End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(employmentDetails.end_date, "PP")}
                      </p>
                    </div>
                  )}
                  {employmentDetails.employer_contact_number && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Work Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {employmentDetails.employer_contact_number}
                      </p>
                    </div>
                  )}
                  {employmentDetails.employer_address && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Work Address</p>
                      <p className="text-sm text-muted-foreground">
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
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims">
          <div className="space-y-6">
            {claims && claims.length > 0 ? (
              claims.map((claim) => (
                <Card key={claim.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getClaimStatusIcon(claim.status)}
                        Claim #{claim.claim_number}
                      </div>
                      <Badge variant={getClaimStatusBadgeVariant(claim.status)}>
                        {claim.status.charAt(0).toUpperCase() +
                          claim.status.slice(1)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Filed on {formatDate(claim.date_filed, "PP")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            Date of Incident
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(claim.date_of_incident, "PP")}
                          </p>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Claimant</p>
                          <p className="text-sm text-muted-foreground">
                            {claim.claimant
                              ? `${claim.claimant.first_name || ""} ${claim.claimant.last_name || ""}`.trim() ||
                                claim.claimant.organization_name ||
                                "Unknown"
                              : "Unknown"}
                          </p>
                        </div>
                        {claim.claimant?.id_number && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                Claimant ID Number
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {claim.claimant.id_number}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Status</p>
                          <div className="flex items-center gap-2">
                            {getClaimStatusIcon(claim.status)}
                            <span className="text-sm text-muted-foreground">
                              {claim.status.charAt(0).toUpperCase() +
                                claim.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Claim Created</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(claim.created_at, "PP")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Claim Payouts */}
                    {claim.claim_payouts && claim.claim_payouts.length > 0 && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h4 className="text-sm font-medium mb-4">Payouts</h4>
                          <div className="space-y-3">
                            {claim.claim_payouts.map((payout, index) => (
                              <div
                                key={payout.id}
                                className="border rounded-lg p-4"
                              >
                                <div className="grid gap-4 md:grid-cols-3">
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      Amount
                                    </p>
                                    <p className="text-sm">
                                      {payout.amount
                                        ? formatCurrency(payout.amount)
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      Payout Date
                                    </p>
                                    <p className="text-sm">
                                      {payout.payout_date
                                        ? formatDate(payout.payout_date, "PP")
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      Beneficiary
                                    </p>
                                    <p className="text-sm">
                                      {payout.beneficiary
                                        ? `${payout.beneficiary.first_name || ""} ${payout.beneficiary.last_name || ""}`.trim() ||
                                          payout.beneficiary
                                            .organization_name ||
                                          "Unknown"
                                        : "Unknown"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Claims Found
                  </h3>
                  <p className="text-muted-foreground">
                    There are no claims associated with this policy.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Beneficiaries Tab */}
        <TabsContent value="beneficiaries">
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
                        <Badge variant="outline">
                          {beneficiary.allocation_percentage}%
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {beneficiary.relation_type.charAt(0).toUpperCase() +
                          beneficiary.relation_type.slice(1)}{" "}
                        • {beneficiary.allocation_percentage}% allocation
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
                                <p className="text-sm font-medium">
                                  Date of Birth
                                </p>
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
                              {beneficiary.relation_type
                                .charAt(0)
                                .toUpperCase() +
                                beneficiary.relation_type.slice(1)}
                            </p>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              Allocation Percentage
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-bold">
                                {beneficiary.allocation_percentage}%
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${beneficiary.allocation_percentage}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
