"use server";

import { createClient } from "@/lib/server";
import { encryptValue } from "@/lib/encryption";
import { z } from "zod";

// Loan Application Schema
const loanApplicationSchema = z
  .object({
    // Personal Information
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    identificationType: z.enum(["id", "passport"], {
      required_error: "Identification type is required",
    }),
    idNumber: z.string().optional(),
    passportNumber: z.string().optional(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email("Please enter a valid email address"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    postalCode: z.string().min(4, "Postal code is required"),

    // Employment and Loan Information
    employmentStatus: z.enum(
      ["employed", "self_employed", "unemployed", "retired"],
      {
        required_error: "Employment status is required",
      }
    ),
    employer: z.string().min(1, "Employer is required"),
    jobTitle: z.string().min(1, "Job title is required"),
    monthlyIncome: z.string().min(1, "Monthly income is required"),
    workExperience: z.string().min(1, "Work experience is required"),
    loanAmount: z
      .string()
      .min(1, "Loan amount is required")
      .refine(
        (val) => {
          const amount = parseFloat(val);
          return !isNaN(amount) && amount > 0 && amount <= 5000;
        },
        {
          message: "Loan amount must be between R1 and R5,000",
        }
      ),
    loanPurpose: z.enum(
      [
        "debt_consolidation",
        "home_improvement",
        "education",
        "medical",
        "other",
      ],
      {
        required_error: "Loan purpose is required",
      }
    ),
    repaymentPeriod: z.enum(["7", "14", "21", "30"], {
      required_error: "Repayment period is required",
    }),
  })
  .refine(
    (data) => {
      // Validate that either ID number or passport number is provided based on identification type
      if (data.identificationType === "id") {
        return data.idNumber && data.idNumber.length === 13;
      } else if (data.identificationType === "passport") {
        return data.passportNumber && data.passportNumber.length >= 6;
      }
      return false;
    },
    {
      message:
        "Please provide a valid ID number (13 digits) or passport number (min 6 characters)",
      path: ["idNumber"], // This will show the error on the ID number field
    }
  );

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;

export interface LoanApplicationState {
  errors?: {
    [key: string]: string[];
  };
  success?: boolean;
}

export async function submitLoanApplication(
  prevState: LoanApplicationState,
  formData: FormData
): Promise<LoanApplicationState> {
  const result = loanApplicationSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    identificationType: formData.get("identificationType"),
    idNumber: formData.get("idNumber"),
    passportNumber: formData.get("passportNumber"),
    dateOfBirth: formData.get("dateOfBirth"),
    phoneNumber: formData.get("phoneNumber"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    employmentStatus: formData.get("employmentStatus"),
    employer: formData.get("employer"),
    jobTitle: formData.get("jobTitle"),
    monthlyIncome: formData.get("monthlyIncome"),
    workExperience: formData.get("workExperience"),
    loanAmount: formData.get("loanAmount"),
    loanPurpose: formData.get("loanPurpose"),
    repaymentPeriod: formData.get("repaymentPeriod"),
  });

  if (!result.success) {
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
    const identificationNumber =
      result.data.identificationType === "id"
        ? result.data.idNumber
        : result.data.passportNumber;

    if (!identificationNumber) {
      return {
        errors: {
          _form: ["Identification number is required"],
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
      id_number: encryptedIdNumber,
      date_of_birth: result.data.dateOfBirth,
      application_amount: parseFloat(result.data.loanAmount),
      term: parseInt(result.data.repaymentPeriod),
      status: "pre_qualifier" as const,
      created_at: new Date().toISOString(),
    };

    // Insert loan application into database
    const { error } = await supabase
      .from("applications")
      .insert(applicationData);

    if (error) {
      console.error("Database error:", error);
      return {
        errors: {
          _form: ["Failed to submit loan application. Please try again."],
        },
      };
    }

    return {
      success: true,
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
