import { redirect } from "next/navigation";
import { LoanApplicationForm } from "@/components/loan-application-form";
import { ApplicationLayout } from "@/components/application-layout";
import { type ApplicationStep } from "@/components/application-progress";
import { createClient } from "@/lib/server";
import { getApplicationsByUser } from "@/lib/queries/applications";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Clock, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Check for existing applications to determine the current step
  let applications;
  let currentStep: ApplicationStep = "personal-info";
  let showCompletedApplication = false;

  try {
    applications = await getApplicationsByUser(data.user.id, { limit: 1 });

    if (applications && applications.length > 0) {
      const latestApplication = applications[0];

      // Determine step based on application status
      switch (latestApplication.status) {
        case "pre_qualifier":
          currentStep = "employment-loan";
          break;
        case "pending_documents":
          currentStep = "documents";
          break;
        case "in_review":
        case "approved":
        case "declined":
          currentStep = "complete";
          showCompletedApplication = true;
          break;
        default:
          currentStep = "personal-info";
      }
    }
  } catch (err) {
    console.error("Error fetching applications:", err);
    // Continue with default step if query fails
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <ApplicationLayout currentStep={currentStep}>
          <div className="space-y-8 max-w-2xl mx-auto">
            {showCompletedApplication && applications ? (
              // Show completed application status
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Application Status
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      Application Completed
                    </CardTitle>
                    <CardDescription>
                      Your loan application has been successfully submitted and
                      is being processed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Application ID
                        </p>
                        <p className="font-medium">{applications[0].id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Loan Amount
                        </p>
                        <p className="font-medium">
                          R
                          {applications[0].application_amount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">
                          {applications[0].status.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Submitted
                        </p>
                        <p className="font-medium">
                          {new Date(
                            applications[0].created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Alert>
                      {applications[0].status === "in_review" && (
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
                      {applications[0].status === "approved" && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertTitle>Application Approved</AlertTitle>
                          <AlertDescription>
                            Congratulations! Your loan application has been
                            approved. Check your email for the loan agreement
                            and next steps.
                          </AlertDescription>
                        </>
                      )}
                      {applications[0].status === "declined" && (
                        <>
                          <FileText className="h-4 w-4 text-red-600" />
                          <AlertTitle>Application Declined</AlertTitle>
                          <AlertDescription>
                            Unfortunately, your loan application was not
                            approved at this time. Please check your email for
                            more information.
                          </AlertDescription>
                        </>
                      )}
                    </Alert>
                  </CardContent>
                </Card>
              </section>
            ) : (
              // Show loan application form
              <section>
                <h2 className="text-2xl font-semibold mb-4">
                  Apply for a Payday Cash Loan
                </h2>
                <p className="text-muted-foreground mb-6">
                  Complete the application form below to apply for a payday cash
                  loan. The process takes just a few minutes and requires basic
                  personal and employment information.
                </p>
                <LoanApplicationForm />
              </section>
            )}
          </div>
        </ApplicationLayout>
      </div>
    </div>
  );
}
