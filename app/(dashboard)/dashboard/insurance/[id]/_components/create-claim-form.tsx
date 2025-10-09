"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, AlertCircle, Shield, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import type { Database } from "@/lib/types";
import PolicyDocumentUpload from "@/components/policy-document-upload";

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

// Function to create schema with document validation
const createClaimSchemaWithDocs = (availableDocuments: PolicyDocumentRow[]) =>
  z
    .object({
      policy_id: z.number(),
      claimant_party_id: z.string().min(1, "Please select a claimant"),
      date_of_incident: z.date(),
      date_filed: z.date(),
      supporting_documents: z
        .array(z.number())
        .min(2, "Exactly 2 supporting documents are required"),
      contact_details: z.object({
        is_policy_holder: z.enum(["yes", "no"]),
        relationship: z.string().optional(),
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Please enter a valid email address"),
        phone: z.string().min(1, "Phone number is required"),
      }),
    })
    .refine(
      (data) => {
        // If not policy holder, relationship is required
        if (
          data.contact_details.is_policy_holder === "no" &&
          !data.contact_details.relationship
        ) {
          return false;
        }
        return true;
      },
      {
        message: "Relationship is required when not the policy holder",
        path: ["contact_details", "relationship"],
      }
    )
    .refine(
      (data) => {
        // Validate exactly 2 documents are selected
        if (data.supporting_documents.length !== 2) {
          return false;
        }
        return true;
      },
      {
        message: "You must select exactly 2 documents",
        path: ["supporting_documents"],
      }
    )
    .refine(
      (data) => {
        // Validate document types: one death certificate and one ID document
        const selectedDocs = availableDocuments.filter((doc) =>
          data.supporting_documents.includes(doc.id)
        );

        const hasDeathCertificate = selectedDocs.some(
          (doc) => doc.document_type === "death_certificate"
        );
        const hasIdDocument = selectedDocs.some(
          (doc) =>
            doc.document_type === "identity_document" ||
            doc.document_type === "passport"
        );

        return hasDeathCertificate && hasIdDocument;
      },
      {
        message:
          "You must select one death certificate and one ID document (identity document or passport)",
        path: ["supporting_documents"],
      }
    );

type CreateClaimFormData = z.infer<
  ReturnType<typeof createClaimSchemaWithDocs>
>;

interface CreateClaimFormProps {
  policyId: number;
  policyHolderId: string;
  policyHolder: Partial<PartyRow> | null;
  beneficiaries: BeneficiaryWithDetails[];
  documents: PolicyDocumentRow[];
  onClaimCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  birth_certificate: "Birth Certificate",
  death_certificate: "Death Certificate",
  marriage_certificate: "Marriage Certificate",
  identity_document: "Identity Document",
  passport: "Passport",
};

export default function CreateClaimForm({
  policyId,
  policyHolderId,
  policyHolder,
  beneficiaries,
  documents,
  onClaimCreated,
  open,
  onOpenChange,
  trigger,
}: CreateClaimFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimDocuments, setClaimDocuments] = useState(documents);
  // Track documents uploaded during this claim creation session
  // These will be associated with the claim after it's successfully created
  const [newlyUploadedDocuments, setNewlyUploadedDocuments] = useState<
    number[]
  >([]);

  const form = useForm<CreateClaimFormData>({
    resolver: zodResolver(createClaimSchemaWithDocs(claimDocuments)),
    defaultValues: {
      policy_id: policyId,
      claimant_party_id: policyHolderId || "",
      date_of_incident: new Date(),
      date_filed: new Date(),
      supporting_documents: [],
      contact_details: {
        is_policy_holder: "yes",
        relationship: "",
        name:
          policyHolder?.first_name && policyHolder?.last_name
            ? `${policyHolder.first_name} ${policyHolder.last_name}`
            : "",
        email: "",
        phone: "",
      },
    },
  });

  // Update form validation when documents change
  useEffect(() => {
    const newResolver = zodResolver(createClaimSchemaWithDocs(claimDocuments));
    form.clearErrors(); // Clear existing errors
    // Note: We can't directly update the resolver, but we trigger revalidation
    form.trigger("supporting_documents");
  }, [claimDocuments, form]);

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
          contact_details: data.contact_details,
        }),
      });

      if (!response.ok) {
        console.error("Error creating claim:", response.statusText);
        const error = await response.json();
        throw new Error(error.error || "Failed to create claim");
      }

      const result = await response.json();
      const claimId = result.claim?.id;

      // Associate newly uploaded documents with the claim
      if (claimId && newlyUploadedDocuments.length > 0) {
        try {
          const updateResponse = await fetch(
            "/api/policy-documents/associate-claim",
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                document_ids: newlyUploadedDocuments,
                claim_id: claimId,
              }),
            }
          );

          if (!updateResponse.ok) {
            console.warn(
              "Failed to associate documents with claim, but claim was created successfully"
            );
          }
        } catch (docError) {
          console.warn("Error associating documents with claim:", docError);
          // Don't fail the entire process if document association fails
        }
      }

      toast.success("Claim created successfully!");
      form.reset({
        policy_id: policyId,
        claimant_party_id: policyHolderId || "",
        date_of_incident: new Date(),
        date_filed: new Date(),
        supporting_documents: [],
        contact_details: {
          is_policy_holder: "yes",
          relationship: "",
          name:
            policyHolder?.first_name && policyHolder?.last_name
              ? `${policyHolder.first_name} ${policyHolder.last_name}`
              : "",
          email: "",
          phone: "",
        },
      });

      // Reset document tracking states
      setClaimDocuments(documents);
      setNewlyUploadedDocuments([]);

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
  const selectedSupportingDocs = form.watch("supporting_documents");

  // Check if we have exactly 2 documents with the right types
  const hasValidDocuments = useMemo(() => {
    if (!selectedSupportingDocs || selectedSupportingDocs.length !== 2) {
      return false;
    }

    const selectedDocs = claimDocuments.filter((doc) =>
      selectedSupportingDocs.includes(doc.id)
    );

    const hasDeathCertificate = selectedDocs.some(
      (doc) => doc.document_type === "death_certificate"
    );
    const hasIdDocument = selectedDocs.some(
      (doc) =>
        doc.document_type === "identity_document" ||
        doc.document_type === "passport"
    );

    return hasDeathCertificate && hasIdDocument;
  }, [selectedSupportingDocs, claimDocuments]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-7xl w-full min-w-[max(50vw,400px)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Create New Claim
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-w-7xl w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Claim Details Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Claim Details</h3>

                    {/* Contact Details Section */}
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-4">
                        Claimant Contact Details
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter the contact information for the person filing this
                        claim.
                      </p>

                      {/* Policy Holder Yes/No */}
                      <FormField
                        control={form.control}
                        name="contact_details.is_policy_holder"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>
                              Is the claimant the policy holder?
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Clear relationship when policy holder is selected
                                  if (value === "yes") {
                                    form.setValue(
                                      "contact_details.relationship",
                                      ""
                                    );
                                  }
                                }}
                                value={field.value}
                                className="flex flex-row space-x-6"
                                disabled={isSubmitting}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="yes"
                                    id="policy-holder-yes"
                                  />
                                  <Label htmlFor="policy-holder-yes">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="no"
                                    id="policy-holder-no"
                                  />
                                  <Label htmlFor="policy-holder-no">No</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Relationship Dropdown (only shown when not policy holder) */}
                      {form.watch("contact_details.is_policy_holder") ===
                        "no" && (
                        <FormField
                          control={form.control}
                          name="contact_details.relationship"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>
                                Relationship to Policy Holder
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isSubmitting}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select relationship" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="child">Child</SelectItem>
                                  <SelectItem value="parent">Parent</SelectItem>
                                  <SelectItem value="sibling">
                                    Sibling
                                  </SelectItem>
                                  <SelectItem value="trustee">
                                    Trustee
                                  </SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Contact Information Fields */}
                      <div className="grid grid-cols-1 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="contact_details.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Claimant&apos;s Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter claimant's full name"
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="contact_details.email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Claimant&apos;s Email</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter claimant's email"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contact_details.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Claimant&apos;s Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter claimant's phone number"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Claimant Selection */}
                    <FormField
                      control={form.control}
                      name="claimant_party_id"
                      render={({ field }) => (
                        <FormItem className="mt-6">
                          <FormLabel>Covered Person</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select the covered person" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {/* Policy Holder Option */}
                              {policyHolder && policyHolderId && (
                                <SelectItem value={policyHolderId}>
                                  <div className="flex items-center gap-x-1">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">
                                      {policyHolder.first_name}{" "}
                                      {policyHolder.last_name}
                                    </span>
                                    <span> - </span>
                                    <span className="text-xs text-muted-foreground">
                                      Policy Holder
                                    </span>
                                  </div>
                                </SelectItem>
                              )}

                              {/* Beneficiaries Options */}
                              {beneficiaries.map((beneficiary) => (
                                <SelectItem
                                  key={beneficiary.id}
                                  value={beneficiary.beneficiary_party_id}
                                >
                                  <div className="flex items-center gap-x-1">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">
                                      {beneficiary.party?.first_name}{" "}
                                      {beneficiary.party?.last_name}
                                    </span>
                                    <span> - </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({beneficiary.relation_type})
                                    </span>
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
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">
                        Supporting Documents
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Required: Upload exactly 2 documents - one death
                        certificate and one ID document
                      </p>
                    </div>

                    {claimDocuments.length > 0 ? (
                      <FormField
                        control={form.control}
                        name="supporting_documents"
                        render={() => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">
                              Select documents to support this claim
                            </FormLabel>
                            <Card
                              className={cn(
                                "transition-colors",
                                !hasValidDocuments &&
                                  "border-destructive/50 bg-destructive/5"
                              )}
                            >
                              <CardContent className="pt-6">
                                <div className="space-y-3">
                                  {claimDocuments.map((document) => (
                                    <div
                                      key={document.id}
                                      className="flex items-center space-x-2"
                                    >
                                      <Checkbox
                                        id={`doc-${document.id}`}
                                        checked={selectedSupportingDocs?.includes(
                                          document.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          const current =
                                            form.getValues(
                                              "supporting_documents"
                                            ) || [];
                                          if (checked) {
                                            form.setValue(
                                              "supporting_documents",
                                              [...current, document.id]
                                            );
                                          } else {
                                            form.setValue(
                                              "supporting_documents",
                                              current.filter(
                                                (id) => id !== document.id
                                              )
                                            );
                                          }
                                        }}
                                        disabled={isSubmitting}
                                      />
                                      <Label
                                        htmlFor={`doc-${document.id}`}
                                        className="flex-1 cursor-pointer"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <span className="font-medium">
                                              {
                                                DOCUMENT_TYPE_LABELS[
                                                  document.document_type
                                                ]
                                              }
                                            </span>
                                            <div className="text-xs text-muted-foreground">
                                              Uploaded on{" "}
                                              {new Date(
                                                document.created_at
                                              ).toLocaleDateString()}
                                            </div>
                                          </div>
                                        </div>
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="supporting_documents"
                          render={() => (
                            <FormItem>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            You must upload exactly 2 documents: one death
                            certificate and one ID document (identity document
                            or passport) before submitting this claim. Upload
                            documents below.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    {/* Inline upload component */}
                    <div className="mt-6">
                      <PolicyDocumentUpload
                        policyId={policyId}
                        existingDocuments={claimDocuments}
                        onDocumentUploaded={(doc) => {
                          setClaimDocuments((prev) => [doc, ...prev]);
                          // Track newly uploaded documents for claim association
                          setNewlyUploadedDocuments((prev) => [
                            ...prev,
                            doc.id,
                          ]);
                          // Auto-select newly uploaded document
                          const current =
                            form.getValues("supporting_documents") || [];
                          if (!current.includes(doc.id)) {
                            form.setValue("supporting_documents", [
                              doc.id,
                              ...current,
                            ]);
                          }
                        }}
                        onDocumentDeleted={(id) => {
                          setClaimDocuments((prev) =>
                            prev.filter((d) => d.id !== id)
                          );
                          // Remove from newly uploaded tracking if it was just uploaded
                          setNewlyUploadedDocuments((prev) =>
                            prev.filter((docId) => docId !== id)
                          );
                          form.setValue(
                            "supporting_documents",
                            (
                              form.getValues("supporting_documents") || []
                            ).filter((d: number) => d !== id)
                          );
                        }}
                      />
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Covered Person:</span>
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
                        <span className="font-medium">
                          Supporting Documents:
                        </span>
                        <div className="mt-1">
                          {form.watch("supporting_documents")?.length || 0}{" "}
                          selected
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Contact Person:</span>
                        <div className="mt-1">
                          {form.watch("contact_details.name") || "Not provided"}
                          {form.watch("contact_details.is_policy_holder") ===
                            "no" &&
                            form.watch("contact_details.relationship") && (
                              <div className="text-xs text-muted-foreground">
                                ({form.watch("contact_details.relationship")} of
                                policy holder)
                              </div>
                            )}
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
                  type="submit"
                  disabled={isSubmitting || !hasValidDocuments}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Claim...
                    </>
                  ) : !hasValidDocuments ? (
                    "Upload Required Documents to Continue"
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
