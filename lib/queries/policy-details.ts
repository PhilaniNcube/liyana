import { createClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";
import { decryptValue } from "@/lib/encryption";

// Reusable types derived from Supabase table definitions
type PolicyRow = Database["public"]["Tables"]["policies"]["Row"];
type PartyRow = Database["public"]["Tables"]["parties"]["Row"];
type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];
type ClaimPayoutRow = Database["public"]["Tables"]["claim_payouts"]["Row"];
type PolicyBeneficiaryRow = Database["public"]["Tables"]["policy_beneficiaries"]["Row"];
type PolicyDocumentRow = Database["public"]["Tables"]["policy_documents"]["Row"];

export type PolicyWithAllData = PolicyRow & {
  policy_holder: Partial<PartyRow> | null;
  product_type: Database["public"]["Enums"]["product_type"] | null;
  employment_details: {
    [key: string]: string;
  } | null;
  beneficiaries: Array<PolicyBeneficiaryRow & { 
    party: Partial<PartyRow> | null; 
    id_number: string | null; 
  }>;
  claims: Array<ClaimRow & { 
    claimant: Partial<PartyRow> | null;
    payouts: Array<ClaimPayoutRow & {
      beneficiary: Partial<PartyRow> | null;
    }>;
  }>;
  premium_payments: Array<{
    id: number;
    amount: number;
    payment_date: string;
    status: string;
    payment_method?: string;
  }>;
  documents: Array<PolicyDocumentRow>;
};

export async function getCompletePolicyData(id: number): Promise<PolicyWithAllData | null> {
  const supabase = await createClient();
  
  // Get the main policy with holder
  const { data: policy, error: policyError } = await supabase
    .from("policies")
    .select("*, policy_holder:policy_holder_id(*)")
    .eq("id", id)
    .single();

  if (policyError || !policy) {
    return null;
  }

  // Get beneficiaries with party details
  const { data: beneficiariesData, error: beneficiariesError } = await supabase
    .from("policy_beneficiaries")
    .select("*")
    .eq("policy_id", id);

  let beneficiaries: Array<PolicyBeneficiaryRow & { 
    party: Partial<PartyRow> | null; 
    id_number: string | null; 
  }> = [];
  if (!beneficiariesError && beneficiariesData) {
    beneficiaries = await Promise.all(
      beneficiariesData.map(async (b) => {
        const { data: party, error: partyError } = await supabase
          .from("parties")
          .select("*")
          .eq("id", b.beneficiary_party_id)
          .single();

        if (partyError || !party) {
          return { ...b, party: null, id_number: null };
        }

        let id_number: string | null = null;
        try {
          id_number = party.id_number ? decryptValue(party.id_number) : null;
        } catch {
          id_number = null;
        }

        return { ...b, party, id_number };
      })
    );
  }

  // Get claims with claimant details and payouts
  const { data: claimsData, error: claimsError } = await supabase
    .from("claims")
    .select("*")
    .eq("policy_id", id);

  let claims: Array<ClaimRow & { 
    claimant: Partial<PartyRow> | null;
    payouts: Array<ClaimPayoutRow & {
      beneficiary: Partial<PartyRow> | null;
    }>;
  }> = [];
  if (!claimsError && claimsData) {
    claims = await Promise.all(
      claimsData.map(async (claim) => {
        // Get claimant details
        const { data: claimant, error: claimantError } = await supabase
          .from("parties")
          .select("*")
          .eq("id", claim.claimant_party_id)
          .single();

        // Get claim payouts with beneficiary details
        const { data: payoutsData, error: payoutsError } = await supabase
          .from("claim_payouts")
          .select("*")
          .eq("claim_id", claim.id);

        let payouts: Array<ClaimPayoutRow & {
          beneficiary: Partial<PartyRow> | null;
        }> = [];
        if (!payoutsError && payoutsData) {
          payouts = await Promise.all(
            payoutsData.map(async (payout) => {
              const { data: beneficiary, error: beneficiaryError } = await supabase
                .from("parties")
                .select("*")
                .eq("id", payout.beneficiary_party_id)
                .single();

              return {
                ...payout,
                beneficiary: beneficiaryError ? null : beneficiary,
              };
            })
          );
        }

        return {
          ...claim,
          claimant: claimantError ? null : claimant,
          payouts,
        };
      })
    );
  }

  // Get premium payments (this might be a separate table you need to create)
  // For now, I'll create a placeholder structure
  const premium_payments: Array<{
    id: number;
    amount: number;
    payment_date: string;
    status: string;
    payment_method?: string;
  }> = [
    // This would come from a premium_payments table if it exists
    // {
    //   id: 1,
    //   amount: policy.premium_amount || 0,
    //   payment_date: policy.created_at,
    //   status: 'paid',
    //   payment_method: 'debit_order'
    // }
  ];

  // Get policy documents
  const { data: documents, error: documentsError } = await supabase
    .from("policy_documents")
    .select("*")
    .eq("policy_id", id)
    .order("created_at", { ascending: false });

  const policyDocuments = documentsError || !documents ? [] : documents;

  return {
    ...policy,
    beneficiaries,
    claims,
    premium_payments,
    documents: policyDocuments,
  } as PolicyWithAllData;
}

export async function getPolicyClaims(policyId: number) {
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

  // Now get the claims for this policy
  const { data: claims, error } = await supabase
    .from("claims")
    .select(`
      *,
      claimant:claimant_party_id(*),
      claim_payouts(
        *,
        beneficiary:beneficiary_party_id(*)
      )
    `)
    .eq("policy_id", policyId);

  if (error) throw new Error(error.message);
  return claims || [];
}

export async function getPolicyDocuments(policyId: number) {
  const supabase = await createClient();
  
  const { data: documents, error } = await supabase
    .from("policy_documents")
    .select("*")
    .eq("policy_id", policyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return documents || [];
}
