"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser } from "../queries";
import { z } from "zod";
import { lifeInsuranceLeadSchema } from "../schemas";
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

  // Safely coerce product_id to a number to avoid NaN in Zod (treat empty as 0 to trigger positive() message)
  const rawProductId = (entries as any).product_id as string | undefined;
  if (typeof rawProductId === "string" && rawProductId.trim() !== "") {
    const n = Number(rawProductId);
    if (Number.isFinite(n)) parsed.product_id = n;
  } else {
    parsed.product_id = 0;
  }

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
  // Create party (encrypt id_number and include address_details placeholder)
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
    const { error: policyError } = await supabase.from("policies").insert({
      policy_holder_id: party.id,
      frequency: "monthly",
      policy_status: "pending",
      premium_amount: null,
      // Use validated product_id (a number) to ensure no NaN is inserted
      product_id: data.product_id ?? null,
      start_date: null,
      end_date: null,
    });

    if (policyError) {
      return {
        error: true,
        message: "Party created but failed to create policy record.",
        details: policyError.message,
        partyId: party.id,
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
