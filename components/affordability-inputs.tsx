"use client";

import { useState, useEffect } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loanApplicationSchema } from "@/lib/schemas";
import { Plus, Minus, AlertTriangle } from "lucide-react";
import Image from "next/image";

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(value);
};

import { calculateMinimumNorms, calculateMinimumExpenses } from "@/lib/utils/affordability";

// Default affordability structure
const defaultAffordability = {
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
};

interface AffordabilityInputsProps {
  form: UseFormReturn<z.infer<typeof loanApplicationSchema>>;
  monthlyIncome: number;
}

export function AffordabilityInputs({
  form,
  monthlyIncome,
}: AffordabilityInputsProps) {
  // Initialize affordability with default values if not set
  useEffect(() => {
    if (!form.getValues("affordability")) {
      form.setValue("affordability", defaultAffordability);
    }
  }, [form]);

  // Use field arrays for dynamic management
  const incomeArray = useFieldArray({
    control: form.control,
    name: "affordability.income",
  });

  const expensesArray = useFieldArray({
    control: form.control,
    name: "affordability.expenses",
  });

  const deductionsArray = useFieldArray({
    control: form.control,
    name: "affordability.deductions",
  });

  // Watch the affordability fields for calculations
  const affordabilityData = form.watch("affordability") || defaultAffordability;

  // Calculate totals
  const totalAdditionalIncome =
    affordabilityData.income?.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    ) || 0;
  const totalExpenses =
    affordabilityData.expenses?.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    ) || 0;
  const totalDeductions =
    affordabilityData.deductions?.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    ) || 0;
  const totalGrossIncome = monthlyIncome + totalAdditionalIncome;
  const netIncome = totalGrossIncome - totalDeductions;
  const disposableIncome = netIncome - totalExpenses;

  // Calculate minimum norms - updates automatically when totalGrossIncome changes
  const minimumRequiredExpenses = calculateMinimumExpenses(totalGrossIncome);

  // Debug: Log calculation updates (can be removed in production)
  useEffect(() => {
    console.log("Affordability calculations updated:", {
      totalGrossIncome,
      minimumRequiredExpenses,
      disposableIncome,
      totalExpenses
    });
  }, [
    totalGrossIncome,
    minimumRequiredExpenses,
    disposableIncome,
    totalExpenses
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Affordability Assessment</h2>
        <p className="text-sm text-gray-500">
          Complete your income and expense details for affordability
          calculation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Additional Income */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Additional Income</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => incomeArray.append({ type: "", amount: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Income
            </Button>
          </div>
          {incomeArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <Input
                {...form.register(`affordability.income.${index}.type`)}
                placeholder="Income type"
                className="flex-1"
              />
              <Input
                type="number"
                {...form.register(`affordability.income.${index}.amount`, {
                  valueAsNumber: true,
                  onChange: () => {
                    // Trigger re-calculation by forcing a form update
                    form.trigger("affordability");
                  },
                })}
                placeholder="0"
                className="w-24"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => incomeArray.remove(index)}
                disabled={incomeArray.fields.length === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm font-medium">
              <span>Total Additional Income:</span>
              <span>{formatCurrency(totalAdditionalIncome)}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Deductions</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => deductionsArray.append({ type: "", amount: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Deduction
            </Button>
          </div>
          {deductionsArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <Input
                {...form.register(`affordability.deductions.${index}.type`)}
                placeholder="Deduction type"
                className="flex-1"
              />
              <Input
                type="number"
                {...form.register(`affordability.deductions.${index}.amount`, {
                  valueAsNumber: true,
                  onChange: () => {
                    // Trigger re-calculation by forcing a form update
                    form.trigger("affordability");
                  },
                })}
                placeholder="0"
                className="w-24"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => deductionsArray.remove(index)}
                disabled={deductionsArray.fields.length === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm font-medium">
              <span>Total Deductions:</span>
              <span>{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Monthly Expenses</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => expensesArray.append({ type: "", amount: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </div>
          {expensesArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <Input
                {...form.register(`affordability.expenses.${index}.type`)}
                placeholder="Expense type"
                className="flex-1"
              />
              <Input
                type="number"
                {...form.register(`affordability.expenses.${index}.amount`, {
                  valueAsNumber: true,
                  onChange: () => {
                    // Trigger re-calculation by forcing a form update
                    form.trigger("affordability");
                  },
                })}
                placeholder="0"
                className="w-24"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => expensesArray.remove(index)}
                disabled={expensesArray.fields.length === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm font-medium">
              <span>Total Expenses:</span>
              <span>{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Affordability Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-md font-medium">Affordability Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Monthly Income:</span>
              <span className="text-sm font-medium">
                {formatCurrency(monthlyIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Additional Income:</span>
              <span className="text-sm font-medium">
                {formatCurrency(totalAdditionalIncome)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Total Gross Income:</span>
              <span className="text-sm font-medium">
                {formatCurrency(totalGrossIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Less: Deductions:</span>
              <span className="text-sm font-medium">
                -{formatCurrency(totalDeductions)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Net Income:</span>
              <span className="text-sm font-medium">
                {formatCurrency(netIncome)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Minimum Required Expenses:</span>
              <span className="text-sm font-medium">
                {formatCurrency(minimumRequiredExpenses)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Surplus/(Shortfall):</span>
              <span
                className={`text-sm font-medium ${disposableIncome >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(disposableIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Existing Affordability/Surplus Warning (Logic preserved but simplified) */}
        {disposableIncome < 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Affordability Concern
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Your current expenses exceed your net income. You have a shortfall of{" "}
                  {formatCurrency(Math.abs(disposableIncome))}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Error Display (Replaces Low Expenses Warning) */}
        {form.formState.errors.affordability && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Validation Error
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  {form.formState.errors.affordability.message || "Please check your affordability details."}
                </p>
                <div className="flex justify-center mt-3">
                  <Image
                    src="/square.jpg"
                    alt="Affordability Warning"
                    width={200}
                    height={150}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
