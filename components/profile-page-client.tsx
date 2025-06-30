"use client";

import { useState } from "react";
import { LoanApplicationForm } from "@/components/loan-application-form";
import { type ApplicationStep } from "@/components/application-progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Clock, FileText, Plus, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/types";

interface ProfilePageClientProps {
  applications: Database["public"]["Tables"]["applications"]["Row"][] | null;
  showCompletedApplication: boolean;
  initialCurrentStep: ApplicationStep;
}

export function ProfilePageClient({
  applications,
  showCompletedApplication,
  initialCurrentStep,
}: ProfilePageClientProps) {
  const [showNewApplicationForm, setShowNewApplicationForm] = useState(false);
  const [currentStep, setCurrentStep] =
    useState<ApplicationStep>(initialCurrentStep);

  // If user wants to create a new application, always show the form
  if (showNewApplicationForm) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <section>
          <div className="flex items-center gap-4 mb-4">
            {showCompletedApplication && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewApplicationForm(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Applications
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-semibold">
                {showCompletedApplication
                  ? "New Loan Application"
                  : "Apply for a Payday Cash Loan"}
              </h2>
            </div>
          </div>
          <p className="text-muted-foreground mb-6">
            Complete the application form below to apply for a payday cash loan.
            The process takes just a few minutes and requires basic personal and
            employment information.
          </p>
          <LoanApplicationForm />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {showCompletedApplication && applications ? (
        // Show completed application status with option to create new
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Application Status</h2>
            <Button
              onClick={() => setShowNewApplicationForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </div>

          {/* Show all applications */}
          <div className="space-y-4">
            {applications.map((application, index) => (
              <Card key={application.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    Application #{application.id}
                    {index === 0 && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (Latest)
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {application.status === "in_review" &&
                      "Your application is being reviewed"}
                    {application.status === "approved" &&
                      "Your application has been approved"}
                    {application.status === "declined" &&
                      "Application was declined"}
                    {application.status === "pre_qualifier" &&
                      "Application in progress"}
                    {application.status === "pending_documents" &&
                      "Documents required"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Loan Amount
                      </p>
                      <p className="font-medium">
                        R{application.application_amount?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">
                        {application.status.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Term</p>
                      <p className="font-medium">{application.term} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="font-medium">
                        {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Alert>
                    {application.status === "in_review" && (
                      <>
                        <Clock className="h-4 w-4" />
                        <AlertTitle>Under Review</AlertTitle>
                        <AlertDescription>
                          Our team is currently reviewing your application and
                          documents. You'll receive an email notification once
                          the review is complete.
                        </AlertDescription>
                      </>
                    )}
                    {application.status === "approved" && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Application Approved</AlertTitle>
                        <AlertDescription>
                          Congratulations! Your loan application has been
                          approved. Check your email for the loan agreement and
                          next steps.
                        </AlertDescription>
                      </>
                    )}
                    {application.status === "declined" && (
                      <>
                        <FileText className="h-4 w-4 text-red-600" />
                        <AlertTitle>Application Declined</AlertTitle>
                        <AlertDescription>
                          Unfortunately, your loan application was not approved
                          at this time. Please check your email for more
                          information. You can apply again.
                        </AlertDescription>
                      </>
                    )}
                    {application.status === "pending_documents" && (
                      <>
                        <FileText className="h-4 w-4 text-blue-600" />
                        <AlertTitle>Documents Required</AlertTitle>
                        <AlertDescription>
                          Please upload the required documents to complete your
                          application.
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        // Show loan application form for new users
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Apply for a Payday Cash Loan
          </h2>
          <p className="text-muted-foreground mb-6">
            Complete the application form below to apply for a payday cash loan.
            The process takes just a few minutes and requires basic personal and
            employment information.
          </p>
          <LoanApplicationForm />
        </section>
      )}
    </div>
  );
}
