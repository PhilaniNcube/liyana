"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import {
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Receipt,
  Home,
  Upload,
  Loader2,
  X,
  File,
  Image,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import type { Database } from "@/lib/types";

// Document types matching the database enum
export const DOCUMENT_TYPES = {
  ID: "id",
  BANK_STATEMENT: "bank_statement",
  PAYSLIP: "payslip",
  PROOF_OF_RESIDENCE: "proof_of_residence",
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

// Document configurations
const DOCUMENT_CONFIGS = {
  [DOCUMENT_TYPES.ID]: {
    title: "Identity Document",
    icon: FileText,
    color: "blue",
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  [DOCUMENT_TYPES.BANK_STATEMENT]: {
    title: "Bank Statement",
    icon: CreditCard,
    color: "green",
    maxFileSize: 15 * 1024 * 1024, // 15MB
  },
  [DOCUMENT_TYPES.PAYSLIP]: {
    title: "Payslip",
    icon: Receipt,
    color: "purple",
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  [DOCUMENT_TYPES.PROOF_OF_RESIDENCE]: {
    title: "Proof of Residence",
    icon: Home,
    color: "orange",
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
} as const;

// Allowed file types
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

interface FileWithPreview extends File {
  preview: string;
}

interface AdminDocumentUploadFormProps {
  applicationId: string;
  documents: Database["public"]["Tables"]["documents"]["Row"][];
  onUploadSuccess?: (
    document: Database["public"]["Tables"]["documents"]["Row"]
  ) => void;
  className?: string;
}

export function AdminDocumentUploadForm({
  applicationId,
  documents,
  onUploadSuccess,
  className,
}: AdminDocumentUploadFormProps) {
  const [selectedDocumentType, setSelectedDocumentType] = useState<
    DocumentType | ""
  >("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Get documents by type
  const getDocumentsByType = (type: DocumentType) =>
    documents.filter((doc) => doc.document_type === type);

  // Calculate progress
  const totalTypes = Object.keys(DOCUMENT_TYPES).length;
  const completedTypes = Object.values(DOCUMENT_TYPES).filter(
    (type) => getDocumentsByType(type).length > 0
  ).length;
  const progressPercentage = (completedTypes / totalTypes) * 100;

  // File validation
  const validateFile = useCallback(
    (file: File) => {
      const errors: string[] = [];

      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push("Only PDF, JPEG, JPG, and PNG files are allowed");
      }

      // Check file size if document type is selected
      if (selectedDocumentType) {
        const config = DOCUMENT_CONFIGS[selectedDocumentType];
        if (file.size > config.maxFileSize) {
          const maxSizeMB = (config.maxFileSize / 1024 / 1024).toFixed(0);
          errors.push(`File size must be less than ${maxSizeMB}MB`);
        }
      }

      return errors;
    },
    [selectedDocumentType]
  );

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles: FileWithPreview[] = [];
      const allErrors: string[] = [];

      acceptedFiles.forEach((file) => {
        const fileErrors = validateFile(file);
        if (fileErrors.length === 0) {
          const fileWithPreview = Object.assign(file, {
            preview: URL.createObjectURL(file),
          });
          validFiles.push(fileWithPreview);
        } else {
          allErrors.push(`${file.name}: ${fileErrors.join(", ")}`);
        }
      });

      setFiles((prev) => [...prev, ...validFiles]);
      setErrors(allErrors);
    },
    [validateFile]
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
  });

  // Remove file from selection
  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => {
      const newFiles = prev.filter((_, index) => index !== indexToRemove);
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(prev[indexToRemove].preview);
      return newFiles;
    });
  };

  // Upload documents
  const uploadDocuments = async () => {
    if (!selectedDocumentType) {
      toast.error("Please select a document type");
      return;
    }

    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setUploading(true);
    setErrors([]);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", selectedDocumentType);
        formData.append("applicationId", applicationId);

        const response = await fetch("/api/admin/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        return response.json();
      });

      const results = await Promise.allSettled(uploadPromises);
      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failedCount = results.length - successCount;

      // Handle failed uploads
      const failedErrors = results
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason.message);

      if (failedErrors.length > 0) {
        setErrors(failedErrors);
      }

      // Show success message
      if (successCount > 0) {
        toast.success(
          `Successfully uploaded ${successCount} document${successCount > 1 ? "s" : ""}`
        );

        // Clear successful files
        setFiles([]);

        // Call success callback if provided
        if (onUploadSuccess) {
          results.forEach((result) => {
            if (result.status === "fulfilled") {
              onUploadSuccess(result.value.document);
            }
          });
        }
      }

      if (failedCount > 0) {
        toast.error(
          `${failedCount} file${failedCount > 1 ? "s" : ""} failed to upload`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An unexpected error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  // Clear all files
  const clearAllFiles = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview));
    setFiles([]);
    setErrors([]);
  };

  return (
    <div className={cn("space-y-6 mt-6", className)}>
      {/* Progress Overview */}

      <div className="grid grid-cols-1 gap-4">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Upload New Documents</CardTitle>
            <CardDescription>
              Upload documents for this application (Admin Only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select
                value={selectedDocumentType}
                onValueChange={(value) =>
                  setSelectedDocumentType(value as DocumentType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CONFIGS).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <config.icon size={16} />
                        {config.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm font-medium mb-2">
                {isDragActive
                  ? "Drop files here"
                  : "Drag and drop files here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPEG, JPG, PNG files only
                {selectedDocumentType && (
                  <span className="block mt-1">
                    Max file size:{" "}
                    {(
                      DOCUMENT_CONFIGS[selectedDocumentType].maxFileSize /
                      1024 /
                      1024
                    ).toFixed(0)}
                    MB
                  </span>
                )}
              </p>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded px-3 py-2 border border-red-200"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </div>
                ))}
              </div>
            )}

            {/* File Preview */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Selected Files ({files.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFiles}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid gap-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-shrink-0">
                        {file.type.startsWith("image/") ? (
                          <div className="w-10 h-10 rounded border overflow-hidden">
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded border bg-red-100 flex items-center justify-center">
                            <File size={20} className="text-red-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-end space-x-2">
              <Button
                onClick={uploadDocuments}
                disabled={
                  uploading || files.length === 0 || !selectedDocumentType
                }
                className="min-w-[120px]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {files.length} File{files.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
