"use client";

import { updatePolicyStatus } from "@/lib/actions/funeral-policy";
import React, { useActionState, useState } from "react";
import { updatePolicyStatusSchema } from "@/lib/schemas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Clock, XCircle, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type PolicyStatus = "pending" | "active" | "lapsed" | "cancelled";

interface UpdatePolicyStatusProps {
  currentStatus: PolicyStatus;
  policyId: number;
}

const POLICY_STATUS_OPTIONS: Array<{
  value: PolicyStatus;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    value: "pending",
    label: "Pending",
    icon: <Clock className="h-4 w-4 text-yellow-500" />,
    description: "Policy is awaiting approval or processing",
  },
  {
    value: "active",
    label: "Active",
    icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    description: "Policy is currently active and in force",
  },
  {
    value: "lapsed",
    label: "Lapsed",
    icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
    description: "Policy has lapsed due to non-payment",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    description: "Policy has been cancelled",
  },
];

const UpdatePolicyStatus = ({
  currentStatus,
  policyId,
}: UpdatePolicyStatusProps) => {
  const [state, formAction, isPending] = useActionState(
    updatePolicyStatus,
    null
  );
  const [open, setOpen] = useState(false);

  const currentStatusOption = POLICY_STATUS_OPTIONS.find(
    (option) => option.value === currentStatus
  );

  // Close dialog on successful update
  React.useEffect(() => {
    if (state && !state.error) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 2000); // Close after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[150px]",
            currentStatus === "active"
              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
              : currentStatus === "pending"
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800"
                : currentStatus === "lapsed"
                  ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:text-orange-800"
                  : currentStatus === "cancelled"
                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                    : ""
          )}
        >
          <Edit className="h-4 w-4" />
          {currentStatusOption?.label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStatusOption?.icon}
            Update Policy Status
          </DialogTitle>
          <DialogDescription>
            Change the status of Policy #{policyId}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="policy_id" value={policyId} />

          <div className="space-y-2">
            <Label htmlFor="current-status">Current Status</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              {currentStatusOption?.icon}
              <span className="font-medium">{currentStatusOption?.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStatusOption?.description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy_status">New Status</Label>
            <Select name="policy_status" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {POLICY_STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value === currentStatus}
                  >
                    <div className="flex text-xs items-center gap-2">
                      {option.icon}
                      <div className="flex items-center gap-x-2">
                        <span>{option.label}</span>
                        <span className="text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {state.message || "Failed to update policy status"}
              </AlertDescription>
            </Alert>
          )}

          {state && !state.error && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Policy status updated successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePolicyStatus;
