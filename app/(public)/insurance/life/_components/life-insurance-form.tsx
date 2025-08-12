"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { lifeInsuranceLeadSchemaWithRefines } from "@/lib/schemas";
import { createLifeInsurancePolicy } from "@/lib/actions/life-insurance";
import { useActionState, useTransition } from "react";
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
import { Trash2, Plus } from "lucide-react";

type LifeForm = z.infer<typeof lifeInsuranceLeadSchemaWithRefines>;

type ActionState = {
  error?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  details?: string;
};

export default function LifeInsuranceForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createLifeInsurancePolicy as any,
    {}
  );
  const [isPending, startTransition] = useTransition();
  // Products are provided from the server component
  const loading = false;

  const form = useForm<LifeForm>({
    resolver: zodResolver(lifeInsuranceLeadSchemaWithRefines),
    defaultValues: {
      first_name: "",
      last_name: "",
      id_number: "",
      date_of_birth: "",
      phone_number: "",
      email: "",
      product_type: "life_insurance" as const,
      residential_address: "",
      city: "",
      postal_code: "",
      account_name: "",
      bank_name: "",
      account_number: "",
      branch_code: "",
      account_type: undefined as any,
      beneficiaries: Array.from({ length: 5 }, () => ({
        first_name: "",
        last_name: "",
        id_number: "",
        relationship: undefined as any,
        percentage: 20, // Start with equal distribution
        phone_number: "",
        email: "",
      })),
      terms_and_conditions: false,
      privacy_policy: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "beneficiaries",
  });

  const onSubmit = (values: LifeForm) => {
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

  // Calculate total percentage for validation display
  const totalPercentage =
    form
      .watch("beneficiaries")
      ?.reduce((sum, b) => sum + (b.percentage || 0), 0) || 0;

  // date_of_birth is derived from id_number on input change (no useEffect needed)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {(() => {
        /* preload product types */ return null;
      })()}

      <div className="text-center">
        <h1 className="text-3xl font-bold">Life Insurance Application</h1>
        <p className="text-muted-foreground mt-2">
          Provide your details and we'll contact you to complete your policy.
        </p>
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

      {!state?.error && state?.message && (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6 grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="product_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="funeral_policy">
                          Funeral Policy
                        </SelectItem>
                        <SelectItem value="life_insurance">
                          Life Insurance
                        </SelectItem>
                        <SelectItem value="payday_loan">Payday Loan</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          {/* Personal Information */}
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
                          if (dob) {
                            form.setValue("date_of_birth", dob);
                          }
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

          {/* Address Information */}
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
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        onChange={field.onChange}
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
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        onChange={field.onChange}
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
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        onChange={field.onChange}
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

          {/* Banking Details */}
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
                    <FormLabel>Account Name</FormLabel>
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
                      <Input {...field} placeholder="Bank name" />
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
                        placeholder="Branch code"
                        maxLength={6}
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
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="transaction">
                            Transaction
                          </SelectItem>
                          <SelectItem value="current">Current</SelectItem>
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

          {/* Beneficiaries */}
          <Card className="p-6">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Beneficiaries ({fields.length})</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Total: {totalPercentage}%
                  {totalPercentage !== 100 && (
                    <span className="text-destructive ml-2">
                      (Must equal 100%)
                    </span>
                  )}
                </p>
              </div>
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
                  <Plus className="h-4 w-4 mr-2" />
                  Add Beneficiary
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Beneficiary {index + 1}</h4>
                    {fields.length > 5 && (
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
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`beneficiaries.${index}.percentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percentage (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              max="100"
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              placeholder="Percentage"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                </Card>
              ))}
              {fields.length < 5 && (
                <p className="text-sm text-muted-foreground">
                  Please add at least 5 beneficiaries.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
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

          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full max-w-md"
            >
              {isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
