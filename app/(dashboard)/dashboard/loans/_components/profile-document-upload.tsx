"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/types";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";

type DocumentType = Database["public"]["Enums"]["document_type"];

const schema = z.object({
  documentType: z.string().min(1, "Select a document type"),
  file: z.any().refine((f) => f && f.length > 0, "Please choose a file"),
});

type FormValues = z.infer<typeof schema>;

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id: "ID Document",
  bank_statement: "Bank Statement",
  payslip: "Payslip",
  proof_of_residence: "Proof of Residence",
  contract: "Contract",
  photo: "Photo",
  credit_report: "Credit Report",
  other: "Other",
};

export function ProfileDocumentUpload({
  profileId,
  className,
  onUploadedAction,
}: {
  profileId: string;
  className?: string;
  onUploadedAction?: () => void;
}) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { documentType: "" },
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSuccess(null);
    try {
      const supabase = createClient();

      // Ensure user is authenticated
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth?.user) {
        throw new Error("You must be signed in to upload documents");
      }

      // 1) Validate and upload the file directly to Supabase Storage (documents bucket)
      const file: File = values.file[0];

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File size exceeds 10MB limit");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file type. Upload images, PDF, or Word docs.");
      }
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `profile-documents/${profileId}/${timestamp}-${sanitizedName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError || !uploadData?.path) {
        throw new Error(uploadError?.message || "Failed to upload file");
      }

      // 2) Insert record into profile_documents
      const { error: insertError } = await supabase
        .from("profile_documents")
        .insert({
          profile_id: profileId,
          document_type: values.documentType as DocumentType,
          path: uploadData.path,
        })
        .single();

      if (insertError) {
        throw new Error(
          insertError.message || "Failed to save document record"
        );
      }

      setSuccess("Document uploaded successfully");
      reset();
      onUploadedAction?.();
      // Revalidate this route to ensure fresh data (documents list)
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Unexpected error");
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document type</Label>
              <Controller
                control={control}
                name="documentType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full" id="documentType">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(DOCUMENT_TYPE_LABELS).map((key) => (
                        <SelectItem key={key} value={key}>
                          {DOCUMENT_TYPE_LABELS[key as DocumentType]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.documentType && (
                <p className="text-xs text-red-600">
                  {errors.documentType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Controller
                control={control}
                name="file"
                render={({ field }) => (
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => field.onChange(e.target.files)}
                  />
                )}
              />
              {errors.file && (
                <p className="text-xs text-red-600">
                  {String(errors.file.message)}
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
