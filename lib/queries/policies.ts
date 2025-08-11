import { createClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";

// Reusable types derived from Supabase table definitions
type PolicyRow = Database["public"]["Tables"]["policies"]["Row"];
type PartyRow = Database["public"]["Tables"]["parties"]["Row"];

export type PolicyBase = PolicyRow;
export type PolicyWithHolder = PolicyRow & { policy_holder: Partial<PartyRow> | null };
export type PolicyWithProduct = PolicyWithHolder & { product_type: Database["public"]["Enums"]["product_type"] | null };

export async function getPolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
        const { data, error } = await supabase.from("policies").select("*, policy_holder:policy_holder_id(*)");
  if (error) throw new Error(error.message);
    return (data ?? []) as PolicyWithHolder[];
}

export async function getPolicyById(id: number): Promise<PolicyWithProduct> {
        const supabase = await createClient();
                const { data, error } = await supabase
                    .from("policies")
                    .select("*, policy_holder:policy_holder_id(*)")
            .eq("id", id)
            .single();
        if (error) throw new Error(error.message);
        return data as PolicyWithProduct;
}


export async function getFuneralPolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
                const { data: policies, error } = await supabase
                    .from("policies")
                    .select("*, policy_holder:policy_holder_id(*)")
            .eq("product_type", "funeral_policy");
        if (error) throw new Error(error.message);
        if (!policies) return [];
        return policies;    
}

export async function getLifeInsurancePolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
        const { data: policies, error } = await supabase
            .from("policies")
            .select("*, policy_holder:policy_holder_id(*)")
        .eq("product_type", "life_insurance");
    if (error) throw new Error(error.message);
    if (!policies) return [];
    return policies;    
}