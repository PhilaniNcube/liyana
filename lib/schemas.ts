import { z } from "zod";
import { extractDateOfBirthFromSAID } from "@/lib/utils/sa-id";

// API Check interface for reuse across components
export interface ApiCheck {
  id: number;
  check_type: string;
  status: string;
  response_payload?: {
    pRetData?: string;
    pTransactionCompleted?: boolean;
    pCBVScore?: string;
    pCurrentDebtReview?: boolean;
  } | null;
  vendor: string;
  checked_at: string;
}

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
    // Next of Kin Information
    next_of_kin_name: z.string().min(1, "Next of kin name is required"),
    next_of_kin_phone_number: z
      .string()
      .min(10, "Next of kin phone number must be at least 10 digits"),
    next_of_kin_email: z
      .string()
      .email("Please enter a valid email address for next of kin"),
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

// WhoYou Email Verification Response Types
export interface WhoYouDomainDetails {
  id: string;
  domain: string;
  topLevelDomain: string;
  registered: boolean | null;
  created: string;
  updated: string;
  expires: string | null;
  registrarName: string;
  registeredTo: string;
  isDisposable: boolean | null;
  isFree: boolean | null;
  isCustom: boolean | null;
  isDmarcEnforced: boolean | null;
  isSpfStrict: boolean | null;
  isValidMx: boolean | null;
  canAcceptAll: boolean | null;
  isSuspiciousTld: boolean | null;
  doesWebsiteExist: boolean | null;
  emailVerificationInformationId: string;
}

export interface WhoYouAccountDetail {
  id: string;
  platformId: number;
  platform: string;
  emailVerificationInformationId: string;
}

export interface WhoYouBreach {
  id: string;
  name: string;
  domain: string;
  breachDate: string;
  emailVerificationBreachDetailsId: string;
}

export interface WhoYouBreachDetails {
  id: string;
  haveIBeenPwnedListed: boolean;
  numberOfBreaches: number;
  firstBreach: string;
  breaches: WhoYouBreach[];
  emailVerificationInformationId: string;
}

export interface WhoYouAppliedRule {
  id: string;
  name: string;
  operation: string;
  score: number;
  emailVerificationInformationId: string;
}

export interface WhoYouEmailVerificationInformation {
  id: string;
  email: string;
  isHighRisk: boolean;
  isDeliverable: boolean;
  emailVerificationResponseId: string;
  domainDetails: WhoYouDomainDetails;
  accountDetails: WhoYouAccountDetail[];
  breachDetails: WhoYouBreachDetails;
  appliedRules: WhoYouAppliedRule[];
}

export interface WhoYouEmailVerificationDetail {
  isWhoYouCache: boolean;
  emailVerificationInformation: WhoYouEmailVerificationInformation;
  report: string;
}

export interface WhoYouEmailVerificationResponse {
  code: number;
  detail: WhoYouEmailVerificationDetail;
}

// Zod schemas for WhoYou Email Verification Response validation
export const whoYouDomainDetailsSchema = z.object({
  id: z.string(),
  domain: z.string(),
  topLevelDomain: z.string(),
  registered: z.boolean().nullable(),
  created: z.string(),
  updated: z.string(),
  expires: z.string().nullable(),
  registrarName: z.string(),
  registeredTo: z.string(),
  isDisposable: z.boolean().nullable(),
  isFree: z.boolean().nullable(),
  isCustom: z.boolean().nullable(),
  isDmarcEnforced: z.boolean().nullable(),
  isSpfStrict: z.boolean().nullable(),
  isValidMx: z.boolean().nullable(),
  canAcceptAll: z.boolean().nullable(),
  isSuspiciousTld: z.boolean().nullable(),
  doesWebsiteExist: z.boolean().nullable(),
  emailVerificationInformationId: z.string(),
});

export const whoYouAccountDetailSchema = z.object({
  id: z.string(),
  platformId: z.number(),
  platform: z.string(),
  emailVerificationInformationId: z.string(),
});

export const whoYouBreachSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  breachDate: z.string(),
  emailVerificationBreachDetailsId: z.string(),
});

export const whoYouBreachDetailsSchema = z.object({
  id: z.string(),
  haveIBeenPwnedListed: z.boolean(),
  numberOfBreaches: z.number(),
  firstBreach: z.string(),
  breaches: z.array(whoYouBreachSchema),
  emailVerificationInformationId: z.string(),
});

export const whoYouAppliedRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  operation: z.string(),
  score: z.number(),
  emailVerificationInformationId: z.string(),
});

export const whoYouEmailVerificationInformationSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  isHighRisk: z.boolean(),
  isDeliverable: z.boolean(),
  emailVerificationResponseId: z.string(),
  domainDetails: whoYouDomainDetailsSchema,
  accountDetails: z.array(whoYouAccountDetailSchema),
  breachDetails: whoYouBreachDetailsSchema,
  appliedRules: z.array(whoYouAppliedRuleSchema),
});

export const whoYouEmailVerificationDetailSchema = z.object({
  isWhoYouCache: z.boolean(),
  emailVerificationInformation: whoYouEmailVerificationInformationSchema,
  report: z.string(),
});

export const whoYouEmailVerificationResponseSchema = z.object({
  code: z.number(),
  detail: whoYouEmailVerificationDetailSchema,
});

// WhoYou Account Verification Response Types
export interface WhoYouAccountVerificationInformation {
  id: string;
  idNumber: string;
  reference: string;
  isIdNumberValid: boolean;
  isNameValid: boolean;
  isInitialsValid: boolean;
  isAccountTypeValid: boolean;
  isAccountNumberValid: boolean;
  isBranchCodeValid: boolean;
  accountStatus: string;
  canAcceptCredit: boolean;
  canAcceptDebit: boolean;
  isOpenAtLeast3Months: boolean;
  supplierCode: number;
}

export interface WhoYouAccountVerificationDetail {
  isWhoYouCache: boolean;
  accountVerificationInformation: WhoYouAccountVerificationInformation[];
}

export interface WhoYouAccountVerificationResponse {
  code: number;
  detail: WhoYouAccountVerificationDetail;
}

// Account Verification Request Types
export interface WhoYouAccountVerificationRequest {
  IdentificationNumber: string;
  ClientReference: string;
  AccountNumber: string;
  BranchCode: string;
  AccountType: string;
  IdentificationType: string;
  Bank: string;
  FirstName: string;
  Surname: string;
  HasConsent: string;
  CacheValidity: string;
  RequestPurpose: string;
  RequestSource: string;
}

// Zod schemas for WhoYou Account Verification validation
export const whoYouAccountVerificationInformationSchema = z.object({
  id: z.string(),
  idNumber: z.string(),
  reference: z.string(),
  isIdNumberValid: z.boolean(),
  isNameValid: z.boolean(),
  isInitialsValid: z.boolean(),
  isAccountTypeValid: z.boolean(),
  isAccountNumberValid: z.boolean(),
  isBranchCodeValid: z.boolean(),
  accountStatus: z.string(),
  canAcceptCredit: z.boolean(),
  canAcceptDebit: z.boolean(),
  isOpenAtLeast3Months: z.boolean(),
  supplierCode: z.number(),
});

export const whoYouAccountVerificationDetailSchema = z.object({
  isWhoYouCache: z.boolean(),
  accountVerificationInformation: z.array(
    whoYouAccountVerificationInformationSchema
  ),
});

export const whoYouAccountVerificationResponseSchema = z.object({
  code: z.number(),
  detail: whoYouAccountVerificationDetailSchema,
});

export const whoYouAccountVerificationRequestSchema = z.object({
  IdentificationNumber: z.string().min(1, "Identification number is required"),
  ClientReference: z.string().min(1, "Client reference is required"),
  AccountNumber: z.string().min(1, "Account number is required"),
  BranchCode: z.string().min(1, "Branch code is required"),
  AccountType: z.string().min(1, "Account type is required"),
  IdentificationType: z.string().min(1, "Identification type is required"),
  Bank: z.string().min(1, "Bank name is required"),
  FirstName: z.string().min(1, "First name is required"),
  Surname: z.string().min(1, "Surname is required"),
  HasConsent: z.string().min(1, "Consent is required"),
  CacheValidity: z.string().min(1, "Cache validity is required"),
  RequestPurpose: z.string().optional(),
  RequestSource: z.string().optional(),
});

// WhoYou Cellphone Verification Response Types
export interface WhoYouCellphoneVerificationDetail {
  id: string;
  companyId: string;
  datestamp: string;
  phoneNumber: string;
  status: string;
  isValid: boolean;
  numberType: string;
  carrier: string;
  score: number;
  rawResponse: string;
  report: string;
}

export interface WhoYouCellphoneVerificationResponse {
  code: number;
  detail: WhoYouCellphoneVerificationDetail;
}

// Cellphone Verification Request Types
export interface WhoYouCellphoneVerificationRequest {
  IdNumber: string;
  CountryCode: string;
  IncludeRawResponse: boolean;
  ClientReference: string;
  RequestPurpose: string;
  RequestSource: string;
}

// Zod schemas for WhoYou Cellphone Verification validation
export const whoYouCellphoneVerificationDetailSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  datestamp: z.string(),
  phoneNumber: z.string(),
  status: z.string(),
  isValid: z.boolean(),
  numberType: z.string(),
  carrier: z.string(),
  score: z.number(),
  rawResponse: z.string(),
  report: z.string(),
});

export const whoYouCellphoneVerificationResponseSchema = z.object({
  code: z.number(),
  detail: whoYouCellphoneVerificationDetailSchema,
});

export const whoYouCellphoneVerificationRequestSchema = z.object({
  IdNumber: z.string().min(1, "ID number is required"),
  CountryCode: z.string().min(1, "Country code is required"),
  IncludeRawResponse: z.boolean(),
  ClientReference: z.string().min(1, "Client reference is required"),
  RequestPurpose: z.string().optional(),
  RequestSource: z.string().optional(),
});
