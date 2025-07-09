"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Shield,
  Loader2,
  Download,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { handleFraudCheck } from "@/lib/utils/fraud-check";
import { extractPdfFromZip, isBase64Zip } from "@/lib/utils/zip-extractor";
import {
  PersonalInfoCard,
  ContactInfoCard,
  EmploymentInfoCard,
  LoanBankingInfoCard,
  AdditionalInfoCard,
  FraudCheckResults,
} from "@/components/application-detail";

interface Application {
  id: number;
  user_id: string;
  id_number: string;
  id_number_decrypted: string;
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
  } | null;
}

interface ApplicationDetailClientProps {
  application: Application;
  apiChecks: any[];
}

export function ApplicationDetailClient({
  application,
  apiChecks,
}: ApplicationDetailClientProps) {
  const [isRunningFraudCheck, setIsRunningFraudCheck] = useState(false);
  const [fraudCheckResults, setFraudCheckResults] = useState<any>(null);
  const [extractingZip, setExtractingZip] = useState<number | null>(null);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const handleZipExtraction = async (apiCheck: any) => {
    if (!apiCheck.response_payload?.pRetData) {
      toast.error("No ZIP data found in this API check");
      return;
    }

    setExtractingZip(apiCheck.id);

    try {
      const zipData = apiCheck.response_payload.pRetData;

      if (!isBase64Zip(zipData)) {
        toast.error("Invalid ZIP data format");
        return;
      }

      const success = await extractPdfFromZip(
        zipData,
        `fraud-check-${apiCheck.id}-${new Date(apiCheck.checked_at).toISOString().split("T")[0]}.pdf`
      );

      if (success) {
        toast.success("Document extracted and downloaded successfully!");
      } else {
        toast.error("Failed to extract document from ZIP file");
      }
    } catch (error) {
      console.error("Error extracting ZIP:", error);
      toast.error("An error occurred while extracting the document");
    } finally {
      setExtractingZip(null);
    }
  };

  const getApiCheckStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getApiCheckStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "in_review":
        return "bg-yellow-100 text-yellow-800";
      case "pending_documents":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Application #{application.id}
            </h1>
            <p className="text-muted-foreground">
              {application.profile?.full_name && (
                <span className="font-medium">
                  {application.profile.full_name} •{" "}
                </span>
              )}
              Created on {formatDate(application.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() =>
              handleFraudCheck(
                application,
                setIsRunningFraudCheck,
                setFraudCheckResults
              )
            }
            disabled={isRunningFraudCheck}
            variant="outline"
            size="sm"
          >
            {isRunningFraudCheck ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Fraud Check...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Fraud Check
              </>
            )}
          </Button>
          <Badge className={getStatusColor(application.status)}>
            {application.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Fraud Check Results */}
      <FraudCheckResults fraudCheckResults={fraudCheckResults} />

      {/* API Check History */}
      {apiChecks && apiChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              API Check History
            </CardTitle>
            <CardDescription>
              History of all KYC and verification checks performed for this ID
              number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiChecks.map((check, index) => (
                <div key={check.id} className="border rounded-lg p-4 space-y-3">
                  {/* Check Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getApiCheckStatusIcon(check.status)}
                      <div>
                        <p className="font-medium capitalize">
                          {check.check_type.replace("_", " ")} Check
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {check.vendor} • {formatDate(check.checked_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Extract ZIP button for fraud checks with ZIP data */}
                      {check.check_type === "fraud_check" &&
                        check.response_payload?.pRetData &&
                        isBase64Zip(check.response_payload.pRetData) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleZipExtraction(check)}
                            disabled={extractingZip === check.id}
                            className="flex items-center space-x-1"
                          >
                            {extractingZip === check.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Extracting...</span>
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                <span>Extract PDF</span>
                              </>
                            )}
                          </Button>
                        )}
                      <Badge className={getApiCheckStatusColor(check.status)}>
                        {check.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Response Details */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>View Response Details</span>
                      </summary>
                      <div className="mt-2 space-y-2">
                        {/* Show key response fields */}
                        {check.response_payload && (
                          <div className="space-y-1">
                            {/* Credit check specific fields */}
                            {check.check_type === "credit_bureau" && (
                              <>
                                {check.response_payload
                                  .pTransactionCompleted !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      Transaction Completed:
                                    </span>
                                    <span
                                      className={
                                        check.response_payload
                                          .pTransactionCompleted
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {check.response_payload
                                        .pTransactionCompleted
                                        ? "Yes"
                                        : "No"}
                                    </span>
                                  </div>
                                )}
                                {check.response_payload.pCBVScore && (
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      CBV Score:
                                    </span>
                                    <span>
                                      {check.response_payload.pCBVScore}
                                    </span>
                                  </div>
                                )}
                                {check.response_payload.pCurrentDebtReview && (
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      Debt Review:
                                    </span>
                                    <span
                                      className={
                                        check.response_payload
                                          .pCurrentDebtReview
                                          ? "text-red-600"
                                          : "text-green-600"
                                      }
                                    >
                                      {check.response_payload.pCurrentDebtReview
                                        ? "Yes"
                                        : "No"}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Fraud check specific fields */}
                            {check.check_type === "fraud_check" && (
                              <>
                                {check.response_payload
                                  .pTransactionCompleted !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      Transaction Completed:
                                    </span>
                                    <span
                                      className={
                                        check.response_payload
                                          .pTransactionCompleted
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {check.response_payload
                                        .pTransactionCompleted
                                        ? "Yes"
                                        : "No"}
                                    </span>
                                  </div>
                                )}
                                {check.response_payload.pRetData && (
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      Document Available:
                                    </span>
                                    <span className="text-green-600">
                                      {isBase64Zip(
                                        check.response_payload.pRetData
                                      )
                                        ? "ZIP File"
                                        : "Data"}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Raw response data */}
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                            View Raw Response
                          </summary>
                          <pre className="text-xs bg-background border rounded p-2 overflow-x-auto mt-1 max-h-40">
                            {JSON.stringify(check.response_payload, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <PersonalInfoCard application={application} />

        {/* Contact Information */}
        <ContactInfoCard application={application} />

        {/* Employment Information */}
        <EmploymentInfoCard application={application} />

        {/* Loan & Banking Information */}
        <LoanBankingInfoCard application={application} />
      </div>

      {/* Additional Information */}
      <AdditionalInfoCard application={application} />

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(application.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(application.updated_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
