"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  File,
  Image,
  FileText,
  Loader2,
  CheckCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import type { Database } from "@/lib/types";

type DocumentType = Database["public"]["Enums"]["document_type"];
type ProfileDocument = Database["public"]["Tables"]["profile_documents"]["Row"];

interface ProfileDocumentUploadProps {
  profileId: string;
  onUploadSuccess?: (document: ProfileDocument) => void;
  className?: string;
}

interface UploadedFile {
  file: File;
  documentType: DocumentType | "";
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  path?: string;
  errorMessage?: string;
}

const DOCUMENT_TYPE_OPTIONS: {
  value: DocumentType;
  label: string;
  description: string;
}[] = [
  {
    value: "id",
    label: "ID Document",
    description: "South African ID, passport, or driver's license",
  },
  {
    value: "bank_statement",
    label: "Bank Statement",
    description: "Recent bank statement (last 3 months)",
  },
  {
    value: "payslip",
    label: "Payslip",
    description: "Recent payslip or salary certificate",
  },
  {
    value: "proof_of_residence",
    label: "Proof of Residence",
    description: "Utility bill or municipal account",
  },
  {
    value: "contract",
    label: "Contract",
    description: "Employment or service contract",
  },
  {
    value: "photo",
    label: "Photo",
    description: "Profile or identification photo",
  },
  {
    value: "credit_report",
    label: "Credit Report",
    description: "Credit bureau report",
  },
  { value: "other", label: "Other", description: "Other supporting documents" },
  {
    value: "third_party_verification",
    label: "Third Party Verification",
    description: "Documents required for third party verification",
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function ProfileDocumentUpload({
  profileId,
  onUploadSuccess,
  className,
}: ProfileDocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 10MB limit";
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload images, PDF, or Word documents.";
    }

    return null;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    }
    if (fileType === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-600" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const newFiles: UploadedFile[] = files.map((file) => {
      const validationError = validateFile(file);
      return {
        file,
        documentType: "" as DocumentType | "",
        progress: 0,
        status: validationError ? "error" : "pending",
        errorMessage: validationError || undefined,
      };
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateFileDocumentType = (
    index: number,
    documentType: DocumentType
  ) => {
    setUploadedFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, documentType } : file))
    );
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (
    fileData: UploadedFile,
    index: number
  ): Promise<void> => {
    if (!fileData.documentType) {
      throw new Error("Please select a document type");
    }

    // Update status to uploading
    setUploadedFiles((prev) =>
      prev.map((file, i) =>
        i === index ? { ...file, status: "uploading", progress: 0 } : file
      )
    );

    const supabase = createClient();

    try {
      // Validate file size and type on client-side as well
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileData.file.size > maxSize) {
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

      if (!allowedTypes.includes(fileData.file.type)) {
        throw new Error(
          "Invalid file type. Please upload images, PDF, or Word documents."
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = fileData.file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      );
      const fileName = `profile-documents/${profileId}/${timestamp}-${sanitizedFileName}`;

      // Update progress to 25% before upload
      setUploadedFiles((prev) =>
        prev.map((file, i) => (i === index ? { ...file, progress: 25 } : file))
      );

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, fileData.file, {
          contentType: fileData.file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload file");
      }

      // Update progress to 75% after file upload
      setUploadedFiles((prev) =>
        prev.map((file, i) =>
          i === index ? { ...file, progress: 75, path: uploadData.path } : file
        )
      );

      // Save document record to database
      const saveResponse = await fetch("/api/profile-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId,
          documentType: fileData.documentType,
          path: uploadData.path,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Failed to save document record");
      }

      const saveResult = await saveResponse.json();

      // Update to success
      setUploadedFiles((prev) =>
        prev.map((file, i) =>
          i === index ? { ...file, status: "success", progress: 100 } : file
        )
      );

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(saveResult.document);
      }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = uploadedFiles.filter(
      (file) => file.status === "pending" && file.documentType
    );

    if (pendingFiles.length === 0) {
      toast.error(
        "No valid files to upload. Please select files and document types."
      );
      return;
    }

    setIsUploading(true);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        if (file.status === "pending" && file.documentType) {
          try {
            await uploadFile(file, i);
            toast.success(`${file.file.name} uploaded successfully`);
          } catch (error) {
            console.error(`Error uploading ${file.file.name}:`, error);
            const errorMessage =
              error instanceof Error ? error.message : "Upload failed";

            setUploadedFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, status: "error", errorMessage } : f
              )
            );

            toast.error(`Failed to upload ${file.file.name}: ${errorMessage}`);
          }
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const hasValidFiles = uploadedFiles.some(
    (file) => file.status === "pending" && file.documentType
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Profile Documents
        </CardTitle>
        <CardDescription>
          Upload documents associated with this profile. Maximum file size:
          10MB. Supported formats: Images (JPEG, PNG, WebP), PDF, Word
          documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div>
          <Label htmlFor="file-upload">Select Files</Label>
          <Input
            id="file-upload"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="mt-1"
          />
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <Label>Selected Files</Label>
            {uploadedFiles.map((uploadedFile, index) => (
              <div
                key={`${uploadedFile.file.name}-${index}`}
                className="border rounded-lg p-3 space-y-3"
              >
                {/* File Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFileIcon(uploadedFile.file.type)}
                    <div>
                      <p className="text-sm font-medium">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadedFile.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedFile.status === "success" && (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                    {uploadedFile.status === "error" && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                    {uploadedFile.status === "uploading" && (
                      <Badge variant="secondary">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Uploading
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploadedFile.status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Document Type Selection */}
                {uploadedFile.status !== "success" &&
                  !uploadedFile.errorMessage && (
                    <div>
                      <Label className="text-xs">Document Type</Label>
                      <Select
                        value={uploadedFile.documentType}
                        onValueChange={(value: DocumentType) =>
                          updateFileDocumentType(index, value)
                        }
                        disabled={uploadedFile.status === "uploading"}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <div className="font-medium">
                                  {option.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                {/* Progress Bar */}
                {uploadedFile.status === "uploading" && (
                  <div>
                    <Progress value={uploadedFile.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploadedFile.progress}% complete
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {uploadedFile.errorMessage && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {uploadedFile.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {uploadedFiles.length > 0 && (
          <Button
            onClick={handleUploadAll}
            disabled={!hasValidFiles || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload All Documents
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
