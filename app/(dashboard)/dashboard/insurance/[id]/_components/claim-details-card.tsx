"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  LinkIcon,
  Activity,
  CheckCircle2,
  AlertTriangle,
  EyeIcon,
} from "lucide-react";
import { formatDate } from "date-fns";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Database } from "@/lib/database.types";
import { SendClaimToLinarDialog } from "./send-claim-to-linar-dialog";
import { useParams } from "next/navigation";
import { usePolicyDocuments } from "@/hooks/use-policy-documents";
import { createClient } from "@/lib/client";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

export interface ClaimDetailsPayout {
  id: number;
  amount: number;
  payout_date: string;
  beneficiary: { first_name?: string | null; last_name?: string | null } | null;
}

export interface ClaimDetailsClaimant {
  first_name?: string | null;
  last_name?: string | null;
  contact_details?: any;
}

export interface ClaimDetailsClaim {
  id: number;
  claim_number: string;
  date_filed: string;
  date_of_incident: string;
  created_at: string;
  status: string;
  claim_amount?: number | null;
  approved_amount?: number | null;
  claimant: ClaimDetailsClaimant | null;
  payouts: ClaimDetailsPayout[];
}

interface ClaimDetailsCardProps {
  claim: ClaimDetailsClaim;
  // Optionally pre-provide documents to avoid re-fetch
  documents?: PolicyDocumentRow[];
  // Provide policy id for fallback fetch
  policyId: number;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  birth_certificate: "Birth Certificate",
  death_certificate: "Death Certificate",
  marriage_certificate: "Marriage Certificate",
  identity_document: "Identity Document",
  passport: "Passport",
};

function formatName(
  person: { first_name?: string | null; last_name?: string | null } | null
) {
  if (!person) return "Unknown";
  const parts = [person.first_name ?? "", person.last_name ?? ""].filter(
    Boolean
  );
  return parts.length ? parts.join(" ") : "Unknown";
}

function getDocumentUrl(documentPath: string) {
  const supabase = createClient();
  const { data } = supabase.storage
    .from("documents")
    .getPublicUrl(documentPath);
  return data.publicUrl;
}

function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "paid":
      return "default";
    case "pending":
    case "submitted":
      return "secondary";
    case "rejected":
    case "declined":
    case "denied":
      return "destructive";
    default:
      return "outline";
  }
}

export default function ClaimDetailsCard({
  claim,
  documents: initialDocs,
  policyId,
}: ClaimDetailsCardProps) {
  const params = useParams();

  console.log("ClaimDetailsCard params:", params);

  // Use TanStack Query to fetch policy documents
  const {
    data: allDocs = [],
    isLoading: loadingDocs,
    error: docsError,
  } = usePolicyDocuments(policyId);

  // If initialDocs provided, use them as initial data, otherwise use query result
  const documentsToUse = initialDocs || allDocs;

  const [error, setError] = useState<string | null>(
    docsError ? docsError.message : null
  );
  // Death status mock state
  const [deathStatus, setDeathStatus] = useState<null | {
    result: "DECEASED_CONFIRMED" | "NO_RECORD" | "PENDING" | "INVALID_ID";
    checkedAt: string;
    idNumber: string;
  }>(null);
  const [checkingDeath, setCheckingDeath] = useState(false);
  const [deathCheckError, setDeathCheckError] = useState<string | null>(null);
  const inferredIdNumber =
    (claim as any)?.claimant?.id_number ||
    (claim as any)?.claimant?.contact_details?.id_number ||
    "";
  // Keep internally; do not show
  const [idNumberInput] = useState<string>(inferredIdNumber);

  const performMockDeathCheck = async () => {
    setDeathCheckError(null);
    const idNum = idNumberInput.trim();
    if (!idNum) {
      setDeathCheckError("ID number is required");
      return;
    }
    if (idNum.length < 6) {
      setDeathCheckError("ID number seems too short");
      setDeathStatus({
        result: "INVALID_ID",
        checkedAt: new Date().toISOString(),
        idNumber: idNum,
      });
      return;
    }
    setCheckingDeath(true);
    setDeathStatus({
      result: "PENDING",
      checkedAt: new Date().toISOString(),
      idNumber: idNum,
    });
    try {
      // Mock latency
      await new Promise((r) => setTimeout(r, 1200));
      // Simple deterministic mock:
      // Last numeric digit even -> deceased confirmed; odd -> no record
      const lastDigitMatch = idNum.replace(/\D/g, "").slice(-1);
      let result: "DECEASED_CONFIRMED" | "NO_RECORD" = "NO_RECORD";
      if (lastDigitMatch && parseInt(lastDigitMatch) % 2 === 0) {
        result = "DECEASED_CONFIRMED";
      }
      setDeathStatus({
        result,
        checkedAt: new Date().toISOString(),
        idNumber: idNum,
      });
    } catch (e: any) {
      setDeathCheckError(e.message || "Unexpected error during mock check");
    } finally {
      setCheckingDeath(false);
    }
  };

  // Filter claim documents from the fetched documents
  const claimDocuments = documentsToUse.filter((d) => d.claim_id === claim.id);

  return (
    <Card className="max-w-7xl w-full mx-auto relative">
      <CardHeader>
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <CardTitle className="flex bg-yellow-200 p-2 rounded-md items-start w-full justify-between gap-2 text-base sm:text-lg">
            <div className="flex flex-col">
              <Badge variant={getStatusVariant(claim.status)}>
                {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
              </Badge>
              <span>Claim #{claim.claim_number}</span>
            </div>
            <div className="">
              <div className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Death Status Check
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={performMockDeathCheck}
                disabled={checkingDeath || !idNumberInput}
                className="whitespace-nowrap"
              >
                {checkingDeath ? (
                  <>
                    <Activity className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Checking
                  </>
                ) : (
                  <>Check Death Status</>
                )}
              </Button>
              {!idNumberInput && (
                <div className="text-[11px] text-muted-foreground">
                  No ID number available for claimant.
                </div>
              )}
              {deathCheckError && (
                <div className="text-[11px] text-destructive">
                  {deathCheckError}
                </div>
              )}
              {deathStatus && (
                <div className="flex items-center gap-2 text-xs rounded border px-2 py-1 bg-muted/40">
                  {deathStatus.result === "PENDING" && (
                    <Activity className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  {deathStatus.result === "DECEASED_CONFIRMED" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  )}
                  {deathStatus.result === "NO_RECORD" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  {deathStatus.result === "INVALID_ID" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {deathStatus.result === "PENDING" && "Checking..."}
                    {deathStatus.result === "DECEASED_CONFIRMED" &&
                      "Deceased Confirmed"}
                    {deathStatus.result === "NO_RECORD" &&
                      "No Death Record Found"}
                    {deathStatus.result === "INVALID_ID" && "Invalid ID"}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formatDate(deathStatus.checkedAt, "Pp")}
                  </span>
                </div>
              )}
            </div>
          </CardTitle>
          {/* Action buttons */}
          <div className="flex gap-2 mt-2">
            <SendClaimToLinarDialog
              claimId={claim.id}
              claimNumber={claim.claim_number}
              claimantName={formatName(claim.claimant)}
              policyId={policyId}
              documents={documentsToUse}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Claimant</div>
            <div className="font-medium">{formatName(claim.claimant)}</div>
            {claim.claimant?.contact_details && (
              <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                {claim.claimant.contact_details.phone && (
                  <div>📞 {claim.claimant.contact_details.phone}</div>
                )}
                {claim.claimant.contact_details.email && (
                  <div>✉️ {claim.claimant.contact_details.email}</div>
                )}
              </div>
            )}
            {/* Death Status Mock Section (ID hidden) */}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Incident Date</div>
            <div>{formatDate(claim.date_of_incident, "PP")}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Filed</div>
            <div>{formatDate(claim.date_filed, "PP")}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Submitted</div>
            <div>{formatDate(claim.created_at, "PP")}</div>
          </div>
          {claim.claim_amount && (
            <div>
              <div className="text-xs text-muted-foreground">Claim Amount</div>
              <div className="font-medium">
                {formatCurrency(claim.claim_amount)}
              </div>
            </div>
          )}
          {claim.approved_amount && (
            <div>
              <div className="text-xs text-muted-foreground">
                Approved Amount
              </div>
              <div className="font-medium">
                {formatCurrency(claim.approved_amount)}
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Supporting Documents
          </h4>
          {loadingDocs && (
            <div className="text-sm text-muted-foreground">
              Loading documents...
            </div>
          )}
          {error && <div className="text-sm text-destructive">{error}</div>}
          {!loadingDocs && !error && claimDocuments.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No documents linked to this claim.
            </div>
          )}
          <ul className="space-y-2">
            {claimDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between p-2 rounded border bg-muted/30"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[220px]">
                      {DOCUMENT_TYPE_LABELS[doc.document_type] ||
                        doc.document_type}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      ID: {doc.id}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title="Open"
                  >
                    <a
                      href={getDocumentUrl(doc.path)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Download"
                  >
                    <a href={getDocumentUrl(doc.path)} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Payouts Section */}
        {claim.payouts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Payouts</h4>
            <div className="space-y-2">
              {claim.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {formatName(payout.beneficiary)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(payout.payout_date, "PP")}
                    </div>
                  </div>
                  <div className="text-right">
                    {payout.amount && (
                      <div className="font-medium">
                        {formatCurrency(payout.amount)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {formatDate(payout.payout_date, "PP")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
