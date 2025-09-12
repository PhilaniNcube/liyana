import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { getApprovedLoansByUser } from "@/lib/queries/approved_loans";
import { MyLoansClient } from "@/components/my-loans-client";

export default async function MyLoansPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get user's loans
  let loans;
  try {
    loans = await getApprovedLoansByUser(data.user.id, { limit: 50 }); // Get up to 50 loans
  } catch (err) {
    console.error("Error fetching loans:", err);
    loans = null;
  }

  return <MyLoansClient loans={loans || []} userId={data.user.id} />;
}
