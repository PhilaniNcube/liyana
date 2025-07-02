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
import { useQueryState, parseAsBoolean } from "nuqs";
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

        // Revalidate routes to ensure UI is updated everywhere
        await revalidateDocuments(applicationId);

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
      <CardHeader className="">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-1.5 rounded-lg",
              hasRequiredCount
                ? "bg-green-100 text-green-600"
                : "bg-muted text-muted-foreground"
            )}
          >
            <IconComponent size={18} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {config.title}
              {hasRequiredCount && (
                <CheckCircle size={14} className="text-green-600" />
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {config.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Progress indicator for required documents */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
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
            className="h-1.5"
          />
          {remainingCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {remainingCount} more file{remainingCount > 1 ? "s" : ""} required
            </p>
          )}
        </div>

        {/* Display existing documents */}
        {existingDocuments.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-green-800 flex items-center gap-2">
              <CheckCircle size={14} className="text-green-600" />
              Uploaded Files ({existingDocuments.length}/{config.requiredCount})
            </h4>
            <div className="space-y-1">
              {existingDocuments.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded px-2 py-1"
                >
                  <FileText size={12} />
                  <span>File {index + 1}</span>
                  <span className="text-green-600">•</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload area - show if more files are needed */}
        {canUploadMore && (
          <div className="space-y-3">
            {/* Compact file upload button */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {isUploading ? "Uploading..." : "Choose File"}
              </Button>

              <div className="text-sm text-muted-foreground">
                {remainingCount > 0 && (
                  <span className="font-medium text-foreground">
                    {remainingCount} more file{remainingCount > 1 ? "s" : ""}{" "}
                    needed
                  </span>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={config.allowedTypes.join(",")}
              onChange={handleInputChange}
              className="hidden"
              disabled={isUploading}
            />

            <p className="text-xs text-muted-foreground">
              Max file size: {(config.maxFileSize / 1024 / 1024).toFixed(0)}MB •
              PDF or image files only
            </p>

            {/* Error Messages */}
            {uploadState.errors && (
              <div className="space-y-1">
                {Object.entries(uploadState.errors).map(([field, errors]) => (
                  <div
                    key={field}
                    className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded px-2 py-1.5 border border-red-200"
                  >
                    <AlertCircle size={14} />
                    <span>
                      {Array.isArray(errors) ? errors.join(", ") : errors}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completion message */}
        {hasRequiredCount && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded px-2 py-1.5 border border-green-200">
            <CheckCircle size={14} className="text-green-600" />
            <span className="font-medium">Complete:</span>
            <span>All required files uploaded</span>
          </div>
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
  // Use nuqs to manage modal state via URL params
  const [showCompletionModal, setShowCompletionModal] = useQueryState(
    "showCompletionModal",
    parseAsBoolean.withDefault(false)
  );

  // Get existing documents by type (returns all documents of a type)
  const getDocumentsByType = (type: DocumentType) =>
    documents.filter((doc) => doc.document_type === type);

  // Check if a document type has at least one upload
  const hasDocumentType = (type: DocumentType) =>
    getDocumentsByType(type).length > 0;

  // Check if all document types are complete
  const allTypesHaveDocuments = Object.values(DOCUMENT_TYPES).every((type) =>
    hasDocumentType(type)
  );

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

    // Check if all documents are now complete and show modal if needed
    // We need to check the updated state after the upload
    setTimeout(() => {
      const updatedDocuments = uploadedDocument
        ? [...documents, uploadedDocument]
        : documents;

      const allComplete = Object.values(DOCUMENT_TYPES).every((type) => {
        const docsOfType = updatedDocuments.filter(
          (doc) => doc.document_type === type
        );
        return docsOfType.length > 0;
      });

      if (allComplete && !showCompletionModal) {
        setShowCompletionModal(true);
      }
    }, 100); // Small delay to ensure state is updated
  };

  // Automatically show modal when all documents are complete
  useEffect(() => {
    if (allTypesHaveDocuments && documents.length > 0 && !showCompletionModal) {
      setShowCompletionModal(true);
    }
  }, [
    allTypesHaveDocuments,
    documents.length,
    showCompletionModal,
    setShowCompletionModal,
  ]);

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-4", className)}>
      <Card>
        <CardHeader className="">
          <div className="space-y-2">
            <div>
              <CardTitle className="text-lg">
                Upload Required Documents
              </CardTitle>
              <CardDescription className="text-sm">
                Please upload the following documents to complete your loan
                application
              </CardDescription>
            </div>
            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Document Types Progress
                </span>
                <span className="font-medium">
                  {uploadedDocuments}/{totalDocuments} types completed
                </span>
              </div>
              <Progress value={overallProgress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                Total files uploaded: {documents.length}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
      {/* Document Upload Sections */}
      <div className="grid gap-2 md:grid-cols-1">
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
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
          <CheckCircle size={16} className="text-green-600" />
          <div>
            <span className="font-medium">All Documents Uploaded:</span>
            <span className="ml-1">
              Your application can now proceed to the next stage.
            </span>
          </div>
        </div>
      ) : uploadedDocuments > 0 ? (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
          <AlertCircle size={16} className="text-blue-600" />
          <div>
            <span className="font-medium">Partial Upload:</span>
            <span className="ml-1">
              {uploadedDocuments} of {totalDocuments} document types completed.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          <AlertCircle size={16} className="text-amber-600" />
          <div>
            <span className="font-medium">Documents Required:</span>
            <span className="ml-1">
              Please upload all {totalDocuments} required documents to proceed.
            </span>
          </div>
        </div>
      )}
      {/* Document Completion Modal */}
      <DocumentCompletionModal applicationId={applicationId} />
    </div>
  );
}
