import { redirect } from "next/navigation";
import { ApplicationLayout } from "@/components/application-layout";
import { type ApplicationStep } from "@/components/application-progress";
import { createClient } from "@/lib/server";
import { getApplicationsByUser } from "@/lib/queries/applications";
import { LoanApplicationForm } from "@/components/loan-application-form";

export default async function ApplyPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Check for existing applications to determine the current step
  let applications;
  let currentStep: ApplicationStep = "personal-info";

  try {
    applications = await getApplicationsByUser(data.user.id, { limit: 1 }); // Get latest application

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
        <div className="space-y-8 max-w-2xl mx-auto">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              Apply for a Payday Cash Loan
            </h2>
            <p className="text-muted-foreground mb-2 text-sm">
              Complete the application form below to apply for a payday cash
              loan. The process takes just a few minutes and requires basic
              personal and employment information.
            </p>
            <LoanApplicationForm />
          </section>
        </div>
      </div>
    </div>
  );
}
