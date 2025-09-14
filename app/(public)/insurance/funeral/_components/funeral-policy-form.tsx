"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryState, parseAsInteger } from "nuqs";
import { funeralPolicyLeadSchemaWithRefines } from "@/lib/schemas";
import { createFuneralPolicy } from "@/lib/actions/funeral-policy";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { extractDateOfBirthFromSAID } from "@/lib/utils/sa-id";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus, Upload, FileText, X } from "lucide-react";
import { z } from "zod";
import FuneralPremiumCalculatorDialog from "./funeral-premium-calculator-dialog";

// South African banks with their branch codes
const southAfricanBanks = [
  { name: "ABSA Bank", code: "632005" },
  { name: "African Bank", code: "430000" },
  { name: "Bidvest Bank", code: "462005" },
  { name: "Capitec Bank", code: "470010" },
  { name: "Discovery Bank", code: "679000" },
  { name: "FNB (First National Bank)", code: "250655" },
  { name: "Investec Bank", code: "580105" },
  { name: "Nedbank", code: "198765" },
  { name: "Standard Bank", code: "051001" },
  { name: "TymeBank", code: "678910" },
  { name: "Ubank", code: "431010" },
  { name: "VBS Mutual Bank", code: "588000" },
] as const;

// Available coverage amounts
const coverageAmounts = [
  5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000,
];

// Policy document types available for upload
const POLICY_DOCUMENT_TYPES = {
  birth_certificate: "Birth Certificate",
  death_certificate: "Death Certificate",
  marriage_certificate: "Marriage Certificate",
  identity_document: "Identity Document",
  passport: "Passport",
  proof_of_address: "Proof of Address",
  payslip: "Payslip",
  drivers_license: "Driver's License",
} as const;

type PolicyDocumentType = keyof typeof POLICY_DOCUMENT_TYPES;

// Document upload state interface
interface PendingDocument {
  id: string;
  file: File;
  documentType: PolicyDocumentType;
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
  uploadedPath?: string;
}

// Helper function to find the closest coverage amount
const findClosestCoverageAmount = (targetAmount: number): number => {
  return coverageAmounts.reduce((prev, curr) =>
    Math.abs(curr - targetAmount) < Math.abs(prev - targetAmount) ? curr : prev
  );
};

type FuneralForm = z.infer<typeof funeralPolicyLeadSchemaWithRefines>;

type ActionState = {
  error?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  details?: string;
};

export default function FuneralPolicyForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createFuneralPolicy,
    {}
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // URL state management for coverage amount
  const [coverageAmountFromUrl, setCoverageAmountInUrl] = useQueryState(
    "coverAmount",
    parseAsInteger.withDefault(10000)
  );

  // Find the closest available coverage amount to the URL value
  const closestCoverageAmount = findClosestCoverageAmount(
    coverageAmountFromUrl
  );

  // Handle successful submission
  useEffect(() => {
    if (state && !state.error && state.message && !isPending) {
      toast.success("Application submitted successfully!", {
        description: state.message,
        duration: 5000,
      });

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    }
  }, [state, isPending, router]);

  // Multistep state
  const [currentStep, setCurrentStep] = useState(0);

  // Document upload state
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>(
    []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FuneralForm>({
    resolver: zodResolver(funeralPolicyLeadSchemaWithRefines),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      // Step 0: product + personal
      product_type: "funeral_policy" as const,
      coverage_amount: closestCoverageAmount,
      first_name: "",
      last_name: "",
      id_number: "",
      date_of_birth: "",
      start_date: "",
      phone_number: "",
      email: "",
      // Step 1: address + employment
      residential_address: "",
      city: "",
      postal_code: "",
      employment_type: undefined as any,
      employer_name: "",
      job_title: "",
      monthly_income: 0,
      employer_address: "",
      employer_contact_number: "",
      employment_end_date: "",
      // Step 2: banking
      account_name: "",
      bank_name: "",
      account_number: "",
      branch_code: "",
      account_type: undefined as any,
      payment_method: undefined as any,
      // Step 3: beneficiaries + declarations
      beneficiaries: [
        {
          first_name: "",
          last_name: "",
          id_number: "",
          relationship: undefined as any,
          percentage: 0,
        },
      ],
      terms_and_conditions: false,
      privacy_policy: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "beneficiaries",
  });

  // Watch coverage amount for URL updates
  const watchedCoverageAmount = form.watch("coverage_amount");

  // Update URL when coverage amount changes
  useEffect(() => {
    if (
      watchedCoverageAmount &&
      watchedCoverageAmount !== coverageAmountFromUrl
    ) {
      setCoverageAmountInUrl(watchedCoverageAmount);
    }
  }, [watchedCoverageAmount, coverageAmountFromUrl, setCoverageAmountInUrl]);

  // Define steps with the fields they are responsible for (for per-step validation)
  const steps: {
    title: string;
    description?: string;
    fields: (keyof FuneralForm)[];
  }[] = [
    {
      title: "Coverage & Personal",
      description: "Select coverage and provide your basic details",
      fields: [
        "coverage_amount",
        "first_name",
        "last_name",
        "id_number",
        "date_of_birth",
        "start_date",
        "phone_number",
        "email",
      ],
    },
    {
      title: "Address & Employment",
      description: "Where you live and work",
      fields: [
        "residential_address",
        "city",
        "postal_code",
        "employment_type",
        "employer_name",
        "job_title",
        "monthly_income",
        "employer_address",
        "employer_contact_number",
        "employment_end_date",
      ],
    },
    {
      title: "Banking",
      description: "Payment details",
      fields: [
        "account_name",
        "bank_name",
        "account_number",
        "branch_code",
        "account_type",
        "payment_method",
      ],
    },
    {
      title: "Documents",
      description: "Upload supporting documents",
      fields: [], // No form fields, just document uploads
    },
    {
      title: "Beneficiaries",
      description: "Beneficiaries & declarations",
      fields: ["beneficiaries", "terms_and_conditions", "privacy_policy"],
    },
  ];

  const totalSteps = steps.length;

  const goNext = async () => {
    const stepFields = steps[currentStep].fields;
    // For document step (step 3), no form validation needed
    if (currentStep === 3) {
      if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
      return;
    }
    const valid = await form.trigger(stepFields as any, { shouldFocus: true });
    if (!valid) return;
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  // Document upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const newDoc: PendingDocument = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        documentType: "identity_document", // Default type
        status: "pending",
      };
      setPendingDocuments((prev) => [...prev, newDoc]);
    });

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateDocumentType = (
    docId: string,
    documentType: PolicyDocumentType
  ) => {
    setPendingDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, documentType } : doc))
    );
  };

  const removeDocument = (docId: string) => {
    setPendingDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  const uploadDocument = async (doc: PendingDocument) => {
    setPendingDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: "uploading" } : d))
    );

    try {
      const formData = new FormData();
      formData.append("file", doc.file);
      formData.append("document_type", doc.documentType);

      // TODO: Replace with actual upload endpoint
      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      setPendingDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...d, status: "uploaded", uploadedPath: result.path }
            : d
        )
      );
    } catch (error) {
      setPendingDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...d, status: "error", error: "Upload failed" }
            : d
        )
      );
    }
  };

  // Relationship category handling (UI-only; not part of schema submission)
  const immediateRelationships = ["spouse", "child"] as const;
  // NOTE: Only parent & sibling are currently supported extended values in schema/DB.
  // Future values requested (cousin, in_laws, grandparent) require enum + DB migration.
  const extendedRelationships = [
    "parent",
    "sibling",
    "grandparent",
    "cousin",
    "in-law",
  ] as const;
  const [relationshipCategories, setRelationshipCategories] = useState<
    Record<string, "immediate" | "extended">
  >({});

  // Auto-populate branch code when bank is selected
  useEffect(() => {
    const selectedBankName = form.watch("bank_name");
    const selectedBank = southAfricanBanks.find(
      (bank) => bank.name === selectedBankName
    );

    if (selectedBank && form.getValues("branch_code") !== selectedBank.code) {
      form.setValue("branch_code", selectedBank.code);
    }
  }, [form.watch("bank_name"), form]);

  const onSubmit = (values: FuneralForm) => {
    console.log("onSubmit called with values:", values);
    console.log("isPending:", isPending);
    console.log("state:", state);

    const fd = new FormData();

    // Handle basic fields
    Object.entries(values).forEach(([k, v]) => {
      if (k === "beneficiaries") {
        // Handle beneficiaries separately
        fd.append(k, JSON.stringify(v));
      } else if (typeof v === "boolean") {
        fd.append(k, v ? "true" : "false");
      } else if (typeof v === "number" && Number.isFinite(v)) {
        fd.append(k, String(v));
      } else if (typeof v === "string" && v !== "") {
        fd.append(k, v);
      } else if (v !== undefined && v !== null) {
        fd.append(k, String(v));
      }
    });

    // Add pending documents information
    const documentsToProcess = pendingDocuments
      .filter((doc) => doc.status === "uploaded" && doc.uploadedPath)
      .map((doc) => ({
        document_type: doc.documentType,
        file_path: doc.uploadedPath,
        file_name: doc.file.name,
      }));

    fd.append("pending_documents", JSON.stringify(documentsToProcess));

    console.log("FormData entries:", Array.from(fd.entries()));
    console.log("Starting transition...");

    startTransition(() => {
      console.log("Inside transition, calling formAction...");
      formAction(fd);
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Funeral Policy Application</h1>
        <p className="text-muted-foreground">
          Step {currentStep + 1} of {totalSteps}: {steps[currentStep].title}
        </p>
        <div className="w-full bg-muted h-2 rounded overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div>
        <div className="space-y-4">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get comprehensive funeral cover for you and your family. Calculate
            your premium first to see what your monthly costs would be.
          </p>
          <FuneralPremiumCalculatorDialog />
        </div>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {state.message}
            {state.details && (
              <div className="mt-2 text-sm">{state.details}</div>
            )}
          </AlertDescription>
        </Alert>
      )}
      {!state?.error && state?.message && !isPending && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✅ {state.message} Redirecting to home page...
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Step Content */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Coverage Selection</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <FormField
                    control={form.control}
                    name="coverage_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coverage Amount</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            value={field.value?.toString() || ""}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select coverage amount" />
                            </SelectTrigger>
                            <SelectContent>
                              {coverageAmounts.map((amount) => (
                                <SelectItem
                                  key={amount}
                                  value={amount.toString()}
                                >
                                  R{amount.toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="product_type"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        {/* <FormLabel>First Name</FormLabel> */}
                        <FormControl>
                          <Input
                            {...field}
                            value="funeral_policy"
                            placeholder="Enter first name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter first name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter last name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="id_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter SA ID number"
                            maxLength={13}
                            onChange={(e) => {
                              field.onChange(e);
                              const dob = extractDateOfBirthFromSAID(
                                e.target.value
                              );
                              if (dob) form.setValue("date_of_birth", dob);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            readOnly
                            className="bg-muted"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Start Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            placeholder="Select start date"
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter phone" />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            placeholder="name@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Address Information</CardTitle>
                </CardHeader>
                <CardContent className="px-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="residential_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residential Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Street and suburb"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="City"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            maxLength={4}
                            placeholder="0000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employment_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Type</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select employment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employed">
                                Permanent
                              </SelectItem>
                              <SelectItem value="self_employed">
                                Self Employed
                              </SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
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
                  />
                  {(form.watch("employment_type") === "contract" ||
                    form.watch("employment_type") === "retired") && (
                    <FormField
                      control={form.control}
                      name="employment_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Contract End Date/Retirement Date
                          </FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="employer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Employer name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Job title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthly_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? 0 : Number(value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employer_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Employer address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employer_contact_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer Contact</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Contact number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Banking Details</CardTitle>
              </CardHeader>
              <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="account_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Holder Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Account holder name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your bank" />
                          </SelectTrigger>
                          <SelectContent>
                            {southAfricanBanks.map((bank) => (
                              <SelectItem key={bank.name} value={bank.name}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Account number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branch_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Auto-filled based on bank selection"
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="transaction">
                              Transaction
                            </SelectItem>
                            <SelectItem value="current">
                              Current/Cheque
                            </SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Payment Method</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debit_order">
                              Debit Order
                            </SelectItem>
                            <SelectItem value="cash_deposit">
                              Cash Deposit
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Payment Date</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString() || ""}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select payment date" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="28">28th</SelectItem>
                            <SelectItem value="27">27th</SelectItem>
                            <SelectItem value="26">26th</SelectItem>
                            <SelectItem value="25">25th</SelectItem>
                            <SelectItem value="24">24th</SelectItem>
                            <SelectItem value="23">23rd</SelectItem>
                            <SelectItem value="22">22nd</SelectItem>
                            <SelectItem value="21">21st</SelectItem>
                            <SelectItem value="20">20th</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Supporting Documents</CardTitle>
                <p className="text-muted-foreground">
                  Upload required documents to support your application. All
                  documents will be securely stored and processed.
                </p>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your files here, or click to browse
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: PDF, JPG, PNG • Max size: 10MB per file
                  </p>
                </div>

                {/* Uploaded Documents List */}
                {pendingDocuments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">
                      Selected Documents ({pendingDocuments.length})
                    </h4>
                    {pendingDocuments.map((doc) => (
                      <Card key={doc.id} className="p-4">
                        <div className="flex items-start  gap-x-4">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {doc.file.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <div className="mt-2">
                              <Select
                                value={doc.documentType}
                                onValueChange={(value) =>
                                  updateDocumentType(
                                    doc.id,
                                    value as PolicyDocumentType
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(POLICY_DOCUMENT_TYPES).map(
                                    ([key, label]) => (
                                      <SelectItem key={key} value={key}>
                                        {label}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-center gap-x-2">
                            {doc.status === "pending" && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => uploadDocument(doc)}
                              >
                                Upload
                              </Button>
                            )}
                            {doc.status === "uploading" && (
                              <Button size="sm" disabled>
                                Uploading...
                              </Button>
                            )}
                            {doc.status === "uploaded" && (
                              <Badge variant="default" className="bg-green-500">
                                Uploaded
                              </Badge>
                            )}
                            {doc.status === "error" && (
                              <Badge variant="destructive">Error</Badge>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(doc.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {doc.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertDescription>{doc.error}</AlertDescription>
                          </Alert>
                        )}
                      </Card>
                    ))}
                  </div>
                )}

                {/* Document Requirements */}
                <div className="bg-muted/50 rounded-lg p-4 text-xs">
                  <h4 className="font-medium mb-2">Required Documents</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p>Identity Documents Accepted</p>
                      <ul className="list-disc list-inside">
                        <li>South African ID</li>
                        <li>Passport</li>
                        <li>Driver's License</li>
                        <li>Birth Certificate</li>
                      </ul>
                    </div>

                    <div>
                      <p>Proof of Banking</p>
                      <ul className="list-disc list-inside">
                        <li>Bank Letter</li>
                        <li>Bank Statement</li>
                      </ul>
                    </div>
                    <div>
                      <p>Proof of Employment</p>
                      <ul className="list-disc list-inside">
                        <li>Recent Pay Slip</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                  <CardTitle>
                    {fields.length > 1 ? `Covered Persons ` : "Covered Person"}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          first_name: "",
                          last_name: "",
                          id_number: "",
                          relationship: undefined as any,
                          percentage: 0,
                        })
                      }
                      disabled={fields.length >= 10}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Beneficiary
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">
                          Covered Person {index + 1}
                        </h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.first_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="First name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.last_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Last name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.id_number`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="SA ID number"
                                  maxLength={13}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`beneficiaries.${index}.relationship`}
                          render={({ field }) => (
                            <FormItem className="col-span-full md:col-span-1">
                              <FormLabel>Relationship</FormLabel>
                              <div className="space-y-3">
                                <RadioGroup
                                  className="flex flex-row gap-6"
                                  value={
                                    relationshipCategories[field.name] ||
                                    (field.value &&
                                    (
                                      immediateRelationships as readonly string[]
                                    ).includes(field.value)
                                      ? "immediate"
                                      : "extended")
                                  }
                                  onValueChange={(
                                    val: "immediate" | "extended"
                                  ) => {
                                    setRelationshipCategories((prev) => ({
                                      ...prev,
                                      [field.name]: val,
                                    }));
                                    const current = field.value as
                                      | string
                                      | undefined;
                                    if (
                                      val === "immediate" &&
                                      (!current ||
                                        !(
                                          immediateRelationships as readonly string[]
                                        ).includes(current))
                                    ) {
                                      field.onChange("spouse");
                                    } else if (
                                      val === "extended" &&
                                      (!current ||
                                        !(
                                          extendedRelationships as readonly string[]
                                        ).includes(current))
                                    ) {
                                      field.onChange("parent");
                                    }
                                  }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="immediate"
                                      id={`immediate-${index}`}
                                    />
                                    <label
                                      htmlFor={`immediate-${index}`}
                                      className="text-sm font-medium leading-none"
                                    >
                                      Immediate
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="extended"
                                      id={`extended-${index}`}
                                    />
                                    <label
                                      htmlFor={`extended-${index}`}
                                      className="text-sm font-medium leading-none"
                                    >
                                      Extended
                                    </label>
                                  </div>
                                </RadioGroup>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ""}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select relationship" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(relationshipCategories[field.name] ||
                                      (field.value &&
                                      (
                                        immediateRelationships as readonly string[]
                                      ).includes(field.value)
                                        ? "immediate"
                                        : "extended")) === "immediate" ? (
                                      <>
                                        {immediateRelationships.map((r) => (
                                          <SelectItem key={r} value={r}>
                                            {r.charAt(0).toUpperCase() +
                                              r.slice(1).replace("_", " ")}
                                          </SelectItem>
                                        ))}
                                      </>
                                    ) : (
                                      <>
                                        {extendedRelationships.map((r) => (
                                          <SelectItem key={r} value={r}>
                                            {r.charAt(0).toUpperCase() +
                                              r.slice(1).replace("_", " ")}
                                          </SelectItem>
                                        ))}
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
              <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="terms_and_conditions"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <FormLabel className="!m-0">
                        I agree to the Terms & Conditions
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="privacy_policy"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <FormLabel className="!m-0">
                        I agree to the Privacy Policy
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-between pt-4">
            <div>
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isPending}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex-1" />

            {currentStep < totalSteps - 1 && (
              <Button type="button" onClick={goNext} disabled={isPending}>
                Next
              </Button>
            )}
            {currentStep === totalSteps - 1 && (
              <Button
                type="submit"
                size="lg"
                disabled={isPending || (!state?.error && !!state?.message)}
                className="min-w-[180px]"
                onClick={(e) => {
                  console.log("Submit button clicked!", e);
                  console.log("Form valid?", form.formState.isValid);
                  console.log("Form errors:", form.formState.errors);
                }}
              >
                {isPending
                  ? "Submitting..."
                  : !state?.error && state?.message
                    ? "✅ Submitted!"
                    : "Submit Application"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
