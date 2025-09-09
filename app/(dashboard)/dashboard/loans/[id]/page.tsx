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

  // Render loan details in a card UI
  return (
    <div className=" space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Loan Application
        </h1>
        <p className="text-sm text-muted-foreground">
          Review status, payment schedule, and key details for this approved
          loan.
        </p>
      </section>
      <ScrollArea>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Approved Loan</CardTitle>
            <CardDescription>
              {"Application and repayment details for the selected record."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs
              defaultValue={loan.application ? "personal-info" : "loan-details"}
              className="mt-0 w-full"
            >
              <TabsList className="flex w-full flex-wrap">
                {loan.application && (
                  <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
                )}
                <TabsTrigger value="loan-details">Loan Details</TabsTrigger>
                {loan.application && (
                  <>
                    <TabsTrigger value="contact-info">Contact Info</TabsTrigger>
                    <TabsTrigger value="employment-info">
                      Employment Info
                    </TabsTrigger>
                    <TabsTrigger value="loan-banking-info">
                      Loan & Banking Info
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="emails">Emails</TabsTrigger>
              </TabsList>

              {loan.application && (
                <TabsContent value="personal-info" className="mt-4 space-y-4">
                  <PersonalInfoCard
                    application={loan.application as any}
                    apiChecks={[]}
                  />
                </TabsContent>
              )}

              <TabsContent value="loan-details" className="mt-4 space-y-4">
                <LoanOverview loan={loan} />
                <div className="pt-2 border-t">
                  <div className="flex gap-2 flex-wrap bg-yellow-200 p-3 w-fit">
                    <DownloadAgreementButton loanId={loan.id} />
                    <DownloadCreditAgreementButton loanId={loan.id} />
                  </div>
                </div>
              </TabsContent>

              {loan.application && (
                <>
                  <TabsContent value="contact-info" className="mt-4 space-y-4">
                    <ContactInfoCard application={loan.application as any} />
                  </TabsContent>
                  <TabsContent
                    value="employment-info"
                    className="mt-4 space-y-4"
                  >
                    <EmploymentInfoCard application={loan.application as any} />
                  </TabsContent>
                  <TabsContent
                    value="loan-banking-info"
                    className="mt-4 space-y-4"
                  >
                    <LoanBankingInfoCard
                      application={loan.application as any}
                    />
                    <AdditionalInfoCard application={loan.application as any} />
                  </TabsContent>
                </>
              )}

              <TabsContent value="documents" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProfileDocumentsDisplay profileId={loan.profile_id} />
                  <ProfileDocumentUpload profileId={loan.profile_id} />
                </div>
              </TabsContent>

              <TabsContent value="emails" className="mt-4 w-full">
                <LoanEmailTab
                  loanId={loan.id}
                  borrowerEmail={borrowerEmail || undefined}
                  borrowerName={borrowerName || undefined}
                  emailHistory={emailHistory}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {!loan.application && (
          <p className="text-sm text-muted-foreground mt-4">
            No application data linked to this loan.
          </p>
        )}
      </ScrollArea>
    </div>
  );
};

export default LoanPage;
