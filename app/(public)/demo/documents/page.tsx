import { DocumentUploadForm } from "@/components/document-upload-form";
import { getDocumentsByApplication } from "@/lib/queries/documents";

export default async function DocumentsDemo() {
  // Demo with empty documents array to show all upload sections
  const documents: any[] = [];
  const demoApplicationId = "12345"; // Demo application ID

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Document Upload Demo</h1>
            <p className="text-muted-foreground">
              Demo of the 4 required document upload inputs
            </p>
          </div>

          {/* Document Upload Form */}
          <DocumentUploadForm
            applicationId={demoApplicationId}
            documents={documents}
          />

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Each document type has its own upload section</li>
              <li>• Drag and drop files or click to browse</li>
              <li>• Files are validated for type and size before upload</li>
              <li>
                • Uses the uploadDocument server action to save to database
              </li>
              <li>• Progress tracking shows completion status</li>
              <li>
                • Supports: ID, Bank Statement, Payslip, Proof of Residence
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
