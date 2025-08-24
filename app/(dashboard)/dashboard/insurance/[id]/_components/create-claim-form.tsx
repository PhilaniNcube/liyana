"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PolicyWithAllData } from "@/lib/queries/policy-details";
import { Plus, CalendarIcon, Loader2 } from "lucide-react";
import React, { useState, useActionState, useTransition } from "react";
import { createClaimSchema, CreateClaimType } from "@/lib/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClaimAction } from "@/lib/actions/claims";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type CreateClaimFormProps = {
  policy: PolicyWithAllData;
};

const CreateClaimForm = ({ policy }: CreateClaimFormProps) => {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createClaimAction, null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateClaimType>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: {
      policy_id: policy.id,
      claimant_party_id: policy.policy_holder?.id || "",
      claim_number: "",
      status: "submitted",
      date_of_incident: new Date(),
      date_filed: new Date(),
    },
  });

  // Handle form submission using server action
  const onSubmit = (data: CreateClaimType) => {
    const formData = new FormData();
    formData.append("policy_id", data.policy_id.toString());
    formData.append("claimant_party_id", data.claimant_party_id);
    formData.append("claim_number", data.claim_number);
    formData.append("status", data.status);
    formData.append("date_of_incident", data.date_of_incident.toISOString());
    formData.append("date_filed", data.date_filed.toISOString());

    // Call the server action within transition
    startTransition(() => {
      formAction(formData);
    });
  };

  // Handle success/error states based on server action result
  React.useEffect(() => {
    if (state?.success) {
      toast.success("Claim created successfully!");
      setOpen(false);
      form.reset({
        policy_id: policy.id,
        claimant_party_id: policy.policy_holder?.id || "",
        claim_number: "",
        status: "submitted",
        date_of_incident: new Date(),
        date_filed: new Date(),
      });
    } else if (state?.errors) {
      if (typeof state.errors === "object" && "message" in state.errors) {
        toast.error(state.errors.message as string);
      } else {
        // Handle field-specific errors
        if (typeof state.errors === "object") {
          Object.entries(state.errors).forEach(([field, error]) => {
            if (
              field !== "message" &&
              error &&
              typeof error === "object" &&
              "_errors" in error
            ) {
              const errorMessage = Array.isArray(error._errors)
                ? error._errors.join(", ")
                : "Invalid value";
              form.setError(field as keyof CreateClaimType, {
                type: "server",
                message: errorMessage,
              });
            }
          });
        }
        toast.error("Please check the form for errors.");
      }
    }
  }, [state, form, policy.id, policy.policy_holder?.id]);

  // Generate a unique claim number based on policy and current date
  const generateClaimNumber = () => {
    const date = new Date();
    const dateStr = format(date, "yyyyMMdd");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `CLM-${policy.id}-${dateStr}-${random}`;
  };

  const handleGenerateClaimNumber = () => {
    form.setValue("claim_number", generateClaimNumber());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Claim</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Policy Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-sm text-gray-700 mb-2">
                Policy Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Policy ID:</span>
                  <span className="ml-2 font-medium">{policy.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Policy Holder:</span>
                  <span className="ml-2 font-medium">
                    {policy.policy_holder?.first_name}{" "}
                    {policy.policy_holder?.last_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Claimant Party ID */}
            <FormField
              control={form.control}
              name="claimant_party_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claimant</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select claimant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Policy Holder Option */}
                      {policy.policy_holder?.id && (
                        <SelectItem value={policy.policy_holder.id}>
                          <div className="flex items-center gap-x-1">
                            <span className="font-medium">
                              {policy.policy_holder.first_name}{" "}
                              {policy.policy_holder.last_name}
                            </span>
                            <span> - </span>
                            <span className="text-xs text-muted-foreground">
                              Policy Holder
                            </span>
                          </div>
                        </SelectItem>
                      )}

                      {/* Beneficiaries Options */}
                      {policy.beneficiaries &&
                        policy.beneficiaries.length > 0 &&
                        policy.beneficiaries.map((beneficiary) => (
                          <SelectItem
                            key={beneficiary.id}
                            value={beneficiary.party?.id || ""}
                            disabled={!beneficiary.party?.id}
                          >
                            <div className="flex items-center gap-x-1">
                              <span className="font-medium">
                                {beneficiary.party?.first_name}{" "}
                                {beneficiary.party?.last_name}
                              </span>
                              <span> - </span>
                              <span className="text-xs text-muted-foreground">
                                Beneficiary ({beneficiary.relation_type})
                              </span>
                            </div>
                          </SelectItem>
                        ))}

                      {/* Show message if no options available */}
                      {!policy.policy_holder?.id &&
                        (!policy.beneficiaries ||
                          policy.beneficiaries.length === 0) && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No eligible claimants found
                          </div>
                        )}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-1">
                    Select either the policy holder or one of the beneficiaries
                    as the claimant
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Claim Number */}
            <FormField
              control={form.control}
              name="claim_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Number</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="Enter claim number"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGenerateClaimNumber}
                      disabled={isPending}
                    >
                      Generate
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select claim status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">
                          Under Review
                        </SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date of Incident */}
              <FormField
                control={form.control}
                name="date_of_incident"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Incident</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isPending}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Filed */}
              <FormField
                control={form.control}
                name="date_filed"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Filed</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isPending}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Status */}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Claim"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClaimForm;
