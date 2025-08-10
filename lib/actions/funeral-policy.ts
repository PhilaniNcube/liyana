"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser, getUserProfile } from "../queries";
import { funeralPolicyLeadSchema } from "../schemas";

export async function createFuneralPolicy(prevState: any, formData: FormData) {
  // Parse FormData entries and handle arrays
  const formEntries = Object.fromEntries(formData.entries());

  // Handle JSON fields that come as strings
  const parsedEntries = {
    ...formEntries,
    // Parse boolean fields
    has_medical_conditions: formEntries.has_medical_conditions === "true",
    takes_medication: formEntries.takes_medication === "true",
    smoker: formEntries.smoker === "true",
    health_declaration: formEntries.health_declaration === "true",
    terms_and_conditions: formEntries.terms_and_conditions === "true",
    privacy_policy: formEntries.privacy_policy === "true",
    marketing_consent: formEntries.marketing_consent === "true",
    // Parse number fields
    monthly_income: formEntries.monthly_income
      ? parseFloat(formEntries.monthly_income as string)
      : 0,
    coverage_amount: formEntries.coverage_amount
      ? parseFloat(formEntries.coverage_amount as string)
      : 0,
    monthly_premium: formEntries.monthly_premium
      ? parseFloat(formEntries.monthly_premium as string)
      : 0,
    dependants: formEntries.dependants
      ? parseInt(formEntries.dependants as string)
      : 0,
    debit_order_date: formEntries.debit_order_date
      ? parseInt(formEntries.debit_order_date as string)
      : undefined,
    // Parse JSON fields
    beneficiaries: formEntries.beneficiaries
      ? JSON.parse(formEntries.beneficiaries as string)
      : [],
    additional_members: formEntries.additional_members
      ? JSON.parse(formEntries.additional_members as string)
      : [],
  };

  const validatedFields = funeralPolicyLeadSchema.safeParse(parsedEntries);

  if (!validatedFields.success) {
    return {
      error: true,
      message: "Invalid form data",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const userProfile = await getCurrentUser();

  if (!userProfile) {
    return {
      error: true,
      message: "You must be logged in to create a policy.",
    };
  }

  const { data: validatedData } = validatedFields;

  try {
    // 1. Create a party for the policy holder
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .insert({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        id_number: validatedData.id_number,
        date_of_birth: validatedData.date_of_birth,
        contact_details: {
          phone: validatedData.phone_number,
          email: validatedData.email,
        },
        address_details: {
          physical: validatedData.residential_address,
          city: validatedData.city,
          postal_code: validatedData.postal_code,
        },
        party_type: "individual",
        profile_id: userProfile.id,
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

    // Party-only application for now
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
