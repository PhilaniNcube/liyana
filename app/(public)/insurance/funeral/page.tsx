import React from "react";
import FuneralPolicyForm from "./_components/funeral-policy-form";
import { createClient } from "@/lib/server";

export default async function Page() {
  const supabase = await createClient();
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
