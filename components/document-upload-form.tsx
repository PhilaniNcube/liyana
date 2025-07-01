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
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useRef, useEffect } from "react";
import { uploadDocument } from "@/lib/client-actions/documents";
import { revalidateDocuments } from "@/lib/actions/revalidate";
import { useOptimisticDocumentUpdate } from "@/hooks/use-documents";
import type { DocumentUploadState } from "@/lib/queries/documents";
import type { Database } from "@/lib/types";
import { DocumentCompletionModal } from "./document-completion-modal";

export const DOCUMENT_TYPES = {
  ID: "id",
  BANK_STATEMENT: "bank_statement",
  PAYSLIP: "payslip",
  PROOF_OF_RESIDENCE: "proof_of_residence",
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

type DocumentUploadFormProps = {
  applicationId: string;
  documents: Database["public"]["Tables"]["documents"]["Row"][];
  className?: string;
};

// Document configurations
const DOCUMENT_CONFIGS = {
  [DOCUMENT_TYPES.ID]: {
    title: "Identity Document",
    description:
      "Upload a clear copy of your ID document (you can upload multiple files if needed)",
    icon: FileText,
    allowedTypes: ["image/*", "application/pdf"] as string[],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiredCount: 1,
  },
  [DOCUMENT_TYPES.BANK_STATEMENT]: {
    title: "Bank Statement",
    description:
      "Upload your latest 3 bank statements (one for each of the last 3 months)",
    icon: CreditCard,
    allowedTypes: ["application/pdf", "image/*"] as string[],
    maxFileSize: 15 * 1024 * 1024, // 15MB
    requiredCount: 3,
  },
  [DOCUMENT_TYPES.PAYSLIP]: {
    title: "Payslip",
    description:
      "Upload your most recent 3 payslips (one for each of the last 3 months)",
    icon: Receipt,
    allowedTypes: ["application/pdf", "image/*"] as string[],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiredCount: 3,
  },
  [DOCUMENT_TYPES.PROOF_OF_RESIDENCE]: {
    title: "Proof of Residence",
    description:
      "Upload a utility bill or lease agreement (you can upload multiple files if needed)",
    icon: Home,
    allowedTypes: ["application/pdf", "image/*"] as string[],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiredCount: 1,
  },
} as const;

function DocumentUploadSection({
  documentType,
  applicationId,
  existingDocuments,
  onUploadSuccess,
}: {
  documentType: DocumentType;
  applicationId: string;
  existingDocuments: Database["public"]["Tables"]["documents"]["Row"][];
  onUploadSuccess: (
    document?: Database["public"]["Tables"]["documents"]["Row"]
  ) => void;
}) {
  const config = DOCUMENT_CONFIGS[documentType];
  const IconComponent = config.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<DocumentUploadState>({});
  const [isUploading, setIsUploading] = useState(false);

  // React Query optimistic update hook
  const optimisticUpdate = useOptimisticDocumentUpdate();

  const hasRequiredCount = existingDocuments.length >= config.requiredCount;
  const canUploadMore = existingDocuments.length < config.requiredCount;
  const remainingCount = Math.max(
    0,
    config.requiredCount - existingDocuments.length
  );

  // Auto-upload function that triggers immediately when file is selected
  const handleAutoUpload = async (file: File) => {
    setIsUploading(true);
    setUploadState({});

    try {
      const result = await uploadDocument(file, documentType, applicationId);
      setUploadState(result);

      if (result.success && result.document) {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Optimistically update the React Query cache
        optimisticUpdate(applicationId, result.document);

        // Also call the callback for local state updates
        onUploadSuccess(result.document);
      }
    } catch (error) {
      setUploadState({
        errors: {
          _form: ["An unexpected error occurred. Please try again."],
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (
      !config.allowedTypes.some((type) => {
        if (type === "image/*") return file.type.startsWith("image/");
        if (type === "application/pdf") return file.type === "application/pdf";
        return file.type === type;
      })
    ) {
      setUploadState({
        errors: {
          _form: ["Please select a valid file type (PDF or image)."],
        },
      });
      return;
    }

    // Validate file size
    if (file.size > config.maxFileSize) {
      setUploadState({
        errors: {
          _form: [
            `File size must be less than ${(
              config.maxFileSize /
              1024 /
              1024
            ).toFixed(0)}MB.`,
          ],
        },
      });
      return;
    }

    // Check if we can upload more files
    if (!canUploadMore) {
      setUploadState({
        errors: {
          _form: [
            `You have already uploaded the required ${config.requiredCount} files for this document type.`,
          ],
        },
      });
      return;
    }

    // Auto-upload the file immediately
    await handleAutoUpload(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  return (
    <Card
      className={cn(
        "transition-colors",
        hasRequiredCount && "border-green-200 bg-green-50/50"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              hasRequiredCount
                ? "bg-green-100 text-green-600"
                : "bg-muted text-muted-foreground"
            )}
          >
            <IconComponent size={20} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {config.title}
              {hasRequiredCount && (
                <CheckCircle size={16} className="text-green-600" />
              )}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Progress indicator for required documents */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span
              className={cn(
                "font-medium",
                hasRequiredCount ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {existingDocuments.length}/{config.requiredCount} uploaded
            </span>
          </div>
          <Progress
            value={(existingDocuments.length / config.requiredCount) * 100}
            className="h-2"
          />
          {remainingCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {remainingCount} more file{remainingCount > 1 ? "s" : ""} required
            </p>
          )}
        </div>

        {/* Display existing documents */}
        {existingDocuments.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-green-800">
              Uploaded Files ({existingDocuments.length}/{config.requiredCount})
            </h4>
            {existingDocuments.map((doc, index) => (
              <Alert key={doc.id} className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                  File {index + 1} Uploaded
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}{" "}
                  at {new Date(doc.uploaded_at).toLocaleTimeString()}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Upload area - show if more files are needed */}
        {canUploadMore && (
          <div className="space-y-4">
            {/* File Drop Zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 transition-colors text-center cursor-pointer hover:border-primary hover:bg-primary/5",
                isDragOver ? "border-primary bg-primary/10" : "border-gray-300",
                isUploading && "pointer-events-none opacity-50"
              )}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={config.allowedTypes.join(",")}
                onChange={handleInputChange}
                className="hidden"
                disabled={isUploading}
              />

              <div className="space-y-2">
                {isUploading ? (
                  <>
                    <Loader2
                      size={24}
                      className="mx-auto text-primary animate-spin"
                    />
                    <p className="text-sm font-medium">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload
                      size={24}
                      className="mx-auto text-muted-foreground"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        Drop your file here or{" "}
                        <span className="text-primary hover:underline">
                          browse
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum file size:{" "}
                        {(config.maxFileSize / 1024 / 1024).toFixed(0)}MB
                        {remainingCount > 0 && (
                          <>
                            {" "}
                            • {remainingCount} more file
                            {remainingCount > 1 ? "s" : ""} needed
                          </>
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Error Messages */}
            {uploadState.errors && (
              <div className="space-y-2">
                {Object.entries(uploadState.errors).map(([field, errors]) => (
                  <Alert key={field} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {Array.isArray(errors) ? errors.join(", ") : errors}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completion message */}
        {hasRequiredCount && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Complete</AlertTitle>
            <AlertDescription className="text-green-700">
              All required {config.title.toLowerCase()} files have been
              uploaded.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function DocumentUploadForm({
  applicationId,
  documents,
  className,
}: DocumentUploadFormProps) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Get existing documents by type (returns all documents of a type)
  const getDocumentsByType = (type: DocumentType) =>
    documents.filter((doc) => doc.document_type === type);

  // Check if a document type has at least one upload
  const hasDocumentType = (type: DocumentType) =>
    getDocumentsByType(type).length > 0;

  // Calculate overall progress
  const totalDocuments = Object.keys(DOCUMENT_TYPES).length;
  const uploadedDocuments = Object.values(DOCUMENT_TYPES).filter((type) =>
    hasDocumentType(type)
  ).length;
  const overallProgress = (uploadedDocuments / totalDocuments) * 100;

  const handleUploadSuccess = async (
    uploadedDocument?: Database["public"]["Tables"]["documents"]["Row"]
  ) => {
    // React Query handles the state updates automatically through optimistic updates
    // No need to manually update local state
  };

  const handleModalClose = () => {
    setShowCompletionModal(false);
  };

  // Check if all document types have at least one upload and show modal
  useEffect(() => {
    const allTypesHaveDocuments = Object.values(DOCUMENT_TYPES).every((type) =>
      hasDocumentType(type)
    );
    if (allTypesHaveDocuments && documents.length > 0 && !showCompletionModal) {
      setShowCompletionModal(true);
    }
  }, [documents, hasDocumentType, showCompletionModal]);

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle className="text-2xl">
                Upload Required Documents
              </CardTitle>
              <CardDescription>
                Please upload the following documents to complete your loan
                application
              </CardDescription>
            </div>{" "}
            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Document Types Progress
                </span>
                <span className="font-medium">
                  {uploadedDocuments}/{totalDocuments} types completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Total files uploaded: {documents.length}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>{" "}
      {/* Document Upload Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.values(DOCUMENT_TYPES).map((documentType) => (
          <DocumentUploadSection
            key={documentType}
            documentType={documentType}
            applicationId={applicationId}
            existingDocuments={getDocumentsByType(documentType)}
            onUploadSuccess={handleUploadSuccess}
          />
        ))}
      </div>
      {/* Summary Alert */}
      {uploadedDocuments === totalDocuments ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">
            All Documents Uploaded
          </AlertTitle>
          <AlertDescription className="text-green-700">
            You have successfully uploaded all required documents. Your
            application can now proceed to the next stage.
          </AlertDescription>
        </Alert>
      ) : uploadedDocuments > 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Partial Upload Complete</AlertTitle>
          <AlertDescription>
            You have uploaded {uploadedDocuments} out of {totalDocuments}{" "}
            required documents. Please upload the remaining documents to
            complete your application.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Documents Required</AlertTitle>
          <AlertDescription>
            Please upload all {totalDocuments} required documents to proceed
            with your loan application.
          </AlertDescription>{" "}
        </Alert>
      )}{" "}
      {/* Document Completion Modal */}
      <DocumentCompletionModal
        isOpen={showCompletionModal}
        onClose={handleModalClose}
        applicationId={applicationId}
      />
    </div>
  );
}
