"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "date-fns";
import { decryptValue } from "@/lib/encryption";

interface CreditBureauDialogProps {
  check: {
    id: number;
    check_type: string;
    status: string;
    checked_at: string;
    response_payload: any;
    id_number: string;
    application_id?: number; // Optional since not all checks have this
  };
}

export function CreditBureauDialog({ check }: CreditBureauDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getCreditScore = () => {
    const payload = check.response_payload as any;
    return (
      payload?.creditScore ||
      payload?.score ||
      payload?.parsedData?.results?.[0]?.score ||
      null
    );
  };

  // check if the id_number is encrypted, the encrypted value will be longer than 13 characters, if it is encrypted then decrypted, if not then just display it
  const finalIdNumber =
    check.id_number.length > 13
      ? decryptValue(check.id_number)
      : check.id_number;

  const getCreditReason = () => {
    const payload = check.response_payload as any;

    // Check if reasons exist in the new structure
    if (payload?.parsedData?.results?.[0]?.reasons) {
      return payload.parsedData.results[0].reasons.map(
        (reason: any) => reason.reasonDescription || reason.reasonCode || reason
      );
    }

    // Fallback to other possible structures
    return payload?.reason || payload?.reasons || [];
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-500";
    if (score >= 700) return "text-green-600";
    if (score >= 600) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number | null) => {
    if (!score) return <AlertTriangle className="h-6 w-6" />;
    if (score >= 700) return <CheckCircle className="h-6 w-6 text-green-600" />;
    if (score >= 600)
      return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    return <XCircle className="h-6 w-6 text-red-600" />;
  };

  const getScoreRating = (score: number | null) => {
    if (!score) return { rating: "Unknown", color: "text-gray-500" };
    if (score >= 750) return { rating: "Excellent", color: "text-green-600" };
    if (score >= 700) return { rating: "Good", color: "text-green-500" };
    if (score >= 650) return { rating: "Fair", color: "text-yellow-600" };
    if (score >= 600) return { rating: "Poor", color: "text-orange-600" };
    return { rating: "Very Poor", color: "text-red-600" };
  };

  const creditScore = getCreditScore();
  const creditReasons = getCreditReason();
  const scoreRating = getScoreRating(creditScore);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Credit Bureau Check Results
          </DialogTitle>
          <DialogDescription>
            Detailed credit score and assessment information
            {check.application_id
              ? ` for Application #${check.application_id}`
              : ` for ID: ${check.id_number}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Credit Score Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {getScoreIcon(creditScore)}
                Credit Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className={cn(
                      "text-4xl font-bold",
                      getScoreColor(creditScore)
                    )}
                  >
                    {creditScore || "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rating:{" "}
                    <span className={cn("font-medium", scoreRating.color)}>
                      {scoreRating.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Range</div>
                  <div className="text-lg font-semibold">0 - 999</div>
                  {creditScore && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {Math.round((creditScore / 999) * 100)}th percentile
                    </div>
                  )}
                </div>
              </div>

              {/* Score Range Indicator */}
              {creditScore && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Score Range
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        creditScore >= 750
                          ? "bg-green-600"
                          : creditScore >= 700
                            ? "bg-green-500"
                            : creditScore >= 650
                              ? "bg-yellow-500"
                              : creditScore >= 600
                                ? "bg-orange-500"
                                : "bg-red-500"
                      )}
                      style={{
                        width: `${Math.min((creditScore / 999) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0</span>
                    <span className="text-red-500">600</span>
                    <span className="text-yellow-500">650</span>
                    <span className="text-green-500">700</span>
                    <span className="text-green-600">750+</span>
                    <span>999</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Reasons */}
          {creditReasons && creditReasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Credit Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Show general reason if available */}
                  {check.response_payload?.reason && (
                    <div className="p-3 bg-amber-50 rounded border border-amber-200">
                      <div className="text-sm font-medium text-amber-800">
                        Overall Assessment: {check.response_payload.reason}
                      </div>
                    </div>
                  )}

                  {/* Show specific reasons */}
                  {Array.isArray(creditReasons) ? (
                    creditReasons.map((reason: string, index: number) => {
                      // Check if this is a structured reason or just a string
                      const payload = check.response_payload as any;
                      const originalReason =
                        payload?.parsedData?.results?.[0]?.reasons?.[index];

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {reason}
                            </div>
                            {originalReason?.reasonCode && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Code: {originalReason.reasonCode}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <span className="text-sm">{creditReasons}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Check Metadata */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Check Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  className={cn(
                    "ml-2",
                    check.status === "passed"
                      ? "bg-green-100 text-green-800"
                      : check.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  )}
                >
                  {check.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">ID Number:</span>
                <span className="ml-2 font-medium">{check.id_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Check Date:</span>
                <span className="ml-2 font-medium">
                  {formatDate(check.checked_at, "PPpp")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Check ID:</span>
                <span className="ml-2 font-medium">#{check.id}</span>
              </div>
              {check.application_id && (
                <div>
                  <span className="text-muted-foreground">Application ID:</span>
                  <span className="ml-2 font-medium">
                    #{check.application_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
