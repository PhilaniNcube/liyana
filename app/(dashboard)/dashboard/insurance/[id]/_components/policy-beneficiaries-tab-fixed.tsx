"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Skull, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "date-fns";
import { useDeceasedStatusCheck } from "@/hooks/use-deceased-status-check";
import { DeceasedStatusInformation } from "@/lib/schemas";

type Beneficiary = {
  id: number;
  relation_type: string | null;
  allocation_percentage: number | null;
  beneficiary_party_id: string;
  party?: {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    contact_details?: any;
    id_number?: string; // encrypted version from the party table
  } | null;
  id_number?: string | null; // decrypted version from the query
};

type BeneficiaryWithDeceasedStatus = Beneficiary & {
  deceasedStatus?: DeceasedStatusInformation[] | null;
  isCheckingDeceased?: boolean;
  deceasedCheckError?: string | null;
};

function formatName(party: Beneficiary["party"]) {
  if (!party) return "Unknown";
  const parts = [party.first_name ?? "", party.last_name ?? ""].filter(Boolean);
  return parts.length ? parts.join(" ") : "Unknown";
}

function formatRelationship(rel: string | null | undefined) {
  if (!rel) return "—";
  return rel.charAt(0).toUpperCase() + rel.slice(1).replace(/_/g, " ");
}

interface PolicyBeneficiariesTabProps {
  beneficiaries: Beneficiary[];
}

export default function PolicyBeneficiariesTab({
  beneficiaries,
}: PolicyBeneficiariesTabProps) {
  const [beneficiariesWithStatus, setBeneficiariesWithStatus] = useState<
    BeneficiaryWithDeceasedStatus[]
  >(beneficiaries.map((b) => ({ ...b })));
  const { checkDeceasedStatus } = useDeceasedStatusCheck();

  const handleCheckDeceasedStatus = async (beneficiaryIndex: number) => {
    const beneficiary = beneficiariesWithStatus[beneficiaryIndex];

    // Check if we have the encrypted ID number from the party
    if (!beneficiary.party?.id_number) {
      // Fallback: look up the party to get encrypted ID number
      console.warn(
        "No encrypted ID number available for beneficiary",
        beneficiary.id
      );
      return;
    }

    // Update the loading state
    setBeneficiariesWithStatus((prev) =>
      prev.map((b, index) =>
        index === beneficiaryIndex
          ? { ...b, isCheckingDeceased: true, deceasedCheckError: null }
          : b
      )
    );

    try {
      const deceasedInfo = await checkDeceasedStatus(
        beneficiary.party.id_number
      );

      setBeneficiariesWithStatus((prev) =>
        prev.map((b, index) =>
          index === beneficiaryIndex
            ? {
                ...b,
                isCheckingDeceased: false,
                deceasedStatus: deceasedInfo,
                deceasedCheckError: null,
              }
            : b
        )
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to check deceased status";
      setBeneficiariesWithStatus((prev) =>
        prev.map((b, index) =>
          index === beneficiaryIndex
            ? {
                ...b,
                isCheckingDeceased: false,
                deceasedCheckError: errorMessage,
              }
            : b
        )
      );
    }
  };

  const renderDeceasedStatusBadge = (
    beneficiary: BeneficiaryWithDeceasedStatus
  ) => {
    if (beneficiary.isCheckingDeceased) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking...
        </Badge>
      );
    }

    if (beneficiary.deceasedCheckError) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Check Failed
        </Badge>
      );
    }

    if (beneficiary.deceasedStatus) {
      const hasDeceasedRecord = beneficiary.deceasedStatus.some(
        (record) => record.isDeceased
      );

      if (hasDeceasedRecord) {
        return (
          <Badge variant="destructive" className="gap-1">
            <Skull className="h-3 w-3" />
            Deceased
          </Badge>
        );
      } else {
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified Alive
          </Badge>
        );
      }
    }

    return null;
  };

  const renderDeceasedStatusDetails = (
    beneficiary: BeneficiaryWithDeceasedStatus
  ) => {
    if (
      !beneficiary.deceasedStatus ||
      beneficiary.deceasedStatus.length === 0
    ) {
      return null;
    }

    const deceasedRecords = beneficiary.deceasedStatus.filter(
      (record) => record.isDeceased
    );

    if (deceasedRecords.length === 0) {
      return (
        <div className="mt-2 p-2 bg-green-50 rounded-md">
          <p className="text-sm text-green-700">
            No deceased records found for this beneficiary.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        {deceasedRecords.map((record, index) => (
          <div
            key={record.id}
            className="p-3 bg-red-50 border border-red-200 rounded-md"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                <Skull className="h-4 w-4" />
                Deceased Record {index + 1}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-red-700">
                {record.firstName && (
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {record.firstName} {record.surname || ""}
                  </div>
                )}
                {record.dateOfDeath && (
                  <div>
                    <span className="font-medium">Date of Death:</span>{" "}
                    {formatDate(new Date(record.dateOfDeath), "PP")}
                  </div>
                )}
                {record.source && (
                  <div>
                    <span className="font-medium">Source:</span> {record.source}
                  </div>
                )}
                {record.status && (
                  <div>
                    <span className="font-medium">Status:</span> {record.status}
                  </div>
                )}
                {record.estateNumber && (
                  <div>
                    <span className="font-medium">Estate Number:</span>{" "}
                    {record.estateNumber}
                  </div>
                )}
                {record.executorName && (
                  <div className="col-span-2">
                    <span className="font-medium">Executor:</span>{" "}
                    {record.executorName}
                  </div>
                )}
                {record.executorAddress && (
                  <div className="col-span-2">
                    <span className="font-medium">Executor Address:</span>{" "}
                    {record.executorAddress}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (beneficiariesWithStatus.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No beneficiaries found for this policy.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAllocation = beneficiariesWithStatus.reduce(
    (sum, b) =>
      sum +
      (Number.isFinite(b.allocation_percentage as number)
        ? (b.allocation_percentage as number)
        : 0),
    0
  );

  const hasPayoutAllocations = totalAllocation > 0;
  const allocationWarning = hasPayoutAllocations && totalAllocation !== 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Beneficiaries ({beneficiariesWithStatus.length})</span>
            {hasPayoutAllocations && (
              <Badge variant={allocationWarning ? "destructive" : "secondary"}>
                Total Allocation: {totalAllocation}%
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {beneficiariesWithStatus.map((beneficiary, index) => (
              <div
                key={beneficiary.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {formatName(beneficiary.party)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatRelationship(beneficiary.relation_type)}
                    </div>
                    {beneficiary.id_number && (
                      <div className="text-xs text-muted-foreground">
                        ID: {beneficiary.id_number}
                      </div>
                    )}
                    {beneficiary.party?.contact_details && (
                      <div className="text-xs text-muted-foreground">
                        {beneficiary.party.contact_details.phone && (
                          <div>
                            Phone: {beneficiary.party.contact_details.phone}
                          </div>
                        )}
                        {beneficiary.party.contact_details.email && (
                          <div>
                            Email: {beneficiary.party.contact_details.email}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {renderDeceasedStatusBadge(beneficiary)}

                    {beneficiary.party?.id_number &&
                      !beneficiary.deceasedStatus &&
                      !beneficiary.isCheckingDeceased && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckDeceasedStatus(index)}
                          className="text-xs"
                        >
                          Check Deceased Status
                        </Button>
                      )}
                  </div>
                </div>

                {beneficiary.deceasedCheckError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                      Error: {beneficiary.deceasedCheckError}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckDeceasedStatus(index)}
                      className="text-xs mt-2"
                    >
                      Retry Check
                    </Button>
                  </div>
                )}

                {renderDeceasedStatusDetails(beneficiary)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
