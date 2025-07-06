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
    // Loan and Banking Information
    application_amount: z
      .number()
      .min(500, "Minimum loan amount is R500")
      .max(5000, "Maximum loan amount is R5,000"),
    loan_purpose: z.string().min(1, "Loan purpose is required"),
    term: z
      .number()
      .min(1, "Minimum repayment period is 1 month")
      .max(12, "Maximum repayment period is 12 months"),
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
  );
