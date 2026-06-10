"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryState, parseAsInteger } from "nuqs";
import { funeralPolicyLeadSchemaWithRefines } from "@/lib/schemas";
import { createFuneralPolicy } from "@/lib/actions/funeral-policy";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { Trash2, Plus, Upload, FileText, X, Check } from "lucide-react";
import { z } from "zod";
import FuneralPremiumCalculatorDialog from "./funeral-premium-calculator-dialog";
import { FUNERAL_PACKAGES, type FuneralPackage, type FuneralPackageId } from "@/lib/data/funeral-rates";
import { cn } from "@/lib/utils";

// South African banks with their branch codes
const southAfricanBanks = [
  { name: "ABSA Bank", code: "632005" },
  { name: "African Bank", code: "430000" },
  { name: "Bidvest Bank", code: "462005" },
  { name: "Capitec Bank", code: "470010" },
  { name: "Discovery Bank", code: "679000" },
  { name: "FNB (First National Bank)", code: "250655" },
  { name: "Grindrod Bank", code: "584000" },
  { name: "Investec Bank", code: "580105" },
  { name: "Nedbank", code: "198765" },
  { name: "Standard Bank", code: "051001" },
  { name: "Surecard", code: "410105" },
  { name: "TymeBank", code: "678910" },
  { name: "Ubank", code: "431010" },
  { name: "VBS Mutual Bank", code: "588000" },
] as const;

// Valid coverage amounts based on packages
const validCoverageAmounts = FUNERAL_PACKAGES.map((pkg) => pkg.cover.principalMember);

// Policy document types available for upload
const POLICY_DOCUMENT_TYPES = {
  death_certificate: "Death Certificate",
  // marriage_certificate: "Marriage Certificate",
  identity_document: "South African ID",
  proof_of_address: "Proof of Address",
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

// Helper function to find the closest valid coverage amount
const findClosestCoverageAmount = (targetAmount: number): number => {
  return validCoverageAmounts.reduce((prev, curr) =>
    Math.abs(curr - targetAmount) < Math.abs(prev - targetAmount) ? curr : prev
  );
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);

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
    resolver: zodResolver(funeralPolicyLeadSchemaWithRefines) as any,
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
      start_date: new Date().toISOString().split("T")[0],
      phone_number: "",
      email: "",
      // Step 1: address + employment
      residential_address: "",
      city: "",
      postal_code: "",
      employment_type: undefined as any,
      // Step 2: banking
      account_name: "",
      bank_name: "",
      account_number: "",
      branch_code: "",
      account_type: undefined as any,
      payment_date: undefined as any,
      mandate_accepted: false,
      signature_name: "",
      signature_date: "",
      signature_svg: "",
      // Step 4: dependants + declarations
      beneficiaries: [],
      terms_and_conditions: false,
      privacy_policy: false,
      beneficiary_name: "",
      beneficiary_dob_or_id: "",
      beneficiary_relationship: "",
      beneficiary_phone: "",
    },
  });

  // Signature method (drawing or typing)
  const [sigMethod, setSigMethod] = useState<"draw" | "type">("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Auto-populate signature date to today's date
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    form.setValue("signature_date", today);
  }, [form]);

  // Drawing pad logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (e.cancelable) e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      form.setValue("signature_svg", dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    form.setValue("signature_svg", "");
  };

  const handleTypedSignatureChange = (name: string) => {
    form.setValue("signature_name", name);
    if (name.trim()) {
      // Create SVG data URL
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80">
        <text x="15" y="50" font-family="cursive, 'Brush Script MT', 'Dancing Script'" font-size="32" font-style="italic" fill="#1e3b8b">${name}</text>
        <line x1="10" y1="65" x2="290" y2="65" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4" />
      </svg>`;
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
      form.setValue("signature_svg", dataUrl);
    } else {
      form.setValue("signature_svg", "");
    }
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "beneficiaries",
  });

  // Derive selected package from coverage amount
  const watchedCoverageAmount = form.watch("coverage_amount");
  const selectedPackage = FUNERAL_PACKAGES.find(
    (pkg) => pkg.cover.principalMember === watchedCoverageAmount
  ) ?? null;

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
          "payment_date",
          "mandate_accepted",
          "signature_name",
          "signature_date",
          "signature_svg",
        ],
      },
      {
        title: "Documents",
        description: "Upload supporting documents",
        fields: [], // No form fields, just document uploads
      },
      {
        title: "Beneficiary & Dependants",
        description: "Beneficiary, optional dependants & declarations",
        fields: [
          "beneficiaries",
          "beneficiary_name",
          "beneficiary_dob_or_id",
          "beneficiary_relationship",
          "beneficiary_phone",
          "terms_and_conditions",
          "privacy_policy",
        ],
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

  // Dependants are optional - no auto-initialization needed

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
                  <CardTitle>Select Your Funeral Plan</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <FormField
                    control={form.control}
                    name="coverage_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose a Package</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {FUNERAL_PACKAGES.map((pkg) => (
                            <Card
                              key={pkg.id}
                              className={cn(
                                "cursor-pointer transition-all hover:shadow-md relative p-4",
                                field.value === pkg.cover.principalMember &&
                                "ring-2 ring-green-600 shadow-md"
                              )}
                              onClick={() => {
                                field.onChange(pkg.cover.principalMember);
                                setCoverageAmountInUrl(pkg.cover.principalMember);
                              }}
                            >
                              {field.value === pkg.cover.principalMember && (
                                <div className="absolute top-3 right-3">
                                  <Check className="h-5 w-5 text-green-600" />
                                </div>
                              )}
                              <Badge
                                variant={pkg.type === "family" ? "secondary" : "outline"}
                                className="mb-2"
                              >
                                {pkg.type === "family" ? "Family" : "Single Member"}
                              </Badge>
                              <p className="font-semibold text-sm">{pkg.name}</p>
                              <p className="text-xl font-bold text-green-700">
                                {formatCurrency(pkg.monthlyPremium)}
                                <span className="text-xs font-normal text-muted-foreground">/month</span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Principal cover: {formatCurrency(pkg.cover.principalMember)}
                              </p>
                            </Card>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Personal Information <small className="text-muted-foreground">(Person to be insured)</small></CardTitle>
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
                        <FormLabel>Application Date</FormLabel>
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
                              <SelectItem value="sassa_old_age_grant">
                                SASSA Old Age Grant
                              </SelectItem>
                              <SelectItem value="sassa_disability_grant">
                                SASSA Disability Grant
                              </SelectItem>
                              <SelectItem value="sassa_child_grant">
                                SASSA Child Grant
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
            <>
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
                            {Array.from({ length: 31 }, (_, i) => {
                              const day = i + 1;
                              const suffix = [1, 21, 31].includes(day) ? "st" :
                                             [2, 22].includes(day) ? "nd" :
                                             [3, 23].includes(day) ? "rd" : "th";
                              return (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}{suffix}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Authority & Mandate Card */}
            <Card className="p-6 mt-6 border-slate-200 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-bold text-slate-800">
                  Authority & Mandate for Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                {/* Scrollable Mandate Text */}
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-4 bg-slate-50/50 text-xs leading-relaxed text-slate-600 whitespace-pre-line font-sans shadow-inner">
                  {`SIGNATURE FOR AUTHORITY AND MANDATE FOR PAYMENT INSTRUCTIONS:

I / We hereby authorise Clientèle Life Assurance Company Limited or any of its legal representatives / agents (hereafter referred to as "you") to issue and deliver payment instructions to your banker for collection against my/our above mentioned account at my/our bank (or any other bank to which I/we may transfer my/our account) on condition that the sum of such payment instructions will never exceed my/our obligations as agreed to in the agreement and commencing on and continuing until this authority and mandate is terminated by me / us by giving you one calendar month's written notice.`}
                  {" "}
                  <span className="font-bold text-slate-900 bg-yellow-50 px-1.5 py-0.5 border border-yellow-100 rounded">
                    {`The individual payment instructions so authorised to be issued must be issued and delivered monthly (on the ${
                      form.watch("payment_date") 
                        ? `${form.watch("payment_date")}${
                            [1, 21, 31].includes(Number(form.watch("payment_date"))) ? 'st' :
                            [2, 22].includes(Number(form.watch("payment_date"))) ? 'nd' :
                            [3, 23].includes(Number(form.watch("payment_date"))) ? 'rd' : 'th'
                          }` 
                        : "__________"
                    } day of every month).`}
                  </span>
                  {" "}
                  {`In the event that the payment day falls on a Sunday, or recognised SA public holiday, the payment day will automatically be the previous ordinary business day.

I / We understand that the withdrawals hereby authorised will be processed through a computerised system provided by the SA Banks. I also understand that details of each withdrawal will be printed on my bank statement (INLIFEWIZE). I / We acknowledge that all payment instructions issued by you shall be treated by my/our below mentioned bank as if the instructions have been issued by me/us personally. I / We agree that although this authority and mandate may be cancelled by me / us, such cancellation will not cancel the agreement. I / We shall not be entitled to any refund of amounts which you have withdrawn while this authority was in force, if such amounts were legally owing to you.

I / We acknowledge that this authority may be ceded or assigned to a 3rd party if the agreement is also ceded or assigned to that 3rd party, but in the absence of such assignment of the agreement, this authority and mandate cannot be assigned to any 3rd party. I agree that it is my responsibility to ensure that all of my premiums, with regards to my Lifewize funeral policy, are paid up to date and that I will not hold Lifewize liable in any event, arising out of my premiums being unpaid.

I acknowledge that this electronic acceptance, including confirmation digital signature, online checkbox, or electronic communication, constitutes my valid and legally binding consent in terms of the Electronic Communications and Transactions Act, 25 of 2002.`}
                </div>

                {/* Accept Checkbox */}
                <FormField
                  control={form.control}
                  name="mandate_accepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-slate-200 p-4 bg-slate-50/20 hover:bg-slate-50/50 transition-colors">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4.5 w-4.5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-semibold text-slate-800 cursor-pointer">
                          I / We accept the Authority and Mandate for Payment Instructions
                        </FormLabel>
                        <p className="text-xs text-slate-500">
                          By checking this box, you confirm your legally binding consent to the terms of the mandate.
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Signature Interaction Panel */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  {/* Panel Tabs Header */}
                  <div className="flex border-b border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => {
                        setSigMethod("draw");
                        form.setValue("signature_svg", "");
                      }}
                      className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                        sigMethod === "draw"
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      Draw Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSigMethod("type");
                        form.setValue("signature_svg", "");
                        const currentName = form.getValues("first_name") + " " + form.getValues("last_name");
                        if (currentName.trim()) {
                          handleTypedSignatureChange(currentName);
                        }
                      }}
                      className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
                        sigMethod === "type"
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      Type Signature
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Canvas/Drawing Area */}
                    {sigMethod === "draw" && (
                      <div className="space-y-3">
                        <div className="relative border border-dashed border-slate-300 rounded-lg bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden h-[152px]">
                          {!form.watch("signature_svg") && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-slate-400">
                              <span className="text-xs uppercase tracking-wider font-semibold">Sign Here</span>
                              <span className="text-[10px] text-slate-400 mt-1">Use your mouse or touch screen</span>
                            </div>
                          )}
                          <canvas
                            ref={canvasRef}
                            width={500}
                            height={150}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full max-w-[500px] h-[150px] cursor-crosshair touch-none bg-transparent block"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearCanvas}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-800"
                          >
                            Clear Signature
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Typed Script Area */}
                    {sigMethod === "type" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium text-slate-700">Enter Your Full Name</FormLabel>
                          <Input
                            type="text"
                            value={form.watch("signature_name") || ""}
                            onChange={(e) => handleTypedSignatureChange(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full"
                          />
                        </div>

                        {form.watch("signature_name") && (
                          <div className="border border-dashed border-slate-300 rounded-lg p-6 bg-slate-50/30 flex items-center justify-center h-[120px]">
                            <div 
                              style={{ fontFamily: "cursive, 'Brush Script MT', 'Dancing Script'" }}
                              className="text-4xl text-blue-800 italic select-none tracking-wide text-center"
                            >
                              {form.watch("signature_name")}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hidden Signature input to trigger validations */}
                    <FormField
                      control={form.control}
                      name="signature_svg"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <input type="hidden" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Info & Date Block */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 pt-4 gap-2 text-xs text-slate-500">
                      <div>
                        <span>Signed Date: </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {form.watch("signature_date") || new Date().toISOString().split("T")[0]}
                        </span>
                        <span className="ml-1 text-slate-400 font-normal">(Auto-populated)</span>
                      </div>
                      <div className="flex items-center text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                        Secure Electronic Acceptance
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p>Identity Documents Accepted</p>
                      <ul className="list-disc list-inside">
                        <li>South African ID</li>
                      </ul>
                    </div>

                    <div>
                      <p>Proof of Banking</p>
                      <ul className="list-disc list-inside">
                        <li>Bank Letter</li>
                        <li>Bank Statement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Policy Beneficiary Section */}
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Policy Beneficiary</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Specify the person who will receive the claim payout amount when the principal member is deceased. Required for all policies.
                  </p>
                </CardHeader>
                <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="beneficiary_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name & Surname</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Full name & surname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="beneficiary_dob_or_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth OR ID Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Date of birth or 13-digit ID number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="beneficiary_relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship to Principal Insured</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aunt">Aunt</SelectItem>
                              <SelectItem value="brother">Brother</SelectItem>
                              <SelectItem value="brother_in_law">Brother-in-law</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="cousin">Cousin</SelectItem>
                              <SelectItem value="ex_spouse">Ex-Spouse</SelectItem>
                              <SelectItem value="father">Father</SelectItem>
                              <SelectItem value="father_in_law">Father-in-law</SelectItem>
                              <SelectItem value="foster_child">Foster Child</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="grandchild">Grandchild</SelectItem>
                              <SelectItem value="grandmother">Grandmother</SelectItem>
                              <SelectItem value="grandfather">Grandfather</SelectItem>
                              <SelectItem value="mother">Mother</SelectItem>
                              <SelectItem value="mother_in_law">Mother-in-law</SelectItem>
                              <SelectItem value="nephew">Nephew</SelectItem>
                              <SelectItem value="niece">Niece</SelectItem>
                              <SelectItem value="sister">Sister</SelectItem>
                              <SelectItem value="sister_in_law">Sister-in-law</SelectItem>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="uncle">Uncle</SelectItem>
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
                    name="beneficiary_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cellphone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 0821234567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {selectedPackage?.id !== "ukuthula" && selectedPackage?.id !== "ilanga" && (
              <Card className="p-6">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                  <CardTitle>
                    Dependants <span className="text-sm font-normal text-muted-foreground">(optional)</span>
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
                      <Plus className="h-4 w-4 mr-2" /> Add Dependant
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No dependants added. You can optionally add dependants to this policy.
                    </p>
                  )}
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">
                          Dependant {index + 1}
                        </h4>
                        {fields.length >= 1 && (
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
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || ""}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="child">Child</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
              )}
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="terms_and_conditions"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          id="terms-checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <FormLabel className="!m-0 cursor-pointer text-sm">
                          I agree to the{" "}
                          <Link
                            href="/insurance/funeral/terms"
                            className="text-blue-600 underline hover:text-blue-800"
                            target="_blank"
                          >
                            Terms & Conditions
                          </Link>
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
                          id="privacy-checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <FormLabel className="!m-0 cursor-pointer text-sm">
                          I agree to the{" "}
                          <Link
                            href="/insurance/funeral/privacy"
                            className="text-blue-600 underline hover:text-blue-800"
                            target="_blank"
                          >
                            Privacy Policy
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 text-[10px] leading-relaxed text-muted-foreground border-t border-slate-100 pt-4 font-sans text-center md:text-left">
                  I acknowledge that this electronic acceptance, including confirmation
                  digital signature, online checkbox, or electronic communication,
                  constitutes my valid and legally binding consent in terms of the
                  Electronic Communications and Transactions Act, 25 of 2002.
                </div>
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

      {/* Clientele Life Logo and Disclaimer */}
      <div className="mt-12 flex flex-col items-center text-center border-t border-slate-200 pt-8">
     
        <p className="max-w-4xl text-[10px] leading-relaxed text-slate-500 mb-4">
          Funeral insurance products are underwritten by Clientèle Life Assurance Company Limited, a licensed life insurer
          and authorised Financial Services Provider (FSP No. 15268). Liyana Finance (Pty) Ltd is a juristic
          representative of Swift Underwriting Managers (Pty) Ltd, an authorised Financial Services Provider (FSP No.
          49285). Liyana Finance markets and distributes funeral insurance products on behalf of the authorised entities.
          No advice is provided. Terms and conditions apply.
        </p>
           <div className="my-4">
          <Image
            src="/images/clientele_life.webp"
            alt="Clientèle Logo"
            width={128}
            height={48}
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}
