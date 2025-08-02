"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

  revalidatePath("/insurance/funeral");

  return {
    error: false,
    message: "Funeral policy created successfully.",
  };
}
