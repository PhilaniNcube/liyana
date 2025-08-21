"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, DollarSign } from "lucide-react";
import { PaydayLoanCalculator } from "@/lib/utils/loancalculator";

const approvalSchema = z.object({
  loan_amount: z
    .number()
    .min(500, "Minimum loan amount is R500")
    .max(5000, "Maximum loan amount is R5,000"),
  loan_term: z
    .number()
    .min(5, "Minimum term is 5 days")
    .max(60, "Maximum term is 60 days"),
  interest_rate: z
    .number()
    .min(0.01, "Interest rate must be at least 0.01%")
    .max(50, "Interest rate cannot exceed 50%"),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

interface ApproveLoanModalProps {
  applicationId: number;
  currentAmount: number;
  currentTerm: number;
  applicantName?: string;
  children: React.ReactNode;
  onApprovalSuccess?: () => void;
}

export function ApproveLoanModal({
  applicationId,
  currentAmount,
  currentTerm,
  applicantName,
  children,
  onApprovalSuccess,
}: ApproveLoanModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      loan_amount: currentAmount,
      loan_term: currentTerm,
      interest_rate: 5, // Default to 5%
    },
  });

  const watchedValues = form.watch();

  // Calculate loan details using the PaydayLoanCalculator
  const calculateLoanDetails = () => {
    try {
      const calculator = new PaydayLoanCalculator({
        principal: watchedValues.loan_amount || currentAmount,
        termInDays: watchedValues.loan_term || currentTerm,
        loanStartDate: new Date(),
        interestRate: (watchedValues.interest_rate || 5) / 100, // Convert percentage to decimal
      });

      return {
        totalRepayment: calculator.getTotalRepayment(),
        monthlyRepayment: calculator.getMonthlyRepayment(),
      };
    } catch (error) {
      return {
        totalRepayment: 0,
        monthlyRepayment: 0,
      };
    }
  };

  const loanDetails = calculateLoanDetails();

  const handleApproval = async (data: ApprovalFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loan_amount: data.loan_amount,
            loan_term: data.loan_term,
            interest_rate: data.interest_rate,
            total_repayment: loanDetails.totalRepayment,
            monthly_repayment: loanDetails.monthlyRepayment,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve application");
      }

      const result = await response.json();

      toast.success("Application approved successfully!");
      setIsOpen(false);
      form.reset();

      // Call the success callback to refresh the page or update state
      if (onApprovalSuccess) {
        onApprovalSuccess();
      } else {
        // Fallback to page reload
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Error approving application:", error);
      toast.error(error.message || "Failed to approve application");
    } finally {
      setIsSubmitting(false);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Approve Loan Application
          </DialogTitle>
          <DialogDescription>
            Review and adjust the loan terms for{" "}
            {applicantName ? `${applicantName}'s` : "this"} application before
            approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleApproval)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Loan Amount */}
              <FormField
                control={form.control}
                name="loan_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount (ZAR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter loan amount"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Loan Term */}
              <FormField
                control={form.control}
                name="loan_term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Loan Term: {field.value || currentTerm} days
                    </FormLabel>
                    <FormControl>
                      <div className="px-2">
                        <Slider
                          min={5}
                          max={60}
                          step={1}
                          value={[field.value || currentTerm]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>5 days</span>
                          <span>60 days</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interest Rate */}
              <FormField
                control={form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3">
                          3% (Preferred Customer)
                        </SelectItem>
                        <SelectItem value="5">5% (Standard Rate)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Loan Calculation Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                <h4 className="font-medium">Loan Summary</h4>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Principal Amount</p>
                  <p className="font-medium">
                    {formatCurrency(watchedValues.loan_amount || currentAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Term</p>
                  <p className="font-medium">
                    {watchedValues.loan_term || currentTerm} days
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">
                    {(watchedValues.interest_rate || 5).toFixed(1)}% per annum
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monthly Payment</p>
                  <p className="font-medium">
                    {formatCurrency(loanDetails.monthlyRepayment)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Repayment</p>
                  <p className="font-medium">
                    {formatCurrency(loanDetails.totalRepayment)}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Loan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
