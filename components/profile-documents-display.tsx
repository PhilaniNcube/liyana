"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Image,
  File,
  Download,
  Calendar,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/lib/types";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import {
  useProfileDocuments,
  useInvalidateProfileDocuments,
  type NormalizedDocument,
} from "@/hooks/use-profile-documents";

type ProfileDocument = Database["public"]["Tables"]["profile_documents"]["Row"];
type DocumentType = Database["public"]["Enums"]["document_type"];

interface ProfileDocumentsDisplayProps {
  profileId: string;
  documents?: ProfileDocument[]; // optional preloaded profile documents
  onRefresh?: () => void;
  className?: string;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  id: "ID Document",
  bank_statement: "Bank Statement",
  payslip: "Payslip",
  proof_of_residence: "Proof of Residence",
  contract: "Contract",
  photo: "Photo",
  credit_report: "Credit Report",
  other: "Other",
  third_party_verification: "Third Party Verification",
};

const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  id: "bg-blue-100 text-blue-800",
  bank_statement: "bg-green-100 text-green-800",
  payslip: "bg-purple-100 text-purple-800",
  proof_of_residence: "bg-orange-100 text-orange-800",
  contract: "bg-indigo-100 text-indigo-800",
  photo: "bg-pink-100 text-pink-800",
  credit_report: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800",
  third_party_verification: "bg-teal-100 text-teal-800",
};

export function ProfileDocumentsDisplay({
  profileId,
  documents: initialDocuments,
  onRefresh,
  className,
}: ProfileDocumentsDisplayProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const invalidateProfileDocuments = useInvalidateProfileDocuments();

  const {
    data: documents = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useProfileDocuments(profileId, initialDocuments);

  // Show loading if we're fetching and have no documents
  const shouldShowLoading = (isLoading || isFetching) && documents.length === 0;

  const PUBLIC_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents`;

  const buildPublicUrl = (path: string) => `${PUBLIC_BASE_URL}/${path}`;

  const handleRefresh = async () => {
    try {
      await refetch();
      onRefresh?.();
      invalidateProfileDocuments(profileId);
      toast.success("Documents refreshed successfully");
    } catch (error) {
      console.error("Error refreshing documents:", error);
      toast.error("Failed to refresh documents");
    }
  };

  const grouped = useMemo(() => {
    const grouped = documents.reduce(
      (acc, doc) => {
        (acc[doc.document_type] ||= []).push(doc);
        return acc;
      },
      {} as Record<DocumentType, NormalizedDocument[]>
    );

    // Sort documents within each group by creation date (latest first)
    Object.keys(grouped).forEach((docType) => {
      grouped[docType as DocumentType].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return grouped;
  }, [documents]);

  const getDocumentIcon = (documentType: DocumentType) => {
    switch (documentType) {
      case "photo":
        return <Image className="h-4 w-4" />;
      case "id":
      case "bank_statement":
      case "payslip":
      case "proof_of_residence":
      case "contract":
      case "credit_report":
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) =>
    formatDistanceToNow(new Date(dateString), { addSuffix: true });

  const handleDownload = async (doc: NormalizedDocument) => {
    setIsDownloading(`${doc.source}-${doc.id}`);
    try {
      const resp = await fetch(
        `/api/documents/download?path=${encodeURIComponent(doc.path)}`
      );
      if (!resp.ok) throw new Error("Failed to get download URL");
      const json = await resp.json();
      const link = document.createElement("a");
      link.href = json.signedUrl;
      link.download = `${DOCUMENT_TYPE_LABELS[doc.document_type]}_${doc.created_at}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Document download started");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    } finally {
      setIsDownloading(null);
    }
  };

  const handlePreview = (doc: NormalizedDocument) => {
    const url = buildPublicUrl(doc.path);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({documents.length})
            </CardTitle>
            <CardDescription>
              Profile and application documents for this borrower
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {shouldShowLoading ? (
          <div className="text-center py-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              Loading Documents
            </h3>
            <p className="text-muted-foreground">
              Please wait while we fetch the documents...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-600">
              Error Loading Documents
            </h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error
                ? error.message
                : "An error occurred while loading documents"}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              No Documents
            </h3>
            <p className="text-muted-foreground">
              No documents have been uploaded for this profile yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <ScrollArea className="h-60">
              {Object.entries(grouped).map(([documentType, docs]) => (
                <div key={documentType}>
                  <div className="space-y-2">
                    {docs.map((document) => (
                      <div
                        key={`${document.source}-${document.id}`}
                        className="flex items-center justify-between p-3 border rounded-lg my-2"
                      >
                        <div className="flex items-center gap-3">
                          {/* {getDocumentIcon(document.document_type)} */}
                          <div>
                            <p className="text-sm font-medium">
                              {DOCUMENT_TYPE_LABELS[document.document_type]}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Uploaded {formatDate(document.created_at)}
                              <Badge variant="outline">
                                {document.source === "profile"
                                  ? "Profile"
                                  : "Application"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              DOCUMENT_TYPE_COLORS[document.document_type]
                            }
                          >
                            {DOCUMENT_TYPE_LABELS[document.document_type]}
                          </Badge>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePreview(document)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(document)}
                            disabled={
                              isDownloading ===
                              `${document.source}-${document.id}`
                            }
                            title="Download"
                          >
                            {isDownloading ===
                            `${document.source}-${document.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <ScrollBar
                forceMount={true}
                className="rounded"
                orientation="vertical"
              />
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
