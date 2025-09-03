"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Phone, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface CellphoneVerificationDialogProps {
  policyId: number;
  phone: string;
  idNumber?: string; // decrypted id (optional display)
}

export function CellphoneVerificationDialog({
  policyId,
  phone,
  idNumber,
}: CellphoneVerificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runVerification = async () => {
    setIsVerifying(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/kyc/policy/cellphone-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_id: policyId }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Cellphone verification failed");
      setResult(data.cellphoneVerificationInformation);
    } catch (e: any) {
      setError(e.message || "Cellphone verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Phone className="h-4 w-4" /> Verify
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" /> Cellphone Verification
          </DialogTitle>
          <DialogDescription>
            Verify the supplied cellphone number against the holder's ID.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm grid grid-cols-2 gap-2">
            <div className="text-muted-foreground">Cellphone</div>
            <div className="font-medium break-all">{phone}</div>
            {idNumber && (
              <>
                <div className="text-muted-foreground">ID Number</div>
                <div className="font-medium">{idNumber}</div>
              </>
            )}
          </div>

          {!result && !error && (
            <div className="py-4">
              <Button
                onClick={runVerification}
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" /> Start Verification
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-red-700">
                <XCircle className="h-4 w-4" /> Verification Failed
              </div>
              <p className="text-red-600 mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={runVerification}
                disabled={isVerifying}
              >
                Retry
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" /> Verification Complete
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Match Score</span>
                  <span className="font-medium">
                    {result?.kyc_status?.score ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">
                    {result?.kyc_status?.status ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-muted-foreground">Message</span>
                  <span className="font-medium">
                    {result?.kyc_status?.message ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">
                    {result?.kyc_status?.provider ?? "-"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={reset}
                >
                  Run New Verification
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
