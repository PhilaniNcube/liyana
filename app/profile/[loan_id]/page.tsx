import { getApplicationDocuments } from "@/lib/queries/documents";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface DocumentsPageProps {
  params: Promise<{ loan_id: string }>;
}

interface UploadedDocument {
  id: number;
  application_id: number;
  user_id: string;
  document_type: string;
  storage_path: string;
  uploaded_at: string;
}

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { loan_id } = await params;

  const documents = await getApplicationDocuments(loan_id);

  if (documents === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">No documents found</h1>
        <p className="text-muted-foreground">
          It seems there are no documents uploaded for this application.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Navigation Header */}
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">
                Upload Required Documents
              </h1>
              <p className="text-muted-foreground">
                Complete your loan application by uploading the required
                documents
              </p>
            </div>
          </div>

          {/* Document Upload Section */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>
                Please upload all required documents to complete your loan
                application. All documents must be clear, legible, and in PDF,
                JPEG, or PNG format.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploadForm
                applicationId={loan_id}
                documents={documents}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
