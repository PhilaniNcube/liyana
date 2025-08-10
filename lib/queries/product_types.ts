import { createClient } from "@/lib/server";

export async function getProductTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_types")
    .select("*")
    .order("name", { ascending: true });
  return data;
}