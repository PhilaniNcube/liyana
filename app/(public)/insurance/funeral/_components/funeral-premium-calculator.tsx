"use client";

import React, { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FuneralCoverCalculator, {
  type ICalculationParams,
  type RelationshipType,
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
  coverAmount: z
    .number()
    .min(10000, "Minimum cover amount is R10,000")
    .max(500000, "Maximum cover amount is R500,000"),
  additionalMembers: z
    .array(
      z.object({
        relationship: z.enum(["spouse", "child", "extended"] as const),
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

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      mainMemberAge: 35,
      coverAmount: 50000,
      additionalMembers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "additionalMembers",
  });

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

  const addFamilyMember = (relationship: RelationshipType) => {
    append({ relationship, age: relationship === "extended" ? 25 : undefined });
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
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
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
                  <FormLabel>Cover Amount (R)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 50000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
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
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFamilyMember("spouse")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Spouse
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFamilyMember("child")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Child
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

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="capitalize">
                    {field.relationship}
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
                        <FormLabel>Relationship</FormLabel>
                        <Select
                          onValueChange={formField.onChange}
                          defaultValue={formField.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="extended">
                              Extended Family
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {field.relationship === "extended" && (
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

                  {(field.relationship === "spouse" ||
                    field.relationship === "child") && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Alert>
                        <AlertDescription>
                          Age not required - covered under main policy
                          regardless of age
                          {field.relationship === "child" &&
                            " (up to 6 children allowed)"}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button type="submit" className="w-full">
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
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <DollarSign className="h-5 w-5" />
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
