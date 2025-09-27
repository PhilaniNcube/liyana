import { createClient } from "@/lib/server";
import { decryptValue } from "@/lib/encryption";
import type { Database } from "@/lib/types";

// Reusable types derived from Supabase table definitions
type PolicyRow = Database["public"]["Tables"]["policies"]["Row"];
type PartyRow = Database["public"]["Tables"]["parties"]["Row"];

export type PolicyBase = PolicyRow;
export type PolicyWithHolder = PolicyRow & { policy_holder: Partial<PartyRow> | null };
export type PolicyWithProduct = PolicyWithHolder & { product_type: Database["public"]["Enums"]["product_type"] | null };

export async function getPolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
        const { data, error } = await supabase.from("policies").select("*, policy_holder:policy_holder_id(*)")
        .order("created_at", { ascending: false });
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
            .eq("product_type", "funeral_policy")
            .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        if (!policies) return [];
        return policies;    
}

export async function getFuneralActivePolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
                const { data: policies, error } = await supabase
                    .from("policies")
                    .select("*, policy_holder:policy_holder_id(*)")
            .eq("policy_status", "active").eq("product_type", "funeral_policy")
            .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        if (!policies) return [];
        return policies;    
}

export async function getFuneralPendingPolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
                const { data: policies, error } = await supabase
                    .from("policies")
                    .select("*, policy_holder:policy_holder_id(*)")
            .eq("policy_status", "pending").eq("product_type", "funeral_policy")
            .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        if (!policies) return [];
        return policies;    
}

export async function getFuneralDeclinedPolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
                const { data: policies, error } = await supabase
                    .from("policies")
                    .select("*, policy_holder:policy_holder_id(*)")
            .eq("policy_status", "cancelled").eq("product_type", "funeral_policy")
            .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        if (!policies) return [];
        return policies;    
}



export async function getLifeInsurancePolicies(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();
        const { data: policies, error } = await supabase
            .from("policies")
            .select("*, policy_holder:policy_holder_id(*)")
        .eq("product_type", "life_insurance")
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!policies) return [];
    return policies;    
}

// Fetch policy beneficiaries and enrich with party details and decrypted id_number
export async function getPolicyBeneficiaries(policyId: number) {
    const supabase = await createClient();

    // Check if user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(userError.message);
    if (!user) throw new Error("User not found");

    // First verify that the policy belongs to this user
    const { data: policy, error: policyError } = await supabase
        .from("policies")
        .select("id")
        .eq("id", policyId)
        .eq("user_id", user.id)
        .single();

    if (policyError || !policy) {
        throw new Error("Policy not found or access denied");
    }

    const { data: beneficiaries, error } = await supabase
        .from("policy_beneficiaries")
        .select("*")
        .eq("policy_id", policyId);

    if (error) throw new Error(error.message);
    if (!beneficiaries || beneficiaries.length === 0) return [];

    const enriched = await Promise.all(
        beneficiaries.map(async (b) => {
            const { data: party, error: partyError } = await supabase
                .from("parties")
                .select("*")
                .eq("id", b.beneficiary_party_id)
                .single();

            if (partyError || !party) {
                return { ...b, party: null, id_number: null } as any;
            }

            let id_number: string | null = null;
            try {
                id_number = party.id_number ? decryptValue(party.id_number) : null;
            } catch {
                id_number = null;
            }

            // Include both encrypted (in party.id_number) and decrypted (in id_number) versions
            return { 
                ...b, 
                party: {
                    ...party,
                    // Keep the encrypted id_number in the party object for API calls
                }, 
                id_number 
            } as any;
        })
    );

    return enriched;
}

// Fetch policies by user (policy holder)
export async function getPoliciesByUser(): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();

    const {data:{user}, error:userError} = await supabase.auth.getUser();

    if (userError) throw new Error(userError.message);
    if (!user) throw new Error("User not found");



    const { data, error } = await supabase
        .from("policies")
        .select("*, policy_holder:policy_holder_id(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
        
    if (error) throw new Error(error.message);
    return (data ?? []) as PolicyWithHolder[];
}

// Fetch policies by specific user ID (for admin use)
export async function getPoliciesByUserId(userId: string): Promise<PolicyWithHolder[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("policies")
        .select("*, policy_holder:policy_holder_id(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
        
    if (error) throw new Error(error.message);
    return (data ?? []) as PolicyWithHolder[];
}


export async function getPolicyByPolicyId(policyId: number): Promise<PolicyWithHolder | null> {
    const supabase = await createClient();

    // check if user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw new Error(userError.message);
    if (!user) throw new Error("User not found");

    const { data: policy, error } = await supabase
        .from("policies")
        .select("*, policy_holder:policy_holder_id(*)")
        .eq("id", policyId).eq("user_id", user.id)
        .single();

    if (error) throw new Error(error.message);

    // decrypt id number before sending back the data
    if (policy) {
        try {
            policy.policy_holder.id_number = policy.policy_holder.id_number ? decryptValue(policy.policy_holder.id_number) : null;
        } catch {
            policy.policy_holder.id_number = null;
        }
    }

    return policy ?? null;
}