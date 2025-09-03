"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils/format-currency";
import { PolicyWithAllData } from "@/lib/queries/policy-details";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  CreditCard,
  Building,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EmploymentDetailsTabProps {
  policy: PolicyWithAllData;
}

export default function EmploymentDetailsTab({
  policy,
}: EmploymentDetailsTabProps) {
  const holder = policy.policy_holder;

  // Employment verification state
  const [isVerifyingEmployment, setIsVerifyingEmployment] = useState(false);
  const [employmentVerification, setEmploymentVerification] = useState<
    any | null
  >(null);

  // Bank verification state
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [bankVerification, setBankVerification] = useState<any | null>(null);
  const [bankVerificationError, setBankVerificationError] = useState<
    string | null
  >(null);

  // (email verification moved to Personal Info tab)

  const handleEmploymentVerification = async () => {
    if (!policy.id) return;
    setIsVerifyingEmployment(true);
    try {
      const res = await fetch("/api/kyc/policy/employment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_id: policy.id }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Employment verification failed");
      setEmploymentVerification(data.data);
      toast.success("Employment verification complete");
    } catch (e: any) {
      toast.error(e.message || "Employment verification failed");
    } finally {
      setIsVerifyingEmployment(false);
    }
  };

  const handleBankVerification = async () => {
    setIsVerifyingBank(true);
    setBankVerificationError(null);
    setBankVerification(null);
    try {
      const res = await fetch("/api/kyc/policy/account-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_id: policy.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bank verification failed");
      if (
        data.accountVerificationInformation &&
        data.accountVerificationInformation.length > 0
      ) {
        setBankVerification(data.accountVerificationInformation[0]);
        toast.success("Bank account verification complete");
      } else {
        setBankVerificationError("No verification data returned");
      }
    } catch (e: any) {
      setBankVerificationError(e.message || "Bank verification failed");
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Employment Information + Verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between bg-yellow-200 p-3 rounded-md">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" /> Employment Information
            </CardTitle>
            {policy.employment_details && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleEmploymentVerification}
                disabled={isVerifyingEmployment}
                className="flex items-center gap-2"
              >
                {isVerifyingEmployment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {isVerifyingEmployment ? "Verifying..." : "Verify Employment"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!policy.employment_details ? (
            <div className="text-center text-muted-foreground">
              No employment information available for this policy.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {policy.employment_details.employer_name && (
                <div>
                  <div className="text-xs text-muted-foreground">Employer</div>
                  <div className="font-medium">
                    {policy.employment_details.employer_name}
                  </div>
                </div>
              )}
              {policy.employment_details.job_title && (
                <div>
                  <div className="text-xs text-muted-foreground">Job Title</div>
                  <div>{policy.employment_details.job_title}</div>
                </div>
              )}
              {policy.employment_details.employment_type && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Employment Type
                  </div>
                  <div className="capitalize">
                    {policy.employment_details.employment_type.replace(
                      /_/g,
                      " "
                    )}
                  </div>
                </div>
              )}
              {policy.employment_details.monthly_income && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Monthly Income
                  </div>
                  <div className="font-medium text-lg">
                    {formatCurrency(
                      parseFloat(policy.employment_details.monthly_income)
                    )}
                  </div>
                </div>
              )}
              {policy.employment_details.employer_address && (
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">
                    Employer Address
                  </div>
                  <div>{policy.employment_details.employer_address}</div>
                </div>
              )}
              {policy.employment_details.employer_contact_number && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Employer Contact
                  </div>
                  <div>{policy.employment_details.employer_contact_number}</div>
                </div>
              )}
              {policy.employment_details.employment_end_date && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Employment End Date
                  </div>
                  <div>{policy.employment_details.employment_end_date}</div>
                </div>
              )}
            </div>
          )}

          {employmentVerification && (
            <div className="mt-6">
              <Separator className="my-4" />
              <h4 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Employment Verification Results
              </h4>
              <div className="mt-3 space-y-3">
                {employmentVerification.data.detail.employerInformation.map(
                  (employer: any) => (
                    <div
                      key={employer.id}
                      className="bg-green-50 p-3 rounded-md border border-green-200"
                    >
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium">Employer:</span>{" "}
                          {employer.employerName}
                        </div>
                        <div>
                          <span className="font-medium">Occupation:</span>{" "}
                          {employer.occupation}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>{" "}
                          {employer.latestStatus}
                        </div>
                        <div>
                          <span className="font-medium">Score:</span>{" "}
                          {employer.score}%
                        </div>
                        <div>
                          <span className="font-medium">Sector:</span>{" "}
                          {employer.sector}
                        </div>
                        <div>
                          <span className="font-medium">Source:</span>{" "}
                          {employer.kycSource}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banking Information */}
      {holder?.banking_details && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between bg-yellow-200 p-3 rounded-md">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Banking Information
              </CardTitle>
              <Dialog
                open={isBankDialogOpen}
                onOpenChange={setIsBankDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" /> Verify Bank Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" /> Bank Account Verification
                    </DialogTitle>
                    <DialogDescription>
                      Verify the banking details against external data sources
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!bankVerification && !bankVerificationError && (
                      <div className="text-center py-4">
                        <Button
                          onClick={handleBankVerification}
                          disabled={isVerifyingBank}
                          className="w-full"
                        >
                          {isVerifyingBank ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />{" "}
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" /> Start
                              Verification
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    {bankVerificationError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                          <p className="text-red-800 font-medium">
                            Verification Failed
                          </p>
                        </div>
                        <p className="text-red-600 text-sm mt-1">
                          {bankVerificationError}
                        </p>
                        <Button
                          onClick={handleBankVerification}
                          disabled={isVerifyingBank}
                          variant="outline"
                          size="sm"
                          className="mt-3"
                        >
                          Retry Verification
                        </Button>
                      </div>
                    )}
                    {bankVerification && (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <p className="text-green-800 font-medium">
                              Verification Complete
                            </p>
                          </div>
                          <p className="text-green-600 text-sm">
                            Account verification has been processed successfully
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">
                                Identity Verification
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  ID Number
                                </span>
                                {getStatusIcon(
                                  bankVerification.isIdNumberValid
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Name
                                </span>
                                {getStatusIcon(bankVerification.isNameValid)}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Initials
                                </span>
                                {getStatusIcon(
                                  bankVerification.isInitialsValid
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">
                                Account Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Account Type
                                </span>
                                {getStatusIcon(
                                  bankVerification.isAccountTypeValid
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Account Number
                                </span>
                                {getStatusIcon(
                                  bankVerification.isAccountNumberValid
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Branch Code
                                </span>
                                {getStatusIcon(
                                  bankVerification.isBranchCodeValid
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                              Account Status Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Account Status</span>
                              <Badge
                                variant={
                                  bankVerification.accountStatus === "Open"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {bankVerification.accountStatus}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Accept Credit
                                </span>
                                {getStatusIcon(
                                  bankVerification.canAcceptCredit
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  Accept Debit
                                </span>
                                {getStatusIcon(bankVerification.canAcceptDebit)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Open 3+ Months</span>
                              {getStatusIcon(
                                bankVerification.isOpenAtLeast3Months
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">
                              Verification Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Reference
                              </span>
                              <span>{bankVerification.reference}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Supplier Code
                              </span>
                              <span>{bankVerification.supplierCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Verification ID
                              </span>
                              <span>{bankVerification.id}</span>
                            </div>
                          </CardContent>
                        </Card>
                        <div className="flex justify-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setBankVerification(null);
                              setBankVerificationError(null);
                            }}
                          >
                            Run New Verification
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(holder.banking_details as any)?.account_name && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Account Name
                  </div>
                  <div className="font-medium">
                    {(holder.banking_details as any).account_name}
                  </div>
                </div>
              )}
              {(holder.banking_details as any)?.bank_name && (
                <div>
                  <div className="text-xs text-muted-foreground">Bank Name</div>
                  <div>{(holder.banking_details as any).bank_name}</div>
                </div>
              )}
              {(holder.banking_details as any)?.account_number && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Account Number
                  </div>
                  <div className="">
                    {(holder.banking_details as any).account_number}
                  </div>
                </div>
              )}
              {(holder.banking_details as any)?.branch_code && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Branch Code
                  </div>
                  <div className="">
                    {(holder.banking_details as any).branch_code}
                  </div>
                </div>
              )}
              {(holder.banking_details as any)?.account_type && (
                <div>
                  <div className="text-xs text-muted-foreground">
                    Account Type
                  </div>
                  <div className="capitalize">
                    {(holder.banking_details as any).account_type.replace(
                      /_/g,
                      " "
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
