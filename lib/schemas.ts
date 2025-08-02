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
  idNumberProvided: string;
  phoneNumberProvided: string;
  isMatch: boolean;
  score: number | null;
  phoneNumberType: string;
}

export interface WhoYouCellphoneVerificationResponseDetail {
  code: number;
  detail: WhoYouCellphoneVerificationDetail;
}

export interface WhoYouCellphoneVerificationResponse {
  code: number;
  detail: WhoYouCellphoneVerificationResponseDetail;
}

// Cellphone Verification Request Types
export interface WhoYouCellphoneVerificationRequest {
  IdNumber: string;
  CellphoneNumber: string;
  IncludeRawResponse: boolean;
}

// Zod schemas for WhoYou Cellphone Verification validation
export const whoYouCellphoneVerificationDetailSchema = z.object({
  idNumberProvided: z.string(),
  phoneNumberProvided: z.string(),
  isMatch: z.boolean(),
  score: z.number().nullable(),
  phoneNumberType: z.string(),
});

export const whoYouCellphoneVerificationResponseDetailSchema = z.object({
  code: z.number(),
  detail: whoYouCellphoneVerificationDetailSchema,
});

export const whoYouCellphoneVerificationResponseSchema = z.object({
  code: z.number(),
  detail: whoYouCellphoneVerificationResponseDetailSchema,
});

export const whoYouCellphoneVerificationRequestSchema = z.object({
  IdNumber: z.string().min(1, "ID number is required"),
  CellphoneNumber: z.string().min(1, "Cellphone number is required"),
  IncludeRawResponse: z.boolean(),
});

// WhoYou ID Verification Response Types
export interface WhoYouIdVerificationDetail {
  id: string;
  idNumber: string;
  firstNames: string;
  surname: string;
  gender: string;
  dateOfBirth: string;
  status: string;
  datePerformed: string;
  birthPlaceCountryCode: string;
  deadIndicator: boolean | null;
  dateOfDeath: string;
  maritalStatus: string;
  dateOfMarriage: string;
  idIssueDate: string;
  idSequenceNumber: string;
  onHANIS: boolean;
  onNPR: boolean;
  smartCardIssued: boolean;
  idNumberBlocked: boolean;
  photo: string;
  dataSource: string;
  hasPhoto: boolean;
  report: string;
  canAccessDhaLive: boolean;
}

export interface WhoYouIdVerificationResponse {
  code: number;
  detail: WhoYouIdVerificationDetail;
  message?: string;
}

// ID Verification Request Types
export interface WhoYouIdVerificationRequest {
  IdNumber: string;
  ClientReference: string;
  IncludePhoto: boolean;
  IncludeReport: boolean;
  RequestPurpose: string;
  RequestSource: string;
}

// Zod schemas for WhoYou ID Verification validation
export const whoYouIdVerificationDetailSchema = z.object({
  id: z.string(),
  idNumber: z.string(),
  firstNames: z.string(),
  surname: z.string(),
  gender: z.string(),
  dateOfBirth: z.string(),
  status: z.string(),
  datePerformed: z.string(),
  birthPlaceCountryCode: z.string(),
  deadIndicator: z.boolean().nullable(),
  dateOfDeath: z.string(),
  maritalStatus: z.string(),
  dateOfMarriage: z.string(),
  idIssueDate: z.string(),
  idSequenceNumber: z.string(),
  onHANIS: z.boolean(),
  onNPR: z.boolean(),
  smartCardIssued: z.boolean(),
  idNumberBlocked: z.boolean(),
  photo: z.string(),
  dataSource: z.string(),
  hasPhoto: z.boolean(),
  report: z.string(),
  canAccessDhaLive: z.boolean(),
});

export const whoYouIdVerificationResponseSchema = z.object({
  code: z.number(),
  detail: whoYouIdVerificationDetailSchema,
  message: z.string().optional(),
});

export const whoYouIdVerificationRequestSchema = z.object({
  IdNumber: z.string().min(1, "ID number is required"),
  ClientReference: z.string().min(1, "Client reference is required"),
  IncludePhoto: z.boolean(),
  IncludeReport: z.boolean(),
  RequestPurpose: z.string().optional(),
  RequestSource: z.string().optional(),
});

// WhoYou OTV (One-Time-Verification) Success Response
export interface WhoYouOtvSuccessResponse {
  code: 0;
  detail: {
    pinCode: string;
    url: {
      PWA: string;
    };
  };
  message: string;
}

export const whoYouOtvSuccessResponseSchema = z.object({
  code: z.literal(0),
  detail: z.object({
    pinCode: z.string(),
    url: z.object({
      PWA: z.string().url(),
    }),
  }),
  message: z.string(),
});

// WhoYou OTV (One-Time-Verification) Error Response
export interface WhoYouOtvErrorResponse {
  code: number;
  message: string;
  detail?: {
    pinCode: string;
    url: {
      PWA: string;
    };
  };
}

export const whoYouOtvErrorResponseSchema = z.object({
  code: z.number().int().gt(0),
  message: z.string(),
  detail: z.any().optional(),
});

// Combined OTV Response
export type WhoYouOtvResponse =
  | WhoYouOtvSuccessResponse
  | WhoYouOtvErrorResponse;

export const whoYouOtvResponseSchema = z.union([
  whoYouOtvSuccessResponseSchema,
  whoYouOtvErrorResponseSchema,
]);

// WhoYou OTV Results Response Types
export interface WhoYouOtvDocumentPhotos {
  front: string;
  back: string;
}

export interface WhoYouOtvAllDocumentCaptureInformation {
  documentType: string;
  documentNumber: string;
  iDNumber: string;
  cardNo: string;
  countryOfBirth: string;
  dateOfBirth: string;
  dateOfExpire: string;
  dateOfIssue: string;
  firstNames: string;
  nationality: string;
  passportNo: string;
  gender: string;
  surname: string;
  issuingCountryCode: string;
  mrzStatus: "NO_MRZ" | "MRZ_EXTRACT_FAILED" | "MRZ_EXTRACT_SUCCESS";
  isExtracted: boolean;
}

export interface WhoYouOtvDocumentResult {
  faceVerificationScore: string;
  faceVerificationResult: string;
  informationScore: string;
  informationResult: string;
  countryCode: string;
  allDocumentCaptureInformation: WhoYouOtvAllDocumentCaptureInformation;
}

export interface WhoYouOtvStatus {
  name: string;
  description: string;
  code:
    | "VERIFIED_SYS_APRVD"
    | "VERIFIED_USR_APRVD"
    | "EXP_SYS_RJCTD"
    | "EXP_TO_REVIEW"
    | "EXP_APRVD_UNVRFD";
}

export interface WhoYouOtvResultsDetail {
  hanisID: string;
  hanisResult: string;
  hanisError: number;
  hanisReference: string;
  idNumber: string;
  firstNames: string;
  surname: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  hanisType: string;
  onFileMatch: boolean;
  dhaVerified: boolean;
  photo: string;
  report: string;
  idvCountryCode: string;
  documentPhotos: WhoYouOtvDocumentPhotos;
  documentResult: WhoYouOtvDocumentResult;
  dataSource:
    | "DHA Direct"
    | "DHA SAFPS"
    | "WhoYou"
    | "Document Upload"
    | "Approved Selfie";
  dateStamp: string;
  otvStatus: WhoYouOtvStatus;
}

export interface WhoYouOtvResultsResponse {
  code: number;
  detail: WhoYouOtvResultsDetail;
  message: string;
}

// Zod schemas for WhoYou OTV Results validation
export const whoYouOtvDocumentPhotosSchema = z.object({
  front: z.string(),
  back: z.string(),
});

export const whoYouOtvAllDocumentCaptureInformationSchema = z.object({
  documentType: z.string(),
  documentNumber: z.string(),
  iDNumber: z.string(),
  cardNo: z.string(),
  countryOfBirth: z.string(),
  dateOfBirth: z.string(),
  dateOfExpire: z.string(),
  dateOfIssue: z.string(),
  firstNames: z.string(),
  nationality: z.string(),
  passportNo: z.string(),
  gender: z.string(),
  surname: z.string(),
  issuingCountryCode: z.string(),
  mrzStatus: z.enum(["NO_MRZ", "MRZ_EXTRACT_FAILED", "MRZ_EXTRACT_SUCCESS"]),
  isExtracted: z.boolean(),
});

export const whoYouOtvDocumentResultSchema = z.object({
  faceVerificationScore: z.string(),
  faceVerificationResult: z.string(),
  informationScore: z.string(),
  informationResult: z.string(),
  countryCode: z.string(),
  allDocumentCaptureInformation: whoYouOtvAllDocumentCaptureInformationSchema,
});

export const whoYouOtvStatusSchema = z.object({
  name: z.string(),
  description: z.string(),
  code: z.enum([
    "VERIFIED_SYS_APRVD",
    "VERIFIED_USR_APRVD",
    "EXP_SYS_RJCTD",
    "EXP_TO_REVIEW",
    "EXP_APRVD_UNVRFD",
  ]),
});

export const whoYouOtvResultsDetailSchema = z.object({
  hanisID: z.string(),
  hanisResult: z.string(),
  hanisError: z.number(),
  hanisReference: z.string(),
  idNumber: z.string(),
  firstNames: z.string(),
  surname: z.string(),
  dateOfBirth: z.string(),
  gender: z.string(),
  status: z.string(),
  hanisType: z.string(),
  onFileMatch: z.boolean(),
  dhaVerified: z.boolean(),
  photo: z.string(),
  report: z.string(),
  idvCountryCode: z.string(),
  documentPhotos: whoYouOtvDocumentPhotosSchema,
  documentResult: whoYouOtvDocumentResultSchema,
  dataSource: z.enum([
    "DHA Direct",
    "DHA SAFPS",
    "WhoYou",
    "Document Upload",
    "Approved Selfie",
  ]),
  dateStamp: z.string(),
  otvStatus: whoYouOtvStatusSchema,
});

export const whoYouOtvResultsResponseSchema = z.object({
  code: z.literal(0),
  detail: whoYouOtvResultsDetailSchema,
  message: z.string(),
});

// WhoYou Employment Status Verification Response Types
export interface WhoYouEmployerInformation {
  id: string;
  idNumber: string;
  sector: string;
  occupation: string;
  contactPerson: string;
  employerName: string;
  originalEmployerName: string;
  employerCompanyCipcStatus: string;
  employerBranchDetails: string;
  employerContactTelephone: string;
  employerEmailAddress: string;
  employerAddressLine1: string;
  employerAddressLine2: string;
  employerAddressLine3: string;
  employerAddressLine4: string;
  employerAddressPostCode: string;
  firstDate: string | null;
  firstStatus: string;
  latestDate: string | null;
  latestStatus: string;
  recordDate: string | null;
  score: number;
  bureauSource: string;
  source: string;
  kycSource: string;
  reference: string;
  employerTelephone: string[];
}

export interface WhoYouEmploymentVerificationDetail {
  isWhoYouCache: boolean;
  employerInformation: WhoYouEmployerInformation[];
}

export interface WhoYouEmploymentVerificationResponse {
  code: number;
  detail: WhoYouEmploymentVerificationDetail;
}

// Zod schemas for WhoYou Employment Status Verification validation
export const whoYouEmployerInformationSchema = z.object({
  id: z.string(),
  idNumber: z.string(),
  sector: z.string(),
  occupation: z.string(),
  contactPerson: z.string(),
  employerName: z.string(),
  originalEmployerName: z.string(),
  employerCompanyCipcStatus: z.string(),
  employerBranchDetails: z.string(),
  employerContactTelephone: z.string(),
  employerEmailAddress: z.string(),
  employerAddressLine1: z.string(),
  employerAddressLine2: z.string(),
  employerAddressLine3: z.string(),
  employerAddressLine4: z.string(),
  employerAddressPostCode: z.string(),
  firstDate: z.string().nullable(),
  firstStatus: z.string(),
  latestDate: z.string().nullable(),
  latestStatus: z.string(),
  recordDate: z.string().nullable(),
  score: z.number(),
  bureauSource: z.string(),
  source: z.string(),
  kycSource: z.string(),
  reference: z.string(),
  employerTelephone: z.array(z.string()),
});

export const whoYouEmploymentVerificationDetailSchema = z.object({
  isWhoYouCache: z.boolean(),
  employerInformation: z.array(whoYouEmployerInformationSchema),
});

export const whoYouEmploymentVerificationResponseSchema = z.object({
  code: z.number(),
  detail: whoYouEmploymentVerificationDetailSchema,
});

// API Response Types for Frontend
export interface EmploymentVerificationApiResponse {
  data: WhoYouEmploymentVerificationResponse;
  message: string;
}

export const employmentVerificationApiResponseSchema = z.object({
  data: whoYouEmploymentVerificationResponseSchema,
  message: z.string(),
});

export interface DecryptedApplication {
  affordability: any | null;
  application_amount: number | null;
  bank_account_holder: string | null;
  bank_account_number: string | null;
  bank_account_type: string | null;
  bank_name: string | null;
  branch_code: string | null;
  bravelender_application_id: string | null;
  city: string | null;
  created_at: string;
  date_of_birth: string | null;
  decline_reason: any | null;
  dependants: number | null;
  employer_address: string | null;
  employer_contact_number: string | null;
  employer_name: string | null;
  employment_end_date: string | null;
  employment_type: string | null;
  gender: string | null;
  gender_other: string | null;
  home_address: string | null;
  id: number;
  id_number: string; // This remains encrypted
  job_title: string | null;
  language: string | null;
  loan_purpose: string | null;
  loan_purpose_reason: string | null;
  marital_status: string | null;
  monthly_income: number | null;
  nationality: string | null;
  next_of_kin_email: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone_number: string | null;
  phone_number: string | null;
  postal_code: string | null;
  status: string;
  term: number;
  updated_at: string;
  user_id: string;
  work_experience: string | null;
  // Profile information
  profile: {
    created_at: string;
    email: string | null;
    full_name: string;
    id: string;
    id_number: string | null;
    phone_number: string | null;
    role: string;
  } | null;
  // Additional decrypted/computed fields
  id_number_decrypted: string;
  first_name: string | null;
  last_name: string | null;
}
