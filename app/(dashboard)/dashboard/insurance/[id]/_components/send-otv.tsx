"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";

export default function SendOtvDialog({
  policyId,
  decryptedIdNumber,
  cellNumber,
}: {
  policyId: number;
  decryptedIdNumber: string;
  cellNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtv = async () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/insurance/otv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policy_id: policyId,
            decrypted_id_number: decryptedIdNumber,
            cell_number: cellNumber,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send OTV link");
        setResult(data.message || "Verification link sent successfully");
      } catch (e: any) {
        setError(e.message || "Unknown error");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 flex items-center gap-1"
        >
          <Send className="w-4 h-4" /> Send OTV Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Send OTV Verification Link
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            Send a selfie verification link to the policy holder's phone number
            using the WhoYou OTV service.
          </div>
          {error && <div className="text-red-600">{error}</div>}
          {result && <div className="text-green-700">{result}</div>}
          <Button
            onClick={handleSendOtv}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Sending..." : "Send Verification Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
