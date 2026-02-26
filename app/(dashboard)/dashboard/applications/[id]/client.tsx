"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  Mail,
  MoreHorizontal,
  SendHorizonal,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsString } from "nuqs";
import { handleFraudCheck } from "@/lib/utils/fraud-check";

import { calculateAffordability } from "@/lib/utils/affordability-calculator";

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
import { ApplicationChatbot } from "./application-chatbot";
import { AdminDocumentUploadForm } from "@/components/admin-document-upload-form";
import type { Database } from "@/lib/types";
import type { MaxMoneyClientInput } from "@/lib/schemas";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailApplication from "./email-application";
import { EmailVerificationDialog } from "@/components/email-verification-dialog";
import { ProfileDocumentUpload } from "@/components/profile-document-upload";
import { ProfileDocumentsDisplay } from "@/components/profile-documents-display";
import { DecryptedApplication } from "@/lib/schemas";
import { ApproveLoanModal } from "@/components/approve-loan-modal";
import SmsApplication from "@/components/sms-application";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { declineApplicationAction } from "@/lib/actions/applications";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EmailHistory } from "@/components/email-history";
import type { EmailWithDetails } from "@/lib/queries/emails";
import { useRouter } from "next/navigation";
import { useInvalidateProfileDocuments } from "@/hooks/use-profile-documents";

interface ApplicationDetailClientProps {
  application: DecryptedApplication;
  apiChecks: Database["public"]["Tables"]["api_checks"]["Row"][];
  documents: Database["public"]["Tables"]["documents"]["Row"][];
  emailHistory: EmailWithDetails[];
}

export function ApplicationDetailClient({
  application,
  apiChecks,
  documents,
  emailHistory,
}: ApplicationDetailClientProps) {
  // URL state for active tab
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("personal-info")
  );

  const router = useRouter();

  const [isRunningFraudCheck, setIsRunningFraudCheck] = useState(false);
  const [fraudCheckResults, setFraudCheckResults] = useState<any>(null);
  const [currentDocuments, setCurrentDocuments] = useState(documents);
  const [isDeclining, setIsDeclining] = useState(false);
  const [profileDocuments, setProfileDocuments] = useState<
    Database["public"]["Tables"]["profile_documents"]["Row"][]
  >([]);
  const [isSendingOtv, setIsSendingOtv] = useState(false);
  const [isSendingToLms, setIsSendingToLms] = useState(false);
  const [isSearchingMaxMoney, setIsSearchingMaxMoney] = useState(false);
  const [maxMoneySearchResult, setMaxMoneySearchResult] = useState<any>(null);
  const [isUpdatingMaxMoneyId, setIsUpdatingMaxMoneyId] = useState(false);

  const invalidateProfileDocuments = useInvalidateProfileDocuments();

  // Filter for credit reports from Credit Check API checks
  const creditReports = apiChecks
    .filter(
      (check) =>
        check.check_type === "fraud_check" &&
        check.status === "passed" &&
        check.response_payload
    )
    .map((check) => ({
      id: check.id.toString(),
      check_type: check.check_type,
      status: check.status,
      created_at: check.checked_at,
      report_data: check.response_payload,
    }));

  // Filter API checks to show only the latest of each type
  const getLatestApiChecks = (
    checks: Database["public"]["Tables"]["api_checks"]["Row"][]
  ) => {
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
    invalidateProfileDocuments(application.user_id);
    toast.success("Document uploaded successfully");
  };

  const handleProfileDocumentUploadSuccess = (
    newDocument: Database["public"]["Tables"]["profile_documents"]["Row"]
  ) => {
    setProfileDocuments((prev) => [...prev, newDocument]);
    invalidateProfileDocuments(application.user_id);
    router.refresh();
    toast.success("Profile document uploaded successfully");
  };

  const handleDeclineApplication = async (reason?: string) => {
    setIsDeclining(true);
    try {
      const res = await declineApplicationAction(
        application.id,
        reason,
        application.profile?.phone_number || undefined
      );
      if (!res.success) {
        throw new Error(res.error || "Failed to decline application");
      }
      toast.success("Application has been declined successfully");
      // reload to show updated status (server action revalidated path but client may still have stale state)
      window.location.reload();
    } catch (error: any) {
      console.error("Error declining application:", error);
      toast.error(error.message || "Failed to decline application");
    } finally {
      setIsDeclining(false);
    }
  };

  const handleMaxMoneySearch = async () => {
    if (!application.id_number_decrypted) {
      toast.error("No ID number found for this application");
      return;
    }

    setIsSearchingMaxMoney(true);
    console.log(
      "Initiating MaxMoney client search for ID number:",
      application.id_number_decrypted
    );
    try {
      const response = await fetch("/api/max_money/search_client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_number: application.id_number_decrypted,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to search MaxMoney client");
      }

      setMaxMoneySearchResult(result);

      if (result.return_code === 0 && result.client_no) {
        toast.success(
          `Client found in MaxMoney! Client #${result.client_no} - ${result.client_name} ${result.client_surname}`
        );
      } else {
        toast.info("Client not found in MaxMoney system");
      }
    } catch (error: any) {
      console.error("MaxMoney search error:", error);
      toast.error(error.message || "Failed to search MaxMoney client");
      setMaxMoneySearchResult(null);
    } finally {
      setIsSearchingMaxMoney(false);
    }
  };

  const handleUpdateMaxMoneyId = async (clientNumber: string) => {
    setIsUpdatingMaxMoneyId(true);
    try {
      const response = await fetch(
        `/api/applications/${application.id}/update-max-money-id`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            max_money_id: clientNumber,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update Max Money ID");
      }

      toast.success("Max Money ID updated successfully");
      // Refresh the page to show the updated max_money_id
      window.location.reload();
    } catch (error: any) {
      console.error("Update Max Money ID error:", error);
      toast.error(error.message || "Failed to update Max Money ID");
    } finally {
      setIsUpdatingMaxMoneyId(false);
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

  const handleSendToLms = async () => {
    setIsSendingToLms(true);
    try {
      // Helper function to format date from YYYY-MM-DD to DD/MM/YYYY
      const formatDateForMaxMoney = (dateString: string | null) => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          const day = date.getDate().toString().padStart(2, "0");
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        } catch {
          return "";
        }
      };

      // Calculate net salary based on affordability data
      const affordabilityCalculation = calculateAffordability(
        application.monthly_income || 0,
        application.affordability
      );

      // Map application data to Max Money client schema format
      const clientData: MaxMoneyClientInput = {
        application_id: application.id,
        // Personal details
        first_name: application.first_name || "",
        surname: application.last_name || "",
        id_number: application.id_number_decrypted || "",
        date_of_birth: formatDateForMaxMoney(application.date_of_birth),
        gender: application.gender || "Male", // This will be mapped to number in the API
        id_type: "RSA Id", // Default to RSA ID, this will be mapped to number in the API

        // Contact details
        cellphone_no: application.phone_number || "",
        physical_address_line_1: application.home_address || "",
        physical_address_line_2: application.city || "",
        physical_address_line_3: "", // Not available in application schema
        physical_address_code: application.postal_code || "",
        physical_address_country: "ZA", // Default South Africa
        // physical_address_province:  "", // Default province code

        // Employment details
        occupation: application.job_title || "",
        employer_code: "", // Not available in application schema
        employee_no: "", // Not available in application schema
        gross_salary: application.monthly_income || 0,
        // Net salary calculated from affordability data (monthly_income + additional_income - deductions)
        net_salary: affordabilityCalculation.netIncome,
        total_expenses: affordabilityCalculation.totalExpenses,

        // Banking details
        bank_account_no: application.bank_account_number || "",
        bank_branch_code: application.branch_code || "",
        bank_account_type: 2, // Default to Savings (value 2 from enums)

        // Payment details
        payback_type_id: 1, // Default payback type
        payment_frequency: 4, // Default to Monthly (value 4 from enums)
        payment_move_direction: 2, // Default to Forward (required field)
        day_of_month: application.salary_date || 25,

        // References - using next of kin as reference
        reference_first_name: application.next_of_kin_name?.split(" ")[0] || "",
        reference_surname:
          application.next_of_kin_name?.split(" ").slice(1).join(" ") || "not_provided",
        reference_contact_no: application.next_of_kin_phone_number || "not_provided",
        reference_relationship: 1, // Default relationship type

        // Consents
        client_credit_enquiry_consent: true,
        avr_enquiry: true,
        sign_mandate: true,
        marketing_consent: false,
      };

      const response = await fetch("/api/max_money/create_client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send to LMS");
      }

      const result = await response.json();
      toast.success("Successfully sent to Max Money LMS!");

      // Optionally refresh the page or update application status
      window.location.reload();
    } catch (error: any) {
      console.error("LMS submission error:", error);
      toast.error(error.message || "Failed to send to LMS");
    } finally {
      setIsSendingToLms(false);
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
    <div className="container mx-auto p-6 space-y-6 relative">
      <ApplicationChatbot
        documents={currentDocuments}
        applicationId={application.id}
      />
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/applications">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Link>
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
            <h1 className="text-2xl font-bold">
              {application.profile?.full_name && (
                <span className="">{application.profile.full_name}</span>
              )}
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-muted-foreground text-xs">
                Application #{application.id} • Created on{" "}
                {formatDate(application.created_at)}
              </p>
              {application.max_money_id && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Max Money ID:
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {application.max_money_id}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <ApproveLoanModal
            applicationId={application.id}
            currentAmount={application.application_amount || 1000}
            currentTerm={application.term || 30}
            applicantName={application.profile?.full_name}
            onApprovalSuccess={() => window.location.reload()}
          >
            <Button
              disabled={
                isDeclining ||
                isSendingOtv ||
                application.status === "approved" ||
                application.status === "declined" ||
                application.status === "submitted_to_lender"
              }
              variant="default"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Loan
            </Button>
          </ApproveLoanModal>
          {/* Primary action: Submit to BraveLender */}
          <Button
            onClick={(e) => {
              e.preventDefault();
              handleFraudCheck(
                application,
                setIsRunningFraudCheck,
                setFraudCheckResults
              );
            }}
            className="cursor-pointer"
            disabled={
              isRunningFraudCheck ||
              isDeclining ||
              application.status === "declined" ||
              application.status === "submitted_to_lender"
            }
          >
            <Shield className="h-4 w-4" />
            {isRunningFraudCheck
              ? "Running Credit Check..."
              : "Run Credit Check"}
          </Button>

          {/* MaxMoney Search Button */}
          <Button
            onClick={handleMaxMoneySearch}
            disabled={
              isSearchingMaxMoney ||
              isDeclining ||
              isRunningFraudCheck ||
              !application.id_number_decrypted
            }
            variant="outline"
          >
            {isSearchingMaxMoney ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {isSearchingMaxMoney ? "Searching..." : "Check MaxMoney"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="cursor-pointer"
                disabled={
                  isRunningFraudCheck ||
                  isDeclining ||
                  application.status === "declined" ||
                  application.status === "approved" ||
                  application.status === "submitted_to_lender"
                }
              >
                <XCircle className="h-4 w-4" />
                {isDeclining ? "Declining..." : "Decline Application"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-3xl w-full">
              <AlertDialogHeader>
                <AlertDialogTitle>Decline Application</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will mark the application as declined. You can
                  optionally provide a reason below. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label
                  htmlFor="decline-reason-select"
                  className="text-sm font-medium"
                >
                  Decline Reason
                </Label>
                <Select disabled={isDeclining}>
                  <SelectTrigger
                    className="w-full max-w-2xl"
                    id="decline-reason-select"
                  >
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      className="w-full max-w-2xl"
                      value="Thank you for your recent loan application with Liyana Finance. Due to missing key information on your application, we cannot approve your application at this time. NCRCP18217"
                    >
                      Thank you for your recent loan application with Liyana
                      Finance. Due to missing key information on your
                      application, we cannot approve your application at this
                      time. NCRCP18217
                    </SelectItem>
                    <SelectItem
                      className="w-full max-w-2xl"
                      value="Thank you for your loan application. Unfortunately it has not been approved at this time. We appreciate your interest and you're welcome to reapply in future. NCRCP18217"
                    >
                      Thank you for your loan application. Unfortunately it has
                      not been approved at this time. We appreciate your
                      interest and you're welcome to reapply in future.
                      NCRCP18217
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeclining}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeclining}
                  onClick={() => {
                    const select = document.getElementById(
                      "decline-reason-select"
                    ) as HTMLSelectElement | null;
                    let reason = select?.value;
                    if (!reason) {
                      reason =
                        "Thank you for your loan application. Unfortunately it has not been approved at this time. We appreciate your interest and you're welcome to reapply in future. NCRCP18217";
                    }
                    handleDeclineApplication(reason);
                  }}
                >
                  {isDeclining ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Declining...
                    </span>
                  ) : (
                    "Confirm Decline"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={handleSendToLms}
            disabled={
              isRunningFraudCheck ||
              isDeclining ||
              isSendingOtv ||
              isSendingToLms ||
              application.status === "declined" ||
              application.status === "submitted_to_lender"
            }
            className="w-[220px]"
          >
            {isSendingToLms ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending to MaxMoney...
              </span>
            ) : (
              <>
                <SendHorizonal className="h-4 w-4 mr-2" />
                Send To MaxMoney
              </>
            )}
          </Button>
        </div>
      </div>

      {/* MaxMoney Search Results */}
      {maxMoneySearchResult && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Search className="h-5 w-5" />
              MaxMoney Search Results
            </CardTitle>
            <CardDescription>
              {application.max_money_id ? (
                <div className="flex items-center gap-2">
                  <span>Current Max Money ID: </span>
                  <Badge variant="secondary">{application.max_money_id}</Badge>
                </div>
              ) : (
                <span className="text-orange-600">
                  No Max Money ID assigned
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {maxMoneySearchResult.return_code === 0 &&
            maxMoneySearchResult.client_no ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      Client Found
                    </Badge>
                    {!application.max_money_id && (
                      <Badge className="bg-orange-100 text-orange-800">
                        Not Linked
                      </Badge>
                    )}
                    {application.max_money_id &&
                      application.max_money_id !==
                        maxMoneySearchResult.client_no && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          ID Mismatch
                        </Badge>
                      )}
                  </div>
                  {(!application.max_money_id ||
                    application.max_money_id !==
                      maxMoneySearchResult.client_no) && (
                    <Button
                      onClick={() =>
                        handleUpdateMaxMoneyId(maxMoneySearchResult.client_no)
                      }
                      disabled={isUpdatingMaxMoneyId}
                      variant="outline"
                      size="sm"
                    >
                      {isUpdatingMaxMoneyId ? (
                        <span className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Link to Application
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Client Number:
                    </span>
                    <p className="font-semibold">
                      {maxMoneySearchResult.client_no}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Name:
                    </span>
                    <p className="font-semibold">
                      {maxMoneySearchResult.client_name}{" "}
                      {maxMoneySearchResult.client_surname}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      ID Number:
                    </span>
                    <p className="font-semibold">
                      {maxMoneySearchResult.client_id}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Status:
                    </span>
                    <p className="font-semibold">
                      {maxMoneySearchResult.cli_status}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Employer:
                    </span>
                    <p className="font-semibold">
                      {maxMoneySearchResult.employer_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Employment Type:
                    </span>
                    <p className="font-semibold">
                      {maxMoneySearchResult.employment_type || "N/A"}
                    </p>
                  </div>
                  {maxMoneySearchResult.budget_available_amount && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Available Budget:
                      </span>
                      <p className="font-semibold text-green-600">
                        R
                        {parseFloat(
                          maxMoneySearchResult.budget_available_amount
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {maxMoneySearchResult.budget_date && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Budget Date:
                      </span>
                      <p className="font-semibold">
                        {maxMoneySearchResult.budget_date}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800">
                  Client Not Found
                </Badge>
                <span className="text-sm text-muted-foreground">
                  This client does not exist in the MaxMoney system.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full ">
          <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
          <TabsTrigger value="contact-info">Contact Info</TabsTrigger>
          <TabsTrigger value="employment-info"> Employment Info</TabsTrigger>
          <TabsTrigger value="loan-banking-info">
            Loan & Banking Info
          </TabsTrigger>
          <TabsTrigger value="checks">Credit Checks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>
        <TabsContent value="personal-info">
          {/* Personal Information */}
          <PersonalInfoCard
            application={application}
            apiChecks={apiChecks}
            onOtvRequest={handleOtvRequest}
            isSendingOtv={isSendingOtv}
          />
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
                <div className="flex items-center justify-between bg-yellow-200 p-3 rounded-lg">
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
        <TabsContent className="w-full" value="emails">
          {/* Emails Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Send Email</CardTitle>
                <CardDescription>
                  Send emails to the applicant regarding this application
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <EmailApplication
                  id={application.id}
                  creditReports={creditReports}
                />
              </CardContent>
            </Card>

            <EmailHistory emails={emailHistory} />
          </div>
        </TabsContent>
        <TabsContent className="w-full" value="sms">
          {/* SMS Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>SMS Communication</CardTitle>
              <CardDescription>
                Send SMS messages and view SMS history for this applicant
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full">
              <SmsApplication
                applicationId={application.id}
                profileId={application.user_id}
                phoneNumber={application.profile?.phone_number || ""}
                applicantName={application.profile?.full_name || "Applicant"}
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
