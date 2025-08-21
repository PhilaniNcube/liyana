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

interface PageProps {
  params: Promise<{ id: number }>;
}

const LoanPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const loan = await getLoan(id);

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
              className="mt-0"
            >
              <TabsList className="flex flex-wrap">
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
              </TabsList>

              {loan.application && (
                <TabsContent value="personal-info" className="mt-4 space-y-4">
                  <PersonalInfoCard application={loan.application as any} />
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
