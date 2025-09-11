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

// Schema for email form
const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailUserComponentProps {
  profileId: string;
  recipientName?: string;
  recipientEmail?: string;
  defaultSubject?: string;
}

export function EmailUserComponent({
  profileId,
  recipientName,
  recipientEmail,
  defaultSubject,
}: EmailUserComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [readingFiles, setReadingFiles] = useState(false);

  // Set default subject
  const getDefaultSubject = () => {
    if (defaultSubject) return defaultSubject;
    return `Message from Liyana Finance`;
  };

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: getDefaultSubject(),
      message: "",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (data: EmailFormData) => {
    try {
      setIsLoading(true);

      // Validate required recipient information
      if (!recipientEmail || !recipientName) {
        throw new Error("Recipient email and name are required");
      }

      // Build attachments array
      const attachments: Array<{ filename: string; data: string }> = [];

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

      const response = await fetch("/api/emails/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
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
      setAttachedFiles([]);
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

  if (!profileId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Profile ID is required to send emails.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!recipientEmail || !recipientName) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Recipient email and name are required to send emails.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to User
          </CardTitle>
          <CardDescription>
            Send a message to the user via email. Optionally attach files.
            <span className="block mt-1 text-sm text-muted-foreground">
              Recipient: {recipientName} ({recipientEmail})
            </span>
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
                        placeholder="Enter your message to the user"
                        className="min-h-[120px]"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Attachments */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Attach Files
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
