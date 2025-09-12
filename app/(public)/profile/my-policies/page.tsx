import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { getPoliciesByUser } from "@/lib/queries/policies";
import { MyPoliciesClient } from "@/components/my-policies-client";

export default async function MyPoliciesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user's policies
  let policies;
  try {
    policies = await getPoliciesByUser(); // Get all policies
  } catch (err) {
    console.error("Error fetching policies:", err);
    policies = null;
  }

  if (!policies || policies.length === 0) {
    return <p>No policies found.</p>;
  }

  return <MyPoliciesClient policies={policies || []} userId={data.user.id} />;
}
