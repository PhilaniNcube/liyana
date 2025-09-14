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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Send,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { sendFuneralPolicyDetailsEmail } from "@/lib/actions/funeral-policy";
import type { Database } from "@/lib/database.types";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];

interface SendToLinarDialogProps {
  policyId: number;
  policyHolderName: string;
  documents: PolicyDocumentRow[];
}

export function SendToLinarDialog({
  policyId,
  policyHolderName,
  documents,
}: SendToLinarDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
            console.log(
              "Received attachments from API:",
              documentAttachments?.length || 0
            );

            if (documentAttachments && documentAttachments.length > 0) {
              // Validate that attachments have valid content
              const validAttachments = documentAttachments.filter(
                (att: any) => att.content && att.content.length > 0 // Changed from 'data' to 'content'
              );
              console.log(
                "Valid attachments after filtering:",
                validAttachments.length
              );

              if (validAttachments.length > 0) {
                attachments.push(...validAttachments);
              } else {
                console.warn(
                  "No valid attachments found - all had empty content"
                );
                toast.error(
                  "Documents could not be processed for attachment. Sending email without attachments."
                );
              }
            } else {
              console.warn("No attachments returned from API");
              toast.error(
                "No valid documents found for attachment. Sending email without attachments."
              );
            }
          } else {
            throw new Error("Failed to fetch document attachments");
          }
        } catch (error) {
          console.error("Error preparing document attachments:", error);
          toast.error(
            "Failed to prepare document attachments. Sending email without attachments."
          );
        }
      }

      const result = await sendFuneralPolicyDetailsEmail(
        policyId,
        attachments.length > 0 ? attachments : undefined
      );

      if (result.error) {
        toast.error(result.message || "Failed to send email");
      } else {
        toast.success("Policy details sent to Linar successfully!");
        setSuccess(true);

        // Close dialog after short delay
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setSelectedDocuments([]);
          setCustomMessage("");
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
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Send To Linar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[500px] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Send Policy to Linar</DialogTitle>
          <DialogDescription className="text-xs">
            Send policy details for {policyHolderName} (Policy #{policyId}) to
            the Linar email address. You can optionally attach policy documents.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          {/* Email Content Preview */}
          <div className="space-y-2">
            <Label>Email Content</Label>
            <div className="border rounded-lg p-2 bg-gray-50 text-sm">
              <p className="font-medium">The email will include:</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>• Complete policy details and coverage information</li>
                <li>• Policy holder personal and contact information</li>
                <li>• Employment and banking details</li>
                <li>• Covered persons information</li>
                <li>• Policy dates and status</li>
              </ul>
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any additional notes or context for Linar..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Document Selection */}
          {documents.length > 0 && (
            <div className="space-y-3">
              <Label>Attach Documents (Optional)</Label>
              <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                {documents.map((doc) => (
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

          {/* No Documents Available */}
          {documents.length === 0 && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No documents are available for this policy. Only policy details
                will be sent.
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
