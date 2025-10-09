import React from "react";
import FuneralPolicyForm from "./_components/funeral-policy-form";
import FuneralPremiumCalculatorDialog from "./_components/funeral-premium-calculator-dialog";
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";

export default async function Page() {

  const user = await getCurrentUser();
  console.log("Current user in funeral insurance page:", user);

  if (!user) {
    redirect("/auth/login?next=/insurance/funeral");
  }
  return (
    <section className="py-8 space-y-8">
      {/* Premium Calculator Button */}
      <div className="container mx-auto px-4"></div>

      {/* Policy Application Form */}
      <div className="container mx-auto px-4">
        <FuneralPolicyForm />
      </div>
    </section>
  );
}
