"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser } from "../queries";
import { z } from "zod";
import { lifeInsuranceLeadSchemaWithRefines as lifeInsuranceLeadSchema } from "../schemas";
import { encryptValue } from "../encryption";

export async function createLifeInsurancePolicy(
  prevState: any,
  formData: FormData
) {
  const entries = Object.fromEntries(formData.entries());

  const parsed: any = {
    ...entries,
    coverage_amount: entries.coverage_amount
      ? parseFloat(entries.coverage_amount as string)
      : 0,
    premium_amount: entries.premium_amount
      ? parseFloat(entries.premium_amount as string)
      : 0,
    beneficiaries: entries.beneficiaries
      ? JSON.parse(entries.beneficiaries as string)
      : [],
    // Coerce checkbox values from strings to booleans
    terms_and_conditions:
      (entries as any).terms_and_conditions === "true" ||
      (entries as any).terms_and_conditions === true,
    privacy_policy:
      (entries as any).privacy_policy === "true" ||
      (entries as any).privacy_policy === true,
  };

  // Forward product_type string for enum validation
  if ((entries as any).product_type) parsed.product_type = (entries as any).product_type;

  const validated = lifeInsuranceLeadSchema.safeParse(parsed);
  if (!validated.success) {
    console.error("Validation failed:", validated.error);
    return {
      error: true,
      message: "Invalid form data",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) {
    return { error: true, message: "You must be logged in to apply." };
  }

  const data = validated.data;

  try {
  // Create policy holder party with banking_details (encrypt id_number)
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
    id_number: encryptValue(data.id_number),
        date_of_birth: data.date_of_birth,
        contact_details: { phone: data.phone_number, email: data.email },
        address_details:
          data.residential_address || data.city || data.postal_code
            ? {
                physical: data.residential_address ?? null,
                city: data.city ?? null,
                postal_code: data.postal_code ?? null,
              }
            : null,
        banking_details: {
          account_name: data.account_name,
          bank_name: data.bank_name,
          account_number: data.account_number,
          branch_code: data.branch_code,
          account_type: data.account_type,
        },
        party_type: "individual",
        profile_id: user.id,
      })
      .select("id")
      .single();

    if (partyError || !party) {
      return {
        error: true,
        message: "Failed to create party.",
        details: partyError?.message,
      };
    }

    // Create a minimal generic policy record linked to the party
    // Required fields: policy_holder_id, frequency, policy_status
  const { data: newPolicy, error: policyError } = await supabase.from("policies").insert({
      policy_holder_id: party.id,
      frequency: "monthly",
      policy_status: "pending",
      premium_amount: null,
      product_type: data.product_type ?? null,
      start_date: null,
      end_date: null,
  }).select("id").single();

    if (policyError) {
      return {
        error: true,
        message: "Party created but failed to create policy record.",
        details: policyError.message,
        partyId: party.id,
      };
    }

    // Create beneficiary parties and link to policy
    const beneficiaryInserts = data.beneficiaries.map((b: any) => ({
      first_name: b.first_name,
      last_name: b.last_name,
      id_number: encryptValue(b.id_number),
      date_of_birth: null,
      contact_details: b.phone_number || b.email ? { phone: b.phone_number ?? null, email: b.email ?? null } : null,
      address_details: null,
      party_type: "individual" as const,
      profile_id: user.id,
    }));

    const { data: beneficiaryParties, error: benPartyError } = await supabase
      .from("parties")
      .insert(beneficiaryInserts)
      .select("id")
      .returns<{ id: string }[]>();

    if (benPartyError || !beneficiaryParties || beneficiaryParties.length !== data.beneficiaries.length) {
      return {
        error: true,
        message: "Failed to create beneficiary records.",
        details: benPartyError?.message,
        partyId: party.id,
        policyId: newPolicy?.id,
      };
    }

    const policyBeneficiariesRows = data.beneficiaries.map((b: any, idx: number) => ({
      policy_id: newPolicy!.id,
      beneficiary_party_id: beneficiaryParties[idx].id,
      allocation_percentage: b.percentage,
      relation_type: b.relationship,
    }));

    const { error: pbError } = await supabase
      .from("policy_beneficiaries")
      .insert(policyBeneficiariesRows);

    if (pbError) {
      return {
        error: true,
        message: "Failed to link beneficiaries to the policy.",
        details: pbError.message,
        partyId: party.id,
        policyId: newPolicy?.id,
      };
    }

    revalidatePath("/insurance/life");
    return {
      error: false,
      message:
        "Application submitted. We'll follow up to complete policy details.",
      partyId: party.id,
    };
  } catch (e) {
    return {
      error: true,
      message: "An unexpected error occurred.",
      details: e instanceof Error ? e.message : String(e),
    };
  }
}
