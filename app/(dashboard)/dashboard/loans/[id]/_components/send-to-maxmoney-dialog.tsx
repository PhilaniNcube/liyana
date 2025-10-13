import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, SendHorizonal } from "lucide-react";
import type { MaxMoneyLoanApplicationInput } from "@/lib/schemas";

interface SendToMaxMoneyDialogProps {
  loan: {
    id: number;
    profile_id: string;
    loan_amount: number;
    term: number;
    max_money_id?: string | null;
  };
  children: React.ReactNode;
  onSuccess?: () => void;
  maxMoneyClientNumber?: string;
}

export function SendToMaxMoneyDialog({
  loan,
  children,
  onSuccess,
  maxMoneyClientNumber,
}: SendToMaxMoneyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MaxMoneyLoanApplicationInput>({
    application_id: loan.id,
    client_number: maxMoneyClientNumber || loan.max_money_id || "",
    loan_product_id: 14723, // Default value
    cashbox_id: 1, // Default value
    loan_purpose_id: 1, // Default value - Personal loan
    no_of_instalment: loan.term || 30,
    loan_amount: loan.loan_amount || 1000,
  });

  // Update client number when maxMoneyClientNumber prop changes
  useEffect(() => {
    if (maxMoneyClientNumber) {
      setFormData(prev => ({
        ...prev,
        client_number: maxMoneyClientNumber
      }));
    }
  }, [maxMoneyClientNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_number) {
      toast.error("Client number is required. Please search for the client in MaxMoney first.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/max_money/create_loan_application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create loan application");
      }

      if (result.return_code === 0) {
        toast.success(`Loan application created successfully! Loan ID: ${result.loan_id}, Loan No: ${result.loan_no}`);
        setIsOpen(false);
        onSuccess?.();
      } else {
        toast.error(`Failed to create loan application: ${result.return_reason}`);
      }
    } catch (error) {
      console.error("Error creating loan application:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating the loan application"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof MaxMoneyLoanApplicationInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (field === 'client_number' ? value : Number(value)) : value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SendHorizonal className="h-5 w-5" />
            Send Loan to MaxMoney
          </DialogTitle>
          <DialogDescription>
            Create a loan application in the MaxMoney system for loan #{loan.id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="application_id">Application ID</Label>
              <Input
                id="application_id"
                value={formData.application_id}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_number">Client Number *</Label>
              <Input
                id="client_number"
                value={formData.client_number}
                onChange={(e) => handleInputChange('client_number', e.target.value)}
                placeholder="Enter MaxMoney client number"
                required
              />
              {!loan.max_money_id && (
                <p className="text-xs text-muted-foreground">
                  Search for the client in MaxMoney first to get their client number
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan_amount">Loan Amount (R)</Label>
              <Input
                id="loan_amount"
                type="number"
                value={formData.loan_amount}
                onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="no_of_instalment">Number of Installments</Label>
              <Input
                id="no_of_instalment"
                type="number"
                value={formData.no_of_instalment}
                onChange={(e) => handleInputChange('no_of_instalment', e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan_product_id">Loan Product</Label>
              <Select
                value={formData.loan_product_id.toString()}
                onValueChange={(value) => handleInputChange('loan_product_id', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Standard Loan</SelectItem>
                  <SelectItem value="2">Premium Loan</SelectItem>
                  <SelectItem value="3">Quick Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashbox_id">Cashbox</Label>
              <Select
                value={formData.cashbox_id.toString()}
                onValueChange={(value) => handleInputChange('cashbox_id', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Main Cashbox</SelectItem>
                  <SelectItem value="2">Secondary Cashbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan_purpose_id">Loan Purpose</Label>
            <Select
              value={formData.loan_purpose_id.toString()}
              onValueChange={(value) => handleInputChange('loan_purpose_id', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Personal Use</SelectItem>
                <SelectItem value="2">Debt Consolidation</SelectItem>
                <SelectItem value="3">Home Improvement</SelectItem>
                <SelectItem value="4">Emergency Expenses</SelectItem>
                <SelectItem value="5">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <SendHorizonal className="h-4 w-4 mr-2" />
                  Create Loan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}