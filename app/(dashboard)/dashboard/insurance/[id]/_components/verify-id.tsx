"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IdCard, Clock, Shield, XCircle } from "lucide-react";
import React, { useState, useTransition } from "react";
import { WhoYouIdVerificationDetail } from "@/lib/schemas";
import { IdVerificationDisplay } from "@/components/id-verification-display";

const VerifyIdDialog = ({
  idNumber,
  profileId,
}: {
  idNumber: string;
  profileId: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const [verificationResult, setVerificationResult] =
    useState<WhoYouIdVerificationDetail | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  const handleIdVerification = async () => {
    try {
      setVerificationError(null);

      const request = await fetch("/api/insurance/id-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_number: idNumber,
          profile_id: profileId,
        }),
      });

      const response = await request.json();

      if (!request.ok) {
        throw new Error(response.error || "Failed to verify ID");
      }

      if (response.success && response.data) {
        setVerificationResult(response.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("ID Verification Error:", error);
      setVerificationError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  const handleRunNewVerification = () => {
    setVerificationResult(null);
    setVerificationError(null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-white text-black hover:bg-gray-100">
          <IdCard className="mr-2" />
          Verify ID
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <IdCard className="h-5 w-5 mr-2" />
            ID Verification
          </DialogTitle>
          <DialogDescription>
            Verify the ID number against official government records
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!verificationResult && !verificationError && (
            <div className="text-center py-4">
              <Button
                onClick={() => startTransition(handleIdVerification)}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Start Verification
                  </>
                )}
              </Button>
            </div>
          )}

          {verificationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-800 font-medium">Verification Failed</p>
              </div>
              <p className="text-red-600 text-sm mt-1">{verificationError}</p>
              <Button
                onClick={() => startTransition(handleIdVerification)}
                disabled={isPending}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Retry Verification
              </Button>
            </div>
          )}

          {verificationResult && (
            <IdVerificationDisplay
              verificationData={verificationResult}
              onRunNewVerification={handleRunNewVerification}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyIdDialog;
