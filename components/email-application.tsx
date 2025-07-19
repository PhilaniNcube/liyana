"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  selectedReportId: z.string().optional(), // ID of the selected credit report
});

type EmailFormData = z.infer<typeof emailSchema>;

interface CreditReport {
  id: string;
  check_type: string;
  status: string;
  created_at: string;
  report_data?: any;
}

interface EmailApplicationProps {
  applicationId: string;
  creditReports: CreditReport[];
}

export function EmailApplication({
  applicationId,
  creditReports,
}: EmailApplicationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: "",
      message: "",
      selectedReportId: "",
    },
  });

  const handleSubmit = async (data: EmailFormData) => {
    try {
      setIsLoading(true);

      // Find the selected credit report and get its base64 data
      let attachmentData: string | undefined;
      if (data.selectedReportId && data.selectedReportId !== "") {
        const selectedReport = creditReports.find(
          (report) => report.id === data.selectedReportId
        );
        if (selectedReport && selectedReport.report_data?.pRetData) {
          attachmentData = selectedReport.report_data.pRetData;
        }
      }

      const response = await fetch("/api/emails/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: parseInt(applicationId),
          message: data.message,
          subject: data.subject,
          attachmentData: attachmentData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email");
      }

      setIsSuccess(true);
      toast.success("Email sent successfully!");
      form.reset();

      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!applicationId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Application ID is required to send emails.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to Applicant
          </CardTitle>
          <CardDescription>
            Send a message to the loan applicant via email. Optionally attach
            their credit report file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email has been sent successfully to the applicant!
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
                        placeholder="Enter your message to the applicant"
                        className="min-h-[120px]"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Credit Report Attachment Option */}
              {creditReports.length > 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="selectedReportId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Attach Credit Report File (Optional)
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a credit report to attach" />
                            </SelectTrigger>
                            <SelectContent>
                              {creditReports.map((report, index) => (
                                <SelectItem key={report.id} value={report.id}>
                                  Credit Report #{index + 1} -{" "}
                                  {new Date(
                                    report.created_at
                                  ).toLocaleDateString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Credit Report Status */}
                  <div className="space-y-2">
                    <p className="text-sm text-green-600 font-medium">
                      ✓ {creditReports.length} credit report file
                      {creditReports.length > 1 ? "s" : ""} available
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {creditReports.map((report, index) => {
                        const isSelected =
                          form.watch("selectedReportId") === report.id;
                        return (
                          <div
                            key={report.id}
                            className={`flex items-center gap-2 ${
                              isSelected ? "font-medium text-blue-600" : ""
                            }`}
                          >
                            <FileText
                              className={`h-3 w-3 ${isSelected ? "text-blue-600" : ""}`}
                            />
                            Credit Report File #{index + 1} -{" "}
                            {new Date(report.created_at).toLocaleDateString()}
                            {isSelected && " (Selected)"}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
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
