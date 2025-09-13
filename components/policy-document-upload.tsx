"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  File,
  FileText,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { policyDocumentSchema, type PolicyDocumentInput } from "@/lib/schemas";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/client";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];
type PolicyDocumentType = Database["public"]["Enums"]["policy_document_type"];

interface PolicyDocumentUploadProps {
  policyId: number;
  existingDocuments?: PolicyDocumentRow[];
  onDocumentUploaded?: (document: PolicyDocumentRow) => void;
  onDocumentDeleted?: (documentId: number) => void;
}

interface PendingUpload {
  id: string;
  file: File;
  documentType: PolicyDocumentType | "";
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

const DOCUMENT_TYPE_LABELS: Record<PolicyDocumentType, string> = {
  birth_certificate: "Birth Certificate",
  death_certificate: "Death Certificate",
  marriage_certificate: "Marriage Certificate",
  identity_document: "Identity Document",
  passport: "Passport",
  third_party_document: "Third Party Document",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

export default function PolicyDocumentUpload({
  policyId,
  existingDocuments = [],
  onDocumentUploaded,
  onDocumentDeleted,
}: PolicyDocumentUploadProps) {
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to get public URL for viewing documents
  const getDocumentViewUrl = (documentPath: string) => {
    const supabase = createClient();
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(documentPath);
    return data.publicUrl;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(
          `File ${file.name} is not a supported format. Please use JPG, PNG, or PDF.`
        );
        return;
      }

      const pendingUpload: PendingUpload = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        documentType: "",
        status: "pending",
      };

      setPendingUploads((prev) => [...prev, pendingUpload]);
    });

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updatePendingUpload = (id: string, updates: Partial<PendingUpload>) => {
    setPendingUploads((prev) =>
      prev.map((upload) =>
        upload.id === id ? { ...upload, ...updates } : upload
      )
    );
  };

  const removePendingUpload = (id: string) => {
    setPendingUploads((prev) => prev.filter((upload) => upload.id !== id));
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `policies/${policyId}`);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.path;
  };

  const saveDocumentToDatabase = async (
    input: PolicyDocumentInput
  ): Promise<PolicyDocumentRow> => {
    const response = await fetch("/api/policy-documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error("Failed to save document");
    }

    return response.json();
  };

  const handleUploadAll = async () => {
    const uploadsToProcess = pendingUploads.filter(
      (upload) => upload.status === "pending" && upload.documentType
    );

    if (uploadsToProcess.length === 0) {
      alert("Please select document types for all files before uploading.");
      return;
    }

    setIsUploading(true);

    for (const upload of uploadsToProcess) {
      try {
        updatePendingUpload(upload.id, { status: "uploading" });

        // Upload file
        const filePath = await uploadFile(upload.file);

        // Validate and save to database
        const documentData = policyDocumentSchema.parse({
          policy_id: policyId,
          document_type: upload.documentType,
          path: filePath,
        });

        const savedDocument = await saveDocumentToDatabase(documentData);

        updatePendingUpload(upload.id, { status: "success" });
        onDocumentUploaded?.(savedDocument);

        // Remove from pending after a short delay
        setTimeout(() => removePendingUpload(upload.id), 2000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        updatePendingUpload(upload.id, {
          status: "error",
          error: errorMessage,
        });
      }
    }

    setIsUploading(false);
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      const response = await fetch(`/api/policy-documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      onDocumentDeleted?.(documentId);
    } catch (error) {
      alert("Failed to delete document. Please try again.");
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Policy Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: JPG, PNG, PDF. Maximum size: 10MB per file.
            </p>
          </div>

          {/* Pending Uploads */}
          {pendingUploads.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Files to Upload</h4>
                <Button
                  onClick={handleUploadAll}
                  disabled={
                    isUploading || pendingUploads.every((u) => !u.documentType)
                  }
                  size="sm"
                >
                  {isUploading ? "Uploading..." : "Upload All"}
                </Button>
              </div>

              {pendingUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getFileIcon(upload.file.name)}
                      <span className="text-sm font-medium truncate">
                        {upload.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(upload.file.size)}
                      </span>
                    </div>

                    {upload.status === "error" && (
                      <p className="text-xs text-red-500 mt-1">
                        {upload.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={upload.documentType}
                      onValueChange={(value: PolicyDocumentType) =>
                        updatePendingUpload(upload.id, { documentType: value })
                      }
                      disabled={upload.status === "uploading"}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DOCUMENT_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {upload.status === "uploading" && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    )}

                    {upload.status === "success" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}

                    {upload.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePendingUpload(upload.id)}
                      disabled={upload.status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {existingDocuments.length > 0 ? (
            <div className="space-y-3">
              {existingDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(document.path)}
                    <div>
                      <p className="text-sm font-medium">
                        {DOCUMENT_TYPE_LABELS[document.document_type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded on{" "}
                        {new Date(document.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(getDocumentViewUrl(document.path), "_blank")
                      }
                    >
                      <Download className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Documents Uploaded
              </h3>
              <p className="text-muted-foreground">
                Upload policy documents to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
