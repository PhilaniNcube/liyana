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
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import type { WhoYouEmailVerificationResponse } from "@/lib/schemas";

interface EmailVerificationDialogProps {
  email: string;
  idNumber: string;
  children: React.ReactNode;
}

export function EmailVerificationDialog({
  email,
  idNumber,
  children,
}: EmailVerificationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationData, setVerificationData] =
    useState<WhoYouEmailVerificationResponse | null>(null);

  const handleEmailVerification = async () => {
    if (isLoading) return; // guard against double clicks
    setIsLoading(true);
    try {
      const res = await fetch("/api/kyc/email-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, idNumber }),
      });

      // Attempt to parse JSON; fall back to text
      const contentType = res.headers.get("content-type") || "";
      let payload: any = null;
      try {
        if (contentType.includes("application/json")) {
          payload = await res.json();
        } else {
          const txt = await res.text();
          payload = txt ? { raw: txt } : {};
        }
      } catch (e) {
        // swallow parse errors; keep payload null
        payload = {};
      }

      if (!res.ok) {
        // Debug log (remove or gate behind env flag for production if needed)
        // eslint-disable-next-line no-console
        console.error("Email verification failed response", {
          status: res.status,
          statusText: res.statusText,
          payload,
        });
        const message =
          payload?.error ||
          payload?.message ||
          `Failed to verify email (${res.status} ${res.statusText})`;
        throw new Error(message);
      }

      if (!payload || !payload.data) {
        // eslint-disable-next-line no-console
        console.error("Email verification malformed success payload", payload);
        throw new Error("Malformed response from verification endpoint");
      }

      setVerificationData(payload.data);
      toast.success("Email verification completed successfully");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Email verification error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to verify email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getBooleanBadge = (
    value: boolean | null,
    trueText: string,
    falseText: string
  ) => {
    if (value === null) return <Badge variant="secondary">Unknown</Badge>;
    return value ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        {trueText}
      </Badge>
    ) : (
      <Badge variant="destructive">{falseText}</Badge>
    );
  };

  const getRiskBadge = (isHighRisk: boolean) => {
    return isHighRisk ? (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        High Risk
      </Badge>
    ) : (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Low Risk
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification Report
          </DialogTitle>
          <DialogDescription>
            Comprehensive email verification analysis for {email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!verificationData ? (
            <div className="text-center py-8">
              <Button
                onClick={handleEmailVerification}
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying Email...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Email
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Click to run comprehensive email verification
              </p>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Summary
                    </span>
                    {getRiskBadge(
                      verificationData.detail.emailVerificationInformation
                        .isHighRisk
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {
                          verificationData.detail.emailVerificationInformation
                            .email
                        }
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Deliverable</p>
                      {getBooleanBadge(
                        verificationData.detail.emailVerificationInformation
                          .isDeliverable,
                        "Deliverable",
                        "Not Deliverable"
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Domain</p>
                      <p className="text-sm text-muted-foreground">
                        {
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.domain
                        }
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Registered To</p>
                      <p className="text-sm text-muted-foreground">
                        {
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.registeredTo
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Domain Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Domain Type</p>
                      <div className="flex gap-2">
                        {getBooleanBadge(
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.isFree,
                          "Free",
                          "Paid"
                        )}
                        {getBooleanBadge(
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.isCustom,
                          "Custom",
                          "Standard"
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Security</p>
                      <div className="flex gap-2 flex-wrap">
                        {getBooleanBadge(
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.isDmarcEnforced,
                          "DMARC",
                          "No DMARC"
                        )}
                        {getBooleanBadge(
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.isSpfStrict,
                          "SPF",
                          "No SPF"
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Status</p>
                      <div className="flex gap-2 flex-wrap">
                        {getBooleanBadge(
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.isDisposable,
                          "Disposable",
                          "Permanent"
                        )}
                        {getBooleanBadge(
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.isSuspiciousTld,
                          "Suspicious TLD",
                          "Safe TLD"
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-muted-foreground">
                        {formatDate(
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.created
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Updated</p>
                      <p className="text-muted-foreground">
                        {formatDate(
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.updated
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Expires</p>
                      <p className="text-muted-foreground">
                        {verificationData.detail.emailVerificationInformation
                          .domainDetails.expires
                          ? formatDate(
                              verificationData.detail
                                .emailVerificationInformation.domainDetails
                                .expires
                            )
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Registrar</p>
                      <p className="text-muted-foreground">
                        {
                          verificationData.detail.emailVerificationInformation
                            .domainDetails.registrarName
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Breaches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Breach Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {verificationData.detail.emailVerificationInformation
                            .breachDetails.haveIBeenPwnedListed
                            ? "Email has been compromised"
                            : "Email appears secure"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {
                            verificationData.detail.emailVerificationInformation
                              .breachDetails.numberOfBreaches
                          }{" "}
                          breach(es) found
                        </p>
                      </div>
                      {verificationData.detail.emailVerificationInformation
                        .breachDetails.haveIBeenPwnedListed ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Compromised
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Secure
                        </Badge>
                      )}
                    </div>

                    {verificationData.detail.emailVerificationInformation
                      .breachDetails.breaches.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-medium mb-2">Known Breaches:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {verificationData.detail.emailVerificationInformation.breachDetails.breaches.map(
                              (breach) => (
                                <div
                                  key={breach.id}
                                  className="border rounded p-2"
                                >
                                  <p className="font-medium text-sm">
                                    {breach.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {breach.domain}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(breach.breachDate)}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Details */}
              {verificationData.detail.emailVerificationInformation
                .accountDetails.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Associated Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {verificationData.detail.emailVerificationInformation.accountDetails.map(
                        (account) => (
                          <Badge key={account.id} variant="outline">
                            {account.platform}
                          </Badge>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Applied Rules */}
              {verificationData.detail.emailVerificationInformation.appliedRules
                .length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Assessment Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {verificationData.detail.emailVerificationInformation.appliedRules.map(
                        (rule) => (
                          <div key={rule.id} className="border rounded p-3">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-medium">{rule.name}</p>
                              <Badge
                                variant={
                                  rule.score > 0 ? "destructive" : "default"
                                }
                              >
                                {rule.operation}
                                {rule.score}
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
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
