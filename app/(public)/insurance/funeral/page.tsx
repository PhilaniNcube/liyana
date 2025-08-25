import React from "react";
import FuneralPolicyForm from "./_components/funeral-policy-form";
import FuneralPremiumCalculatorDialog from "./_components/funeral-premium-calculator-dialog";
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/insurance/funeral");
  }
  return (
    <section className="py-8 space-y-8">
      {/* Premium Calculator Button */}
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Funeral Insurance</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get comprehensive funeral cover for you and your family. Calculate
            your premium first to see what your monthly costs would be.
          </p>
          <FuneralPremiumCalculatorDialog />
        </div>
      </div>

      {/* Policy Application Form */}
      <div className="container mx-auto px-4">
        <FuneralPolicyForm />
      </div>
    </section>
  );
}
