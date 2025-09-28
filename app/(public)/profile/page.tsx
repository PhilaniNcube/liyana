import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { getApplicationsByUser } from "@/lib/queries/applications";
import { getApprovedLoansByUser } from "@/lib/queries/approved_loans";
import { getPoliciesByUser } from "@/lib/queries/policies";
import { ProfileOverviewClient } from "@/components/profile-overview-client";
import { getCurrentUser } from "@/lib/queries";


export default async function ProfilePage() {
  

 
const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?next=/profile");
  }

  // Get existing applications
  let applications;
  let loans;
  let policies;

  try {
    applications = await getApplicationsByUser(user.id, { limit: 10 }); // Get up to 10 applications
  } catch (err) {
    console.error("Error fetching applications:", err);
    applications = null;
  }

  try {
    loans = await getApprovedLoansByUser(user.id, { limit: 10 }); // Get up to 10 loans
  } catch (err) {
    loans = null;
  }

  try {
    policies = await getPoliciesByUser(); // Get all policies
  } catch (err) {
    policies = null;
  }

  return (
    <ProfileOverviewClient
      applications={applications || null}
      loans={loans || null}
      policies={policies || null}
      userEmail={user.email}
      userFullName={user.full_name}
    />
  );
}
