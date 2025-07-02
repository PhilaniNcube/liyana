"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { z } from "zod";
import {
  submitLoanApplication,
  type LoanApplicationState,
} from "@/lib/actions/loans";
import { performKYCChecks, type KYCResults } from "@/lib/kyc-checks";
import { useDocuments } from "@/hooks/use-documents";
import type { Database } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadForm } from "@/components/document-upload-form";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
  User,
  Briefcase,
  Calculator,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Helper function to format currency consistently (prevents hydration mismatch)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

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
  return `${fullYear}-${month}-${day}`;
};

// Unified schema for loan application
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
    gender: z.enum(["male", "female", "rather not say", "other"], {
      required_error: "Gender is required",
    }),
    genderOther: z.string().optional(),
    language: z.string().min(1, "Language is required"),
    dependants: z
      .number()
      .min(0, "Number of dependants must be 0 or more")
      .max(20, "Number of dependants cannot exceed 20"),
    maritalStatus: z.enum(
      ["single", "married", "divorced", "widowed", "life_partner"],
      {
        required_error: "Marital status is required",
      }
    ),
    nationality: z.string().min(1, "Nationality is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    postalCode: z.string().min(4, "Postal code is required"),
    // Employment and Loan Information
    employmentStatus: z.enum(
      ["employed", "self_employed", "contract", "unemployed", "retired"],
      {
        required_error: "Employment status is required",
      }
    ),
    employer: z.string().min(1, "Employer is required"),
    employerAddress: z.string().optional(),
    employerContactNumber: z.string().optional(),
    employmentEndDate: z.string().optional(),
    jobTitle: z.string().min(1, "Job title is required"),
    monthlyIncome: z.string().min(1, "Monthly income is required"),
    workExperience: z.string().min(1, "Work experience is required"),
    loanAmount: z
      .number()
      .min(500, "Minimum loan amount is R500")
      .max(5000, "Maximum loan amount is R5,000"),
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
    loanPurposeReason: z.string().optional(),
    repaymentPeriod: z
      .number()
      .min(5, "Minimum repayment period is 5 days")
      .max(60, "Maximum repayment period is 60 days"),
    // Next of kin information
    nextOfKinName: z.string().optional(),
    nextOfKinPhone: z.string().optional(),
    nextOfKinEmail: z.string().optional(),
    // Banking information
    bankName: z.string().min(1, "Bank name is required"),
    bankAccountHolder: z.string().min(1, "Account holder name is required"),
    bankAccountType: z.enum(["savings", "transaction", "current", "business"], {
      required_error: "Account type is required",
    }),
    bankAccountNumber: z
      .string()
      .min(8, "Bank account number must be at least 8 digits"),
    branchCode: z
      .string()
      .min(6, "Branch code must be at least 6 digits")
      .max(6, "Branch code must be exactly 6 digits"),
    // Affordability information
    affordability: z
      .object({
        income: z.array(
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
        expenses: z.array(
          z.object({
            type: z.string(),
            amount: z.number().min(0),
          })
        ),
      })
      .optional(),
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
  )
  .refine(
    (data) => {
      // Validate employment end date is required for retired or contract workers
      if (
        data.employmentStatus === "retired" ||
        data.employmentStatus === "contract"
      ) {
        return data.employmentEndDate && data.employmentEndDate.length > 0;
      }
      return true; // Not required for other employment statuses
    },
    {
      message:
        "Employment end date is required for retired or contract workers",
      path: ["employmentEndDate"],
    }
  )
  .refine(
    (data) => {
      // Validate loan purpose reason is required when loan purpose is "other"
      if (data.loanPurpose === "other") {
        return (
          data.loanPurposeReason && data.loanPurposeReason.trim().length > 0
        );
      }
      return true; // Not required for other loan purposes
    },
    {
      message: "Please specify the reason for your loan",
      path: ["loanPurposeReason"],
    }
  )
  .refine(
    (data) => {
      // Validate gender other is required when gender is "other"
      if (data.gender === "other") {
        return data.genderOther && data.genderOther.trim().length > 0;
      }
      return true; // Not required for other gender options
    },
    {
      message: "Please specify your gender",
      path: ["genderOther"],
    }
  );

type LoanApplicationData = z.infer<typeof loanApplicationSchema>;

const STEPS = [
  {
    id: 1,
    title: "Personal Information",
    description: "Tell us about yourself",
    icon: User,
  },
  {
    id: 2,
    title: "Employment Details",
    description: "Your work and income information",
    icon: Briefcase,
  },
  {
    id: 3,
    title: "Loan & Banking",
    description: "Loan details and banking information",
    icon: Calculator,
  },
  {
    id: 4,
    title: "Documents",
    description: "Upload required documents",
    icon: FileText,
  },
];

// Bank branch codes mapping (universal branch codes for major SA banks)
const BANK_BRANCH_CODES: Record<string, string> = {
  absa: "632005", // ABSA Universal Branch Code
  standard_bank: "051001", // Standard Bank Universal Branch Code
  fnb: "250655", // FNB Universal Branch Code
  nedbank: "198765", // Nedbank Universal Branch Code
  capitec: "470010", // Capitec Universal Branch Code
  discovery: "679000", // Discovery Bank Universal Branch Code
  tymebank: "678910", // TymeBank Universal Branch Code
  african_bank: "430000", // African Bank Universal Branch Code
  bidvest: "462005", // Bidvest Bank Universal Branch Code
  other: "", // User will need to enter manually
};

interface LoanApplicationFormProps {
  className?: string;
  showProgress?: boolean;
  applicationId?: string | null;
}

// Step Indicator Component
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const IconComponent = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2",
                    {
                      "bg-primary border-primary text-primary-foreground":
                        isActive || isCompleted,
                      "bg-background border-muted-foreground text-muted-foreground":
                        !isActive && !isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
                <div className="text-center mt-2">
                  <p
                    className={cn("text-sm font-medium", {
                      "text-primary": isActive || isCompleted,
                      "text-muted-foreground": !isActive && !isCompleted,
                    })}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LoanApplicationForm({
  className,
  showProgress = false,
  applicationId: propApplicationId,
}: LoanApplicationFormProps) {
  const router = useRouter();

  // Use nuqs for step management and applicationId via search params
  const [currentStep, setCurrentStep] = useQueryState(
    "step",
    parseAsInteger.withDefault(1)
  );

  const [applicationId, setApplicationId] = useQueryState(
    "applicationId",
    parseAsString.withDefault(propApplicationId || "")
  );
  const [state, formAction] = useActionState<LoanApplicationState, FormData>(
    submitLoanApplication,
    {}
  );
  const [isPending, startTransition] = useTransition();
  const [isKYCChecking, setIsKYCChecking] = useState(false);
  const [kycResults, setKycResults] = useState<KYCResults | null>(null);
  const [kycErrors, setKycErrors] = useState<string[]>([]);
  const errorSectionRef = useRef<HTMLDivElement>(null);

  // Use React Query to fetch documents
  const { data: documents = [], isLoading: isLoadingDocuments } =
    useDocuments(applicationId);

  // When application is successfully submitted, move to document upload step
  useEffect(() => {
    if (state.success && state.applicationId && currentStep < 4) {
      setApplicationId(state.applicationId);
      setCurrentStep(4); // Move to document upload step
    }
  }, [
    state.success,
    state.applicationId,
    currentStep,
    setCurrentStep,
    setApplicationId,
  ]);

  // Scroll to error section when KYC errors occur
  useEffect(() => {
    if (kycErrors.length > 0 && !isKYCChecking && errorSectionRef.current) {
      errorSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      errorSectionRef.current.focus();
    }
  }, [kycErrors, isKYCChecking]);

  // Form for all steps (unified form)
  const form = useForm<LoanApplicationData>({
    resolver: zodResolver(loanApplicationSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      identificationType: undefined,
      idNumber: "",
      passportNumber: "",
      dateOfBirth: "",
      phoneNumber: "",
      email: "",
      gender: undefined,
      genderOther: "",
      language: "",
      dependants: 0,
      maritalStatus: undefined,
      nationality: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      employmentStatus: undefined,
      employer: "",
      employerAddress: "",
      employerContactNumber: "",
      employmentEndDate: "",
      jobTitle: "",
      monthlyIncome: "",
      workExperience: "",
      loanAmount: 1000,
      loanPurpose: undefined,
      loanPurposeReason: "",
      repaymentPeriod: 30,
      nextOfKinName: "",
      nextOfKinPhone: "",
      nextOfKinEmail: "",
      bankName: "",
      bankAccountHolder: "",
      bankAccountType: undefined,
      bankAccountNumber: "",
      branchCode: "",
      affordability: {
        income: [
          { type: "Gross Income", amount: 0 },
          { type: "Bonus", amount: 0 },
          { type: "Rental Income", amount: 0 },
          { type: "Business Income", amount: 0 },
          { type: "Maintenance/spousal support", amount: 0 },
          { type: "Other", amount: 0 },
        ],
        deductions: [
          { type: "PAYE", amount: 0 },
          { type: "UIF", amount: 0 },
          { type: "SDL", amount: 0 },
          { type: "Other", amount: 0 },
        ],
        expenses: [
          { type: "Levies", amount: 0 },
          { type: "Municipal rates and taxes", amount: 0 },
          { type: "Car repayment", amount: 0 },
          { type: "Mortgage", amount: 0 },
          { type: "Rent", amount: 0 },
          { type: "DSTV", amount: 0 },
          { type: "School fees", amount: 0 },
          { type: "Groceries", amount: 0 },
          { type: "Fuel", amount: 0 },
          { type: "Airtime/Cellphone contract", amount: 0 },
          { type: "Medical Expenses", amount: 0 },
          { type: "Insurance", amount: 0 },
          { type: "Uniform", amount: 0 },
          { type: "Domestic services", amount: 0 },
          { type: "Other", amount: 0 },
        ],
      },
    },
  });

  // Field arrays for affordability (must be at component level, not in render function)
  const incomeFields = useFieldArray({
    control: form.control,
    name: "affordability.income",
  });

  const deductionFields = useFieldArray({
    control: form.control,
    name: "affordability.deductions",
  });

  const expenseFields = useFieldArray({
    control: form.control,
    name: "affordability.expenses",
  });

  // Watch for ID number changes to auto-populate date of birth and bank name changes to auto-populate branch code
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "idNumber" && type === "change" && value.idNumber) {
        const dateOfBirth = extractDateOfBirthFromSAID(value.idNumber);
        if (dateOfBirth) {
          form.setValue("dateOfBirth", dateOfBirth);
        }
      } else if (
        name === "identificationType" &&
        value.identificationType === "passport"
      ) {
        form.setValue("dateOfBirth", "");
      } else if (name === "bankName" && type === "change" && value.bankName) {
        // Auto-populate branch code based on selected bank
        const branchCode = BANK_BRANCH_CODES[value.bankName] || "";
        form.setValue("branchCode", branchCode);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleNext = async () => {
    // If we're on step 3, submit the application before moving to step 4
    if (currentStep === 3) {
      await handleSubmitApplication();
    } else if (currentStep < 4) {
      await setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      await setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = async (step: number) => {
    await setCurrentStep(step);
  };

  const handleSubmitApplication = async () => {
    // Trigger form validation for all fields
    const isValid = await form.trigger();

    if (!isValid) {
      // Find the first step with errors
      const errors = form.formState.errors;
      let errorStep = 1;

      // Step 1 fields
      if (
        errors.firstName ||
        errors.lastName ||
        errors.identificationType ||
        errors.idNumber ||
        errors.passportNumber ||
        errors.dateOfBirth ||
        errors.phoneNumber ||
        errors.email ||
        errors.gender ||
        errors.genderOther ||
        errors.language ||
        errors.dependants ||
        errors.maritalStatus ||
        errors.nationality ||
        errors.address ||
        errors.city ||
        errors.province ||
        errors.postalCode
      ) {
        errorStep = 1;
      }
      // Step 2 fields
      else if (
        errors.employmentStatus ||
        errors.employer ||
        errors.jobTitle ||
        errors.monthlyIncome ||
        errors.workExperience
      ) {
        errorStep = 2;
      }
      // Step 3 fields
      else if (
        errors.loanAmount ||
        errors.loanPurpose ||
        errors.loanPurposeReason ||
        errors.repaymentPeriod ||
        errors.bankName ||
        errors.bankAccountHolder ||
        errors.bankAccountType ||
        errors.bankAccountNumber ||
        errors.branchCode
      ) {
        errorStep = 3;
      }

      await setCurrentStep(errorStep);
      return;
    }

    // Perform KYC checks
    setIsKYCChecking(true);
    setKycErrors([]);
    setKycResults(null);

    try {
      const formData = form.getValues();
      const idNumber =
        formData.identificationType === "id" ? formData.idNumber || "" : "";

      const results = await performKYCChecks(idNumber);

      setKycResults(results);

      if (!results.overall) {
        setKycErrors(results.errors);
        setIsKYCChecking(false);
        return;
      }

      // If KYC passed, submit the application
      startTransition(() => {
        const formDataObj = new FormData();

        // Add all form fields except affordability
        Object.entries(formData).forEach(([key, value]) => {
          if (
            key !== "affordability" &&
            value !== undefined &&
            value !== null
          ) {
            formDataObj.append(key, value.toString());
          }
        });

        // Handle affordability object separately by serializing it
        if (formData.affordability) {
          formDataObj.append(
            "affordability",
            JSON.stringify(formData.affordability)
          );
        }

        formAction(formDataObj);
      });
    } catch (error) {
      console.error("KYC check failed:", error);
      setKycErrors(["Failed to perform KYC checks. Please try again."]);
    } finally {
      setIsKYCChecking(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="identificationType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Identification Type *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select identification type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="id">South African ID</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("identificationType") === "id" && (
        <FormField
          control={form.control}
          name="idNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Number *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your 13-digit ID number"
                  maxLength={13}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch("identificationType") === "passport" && (
        <FormField
          control={form.control}
          name="passportNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passport Number *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your passport number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="dateOfBirth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date of Birth *</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 0123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="rather not say">Rather not say</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Language *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your preferred language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="afrikaans">Afrikaans</SelectItem>
                  <SelectItem value="zulu">isiZulu</SelectItem>
                  <SelectItem value="xhosa">isiXhosa</SelectItem>
                  <SelectItem value="sotho">Sesotho</SelectItem>
                  <SelectItem value="tswana">Setswana</SelectItem>
                  <SelectItem value="pedi">Sepedi</SelectItem>
                  <SelectItem value="venda">Tshivenda</SelectItem>
                  <SelectItem value="tsonga">Xitsonga</SelectItem>
                  <SelectItem value="ndebele">isiNdebele</SelectItem>
                  <SelectItem value="swati">siSwati</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Conditional Gender Other field */}
      {form.watch("gender") === "other" && (
        <FormField
          control={form.control}
          name="genderOther"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Please specify your gender *</FormLabel>
              <FormControl>
                <Input placeholder="Please specify" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="dependants"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Dependants *</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="20"
                placeholder="Enter number of dependants"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="maritalStatus"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marital Status *</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="life_partner">Life Partner</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nationality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nationality *</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="south_african">South African</SelectItem>
                  <SelectItem value="zimbabwean">Zimbabwean</SelectItem>
                  <SelectItem value="botswanan">Botswanan</SelectItem>
                  <SelectItem value="namibian">Namibian</SelectItem>
                  <SelectItem value="mozambican">Mozambican</SelectItem>
                  <SelectItem value="lesotho">Lesotho</SelectItem>
                  <SelectItem value="eswatini">Eswatini</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street Address *</FormLabel>
            <FormControl>
              <Input placeholder="Enter your full street address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City *</FormLabel>
              <FormControl>
                <Input placeholder="City" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="province"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="eastern_cape">Eastern Cape</SelectItem>
                  <SelectItem value="free_state">Free State</SelectItem>
                  <SelectItem value="gauteng">Gauteng</SelectItem>
                  <SelectItem value="kwazulu_natal">KwaZulu-Natal</SelectItem>
                  <SelectItem value="limpopo">Limpopo</SelectItem>
                  <SelectItem value="mpumalanga">Mpumalanga</SelectItem>
                  <SelectItem value="northern_cape">Northern Cape</SelectItem>
                  <SelectItem value="north_west">North West</SelectItem>
                  <SelectItem value="western_cape">Western Cape</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code *</FormLabel>
              <FormControl>
                <Input placeholder="Postal code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="employmentStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employment Status *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your employment status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self-employed</SelectItem>
                  <SelectItem value="contract">Contract Worker</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Employment End Date - conditional field next to employment status */}
        {(form.watch("employmentStatus") === "retired" ||
          form.watch("employmentStatus") === "contract") && (
          <FormField
            control={form.control}
            name="employmentEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch("employmentStatus") === "retired" &&
                    "Retirement Date *"}
                  {form.watch("employmentStatus") === "contract" &&
                    "Contract End Date *"}
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="employer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your employer's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your job title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="employerAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Employer Address</FormLabel>
            <FormControl>
              <Input placeholder="Enter your employer's address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="employerContactNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employer Contact Number</FormLabel>
              <FormControl>
                <Input placeholder="Employer's phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="workExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work Experience *</FormLabel>
              <FormControl>
                <Input placeholder="Years of work experience" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="monthlyIncome"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monthly Income *</FormLabel>
            <FormControl>
              <Input placeholder="Enter your monthly income (ZAR)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Next of Kin Information */}
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold">Next of Kin</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nextOfKinName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next of Kin Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nextOfKinPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next of Kin Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="nextOfKinEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next of Kin Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderStep3 = () => {
    const loanAmount = form.watch("loanAmount");
    const repaymentPeriod = form.watch("repaymentPeriod");

    // Calculate totals (using the component-level field arrays)
    const totalIncome = incomeFields.fields.reduce((sum, _, index) => {
      const amount = form.watch(`affordability.income.${index}.amount`) || 0;
      return sum + amount;
    }, 0);

    const totalDeductions = deductionFields.fields.reduce((sum, _, index) => {
      const amount =
        form.watch(`affordability.deductions.${index}.amount`) || 0;
      return sum + amount;
    }, 0);

    const totalExpenses = expenseFields.fields.reduce((sum, _, index) => {
      const amount = form.watch(`affordability.expenses.${index}.amount`) || 0;
      return sum + amount;
    }, 0);

    const netIncome = totalIncome - totalDeductions;
    const disposableIncome = netIncome - totalExpenses;

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Loan Details</h3>

          <FormField
            control={form.control}
            name="loanAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Loan Amount: R{formatCurrency(loanAmount)}
                </FormLabel>
                <FormControl>
                  <Slider
                    min={500}
                    max={5000}
                    step={100}
                    value={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                    className="w-full"
                  />
                </FormControl>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>R500</span>
                  <span>R5,000</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loanPurpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Purpose *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="What will you use the loan for?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="debt_consolidation">
                      Debt Consolidation
                    </SelectItem>
                    <SelectItem value="home_improvement">
                      Home Improvement
                    </SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="medical">Medical Expenses</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("loanPurpose") === "other" && (
            <FormField
              control={form.control}
              name="loanPurposeReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Please specify the reason for your loan *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Describe what you'll use the loan for..."
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="repaymentPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repayment Period: {repaymentPeriod} days</FormLabel>
                <FormControl>
                  <Slider
                    min={5}
                    max={60}
                    step={1}
                    value={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                    className="w-full"
                  />
                </FormControl>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>5 days</span>
                  <span>60 days</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Affordability Assessment */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">
                Affordability Assessment
              </CardTitle>
              <CardDescription>
                Please provide your monthly income sources, deductions, and
                expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Income Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-green-600">Income</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => incomeFields.append({ type: "", amount: 0 })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Income
                  </Button>
                </div>
                <div className="space-y-3">
                  {incomeFields.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end"
                    >
                      <FormField
                        control={form.control}
                        name={`affordability.income.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Income type" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`affordability.income.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Amount"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => incomeFields.remove(index)}
                        disabled={incomeFields.fields.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Income:</span>
                    <span className="font-semibold text-green-600">
                      R{formatCurrency(totalIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-orange-600">Deductions</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      deductionFields.append({ type: "", amount: 0 })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Deduction
                  </Button>
                </div>
                <div className="space-y-3">
                  {deductionFields.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end"
                    >
                      <FormField
                        control={form.control}
                        name={`affordability.deductions.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Deduction type" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`affordability.deductions.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Amount"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deductionFields.remove(index)}
                        disabled={deductionFields.fields.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Deductions:</span>
                    <span className="font-semibold text-orange-600">
                      R{formatCurrency(totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-red-600">Expenses</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      expenseFields.append({ type: "", amount: 0 })
                    }
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Expense
                  </Button>
                </div>
                <div className="space-y-3">
                  {expenseFields.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end"
                    >
                      <FormField
                        control={form.control}
                        name={`affordability.expenses.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Expense type" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`affordability.expenses.${index}.amount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Amount"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => expenseFields.remove(index)}
                        disabled={expenseFields.fields.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Expenses:</span>
                    <span className="font-semibold text-red-600">
                      R{formatCurrency(totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-background rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Total Income:</span>
                  <span className="font-semibold text-green-600">
                    R{formatCurrency(totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Deductions:</span>
                  <span className="font-semibold text-orange-600">
                    -R{formatCurrency(totalDeductions)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Net Income:</span>
                  <span className="font-semibold">
                    R{formatCurrency(netIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span className="font-semibold text-red-600">
                    -R{formatCurrency(totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Disposable Income:</span>
                  <span
                    className={`font-bold text-lg ${
                      disposableIncome >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    R{formatCurrency(disposableIncome)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banking Information */}
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-semibold">Banking Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          className="w-full"
                          placeholder="Select your bank"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="absa">ABSA Bank</SelectItem>
                      <SelectItem value="standard_bank">
                        Standard Bank
                      </SelectItem>
                      <SelectItem value="fnb">
                        First National Bank (FNB)
                      </SelectItem>
                      <SelectItem value="nedbank">Nedbank</SelectItem>
                      <SelectItem value="capitec">Capitec Bank</SelectItem>
                      <SelectItem value="discovery">Discovery Bank</SelectItem>
                      <SelectItem value="tymebank">TymeBank</SelectItem>
                      <SelectItem value="african_bank">African Bank</SelectItem>
                      <SelectItem value="bidvest">Bidvest Bank</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bankAccountHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Full name as on bank account"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bankAccountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="transaction">
                        Transaction Account
                      </SelectItem>
                      <SelectItem value="current">
                        Current/Cheque Account
                      </SelectItem>
                      <SelectItem value="business">Business Account</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bankAccountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your account number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="branchCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Code *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder={
                          form.watch("bankName") === "other"
                            ? "Enter 6-digit branch code"
                            : field.value || "Select a bank to auto-fill"
                        }
                        value={field.value || ""}
                        onChange={field.onChange}
                        readOnly={form.watch("bankName") !== "other"}
                        className={
                          form.watch("bankName") !== "other"
                            ? "bg-muted text-foreground font-semibold"
                            : ""
                        }
                      />
                      {form.watch("bankName") &&
                        form.watch("bankName") !== "other" &&
                        field.value && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Badge variant="secondary" className="text-xs">
                              Auto-filled
                            </Badge>
                          </div>
                        )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    // Allow access to document upload step even without applicationId for testing
    if (!applicationId) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Document Upload (Demo Mode)
            </h3>
            <p className="text-muted-foreground mb-4">
              You can test the document upload functionality even without
              submitting an application. In demo mode, documents won't be saved
              to a real application.
            </p>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                To save documents to a real application, please complete and
                submit your loan application first.
              </AlertDescription>
            </Alert>
          </div>

          <DocumentUploadForm applicationId="demo" documents={[]} />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Application Submitted!</h3>
          <p className="text-muted-foreground mb-6">
            Your loan application has been submitted successfully. Please upload
            the required documents to complete the process.
          </p>
        </div>

        <DocumentUploadForm
          applicationId={applicationId}
          documents={documents}
        />
      </div>
    );
  };

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* KYC Error Section */}
      {kycErrors.length > 0 && (
        <div ref={errorSectionRef} tabIndex={-1} className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>KYC Checks Failed</AlertTitle>
            <AlertDescription>
              Please review the following issues and try again:
            </AlertDescription>
          </Alert>
          {kycErrors.map((error, index) => (
            <Alert key={index} variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ))}
          <Button onClick={() => setKycErrors([])} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Form Errors */}
      {state.errors && Object.keys(state.errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Form Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {Object.entries(state.errors).map(([field, messages]) => (
                <li key={field}>
                  <strong>{field}:</strong> {messages.join(", ")}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep}: {STEPS.find((s) => s.id === currentStep)?.title}
          </CardTitle>
          <CardDescription>
            {STEPS.find((s) => s.id === currentStep)?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {getCurrentStepContent()}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isPending || isKYCChecking}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}

        <div className={`flex gap-2 ${currentStep === 1 ? "ml-auto" : ""}`}>
          {currentStep < 4 && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isPending || isKYCChecking}
            >
              {currentStep === 3 && (isPending || isKYCChecking) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isKYCChecking ? "Verifying..." : "Submitting..."}
                </>
              ) : (
                <>
                  {currentStep === 3 ? "Submit Application" : "Next"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* KYC Results Display */}
      {kycResults && kycResults.overall && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Verification Successful</AlertTitle>
          <AlertDescription>
            All verification checks have passed successfully.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
