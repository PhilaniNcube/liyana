"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  submitLoanApplication,
  type LoanApplicationState,
} from "@/lib/actions/loans";
import { performKYCChecks, type KYCResults } from "@/lib/kyc-checks";
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
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

// Step 1: Personal Information Schema
const personalInfoSchema = z
  .object({
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

// Step 2: Employment and Loan Information Schema
const employmentLoanSchema = z.object({
  employmentStatus: z.enum(
    ["employed", "self_employed", "unemployed", "retired", "contract"],
    {
      required_error: "Employment status is required",
    }
  ),
  employer: z.string().min(1, "Employer is required"),
  employerAddress: z.string().optional(),
  employerContactNumber: z.string().optional(),
  jobTitle: z.string().min(1, "Job title is required"),
  monthlyIncome: z.string().min(1, "Monthly income is required"),
  workExperience: z.string().min(1, "Work experience is required"),
  loanAmount: z
    .number()
    .min(500, "Minimum loan amount is R500")
    .max(5000, "Maximum loan amount is R5,000"),
  loanPurpose: z.enum(
    ["debt_consolidation", "home_improvement", "education", "medical", "other"],
    {
      required_error: "Loan purpose is required",
    }
  ),
  repaymentPeriod: z
    .number()
    .min(7, "Minimum repayment period is 7 days")
    .max(30, "Maximum repayment period is 30 days"),
  // Next of kin information
  nextOfKinName: z.string().optional(),
  nextOfKinPhone: z.string().optional(),
  nextOfKinEmail: z.string().optional(),
});

// Combined schema for validation
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
      ["employed", "self_employed", "contract", "unemployed", "retired"],
      {
        required_error: "Employment status is required",
      }
    ),
    employer: z.string().min(1, "Employer is required"),
    employerAddress: z.string().optional(),
    employerContactNumber: z.string().optional(),
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
    repaymentPeriod: z
      .number()
      .min(7, "Minimum repayment period is 7 days")
      .max(30, "Maximum repayment period is 30 days"),
    // Next of kin information
    nextOfKinName: z.string().optional(),
    nextOfKinPhone: z.string().optional(),
    nextOfKinEmail: z.string().optional(),
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

type PersonalInfoData = z.infer<typeof personalInfoSchema>;
type EmploymentLoanData = z.infer<typeof employmentLoanSchema>;
type LoanApplicationData = z.infer<typeof loanApplicationSchema>;

const STEPS = [
  {
    id: 1,
    title: "Personal Information",
    description: "Tell us about yourself",
  },
  {
    id: 2,
    title: "Employment & Loan Details",
    description: "Employment and loan information",
  },
];

interface LoanApplicationFormProps {
  className?: string;
}

export function LoanApplicationForm({ className }: LoanApplicationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<"application" | "complete">(
    "application"
  );
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [state, formAction] = useActionState<LoanApplicationState, FormData>(
    submitLoanApplication,
    {}
  );
  const [isPending, startTransition] = useTransition();
  const [isKYCChecking, setIsKYCChecking] = useState(false);
  const [kycResults, setKycResults] = useState<KYCResults | null>(null);
  const [kycErrors, setKycErrors] = useState<string[]>([]);
  const errorSectionRef = useRef<HTMLDivElement>(null); // When application is successfully submitted, redirect to document upload page
  useEffect(() => {
    if (
      state.success &&
      state.applicationId &&
      currentPhase === "application"
    ) {
      setApplicationId(state.applicationId);
      // Redirect to the documents page
      router.push(`/profile/${state.applicationId}`);
    }
  }, [state.success, state.applicationId, currentPhase, router]);

  // Scroll to error section when KYC errors occur
  useEffect(() => {
    if (kycErrors.length > 0 && !isKYCChecking && errorSectionRef.current) {
      errorSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // Focus on the error section for accessibility
      errorSectionRef.current.focus();
    }
  }, [kycErrors, isKYCChecking]);

  // Form for step 1 (Personal Information)
  const personalInfoForm = useForm<PersonalInfoData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      identificationType: undefined,
      idNumber: "",
      passportNumber: "",
      dateOfBirth: "",
      phoneNumber: "",
      email: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
    },
  });
  // Form for step 2 (Employment & Loan)
  const employmentLoanForm = useForm<EmploymentLoanData>({
    resolver: zodResolver(employmentLoanSchema),
    defaultValues: {
      employmentStatus: undefined,
      employer: "",
      employerAddress: "",
      employerContactNumber: "",
      jobTitle: "",
      monthlyIncome: "",
      workExperience: "",
      loanAmount: 500,
      loanPurpose: undefined,
      repaymentPeriod: 7,
      nextOfKinName: "",
      nextOfKinPhone: "",
      nextOfKinEmail: "",
    },
  });

  // Clear date of birth when switching from ID to passport
  useEffect(() => {
    const subscription = personalInfoForm.watch((data, { name }) => {
      if (
        name === "identificationType" &&
        data.identificationType === "passport"
      ) {
        personalInfoForm.setValue("dateOfBirth", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [personalInfoForm]);

  const progress = (currentStep / STEPS.length) * 100;
  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await personalInfoForm.trigger();
      if (isValid) {
        // Get the ID number for KYC checks
        const formData = personalInfoForm.getValues();
        const idNumber =
          formData.identificationType === "id"
            ? formData.idNumber
            : formData.passportNumber;

        if (
          !idNumber ||
          (formData.identificationType === "id" && idNumber.length !== 13)
        ) {
          personalInfoForm.setError("idNumber", {
            message: "Please provide a valid ID number",
          });
          return;
        }

        // Perform KYC checks
        setIsKYCChecking(true);
        setKycErrors([]);

        try {
          const kycResults = await performKYCChecks(idNumber);
          setKycResults(kycResults);
          if (kycResults.overall) {
            // All KYC checks passed, proceed to next step
            setCurrentStep(2);
          } else {
            // Some KYC checks failed, show errors
            setKycErrors(kycResults.errors);
            // Scroll will be handled by useEffect
          }
        } catch (error) {
          setKycErrors([
            "An unexpected error occurred during verification. Please try again.",
          ]);
        } finally {
          setIsKYCChecking(false);
        }
      }
    }
  };
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKYCRetry = () => {
    // Reset KYC states without clearing form data
    setKycResults(null);
    setKycErrors([]);
    setIsKYCChecking(false);
  };
  const handleSubmit = async (data: EmploymentLoanData) => {
    // Combine data from both forms
    const personalData = personalInfoForm.getValues();
    const combinedData = { ...personalData, ...data };

    // Validate combined data
    const result = loanApplicationSchema.safeParse(combinedData);
    if (!result.success) {
      // Handle validation errors
      console.error("Validation errors:", result.error);
      return;
    }

    const formData = new FormData();
    Object.entries(combinedData).forEach(([key, value]) => {
      // Convert numbers to strings for FormData
      const stringValue =
        typeof value === "number" ? value.toString() : value || "";
      formData.append(key, stringValue);
    });

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {" "}
            <div>
              {" "}
              <CardTitle className="text-2xl">
                {currentPhase === "application" && "Loan Application"}
                {currentPhase === "complete" && "Application Complete"}
              </CardTitle>
              <CardDescription>
                {currentPhase === "application" &&
                  !state.success &&
                  `Step ${currentStep} of ${STEPS.length}: ${
                    STEPS[currentStep - 1]?.description
                  }`}
                {currentPhase === "application" &&
                  state.success &&
                  "Application Submitted - Redirecting to Document Upload..."}
                {currentPhase === "complete" &&
                  "Your loan application is now complete and under review"}
              </CardDescription>
            </div>
            {currentPhase === "application" && !state.success && (
              <Progress value={progress} className="w-full" />
            )}
          </div>
        </CardHeader>{" "}
        <CardContent>
          {currentPhase === "complete" ? (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-800">
                    Application Complete!
                  </h3>
                  <p className="text-green-600 mt-2">
                    Your loan application has been submitted successfully. You
                    will be redirected to upload the required documents.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Submit Another Application
              </Button>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <Form {...personalInfoForm}>
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={personalInfoForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />{" "}
                      <FormField
                        control={personalInfoForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={personalInfoForm.control}
                      name="identificationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identification Type</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select identification type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="id">
                                  South African ID
                                </SelectItem>
                                <SelectItem value="passport">
                                  Passport
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />{" "}
                    {personalInfoForm.watch("identificationType") === "id" && (
                      <FormField
                        control={personalInfoForm.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="1234567890123"
                                maxLength={13}
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-fill date of birth when ID number is complete
                                  const idNumber = e.target.value;
                                  if (idNumber.length === 13) {
                                    const extractedDate =
                                      extractDateOfBirthFromSAID(idNumber);
                                    if (extractedDate) {
                                      personalInfoForm.setValue(
                                        "dateOfBirth",
                                        extractedDate
                                      );
                                    }
                                  } else if (idNumber.length < 13) {
                                    // Clear date of birth if ID number is incomplete
                                    personalInfoForm.setValue(
                                      "dateOfBirth",
                                      ""
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              Your date of birth will be automatically extracted
                              from your ID number
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {personalInfoForm.watch("identificationType") ===
                      "passport" && (
                      <FormField
                        control={personalInfoForm.control}
                        name="passportNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passport Number</FormLabel>
                            <FormControl>
                              <Input placeholder="A12345678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}{" "}
                    <FormField
                      control={personalInfoForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          {personalInfoForm.watch("identificationType") ===
                            "id" && (
                            <p className="text-sm text-muted-foreground">
                              {field.value
                                ? "✓ Auto-filled from ID number"
                                : "Will be auto-filled when you enter your ID number"}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={personalInfoForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="0123456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="john@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={personalInfoForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FormField
                        control={personalInfoForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Cape Town" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="western-cape">
                                    Western Cape
                                  </SelectItem>
                                  <SelectItem value="gauteng">
                                    Gauteng
                                  </SelectItem>
                                  <SelectItem value="kwazulu-natal">
                                    KwaZulu-Natal
                                  </SelectItem>
                                  <SelectItem value="eastern-cape">
                                    Eastern Cape
                                  </SelectItem>
                                  <SelectItem value="free-state">
                                    Free State
                                  </SelectItem>
                                  <SelectItem value="limpopo">
                                    Limpopo
                                  </SelectItem>
                                  <SelectItem value="mpumalanga">
                                    Mpumalanga
                                  </SelectItem>
                                  <SelectItem value="north-west">
                                    North West
                                  </SelectItem>
                                  <SelectItem value="northern-cape">
                                    Northern Cape
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalInfoForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="8001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />{" "}
                    </div>
                    {/* KYC Check Results */}
                    {(isKYCChecking || kycErrors.length > 0 || kycResults) && (
                      <div className="space-y-4">
                        {isKYCChecking && (
                          <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertTitle>
                              Performing verification checks...
                            </AlertTitle>
                            <AlertDescription>
                              We're verifying your information with our security
                              partners. This may take a few moments.
                            </AlertDescription>
                          </Alert>
                        )}{" "}
                        {kycErrors.length > 0 && !isKYCChecking && (
                          <Alert
                            variant="destructive"
                            ref={errorSectionRef}
                            tabIndex={-1}
                            className="focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Verification Failed</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc list-inside space-y-1 mt-2">
                                {kycErrors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleKYCRetry}
                                  className="flex items-center gap-2"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Retry Verification
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                  Check your ID number and try again, or contact
                                  support if the issue persists.
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                        {kycResults?.overall && !isKYCChecking && (
                          <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">
                              Verification Successful
                            </AlertTitle>
                            <AlertDescription className="text-green-700">
                              All security checks have passed. You can proceed
                              with your application.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                    <div className="flex justify-end">
                      {" "}
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={
                          isKYCChecking ||
                          (kycResults !== null && !kycResults.overall)
                        }
                      >
                        {isKYCChecking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}

              {currentStep === 2 && (
                <Form {...employmentLoanForm}>
                  <form
                    onSubmit={employmentLoanForm.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={employmentLoanForm.control}
                      name="employmentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Status</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select employment status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employed">
                                  Employed
                                </SelectItem>
                                <SelectItem value="self_employed">
                                  Self Employed
                                </SelectItem>
                                <SelectItem value="contract">
                                  Contract
                                </SelectItem>
                                <SelectItem value="unemployed">
                                  Unemployed
                                </SelectItem>
                                <SelectItem value="retired">Retired</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />{" "}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={employmentLoanForm.control}
                        name="employer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employer</FormLabel>
                            <FormControl>
                              <Input placeholder="Company Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employmentLoanForm.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Software Developer"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={employmentLoanForm.control}
                        name="employerAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employer Address (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123 Business St, City"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employmentLoanForm.control}
                        name="employerContactNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Employer Contact Number (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="021 123 4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={employmentLoanForm.control}
                        name="monthlyIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Income (ZAR)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="25000"
                                type="number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employmentLoanForm.control}
                        name="workExperience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Experience (years)</FormLabel>
                            <FormControl>
                              <Input placeholder="5" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>{" "}
                    <FormField
                      control={employmentLoanForm.control}
                      name="loanAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Loan Amount: R{field.value.toLocaleString()}
                          </FormLabel>
                          <FormControl>
                            <div className="px-3">
                              <Slider
                                min={500}
                                max={5000}
                                step={50}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                                className="w-full"
                              />
                              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                                <span>R500</span>
                                <span>R5,000</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />{" "}
                    <FormField
                      control={employmentLoanForm.control}
                      name="loanPurpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Purpose</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select loan purpose" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="debt_consolidation">
                                  Debt Consolidation
                                </SelectItem>
                                <SelectItem value="home_improvement">
                                  Home Improvement
                                </SelectItem>
                                <SelectItem value="education">
                                  Education
                                </SelectItem>
                                <SelectItem value="medical">
                                  Medical Expenses
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Next of Kin Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Next of Kin Information (Optional)
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={employmentLoanForm.control}
                          name="nextOfKinName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Next of Kin Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={employmentLoanForm.control}
                          name="nextOfKinPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Next of Kin Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="082 123 4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={employmentLoanForm.control}
                        name="nextOfKinEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next of Kin Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="nextofkin@example.com"
                                type="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={employmentLoanForm.control}
                      name="repaymentPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Repayment Period: {field.value} days
                          </FormLabel>
                          <FormControl>
                            <div className="px-3">
                              <Slider
                                min={7}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                                className="w-full"
                              />
                              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                                <span>7 days</span>
                                <span>30 days</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {state.errors?._form && (
                      <div className="text-sm text-red-500">
                        {state.errors._form.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
