"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser } from "../queries";
import { z } from "zod";
import { lifeInsuranceLeadSchema } from "../schemas";

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
    // Create party only
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
        message: "Failed to create party.",
        details: partyError?.message,
      };
    }

    revalidatePath("/insurance/life");
    return {
      error: false,
      message: "Application submitted. We'll follow up to complete policy details.",
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
