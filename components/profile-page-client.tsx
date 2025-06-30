"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Clock, FileText, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/types";

interface ProfilePageClientProps {
  applications: Database["public"]["Tables"]["applications"]["Row"][] | null;
}

export function ProfilePageClient({ applications }: ProfilePageClientProps) {
  const hasApplications = applications && applications.length > 0;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {hasApplications ? (
        // Show applications with option to create new
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">My Applications</h2>
            <Button asChild className="flex items-center gap-2">
              <Link href="/apply">
                <Plus className="h-4 w-4" />
                New Application
              </Link>
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
        // Show welcome message for new users
        <section className="text-center space-y-6">
          <h2 className="text-2xl font-semibold">Welcome to Liyana</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            You haven't submitted any loan applications yet. Get started by
            applying for a payday cash loan. The process is quick and easy.
          </p>
          <Button asChild size="lg" className="flex items-center gap-2 mx-auto">
            <Link href="/apply">
              <Plus className="h-4 w-4" />
              Apply for a Loan
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
