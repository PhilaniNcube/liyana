"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicationStep } from "@/components/application-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Mail,
  Loader2,
  ArrowRight,
  XCircleIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}

export function DocumentCompletionModal({
  isOpen,
  onClose,
  applicationId,
}: DocumentCompletionModalProps) {
  const router = useRouter();
  const { onStepChange } = useApplicationStep();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteApplication = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete application");
      }

      setIsCompleted(true);

      // Update the application step to complete
      onStepChange("complete");

      // Redirect to profile page after a short delay to show success message
      setTimeout(() => {
        router.push("/profile");
      }, 3000);
    } catch (err) {
      console.error("Error completing application:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => {
    setIsCompleted(false);
    setError(null);
    setIsSubmitting(false); // Reset submitting state
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            All Documents Uploaded!
          </DialogTitle>
          <DialogDescription>
            Congratulations! You have successfully uploaded all required
            documents for your loan application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Message */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Your documents have been securely uploaded and are ready for
              review by our team.
            </AlertDescription>
          </Alert>
          {/* What happens next */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">What happens next?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                Your application status will be updated to "Under Review"
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                You'll receive an email confirmation with next steps
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                Our team will review your documents within 24-48 hours
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                You'll be notified of the decision via email
              </li>
            </ul>
          </div>
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}{" "}
          {/* Success Message after completion */}
          {isCompleted && (
            <Alert className="border-green-200 bg-green-50">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Application completed successfully! Check your email for
                confirmation details. Redirecting to your profile...
              </AlertDescription>
            </Alert>
          )}
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {!isCompleted ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleCompleteApplication}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Complete Application
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleClose} className="w-full">
                <XCircleIcon className="mr-2 h-4 w-4" />
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
