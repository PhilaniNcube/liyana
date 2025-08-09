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
            <LoanOverview loan={loan} />
          </CardContent>
        </Card>

        <Separator />

        <BorrowerDetails applicationId={loan.application_id} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <ProfileDocumentsDisplay profileId={loan.profile_id} className="" />
          <ProfileDocumentUpload
            className="h-full"
            profileId={loan.profile_id}
          />
        </div>
      </ScrollArea>
    </div>
  );
};

export default LoanPage;
