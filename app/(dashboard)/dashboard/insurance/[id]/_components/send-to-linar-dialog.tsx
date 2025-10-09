"use client";

import { useState, useRef } from "react";
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
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { sendFuneralPolicyDetailsEmail } from "@/lib/actions/funeral-policy";
import type { Database } from "@/lib/types";

type PolicyDocumentRow =
  Database["public"]["Tables"]["policy_documents"]["Row"];
type ApplicationDocumentRow = Database["public"]["Tables"]["documents"]["Row"];

interface UploadedFile {
  file: File;
  name: string;
  size: number;
  type: string;
  content?: string; // base64 content for email attachment
}

interface SendToLinarDialogProps {
  policyId: number;
  policyHolderName: string;
  policyDocuments: PolicyDocumentRow[];
  applicationDocuments?: ApplicationDocumentRow[];
}

export function SendToLinarDialog({
  policyId,
  policyHolderName,
  policyDocuments,
  applicationDocuments = [],
}: SendToLinarDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPolicyDocuments, setSelectedPolicyDocuments] = useState<
    number[]
  >([]);
  const [selectedApplicationDocuments, setSelectedApplicationDocuments] =
    useState<number[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 content
        const base64Content = result.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `File "${file.name}" is not a supported format. Please upload PDF, Word, or image files.`
        );
        continue;
      }

      // Check for duplicates
      if (
        uploadedFiles.some((existingFile) => existingFile.name === file.name)
      ) {
        toast.error(`File "${file.name}" is already added.`);
        continue;
      }

      try {
        const base64Content = await convertFileToBase64(file);
        newFiles.push({
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          content: base64Content,
        });
      } catch (error) {
        console.error("Error converting file to base64:", error);
        toast.error(`Failed to process file "${file.name}".`);
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added successfully.`);
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveUploadedFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== fileName));
    toast.success("File removed successfully.");
  };

  const handlePolicyDocumentToggle = (documentId: number, checked: boolean) => {
    if (checked) {
      setSelectedPolicyDocuments((prev) => [...prev, documentId]);
    } else {
      setSelectedPolicyDocuments((prev) =>
        prev.filter((id) => id !== documentId)
      );
    }
  };

  const handleApplicationDocumentToggle = (
    documentId: number,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedApplicationDocuments((prev) => [...prev, documentId]);
    } else {
      setSelectedApplicationDocuments((prev) =>
        prev.filter((id) => id !== documentId)
      );
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    setSuccess(false);

    try {
      // Prepare attachments from selected documents and uploaded files
      const attachments: Array<{
        filename: string;
        content: string; // Changed from 'data' to 'content' for Resend compatibility
        content_type?: string;
      }> = [];

      // Add uploaded files first (already converted to base64)
      uploadedFiles.forEach((uploadedFile) => {
        if (uploadedFile.content) {
          attachments.push({
            filename: uploadedFile.name,
            content: uploadedFile.content,
            content_type: uploadedFile.type,
          });
        }
      });

      // Combine all selected document IDs
      const allSelectedDocumentIds = [
        ...selectedPolicyDocuments,
        ...selectedApplicationDocuments,
      ];

      // Fetch selected documents and convert to base64 attachments
      if (allSelectedDocumentIds.length > 0) {
        try {
          const response = await fetch("/api/documents/attachments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              policyDocumentIds: selectedPolicyDocuments,
              applicationDocumentIds: selectedApplicationDocuments,
            }),
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
                  "Documents could not be processed for attachment. Sending email with uploaded files only."
                );
              }
            } else {
              console.warn("No attachments returned from API");
              if (uploadedFiles.length === 0) {
                toast.error(
                  "No valid documents found for attachment. Sending email without attachments."
                );
              }
            }
          } else {
            throw new Error("Failed to fetch document attachments");
          }
        } catch (error) {
          console.error("Error preparing document attachments:", error);
          if (uploadedFiles.length > 0) {
            toast.error(
              "Failed to prepare stored documents. Sending email with uploaded files only."
            );
          } else {
            toast.error(
              "Failed to prepare document attachments. Sending email without attachments."
            );
          }
        }
      }

      console.log("Total attachments prepared:", attachments.length);

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
          setSelectedPolicyDocuments([]);
          setSelectedApplicationDocuments([]);
          setUploadedFiles([]);
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
          {(policyDocuments.length > 0 ||
            applicationDocuments.length > 0 ||
            uploadedFiles.length > 0) && (
            <div className="space-y-3">
              <Label>Attach Documents (Optional)</Label>

              {/* Policy Documents Section */}
              {policyDocuments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Policy Documents
                  </Label>
                  <div className="border rounded-lg p-4 max-h-[150px] overflow-y-auto">
                    {policyDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center space-x-3 py-2"
                      >
                        <Checkbox
                          id={`policy-doc-${doc.id}`}
                          checked={selectedPolicyDocuments.includes(doc.id)}
                          onCheckedChange={(checked) =>
                            handlePolicyDocumentToggle(
                              doc.id,
                              checked as boolean
                            )
                          }
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <Label
                            htmlFor={`policy-doc-${doc.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {doc.document_type
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Documents Section */}
              {applicationDocuments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Application Documents
                  </Label>
                  <div className="border rounded-lg p-4 max-h-[150px] overflow-y-auto">
                    {applicationDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center space-x-3 py-2"
                      >
                        <Checkbox
                          id={`app-doc-${doc.id}`}
                          checked={selectedApplicationDocuments.includes(
                            doc.id
                          )}
                          onCheckedChange={(checked) =>
                            handleApplicationDocumentToggle(
                              doc.id,
                              checked as boolean
                            )
                          }
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <FileText className="h-4 w-4 text-green-500" />
                          <Label
                            htmlFor={`app-doc-${doc.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {doc.document_type
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload from Device Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Upload from Device
                </Label>
                <div className="border rounded-lg p-4">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Choose Files</span>
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        PDF, Word, or Image files (max 10MB each)
                      </span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2 max-h-[120px] overflow-y-auto">
                        {uploadedFiles.map((uploadedFile, index) => (
                          <div
                            key={`${uploadedFile.name}-${index}`}
                            className="flex items-center space-x-3 py-2 px-2 bg-gray-50 rounded border"
                          >
                            <div className="flex items-center space-x-2 flex-1">
                              <FileText className="h-4 w-4 text-purple-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {uploadedFile.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(uploadedFile.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveUploadedFile(uploadedFile.name)
                              }
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Documents Summary */}
              {(selectedPolicyDocuments.length > 0 ||
                selectedApplicationDocuments.length > 0 ||
                uploadedFiles.length > 0) && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {selectedPolicyDocuments.length +
                      selectedApplicationDocuments.length +
                      uploadedFiles.length}{" "}
                    document(s) selected for attachment
                  </p>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {selectedPolicyDocuments.length +
                        selectedApplicationDocuments.length +
                        uploadedFiles.length}{" "}
                      document(s) will be attached to the email sent to Linar.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {/* No Documents Available */}
          {policyDocuments.length === 0 &&
            applicationDocuments.length === 0 &&
            uploadedFiles.length === 0 && (
              <div className="space-y-3">
                <Label>Attach Documents (Optional)</Label>

                {/* Upload from Device Section for when no other docs exist */}
                <div className="space-y-2">
                  <div className="border rounded-lg p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center space-x-2"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Choose Files</span>
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          PDF, Word, or Image files (max 10MB each)
                        </span>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    No policy or application documents are available. You can
                    upload files from your device to attach to the email.
                  </AlertDescription>
                </Alert>
              </div>
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
