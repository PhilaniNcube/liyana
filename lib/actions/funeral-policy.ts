"use server";


import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { getCurrentUser } from "../queries";
import { funeralPolicyLeadSchemaWithRefines as funeralPolicyLeadSchema } from "../schemas";
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
  
  // Pass through product_type string for zod enum validation
  if ((entries as any).product_type) parsed.product_type = (entries as any).product_type;

  // For array fields like beneficiaries coming from form-data, attempt JSON parse if string
  if (typeof parsed.beneficiaries === "string") {
    try {
      parsed.beneficiaries = JSON.parse(parsed.beneficiaries as string);
    } catch {
      // leave as is; zod will catch invalid shape
    }
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
    // Create policy holder party with banking_details (encrypt id_number)
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
        banking_details: {
          account_name: validatedData.account_name,
          bank_name: validatedData.bank_name,
          account_number: validatedData.account_number,
          branch_code: validatedData.branch_code,
          account_type: validatedData.account_type,
        },
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

    // Create a base policy record first
    const { data: newPolicy, error: policyError } = await supabase
      .from("policies")
      .insert({
        policy_holder_id: party.id,
        frequency: "monthly",
        policy_status: "pending",
        premium_amount: null,
        product_type: validatedData.product_type ?? null,
        start_date: null,
        end_date: null,
        employment_details: {
          employment_type: validatedData.employment_type,
          employer_name: validatedData.employer_name,
          job_title: validatedData.job_title,
          monthly_income: validatedData.monthly_income,
          employer_address: validatedData.employer_address || null,
          employer_contact_number: validatedData.employer_contact_number || null,
          employment_end_date: validatedData.employment_end_date || null,
        },
      })
      .select("id")
      .single();

    if (policyError || !newPolicy) {
      return {
        error: true,
        message: "Failed to create policy record.",
        details: policyError?.message,
        partyId: party.id,
      };
    }

    // Create funeral policy with the same ID
    // const { error: funeralPolicyCreateError } = await supabase
    //   .from("funeral_policies")
    //   .insert({
    //     policy_holder_id: party.id,
    //     frequency: "monthly",
    //     policy_status: "pending",
    //     premium_amount: null,
    //     product_type: validatedData.product_type,
    //     start_date: null,
    //     end_date: null,
    //     employment_details: {
    //       employment_type: validatedData.employment_type,
    //       employer_name: validatedData.employer_name,
    //       job_title: validatedData.job_title,
    //       monthly_income: validatedData.monthly_income,
    //       employer_address: validatedData.employer_address || null,
    //       employer_contact_number: validatedData.employer_contact_number || null,
    //       employment_end_date: validatedData.employment_end_date || null,
    //     },
    //     covered_members: [],
    //   });

    // if (funeralPolicyCreateError) {
    //   return {
    //     error: true,
    //     message: "Failed to create funeral policy record.",
    //     details: funeralPolicyCreateError.message,
    //     partyId: party.id,
    //     policyId: newPolicy.id,
    //   };
    // }

    // Create beneficiary parties and link in policy_beneficiaries
    // We will create minimal party rows for beneficiaries and then insert policy_beneficiaries with allocation_percentage and relation_type
    const beneficiaryInserts = validatedData.beneficiaries.map((b: any) => ({
      first_name: b.first_name,
      last_name: b.last_name,
      id_number: encryptValue(b.id_number),
      date_of_birth: null,
      contact_details: b.phone_number || b.email ? { phone: b.phone_number ?? null, email: b.email ?? null } : null,
      address_details: null,
      party_type: "individual" as const,
      profile_id: user.id,
    }));

    // Bulk insert beneficiary parties, returning ids in order
    const { data: beneficiaryParties, error: benPartyError } = await supabase
      .from("parties")
      .insert(beneficiaryInserts)
      .select("id")
 

    if (benPartyError || !beneficiaryParties || beneficiaryParties.length !== validatedData.beneficiaries.length) {
      return {
        error: true,
        message: "Failed to create beneficiary records.",
        details: benPartyError?.message,
        partyId: party.id,
        policyId: newPolicy.id,
      };
    }

    // Prepare policy_beneficiaries rows
    const policyBeneficiariesRows = validatedData.beneficiaries.map((b: any, idx: number) => ({
      policy_id: newPolicy.id,
      beneficiary_party_id: beneficiaryParties[idx].id,
      allocation_percentage: b.percentage,
      relation_type: b.relationship,
    }));

    const { error: pbError } = await supabase
      .from("policy_beneficiaries")
      .insert(policyBeneficiariesRows);

    if (pbError) {
      console.error("Error linking beneficiaries to policy:", pbError);
      return {
        error: true,
        message: "Failed to link beneficiaries to the policy.",
        details: pbError.message,
        partyId: party.id,
        policyId: newPolicy.id,
      };
    }

    // Policy creation and linking completed successfully
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
