"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser } from "../queries";
import { funeralPolicyLeadSchema } from "../schemas";
import { encryptValue } from "../encryption";

export async function createFuneralPolicy(prevState: any, formData: FormData) {
  // Parse FormData entries
  const entries = Object.fromEntries(formData.entries());

  // Coerce checkbox values from strings to booleans (lead flow only)
  const parsed: any = {
    ...entries,
    terms_and_conditions:
      (entries as any).terms_and_conditions === "true" ||
      (entries as any).terms_and_conditions === true,
    privacy_policy:
      (entries as any).privacy_policy === "true" ||
      (entries as any).privacy_policy === true,
  };
  
  // Safely coerce product_id to a number to avoid NaN in Zod (treat empty as undefined)
  const rawProductId = (entries as any).product_id as string | undefined;
  if (typeof rawProductId === "string" && rawProductId.trim() !== "") {
    const n = Number(rawProductId);
    if (Number.isFinite(n)) parsed.product_id = n;
  } else {
    // Set to 0 so zod positive() triggers our friendly error instead of NaN error
    parsed.product_id = 0;
  }

  const validatedFields = funeralPolicyLeadSchema.safeParse(parsed);

  if (!validatedFields.success) {
    console.error("Validation failed:", validatedFields.error);
    return {
      error: true,
      message: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: true,
      message: "You must be logged in to create a policy.",
    };
  }

  const { data: validatedData } = validatedFields;

  try {
    // Create party (encrypt id_number and include address_details when provided)
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .insert({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        id_number: encryptValue(validatedData.id_number),
        date_of_birth: validatedData.date_of_birth,
        contact_details: { phone: validatedData.phone_number, email: validatedData.email },
        address_details:
          validatedData.residential_address || validatedData.city || validatedData.postal_code
            ? {
                physical: validatedData.residential_address ?? null,
                city: validatedData.city ?? null,
                postal_code: validatedData.postal_code ?? null,
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
        message: "Failed to create policy holder.",
        details: partyError?.message,
      };
    }

    // Create a minimal generic policy record linked to the party
    const { error: policyError } = await supabase.from("policies").insert({
      policy_holder_id: party.id,
      frequency: "monthly",
      policy_status: "pending",
      premium_amount: null,
      // Use validated product_id (a number) to ensure no NaN is inserted
      product_id: validatedData.product_id ?? null,
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

  // Party + minimal policy application for now
  revalidatePath("/insurance/funeral");

    return {
      error: false,
      message: "Application submitted. We'll follow up to complete policy details.",
      partyId: party.id,
    };
  } catch (error) {
    console.error("Error creating funeral policy:", error);
    return {
      error: true,
      message: "An unexpected error occurred while creating the policy.",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
