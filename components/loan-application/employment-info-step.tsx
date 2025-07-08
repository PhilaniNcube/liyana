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
import { loanApplicationSchema } from "@/lib/schemas";

interface EmploymentInfoStepProps {
  form: UseFormReturn<z.infer<typeof loanApplicationSchema>>;
}

export function EmploymentInfoStep({ form }: EmploymentInfoStepProps) {
  const employmentType = form.watch("employment_type");
  const requiresEndDate =
    employmentType === "contract" || employmentType === "retired";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="employment_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employment Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self_employed">Self-Employed</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
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
                <Input placeholder="ACME Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="job_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input placeholder="Software Engineer" {...field} />
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
                <Input
                  placeholder="123 Business Street, City, Province"
                  {...field}
                  autoComplete="off"
                />
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
              <FormLabel>Employer Contact Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="011 123 4567"
                  {...field}
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {requiresEndDate && (
          <FormField
            control={form.control}
            name="employment_end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="monthly_income"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gross Monthly Income</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="25000"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
