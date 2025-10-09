"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  File,
  FileText,
  Download,
  Eye,
  AlertCircle,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { usePolicyDocuments } from "@/hooks/use-policy-documents";
import type { Database } from "@/lib/types";
import { createClient } from "@/lib/client";
import { format } from "date-fns";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];
type PolicyDocumentType = Database["public"]["Enums"]["policy_document_type"];

interface PolicyDocumentsListProps {
  policyId: number;
}

const DOCUMENT_TYPE_LABELS: Record<PolicyDocumentType, string> = {
  birth_certificate: "Birth Certificate",
  death_certificate: "Death Certificate",
  marriage_certificate: "Marriage Certificate",
  identity_document: "Identity Document",
  passport: "Passport",
  proof_of_banking: "Proof of Banking",
  payslip: "Payslip",
  drivers_license: "Driver's License",
  third_party_document: "Third Party Document",
};

const DOCUMENT_TYPE_COLORS: Record<PolicyDocumentType, string> = {
  birth_certificate: "bg-blue-100 text-blue-800",
  death_certificate: "bg-gray-100 text-gray-800",
  marriage_certificate: "bg-pink-100 text-pink-800",
  identity_document: "bg-green-100 text-green-800",
  passport: "bg-purple-100 text-purple-800",
  proof_of_banking: "bg-yellow-100 text-yellow-800",
  payslip: "bg-orange-100 text-orange-800",
  drivers_license: "bg-indigo-100 text-indigo-800",
  third_party_document: "bg-slate-100 text-slate-800",
};

export default function PolicyDocumentsList({
  policyId,
}: PolicyDocumentsListProps) {
  const {
    data: documents,
    isLoading,
    error,
    refetch,
  } = usePolicyDocuments(policyId);

  // Function to get public URL for viewing documents
  const getDocumentViewUrl = (documentPath: string) => {
    const supabase = createClient();
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(documentPath);
    return data.publicUrl;
  };

  // Function to get file extension from path
  const getFileExtension = (path: string) => {
    return path.split(".").pop()?.toLowerCase() || "";
  };

  // Function to get file icon based on extension
  const getFileIcon = (path: string) => {
    const extension = getFileExtension(path);

    if (["pdf"].includes(extension)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return <File className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // Function to handle document viewing
  const handleViewDocument = (document: PolicyDocumentRow) => {
    const url = getDocumentViewUrl(document.path);
    window.open(url, "_blank");
  };

  // Function to handle document download
  const handleDownloadDocument = async (doc: PolicyDocumentRow) => {
    try {
      const url = getDocumentViewUrl(doc.path);
      const response = await fetch(url);
      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${DOCUMENT_TYPE_LABELS[doc.document_type]}.${getFileExtension(doc.path)}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Policy Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Policy Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load documents. Please try again.
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Policy Documents
          </div>
          <Badge variant="secondary">
            {documents?.length || 0} document
            {documents?.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!documents || documents.length === 0 ? (
          <div className="text-center py-8">
            <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload documents using the form on the left
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(document.path)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={DOCUMENT_TYPE_COLORS[document.document_type]}
                      >
                        {DOCUMENT_TYPE_LABELS[document.document_type]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(document.created_at), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {document.user_id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(document)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(document)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
