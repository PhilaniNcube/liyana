"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { z } from "zod";
import {
  submitLoanApplication,
  type LoanApplicationState,
} from "@/lib/actions/loans";
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
import { Form } from "@/components/ui/form";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { CreditCheckStep } from "@/components/credit-check-step";
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
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loanApplicationSchema } from "@/lib/schemas";
import { PersonalInfoStep } from "./loan-application/personal-info-step";
import { EmploymentInfoStep } from "./loan-application/employment-info-step";
import { LoanAndBankingStep } from "./loan-application/loan-and-banking-step";

// Helper function to convert application data to form data
const convertApplicationToFormData = (
  appData: Database["public"]["Tables"]["applications"]["Row"],
  userEmail?: string,
  userFullName?: string
): Partial<z.infer<typeof loanApplicationSchema>> => {
  const [firstName, ...lastNameParts] = userFullName?.split(" ") || ["", ""];
  const lastName = lastNameParts.join(" ");

  return {
    first_name: firstName || "",
    last_name: lastName || "",
    email: userEmail || "",
    id_number: appData.id_number || "",
    phone_number: appData.phone_number || "",
    date_of_birth: appData.date_of_birth || "",
    gender: appData.gender || "male",
    gender_other: appData.gender_other || "",
    language: appData.language || "English",
    nationality: appData.nationality || "South African",
    marital_status: appData.marital_status || "single",
    dependants: appData.dependants || 0,
    residential_address: appData.home_address || "",
    city: appData.city || "",
    postal_code: appData.postal_code || "",
    next_of_kin_name: appData.next_of_kin_name || "",
    next_of_kin_phone_number: appData.next_of_kin_phone_number || "",
    next_of_kin_email: appData.next_of_kin_email || "",
    employment_type: appData.employment_type || "employed",
    employer_name: appData.employer_name || "",
    job_title: appData.job_title || "",
    monthly_income: appData.monthly_income || 0,
    employer_address: appData.employer_address || "",
    employer_contact_number: appData.employer_contact_number || "",
    employment_end_date: appData.employment_end_date || "",
    application_amount: appData.application_amount || 1000,
    term: appData.term || 5,
    loan_purpose: appData.loan_purpose || "",
    loan_purpose_reason: appData.loan_purpose_reason || "",
    affordability: (appData.affordability as any) || {
      income: [
        { type: "Bonus", amount: 0 },
        { type: "Rental Income", amount: 0 },
        { type: "Business Income", amount: 0 },
        { type: "Maintenance/spousal support", amount: 0 },
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
      deductions: [
        { type: "PAYE", amount: 0 },
        { type: "UIF", amount: 0 },
        { type: "SDL", amount: 0 },
        { type: "Other", amount: 0 },
      ],
    },
    bank_name: appData.bank_name || "",
    bank_account_holder: appData.bank_account_holder || "",
    bank_account_number: appData.bank_account_number || "",
    bank_account_type: appData.bank_account_type || "savings",
    branch_code: appData.branch_code || "",
  };
};

type LoanApplicationData = z.infer<typeof loanApplicationSchema>;

const STEPS = [
  {
    id: 1,
    title: "Credit Check",
    description: "Quick pre-qualification check",
    icon: CheckCircle,
  },
  {
    id: 2,
    title: "Personal Information",
    description: "Tell us about yourself",
    icon: User,
  },
  {
    id: 3,
    title: "Employment Details",
    description: "Your work information",
    icon: Briefcase,
  },
  {
    id: 4,
    title: "Loan & Banking",
    description: "Banking information",
    icon: Calculator,
  },
  {
    id: 5,
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
  previousApplicationData?:
    | Database["public"]["Tables"]["applications"]["Row"]
    | null;
  hasPreviousApplication?: boolean;
  userEmail?: string;
  userFullName?: string;
}

// Step Indicator Component
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full max-w-5xl mx-auto mb-8 ">
      <div className="flex items-center justify-between w-full">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const IconComponent = step.icon;

          return (
            <div key={step.id} className="flex items-center w-full">
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
  previousApplicationData,
  hasPreviousApplication = false,
  userEmail,
  userFullName,
}: LoanApplicationFormProps) {
  const router = useRouter();

  // Use nuqs for step management and applicationId via search params
  const [currentStep, setCurrentStep] = useQueryState(
    "step",
    parseAsInteger.withDefault(1) // Start from step 1 (Credit Check)
  );

  const [applicationId, setApplicationId] = useQueryState(
    "applicationId",
    parseAsString.withDefault(propApplicationId || "")
  );

  // Credit check state
  const [creditCheckStatus, setCreditCheckStatus] = useState<
    "idle" | "loading" | "success" | "failed"
  >("idle");
  const [creditCheckResults, setCreditCheckResults] = useState<any>(null);

  const [state, formAction] = useActionState<LoanApplicationState, FormData>(
    submitLoanApplication,
    {}
  );
  const [isPending, startTransition] = useTransition();

  // Credit check function
  const performCreditCheck = async (idNumber: string) => {
    setCreditCheckStatus("loading");
    setCreditCheckResults(null); // Reset previous results

    try {
      const response = await fetch(
        `/api/kyc/credit-check?idNumber=${encodeURIComponent(idNumber)}`
      );

      const data = await response.json();
      setCreditCheckResults(data);

      // Check the success flag from the API response
      if (data.success) {
        // Check if credit score is available and meets minimum requirement
        const creditScore = data.creditScore || data.score || null;

        if (creditScore !== null && creditScore < 600) {
          setCreditCheckStatus("failed");
          // Update results to indicate credit score failure
          setCreditCheckResults({
            ...data,
            success: false,
            creditScoreFailed: true,
            creditScore,
            message: `Your credit score of ${creditScore} does not meet our minimum requirement of 600. We are unable to proceed with your loan application at this time.`,
          });
        } else {
          setCreditCheckStatus("success");
          // Automatically proceed to the next step on success
          await setCurrentStep(2);
        }
      } else {
        setCreditCheckStatus("failed");
      }
    } catch (error) {
      console.error("Credit check error:", error);
      setCreditCheckStatus("failed");
      setCreditCheckResults({
        success: false,
        message: "An unexpected error occurred during the credit check.",
      });
    }
  };

  // Use React Query to fetch documents
  const { data: documents = [], isLoading: isLoadingDocuments } =
    useDocuments(applicationId);

  // When application is successfully submitted, move to document upload step
  useEffect(() => {
    if (state.success && state.applicationId && currentStep < 5) {
      setApplicationId(state.applicationId);
      setCurrentStep(5); // Move to document upload step
      // Scroll to top after successful submission
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [
    state.success,
    state.applicationId,
    currentStep,
    setCurrentStep,
    setApplicationId,
  ]);

  // Form for all steps (unified form)
  const form = useForm<LoanApplicationData>({
    resolver: zodResolver(loanApplicationSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      id_number: "",
      date_of_birth: "",
      phone_number: "",
      email: "",
      gender: "male",
      gender_other: "",
      language: "English",
      nationality: "South African",
      dependants: 0,
      marital_status: "single",
      residential_address: "",
      city: "",
      postal_code: "",
      next_of_kin_name: "",
      next_of_kin_phone_number: "",
      next_of_kin_email: "",
      employment_type: "employed",
      employer_name: "",
      job_title: "",
      monthly_income: 0,
      employer_address: "",
      employer_contact_number: "",
      employment_end_date: "",
      application_amount: 1000,
      term: 5,
      loan_purpose: "",
      loan_purpose_reason: "",
      affordability: {
        income: [
          { type: "Bonus", amount: 0 },
          { type: "Rental Income", amount: 0 },
          { type: "Business Income", amount: 0 },
          { type: "Maintenance/spousal support", amount: 0 },
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
        deductions: [
          { type: "PAYE", amount: 0 },
          { type: "UIF", amount: 0 },
          { type: "SDL", amount: 0 },
          { type: "Other", amount: 0 },
        ],
      },
      bank_name: "",
      bank_account_holder: "",
      bank_account_number: "",
      bank_account_type: "savings",
      branch_code: "",
    },
  });

  // Populate form with previous application data if available
  useEffect(() => {
    if (hasPreviousApplication && previousApplicationData) {
      const previousFormData = convertApplicationToFormData(
        previousApplicationData,
        userEmail,
        userFullName
      );

      // Reset form with previous data
      Object.entries(previousFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          form.setValue(key as keyof LoanApplicationData, value as any);
        }
      });
    } else if (userEmail || userFullName) {
      // Even without previous application, pre-fill user info
      if (userEmail) {
        form.setValue("email", userEmail);
      }
      if (userFullName) {
        const nameParts = userFullName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        if (firstName) form.setValue("first_name", firstName);
        if (lastName) form.setValue("last_name", lastName);
      }
    }
  }, [
    hasPreviousApplication,
    previousApplicationData,
    userEmail,
    userFullName,
    form,
  ]);

  // Watch for ID number changes to auto-populate date of birth and bank name changes to auto-populate branch code
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "id_number" && type === "change" && value.id_number) {
        const dateOfBirth = extractDateOfBirthFromSAID(value.id_number);
        if (dateOfBirth) {
          form.setValue("date_of_birth", dateOfBirth);
        }
      } else if (name === "bank_name" && type === "change" && value.bank_name) {
        // Auto-populate branch code based on selected bank
        const branchCode =
          BANK_BRANCH_CODES[value.bank_name.toLowerCase().replace(/ /g, "_")] ||
          "";
        form.setValue("branch_code", branchCode);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleNext = async () => {
    // If we're on step 1 (Credit Check), check if credit check passed
    if (currentStep === 1) {
      if (creditCheckStatus !== "success") {
        // Don't allow proceeding if credit check hasn't passed
        return;
      }

      // Check if credit score failed (below 600)
      if (creditCheckResults?.creditScoreFailed) {
        // Don't allow proceeding if credit score is below 600
        return;
      }
    }

    // If we're on step 4, submit the application before moving to step 5
    if (currentStep === 4) {
      await handleSubmitApplication();
    } else if (currentStep < 5) {
      await setCurrentStep(currentStep + 1);
      // Scroll to top after navigation
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 1) {
      await setCurrentStep(currentStep - 1);
      // Scroll to top after navigation
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitApplication = async () => {
    // Trigger form validation for all fields
    const isValid = await form.trigger();

    if (!isValid) {
      const errors = form.formState.errors;
      console.log("Form validation errors:", errors);

      // Determine which step contains the first error
      let errorStep = 1; // Default to first step

      // Step 1 is credit check (no specific form errors, proceed to step 2)
      // Step 2 fields (Personal Info)
      if (
        errors.first_name ||
        errors.last_name ||
        errors.id_number ||
        errors.date_of_birth ||
        errors.phone_number ||
        errors.email ||
        errors.gender ||
        errors.gender_other ||
        errors.language ||
        errors.nationality ||
        errors.dependants ||
        errors.marital_status ||
        errors.residential_address ||
        errors.city ||
        errors.postal_code ||
        errors.next_of_kin_name ||
        errors.next_of_kin_phone_number ||
        errors.next_of_kin_email
      ) {
        errorStep = 2;
      }
      // Step 3 fields (Employment)
      else if (
        errors.employment_type ||
        errors.employer_name ||
        errors.job_title ||
        errors.monthly_income ||
        errors.employer_address ||
        errors.employer_contact_number ||
        errors.employment_end_date
      ) {
        errorStep = 3;
      }
      // Step 4 fields (Loan & Banking)
      else if (
        errors.application_amount ||
        errors.loan_purpose ||
        errors.loan_purpose_reason ||
        errors.affordability ||
        errors.term ||
        errors.bank_name ||
        errors.bank_account_holder ||
        errors.bank_account_type ||
        errors.bank_account_number ||
        errors.branch_code
      ) {
        errorStep = 4;
      }

      await setCurrentStep(errorStep);
      return;
    }

    // Submit the application
    startTransition(() => {
      const formData = form.getValues();
      const formDataObj = new FormData();

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "affordability") {
            // Serialize affordability object as JSON
            formDataObj.append(key, JSON.stringify(value));
          } else if (key === "date_of_birth" || key === "employment_end_date") {
            // Handle date fields specially - don't submit empty strings
            if (value && value.toString().trim() !== "") {
              formDataObj.append(key, value.toString());
            }
          } else if (
            key === "gender_other" ||
            key === "employer_address" ||
            key === "employer_contact_number" ||
            key === "loan_purpose_reason"
          ) {
            // Handle optional fields - don't submit empty strings
            if (value && value.toString().trim() !== "") {
              formDataObj.append(key, value.toString());
            }
          } else {
            formDataObj.append(key, value.toString());
          }
        }
      });

      formAction(formDataObj);
    });
  };

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreditCheckStep
            onCheckComplete={async (idNumber: string) => {
              await performCreditCheck(idNumber);
            }}
            status={creditCheckStatus}
            results={creditCheckResults}
            form={form}
          />
        );
      case 2:
        return <PersonalInfoStep form={form} />;
      case 3:
        return <EmploymentInfoStep form={form} />;
      case 4:
        return <LoanAndBankingStep form={form} />;
      case 5:
        return (
          <DocumentUploadForm
            applicationId={applicationId}
            documents={documents}
          />
        );
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
    <div className={cn("w-full max-w-5xl mx-auto space-y-6", className)}>
      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Previous Application Notice */}
      {hasPreviousApplication && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Previous Application Data Loaded</AlertTitle>
          <AlertDescription>
            We've pre-filled the form with information from your previous loan
            application submitted on{" "}
            {previousApplicationData?.created_at &&
              new Date(previousApplicationData.created_at).toLocaleDateString()}
            . Please review and update any information that may have changed
            since your last application.
          </AlertDescription>
        </Alert>
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
      <Card className="w-full">
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
            disabled={currentStep === 1 || isPending}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}

        <div className={`flex gap-2 ${currentStep === 1 ? "ml-auto" : ""}`}>
          {currentStep < 5 && ( // Allow all steps except step 5 to show Next button
            <Button
              type="button"
              onClick={handleNext}
              disabled={
                isPending ||
                (currentStep === 1 &&
                  (creditCheckStatus !== "success" ||
                    creditCheckResults?.creditScoreFailed))
              }
            >
              {currentStep === 4 && isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {currentStep === 4 ? "Submit Application" : "Next"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

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
