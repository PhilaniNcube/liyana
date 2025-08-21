"use server";

import { createClient } from "@/lib/server";
import { encryptValue } from "@/lib/encryption";
import { z } from "zod";
import { loanApplicationSchema } from "@/lib/schemas";
import { sendSms } from "./sms";

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;

// Helper function to handle date fields - converts empty strings to null
const formatDateForDB = (
  dateString: string | undefined | null
): string | null => {
  if (!dateString || dateString.trim() === "") {
    return null;
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    console.warn(`Invalid date format: ${dateString}`);
    return null;
  }

  // Additional validation - check if date is valid
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date value: ${dateString}`);
    return null;
  }

  return dateString;
};

export interface LoanApplicationState {
  errors?: {
    [key: string]: string[];
  };
  success?: boolean;
  applicationId?: string;
}

export async function submitLoanApplication(
  prevState: LoanApplicationState,
  formData: FormData
): Promise<LoanApplicationState> {
  // Parse affordability data from FormData if present
  let affordabilityData = null;
  const affordabilityStr = formData.get("affordability") as string;
  if (affordabilityStr) {
    try {
      affordabilityData = JSON.parse(affordabilityStr);
    } catch (error) {
      console.error("Failed to parse affordability data:", error);
    }
  }

  const result = loanApplicationSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    id_number: formData.get("id_number"),
    date_of_birth: formData.get("date_of_birth"),
    phone_number: formData.get("phone_number"),
    email: formData.get("email"),
    gender: formData.get("gender"),
    gender_other: formData.get("gender_other") || undefined,
    language: formData.get("language"),
    nationality: formData.get("nationality"),
    dependants: formData.get("dependants")
      ? parseInt(formData.get("dependants") as string)
      : 0,
    marital_status: formData.get("marital_status"),
    residential_address: formData.get("residential_address"),
    city: formData.get("city"),
    postal_code: formData.get("postal_code"),
    next_of_kin_name: formData.get("next_of_kin_name"),
    next_of_kin_phone_number: formData.get("next_of_kin_phone_number"),
    next_of_kin_email: formData.get("next_of_kin_email"),
    employment_type: formData.get("employment_type"),
    employer_name: formData.get("employer_name"),
    job_title: formData.get("job_title"),
    monthly_income: formData.get("monthly_income")
      ? parseFloat(formData.get("monthly_income") as string)
      : 0,
    salary_date: formData.get("salary_date")
      ? parseInt(formData.get("salary_date") as string)
      : undefined,
    employer_address: formData.get("employer_address") || undefined,
    employer_contact_number:
      formData.get("employer_contact_number") || undefined,
    employment_end_date: formData.get("employment_end_date") || undefined,
    application_amount: formData.get("application_amount")
      ? parseFloat(formData.get("application_amount") as string)
      : 1000,
    loan_purpose: formData.get("loan_purpose"),
    loan_purpose_reason: formData.get("loan_purpose_reason") || undefined,
    affordability: affordabilityData,
    term: formData.get("term") ? parseInt(formData.get("term") as string) : 1,
    bank_name: formData.get("bank_name"),
    bank_account_holder: formData.get("bank_account_holder"),
    bank_account_type: formData.get("bank_account_type"),
    bank_account_number: formData.get("bank_account_number"),
    branch_code: formData.get("branch_code"),
  });

  if (!result.success) {
    console.log("Validation errors:", result.error.flatten().fieldErrors);
    console.log("Form data received:", {
      date_of_birth: formData.get("date_of_birth"),
      employment_end_date: formData.get("employment_end_date"),
    });
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        errors: {
          _form: ["You must be logged in to submit a loan application"],
        },
      };
    } // Map form data to database schema
    const identificationNumber = result.data.id_number;

    if (!identificationNumber) {
      return {
        errors: {
          _form: ["ID number is required"],
        },
      };
    }

    // Encrypt the identification number before storing
    let encryptedIdNumber: string;
    try {
      encryptedIdNumber = encryptValue(identificationNumber);
    } catch (error) {
      console.error("Encryption error:", error);
      return {
        errors: {
          _form: ["Failed to process identification number. Please try again."],
        },
      };
    }

    const applicationData = {
      user_id: user.id,

      // Personal Information
      id_number: encryptedIdNumber,
      phone_number: result.data.phone_number,
      date_of_birth: formatDateForDB(result.data.date_of_birth),
      gender: result.data.gender as any,
      gender_other: result.data.gender_other || null,
      language: result.data.language || null,
      nationality: result.data.nationality || null,
      dependants: result.data.dependants,
      marital_status: result.data.marital_status as any,
      home_address: result.data.residential_address,
      city: result.data.city || null,
      postal_code: result.data.postal_code || null,

      // Next of Kin Information
      next_of_kin_name: result.data.next_of_kin_name,
      next_of_kin_phone_number: result.data.next_of_kin_phone_number,
      next_of_kin_email: result.data.next_of_kin_email,

      // Loan Information
      application_amount: result.data.application_amount,
      loan_purpose: result.data.loan_purpose,
      loan_purpose_reason: result.data.loan_purpose_reason,
      term: result.data.term,
      status: "pre_qualifier" as const,

      // Employment information
      employment_type: result.data.employment_type as any,
      employer_name: result.data.employer_name,
      job_title: result.data.job_title,
      monthly_income: result.data.monthly_income,
  salary_date: result.data.salary_date,
      employer_address: result.data.employer_address,
      employer_contact_number: result.data.employer_contact_number,
      employment_end_date: formatDateForDB(result.data.employment_end_date),

      // Banking information
      bank_name: result.data.bank_name,
      bank_account_holder: result.data.bank_account_holder,
      bank_account_type: result.data.bank_account_type as any,
      bank_account_number: result.data.bank_account_number,
      branch_code: result.data.branch_code,

      // Affordability information
      affordability: affordabilityData,
    };

    // Insert loan application into database
    const { data: insertedApplication, error } = await supabase
      .from("applications")
      .insert(applicationData)
      .select("id")
      .single();

    if (error) {
      console.error("Database error:", error);
      return {
        errors: {
          _form: ["Failed to submit loan application. Please try again."],
        },
      };
    }

    await sendSms(
      "+27729306206",
      `New loan application from ${result.data.first_name} ${result.data.last_name}. Application ID: ${insertedApplication.id}`
    );

    return {
      success: true,
      applicationId: insertedApplication.id.toString(),
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      errors: {
        _form: [
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while submitting your application",
        ],
      },
    };
  }
}
