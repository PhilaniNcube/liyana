"use client";

import React, { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryState, parseAsInteger } from "nuqs";
import FuneralCoverCalculator, {
  type ICalculationParams,
} from "@/lib/utils/funeralcover-calculator";
import { FUNERAL_RATE_DATA } from "@/lib/data/funeral-rates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calculator, Users, DollarSign } from "lucide-react";

// Schema for the calculator form
const calculatorSchema = z.object({
  mainMemberAge: z
    .number()
    .min(18, "Main member must be at least 18 years old")
    .max(100, "Maximum age is 100"),
  coverAmount: z.union([
    z.literal(5000),
    z.literal(10000),
    z.literal(15000),
  ]),
  additionalMembers: z
    .array(
      z.object({
        relationship: z.enum(["spouse", "child", "extended"] as const),
        specificRelationship: z.string().optional(), // For extended family specific relationships
        age: z.number().optional(),
      })
    )
    .optional(),
});

type CalculatorFormData = z.infer<typeof calculatorSchema>;

interface PremiumResult {
  mainPolicyPremium: number;
  extendedFamilyPremium: number;
  totalPremium: number;
  benefitOptionUsed: string;
  breakdown: {
    mainMember: { age: number; coverAmount: number; premium: number };
    immediateFamily: Array<{
      relationship: string;
      age: number;
      coverAmount: number;
      premium: number;
    }>;
    extendedFamily: Array<{
      age: number;
      coverAmount: number;
      premium: number;
    }>;
  };
}

export default function FuneralPremiumCalculator() {
  const [premiumResult, setPremiumResult] = useState<PremiumResult | null>(
    null
  );
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // URL state management for cover amount
  const [coverAmountFromUrl, setCoverAmountInUrl] = useQueryState(
    "coverAmount",
    parseAsInteger.withDefault(10000)
  );

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      mainMemberAge: 35,
      coverAmount: (coverAmountFromUrl === 5000 || coverAmountFromUrl === 10000 || coverAmountFromUrl === 15000) ? coverAmountFromUrl : 10000,
      additionalMembers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalMembers",
  });

  // Watch form values for dynamic updates
  const watchedMembers = form.watch("additionalMembers");

  const calculator = new FuneralCoverCalculator(FUNERAL_RATE_DATA);

  const calculatePremium = (data: CalculatorFormData) => {
    try {
      setCalculationError(null);

      // Prepare calculation parameters
      const calculationParams: ICalculationParams = {
        mainMemberAge: data.mainMemberAge,
        coverAmount: data.coverAmount,
        additionalMembers:
          data.additionalMembers?.map((member) => ({
            relationship: member.relationship,
            age: member.relationship === "extended" ? member.age : undefined,
          })) || [],
      };

      const result = calculator.calculateTotalPremium(calculationParams);
      setPremiumResult(result);

      // Scroll to results after a short delay to allow DOM update
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      setCalculationError((error as Error).message);
      setPremiumResult(null);

      // Scroll to error section
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  const onSubmit = (data: CalculatorFormData) => {
    calculatePremium(data);
  };

  const addFamilyMember = (type: "immediate" | "extended") => {
    if (type === "immediate") {
      append({ relationship: "spouse" }); // Default to spouse, user can change
    } else {
      append({
        relationship: "extended",
        specificRelationship: "sister",
        age: 25,
      }); // Default values
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6 w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Member Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mainMemberAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your age"
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value) || 0);
                        setCoverAmountInUrl(parseInt(e.target.value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Amount</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const intValue = parseInt(value);
                      field.onChange(intValue);
                      setCoverAmountInUrl(intValue);
                    }}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cover amount" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5000">R5,000</SelectItem>
                      <SelectItem value="10000">R10,000</SelectItem>
                      <SelectItem value="15000">R15,000</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Family Members */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Family Members
            </h3>
            <div className="flex  items-center justify-between">
              <div className="flex flex-col md:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFamilyMember("immediate")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Immediate Family Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFamilyMember("extended")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Extended Family
                </Button>
              </div>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No additional family members added yet.</p>
                <p className="text-sm">
                  Use the buttons above to add family members to your policy.
                </p>
              </div>
            )}

            {fields.map((field, index) => {
              const watchedMember = watchedMembers?.[index];
              const currentRelationship =
                watchedMember?.relationship || field.relationship;
              const currentSpecificRelationship =
                watchedMember?.specificRelationship ||
                field.specificRelationship;

              return (
                <Card key={field.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="capitalize">
                      {currentRelationship === "extended"
                        ? currentSpecificRelationship || "Extended Family"
                        : currentRelationship}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`additionalMembers.${index}.relationship`}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>Relationship Type</FormLabel>
                          <Select
                            onValueChange={formField.onChange}
                            defaultValue={formField.value}
                          >
                            <FormControl>
                              <SelectTrigger className="capitalize w-full">
                                <SelectValue placeholder="Select relationship type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currentRelationship === "extended" ? (
                                <>
                                  <SelectItem value="extended">
                                    Extended Family
                                  </SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="child">Child</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {currentRelationship === "extended" && (
                      <FormField
                        control={form.control}
                        name={`additionalMembers.${index}.specificRelationship`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>Specific Relationship</FormLabel>
                            <Select
                              onValueChange={formField.onChange}
                              defaultValue={formField.value}
                            >
                              <FormControl>
                                <SelectTrigger className="capitalize w-full">
                                  <SelectValue placeholder="Select specific relationship" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sister">Sister</SelectItem>
                                <SelectItem value="brother">Brother</SelectItem>
                                <SelectItem value="grandparent">
                                  Grandparent
                                </SelectItem>
                                <SelectItem value="cousin">Cousin</SelectItem>
                                <SelectItem value="in-laws">In-laws</SelectItem>
                                <SelectItem value="uncle">Uncle</SelectItem>
                                <SelectItem value="aunt">Aunt</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {currentRelationship === "extended" && (
                      <FormField
                        control={form.control}
                        name={`additionalMembers.${index}.age`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>
                              Age (Required for Extended Family)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter age"
                                {...formField}
                                onChange={(e) =>
                                  formField.onChange(
                                    parseInt(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {(currentRelationship === "spouse" ||
                      currentRelationship === "child") && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div>
                          <span>
                            Age not required - covered under main policy
                            regardless of age
                            {currentRelationship === "child" &&
                              " (up to 6 children allowed)"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <Button type="submit" className="w-full  max-w-lg mx-auto">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Premium
          </Button>
        </form>
      </Form>

      {/* Results Section - This is where we scroll to */}
      <div ref={resultsRef}>
        {/* Calculation Error */}
        {calculationError && (
          <Alert variant="destructive">
            <AlertDescription>{calculationError}</AlertDescription>
          </Alert>
        )}

        {/* Premium Results */}
        {premiumResult && (
          <Card className="bg-green-50 w-full border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <p className="text-4xl font-mono">R</p>
                Your Premium Calculation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    Main Policy
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(premiumResult.mainPolicyPremium)}
                  </p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>

                {premiumResult.extendedFamilyPremium > 0 && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Extended Family
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(premiumResult.extendedFamilyPremium)}
                    </p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Premium
                  </p>
                  <p className="text-3xl font-bold text-green-800">
                    {formatCurrency(premiumResult.totalPremium)}
                  </p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">
                  Benefit Option: {premiumResult.benefitOptionUsed}
                </h4>

                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Main Member:</strong> Age{" "}
                    {premiumResult.breakdown.mainMember.age}, Cover{" "}
                    {formatCurrency(
                      premiumResult.breakdown.mainMember.coverAmount
                    )}
                  </div>

                  {premiumResult.breakdown.immediateFamily.length > 0 && (
                    <div>
                      <strong>
                        Immediate Family (
                        {premiumResult.breakdown.immediateFamily.length}):
                      </strong>
                      <ul className="ml-4 list-disc">
                        {premiumResult.breakdown.immediateFamily.map(
                          (member, index) => (
                            <li key={index} className="capitalize">
                              {member.relationship} - Cover{" "}
                              {formatCurrency(member.coverAmount)}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {premiumResult.breakdown.extendedFamily.length > 0 && (
                    <div>
                      <strong>
                        Extended Family (
                        {premiumResult.breakdown.extendedFamily.length}):
                      </strong>
                      <ul className="ml-4 list-disc">
                        {premiumResult.breakdown.extendedFamily.map(
                          (member, index) => (
                            <li key={index}>
                              Age {member.age} - Cover{" "}
                              {formatCurrency(member.coverAmount)}(
                              {formatCurrency(member.premium)}/month)
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  This is an estimate based on current rates. Final premium may
                  vary based on underwriting and additional factors.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
