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

interface PageProps {
  params: Promise<{ id: number }>;
}

const LoanPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const loan = await getLoan(id);

  // Render loan details in a card UI
  return (
    <main className="container mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Loan Application
        </h1>
        <p className="text-sm text-muted-foreground">
          Review status, payment schedule, and key details for this approved
          loan.
        </p>
      </header>

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
    </main>
  );
};

export default LoanPage;
