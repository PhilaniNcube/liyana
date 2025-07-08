import { z } from "zod";

// Utility function to extract date of birth from SA ID number
const extractDateOfBirthFromSAID = (idNumber: string): string | null => {
  if (!idNumber || idNumber.length !== 13) {
    return null;
  }

  // Extract YYMMDD from the first 6 digits
  const yearDigits = idNumber.substring(0, 2);
  const month = idNumber.substring(2, 4);
  const day = idNumber.substring(4, 6);

  // Convert YY to full year (assuming current century for years 00-30, previous century for 31-99)
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const yearNumber = parseInt(yearDigits);

  let fullYear: number;
  if (yearNumber <= 30) {
    fullYear = currentCentury + yearNumber;
  } else {
    fullYear = currentCentury - 100 + yearNumber;
  }

  // Validate month and day
  const monthNumber = parseInt(month);
  const dayNumber = parseInt(day);

  if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
    return null;
  }

  // Create date and validate it exists (handles leap years, etc.)
  const date = new Date(fullYear, monthNumber - 1, dayNumber);
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return null;
  }

  // Return in YYYY-MM-DD format for HTML date input
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

// Unified schema for loan application
export const loanApplicationSchema = z
  .object({
    // Personal Information
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    id_number: z
      .string()
      .min(13, "SA ID Number must be 13 digits")
      .max(13, "SA ID Number must be 13 digits"),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    phone_number: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email("Please enter a valid email address"),
    gender: z.enum(["male", "female", "rather not say", "other"], {
      required_error: "Gender is required",
    }),
    gender_other: z.string().optional(),
    language: z.string().min(1, "Language is required"),
    nationality: z.string().min(1, "Nationality is required"),
    dependants: z
      .number()
      .min(0, "Number of dependants must be 0 or more")
      .max(20, "Number of dependants cannot exceed 20"),
    marital_status: z.enum(
      ["single", "married", "divorced", "widowed", "life_partner"],
      {
        required_error: "Marital status is required",
      }
    ),
    residential_address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    postal_code: z
      .string()
      .min(4, "Postal code must be at least 4 digits")
      .max(4, "Postal code must be exactly 4 digits")
      .regex(/^\d{4}$/, "Postal code must be 4 digits"),
    // Employment and Loan Information
    employment_type: z.enum(
      ["employed", "self_employed", "contract", "unemployed", "retired"],
      {
        required_error: "Employment status is required",
      }
    ),
    employer_name: z.string().min(1, "Employer is required"),
    job_title: z.string().min(1, "Job title is required"),
    monthly_income: z.number().min(1, "Monthly income is required"),
    employer_address: z.string().optional(),
    employer_contact_number: z.string().optional(),
    employment_end_date: z.string().optional(),
    // Loan and Banking Information
    application_amount: z
      .number()
      .min(500, "Minimum loan amount is R500")
      .max(5000, "Maximum loan amount is R5,000"),
    loan_purpose: z.string().min(1, "Loan purpose is required"),
    loan_purpose_reason: z.string().optional(),
    affordability: z
      .object({
        income: z.array(
          z.object({
            type: z.string(),
            amount: z.number().min(0),
          })
        ),
        expenses: z.array(
          z.object({
            type: z.string(),
            amount: z.number().min(0),
          })
        ),
        deductions: z.array(
          z.object({
            type: z.string(),
            amount: z.number().min(0),
          })
        ),
      })
      .optional(),
    term: z
      .number()
      .min(5, "Minimum repayment period is 5 days")
      .max(60, "Maximum repayment period is 60 days"),
    bank_name: z.string().min(1, "Bank name is required"),
    bank_account_holder: z.string().min(1, "Account holder name is required"),
    bank_account_type: z.enum(
      ["savings", "transaction", "current", "business"],
      {
        required_error: "Account type is required",
      }
    ),
    bank_account_number: z
      .string()
      .min(8, "Bank account number must be at least 8 digits"),
    branch_code: z
      .string()
      .min(6, "Branch code must be at least 6 digits")
      .max(6, "Branch code must be exactly 6 digits"),
  })
  .refine(
    (data) => {
      // Validate conditional gender_other field
      if (
        data.gender === "other" &&
        (!data.gender_other || data.gender_other.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Please specify your gender when selecting 'Other'",
      path: ["gender_other"],
    }
  )
  .refine(
    (data) => {
      if (data.id_number) {
        const dob = extractDateOfBirthFromSAID(data.id_number);
        if (dob) {
          data.date_of_birth = dob;
        }
        return !!dob;
      }
      return true;
    },
    {
      message: "Invalid ID number or could not extract date of birth.",
      path: ["id_number"],
    }
  )
  .refine(
    (data) => {
      // Validate conditional employment_end_date field
      if (
        (data.employment_type === "contract" ||
          data.employment_type === "retired") &&
        (!data.employment_end_date || data.employment_end_date.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Employment end date is required for contract and retired employment types",
      path: ["employment_end_date"],
    }
  )
  .refine(
    (data) => {
      // Validate conditional loan_purpose_reason field
      if (
        data.loan_purpose === "other" &&
        (!data.loan_purpose_reason || data.loan_purpose_reason.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Please specify the reason when selecting 'Other' for loan purpose",
      path: ["loan_purpose_reason"],
    }
  );
