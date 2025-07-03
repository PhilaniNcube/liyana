import { redirect } from "next/navigation";
import { ApplicationLayout } from "@/components/application-layout";
import { type ApplicationStep } from "@/components/application-progress";
import { createClient } from "@/lib/server";
import { getApplicationsByUser } from "@/lib/queries/applications";
import { getUserProfile } from "@/lib/queries/user";
import { decryptValue } from "@/lib/encryption";
import { LoanApplicationForm } from "@/components/loan-application-form";

// Helper function to decrypt sensitive data in application
function decryptApplicationData(application: any) {
  if (!application) return application;

  const decryptedApplication = { ...application };

  // Decrypt ID number if it exists
  if (application.id_number) {
    try {
      decryptedApplication.id_number = decryptValue(application.id_number);
    } catch (error) {
      console.warn(
        "Failed to decrypt ID number for application:",
        application.id,
        error
      );
      // Keep the original encrypted value or set to empty string
      decryptedApplication.id_number = "";
    }
  }

  // Add any other encrypted fields here in the future
  // For example:
  // if (application.encrypted_bank_account) {
  //   try {
  //     decryptedApplication.bank_account_number = decryptValue(application.encrypted_bank_account);
  //   } catch (error) {
  //     console.warn("Failed to decrypt bank account:", error);
  //     decryptedApplication.bank_account_number = "";
  //   }
  // }

  return decryptedApplication;
}

export default async function ApplyPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Check for existing applications to determine the current step and get previous data
  let applications;
  let currentStep: ApplicationStep = "personal-info";
  let previousApplicationData = null;
  let hasPreviousApplication = false;
  let userProfile = null;

  try {
    // Get user profile for full name
    userProfile = await getUserProfile(data.user.id);

    applications = await getApplicationsByUser(data.user.id, { limit: 1 }); // Get latest application

    if (applications && applications.length > 0) {
      const latestApplication = applications[0];
      hasPreviousApplication = true;
      previousApplicationData = latestApplication;

      // Decrypt previous application data
      previousApplicationData = decryptApplicationData(latestApplication);

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
            <LoanApplicationForm
              previousApplicationData={previousApplicationData}
              hasPreviousApplication={hasPreviousApplication}
              userEmail={data.user.email}
              userFullName={userProfile?.full_name}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
