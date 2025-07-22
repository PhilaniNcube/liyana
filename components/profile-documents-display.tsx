"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { Database } from "@/lib/types";

type ProfileDocument = Database["public"]["Tables"]["profile_documents"]["Row"];
type DocumentType = Database["public"]["Enums"]["document_type"];

interface ProfileDocumentsDisplayProps {
  profileId: string;
  documents?: ProfileDocument[];
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
};

export function ProfileDocumentsDisplay({
  profileId,
  documents: initialDocuments,
  onRefresh,
  className,
}: ProfileDocumentsDisplayProps) {
  const [documents, setDocuments] = useState<ProfileDocument[]>(
    initialDocuments || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/profile-documents?profileId=${profileId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const result = await response.json();
      setDocuments(result.documents);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDownload = async (doc: ProfileDocument) => {
    setIsDownloading(doc.id.toString());
    try {
      // Get signed URL for download
      const response = await fetch(
        `/api/documents/download?path=${encodeURIComponent(doc.path)}`
      );
      if (!response.ok) {
        throw new Error("Failed to get download URL");
      }

      const result = await response.json();

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = result.signedUrl;
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

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const groupedDocuments = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.document_type]) {
        acc[doc.document_type] = [];
      }
      acc[doc.document_type].push(doc);
      return acc;
    },
    {} as Record<DocumentType, ProfileDocument[]>
  );

  useEffect(() => {
    if (!initialDocuments) {
      fetchDocuments();
    }
  }, [profileId, initialDocuments]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Profile Documents ({documents.length})
            </CardTitle>
            <CardDescription>
              Documents uploaded for this profile
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
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
            {Object.entries(groupedDocuments).map(([documentType, docs]) => (
              <div key={documentType}>
                <div className="flex items-center gap-2 mb-3">
                  {getDocumentIcon(documentType as DocumentType)}
                  <h4 className="font-medium">
                    {DOCUMENT_TYPE_LABELS[documentType as DocumentType]}
                  </h4>
                  <Badge variant="secondary">{docs.length}</Badge>
                </div>
                <div className="space-y-2">
                  {docs.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getDocumentIcon(document.document_type)}
                        <div>
                          <p className="text-sm font-medium">
                            {DOCUMENT_TYPE_LABELS[document.document_type]}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Uploaded {formatDate(document.created_at)}
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          disabled={isDownloading === document.id.toString()}
                        >
                          {isDownloading === document.id.toString() ? (
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
