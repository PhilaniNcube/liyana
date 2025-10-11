"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendHorizonal, Search } from "lucide-react";
import { LoanOverview } from "../../_components/loan-overview";
import { DownloadAgreementButton } from "./download-agreement-button";
import { DownloadCreditAgreementButton } from "./download-credit-agreement-button";
import {
  PersonalInfoCard,
  ContactInfoCard,
  EmploymentInfoCard,
  LoanBankingInfoCard,
  AdditionalInfoCard,
} from "@/components/application-detail";
import { ProfileDocumentsDisplay } from "@/components/profile-documents-display";
import { ProfileDocumentUpload } from "../../_components/profile-document-upload";
import LoanEmailTab from "./loan-email-tab";
import { SendToMaxMoneyDialog } from "./send-to-maxmoney-dialog";
import { MaxMoneySearchDialog } from "./maxmoney-search-dialog";
import type { EmailWithDetails } from "@/lib/queries/emails";

interface LoanPageClientProps {
  loan: any; // We'll type this properly based on your getLoan return type
  emailHistory: EmailWithDetails[];
  borrowerEmail?: string;
  borrowerName?: string;
  apiChecks?: any[];
}

export function LoanPageClient({
  loan,
  emailHistory,
  borrowerEmail,
  borrowerName,
  apiChecks = [],
}: LoanPageClientProps) {
  const [maxMoneyClientNumber, setMaxMoneyClientNumber] = useState<string>(
    loan.application?.max_money_id || ""
  );

  const handleClientFound = (clientData: any) => {
    if (clientData.client_no) {
      setMaxMoneyClientNumber(clientData.client_no);
    }
  };

  return (
    <div className="space-y-6">
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
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">Approved Loan</CardTitle>
                <CardDescription>
                  Application and repayment details for the selected record.
                </CardDescription>
              </div>

              {/* MaxMoney Integration Section - Above Tabs */}
              <div className="flex flex-col items-end gap-3">
                {maxMoneyClientNumber && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">MaxMoney Client ID:</p>
                    <Badge variant="secondary" className="font-mono">
                      {maxMoneyClientNumber}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-2">
                  {/* Search MaxMoney Client */}
                  <MaxMoneySearchDialog
                    idNumber={loan.application?.id_number}
                    currentMaxMoneyId={loan.application?.max_money_id}
                    onClientFound={handleClientFound}
                  >
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!loan.application?.id_number}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search Client
                    </Button>
                  </MaxMoneySearchDialog>

                  {/* Send to MaxMoney */}
                  <SendToMaxMoneyDialog
                    loan={{
                      id: loan.id,
                      profile_id: loan.profile_id,
                      loan_amount: loan.approved_loan_amount || 0,
                      term: loan.loan_term_days || 30,
                      max_money_id: loan.application?.max_money_id
                    }}
                    maxMoneyClientNumber={maxMoneyClientNumber}
                    onSuccess={() => window.location.reload()}
                  >
                    <Button size="sm" disabled={!maxMoneyClientNumber}>
                      <SendHorizonal className="h-4 w-4 mr-2" />
                      Send to MaxMoney
                    </Button>
                  </SendToMaxMoneyDialog>
                </div>

                {!loan.application?.id_number && (
                  <p className="text-xs text-orange-600 text-right max-w-48">
                    No ID number available from the original application. Cannot search MaxMoney.
                  </p>
                )}
              </div>
            </div>
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
                    apiChecks={apiChecks}
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
                  borrowerEmail={borrowerEmail}
                  borrowerName={borrowerName}
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
}