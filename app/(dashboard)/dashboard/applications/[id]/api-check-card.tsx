"use client";

import { ApiCheck } from "@/lib/schemas";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  FileText,
  Shield,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import WhoYouIdVerificationResults from "@/components/application-detail/whoyou-id-results";
import WhoYouBankVerificationResults from "@/components/application-detail/whoyou-bank-results";
import WhoYouCellphoneVerificationResults from "@/components/application-detail/whoyou-cellphone-results";

interface CreditCheckData {
  creditScore?: number;
  score?: string;
  reasons?: Array<{
    reasonCode: string;
    reasonDescription: string;
  }>;
  reason?: string;
  parsedData?: {
    results?: Array<{
      score: string;
      reasons: Array<{
        reasonCode: string;
        reasonDescription: string;
      }>;
    }>;
  };
}

interface FraudCheckData {
  pRetData?: string; // Base64 encoded ZIP file
  pTransactionCompleted?: boolean;
  pCBVScore?: string;
  pCurrentDebtReview?: boolean;
  reason?: string;
}

const ApiCheckCard = ({ check }: { check: ApiCheck }) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Narrow helpers for WHOYou payloads
  const isWhoYouIdPayload = (
    payload: unknown
  ): payload is { code: number; detail?: Record<string, any> } => {
    if (!payload || typeof payload !== "object") return false;
    const p = payload as any;
    const d = p?.detail;
    return (
      typeof p.code === "number" &&
      d &&
      typeof d === "object" &&
      typeof d.idNumber === "string" &&
      // Heuristics: presence of at least one ID-verification field
      ("onNPR" in d || "hasPhoto" in d || "dataSource" in d)
    );
  };

  const isWhoYouBankPayload = (
    payload: unknown
  ): payload is {
    code: number;
    detail?: { accountVerificationInformation?: Array<Record<string, any>> };
  } => {
    if (!payload || typeof payload !== "object") return false;
    const p = payload as any;
    const info = p?.detail?.accountVerificationInformation;
    return typeof p.code === "number" && Array.isArray(info);
  };

  const isWhoYouCellphonePayload = (
    payload: unknown
  ): payload is {
    code: number;
    detail?:
      | {
          code?: number;
          detail?: {
            idNumberProvided?: string;
            phoneNumberProvided?: string;
            isMatch?: boolean;
            score?: number;
            phoneNumberType?: string;
          };
        }
      | {
          idNumberProvided?: string;
          phoneNumberProvided?: string;
          isMatch?: boolean;
          score?: number;
          phoneNumberType?: string;
        };
  } => {
    if (!payload || typeof payload !== "object") return false;
    const p = payload as any;
    const d = p?.detail;

    // Handle nested detail structure
    const actualDetail = d?.detail || d;

    return (
      typeof p.code === "number" &&
      d &&
      typeof d === "object" &&
      actualDetail &&
      typeof actualDetail === "object" &&
      typeof actualDetail.phoneNumberProvided === "string" &&
      typeof actualDetail.idNumberProvided === "string" &&
      typeof actualDetail.isMatch === "boolean"
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "passed":
        return "default" as const;
      case "failed":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const handleViewPdf = async () => {
    const fraudData = check.response_payload as FraudCheckData;

    if (!fraudData?.pRetData) {
      console.error("No PDF data available");
      return;
    }

    try {
      // Create a function to extract PDF from ZIP
      const extractPdfFromZip = async (base64ZipData: string) => {
        // Import JSZip dynamically for client-side use
        const JSZip = (await import("jszip")).default;

        // Convert base64 to binary
        const zipData = atob(base64ZipData);
        const zip = new JSZip();

        // Load the ZIP file
        const loadedZip = await zip.loadAsync(zipData, { base64: false });

        // Find PDF files in the ZIP
        const pdfFiles = Object.keys(loadedZip.files).filter((filename) =>
          filename.toLowerCase().endsWith(".pdf")
        );

        if (pdfFiles.length === 0) {
          throw new Error("No PDF files found in ZIP");
        }

        // Extract the first PDF file
        const pdfFile = loadedZip.files[pdfFiles[0]];
        const pdfArrayBuffer = await pdfFile.async("arraybuffer");

        // Create blob URL for the PDF
        const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
        return URL.createObjectURL(pdfBlob);
      };

      const url = await extractPdfFromZip(fraudData.pRetData);
      setPdfUrl(url);
      setShowPdfPreview(true);
    } catch (error) {
      console.error("Error extracting PDF from ZIP:", error);
      alert("Failed to extract PDF from the report data");
    }
  };

  const renderCreditCheckCard = () => {
    const creditData = check.response_payload as CreditCheckData;
    const score =
      creditData?.creditScore ||
      creditData?.score ||
      creditData?.parsedData?.results?.[0]?.score;
    const reasons =
      creditData?.reasons ||
      creditData?.parsedData?.results?.[0]?.reasons ||
      [];

    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Credit Score Check</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(check.status)}
            <Badge variant={getStatusVariant(check.status)}>
              {check.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Vendor
              </p>
              <p className="text-lg font-semibold">{check.vendor}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Checked At
              </p>
              <p className="text-sm">
                {format(new Date(check.checked_at), "PPpp")}
              </p>
            </div>
          </div>

          {score && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Credit Score
                </span>
                <span
                  className={`text-2xl font-bold ${
                    Number(score) >= 600 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {score}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    Number(score) >= 600 ? "bg-green-600" : "bg-red-600"
                  }`}
                  style={{
                    width: `${Math.min((Number(score) / 850) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {reasons.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Score Reasons
              </p>
              <div className="space-y-2">
                {reasons.map((reason, index) => (
                  <div key={index} className="text-sm border rounded p-2">
                    <span className="font-medium">{reason.reasonCode}:</span>{" "}
                    {reason.reasonDescription}
                  </div>
                ))}
              </div>
            </div>
          )}

          {creditData?.reason && (
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <p className="text-sm font-medium">Additional Information</p>
              <p className="text-sm text-muted-foreground">
                {creditData.reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderFraudCheckCard = () => {
    const fraudData = check.response_payload as FraudCheckData;

    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Consumer Credit Report</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(check.status)}
            <Badge variant={getStatusVariant(check.status)}>
              {check.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Vendor
              </p>
              <p className="text-lg font-semibold">{check.vendor}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Checked At
              </p>
              <p className="text-sm">
                {format(new Date(check.checked_at), "PPpp")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Transaction Status
              </p>
              <Badge
                variant={
                  fraudData?.pTransactionCompleted ? "default" : "destructive"
                }
              >
                {fraudData?.pTransactionCompleted ? "Completed" : "Failed"}
              </Badge>
            </div>
            {fraudData?.pCBVScore && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  CBV Score
                </p>
                <p className="text-lg font-semibold">{fraudData.pCBVScore}</p>
              </div>
            )}
          </div>

          {fraudData?.pCurrentDebtReview !== undefined && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Debt Review Status
                </span>
                <Badge
                  variant={
                    fraudData.pCurrentDebtReview ? "destructive" : "default"
                  }
                >
                  {fraudData.pCurrentDebtReview
                    ? "Under Debt Review"
                    : "Not Under Debt Review"}
                </Badge>
              </div>
            </div>
          )}

          {fraudData?.pRetData && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Full Credit Report</p>
                  <p className="text-xs text-muted-foreground">
                    PDF document available for review
                  </p>
                </div>
                <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
                  <DialogTrigger asChild>
                    <Button onClick={handleViewPdf} variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="!max-w-[95vw] !w-[95vw] !h-[95vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                      <DialogTitle>Credit Report Preview</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 p-6 pt-0">
                      {pdfUrl && (
                        <iframe
                          src={pdfUrl}
                          className="w-full h-full border rounded"
                          title="Credit Report PDF"
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {fraudData?.reason && (
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <p className="text-sm font-medium">Additional Information</p>
              <p className="text-sm text-muted-foreground">
                {fraudData.reason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderGenericCard = () => {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">
              {check.check_type.replace("_", " ").toUpperCase()}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(check.status)}
            <Badge variant={getStatusVariant(check.status)}>
              {check.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Vendor
              </p>
              <p className="text-lg font-semibold">{check.vendor}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Checked At
              </p>
              <p className="text-sm">
                {format(new Date(check.checked_at), "PPpp")}
              </p>
            </div>
          </div>

          {check.response_payload && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Response Data
              </p>
              <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                {JSON.stringify(check.response_payload, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Determine which card to render based on check type
  // Prefer payload-shape detection for WHOYou checks
  if (isWhoYouBankPayload(check.response_payload)) {
    return (
      <WhoYouBankVerificationResults data={check.response_payload as any} />
    );
  }

  if (isWhoYouIdPayload(check.response_payload)) {
    return <WhoYouIdVerificationResults data={check.response_payload as any} />;
  }

  if (isWhoYouCellphonePayload(check.response_payload)) {
    // Handle nested detail structure
    const payload = check.response_payload as any;
    const normalizedPayload = {
      code: payload.code,
      detail: payload.detail?.detail || payload.detail,
    };

    return <WhoYouCellphoneVerificationResults data={normalizedPayload} />;
  }

  switch (check.check_type) {
    case "credit_bureau":
      return renderCreditCheckCard();
    case "fraud_check":
      return renderFraudCheckCard();
    default:
      return renderGenericCard();
  }
};

export default ApiCheckCard;
