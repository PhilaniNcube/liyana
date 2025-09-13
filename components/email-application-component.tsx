"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useEmailRefetch } from "@/components/email-refetch-context";

// Schema for email form
const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  selectedReportIds: z.array(z.string()).optional(),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface CreditReport {
  id: string;
  check_type: string;
  status: string;
  created_at: string;
  report_data?: any;
}

interface EmailApplicationComponentProps {
  id: number | string;
  creditReports: CreditReport[];
  type: "application" | "loan" | "policy";
  defaultSubject?: string;
  recipientName?: string;
  recipientEmail?: string;
}

export function EmailApplicationComponent({
  id,
  creditReports,
  type,
  defaultSubject,
  recipientName,
  recipientEmail,
}: EmailApplicationComponentProps) {
  const itemId = String(id);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [readingFiles, setReadingFiles] = useState(false);

  // Try to get the email refetch function if we're in the email context
  let refetchEmails: ((policyId: number) => void) | null = null;
  try {
    const { refetchEmails: contextRefetch } = useEmailRefetch();
    refetchEmails = contextRefetch;
  } catch {
    // Not in email refetch context, that's okay
  }

  // Set default subject based on type
  const getDefaultSubject = () => {
    if (defaultSubject) return defaultSubject;

    switch (type) {
      case "application":
        return `Update on your loan application #${itemId}`;
      case "loan":
        return `Update on your loan #${itemId}`;
      case "policy":
        return `Update on your policy #${itemId}`;
      default:
        return `Update on your request #${itemId}`;
    }
  };

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: getDefaultSubject(),
      message: "",
      selectedReportIds: [],
    },
  });

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes("base64,")
          ? result.split("base64,")[1]
          : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const toggleReport = useCallback(
    (reportId: string) => {
      setSelectedReportIds((prev) =>
        prev.includes(reportId)
          ? prev.filter((id) => id !== reportId)
          : [...prev, reportId]
      );
      const current = form.getValues("selectedReportIds") || [];
      form.setValue(
        "selectedReportIds",
        current.includes(reportId)
          ? current.filter((id) => id !== reportId)
          : [...current, reportId]
      );
    },
    [form]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (data: EmailFormData) => {
    try {
      setIsLoading(true);

      // Build attachments array
      const attachments: Array<{ filename: string; data: string }> = [];

      // Credit report attachments
      (data.selectedReportIds || []).forEach((rid, idx) => {
        const report = creditReports.find((r) => r.id === rid);
        if (report?.report_data?.pRetData) {
          attachments.push({
            filename: `credit-report-${idx + 1}.pdf`,
            data: report.report_data.pRetData,
          });
        }
      });

      // File attachments
      if (attachedFiles.length > 0) {
        setReadingFiles(true);
        for (const file of attachedFiles) {
          try {
            const base64 = await readFileAsBase64(file);
            attachments.push({ filename: file.name, data: base64 });
          } catch (err) {
            console.error("Failed to read file", file.name, err);
            toast.error(`Failed to read file: ${file.name}`);
          }
        }
        setReadingFiles(false);
      }

      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: parseInt(itemId),
          itemType: type,
          message: data.message,
          subject: data.subject,
          attachments,
          recipientEmail,
          recipientName,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send email");
      }

      setIsSuccess(true);
      toast.success("Email sent successfully!");
      form.reset();
      form.setValue("subject", getDefaultSubject());
      setSelectedReportIds([]);
      setAttachedFiles([]);
      setTimeout(() => setIsSuccess(false), 3000);

      // Trigger email refetch if we're in a policy context and have the refetch function
      if (refetchEmails && type === "policy") {
        refetchEmails(parseInt(itemId));
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!itemId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {type.charAt(0).toUpperCase() + type.slice(1)} ID is required to
            send emails.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getCardTitle = () => {
    switch (type) {
      case "application":
        return "Send Email to Applicant";
      case "loan":
        return "Send Email to Borrower";
      case "policy":
        return "Send Email to Policy Holder";
      default:
        return "Send Email";
    }
  };

  const getCardDescription = () => {
    switch (type) {
      case "application":
        return "Send a message to the loan applicant via email. Optionally attach credit reports and other files.";
      case "loan":
        return "Send a message to the borrower via email. Optionally attach documents and files.";
      case "policy":
        return "Send a message to the policy holder via email. Optionally attach documents and files.";
      default:
        return "Send a message via email with optional attachments.";
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {getCardTitle()}
          </CardTitle>
          <CardDescription>
            {getCardDescription()}
            {recipientEmail && (
              <span className="block mt-1 text-sm text-muted-foreground">
                Recipient: {recipientName || recipientEmail} ({recipientEmail})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email has been sent successfully!
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Subject</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter email subject"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={`Enter your message to the ${type === "policy" ? "policy holder" : type === "loan" ? "borrower" : "applicant"}`}
                        className="min-h-[120px]"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit Report Multi-Select & File Attachments */}
              <div className="space-y-6">
                {creditReports.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Select Credit Reports to
                      Attach
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {creditReports.map((report, index) => {
                        const selected = selectedReportIds.includes(report.id);
                        return (
                          <Button
                            key={report.id}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            disabled={isLoading}
                            onClick={() => toggleReport(report.id)}
                            className={selected ? "border-blue-600" : ""}
                          >
                            {selected ? "✓ " : ""}
                            {report.check_type
                              ? report.check_type === "fraud_check"
                                ? "Credit Report"
                                : report.check_type
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (c) => c.toUpperCase())
                              : `Report #${index + 1}`}
                            {" – "}
                            {new Date(report.created_at).toLocaleDateString()}
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedReportIds.length} of {creditReports.length}{" "}
                      selected
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Attach Additional Files
                  </p>
                  <Input
                    type="file"
                    multiple
                    disabled={isLoading}
                    onChange={handleFileChange}
                  />
                  {attachedFiles.length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-1">
                      {attachedFiles.map((f) => (
                        <li key={f.name}>
                          {f.name} ({(f.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  )}
                  {readingFiles && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Preparing
                      attachments...
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || readingFiles}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
