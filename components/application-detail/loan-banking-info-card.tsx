"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { CreditCard, Shield, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { WhoYouAccountVerificationInformation } from "@/lib/schemas";
import { calculateMinimumExpenses } from "@/lib/utils/affordability";
import { updateApplicationDetails } from "@/lib/actions/applications";
import { EditableRow } from "./editable-row";

const southAfricanBanks = [
  { name: "ABSA Bank", code: "632005" },
  { name: "African Bank", code: "430000" },
  { name: "Bidvest Bank", code: "462005" },
  { name: "Capitec Bank", code: "470010" },
  { name: "Discovery Bank", code: "679000" },
  { name: "FNB (First National Bank)", code: "250655" },
  { name: "Investec Bank", code: "580105" },
  { name: "Nedbank", code: "198765" },
  { name: "Standard Bank", code: "051001" },
  { name: "TymeBank", code: "678910" },
  { name: "Ubank", code: "431010" },
  { name: "VBS Mutual Bank", code: "588000" },
] as const;

const bankAccountTypes = [
  { label: "Savings", value: "savings" },
  { label: "Current/Cheque", value: "current" },
  { label: "Transaction", value: "transaction" },
  { label: "Business", value: "business" },
];

interface Application {
  id: number;
  user_id: string;
  id_number: string;
  id_number_decrypted: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  date_of_birth: string | null;
  gender: string | null;
  gender_other: string | null;
  marital_status: string | null;
  nationality: string | null;
  language: string | null;
  dependants: number | null;
  home_address: string | null;
  city: string | null;
  postal_code: string | null;
  phone_number: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone_number: string | null;
  next_of_kin_email: string | null;
  employment_type: string | null;
  monthly_income: number | null;
  salary_date: number | null;
  job_title: string | null;
  work_experience: string | null;
  employer_name: string | null;
  employer_address: string | null;
  employer_contact_number: string | null;
  employment_end_date: string | null;
  application_amount: number | null;
  term: number;
  loan_purpose: string | null;
  loan_purpose_reason: string | null;
  bank_name: string | null;
  bank_account_type: string | null;
  bank_account_holder: string | null;
  branch_code: string | null;
  bank_account_number: string | null;
  affordability: any;
  decline_reason: any;
  profile?: {
    full_name: string;
    email: string | null;
  } | null;
}

interface LoanBankingInfoCardProps {
  application: Application;
}

export function LoanBankingInfoCard({ application }: LoanBankingInfoCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<WhoYouAccountVerificationInformation | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatLoanPurpose = (purpose: string | null) => {
    if (!purpose) return "N/A";
    // Convert underscores to spaces, then remove all non-alphabetic characters and extra spaces
    return purpose
      .replace(/_/g, " ")
      .replace(/[^a-zA-Z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const bindAction = (fieldName: string) => {
    return updateApplicationDetails.bind(
      null,
      application.id,
      application.user_id,
      fieldName
    );
  };

  const handleAccountVerification = async () => {
    if (!application.id) {
      setVerificationError("Application ID is required for verification");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const response = await fetch("/api/kyc/account-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: application.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify account");
      }

      if (
        data.accountVerificationInformation &&
        data.accountVerificationInformation.length > 0
      ) {
        setVerificationResult(data.accountVerificationInformation[0]);
      } else {
        setVerificationError("No verification data received");
      }
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "An error occurred during verification"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (isValid: boolean, label: string) => {
    return (
      <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
        {isValid ? "Valid" : "Invalid"} {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Loan & Banking Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <EditableRow
              label="Loan Amount"
              value={application.application_amount}
              displayValue={formatCurrency(application.application_amount)}
              fieldName="application_amount"
              inputType="number"
              action={bindAction("application_amount")}
            />
          </div>
          <div>
            <EditableRow
              label="Loan Term (days)"
              value={application.term}
              displayValue={`${application.term} days`}
              fieldName="term"
              inputType="number"
              action={bindAction("term")}
            />
          </div>
          {application.salary_date && (
            <div className="col-span-2">
              <EditableRow
                label="Salary Date"
                value={application.salary_date}
                displayValue={(() => {
                  const d = application.salary_date!;
                  const suffix =
                    d % 10 === 1 && d % 100 !== 11
                      ? "st"
                      : d % 10 === 2 && d % 100 !== 12
                        ? "nd"
                        : d % 10 === 3 && d % 100 !== 13
                          ? "rd"
                          : "th";
                  return `${d}${suffix} of each month`;
                })()}
                fieldName="salary_date"
                inputType="number"
                action={bindAction("salary_date")}
              />
            </div>
          )}
        </div>
        <div>
          <EditableRow
            label="Loan Purpose"
            value={application.loan_purpose}
            displayValue={formatLoanPurpose(application.loan_purpose)}
            fieldName="loan_purpose" // Might match schema "loan_purpose"
            action={bindAction("loan_purpose")}
          />
        </div>
        {application.loan_purpose_reason && (
          <div>
            <EditableRow
              label="Loan Purpose Reason"
              value={application.loan_purpose_reason}
              fieldName="loan_purpose_reason"
              action={bindAction("loan_purpose_reason")}
            />
          </div>
        )}
        <Separator />
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <EditableRow
              label="Bank Name"
              value={application.bank_name}
              fieldName="bank_name"
              inputType="select"
              options={southAfricanBanks.map((b) => ({
                label: b.name,
                value: b.name,
              }))}
              action={bindAction("bank_name")}
            />
          </div>
          <div>
            <EditableRow
              label="Account Type"
              value={application.bank_account_type}
              fieldName="bank_account_type"
              inputType="select"
              options={bankAccountTypes}
              action={bindAction("bank_account_type")}
            />
          </div>
          <div>
            <EditableRow
              label="Account Holder"
              value={application.bank_account_holder}
              fieldName="bank_account_holder"
              action={bindAction("bank_account_holder")}
            />
          </div>
          <div>
            <EditableRow
              label="Branch Code"
              value={application.branch_code}
              fieldName="branch_code"
              action={bindAction("branch_code")}
            />
          </div>
        </div>
        <div>
          <EditableRow
            label="Account Number"
            value={application.bank_account_number}
            fieldName="bank_account_number"
            action={bindAction("bank_account_number")}
          />
        </div>

        {(() => {
          // Calculate affordability check
          const monthlyIncome = application.monthly_income || 0;
          const affordabilityData = application.affordability || {};
          
          const totalAdditionalIncome =
            affordabilityData.income?.reduce(
              (sum: number, item: any) => sum + (item.amount || 0),
              0
            ) || 0;
          
          const totalGrossIncome = monthlyIncome + totalAdditionalIncome;
          
          const totalExpenses =
            affordabilityData.expenses?.reduce(
              (sum: number, item: any) => sum + (item.amount || 0),
              0
            ) || 0;
            
          const minimumRequiredExpenses = calculateMinimumExpenses(totalGrossIncome);
          
          if (totalExpenses < minimumRequiredExpenses && totalGrossIncome > 0) {
             return (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <span className="font-medium">Affordability Warning:</span> The declared expenses ({formatCurrency(totalExpenses)}) 
                      are lower than the minimum required norms ({formatCurrency(minimumRequiredExpenses)}) for this income level.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <Separator />

        <div className="flex justify-between bg-yellow-200 p-3 rounded-lg">
          <div>
            <p className="text-sm font-medium">Bank Account Verification</p>
            <p className="text-sm">
              Verify the bank account details provided by the applicant.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="">
                <Shield className="h-4 w-4 mr-2" />
                Verify Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Bank Account Verification
                </DialogTitle>
                <DialogDescription>
                  Verify the banking details against external data sources
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {!verificationResult && !verificationError && (
                  <div className="text-center py-4">
                    <Button
                      onClick={handleAccountVerification}
                      disabled={isVerifying}
                      className="w-full"
                    >
                      {isVerifying ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Start Verification
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {verificationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-red-800 font-medium">
                        Verification Failed
                      </p>
                    </div>
                    <p className="text-red-600 text-sm mt-1">
                      {verificationError}
                    </p>
                    <Button
                      onClick={handleAccountVerification}
                      disabled={isVerifying}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      Retry Verification
                    </Button>
                  </div>
                )}

                {verificationResult && (
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
                            {getStatusIcon(verificationResult.isIdNumberValid)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Name
                            </span>
                            {getStatusIcon(verificationResult.isNameValid)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Initials
                            </span>
                            {getStatusIcon(verificationResult.isInitialsValid)}
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
                              verificationResult.isAccountTypeValid
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Account Number
                            </span>
                            {getStatusIcon(
                              verificationResult.isAccountNumberValid
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Branch Code
                            </span>
                            {getStatusIcon(
                              verificationResult.isBranchCodeValid
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
                              verificationResult.accountStatus === "Open"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {verificationResult.accountStatus}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Accept Credit
                            </span>
                            {getStatusIcon(verificationResult.canAcceptCredit)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Accept Debit
                            </span>
                            {getStatusIcon(verificationResult.canAcceptDebit)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Open 3+ Months</span>
                          {getStatusIcon(
                            verificationResult.isOpenAtLeast3Months
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
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Reference
                          </span>
                          <span className="text-xs">
                            {verificationResult.reference}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Supplier Code
                          </span>
                          <span className="text-xs">
                            {verificationResult.supplierCode}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">
                            Verification ID
                          </span>
                          <span className="text-xs">
                            {verificationResult.id}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => {
                          setVerificationResult(null);
                          setVerificationError(null);
                        }}
                        variant="outline"
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
      </CardContent>
    </Card>
  );
}
