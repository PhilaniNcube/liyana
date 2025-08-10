"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser } from "../queries";
import { z } from "zod";
import { lifeInsurancePolicySchema } from "../schemas";

export async function createLifeInsurancePolicy(
  prevState: any,
  formData: FormData
) {
  const entries = Object.fromEntries(formData.entries());

  const parsed = {
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

  const validated = lifeInsurancePolicySchema.safeParse(parsed);
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

  // Resolve product type id for life insurance
  const { data: productTypeRows, error: productTypeError } = await supabase
    .from("product_types")
    .select("id,name")
    .eq("name", "Life Insurance")
    .limit(1);
  if (productTypeError) {
    return {
      error: true,
      message: "Unable to look up product type.",
      details: productTypeError.message,
    };
  }
  const productTypeId = productTypeRows?.[0]?.id as number | undefined;
  if (!productTypeId) {
    return {
      error: true,
      message:
        "Product type 'life_insurance' not found. Please insert it into product_types and retry.",
      details: "Expected a row in public.product_types with name = 'life_insurance'",
    };
  }

  try {
    // 1. Create party for policy holder
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        id_number: data.id_number,
        date_of_birth: data.date_of_birth,
        contact_details: { phone: data.phone_number, email: data.email },
        party_type: "individual",
        profile_id: user.id,
      })
      .select("id")
      .single();

    if (partyError || !party) {
      return {
        error: true,
        message: "Failed to create policy holder.",
        details: partyError?.message,
      };
    }

    // 2. Create base policy record
    const { data: policy, error: policyError } = await supabase
      .from("policies")
      .insert({
        policy_holder_id: party.id,
  product_id: productTypeId,
        policy_status: "pending",
        premium_amount: data.premium_amount,
        frequency: data.frequency,
        start_date: data.start_date,
        end_date: data.end_date ?? null,
      } as any)
      .select("id")
      .single();

    if (policyError || !policy) {
      return {
        error: true,
        message: "Failed to create policy.",
        details: policyError?.message,
      };
    }

    // 3. Create life insurance specific row
    const { error: lifeError } = await supabase.from("life_insurance_policies").insert({
      policy_holder_id: party.id,
      product_id: productTypeId,
      policy_status: "pending",
      premium_amount: data.premium_amount,
      frequency: data.frequency,
      start_date: data.start_date,
      end_date: data.end_date ?? null,
      coverage_amount: data.coverage_amount,
      payout_structure: data.payout_structure,
      underwriting_details: {},
    } as any);

    if (lifeError) {
      return {
        error: true,
        message: "Failed to create life insurance policy.",
        details: lifeError.message,
      };
    }

    // 4. Insert beneficiaries into policy_beneficiaries table
    const beneficiaryRows = (data.beneficiaries as any[]).map((b) => ({
      policy_id: policy.id,
      beneficiary_party_id: party.id, // TODO: create separate party per beneficiary in future
      relation_type: b.relationship,
      allocation_percentage: b.percentage,
    }));

    if (beneficiaryRows.length) {
      const { error: benError } = await supabase
        .from("policy_beneficiaries")
        .insert(beneficiaryRows as any);
      if (benError) {
        return {
          error: true,
          message: "Failed to add beneficiaries.",
          details: benError.message,
        };
      }
    }

    revalidatePath("/insurance/life");
    return { error: false, message: "Life insurance application submitted." };
  } catch (e) {
    return {
      error: true,
      message: "An unexpected error occurred.",
      details: e instanceof Error ? e.message : String(e),
    };
  }
}
