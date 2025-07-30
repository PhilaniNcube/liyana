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
  Send,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { handleFraudCheck } from "@/lib/utils/fraud-check";
import { handleBraveLenderSubmit } from "@/lib/utils";

import {
  PersonalInfoCard,
  ContactInfoCard,
  EmploymentInfoCard,
  LoanBankingInfoCard,
  AdditionalInfoCard,
  FraudCheckResults,
} from "@/components/application-detail";
import ApiCheckCard from "./api-check-card";
import { DocumentsDisplayCard } from "./documents-display-card";
import { AdminDocumentUploadForm } from "@/components/admin-document-upload-form";
import type { Database } from "@/lib/types";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailApplication from "./email-application";
import { EmailVerificationDialog } from "@/components/email-verification-dialog";
import { ProfileDocumentUpload } from "@/components/profile-document-upload";
import { ProfileDocumentsDisplay } from "@/components/profile-documents-display";

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

interface ApplicationDetailClientProps {
  application: Application;
  apiChecks: any[];
  documents: Database["public"]["Tables"]["documents"]["Row"][];
  userRole?: string;
}

export function ApplicationDetailClient({
  application,
  apiChecks,
  documents,
  userRole,
}: ApplicationDetailClientProps) {
  const [isRunningFraudCheck, setIsRunningFraudCheck] = useState(false);
  const [fraudCheckResults, setFraudCheckResults] = useState<any>(null);
  const [isSubmittingToBraveLender, setIsSubmittingToBraveLender] =
    useState(false);
  const [currentDocuments, setCurrentDocuments] = useState(documents);
  const [isDeclining, setIsDeclining] = useState(false);
  const [profileDocuments, setProfileDocuments] = useState<
    Database["public"]["Tables"]["profile_documents"]["Row"][]
  >([]);
  const [isSendingOtv, setIsSendingOtv] = useState(false);

  // Filter for credit reports from Credit Check API checks
  const creditReports = apiChecks
    .filter(
      (check: any) =>
        check.check_type === "fraud_check" &&
        check.status === "passed" &&
        check.response_payload
    )
    .map((check: any) => ({
      id: check.id.toString(),
      check_type: check.check_type,
      status: check.status,
      created_at: check.checked_at,
      report_data: check.response_payload,
    }));

  // Filter API checks to show only the latest of each type
  const getLatestApiChecks = (checks: any[]) => {
    const latestChecks = new Map();

    checks.forEach((check) => {
      const key = check.check_type;
      const existingCheck = latestChecks.get(key);

      if (
        !existingCheck ||
        new Date(check.checked_at) > new Date(existingCheck.checked_at)
      ) {
        latestChecks.set(key, check);
      }
    });

    return Array.from(latestChecks.values());
  };

  const latestApiChecks = getLatestApiChecks(apiChecks);

  const handleDocumentUploadSuccess = (
    newDocument: Database["public"]["Tables"]["documents"]["Row"]
  ) => {
    setCurrentDocuments((prev) => [...prev, newDocument]);
    toast.success("Document uploaded successfully");
  };

  const handleProfileDocumentUploadSuccess = (
    newDocument: Database["public"]["Tables"]["profile_documents"]["Row"]
  ) => {
    setProfileDocuments((prev) => [...prev, newDocument]);
    toast.success("Profile document uploaded successfully");
  };

  const handleDeclineApplication = async () => {
    if (
      !confirm(
        "Are you sure you want to decline this application? This action cannot be undone."
      )
    ) {
      return;
    }

    // Prompt for decline reason
    const reason = prompt(
      "Please provide a reason for declining this application (optional):"
    );

    setIsDeclining(true);
    try {
      const requestBody: any = {
        status: "declined",
      };

      if (reason && reason.trim()) {
        requestBody.decline_reason = reason.trim();
      }

      const response = await fetch(
        `/api/applications/${application.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to decline application");
      }

      toast.success("Application has been declined successfully");

      // Refresh the page to update the application status
      window.location.reload();
    } catch (error) {
      console.error("Error declining application:", error);
      toast.error("Failed to decline application. Please try again.");
    } finally {
      setIsDeclining(false);
    }
  };

  const handleOtvRequest = async () => {
    setIsSendingOtv(true);
    try {
      const response = await fetch("/api/kyc/otv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ application_id: application.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handles HTTP errors (4xx, 5xx)
        throw new Error(result.error || "Failed to send OTV link");
      }

      // Full success
      toast.success(`OTV link sent successfully. PIN: ${result.message}`);
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsSendingOtv(false);
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
      case "submitted_to_lender":
        return "bg-purple-100 text-purple-800";
      case "submission_failed":
        return "bg-orange-100 text-orange-800";
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
              handleBraveLenderSubmit(application, setIsSubmittingToBraveLender)
            }
            disabled={
              isSubmittingToBraveLender ||
              isDeclining ||
              application.status === "submitted_to_lender"
            }
            variant="default"
            size="sm"
          >
            {isSubmittingToBraveLender ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit to BraveLender
              </>
            )}
          </Button>
          <Button
            onClick={() =>
              handleFraudCheck(
                application,
                setIsRunningFraudCheck,
                setFraudCheckResults
              )
            }
            disabled={
              isRunningFraudCheck ||
              isDeclining ||
              application.status === "declined" ||
              application.status === "submitted_to_lender"
            }
            variant="outline"
            size="sm"
          >
            {isRunningFraudCheck ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Credit Check...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Credit Check
              </>
            )}
          </Button>
          <Button
            onClick={handleDeclineApplication}
            disabled={
              isSubmittingToBraveLender ||
              isRunningFraudCheck ||
              isDeclining ||
              application.status === "declined" ||
              application.status === "approved" ||
              application.status === "submitted_to_lender"
            }
            variant="destructive"
            size="sm"
          >
            {isDeclining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Declining...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Decline Application
              </>
            )}
          </Button>
          <Button
            onClick={handleOtvRequest}
            disabled={isSendingOtv}
            variant="outline"
            size="sm"
          >
            {isSendingOtv ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending OTV Link...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send OTV Link
              </>
            )}
          </Button>
          <Badge className={getStatusColor(application.status)}>
            {(() => {
              // Use a switch case to format status text
              switch (application.status) {
                case "submitted_to_lender":
                  return "Submitted to Bravelender";
                case "approved":
                  return "Approved";
                case "declined":
                  return "Declined";
                default:
                  return application.status.replace("_", " ").toUpperCase();
              }
            })()}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="personal-info" className="mt-4">
        <TabsList>
          <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
          <TabsTrigger value="contact-info">Contact Info</TabsTrigger>
          <TabsTrigger value="employment-info"> Employment Info</TabsTrigger>
          <TabsTrigger value="loan-banking-info">
            Loan & Banking Info
          </TabsTrigger>
          <TabsTrigger value="checks">Credit Checks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
        </TabsList>
        <TabsContent value="personal-info">
          {/* Personal Information */}
          <PersonalInfoCard application={application} />
        </TabsContent>
        <TabsContent value="contact-info">
          {/* Contact Information */}
          <ContactInfoCard application={application} />

          {/* Email Verification */}
          {application.profile?.email && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Verification
                </CardTitle>
                <CardDescription>
                  Comprehensive email verification and risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-sm text-muted-foreground">
                      {application.profile.email}
                    </p>
                  </div>
                  <EmailVerificationDialog
                    email={application.profile.email}
                    idNumber={application.id_number_decrypted}
                  >
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Verify Email
                    </Button>
                  </EmailVerificationDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="employment-info">
          {/* Employment Information */}
          <EmploymentInfoCard application={application} />
        </TabsContent>
        <TabsContent value="loan-banking-info">
          {/* Loan & Banking Information */}
          <LoanBankingInfoCard application={application} />
          {/* Additional Information */}
          <AdditionalInfoCard application={application} />
        </TabsContent>
        <TabsContent value="checks">
          {/* Credit Check Results */}
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
                  History of all KYC and verification checks performed for this
                  ID number
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* API Checks */}
                  {latestApiChecks.map((check, index) => (
                    <ApiCheckCard check={check} key={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="documents">
          <div className="space-y-6">
            {/* Application Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Application Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminDocumentUploadForm
                  applicationId={application.id.toString()}
                  documents={currentDocuments || []}
                  onUploadSuccess={handleDocumentUploadSuccess}
                />
                <DocumentsDisplayCard
                  applicationId={application.id}
                  documents={currentDocuments || []}
                />
              </div>
            </div>

            {/* Profile Documents */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Profile Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileDocumentUpload
                  profileId={application.user_id}
                  onUploadSuccess={handleProfileDocumentUploadSuccess}
                />
                <ProfileDocumentsDisplay
                  profileId={application.user_id}
                  documents={profileDocuments}
                  onRefresh={() => {
                    // Refresh profile documents - this will trigger a fetch in the display component
                    setProfileDocuments([]);
                  }}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="emails">
          {/* Emails Section */}
          <Card>
            <CardHeader>
              <CardTitle>Emails</CardTitle>
              <CardDescription>
                All emails sent to the applicant regarding this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailApplication
                id={application.id}
                creditReports={creditReports}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
