"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  User,
  Calendar,
  MapPin,
  Eye,
} from "lucide-react";
import type { WhoYouOtvResultsResponse } from "@/lib/schemas";

interface OtvResultsDialogProps {
  applicationId: number;
  children: React.ReactNode;
}

export function OtvResultsDialog({
  applicationId,
  children,
}: OtvResultsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otvData, setOtvData] = useState<{
    application: any;
    otvResults: WhoYouOtvResultsResponse;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOtvCheck = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/kyc/otv-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: applicationId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError(result.error || "No OTV check found for this application");
        } else {
          setError(result.error || "Failed to fetch OTV results");
        }
        return;
      }

      setOtvData(result);
      toast.success("OTV results loaded successfully");
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      toast.error("Failed to load OTV results");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("verified") || statusLower.includes("green")) {
      return "bg-green-100 text-green-800";
    }
    if (statusLower.includes("failed") || statusLower.includes("red")) {
      return "bg-red-100 text-red-800";
    }
    if (statusLower.includes("review") || statusLower.includes("yellow")) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("verified") || statusLower.includes("green")) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (statusLower.includes("failed") || statusLower.includes("red")) {
      return <XCircle className="h-4 w-4" />;
    }
    if (statusLower.includes("review") || statusLower.includes("yellow")) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <Shield className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            OTV Verification Results
          </DialogTitle>
          <DialogDescription>
            One-Time Verification results for Application #{applicationId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!otvData && !error && (
            <div className="text-center py-8">
              <Button
                onClick={handleOtvCheck}
                disabled={isLoading}
                size="lg"
                className="min-w-32"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Check OTV Results
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Unable to load OTV results</p>
                    <p className="text-sm text-orange-600">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {otvData && (
            <>
              {/* Overall Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Status:</span>
                    <Badge
                      className={getStatusColor(
                        otvData.otvResults.detail.otvStatus?.name || "N/A"
                      )}
                    >
                      {getStatusIcon(
                        otvData.otvResults.detail.otvStatus?.name || "N/A"
                      )}
                      <span className="ml-2">
                        {otvData.otvResults.detail.otvStatus?.name || "N/A"}
                      </span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">HANIS Result:</span>
                    <Badge
                      className={getStatusColor(
                        otvData.otvResults.detail.hanisResult || "N/A"
                      )}
                    >
                      {getStatusIcon(
                        otvData.otvResults.detail.hanisResult || "N/A"
                      )}
                      <span className="ml-2">
                        {otvData.otvResults.detail.hanisResult || "N/A"}
                      </span>
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Status Description:</strong>{" "}
                      {otvData.otvResults.detail.otvStatus?.description ||
                        "N/A"}
                    </p>
                    <p>
                      <strong>Data Source:</strong>{" "}
                      {otvData.otvResults.detail.dataSource || "N/A"}
                    </p>
                    <p>
                      <strong>Verification Date:</strong>{" "}
                      {formatDate(otvData.otvResults.detail.dateStamp)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">ID Number</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {otvData.otvResults.detail.idNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm text-muted-foreground">
                      {otvData.otvResults.detail.firstNames || "N/A"}{" "}
                      {otvData.otvResults.detail.surname || ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(otvData.otvResults.detail.dateOfBirth) ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-muted-foreground">
                      {otvData.otvResults.detail.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {otvData.otvResults.detail.status || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Country Code</p>
                    <p className="text-sm text-muted-foreground">
                      {otvData.otvResults.detail.idvCountryCode || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Document Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Face Verification</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getStatusColor(
                            otvData.otvResults.detail.documentResult
                              ?.faceVerificationResult || "N/A"
                          )}
                        >
                          {otvData.otvResults.detail.documentResult
                            ?.faceVerificationResult || "N/A"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Score:{" "}
                          {otvData.otvResults.detail.documentResult
                            ?.faceVerificationScore || "N/A"}
                          {otvData.otvResults.detail.documentResult
                            ?.faceVerificationScore
                            ? "%"
                            : ""}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Information Verification
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getStatusColor(
                            otvData.otvResults.detail.documentResult
                              ?.informationResult || "N/A"
                          )}
                        >
                          {otvData.otvResults.detail.documentResult
                            ?.informationResult || "N/A"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Score:{" "}
                          {otvData.otvResults.detail.documentResult
                            ?.informationScore || "N/A"}
                          {otvData.otvResults.detail.documentResult
                            ?.informationScore
                            ? "%"
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium mb-2">
                      Document Information
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p>
                          <strong>Document Type:</strong>{" "}
                          {otvData.otvResults.detail.documentResult
                            ?.allDocumentCaptureInformation?.documentType ||
                            "N/A"}
                        </p>
                        <p>
                          <strong>Document Number:</strong>{" "}
                          {otvData.otvResults.detail.documentResult
                            ?.allDocumentCaptureInformation?.documentNumber ||
                            "N/A"}
                        </p>
                        <p>
                          <strong>Nationality:</strong>{" "}
                          {otvData.otvResults.detail.documentResult
                            ?.allDocumentCaptureInformation?.nationality ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Country of Birth:</strong>{" "}
                          {otvData.otvResults.detail.documentResult
                            ?.allDocumentCaptureInformation?.countryOfBirth ||
                            "N/A"}
                        </p>
                        <p>
                          <strong>Issuing Country:</strong>{" "}
                          {otvData.otvResults.detail.documentResult
                            ?.allDocumentCaptureInformation
                            ?.issuingCountryCode || "N/A"}
                        </p>
                        <p>
                          <strong>MRZ Status:</strong>{" "}
                          {otvData.otvResults.detail.documentResult
                            ?.allDocumentCaptureInformation?.mrzStatus || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* HANIS Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    HANIS Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">HANIS ID</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {otvData.otvResults.detail.hanisID}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">HANIS Reference</p>
                    <p className="text-sm text-muted-foreground">
                      {otvData.otvResults.detail.hanisReference}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">HANIS Type</p>
                    <p className="text-sm text-muted-foreground">
                      {otvData.otvResults.detail.hanisType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">DHA Verified</p>
                    <div className="flex items-center gap-2">
                      {otvData.otvResults.detail.dhaVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {otvData.otvResults.detail.dhaVerified ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">On File Match</p>
                    <div className="flex items-center gap-2">
                      {otvData.otvResults.detail.onFileMatch ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {otvData.otvResults.detail.onFileMatch ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">HANIS Error Code</p>
                    <p className="text-sm text-muted-foreground">
                      {otvData.otvResults.detail.hanisError}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Photos Available */}
              {otvData.otvResults.detail.photo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Photo Available
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Profile photo and document photos have been captured and
                      are available for verification.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
