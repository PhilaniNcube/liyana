import { createClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// Reusable types derived from Supabase table definitions
type PolicyRow = Database["public"]["Tables"]["policies"]["Row"];
type PartyRow = Database["public"]["Tables"]["parties"]["Row"];

export type PolicyBase = PolicyRow;
export type PolicyWithHolder = PolicyRow & { policy_holder: PartyRow | null };

export async function getPolicies(): Promise<PolicyWithHolder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("policies").select("*, policy_holder:policy_holder_id(*)");
  if (error) throw new Error(error.message);
  return data;
}

export async function getPolicyById(id: number): Promise<PolicyWithHolder> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("policies").select("*, policy_holder:policy_holder_id(*)").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
}


export async function getFuneralPolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
   

    // get the id of any product_type with the word funeral in anywhere in the name

    const { data: productTypes, error: productError } = await supabase
        .from("product_types").select("id").ilike("name", "%funeral%").limit(1).single();

        if (productError) throw new Error(productError.message);
        if (!productTypes) throw new Error("Product type not found");

    const { data: policies, error } = await supabase
            .from("policies")
            .select("*, policy_holder:policy_holder_id(*)")
            .eq("product_id", productTypes.id);
        if (error) throw new Error(error.message);
        if (!policies) return [];

        return policies;    



}

export async function getLifeInsurancePolicies(): Promise<PolicyWithHolder[]> {

    const supabase = await createClient();
    const { data: productTypes, error: productError } = await supabase
        .from("product_types").select("id").ilike("name", "%life%").limit(1).single();

    if (productError) throw new Error(productError.message);
    if (!productTypes) throw new Error("Product type not found");

    const { data: policies, error } = await supabase
        .from("policies")
        .select("*, policy_holder:policy_holder_id(*)")
        .eq("product_id", productTypes.id);
    if (error) throw new Error(error.message);
    if (!policies) return [];

     return policies;    
}