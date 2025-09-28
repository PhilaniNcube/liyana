import React from "react";
import LifeInsuranceForm from "./_components/life-insurance-form";
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/queries";

export default async function Page() {
  
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?next=/insurance/life");
  }
  return (
    <section className="py-8">
      <LifeInsuranceForm />
    </section>
  );
}
