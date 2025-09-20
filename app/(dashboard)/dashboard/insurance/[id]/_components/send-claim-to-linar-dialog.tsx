"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { sendClaimDetailsEmail } from "@/lib/actions/claims";
import type { Database } from "@/lib/database.types";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

interface SendClaimToLinarDialogProps {
  claimId: number;
  claimNumber: string;
  claimantName: string;
  policyId: number;
  documents: PolicyDocumentRow[];
  children?: React.ReactNode;
}

export function SendClaimToLinarDialog({
  claimId,
  claimNumber,
  claimantName,
  policyId,
  documents,
  children,
}: SendClaimToLinarDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [customSubject, setCustomSubject] = useState(
    `Insurance Claim Details - Claim #${claimNumber}`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Filter documents related to this claim or policy
  const relevantDocuments = documents.filter(
    (doc) => doc.claim_id === claimId || doc.policy_id === policyId
  );

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} - File too large (max 10MB)`);
      } else if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        invalidFiles.push(`${file.name} - Unsupported file type`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files: ${invalidFiles.join(", ")}`);
    }

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) added successfully`);
    }

    // Reset the input
    event.target.value = "";
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleDocumentToggle = (documentId: number, checked: boolean) => {
    if (checked) {
      setSelectedDocuments((prev) => [...prev, documentId]);
    } else {
      setSelectedDocuments((prev) => prev.filter((id) => id !== documentId));
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    setSuccess(false);

    try {
      // Prepare attachments from selected documents
      const attachments: Array<{
        filename: string;
        content: string; // Changed from 'data' to 'content' for Resend compatibility
        content_type?: string;
      }> = [];

      // Fetch selected documents and convert to base64 attachments
      if (selectedDocuments.length > 0) {
        try {
          const response = await fetch("/api/documents/attachments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ documentIds: selectedDocuments }),
          });

          if (response.ok) {
            const { attachments: documentAttachments } = await response.json();
            // Only add attachments that have valid content
            const validAttachments = documentAttachments.filter(
              (att: any) => att.content && att.content.length > 0 // Changed from 'data' to 'content'
            );
            attachments.push(...validAttachments);
          } else {
            throw new Error("Failed to fetch document attachments");
          }
        } catch (error) {
          console.error("Error preparing document attachments:", error);
          toast.error(
            "Failed to prepare document attachments. Sending email without database attachments."
          );
        }
      }

      // Process uploaded files and add to attachments
      if (uploadedFiles.length > 0) {
        try {
          for (const file of uploadedFiles) {
            const base64Content = await convertFileToBase64(file);
            attachments.push({
              filename: file.name,
              content: base64Content,
              content_type: file.type,
            });
          }
        } catch (error) {
          console.error("Error processing uploaded files:", error);
          toast.error(
            "Failed to process uploaded files. Sending email without uploaded attachments."
          );
        }
      }

      const result = await sendClaimDetailsEmail(
        claimId,
        attachments.length > 0 ? attachments : undefined,
        customSubject.trim() || undefined
      );

      if (result.error) {
        toast.error(result.message || "Failed to send email");
      } else {
        toast.success("Claim details sent to Linar successfully!");
        setSuccess(true);

        // Close dialog after short delay
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setSelectedDocuments([]);
          setUploadedFiles([]);
          setCustomMessage("");
          setCustomSubject(`Insurance Claim Details - Claim #${claimNumber}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Send To Linar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Claim to Linar</DialogTitle>
          <DialogDescription>
            Send claim details for {claimantName} (Claim #{claimNumber}) to the
            Linar email address. You can optionally attach related documents.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Custom Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Enter custom email subject..."
            />
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any additional notes or context for Linar about this claim..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Document Selection */}
          {relevantDocuments.length > 0 && (
            <div className="space-y-3">
              <Label>Attach Documents (Optional)</Label>
              <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                {relevantDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center space-x-3 py-2"
                  >
                    <Checkbox
                      id={`doc-${doc.id}`}
                      checked={selectedDocuments.includes(doc.id)}
                      onCheckedChange={(checked) =>
                        handleDocumentToggle(doc.id, checked as boolean)
                      }
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <Label
                        htmlFor={`doc-${doc.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {doc.document_type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {doc.claim_id === claimId ? "(Claim)" : "(Policy)"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {selectedDocuments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedDocuments.length} document(s) selected for
                    attachment
                  </p>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {selectedDocuments.length} document(s) will be attached to
                      the email sent to Linar.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {/* File Upload Section */}
          <div className="space-y-3">
            <Label>Upload Additional Files (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload files or drag and drop
              </p>
              <p className="text-xs text-gray-500 mb-4">
                PDF, Word, JPG, PNG up to 10MB each
              </p>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <Label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Label>
            </div>

            {/* Display uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Files:</p>
                <div className="border rounded-lg p-3 space-y-2 max-h-[150px] overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadedFile(index)}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {uploadedFiles.length} uploaded file(s) will be attached to
                    the email.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* No Documents Available */}
          {relevantDocuments.length === 0 && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No documents are available for this claim or its related policy.
                You can still upload additional files or send only claim
                details.
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email sent successfully! The dialog will close automatically.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading || success}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sent!
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to Linar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
