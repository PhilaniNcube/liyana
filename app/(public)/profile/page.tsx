import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { getApplicationsByUser } from "@/lib/queries/applications";
import { getApprovedLoansByUser } from "@/lib/queries/approved_loans";
import { getPoliciesByUser } from "@/lib/queries/policies";
import { ProfilePageClient } from "@/components/profile-page-client";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user profile information
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", data.user.id)
    .single();

  // Get existing applications
  let applications;
  let loans;
  let policies;

  try {
    applications = await getApplicationsByUser(data.user.id, { limit: 10 }); // Get up to 10 applications
  } catch (err) {
    console.error("Error fetching applications:", err);
    applications = null;
  }

  try {
    loans = await getApprovedLoansByUser(data.user.id, { limit: 10 }); // Get up to 10 loans
  } catch (err) {
    console.error("Error fetching loans:", err);
    loans = null;
  }

  try {
    policies = await getPoliciesByUser(); // Get all policies
  } catch (err) {
    console.error("Error fetching policies:", err);
    policies = null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ProfilePageClient
          applications={applications || null}
          loans={loans || null}
          policies={policies || null}
          userEmail={data.user.email}
          userFullName={profile?.full_name}
        />
      </div>
    </div>
  );
}
