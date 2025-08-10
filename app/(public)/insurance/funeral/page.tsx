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
  const { data: products } = await supabase
    .from("product_types")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <section className="py-8">
      <FuneralPolicyForm products={products ?? []} />
    </section>
  );
}
