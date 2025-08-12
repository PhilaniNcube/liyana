"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { lifeInsuranceLeadSchema } from "@/lib/schemas";
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
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractDateOfBirthFromSAID } from "@/lib/utils/sa-id";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LifeForm = z.infer<typeof lifeInsuranceLeadSchema>;

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
    resolver: zodResolver(lifeInsuranceLeadSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      id_number: "",
      date_of_birth: "",
      phone_number: "",
      email: "",
      product_type: undefined as any,
      residential_address: "",
      city: "",
      postal_code: "",
      terms_and_conditions: false,
      privacy_policy: false,
    },
  });

  const onSubmit = (values: LifeForm) => {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (typeof v === "boolean") {
        fd.append(k, v ? "true" : "false");
      } else if (typeof v === "number" && Number.isFinite(v)) {
        fd.append(k, String(v));
      } else if (typeof v === "string" && v !== "") {
        fd.append(k, v);
      }
    });
    startTransition(() => formAction(fd));
  };

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
                      onValueChange={(val) => field.onChange(val)}
                      value={field.value}
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
          <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      maxLength={13}
                      placeholder="13-digit SA ID"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);
                        const dob = extractDateOfBirthFromSAID(value);
                        form.setValue("date_of_birth", dob ?? "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
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
                    <Input type="date" {...field} />
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
          </Card>

          <Card className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      value={field.value ?? ""}
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
                      value={field.value ?? ""}
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
                      value={field.value ?? ""}
                      maxLength={4}
                      placeholder="0000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
