import React from "react";
import FuneralPolicyForm from "./_components/funeral-policy-form";
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
    <section className="py-8">
      <FuneralPolicyForm />
    </section>
  );
}
