"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractDateOfBirthFromSAID } from "@/lib/utils/sa-id";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus } from "lucide-react";
import { z } from "zod";

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

  const form = useForm<FuneralForm>({
    resolver: zodResolver(funeralPolicyLeadSchemaWithRefines),
    defaultValues: {
      // Step 0: product + personal
      product_type: "funeral_policy" as const,
      coverage_amount: 10000,
      first_name: "",
      last_name: "",
      id_number: "",
      date_of_birth: "",
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
      // Step 3: beneficiaries + declarations
      beneficiaries: [
        {
          first_name: "",
          last_name: "",
          id_number: "",
          relationship: undefined as any,
          percentage: 0,
          phone_number: "",
          email: "",
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
      ],
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
    const valid = await form.trigger(stepFields as any, { shouldFocus: true });
    if (!valid) return;
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
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

    startTransition(() => formAction(fd));
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
                              <SelectItem value="5000">R5,000</SelectItem>
                              <SelectItem value="10000">R10,000</SelectItem>
                              <SelectItem value="15000">R15,000</SelectItem>
                              <SelectItem value="20000">R20,000</SelectItem>
                              <SelectItem value="25000">R25,000</SelectItem>
                              <SelectItem value="30000">R30,000</SelectItem>
                              <SelectItem value="40000">R40,000</SelectItem>
                              <SelectItem value="50000">R50,000</SelectItem>
                              <SelectItem value="75000">R75,000</SelectItem>
                              <SelectItem value="100000">R100,000</SelectItem>
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
                              <SelectItem value="employed">Employed</SelectItem>
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
                        <FormLabel>Employer Address (Optional)</FormLabel>
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
                        <FormLabel>Employer Contact (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Contact number" />
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
                          <FormLabel>Employment End Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
                  <CardTitle>Beneficiaries ({fields.length})</CardTitle>
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
                          phone_number: "",
                          email: "",
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
                        <h4 className="font-medium">Beneficiary {index + 1}</h4>
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
                        <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`beneficiaries.${index}.phone_number`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Phone number"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`beneficiaries.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    type="email"
                                    placeholder="Email address"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
