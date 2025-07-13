import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { getApplicationsByUser } from "@/lib/queries/applications";
import { ProfilePageClient } from "@/components/profile-page-client";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get existing applications
  let applications;

  try {
    applications = await getApplicationsByUser(data.user.id, { limit: 10 }); // Get up to 10 applications
  } catch (err) {
    console.error("Error fetching applications:", err);
    applications = null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <ProfilePageClient applications={applications || null} />
      </div>
    </div>
  );
}
