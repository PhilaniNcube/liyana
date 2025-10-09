import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { getApprovedLoansByUser } from "@/lib/queries/approved_loans";
import { MyLoansClient } from "@/components/my-loans-client";
import { get } from "http";
import { getCurrentUser } from "@/lib/queries";

export default async function MyLoansPage() {
  const user = await getCurrentUser();


  if (!user) {
    redirect("/auth/login?next=/profile/my-loans");
  }

  // Get user's loans
  let loans;
  try {
    loans = await getApprovedLoansByUser(user.id, { limit: 50 }); // Get up to 50 loans
  } catch (err) {
    console.error("Error fetching loans:", err);
    loans = null;
  }

  return <MyLoansClient loans={loans || []} userId={user.id} />;
}
