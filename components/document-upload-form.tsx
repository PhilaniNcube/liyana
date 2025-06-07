"use client";

import {
  DOCUMENT_TYPES,
  DocumentUploadState,
  type DocumentType,
} from "@/lib/queries/documents";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  File,
  CheckCircle,
  X,
  AlertCircle,
  FileText,
  CreditCard,
  Receipt,
  Home,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type DocumentUploadFormProps = {
  applicationId: string;
  documents: Database["public"]["Tables"]["documents"]["Row"][];
  className?: string;
};

export function DocumentUploadForm({
  applicationId,
  documents,
  className,
}: DocumentUploadFormProps) {
  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle className="text-2xl">
                Upload Required Documents
              </CardTitle>
              <CardDescription>
                Please upload the following documents to complete your loan
                application
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Requirements List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Required Documents</h3>
          </div>
          {/* Upload Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload New Document</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
