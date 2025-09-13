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
import type { PolicyWithAllData } from "@/lib/queries/policy-details";
import { toast } from "sonner";

type Beneficiary = PolicyWithAllData["beneficiaries"][0];

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
  user_id: string;
}

export default function PolicyBeneficiariesTab({
  beneficiaries,
  user_id,
}: PolicyBeneficiariesTabProps) {
  const [beneficiariesWithStatus, setBeneficiariesWithStatus] = useState<
    BeneficiaryWithDeceasedStatus[]
  >(beneficiaries.map((b) => ({ ...b })));
  const { checkDeceasedStatus } = useDeceasedStatusCheck();

  const handleCheckDeceasedStatus = async (idNumber: string) => {
    // Find the beneficiary index to update the correct state
    const beneficiaryIndex = beneficiariesWithStatus.findIndex(
      (b) => b.id_number === idNumber
    );

    if (beneficiaryIndex === -1) {
      toast.error("Beneficiary not found");
      return;
    }

    // Update loading state
    setBeneficiariesWithStatus((prev) =>
      prev.map((b, index) =>
        index === beneficiaryIndex
          ? { ...b, isCheckingDeceased: true, deceasedCheckError: null }
          : b
      )
    );

    try {
      toast.loading("Checking deceased status...", { id: "deceased-check" });

      const response = await fetch("/api/kyc/deceased-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_number: idNumber, user_id: user_id }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        let errorMessage = data.error || "Failed to check deceased status";

        if (response.status === 400 && data.details) {
          try {
            const details =
              typeof data.details === "string"
                ? JSON.parse(data.details)
                : data.details;

            if (details.code === 10084) {
              errorMessage =
                "Deceased status check service is temporarily unavailable. Please contact support for assistance.";
            }
          } catch (parseError) {
            // Use the original error if parsing fails
          }
        }

        throw new Error(errorMessage);
      }

      // Success - update state with the results
      const deceasedInfo = data.data?.detail?.deceasedStatusInformation || null;

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

      // Show success toast
      const hasDeceasedRecord = deceasedInfo?.some(
        (record: DeceasedStatusInformation) => record.isDeceased
      );
      if (hasDeceasedRecord) {
        toast.error("Deceased records found for this beneficiary", {
          id: "deceased-check",
        });
      } else {
        toast.success(
          "Deceased status check completed - No deceased records found",
          { id: "deceased-check" }
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Update error state
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

      // Show error toast
      toast.error(errorMessage, { id: "deceased-check" });
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
            <span>Covered Persons ({beneficiariesWithStatus.length})</span>
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
                    {beneficiary.party?.contact_details &&
                      typeof beneficiary.party.contact_details === "object" &&
                      beneficiary.party.contact_details !== null && (
                        <div className="text-xs text-muted-foreground">
                          {(beneficiary.party.contact_details as any).phone && (
                            <div>
                              Phone:{" "}
                              {(beneficiary.party.contact_details as any).phone}
                            </div>
                          )}
                          {(beneficiary.party.contact_details as any).email && (
                            <div>
                              Email:{" "}
                              {(beneficiary.party.contact_details as any).email}
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
                          onClick={() =>
                            handleCheckDeceasedStatus(beneficiary.id_number!)
                          }
                          className="text-xs"
                        >
                          Check Deceased Status
                        </Button>
                      )}
                  </div>
                </div>

                {beneficiary.deceasedCheckError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700 font-medium">
                          {beneficiary.deceasedCheckError.includes(
                            "temporarily unavailable"
                          ) ||
                          beneficiary.deceasedCheckError.includes("service")
                            ? "Service Temporarily Unavailable"
                            : "Check Failed"}
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                          {beneficiary.deceasedCheckError}
                        </p>
                        {beneficiary.deceasedCheckError.includes(
                          "temporarily unavailable"
                        ) ||
                        beneficiary.deceasedCheckError.includes("service") ? (
                          <p className="text-xs text-red-500 mt-2">
                            Please try again later or contact support if the
                            issue persists.
                          </p>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCheckDeceasedStatus(beneficiary.id_number!)
                            }
                            className="text-xs mt-2"
                          >
                            Retry Check
                          </Button>
                        )}
                      </div>
                    </div>
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
