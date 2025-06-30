import { redirect } from "next/navigation";
import { ApplicationLayout } from "@/components/application-layout";
import { type ApplicationStep } from "@/components/application-progress";
import { createClient } from "@/lib/server";
import { getApplicationsByUser } from "@/lib/queries/applications";
import { ProfilePageClient } from "@/components/profile-page-client";

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
    applications = await getApplicationsByUser(data.user.id, { limit: 10 }); // Get up to 10 applications

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
          <ProfilePageClient
            applications={applications || null}
            showCompletedApplication={showCompletedApplication}
            initialCurrentStep={currentStep}
          />
        </ApplicationLayout>
      </div>
    </div>
  );
}
