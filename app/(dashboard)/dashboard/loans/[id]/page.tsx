import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLoan } from "@/lib/queries/loans";
import React from "react";
import { LoanOverview } from "../_components/loan-overview";
import { Separator } from "@/components/ui/separator";
import { BorrowerDetails } from "../_components/borrower-details";
import { ProfileDocumentsDisplay } from "@/components/profile-documents-display";
import { ProfileDocumentUpload } from "../_components/profile-document-upload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DownloadAgreementButton } from "./_components/download-agreement-button";
import { DownloadCreditAgreementButton } from "./_components/download-credit-agreement-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PersonalInfoCard,
  ContactInfoCard,
  EmploymentInfoCard,
  LoanBankingInfoCard,
  AdditionalInfoCard,
  FraudCheckResults,
} from "@/components/application-detail";
import LoanEmailTab from "./_components/loan-email-tab";
import { createClient } from "@/lib/server";
import { getEmailsForLoanWithDetails } from "@/lib/queries/emails";
import { LoanPageClient } from "./_components/loan-page-client";


interface PageProps {
  params: Promise<{ id: number }>;
}

const LoanPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const loan = await getLoan(id);

  // Fetch email history for this loan
  const emailHistory = await getEmailsForLoanWithDetails(id);

  // Get borrower profile for email
  const supabase = await createClient();
  let borrowerProfile = null;

  if (loan.profile_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", loan.profile_id)
      .single();
    borrowerProfile = profile;
  }

  // Fetch API checks for the loan application
  let apiChecks: any[] = [];
  if (loan.application?.id) {
    const { data: checks } = await supabase
      .from("api_checks")
      .select("*")
      .eq("application_id", loan.application.id)
      .order("created_at", { ascending: false });
    apiChecks = checks || [];
  }

  // Get borrower email from auth user if profile doesn't have it
  let borrowerEmail = borrowerProfile?.email;
  let borrowerName = borrowerProfile?.full_name;

  if (loan.profile_id && !borrowerEmail) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(
        loan.profile_id
      );
      borrowerEmail = authUser?.user?.email;
      borrowerName = borrowerName || authUser?.user?.user_metadata?.full_name;
    } catch (error) {
      console.warn("Could not fetch auth user for loan email");
    }
  }

  // Render loan details using the client component
  return (
    <LoanPageClient
      loan={loan}
      emailHistory={emailHistory}
      borrowerEmail={borrowerEmail || undefined}
      borrowerName={borrowerName || undefined}
      apiChecks={apiChecks}
    />
  );
};

export default LoanPage;
