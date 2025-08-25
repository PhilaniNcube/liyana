"use client";

import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  CalendarIcon,
  Loader2,
  FileText,
  AlertCircle,
  User,
  Shield,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import type { Database } from "@/lib/database.types";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];
type PartyRow = Database["public"]["Tables"]["parties"]["Row"];

type BeneficiaryWithDetails = {
  id: number;
  beneficiary_party_id: string;
  allocation_percentage: number;
  relation_type: string;
  party: Partial<PartyRow> | null;
};

// Schema for creating a claim with support documents
const createClaimSchema = z.object({
  policy_id: z.number(),
  claimant_party_id: z.string().min(1, "Please select a claimant"),
  date_of_incident: z.date({
    required_error: "Date of incident is required",
  }),
  date_filed: z.date({
    required_error: "Date filed is required",
  }),
  supporting_documents: z.array(z.number()).optional(),
});

type CreateClaimFormData = z.infer<typeof createClaimSchema>;

interface CreateClaimDialogProps {
  policyId: number;
  policyHolderId: string;
  policyHolder: Partial<PartyRow> | null;
  beneficiaries: BeneficiaryWithDetails[];
  documents: PolicyDocumentRow[];
  onClaimCreated?: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  birth_certificate: "Birth Certificate",
  death_certificate: "Death Certificate",
  marriage_certificate: "Marriage Certificate",
  identity_document: "Identity Document",
  passport: "Passport",
};

export default function CreateClaimDialog({
  policyId,
  policyHolderId,
  policyHolder,
  beneficiaries,
  documents,
  onClaimCreated,
}: CreateClaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateClaimFormData>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: {
      policy_id: policyId,
      claimant_party_id: policyHolderId || "",
      date_of_incident: new Date(),
      date_filed: new Date(),
      supporting_documents: [],
    },
  });

  const onSubmit = async (data: CreateClaimFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policy_id: data.policy_id,
          claimant_party_id: data.claimant_party_id,
          date_of_incident: data.date_of_incident,
          date_filed: data.date_filed,
          status: "submitted",
          claim_number: "", // Will be auto-generated
        }),
      });

      if (!response.ok) {
        console.error("Error creating claim:", response.statusText);
        const error = await response.json();
        throw new Error(error.error || "Failed to create claim");
      }

      const result = await response.json();

      toast.success("Claim created successfully!");
      setOpen(false);
      form.reset({
        policy_id: policyId,
        claimant_party_id: policyHolderId || "",
        date_of_incident: new Date(),
        date_filed: new Date(),
        supporting_documents: [],
      });

      onClaimCreated?.();
    } catch (error) {
      console.error("Error creating claim:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create claim"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClaimantId = form.watch("claimant_party_id");
  const selectedClaimant =
    selectedClaimantId === policyHolderId
      ? policyHolder
      : beneficiaries.find((b) => b.beneficiary_party_id === selectedClaimantId)
          ?.party;

  const selectedClaimantName = selectedClaimant
    ? `${selectedClaimant.first_name || ""} ${selectedClaimant.last_name || ""}`.trim() ||
      selectedClaimant.organization_name ||
      "Unknown"
    : "Unknown";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Create New Claim
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Policy Information Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Policy Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Policy ID:</span>
                    <span className="ml-2">{policyId}</span>
                  </div>
                  <div>
                    <span className="font-medium">Policy Holder:</span>
                    <span className="ml-2">
                      {policyHolder?.first_name} {policyHolder?.last_name}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Claim Details Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Claim Details</h3>

                  {/* Claimant Selection */}
                  <FormField
                    control={form.control}
                    name="claimant_party_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Who is making this claim?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select the claimant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Policy Holder Option */}
                            {policyHolder && policyHolderId && (
                              <SelectItem value={policyHolderId}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium">
                                      {policyHolder.first_name}{" "}
                                      {policyHolder.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Policy Holder
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            )}

                            {/* Beneficiaries Options */}
                            {beneficiaries.map((beneficiary) => (
                              <SelectItem
                                key={beneficiary.id}
                                value={beneficiary.beneficiary_party_id}
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium">
                                      {beneficiary.party?.first_name}{" "}
                                      {beneficiary.party?.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Beneficiary ({beneficiary.relation_type})
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                                  disabled={isSubmitting}
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                  disabled={isSubmitting}
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
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
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
                </div>
              </div>

              {/* Supporting Documents Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Supporting Documents
                  </h3>

                  {documents.length > 0 ? (
                    <FormField
                      control={form.control}
                      name="supporting_documents"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground">
                            Select documents to support your claim (optional)
                          </FormLabel>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                {documents.map((document) => (
                                  <FormField
                                    key={document.id}
                                    control={form.control}
                                    name="supporting_documents"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={document.id}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(
                                                document.id
                                              )}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([
                                                      ...(field.value || []),
                                                      document.id,
                                                    ])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) =>
                                                          value !== document.id
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <div className="space-y-1 leading-none">
                                            <div className="flex items-center gap-2">
                                              <FileText className="h-4 w-4 text-muted-foreground" />
                                              <FormLabel className="text-sm font-medium">
                                                {DOCUMENT_TYPE_LABELS[
                                                  document.document_type
                                                ] || document.document_type}
                                              </FormLabel>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                              Uploaded on{" "}
                                              {new Date(
                                                document.created_at
                                              ).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No documents have been uploaded yet. You can upload
                        supporting documents in the Documents tab before
                        creating a claim.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>

            {/* Claim Summary */}
            {selectedClaimantId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Claim Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Claimant:</span>
                      <div className="mt-1">{selectedClaimantName}</div>
                    </div>
                    <div>
                      <span className="font-medium">Incident Date:</span>
                      <div className="mt-1">
                        {form.watch("date_of_incident")
                          ? format(form.watch("date_of_incident"), "PPP")
                          : "Not selected"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Supporting Documents:</span>
                      <div className="mt-1">
                        {form.watch("supporting_documents")?.length || 0}{" "}
                        selected
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Claim...
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
}
