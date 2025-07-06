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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { loanApplicationSchema } from "@/lib/schemas";

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(value);
};

interface LoanAndBankingStepProps {
  form: UseFormReturn<z.infer<typeof loanApplicationSchema>>;
}

export function LoanAndBankingStep({ form }: LoanAndBankingStepProps) {
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
                step={100}
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
            <FormLabel>Repayment Period (Months): {field.value || 1}</FormLabel>
            <FormControl>
              <Slider
                min={1}
                max={12}
                step={1}
                onValueChange={(value) => field.onChange(value[0])}
                defaultValue={[field.value || 1]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="loan_purpose"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Loan Purpose</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Home improvements" {...field} />
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
              <Input placeholder="e.g. Capitec" {...field} />
            </FormControl>
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
              <Input placeholder="470010" {...field} />
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
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="transaction">Transaction</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
