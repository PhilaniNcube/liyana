"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CreditCard,
  Receipt,
  Home,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/client";
import { useState } from "react";
import { toast } from "sonner";
import type { Database } from "@/lib/types";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface DocumentsDisplayCardProps {
  applicationId: number;
  documents: Document[];
}

// Document type configurations
const DOCUMENT_CONFIGS = {
  id: {
    title: "Identity Document",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  bank_statement: {
    title: "Bank Statement",
    icon: CreditCard,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  payslip: {
    title: "Payslip",
    icon: Receipt,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  proof_of_residence: {
    title: "Proof of Residence",
    icon: Home,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
} as const;

const REQUIRED_DOCUMENT_TYPES = [
  "id",
  "bank_statement",
  "payslip",
  "proof_of_residence",
] as const;

export function DocumentsDisplayCard({
  applicationId,
  documents,
}: DocumentsDisplayCardProps) {
  const [downloadingDoc, setDownloadingDoc] = useState<number | null>(null);

  // Group documents by type
  const documentsByType = documents.reduce(
    (acc, doc) => {
      const type = doc.document_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, Document[]>
  );

  // Calculate completion status
  const uploadedTypes = Object.keys(documentsByType);
  const missingTypes = REQUIRED_DOCUMENT_TYPES.filter(
    (type) => !uploadedTypes.includes(type)
  );
  const completionPercentage =
    (uploadedTypes.length / REQUIRED_DOCUMENT_TYPES.length) * 100;

  const handleDownload = async (doc: Document) => {
    setDownloadingDoc(doc.id);
    try {
      const supabase = createClient();

      // For public bucket, get the direct public URL
      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(doc.storage_path);

      if (!data?.publicUrl) {
        throw new Error("Failed to get public URL");
      }

      // Create download link
      const link = document.createElement("a");
      link.href = data.publicUrl;
      link.download = `${DOCUMENT_CONFIGS[doc.document_type as keyof typeof DOCUMENT_CONFIGS]?.title || doc.document_type}_${doc.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Document download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handlePreview = async (doc: Document) => {
    try {
      const supabase = createClient();

      console.log("Attempting to preview document:", {
        id: doc.id,
        storage_path: doc.storage_path,
        document_type: doc.document_type,
      });

      // For public bucket, construct the direct public URL
      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(doc.storage_path);

      if (!data?.publicUrl) {
        throw new Error("Failed to get public URL");
      }

      console.log("Successfully got public URL:", data.publicUrl);

      // Check if it's a PDF - use embed for PDFs, otherwise try to open in new tab
      const isPDF = doc.storage_path.toLowerCase().endsWith(".pdf");

      if (isPDF) {
        // For PDFs, create a more robust preview
        const previewWindow = window.open("", "_blank");
        if (previewWindow) {
          previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Document Preview - ${doc.document_type}</title>
                <style>
                  body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
                  .container { width: 100%; height: 100vh; display: flex; flex-direction: column; }
                  .header { background: #f8f9fa; padding: 1rem; border-bottom: 1px solid #e9ecef; }
                  .content { flex: 1; }
                  embed, iframe { width: 100%; height: 100%; border: none; }
                  .fallback { padding: 2rem; text-align: center; }
                  .fallback a { color: #0066cc; text-decoration: none; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h2 style="margin: 0;">Document Preview: ${doc.document_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</h2>
                    <p style="margin: 0.5rem 0 0 0; color: #666;">Uploaded: ${format(new Date(doc.uploaded_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                  <div class="content">
                    <embed src="${data.publicUrl}" type="application/pdf">
                      <div class="fallback">
                        <p>Unable to display PDF in browser.</p>
                        <a href="${data.publicUrl}" target="_blank">Click here to download and view the document</a>
                      </div>
                    </embed>
                  </div>
                </div>
              </body>
            </html>
          `);
          previewWindow.document.close();
        } else {
          toast.error("Popup blocked. Please allow popups and try again.");
        }
      } else {
        // For images and other files, try direct opening
        const previewWindow = window.open(data.publicUrl, "_blank");
        if (!previewWindow) {
          toast.error("Popup blocked. Please allow popups and try again.");
        }
      }
    } catch (error) {
      console.error("Preview error:", error);

      // Provide more specific error messages
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("Object not found")) {
        toast.error(
          "Document file not found in storage. The file may have been moved or deleted."
        );
      } else if (errorMessage.includes("not allowed")) {
        toast.error(
          "Access denied. You don't have permission to view this document."
        );
      } else {
        toast.error(
          `Failed to preview document: ${errorMessage || "Unknown error"}`
        );
      }
    }
  };

  if (documents.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No documents have been uploaded for this application yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({documents.length} files)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Overview */}

          {/* Documents by Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REQUIRED_DOCUMENT_TYPES.map((documentType) => {
              const typeDocuments = documentsByType[documentType] || [];
              const config =
                DOCUMENT_CONFIGS[documentType as keyof typeof DOCUMENT_CONFIGS];
              const IconComponent = config.icon;

              return (
                <div
                  key={documentType}
                  className={`border rounded-lg p-4 ${
                    typeDocuments.length > 0
                      ? config.borderColor
                      : "border-gray-200"
                  } ${typeDocuments.length > 0 ? config.bgColor : "bg-gray-50"}`}
                >
                  <div className="flex flex-col items-center text-center gap-3 mb-3">
                    <div
                      className={`p-3 rounded-lg ${typeDocuments.length > 0 ? "bg-white" : "bg-gray-100"}`}
                    >
                      <IconComponent
                        className={`h-6 w-6 ${typeDocuments.length > 0 ? config.color : "text-gray-400"}`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{config.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {typeDocuments.length} file
                        {typeDocuments.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {typeDocuments.length > 0 && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  {/* Document Files */}
                  {typeDocuments.length > 0 && (
                    <div className="space-y-2">
                      {typeDocuments.map((doc, index) => (
                        <div
                          key={doc.id}
                          className="bg-white border rounded-lg p-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">
                                  File #{index + 1}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(doc.uploaded_at), "MMM d")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(doc)}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                disabled={downloadingDoc === doc.id}
                                className="h-6 w-6 p-0"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Total Documents:</span>
              <span className="font-medium">{documents.length} files</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Document Types:</span>
              <span className="font-medium">
                {uploadedTypes.length}/{REQUIRED_DOCUMENT_TYPES.length} complete
              </span>
            </div>
            {documents.length > 0 && (
              <div className="flex justify-between text-sm">
                <span>Latest Upload:</span>
                <span className="font-medium">
                  {format(
                    new Date(
                      Math.max(
                        ...documents.map((d) =>
                          new Date(d.uploaded_at).getTime()
                        )
                      )
                    ),
                    "MMM d, yyyy"
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
