"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser, getUserProfile } from "../queries";

const funeralPolicySchema = z.object({
  // Policy holder details
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  idNumber: z.string().min(1, "ID number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),

  // Policy details
  premiumAmount: z.coerce.number().min(1, "Premium amount is required"),
  frequency: z.enum(["monthly", "quarterly", "annually"]),
  coveredMembers: z
    .array(
      z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        relationship: z.string().min(1, "Relationship is required"),
        dateOfBirth: z.string().min(1, "Date of birth is required"),
      })
    )
    .optional(),
});

export async function createFuneralPolicy(prevState: any, formData: FormData) {
  const validatedFields = funeralPolicySchema.safeParse(
    Object.fromEntries(formData.entries())
  );

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

  // 1. Create a party for the policy holder
  const { data: party, error: partyError } = await supabase
    .from("parties")
    .insert({
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      id_number: validatedData.idNumber,
      date_of_birth: validatedData.dateOfBirth,
      contact_details: {
        phone: validatedData.phoneNumber,
        email: validatedData.email,
      },
      address_details: {
        physical: validatedData.address,
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
      details: partyError.message,
    };
  }

  // 2. Create a policy in the policy table as well
  const { data: policy, error: policyError } = await supabase
    .from("policies")
    .insert({
      policy_holder_id: party.id,
      product_id: 3, // Assuming 3 is the ID for funeral policies
      policy_status: "pending",
      premium_amount: validatedData.premiumAmount,
      frequency: validatedData.frequency,
    })
    .select("*")
    .single();

  if (policyError || !policy) {
    return {
      error: true,
      message: "Failed to create policy.",
      details: policyError.message,
    };
  }

  // 3. Create the funeral policy
  const { data: funeralPolicy, error: funeralPolicyError } = await supabase
    .from("funeral_policies")
    .insert({
      policy_holder_id: party.id,
      product_id: 3,
      policy_status: "pending",
      premium_amount: validatedData.premiumAmount,
      frequency: validatedData.frequency,
      covered_members: validatedData.coveredMembers
        ? JSON.stringify(
            validatedData.coveredMembers.map((member) => ({
              first_name: member.firstName,
              last_name: member.lastName,
              relationship: member.relationship,
              date_of_birth: member.dateOfBirth,
            }))
          )
        : JSON.stringify([]),
    } as any)
    .select("*")
    .single();

  if (funeralPolicyError || !funeralPolicy) {
    return {
      error: true,
      message: "Failed to create funeral policy.",
      details: funeralPolicyError.message,
    };
  }

  revalidatePath("/insurance/funeral");

  return {
    error: false,
    message: "Funeral policy created successfully.",
  };
}
