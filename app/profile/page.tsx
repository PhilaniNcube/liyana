import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { LoanApplicationForm } from "@/components/loan-application-form";
import { createClient } from "@/lib/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
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
        </div>
      </div>
    </div>
  );
}
