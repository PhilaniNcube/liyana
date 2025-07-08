"use client";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
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
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { loanApplicationSchema } from "@/lib/schemas";
import { Input } from "../ui/input";
import { AffordabilityInputs } from "../affordability-inputs";

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(value);
};

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

// Loan purpose options
const loanPurposeOptions = [
  { value: "home_improvements", label: "Home Improvements" },
  { value: "debt_consolidation", label: "Debt Consolidation" },
  { value: "education", label: "Education" },
  { value: "medical_expenses", label: "Medical Expenses" },
  { value: "business_expenses", label: "Business Expenses" },
  { value: "emergency", label: "Emergency Expenses" },
  { value: "vehicle_purchase", label: "Vehicle Purchase" },
  { value: "wedding", label: "Wedding" },
  { value: "travel", label: "Travel" },
  { value: "other", label: "Other" },
] as const;

interface LoanAndBankingStepProps {
  form: UseFormReturn<z.infer<typeof loanApplicationSchema>>;
}

export function LoanAndBankingStep({ form }: LoanAndBankingStepProps) {
  const selectedBankName = form.watch("bank_name");
  const selectedLoanPurpose = form.watch("loan_purpose");
  const monthlyIncome = form.watch("monthly_income") || 0;

  // Find the selected bank and auto-fill branch code
  const selectedBank = southAfricanBanks.find(
    (bank) => bank.name === selectedBankName
  );

  // Auto-fill branch code when bank is selected
  if (selectedBank && form.getValues("branch_code") !== selectedBank.code) {
    form.setValue("branch_code", selectedBank.code);
  }

  // Show loan purpose reason field when "other" is selected
  const showLoanPurposeReason = selectedLoanPurpose === "other";

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="application_amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Loan Amount: {formatCurrency(field.value || 500)}
            </FormLabel>
            <FormControl>
              <Slider
                min={500}
                max={5000}
                step={50}
                onValueChange={(value) => field.onChange(value[0])}
                defaultValue={[field.value || 500]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="term"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Repayment Period (Days): {field.value || 5}</FormLabel>
            <FormControl>
              <Slider
                min={5}
                max={60}
                step={1}
                onValueChange={(value) => field.onChange(value[0])}
                defaultValue={[field.value || 5]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="loan_purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Purpose</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select loan purpose" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loanPurposeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {showLoanPurposeReason && (
          <FormField
            control={form.control}
            name="loan_purpose_reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Please specify the reason</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Specific details about your loan purpose"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Banking Information</h2>
        <p className="text-sm text-gray-500 mb-2">
          Please provide your banking details for loan disbursement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Name</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {southAfricanBanks.map((bank) => (
                    <SelectItem key={bank.name} value={bank.name}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank_account_holder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Account Holder</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bank_account_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Account Number</FormLabel>
              <FormControl>
                <Input placeholder="1234567890" {...field} />
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
                  placeholder="Auto-filled based on bank selection"
                  {...field}
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
          name="bank_account_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Account Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="transaction">Transaction</SelectItem>
                  <SelectItem value="current">Current/Cheque</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Affordability Section */}
      <AffordabilityInputs form={form} monthlyIncome={monthlyIncome} />
    </div>
  );
}
